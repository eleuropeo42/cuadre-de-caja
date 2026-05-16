/* GitHub sync — read/write data.json in the user's repo via the Contents API.
 *
 * Storage:
 *   - PAT, repo (owner/name), branch, path stored in localStorage (key: `cargo-cuadre-github-v1`).
 *   - PAT never leaves the browser; calls go directly to api.github.com from the client.
 *
 * Flow:
 *   - On boot, if configured, pull data.json and merge by last-write-wins per day/extra.
 *   - On every change, debounce 4s, then PUT data.json back with the latest SHA.
 *   - On 409 (sha conflict), pull fresh, merge, and retry once.
 */

const GH_KEY = 'cargo-cuadre-github-v1';
const GH_DATA_PATH_DEFAULT = 'data/cuadre.json';
const GH_BRANCH_DEFAULT = 'main';

const ghLoadConfig = () => {
  try { return JSON.parse(localStorage.getItem(GH_KEY) || '{}'); }
  catch { return {}; }
};
const ghSaveConfig = (cfg) => {
  try { localStorage.setItem(GH_KEY, JSON.stringify(cfg)); } catch {}
};
const ghClearConfig = () => { try { localStorage.removeItem(GH_KEY); } catch {} };

const ghConfigured = (cfg) => !!(cfg && cfg.token && cfg.owner && cfg.repo);

