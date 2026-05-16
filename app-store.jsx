/* Store — global state + localStorage + JSON export/import */

const STORAGE_KEY = 'cargo-cuadre-data-v1';
const STORAGE_UI = 'cargo-cuadre-ui-v1';

const SEED_DATA = {
  schemaVersion: 1,
  days: {
    '2026-05-12': {
      date: '2026-05-12',
      comprobante: '131',
      responsable: 'Cargo Beer Burger Pto Colombia',
      pdfFilename: 'Cierre 5-12.pdf',
      ventas: { efectivo: 212000, tarjeta: 266500, transferencia: 324000 },
      domicilioEfectivo: 0,
      propinaTotal: 57000,
      gastos: { nomina: 100000, proveedores: 31000, domicilios: 0, otros: 0 },
      ajustes: [],
      notas: [],
      contadoDetalle: { monedas: 0, b2k: 0, b5k: 0, b10k: 0, b20k: 0, b50k: 0, b100k: 0 },
    },
  },
  extrasMes: {
    // '2026-05': [{ id, fecha:'2026-05-14', desc, monto }]
  },
};

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED_DATA);
    const parsed = JSON.parse(raw);
    // ensure shape
    return {
      schemaVersion: parsed.schemaVersion || 1,
      days: parsed.days || {},
      extrasMes: parsed.extrasMes || {},
    };
  } catch (e) {
    console.error('Failed to load data, using seed', e);
    return structuredClone(SEED_DATA);
  }
};

const saveData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist', e);
  }
};

const loadUI = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_UI) || '{}');
  } catch { return {}; }
};
const saveUI = (ui) => {
  try { localStorage.setItem(STORAGE_UI, JSON.stringify(ui)); } catch {}
};

