/* Shared primitives — same lo-fi clean style as wireframes */

const W = {
  // Dark theme · Cargo colors: black-dominant, white text, green accents, yellow PDF
  pageBg:        '#0d0b08',  // page background — deepest black w/ warm tint
  paper:         '#16140f',  // card surface
  paperAlt:      '#1f1c16',  // alternate / hover / inner panel

  ink:           '#f5efe4',  // primary text (warm off-white)
  inkSoft:       '#c8c0b3',  // secondary text
  inkMute:       '#8a8275',  // tertiary text / labels
  inkGhost:      '#5a5249',  // disabled / empty

  line:          '#332d26',  // primary border
  lineSoft:      '#23201b',  // subtle border
  fill:          '#2a2620',  // filled chips
  fillDeep:      '#3a342c',  // deeper fill (bars)

  accent:        '#5dc97f',  // green — cuadra / primary action
  accentSoft:    '#1a3a26',  // dark green tint
  accentBorder:  '#23522f',

  alarm:         '#ef6750',  // coral — descuadre
  alarmSoft:     '#3a1b13',  // dark red tint
  alarmBorder:   '#5d2a1c',

  warn:          '#e8b834',  // golden — pending
  warnSoft:      '#33281a',  // dark golden tint
  warnBorder:    '#5a4422',

  highlight:     '#f5cb5c',  // Cargo yellow — PDF extracted values
  highlightSoft: '#3a2e15',  // dark yellow tint
  highlightInk:  '#1a1610',  // dark text on yellow bg
};

