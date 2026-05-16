/* PDF auto-parser
   - Lazy loads pdfjs + tesseract.js via plain <script> tags (avoids Babel's
     transformed dynamic import that breaks with "require is not defined")
*/

function loadScript(src) {
  return new Promise((resolve, reject) => {
    // De-dupe by src
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar ' + src)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { s.dataset.loaded = '1'; resolve(); };
    s.onerror = () => reject(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

let _pdfjsLoading = null;
async function loadPdfjs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!_pdfjsLoading) {
    _pdfjsLoading = (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js');
      if (!window.pdfjsLib) throw new Error('pdfjs no expuso pdfjsLib');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js';
      return window.pdfjsLib;
    })();
  }
  return _pdfjsLoading;
}

let _tesseractLoading = null;
async function loadTesseract() {
  if (window.Tesseract) return window.Tesseract;
  if (!_tesseractLoading) {
    _tesseractLoading = (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      if (!window.Tesseract) throw new Error('Tesseract no se expuso globalmente');
      return window.Tesseract;
    })();
  }
  return _tesseractLoading;
}

let _worker = null;
async function getWorker(onProgress) {
  if (_worker) return _worker;
  const T = await loadTesseract();
  // Explicit paths avoid the worker trying to require() relative files
  _worker = await T.createWorker('spa', 1, {
    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    corePath:   'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0',
    langPath:   'https://tessdata.projectnaptha.com/4.0.0_best',
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({ stage: 'ocr-progress', percent: Math.round(m.progress * 100) });
      } else if (m.status?.includes('loading') || m.status?.includes('initiali')) {
        onProgress?.({ stage: 'loading', label: m.status, percent: Math.round((m.progress || 0) * 100) });
      }
    },
  });
  return _worker;
}