// === Hook ===
const useStore = () => {
  const [data, setData] = React.useState(() => loadData());
  const [ui, setUI] = React.useState(() => {
    const saved = loadUI();
    return {
      view: window.location.hash.replace('#','') || saved.view || 'cuadre',
      selectedDate: saved.selectedDate || todayISO(),
      selectedMonth: saved.selectedMonth || todayISO().slice(0,7),
    };
  });
  const [syncStatus, setSyncStatus] = React.useState({ state: 'idle', detail: '' });
  const dataRef = React.useRef(data);
  dataRef.current = data;

  // GitHub sync engine — created once
  const syncRef = React.useRef(null);
  if (!syncRef.current && typeof createSyncEngine === 'function') {
    syncRef.current = createSyncEngine({
      getData: () => dataRef.current,
      setData: (next) => setData(next),
      onStatus: (s) => setSyncStatus(s),
    });
    if (syncRef.current.isConfigured()) {
      syncRef.current.pull();
    } else {
      setSyncStatus({ state: 'unconfigured', detail: 'Conecta GitHub en Ajustes.' });
    }
  }

  // Persist data — local always, remote if configured (debounced)
  React.useEffect(() => {
    saveData(data);
    syncRef.current?.schedulePush();
  }, [data]);
  React.useEffect(() => { saveUI(ui); }, [ui]);

  // Hash routing
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#','');
      if (h && NAV_ITEMS.some(n => n.id === h)) {
        setUI(u => ({ ...u, view: h }));
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // === Actions ===
  const navigate = (view) => {
    window.location.hash = view;
    setUI(u => ({ ...u, view }));
  };

  const selectDate = (date) => {
    setUI(u => ({ ...u, selectedDate: date, selectedMonth: yearMonthOf(date) }));
  };

  const selectMonth = (ym) => {
    setUI(u => ({ ...u, selectedMonth: ym }));
  };

  const getDay = (date) => data.days[date] || emptyDay(date);

  const updateDay = (date, partial) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      return {
        ...d,
        days: {
          ...d.days,
          [date]: { ...existing, ...partial, _mtime: Date.now() },
        },
      };
    });
  };

  const updateDayField = (date, path, value) => {
    // path: ['gastos','nomina'] or ['contadoDetalle','b10k'] or ['ventas','efectivo']
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      const next = structuredClone(existing);
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (cur[path[i]] === undefined) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length-1]] = value;
      next._mtime = Date.now();
      return { ...d, days: { ...d.days, [date]: next } };
    });
  };

  const addAjuste = (date, ajuste) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      const id = Date.now() + Math.random();
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, ajustes: [...(existing.ajustes||[]), { id, ...ajuste }] } },
      };
    });
  };

  const updateAjuste = (date, id, partial) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, ajustes: existing.ajustes.map(a => a.id === id ? { ...a, ...partial } : a) } },
      };
    });
  };

  const removeAjuste = (date, id) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, ajustes: existing.ajustes.filter(a => a.id !== id) } },
      };
    });
  };

  const addNota = (date, nota) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      const id = Date.now() + Math.random();
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, notas: [...(existing.notas||[]), { id, ...nota }] } },
      };
    });
  };

  const updateNota = (date, id, partial) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, notas: existing.notas.map(n => n.id === id ? { ...n, ...partial } : n) } },
      };
    });
  };

  const removeNota = (date, id) => {
    setData(d => {
      const existing = d.days[date] || emptyDay(date);
      return {
        ...d,
        days: { ...d.days, [date]: { ...existing, notas: existing.notas.filter(n => n.id !== id) } },
      };
    });
  };

  const deleteDay = (date) => {
    setData(d => {
      const next = { ...d.days };
      delete next[date];
      return { ...d, days: next };
    });
  };

  // === Extras del mes ===
  const getExtrasMes = (ym) => data.extrasMes[ym] || [];

  const addExtraMes = (ym, extra) => {
    setData(d => {
      const id = Date.now() + Math.random();
      return {
        ...d,
        extrasMes: { ...d.extrasMes, [ym]: [...(d.extrasMes[ym]||[]), { id, ...extra }] },
      };
    });
  };

  const updateExtraMes = (ym, id, partial) => {
    setData(d => ({
      ...d,
      extrasMes: { ...d.extrasMes, [ym]: (d.extrasMes[ym]||[]).map(e => e.id === id ? { ...e, ...partial } : e) },
    }));
  };

  const removeExtraMes = (ym, id) => {
    setData(d => ({
      ...d,
      extrasMes: { ...d.extrasMes, [ym]: (d.extrasMes[ym]||[]).filter(e => e.id !== id) },
    }));
  };

  // === Export / Import ===
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuadre-cargo-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const importJson = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed.days) throw new Error('JSON inválido: falta "days"');
        if (!confirm('¿Reemplazar todos los datos actuales con los del archivo?')) return;
        setData({
          schemaVersion: parsed.schemaVersion || 1,
          days: parsed.days || {},
          extrasMes: parsed.extrasMes || {},
        });
        alert('Datos importados correctamente.');
      } catch (e) {
        alert('Error al leer el archivo: ' + e.message);
      }
    };
    input.click();
  };

  const resetAll = () => {
    if (!confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) return;
    setData({ schemaVersion: 1, days: {}, extrasMes: {} });
  };

  // === Aggregations ===
  const monthDays = (ym) => {
    return Object.values(data.days).filter(d => d.date.startsWith(ym)).sort((a,b) => a.date.localeCompare(b.date));
  };

  const yearDays = (year) => {
    const prefix = String(year) + '-';
    return Object.values(data.days).filter(d => d.date.startsWith(prefix));
  };

  // === GitHub sync API exposed to UI ===
  const sync = {
    status: syncStatus,
    isConfigured: () => syncRef.current?.isConfigured() || false,
    getConfig: () => syncRef.current?.getConfig() || {},
    setConfig: async (cfg) => { await syncRef.current?.setConfig(cfg); },
    disconnect: () => syncRef.current?.disconnect(),
    pull: () => syncRef.current?.pull(),
    push: () => syncRef.current?.push(),
  };

  return {
    data, ui,
    navigate, selectDate, selectMonth,
    getDay, updateDay, updateDayField, deleteDay,
    addAjuste, updateAjuste, removeAjuste,
    addNota, updateNota, removeNota,
    getExtrasMes, addExtraMes, updateExtraMes, removeExtraMes,
    exportJson, importJson, resetAll,
    monthDays, yearDays,
    sync,
  };
};

Object.assign(window, { useStore, STORAGE_KEY, STORAGE_UI });