if (typeof document !== 'undefined' && !document.getElementById('app-styles')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = 'app-styles';
  s.textContent = `
    html, body { margin:0; padding:0; height:100%; background:${W.pageBg}; color-scheme: dark; }
    body { font-family:"Geist","Geist Sans",ui-sans-serif,sans-serif; color:${W.ink}; font-size:13px; line-height:1.4; letter-spacing:-0.005em; }
    *{box-sizing:border-box}
    a { color: inherit; }
    button { font-family: inherit; }
    /* Dark scrollbars */
    *::-webkit-scrollbar { width: 10px; height: 10px; }
    *::-webkit-scrollbar-track { background: ${W.paper}; }
    *::-webkit-scrollbar-thumb { background: ${W.fill}; border-radius: 6px; border: 2px solid ${W.paper}; }
    *::-webkit-scrollbar-thumb:hover { background: ${W.fillDeep}; }

    /* Native form controls (date / select) — dark-friendly */
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="month"]::-webkit-calendar-picker-indicator { filter: invert(0.85) sepia(0.2) hue-rotate(15deg); cursor: pointer; }
    select.btn, select.input { background-color: ${W.paper}; color: ${W.ink}; }
    select.btn option, select.input option { background: ${W.paper}; color: ${W.ink}; }

    .mono{font-family:"JetBrains Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums}
    h1,h2,h3,h4{margin:0;font-weight:600;letter-spacing:-0.02em;white-space:nowrap}
    .h1, .h2, .h3 { white-space: nowrap; }

    .app-shell{display:grid;grid-template-columns:220px 1fr;height:100vh;width:100vw;background:${W.pageBg}}
    .app-nav{background:${W.paper};border-right:1px solid ${W.line};padding:20px 14px;display:flex;flex-direction:column;gap:2px;overflow:auto}
    .app-nav-brand{display:flex;align-items:center;justify-content:center;padding:6px 4px 10px;margin-bottom:8px;border-bottom:1px solid ${W.lineSoft}}
    .app-nav-brand img{display:block;width:100%;height:auto;max-width:170px;opacity:0.95}
    .app-nav-brand-sub{font-size:9.5px;text-transform:uppercase;letter-spacing:0.14em;color:${W.inkMute};text-align:center;margin-top:6px;font-weight:500}
    .app-nav-section{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:${W.inkMute};margin:14px 4px 4px}
    .app-nav a{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:6px;color:${W.inkSoft};text-decoration:none;font-size:12.5px;font-weight:500;cursor:pointer}
    .app-nav a.active{background:${W.accent};color:${W.highlightInk}}
    .app-nav a:hover:not(.active){background:${W.paperAlt};color:${W.ink}}
    .app-nav-foot{margin-top:auto;padding-top:14px;border-top:1px solid ${W.lineSoft};display:flex;flex-direction:column;gap:4px}

    .app-main{padding:22px 28px;overflow:auto;background:${W.pageBg};color:${W.ink}}

    .h1{font-size:22px;font-weight:600;letter-spacing:-0.025em;color:${W.ink}}
    .h2{font-size:15px;font-weight:600;letter-spacing:-0.015em;color:${W.ink}}
    .h3{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:${W.inkMute}}
    .sub{font-size:12px;color:${W.inkMute}}

    .box{background:${W.paper};border:1px solid ${W.line};border-radius:8px}
    .box-fill{background:${W.paperAlt};border:1px solid ${W.lineSoft};border-radius:8px}

    .row{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;border-bottom:1px solid ${W.lineSoft}}
    .row:last-child{border-bottom:0}
    .row-label{color:${W.inkSoft};font-size:12.5px}

    .tag{display:inline-flex;align-items:center;gap:5px;padding:2px 7px;border-radius:99px;font-size:10.5px;font-weight:500;background:${W.fill};color:${W.inkSoft};line-height:1.4}
    .tag-ok{background:${W.accentSoft};color:${W.accent}}
    .tag-bad{background:${W.alarmSoft};color:${W.alarm}}
    .tag-warn{background:${W.warnSoft};color:${W.warn}}
    .tag-pdf{background:${W.highlight};color:${W.highlightInk}}

    .pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;border:1px solid ${W.line};padding:3px 9px;font-size:11px;color:${W.inkSoft};background:${W.paper}}

    .input{display:flex;align-items:center;border:1px solid ${W.line};background:${W.paper};border-radius:6px;padding:7px 10px;font-family:inherit;font-size:13px;color:${W.ink};min-width:0;width:100%}
    .input:focus{outline:none;border-color:${W.accent};box-shadow:0 0 0 1px ${W.accent}}
    .input::placeholder{color:${W.inkGhost}}
    .input-mono{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}
    .input-readonly{background:${W.fill};color:${W.inkSoft};border-color:${W.lineSoft}}

    .btn{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:6px;border:1px solid ${W.line};background:${W.paper};color:${W.ink};font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer}
    .btn:hover{background:${W.paperAlt};border-color:${W.fillDeep}}
    .btn-primary{background:${W.accent};color:${W.highlightInk};border-color:${W.accent}}
    .btn-primary:hover{background:#6ed68e;border-color:#6ed68e}
    .btn-ghost{background:transparent;border-color:transparent;color:${W.inkSoft}}
    .btn-ghost:hover{background:${W.paperAlt};color:${W.ink}}
    .btn-danger{color:${W.alarm}}
    .btn:disabled{opacity:0.4;cursor:not-allowed}

    .money{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;letter-spacing:-0.01em;color:${W.ink}}
    .money-big{font-size:22px;font-weight:600}

    .grid{display:grid;gap:14px}

    .ico{width:14px;height:14px;flex:0 0 14px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
    .ico-lg{width:18px;height:18px;flex:0 0 18px}
    .ico-xl{width:28px;height:28px;flex:0 0 28px}

    .bar{height:6px;background:${W.fill};border-radius:99px;overflow:hidden;position:relative}
    .bar > i{position:absolute;left:0;top:0;bottom:0;background:${W.accent};border-radius:99px;display:block}

    .tbl{width:100%;border-collapse:collapse;font-size:12.5px}
    .tbl th{text-align:left;font-weight:500;color:${W.inkMute};font-size:11px;text-transform:uppercase;letter-spacing:0.06em;padding:8px 10px;border-bottom:1px solid ${W.line}}
    .tbl td{padding:9px 10px;border-bottom:1px solid ${W.lineSoft};color:${W.inkSoft}}
    .tbl td.t-num{font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums;text-align:right;color:${W.ink}}
    .tbl tr:hover td{background:${W.paperAlt}}
    .tbl tr.muted td{color:${W.inkGhost}}

    .dropzone{border:1.5px dashed ${W.line};border-radius:10px;background:${W.paper};padding:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;cursor:pointer;transition:all .15s;color:${W.ink}}
    .dropzone:hover{background:${W.paperAlt};border-color:${W.accent}}
    .dropzone.is-over{background:${W.highlightSoft};border-color:${W.highlight};border-style:solid;color:${W.highlight}}

    /* hide number-input spinner */
    input[type=number].input::-webkit-outer-spin-button,
    input[type=number].input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    input[type=number].input{-moz-appearance:textfield}

    .kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border:1px solid ${W.line};border-bottom-width:2px;border-radius:4px;font-size:10.5px;font-family:"JetBrains Mono",monospace;color:${W.inkSoft};background:${W.paper}}
  `;
  document.head.appendChild(s);
}

