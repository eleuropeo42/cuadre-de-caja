/* Cuadre del día — V3 funcional */

const DayNavigator = ({ date, onPrev, onNext, onPick, computed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onPrev}>{Ico.arrowL()}</button>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 className="h1" style={{ whiteSpace: 'nowrap' }}>{dateLabel(date)}</h1>
      <input
        type="date"
        className="input input-mono"
        value={date}
        onChange={(e) => onPick(e.target.value)}
        style={{ width: 'auto', padding: '2px 4px', fontSize: 11, marginTop: 2, border: 'none', color: W.inkMute, background: 'transparent' }}
      />
    </div>
    <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onNext}>{Ico.arrowR()}</button>
  </div>
);

const PdfFileRow = ({ pdf, onRemove, onShowOcr, dim }) => (
  <div className="box" style={{
    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12,
    background: W.paperAlt, opacity: dim ? 0.6 : 1
  }}>
    <div style={{
      width: 30, height: 36, borderRadius: 4, background: W.fill,
      border: `1px solid ${W.line}`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: W.inkSoft, flex: '0 0 auto'
    }}>
      {Ico.file()}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {pdf.name}
      </div>
      <div style={{ fontSize: 11, color: W.inkMute }}>
        {pdf.comprobante ? `Comp. #${pdf.comprobante}` : 'Sin comprobante'}
        {pdf.contributed && (
          <span style={{ marginLeft: 8 }}>
            · sumó {fmtMoney(
              (pdf.contributed.ventas?.efectivo || 0) +
              (pdf.contributed.ventas?.tarjeta || 0) +
              (pdf.contributed.ventas?.transferencia || 0)
            )} en ventas
          </span>
        )}
        {!pdf.contributed && <span style={{ marginLeft: 8, fontStyle: 'italic' }}>· valores no rastreados</span>}
      </div>
    </div>
    {pdf.rawOcrText && (
      <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => onShowOcr(pdf)} title="Ver el texto que el OCR extrajo">
        {Ico.list()} OCR
      </button>
    )}
    <button
      className="btn btn-ghost btn-danger"
      style={{ padding: 4 }}
      onClick={() => onRemove(pdf)}
      title={pdf.contributed ? 'Quitar este PDF y restar sus valores' : 'Quitar este PDF (no se pueden restar valores legacy)'}
    >{Ico.trash()}</button>
  </div>
);

