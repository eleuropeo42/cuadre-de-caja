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
      pdfFiles: [{
        id: 'pdf_seed_1',
        name: 'Cierre 5-12.pdf',
        comprobante: '131',
        responsable: 'Cargo Beer Burger Pto Colombia',
        rawOcrText: '',
        contributed: {
          ventas: { efectivo: 231000, tarjeta: 292500, transferencia: 336000 },
          gastos: { nomina: 100000, proveedores: 31000, domicilios: 0, otros: 0 },
          propinaTotal: 57000,
        },
      }],
      ventas: { efectivo: 231000, tarjeta: 292500, transferencia: 336000 },
      domicilioEfectivo: 0,
      propinaTotal: 57000,
      gastos: { nomina: 100000, proveedores: 31000, domicilios: 0, otros: 0 },
      ajustes: [],
      notas: [],
      contadoDetalle: { monedas: 0, b2k: 0, b5k: 0, b10k: 0, b20k: 0, b50k: 0, b100k: 0 },
    },
  },
  extrasMes: {},
};

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateAll(structuredClone(SEED_DATA));
    const parsed = JSON.parse(raw);
    return migrateAll({
      schemaVersion: parsed.schemaVersion || 1,
      days: parsed.days || {},
      extrasMes: parsed.extrasMes || {},
    });
  } catch (e) {
    console.error('Failed to load data, using seed', e);
    return migrateAll(structuredClone(SEED_DATA));
  }
};

const migrateAll = (data) => {
  const days = {};
  for (const [k, v] of Object.entries(data.days || {})) {
    days[k] = normalizeDay(v);
  }
  return { ...data, days };
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

  const getDay = (date) => normalizeDay(data.days[date] || emptyDay(date));

  const updateDay = (date, partial) => {
    setData(d => {
      const existing = normalizeDay(d.days[date] || emptyDay(date));
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
    setData(d => {
      const existing = normalizeDay(d.days[date] || emptyDay(date));
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

  // === PDF files: add and remove ===
  // parsed = { ventas, gastos, propinaTotal, comprobante, responsable, rawText }
  const addPdfToDay = (date, file, parsed) => {
    const contributed = {
      ventas: {
        efectivo: parsed.ventas?.efectivo || 0,
        tarjeta: parsed.ventas?.tarjeta || 0,
        transferencia: parsed.ventas?.transferencia || 0,
      },
      gastos: {
        nomina: parsed.gastos?.nomina || 0,
        proveedores: parsed.gastos?.proveedores || 0,
        domicilios: parsed.gastos?.domicilios || 0,
        otros: parsed.gastos?.otros || 0,
      },
      propinaTotal: parsed.propinaTotal || 0,
    };
    setData(d => {
      const existing = normalizeDay(d.days[date] || emptyDay(date));
      const next = structuredClone(existing);
      const entry = {
        id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
        name: file.name,
        comprobante: parsed.comprobante || '',
        responsable: parsed.responsable || '',
        rawOcrText: parsed.rawText || '',
        contributed,
      };
      next.pdfFiles = [...(next.pdfFiles || []), entry];
      // Aggregate values onto the day totals
      for (const m of ['efectivo','tarjeta','transferencia']) {
        next.ventas[m] = (Number(next.ventas[m])||0) + contributed.ventas[m];
      }
      for (const g of ['nomina','proveedores','domicilios','otros']) {
        next.gastos[g] = (Number(next.gastos[g])||0) + contributed.gastos[g];
      }
      next.propinaTotal = (Number(next.propinaTotal)||0) + contributed.propinaTotal;
      // Fill in day-level comprobante/responsable if empty
      if (!next.comprobante && entry.comprobante) next.comprobante = entry.comprobante;
      if (!next.responsable && entry.responsable) next.responsable = entry.responsable;
      next._mtime = Date.now();
      return { ...d, days: { ...d.days, [date]: next } };
    });
    return contributed;
  };

  const removePdfFromDay = (date, pdfId) => {
    setData(d => {
      const existing = normalizeDay(d.days[date] || emptyDay(date));
      const idx = existing.pdfFiles.findIndex(p => p.id === pdfId);
      if (idx === -1) return d;
      const next = structuredClone(existing);
      const removed = next.pdfFiles[idx];
      next.pdfFiles.splice(idx, 1);
      // Subtract contributed values (legacy entries have null contributed — leave totals alone)
      if (removed.contributed) {
        for (const m of ['efectivo','tarjeta','transferencia']) {
          next.ventas[m] = Math.max(0, (Number(next.ventas[m])||0) - removed.contributed.ventas[m]);
        }
        for (const g of ['nomina','proveedores','domicilios','otros']) {
          next.gastos[g] = Math.max(0, (Number(next.gastos[g])||0) - removed.contributed.gastos[g]);
        }
        next.propinaTotal = Math.max(0, (Number(next.propinaTotal)||0) - removed.contributed.propinaTotal);
      }
      // If we removed the file whose comprobante was on the day, replace with next file's
      if (removed.comprobante && next.comprobante === removed.comprobante) {
        next.comprobante = next.pdfFiles[0]?.comprobante || '';
      }
      if (removed.responsable && next.responsable === removed.responsable) {
        next.responsable = next.pdfFiles[0]?.responsable || '';
      }
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
    addPdfToDay, removePdfFromDay,
    addAjuste, updateAjuste, removeAjuste,
    addNota, updateNota, removeNota,
    getExtrasMes, addExtraMes, updateExtraMes, removeExtraMes,
    exportJson, importJson, resetAll,
    monthDays, yearDays,
    sync,
  };
};

Object.assign(window, { useStore, STORAGE_KEY, STORAGE_UI });