// === Format helpers ===
const fmtMoney = (n, opts = {}) => {
  if (n === null || n === undefined || n === '') return opts.empty || '—';
  const v = Number(n);
  if (isNaN(v)) return opts.empty || '—';
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  const sign = v < 0 ? '-' : '';
  return `${sign}$${formatted}`;
};
const fmtMoneySigned = (n) => {
  if (n === null || n === undefined || isNaN(n) || n === 0) return '$0';
  return (n > 0 ? '+' : '') + fmtMoney(n);
};
// Parse user-typed money string back to number
const parseMoney = (s) => {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  const cleaned = String(s).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n);
};

// === Date helpers ===
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const dateLabel = (iso) => {
  const [y,m,d] = iso.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return `${DAY_NAMES[dt.getDay()]}, ${d} de ${MONTH_NAMES[m-1].toLowerCase()}`;
};
const shortDateLabel = (iso) => {
  const [y,m,d] = iso.split('-').map(Number);
  return `${d}/${m}`;
};
const yearMonthOf = (iso) => iso.slice(0,7); // '2026-05'
const ymLabel = (ym) => {
  const [y,m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m-1]} ${y}`;
};
const ymPrev = (ym) => {
  const [y,m] = ym.split('-').map(Number);
  if (m === 1) return `${y-1}-12`;
  return `${y}-${String(m-1).padStart(2,'0')}`;
};
const ymNext = (ym) => {
  const [y,m] = ym.split('-').map(Number);
  if (m === 12) return `${y+1}-01`;
  return `${y}-${String(m+1).padStart(2,'0')}`;
};
const daysInMonth = (ym) => {
  const [y,m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
const firstWeekdayOfMonth = (ym) => {
  const [y,m] = ym.split('-').map(Number);
  return new Date(y, m-1, 1).getDay(); // 0=Sun
};

// === Constants for cuadre ===
const DENOMS = [
  { key: 'b100k', valor: 100000, label: '$100.000' },
  { key: 'b50k',  valor:  50000, label: '$50.000'  },
  { key: 'b20k',  valor:  20000, label: '$20.000'  },
  { key: 'b10k',  valor:  10000, label: '$10.000'  },
  { key: 'b5k',   valor:   5000, label: '$5.000'   },
  { key: 'b2k',   valor:   2000, label: '$2.000'   },
];

const METHOD_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };
const METHODS = ['efectivo', 'tarjeta', 'transferencia'];

const GASTO_CATS = [
  { key: 'nomina',      label: 'Nómina' },
  { key: 'proveedores', label: 'Proveedores / Insumos' },
  { key: 'domicilios',  label: 'Domicilios' },
  { key: 'otros',       label: 'Otros' },
];

// Default empty day shape
const emptyDay = (date) => ({
  date,
  comprobante: '',
  responsable: '',
  // Multiple PDFs allowed (e.g. weekends with 2 shifts).
  // Each entry: { id, name, comprobante, responsable, rawOcrText, contributed }
  // `contributed` is a snapshot of what THIS pdf added (so we can subtract on removal).
  pdfFiles: [],
  ventas: { efectivo: 0, tarjeta: 0, transferencia: 0 },
  domicilioEfectivo: 0,
  propinaTotal: 0,
  gastos: { nomina: 0, proveedores: 0, domicilios: 0, otros: 0 },
  ajustes: [],
  notas: [],
  contadoDetalle: { monedas: 0, b2k: 0, b5k: 0, b10k: 0, b20k: 0, b50k: 0, b100k: 0 },
});

// Normalize legacy day shape: migrate `pdfFilename` (single) → `pdfFiles` (array).
const normalizeDay = (d) => {
  if (!d) return d;
  if (Array.isArray(d.pdfFiles)) return d;
  const out = { ...d };
  if (out.pdfFilename) {
    out.pdfFiles = [{
      id: 'legacy_' + (out.pdfFilename || 'pdf'),
      name: out.pdfFilename,
      comprobante: out.comprobante || '',
      responsable: out.responsable || '',
      rawOcrText: out.rawOcrText || '',
      contributed: null, // unknown — can't subtract on removal
    }];
  } else {
    out.pdfFiles = [];
  }
  delete out.pdfFilename;
  return out;
};

// === Cuadre math ===
const computeContado = (detalle) => {
  if (!detalle) return 0;
  return (Number(detalle.monedas) || 0) +
    DENOMS.reduce((sum, d) => sum + (Number(detalle[d.key]) || 0) * d.valor, 0);
};

const computeDay = (d) => {
  if (!d) return null;
  const ajusteNeto = { efectivo: 0, tarjeta: 0, transferencia: 0 };
  for (const a of (d.ajustes || [])) {
    const m = Number(a.monto) || 0;
    if (a.de && ajusteNeto[a.de] !== undefined) ajusteNeto[a.de] -= m;
    if (a.a  && ajusteNeto[a.a]  !== undefined) ajusteNeto[a.a]  += m;
  }
  const porMetodo = {};
  for (const m of METHODS) {
    const pdf = Number(d.ventas?.[m]) || 0;
    porMetodo[m] = { pdf, ajuste: ajusteNeto[m], total: pdf + ajusteNeto[m] };
  }
  const efectivoAjustado = porMetodo.efectivo.total + (Number(d.domicilioEfectivo) || 0);
  const gastosTotal = Object.values(d.gastos || {}).reduce((a,b)=>a+(Number(b)||0),0);
  const notasTotal  = (d.notas || []).reduce((a,n)=>a+(Number(n.monto)||0),0);
  const esperado = efectivoAjustado - gastosTotal - notasTotal;
  const contado = computeContado(d.contadoDetalle);
  const hasInput = computeContado(d.contadoDetalle) > 0 || (d.contadoDetalle && Object.values(d.contadoDetalle).some(v => v > 0));
  const descuadre = hasInput ? (contado - esperado) : null;
  const hasPdf = (d.pdfFiles?.length > 0) || !!d.pdfFilename || Object.values(d.ventas||{}).some(v=>v>0);
  return { porMetodo, efectivoAjustado, gastosTotal, notasTotal, esperado, contado, descuadre, hasPdf, hasInput };
};

// === Icons ===
const Ico = {
  upload: (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg>,
  download: (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M12 4v12M6 14l6 6 6-6M4 4h16"/></svg>,
  file:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6"/></svg>,
  cal:    (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  trend:  (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>,
  cash:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>,
  list:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>,
  warn:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M12 9v4M12 17.01l.01-.011M5.07 19h13.86a2 2 0 0 0 1.74-3L13.74 5a2 2 0 0 0-3.48 0L3.32 16a2 2 0 0 0 1.75 3z"/></svg>,
  check:  (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>,
  x:      (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  plus:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  arrowR: (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowL: (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>,
  edit:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M16 3l5 5L8 21H3v-5z"/></svg>,
  refresh:(p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>,
  filter: (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>,
  chev:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>,
  trash:  (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  more:   (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="18" r="1.2"/></svg>,
  tip:    (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/><circle cx="12" cy="12" r="4"/></svg>,
  excel:  (p={}) => <svg className={`ico ${p.size||''}`} viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8l6 8M15 8l-6 8"/></svg>,
};

// === Money component ===
const Money = ({ value, big, mute, signed, className = '' }) => {
  const cls = `money ${big ? 'money-big' : ''} ${className}`;
  const style = mute ? { color: W.inkMute } : {};
  return <span className={cls} style={style}>{signed ? fmtMoneySigned(value) : fmtMoney(value)}</span>;
};

// Editable money input — formats on blur
const MoneyInput = ({ value, onChange, placeholder = '$0', style = {}, ...rest }) => {
  const [text, setText] = React.useState(fmtMoney(value || 0));
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    if (!focused) setText(value ? fmtMoney(value) : '');
  }, [value, focused]);
  return (
    <input
      type="text"
      className="input input-mono"
      style={{ textAlign: 'right', ...style }}
      value={focused ? text : (value ? fmtMoney(value) : '')}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseMoney(e.target.value));
      }}
      onFocus={(e) => { setFocused(true); setText(value ? String(value) : ''); e.target.select(); }}
      onBlur={() => setFocused(false)}
      {...rest}
    />
  );
};

// === Sidebar ===
const NAV_ITEMS = [
  { id: 'cuadre', label: 'Cuadre del día', icon: 'cash', section: 'Día' },
  { id: 'calendar', label: 'Calendario', icon: 'cal', section: 'Día' },
  { id: 'resumen-mes', label: 'Resumen del mes', icon: 'list', section: 'Mes' },
  { id: 'extras-mes', label: 'Extras del mes', icon: 'plus', section: 'Mes' },
  { id: 'propinas', label: 'Propinas', icon: 'tip', section: 'Mes' },
  { id: 'descuadres', label: 'Descuadres', icon: 'warn', section: 'Histórico' },
  { id: 'anual', label: 'Resumen anual', icon: 'trend', section: 'Histórico' },
  { id: 'ajustes', label: 'Ajustes', icon: 'edit', section: 'Sistema' },
];

const Sidebar = ({ active, onNavigate, onExport, onImport, syncStatus, onSyncClick }) => {
  // group by section
  const groups = {};
  for (const item of NAV_ITEMS) {
    if (!groups[item.section]) groups[item.section] = [];
    groups[item.section].push(item);
  }
  return (
    <nav className="app-nav">
      <div>
        <div className="app-nav-brand">
          <img src="assets/cargo-logo.png" alt="Cargo Beer Burger & Grill"/>
        </div>
        <div className="app-nav-brand-sub">Cuadre de Caja</div>
      </div>
      {Object.entries(groups).map(([sec, items]) => (
        <React.Fragment key={sec}>
          <div className="app-nav-section">{sec}</div>
          {items.map(item => (
            <a
              key={item.id}
              className={active === item.id ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
              href={`#${item.id}`}
            >
              {Ico[item.icon]?.()} {item.label}
            </a>
          ))}
        </React.Fragment>
      ))}
      <div className="app-nav-foot">
        {syncStatus && typeof SyncBadge !== 'undefined' && <SyncBadge status={syncStatus} onClick={onSyncClick} />}
        <a onClick={onExport} href="#" title="Descargar JSON de respaldo">{Ico.download()} Exportar JSON</a>
        <a onClick={onImport} href="#" title="Cargar JSON de respaldo">{Ico.upload()} Importar JSON</a>
      </div>
    </nav>
  );
};

const PdfBadge = ({ filename }) => (
  <span className="tag tag-pdf">{Ico.file()} {filename || 'PDF'}</span>
);

Object.assign(window, {
  W, Ico, Money, MoneyInput, PdfBadge, Sidebar, NAV_ITEMS,
  fmtMoney, fmtMoneySigned, parseMoney,
  todayISO, dateLabel, shortDateLabel, yearMonthOf, ymLabel, ymPrev, ymNext, daysInMonth, firstWeekdayOfMonth,
  MONTH_NAMES, DAY_NAMES,
  DENOMS, METHODS, METHOD_LABEL, GASTO_CATS,
  emptyDay, normalizeDay, computeContado, computeDay,
});