const PdfDropzone = ({ day, onAddFile, onRemovePdf, parsing, parseErr, onRetry }) => {
  const [over, setOver] = React.useState(false);
  const [ocrFor, setOcrFor] = React.useState(null);
  const inputRef = React.useRef();

  const handle = async (file) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name)) {
      alert('Solo archivos PDF');
      return;
    }
    onAddFile(file);
  };

  const files = day.pdfFiles || [];
  const hasFiles = files.length > 0;

  return (
    <>
      {hasFiles && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {files.map(pdf => (
            <PdfFileRow
              key={pdf.id}
              pdf={pdf}
              onShowOcr={setOcrFor}
              onRemove={(p) => {
                const msg = p.contributed
                  ? `¿Quitar "${p.name}" del día? Se restarán sus valores aportados.`
                  : `¿Quitar "${p.name}"? Los valores del día NO se restarán (este PDF se importó antes del rastreo por turno).`;
                if (confirm(msg)) onRemovePdf(p.id);
              }}
            />
          ))}
        </div>
      )}

      {parsing ? (
        <div className="box" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: W.paperAlt }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', border: `2px solid ${W.line}`,
            borderTopColor: W.accent, animation: 'spin 0.8s linear infinite'
          }}/>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{(() => {
              if (parsing.stage === 'init') return 'Iniciando…';
              if (parsing.stage === 'render') return `Renderizando página ${parsing.page} de ${parsing.total}…`;
              if (parsing.stage === 'loading') return `Cargando OCR (${parsing.percent || 0}%)…`;
              if (parsing.stage === 'ocr') return `Leyendo página ${parsing.page} de ${parsing.total}…`;
              if (parsing.stage === 'ocr-progress') return `Reconociendo texto ${parsing.percent || 0}%…`;
              return 'Procesando PDF…';
            })()}</div>
            <div style={{ fontSize: 11.5, color: W.inkMute, marginTop: 2 }}>
              {hasFiles ? 'Agregando segundo turno…' : 'La primera vez descarga datos del modelo OCR (~5MB).'}
            </div>
            {typeof parsing.percent === 'number' && (
              <div className="bar" style={{ marginTop: 6, width: '100%' }}>
                <i style={{ width: `${parsing.percent}%` }}/>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`dropzone ${over ? 'is-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current.click()}
          style={{ padding: hasFiles ? '12px 18px' : '20px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {hasFiles ? Ico.plus({ size: 'ico-lg' }) : Ico.upload({ size: 'ico-lg' })}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {hasFiles ? 'Agregar otro turno (segundo PDF)' : 'Suelta el PDF de cierre acá'}
              </div>
              <div style={{ fontSize: 11.5, color: W.inkMute }}>
                {hasFiles
                  ? 'Los valores se suman a los del primer turno'
                  : 'o click para seleccionar · los valores se llenan automáticamente con OCR'}
              </div>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file" accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={e => { handle(e.target.files[0]); e.target.value = ''; }}
          />
        </div>
      )}

      {parseErr && (
        <div className="box" style={{
          padding: '8px 12px', marginTop: 6, background: W.alarmSoft, borderColor: W.alarmBorder,
          color: W.alarm, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
        }}>
          {Ico.warn()} {parseErr}
          {onRetry && <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '3px 8px', color: W.alarm }} onClick={onRetry}>{Ico.refresh()} Reintentar</button>}
        </div>
      )}

      {ocrFor && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOcrFor(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 40
          }}
        >
          <div className="box" style={{ width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${W.line}` }}>
              <div>
                <h2 className="h2">Texto extraído · {ocrFor.name}</h2>
                <div className="sub">Si el parser no detectó algún valor, copia la línea para revisar.</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn" onClick={() => navigator.clipboard.writeText(ocrFor.rawOcrText || '')}>
                  Copiar todo
                </button>
                <button className="btn btn-ghost" onClick={() => setOcrFor(null)}>{Ico.x()}</button>
              </div>
            </div>
            <pre style={{
              flex: 1, overflow: 'auto', padding: '14px 18px', margin: 0,
              fontFamily: '"JetBrains Mono",monospace', fontSize: 12, lineHeight: 1.55,
              color: W.inkSoft, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: W.pageBg,
            }}>{ocrFor.rawOcrText || '(sin texto OCR)'}</pre>
          </div>
        </div>
      )}
    </>
  );
};

// Editable money cell — inline edit
const MoneyCell = ({ value, onChange, pdf, size = 14, mute, bold }) => {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef();
  React.useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  if (editing) {
    return (
      <MoneyInput
        ref={inputRef}
        value={value}
        onChange={onChange}
        onBlur={() => setEditing(false)}
        autoFocus
        style={{ width: 120, padding: '4px 8px', fontSize: size, fontWeight: bold ? 600 : 500 }}
      />
    );
  }
  return (
    <span
      className="money"
      onClick={() => setEditing(true)}
      title="Click para editar"
      style={{
        cursor: 'pointer', fontSize: size, fontWeight: bold ? 600 : 500,
        color: mute ? W.inkGhost : (pdf ? W.highlightInk : W.ink),
        background: pdf ? W.highlight : 'transparent',
        padding: pdf ? '1px 5px' : '1px 0',
        borderRadius: 3,
      }}
    >{fmtMoney(value)}</span>
  );
};

