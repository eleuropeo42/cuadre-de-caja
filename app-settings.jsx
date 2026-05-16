/* Ajustes — Conexión a GitHub para sincronizar la base de datos histórica */

const SyncBadge = ({ status, onClick }) => {
  const s = status?.state || 'idle';
  const color = {
    idle: W.accent,
    pulling: W.warn,
    pushing: W.warn,
    error: W.alarm,
    unconfigured: W.inkMute,
  }[s] || W.inkMute;
  const label = {
    idle: 'Sincronizado',
    pulling: 'Leyendo…',
    pushing: 'Guardando…',
    error: 'Error de sync',
    unconfigured: 'Sin conectar',
  }[s] || s;
  return (
    <a
      href="#ajustes"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      title={status?.detail || label}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 8px', borderRadius: 6,
        fontSize: 11, color: W.inkSoft, textDecoration: 'none',
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: color,
        boxShadow: s === 'pulling' || s === 'pushing' ? `0 0 6px ${color}` : 'none',
      }}/>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </a>
  );
};

const Ajustes = ({ store }) => {
  const cfg = store.sync.getConfig();
  const [token, setToken] = React.useState(cfg.token || '');
  const [repoUrl, setRepoUrl] = React.useState(
    cfg.owner && cfg.repo ? `${cfg.owner}/${cfg.repo}` : ''
  );
  const [branch, setBranch] = React.useState(cfg.branch || 'main');
  const [dataPath, setDataPath] = React.useState(cfg.dataPath || 'data/cuadre.json');
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  const parseRepo = (s) => {
    const m = s.trim().match(/(?:github\.com\/)?([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/);
    if (!m) return null;
    return { owner: m[1], repo: m[2] };
  };

  const onConnect = async () => {
    setMsg(null);
    const parsed = parseRepo(repoUrl);
    if (!parsed) { setMsg({ kind: 'err', text: 'Repo inválido. Usa `usuario/repo` o la URL completa.' }); return; }
    if (!token.trim()) { setMsg({ kind: 'err', text: 'Falta el token.' }); return; }
    setBusy(true);
    try {
      const probeCfg = { token: token.trim(), owner: parsed.owner, repo: parsed.repo };
      await ghTestConnection(probeCfg);
      await store.sync.setConfig({
        token: token.trim(),
        owner: parsed.owner,
        repo: parsed.repo,
        branch: branch.trim() || 'main',
        dataPath: dataPath.trim() || 'data/cuadre.json',
      });
      setMsg({ kind: 'ok', text: 'Conectado. Tus datos se sincronizarán automáticamente.' });
    } catch (e) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = () => {
    if (!confirm('¿Desconectar GitHub? El token se elimina del navegador. Los datos locales se conservan.')) return;
    store.sync.disconnect();
    setToken(''); setRepoUrl(''); setMsg(null);
  };

  const onPullNow = async () => { setBusy(true); try { await store.sync.pull(); } finally { setBusy(false); } };
  const onPushNow = async () => { setBusy(true); try { await store.sync.push(); } finally { setBusy(false); } };

  const status = store.sync.status;
  const connected = store.sync.isConfigured();

  return (
    <main className="app-main">
      <h1 className="h1" style={{ marginBottom: 4 }}>Ajustes</h1>
      <div className="sub" style={{ marginBottom: 18 }}>Conexión a GitHub para guardar el histórico</div>

      <div className="box" style={{ padding: 16, maxWidth: 640, marginBottom: 16 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Sincronización con GitHub</h2>
        <div className="sub" style={{ marginBottom: 14 }}>
          Cada cambio en la app se guarda como un commit en <span className="mono">{dataPath || 'data/cuadre.json'}</span> dentro de tu repo.
          El token vive solo en este navegador (localStorage).
        </div>

        <label className="h3" style={{ display: 'block', marginBottom: 4 }}>Repo</label>
        <input
          className="input input-mono"
          placeholder="usuario/cuadre-de-caja"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <label className="h3" style={{ display: 'block', marginBottom: 4 }}>Personal Access Token (fine-grained, scope: Contents · Read & Write)</label>
        <input
          className="input input-mono"
          type="password"
          placeholder="github_pat_…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label className="h3" style={{ display: 'block', marginBottom: 4 }}>Rama</label>
            <input className="input input-mono" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>
          <div>
            <label className="h3" style={{ display: 'block', marginBottom: 4 }}>Ruta del archivo</label>
            <input className="input input-mono" value={dataPath} onChange={(e) => setDataPath(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onConnect} disabled={busy}>
            {connected ? 'Actualizar conexión' : 'Conectar'}
          </button>
          {connected && (
            <>
              <button className="btn" onClick={onPullNow} disabled={busy}>{Ico.download()} Leer ahora</button>
              <button className="btn" onClick={onPushNow} disabled={busy}>{Ico.upload()} Guardar ahora</button>
              <button className="btn btn-danger" onClick={onDisconnect} disabled={busy}>{Ico.x()} Desconectar</button>
            </>
          )}
        </div>

        {msg && (
          <div style={{
            marginTop: 12, padding: '8px 10px', borderRadius: 6, fontSize: 12,
            background: msg.kind === 'ok' ? W.accentSoft : W.alarmSoft,
            color: msg.kind === 'ok' ? W.accent : W.alarm,
            border: `1px solid ${msg.kind === 'ok' ? W.accentBorder : W.alarmBorder}`,
          }}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="box" style={{ padding: 16, maxWidth: 640, marginBottom: 16 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>Estado actual</h2>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: W.inkSoft }}>
          <div>Estado: <span style={{ color: W.ink }}>{status.state}</span></div>
          {status.detail && <div>Detalle: <span style={{ color: W.ink }}>{status.detail}</span></div>}
          {connected && <div>Repo: <span className="mono" style={{ color: W.ink }}>{cfg.owner}/{cfg.repo}</span></div>}
          {connected && <div>Archivo: <span className="mono" style={{ color: W.ink }}>{cfg.dataPath || 'data/cuadre.json'}</span> @ <span className="mono">{cfg.branch || 'main'}</span></div>}
        </div>
      </div>

      <div className="box" style={{ padding: 16, maxWidth: 640 }}>
        <h2 className="h2" style={{ marginBottom: 4 }}>¿Cómo creo el token?</h2>
        <ol style={{ paddingLeft: 18, color: W.inkSoft, fontSize: 12.5, lineHeight: 1.6 }}>
          <li>Abre <a className="mono" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style={{ color: W.accent }}>github.com/settings/personal-access-tokens/new</a></li>
          <li>Resource owner: tu cuenta · Repository access: <b>Only select repositories</b> → escoge <span className="mono">cuadre-de-caja</span></li>
          <li>Permisos → Repository permissions → <b>Contents: Read and write</b></li>
          <li>Generate token, copia el <span className="mono">github_pat_…</span> y pégalo arriba.</li>
        </ol>
      </div>
    </main>
  );
};

Object.assign(window, { Ajustes, SyncBadge });