async function renderPdf(file, onProgress) {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const canvases = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.({ stage: 'render', page: i, total: pdf.numPages });
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

async function ocrCanvases(canvases, onProgress) {
  const worker = await getWorker(onProgress);
  let fullText = '';
  for (let i = 0; i < canvases.length; i++) {
    onProgress?.({ stage: 'ocr', page: i+1, total: canvases.length });
    const { data } = await worker.recognize(canvases[i]);
    fullText += '\n' + data.text;
  }
  return fullText;
}

// Parse "$ 212.000" / "$212,000" / "212000" → 212000 ; "-$131.000" → -131000
function parseMoneyStr(s) {
  if (!s) return 0;
  const str = String(s);
  const neg = /-/.test(str);
  // strip everything except digits, dots, commas
  const cleaned = str.replace(/[^\d.,]/g, '');
  // For Colombian format: dots are thousands separators, no decimals → strip dots
  // Tesseract often emits both . and , so just keep digits
  const digits = cleaned.replace(/[.,]/g, '');
  const n = parseInt(digits, 10) || 0;
  return neg ? -n : n;
}

// Parse the OCR-extracted text from a Loggro Restobar daily report
function parseLoggroText(text) {
  const norm = text.replace(/\r/g, '').replace(/[\t ]+/g, ' ');
  const lines = norm.split('\n').map(l => l.trim()).filter(Boolean);

  const result = {
    comprobante: null,
    responsable: '',
    date: null,
    ventas: { efectivo: 0, tarjeta: 0, transferencia: 0 },
    propinaTotal: 0,
    gastos: { nomina: 0, proveedores: 0, domicilios: 0, otros: 0 },
  };

  // === Top-of-page metadata ===
  for (const line of lines) {
    const cm = line.match(/Comprobante\s*N[o0°]\.?\s*:?\s*(\d+)/i);
    if (cm && !result.comprobante) result.comprobante = cm[1];

    const fm = line.match(/Fecha\s*(?:Inicial|Final)?[\s:.]*?(\d{4})[-/](\d{1,2})[-/](\d{1,2})/i);
    if (fm && !result.date) {
      const y = fm[1], m = fm[2].padStart(2,'0'), d = fm[3].padStart(2,'0');
      result.date = `${y}-${m}-${d}`;
    }

    const rm = line.match(/Responsable[^:]*:\s*(.+)/i);
    if (rm && !result.responsable) result.responsable = rm[1].trim();
  }

  // === Walk sections ===
  // Section detection order matters: more specific markers first
  let section = null;  // null | 'inicial' | 'ventas' | 'credito' | 'detalle' | 'gastos'
  for (const rawLine of lines) {
    const line = rawLine;

    // Specific section markers first
    if (/^Detalle\s*Ventas\s*$/i.test(line))    { section = 'detalle'; continue; }
    if (/^Ventas\s*a\s*Cr/i.test(line))          { section = 'credito'; continue; }
    if (/^Ventas\s*$/i.test(line))               { section = 'ventas';  continue; }
    if (/^Inicial\s*$/i.test(line))              { section = 'inicial'; continue; }
    if (/Tipo\s*de\s*gasto/i.test(line))         { section = 'gastos';  continue; }
    if (/^Gastos\s*$/i.test(line))               { section = 'gastos';  continue; }
    // End-of-relevant-section markers
    if (/^Impuestos\s*$/i.test(line))            { section = null; continue; }
    if (/^Resumen\s*$/i.test(line))              { section = null; continue; }

    if (section === 'ventas') {
      // Lines: "Efectivo 2 $ 231.000", "Tarjeta 3 $ 292.500", "Propinas $ 57.000"
      // Take the LAST money token (Sistema column — propina included)
      const tokens = [...line.matchAll(/\$?\s*-?\s*\$?\s*([\d.,]{1,15})/g)]
        .map(m => m[1])
        .filter(s => /\d/.test(s));
      if (tokens.length === 0) continue;
      const value = parseMoneyStr(tokens[tokens.length - 1]);
      const nameMatch = line.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ.()]+(?:\s+[A-Za-zÁÉÍÓÚÑáéíóúñ.()]+)*)/);
      const name = nameMatch ? nameMatch[1].toLowerCase() : '';
      if      (/^efectivo/.test(name))     result.ventas.efectivo = value;
      else if (/^tarjeta/.test(name))      result.ventas.tarjeta  = value;
      else if (/transferenc/.test(name))   result.ventas.transferencia = value;
      else if (/^propina/.test(name))      result.propinaTotal = value;
    } else if (section === 'gastos') {
      // Line shape: NAME $V (just one money value)
      const m = line.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ.()\s/&-]+?)\s+\$?\s*-?\$?\s*([\d.,]+)\s*$/);
      if (m) {
        const name = m[1].trim().toLowerCase();
        const value = parseMoneyStr(m[2]);
        if (!value) continue;
        if (/^total\b/.test(name)) continue;
        if (/^gastos?$/.test(name)) continue;
        if (/^tipo\b/.test(name))   continue;

        if      (/n[óo]mina/.test(name))                result.gastos.nomina      += value;
        else if (/insumo|proveedor/.test(name))         result.gastos.proveedores += value;
        else if (/domicilio/.test(name))                result.gastos.domicilios  += value;
        else                                            result.gastos.otros       += value;
      }
    }
  }

  // === Final sweep: "Pago(s) de domicilio" anywhere in the document ===
  // Some PDFs put this outside the Gastos section. Match lines that clearly say
  // "Pago(s) + ... + domicilio(s)" — don't match plain "Domicilios" alone (that
  // could be income from delivery, not an expense).
  for (const line of lines) {
    if (!/pagos?\b/i.test(line)) continue;
    if (!/domicili/i.test(line)) continue;
    // Skip lines we already counted in the Gastos section walker — those follow
    // the strict "NAME $V" pattern. Match anywhere a money number follows.
    const moneyMatch = line.match(/\$?\s*-?\$?\s*([\d.,]{3,})\s*$/);
    if (!moneyMatch) continue;
    const v = parseMoneyStr(moneyMatch[1]);
    if (v <= 0) continue;
    // If the Gastos section already captured a value matching this line within
    // the gastos walker, that's already added — skip duplication by checking
    // if the line was already a Gastos-section-shaped line. Cheap heuristic:
    // we only add if the line does NOT look like the canonical "Pago de
    // domicilio $X" inside Gastos (which would already have been counted).
    // Since Gastos walker resets section to null on Resumen/Impuestos, lines
    // OUTSIDE Gastos will pass to here. We just don't double-add: track lines
    // already counted.
    // Simpler: only add if this exact value wasn't seen as gasto.domicilios yet.
    // Since the walker added it cumulatively, the safest path is to skip if any
    // value is already there from a properly-shaped Gastos line.
    if (result.gastos.domicilios === 0) {
      result.gastos.domicilios = v;
      break;
    }
  }

  return result;
}

async function parsePdf(file, onProgress) {
  onProgress?.({ stage: 'init' });
  const canvases = await renderPdf(file, onProgress);
  const text = await ocrCanvases(canvases, onProgress);
  const parsed = parseLoggroText(text);
  return { ...parsed, rawText: text };
}

Object.assign(window, { parsePdf, parseLoggroText, parseMoneyStr });