const MethodCard = ({ name, t, date, store, primary }) => {
  const day = store.getDay(date);
  // Detect if user has overridden the PDF-extracted total for this method
  const pdfSum = (day.pdfFiles || []).reduce((a, p) => a + ((p.contributed?.ventas?.[name]) || 0), 0);
  const currentValue = day.ventas[name] || 0;
  const corrected = pdfSum > 0 && currentValue !== pdfSum;

  return (
    <div className="box" style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: primary ? W.ink : W.inkGhost }}/>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{METHOD_LABEL[name]}</span>
        </div>
        {primary
          ? <span className="tag" style={{ background: W.accent, color: W.highlightInk, fontSize: 9.5, padding: '2px 6px' }}>al cuadre</span>
          : <span className="tag" style={{ fontSize: 9.5, padding: '2px 6px' }}>conciliar banco</span>}
      </div>

      <Money value={t.total} big/>

      <div style={{
        marginTop: 8, padding: '8px 10px',
        background: W.paperAlt, borderRadius: 6,
        fontSize: 11.5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: W.inkMute }}>Del PDF</span>
            {corrected && (
              <span
                className="tag tag-warn"
                style={{ fontSize: 9, padding: '0 5px' }}
                title={`Original del PDF: ${fmtMoney(pdfSum)} · click para restaurar`}
                onClick={() => store.updateDayField(date, ['ventas', name], pdfSum)}
              >
                corregido
              </span>
            )}
          </div>
          <MoneyInput
            value={currentValue}
            onChange={(v) => store.updateDayField(date, ['ventas', name], v)}
            style={{
              width: 110, padding: '3px 8px', fontSize: 12,
              background: W.paper, borderColor: corrected ? W.warnBorder : W.line,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: W.inkMute }}>Ajuste neto</span>
          <span className="money" style={{ color: t.ajuste === 0 ? W.inkGhost : (t.ajuste > 0 ? W.accent : W.alarm), fontWeight: 600, fontSize: 12 }}>
            {t.ajuste === 0 ? '—' : fmtMoneySigned(t.ajuste)}
          </span>
        </div>
      </div>
    </div>
  );
};