// Base64 helpers that handle UTF-8 properly
const b64encode = (str) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const b64decode = (b64) => {
  const bin = atob(b64.replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

async function ghFetch(cfg, path, init = {}) {
  const url = `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers || {}),
    },
  });
  return res;
}

async function ghGetFile(cfg) {
  const branch = cfg.branch || GH_BRANCH_DEFAULT;
  const path = cfg.dataPath || GH_DATA_PATH_DEFAULT;
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`);
  if (res.status === 404) return { exists: false };
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub GET falló (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  let parsed = null;
  try { parsed = JSON.parse(b64decode(json.content)); } catch (e) {
    throw new Error('data.json del repo no es JSON válido.');
  }
  return { exists: true, sha: json.sha, data: parsed };
}

async function ghPutFile(cfg, data, prevSha, message) {
  const branch = cfg.branch || GH_BRANCH_DEFAULT;
  const path = cfg.dataPath || GH_DATA_PATH_DEFAULT;
  const body = {
    message: message || `Cuadre · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    content: b64encode(JSON.stringify(data, null, 2)),
    branch,
  };
  if (prevSha) body.sha = prevSha;
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 409 || res.status === 422) {
    const err = new Error('sha_conflict');
    err.code = 'sha_conflict';
    throw err;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub PUT falló (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.content.sha;
}

async function ghTestConnection(cfg) {
  // Light check: get repo info.
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}`);
  if (res.status === 401) throw new Error('Token inválido o sin permisos.');
  if (res.status === 404) throw new Error('Repo no encontrado o token sin acceso.');
  if (!res.ok) throw new Error(`No se pudo conectar (${res.status}).`);
  return await res.json();
}

// === Merge logic: last-write-wins per day, union for extras by id ===
function mergeData(local, remote) {
  if (!remote) return local;
  if (!local) return remote;
  const days = { ...remote.days, ...local.days }; // local wins for overlapping keys
  // For days present in both, pick the one with the latest mtime if available
  for (const k of Object.keys(days)) {
    const l = local.days?.[k];
    const r = remote.days?.[k];
    if (l && r) {
      const lm = l._mtime || 0;
      const rm = r._mtime || 0;
      days[k] = rm > lm ? r : l;
    }
  }
  // Extras: union by id within each ym
  const extrasMes = { ...(remote.extrasMes || {}) };
  for (const ym of Object.keys(local.extrasMes || {})) {
    const lArr = local.extrasMes[ym] || [];
    const rArr = extrasMes[ym] || [];
    const byId = new Map();
    for (const e of rArr) byId.set(e.id, e);
    for (const e of lArr) byId.set(e.id, e); // local wins on id collision
    extrasMes[ym] = Array.from(byId.values()).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  }
  return {
    schemaVersion: Math.max(local.schemaVersion || 1, remote.schemaVersion || 1),
    days,
    extrasMes,
  };
}

// === Sync engine (singleton per page) ===
function createSyncEngine({ getData, setData, onStatus }) {
  let cfg = ghLoadConfig();
  let lastSha = null;
  let timer = null;
  let inFlight = false;
  let lastPushedJSON = null;
  let status = { state: 'idle', detail: '' }; // idle | pulling | pushing | error | offline | unconfigured

  const setStatus = (s) => { status = { ...status, ...s }; onStatus?.(status); };

  const isConfigured = () => ghConfigured(cfg);

  const setConfig = async (newCfg) => {
    cfg = { ...cfg, ...newCfg };
    ghSaveConfig(cfg);
    lastSha = null;
    if (isConfigured()) await pull();
  };

  const disconnect = () => {
    cfg = {};
    lastSha = null;
    ghClearConfig();
    setStatus({ state: 'unconfigured', detail: '' });
  };

  const getConfig = () => cfg;

  const pull = async () => {
    if (!isConfigured()) { setStatus({ state: 'unconfigured', detail: '' }); return; }
    setStatus({ state: 'pulling', detail: 'Leyendo del repo…' });
    try {
      const got = await ghGetFile(cfg);
      if (got.exists) {
        lastSha = got.sha;
        const local = getData();
        const merged = mergeData(local, got.data);
        setData(merged);
        lastPushedJSON = JSON.stringify(got.data);
        setStatus({ state: 'idle', detail: `Sincronizado · ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` });
      } else {
        // No file yet; push current state to create it
        setStatus({ state: 'pushing', detail: 'Creando data.json…' });
        const data = getData();
        lastSha = await ghPutFile(cfg, data, null, 'Init data.json');
        lastPushedJSON = JSON.stringify(data);
        setStatus({ state: 'idle', detail: 'data.json creado en el repo.' });
      }
    } catch (e) {
      setStatus({ state: 'error', detail: e.message });
    }
  };

  const push = async () => {
    if (!isConfigured()) return;
    if (inFlight) return;
    const data = getData();
    const serialized = JSON.stringify(data);
    if (serialized === lastPushedJSON) { setStatus({ state: 'idle', detail: status.detail || 'Sin cambios.' }); return; }
    inFlight = true;
    setStatus({ state: 'pushing', detail: 'Guardando en el repo…' });
    try {
      lastSha = await ghPutFile(cfg, data, lastSha);
      lastPushedJSON = serialized;
      setStatus({ state: 'idle', detail: `Guardado · ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` });
    } catch (e) {
      if (e.code === 'sha_conflict') {
        // Pull fresh, merge, retry once
        try {
          const got = await ghGetFile(cfg);
          if (got.exists) {
            lastSha = got.sha;
            const local = getData();
            const merged = mergeData(local, got.data);
            setData(merged);
            lastSha = await ghPutFile(cfg, merged, lastSha);
            lastPushedJSON = JSON.stringify(merged);
            setStatus({ state: 'idle', detail: 'Conflicto resuelto · combinado y guardado.' });
          }
        } catch (e2) {
          setStatus({ state: 'error', detail: e2.message });
        }
      } else {
        setStatus({ state: 'error', detail: e.message });
      }
    } finally {
      inFlight = false;
    }
  };

  // Called by store after each change. Debounces.
  const schedulePush = () => {
    if (!isConfigured()) return;
    clearTimeout(timer);
    timer = setTimeout(push, 4000);
  };

  return { pull, push, schedulePush, setConfig, disconnect, getConfig, isConfigured, getStatus: () => status };
}

Object.assign(window, {
  ghLoadConfig, ghSaveConfig, ghClearConfig, ghConfigured,
  ghGetFile, ghPutFile, ghTestConnection,
  mergeData, createSyncEngine,
  GH_DATA_PATH_DEFAULT, GH_BRANCH_DEFAULT,
});