const AjusteRow = ({ ajuste, onUpdate, onDelete }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
    borderTop: `1px solid ${W.lineSoft}`, fontSize: 12
  }}>
    <select
      className="input"
      style={{ width: 140, padding: '4px 8px' }}
      value={ajuste.de}
      onChange={(e) => onUpdate({ de: e.target.value })}
    >
      {METHODS.map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
    </select>
    {Ico.arrowR()}
    <select
      className="input"
      style={{ width: 140, padding: '4px 8px' }}
      value={ajuste.a}
      onChange={(e) => onUpdate({ a: e.target.value })}
    >
      {METHODS.map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
    </select>
    <MoneyInput
      value={ajuste.monto}
      onChange={v => onUpdate({ monto: v })}
      style={{ width: 110, padding: '4px 8px' }}
    />
    <input
      className="input"
      placeholder="Nota (opcional)"
      value={ajuste.nota || ''}
      onChange={(e) => onUpdate({ nota: e.target.value })}
      style={{ flex: 1, padding: '4px 8px' }}
    />
    <button className="btn btn-ghost btn-danger" style={{ padding: 4 }} onClick={onDelete}>{Ico.trash()}</button>
  </div>
);

const ReclasificacionesPanel = ({ date, store }) => {
  const day = store.getDay(date);
  return (
    <div className="box" style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span className="h3">RECLASIFICACIONES</span>
        <span className="sub">{(day.ajustes||[]).length} ajustes · total neto = $0</span>
        <button
          className="btn btn-ghost"
          style={{ marginLeft: 'auto', padding: '4px 8px' }}
          onClick={() => store.addAjuste(date, { de: 'tarjeta', a: 'efectivo', monto: 0, nota: '' })}
        >
          {Ico.plus()} Mover dinero
        </button>
      </div>
      {(day.ajustes || []).map(a => (
        <AjusteRow
          key={a.id}
          ajuste={a}
          onUpdate={(p) => store.updateAjuste(date, a.id, p)}
          onDelete={() => store.removeAjuste(date, a.id)}
        />
      ))}
      {(!day.ajustes || day.ajustes.length === 0) && (
        <div style={{ fontSize: 11.5, color: W.inkMute, fontStyle: 'italic', padding: '6px 0 0' }}>
          Si los chicos pasaron un pago al método equivocado, agrega un ajuste para moverlo.
        </div>
      )}
    </div>
  );
};

const ConteoBilletes = ({ date, store, computed }) => {
  const day = store.getDay(date);
  const ok = computed.descuadre !== null && Math.abs(computed.descuadre) < 1;
  return (
    <div className="box" style={{
      padding: 0, overflow: 'hidden',
      background: ok ? W.accentSoft : (computed.descuadre === null ? W.paperAlt : W.alarmSoft),
      borderColor: ok ? W.accentBorder : (computed.descuadre === null ? W.line : W.alarmBorder),
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px' }}>
        {/* Left */}
        <div style={{ padding: '14px 18px', borderRight: `1px solid ${ok ? W.accentBorder : (computed.descuadre === null ? W.line : W.alarmBorder)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h4 className="h3" style={{ marginBottom: 2 }}>Conteo de efectivo en mano</h4>
              <div style={{ fontSize: 11.5, color: W.inkMute }}>Cuenta billetes — el sistema multiplica por denominación</div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ padding: '4px 8px' }}
              onClick={() => {
                if (!confirm('¿Limpiar el conteo de billetes?')) return;
                store.updateDayField(date, ['contadoDetalle'], {
                  monedas: 0, b2k: 0, b5k: 0, b10k: 0, b20k: 0, b50k: 0, b100k: 0
                });
              }}
            >
              {Ico.refresh()} Limpiar
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {DENOMS.map(den => {
              const count = day.contadoDetalle?.[den.key] || 0;
              const sub = count * den.valor;
              const has = count > 0;
              return (
                <div key={den.key} style={{
                  background: has ? W.paper : W.paperAlt,
                  border: `1px solid ${has ? W.line : W.lineSoft}`,
                  borderRadius: 6,
                  padding: '8px 6px 6px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <div style={{ fontSize: 10.5, color: has ? W.inkSoft : W.inkMute, fontWeight: 500 }}>{den.label}</div>
                  <input
                    type="number"
                    min="0"
                    className="input input-mono"
                    value={count || ''}
                    onChange={(e) => store.updateDayField(date, ['contadoDetalle', den.key], parseInt(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    style={{
                      width: '100%', textAlign: 'center', padding: '6px 2px',
                      fontSize: 18, fontWeight: 600, height: 36,
                    }}
                  />
                  <div className="money" style={{ fontSize: 10.5, color: has ? W.ink : W.inkGhost }}>
                    {has ? fmtMoney(sub) : '—'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 10, padding: '10px 12px',
            background: W.paper, border: `1px solid ${W.lineSoft}`, borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: W.inkSoft, fontWeight: 500 }}>Monedas</span>
              <span style={{ fontSize: 10, color: W.inkMute }}>(total $)</span>
              <MoneyInput
                value={day.contadoDetalle?.monedas || 0}
                onChange={(v) => store.updateDayField(date, ['contadoDetalle', 'monedas'], v)}
                style={{ width: 110, padding: '5px 8px', fontSize: 13 }}
                placeholder="$0"
              />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 11, color: W.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total contado</span>
              <span className="money" style={{ fontSize: 22, fontWeight: 600 }}>{fmtMoney(computed.contado)}</span>
            </div>
          </div>
        </div>

        {/* Right: cuadre */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 className="h3" style={{ marginBottom: 8 }}>Cuadre</h4>
            <div style={{ marginBottom: 12 }}>
              <div className="sub" style={{ fontSize: 11 }}>Esperado en mano</div>
              <Money value={computed.esperado} big/>
              <div style={{ fontSize: 10.5, color: W.inkMute, marginTop: 2, lineHeight: 1.5 }}>
                {fmtMoney(computed.porMetodo.efectivo.total)} efec. ajustado<br/>
                − {fmtMoney(computed.gastosTotal)} gastos − {fmtMoney(computed.notasTotal)} notas
              </div>
            </div>
            <div>
              <div className="sub" style={{ fontSize: 11 }}>Contado (de billetes)</div>
              <Money value={computed.contado} big/>
            </div>
          </div>
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 6,
            background: computed.descuadre === null ? W.fill : (ok ? W.accentSoft : W.alarmSoft),
            color: computed.descuadre === null ? W.inkMute : (ok ? W.accent : W.alarm),
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
              {computed.descuadre === null
                ? <span style={{ fontWeight: 600, fontSize: 12 }}>Sin conteo</span>
                : ok
                  ? <><span>{Ico.check()}</span><span style={{ fontWeight: 600, fontSize: 12 }}>Cuadra perfecto</span></>
                  : <><span>{Ico.warn()}</span><span style={{ fontWeight: 600, fontSize: 12 }}>Descuadre</span></>}
            </div>
            <div className="money" style={{ fontSize: 18, fontWeight: 600 }}>
              {computed.descuadre === null ? '—' : fmtMoneySigned(computed.descuadre)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GastosPanel = ({ date, store, computed }) => {
  const day = store.getDay(date);
  return (
    <div className="box" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h4 className="h2">Gastos del día</h4>
        <span className="tag tag-pdf">{Ico.file()} Editable</span>
      </div>
      {GASTO_CATS.map(g => {
        const v = day.gastos?.[g.key] || 0;
        return (
          <div key={g.key} style={{
            display: 'grid', gridTemplateColumns: '1fr 140px',
            gap: 10, alignItems: 'center',
            padding: '6px 0', borderBottom: `1px solid ${W.lineSoft}`,
          }}>
            <span className="row-label" style={{ fontSize: 12.5 }}>{g.label}</span>
            <MoneyInput
              value={v}
              onChange={(val) => store.updateDayField(date, ['gastos', g.key], val)}
              placeholder="$0"
              style={{ padding: '5px 9px', fontSize: 13 }}
            />
          </div>
        );
      })}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, marginTop: 4, borderTop: `1px solid ${W.line}`
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Total gastos</span>
        <Money value={computed.gastosTotal} big/>
      </div>
      <div style={{ fontSize: 11, color: W.inkMute, marginTop: 8, fontStyle: 'italic' }}>
        Para gastos que no encajan en estas 4 categorías, agrégalos en "Notas / Extras del día" →
      </div>
    </div>
  );
};

const NotasPanel = ({ date, store, computed }) => {
  const day = store.getDay(date);
  return (
    <div className="box" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h4 className="h2">Notas / Extras del día</h4>
        <button
          className="btn btn-ghost"
          style={{ padding: '3px 8px' }}
          onClick={() => store.addNota(date, { monto: 0, descripcion: '' })}
        >
          {Ico.plus()} Agregar
        </button>
      </div>
      <table className="tbl" style={{ marginTop: -2 }}>
        <tbody>
          {(day.notas || []).map((n, i) => (
            <tr key={n.id}>
              <td style={{ color: W.inkGhost, width: 22, padding: '6px 0' }}>{i+1}</td>
              <td style={{ padding: '6px 6px' }}>
                <input
                  className="input"
                  value={n.descripcion}
                  onChange={(e) => store.updateNota(date, n.id, { descripcion: e.target.value })}
                  placeholder="Descripción…"
                  style={{ padding: '4px 7px', fontSize: 12.5, border: 'none', background: 'transparent' }}
                />
              </td>
              <td style={{ padding: '6px 0' }}>
                <MoneyInput
                  value={n.monto}
                  onChange={(v) => store.updateNota(date, n.id, { monto: v })}
                  style={{ padding: '4px 7px', fontSize: 12.5, border: 'none', background: 'transparent' }}
                />
              </td>
              <td style={{ width: 22, padding: '6px 0' }}>
                <button
                  className="btn btn-ghost btn-danger"
                  style={{ padding: 3 }}
                  onClick={() => store.removeNota(date, n.id)}
                >{Ico.x()}</button>
              </td>
            </tr>
          ))}
          {(!day.notas || day.notas.length === 0) && (
            <tr className="muted">
              <td colSpan="4" style={{ padding: '12px 0', fontStyle: 'italic', color: W.inkGhost, textAlign: 'center' }}>
                Sin notas del día — clic "Agregar" para sumar un gasto extra
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, marginTop: 4, borderTop: `1px solid ${W.line}`
      }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Total notas</span>
        <Money value={computed.notasTotal} big/>
      </div>
    </div>
  );
};

const CuadreDelDia = ({ store }) => {
  const date = store.ui.selectedDate;
  const day = store.getDay(date);
  const computed = computeDay(day);
  const ok = computed.descuadre !== null && Math.abs(computed.descuadre) < 1;
  const [parsing, setParsing] = React.useState(null);
  const [parseErr, setParseErr] = React.useState(null);
  const [lastFile, setLastFile] = React.useState(null);

  const runParse = async (file, targetDate) => {
    setParsing({ stage: 'init' });
    setParseErr(null);
    setLastFile(file);
    try {
      if (!window.parsePdf) throw new Error('Parser no disponible');
      const parsed = await window.parsePdf(file, (p) => setParsing(p));

      // PDF-extracted date overrides target IF different — ask user first
      let useDate = targetDate;
      if (parsed.date && parsed.date !== targetDate) {
        if (confirm(`El PDF dice que es del ${parsed.date}. ¿Guardar el cuadre en esa fecha?`)) {
          store.selectDate(parsed.date);
          useDate = parsed.date;
        }
      }
      // Add (sum) into the day — pdf becomes a new entry in pdfFiles
      store.addPdfToDay(useDate, file, parsed);

      const totalParsed = (parsed.ventas?.efectivo||0) + (parsed.ventas?.tarjeta||0) + (parsed.ventas?.transferencia||0);
      if (totalParsed === 0) {
        setParseErr('No se detectaron valores. El PDF fue guardado pero los campos pueden estar vacíos — edita manualmente o reintenta.');
      }
    } catch (e) {
      console.error('PDF parse failed', e);
      setParseErr(e.message || 'Error desconocido al leer el PDF');
    } finally {
      setParsing(null);
    }
  };

  const onAddFile = async (file) => {
    let targetDate = date;
    // Only suggest a date change on the FIRST PDF — on additional turns, stay on current day
    const filesCount = (day.pdfFiles || []).length;
    if (filesCount === 0) {
      const m = file.name.match(/(\d{1,2})[-_/.](\d{1,2})/);
      if (m) {
        const month = parseInt(m[1]);
        const dayN  = parseInt(m[2]);
        const year = new Date().getFullYear();
        if (month >= 1 && month <= 12 && dayN >= 1 && dayN <= 31) {
          const iso = `${year}-${String(month).padStart(2,'0')}-${String(dayN).padStart(2,'0')}`;
          if (iso !== date && confirm(`El nombre sugiere fecha ${iso}. ¿Usar esa fecha?`)) {
            store.selectDate(iso);
            targetDate = iso;
          }
        }
      }
    }
    await runParse(file, targetDate);
  };

  const onRemovePdf = (pdfId) => {
    store.removePdfFromDay(date, pdfId);
  };

  const retryParse = () => {
    if (lastFile) runParse(lastFile, date);
  };

  const prevDay = () => {
    const dt = new Date(date); dt.setDate(dt.getDate() - 1);
    store.selectDate(dt.toISOString().slice(0,10));
  };
  const nextDay = () => {
    const dt = new Date(date); dt.setDate(dt.getDate() + 1);
    store.selectDate(dt.toISOString().slice(0,10));
  };

  return (
    <div className="app-main">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <DayNavigator
          date={date}
          onPrev={prevDay}
          onNext={nextDay}
          onPick={(d) => store.selectDate(d)}
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="pill">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: computed.descuadre === null ? W.inkGhost : (ok ? W.accent : W.alarm), display: 'inline-block' }}></span>
            {computed.descuadre === null ? 'Pendiente' : (ok ? 'Cuadrado' : 'Descuadrado')}
          </span>
          {Object.keys(store.data.days).length > 0 && store.data.days[date] && (
            <button
              className="btn btn-ghost btn-danger"
              onClick={() => { if (confirm('¿Borrar este día?')) store.deleteDay(date); }}
              title="Borrar todo el día"
            >{Ico.trash()}</button>
          )}
        </div>
      </div>

      {/* PDF dropzone */}
      <div style={{ marginBottom: 14 }}>
        <PdfDropzone day={day} onAddFile={onAddFile} onRemovePdf={onRemovePdf} parsing={parsing} parseErr={parseErr} onRetry={retryParse} />
      </div>

      {/* 3 method cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 14 }}>
        {METHODS.map(m => (
          <MethodCard key={m} name={m} t={computed.porMetodo[m]} date={date} store={store} primary={m==='efectivo'} />
        ))}
      </div>

      {/* Reclasificaciones */}
      <div style={{ marginBottom: 14 }}>
        <ReclasificacionesPanel date={date} store={store} />
      </div>

      {/* Conteo + Cuadre */}
      <div style={{ marginBottom: 14 }}>
        <ConteoBilletes date={date} store={store} computed={computed} />
      </div>

      {/* Gastos + Notas */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <GastosPanel date={date} store={store} computed={computed} />
        <NotasPanel date={date} store={store} computed={computed} />
      </div>

      {/* Propina footnote */}
      <div style={{ marginTop: 12, fontSize: 11.5, color: W.inkMute, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Propina del día (informativo, no entra al cuadre):</span>
        <MoneyInput
          value={day.propinaTotal || 0}
          onChange={(v) => store.updateDayField(date, ['propinaTotal'], v)}
          style={{ width: 110, padding: '3px 7px', fontSize: 11.5 }}
        />
      </div>
    </div>
  );
};

window.CuadreDelDia = CuadreDelDia;
