/* Vistas: Calendario, Resumen Mes, Extras Mes, Descuadres, Resumen Anual */

// ========== Header bar with month nav ==========
const MonthNavHeader = ({ ym, onPrev, onNext, onPick, right, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <h1 className="h1">{ymLabel(ym)}</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onPrev}>{Ico.arrowL()}</button>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onNext}>{Ico.arrowR()}</button>
        </div>
        {onPick && (
          <input
            type="month"
            value={ym}
            onChange={e => onPick(e.target.value)}
            className="input input-mono"
            style={{ width: 'auto', padding: '3px 6px', fontSize: 11, border: 'none', color: W.inkMute }}
          />
        )}
      </div>
      {subtitle && <div className="sub" style={{ marginTop: 2 }}>{subtitle}</div>}
    </div>
    {right}
  </div>
);

// ========== Calendario ==========
const Calendario = ({ store }) => {
  const ym = store.ui.selectedMonth;
  const days = store.monthDays(ym);
  const byDate = Object.fromEntries(days.map(d => [d.date, d]));
  const firstWd = firstWeekdayOfMonth(ym);
  const totalDays = daysInMonth(ym);

  // Build grid cells
  const cells = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) {
    const iso = `${ym}-${String(i).padStart(2,'0')}`;
    cells.push({ day: i, iso, data: byDate[iso] });
  }

  // Stats
  let counted = 0, descuadreSum = 0, cashSum = 0, gastosSum = 0, pending = 0;
  for (const d of days) {
    const c = computeDay(d);
    if (c.hasInput) {
      counted++;
      cashSum += c.contado;
      gastosSum += c.gastosTotal + c.notasTotal;
      descuadreSum += c.descuadre || 0;
    } else if (c.hasPdf) {
      pending++;
    }
  }

  return (
    <div className="app-main">
      <MonthNavHeader
        ym={ym}
        onPrev={() => store.selectMonth(ymPrev(ym))}
        onNext={() => store.selectMonth(ymNext(ym))}
        onPick={(v) => store.selectMonth(v)}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { store.selectDate(todayISO()); store.navigate('cuadre'); }}>
              {Ico.cash()} Cuadrar hoy
            </button>
          </div>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 16, gap: 10 }}>
        <div className="box" style={{ padding: 12 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Días cuadrados</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 600 }}>{counted}</span>
            <span style={{ fontSize: 12, color: W.inkMute }}>/ {totalDays}</span>
          </div>
        </div>
        <div className="box" style={{ padding: 12 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Descuadre mes</div>
          <Money value={descuadreSum} signed={descuadreSum !== 0}/>
        </div>
        <div className="box" style={{ padding: 12 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo contado</div>
          <Money value={cashSum}/>
        </div>
        <div className="box" style={{ padding: 12 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Salidas (gastos+notas)</div>
          <Money value={gastosSum}/>
        </div>
        <div className="box" style={{ padding: 12 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Pendientes</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: pending > 0 ? W.warn : W.inkGhost }}>{pending}</span>
            <span style={{ fontSize: 12, color: W.inkMute }}>por contar</span>
          </div>
        </div>
      </div>

      <div className="box" style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
            <div key={d} className="h3" style={{ textAlign: 'center' }}>{d}</div>
          ))}
          {cells.map((c, i) => {
            if (!c) return <div key={i}/>;
            const comp = c.data ? computeDay(c.data) : null;
            let state = 'empty';
            if (comp) {
              if (comp.hasInput) state = Math.abs(comp.descuadre) < 1 ? 'ok' : 'bad';
              else if (comp.hasPdf) state = 'pending';
            }
            const isToday = c.iso === todayISO();
            const isCurrent = c.iso === store.ui.selectedDate;
            const style = {
              empty:   { background: W.paper, borderColor: W.lineSoft, color: W.ink },
              pending: { background: W.warnSoft, borderColor: W.warnBorder, color: W.ink },
              ok:      { background: W.accentSoft, borderColor: W.accentBorder, color: W.ink },
              bad:     { background: W.alarmSoft, borderColor: W.alarmBorder, color: W.ink },
            }[state];
            const selBorder = isCurrent ? W.ink : style.borderColor;
            return (
              <div
                key={i}
                onClick={() => { store.selectDate(c.iso); store.navigate('cuadre'); }}
                style={{
                  aspectRatio: '1.35', borderRadius: 6,
                  border: `${isCurrent ? 2 : 1}px solid ${selBorder}`,
                  background: style.background, color: style.color,
                  padding: '6px 8px', display: 'flex', flexDirection: 'column', cursor: 'pointer',
                  position: 'relative', transition: 'transform .1s, box-shadow .1s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: isToday ? 700 : 500, fontSize: 13, textDecoration: isToday ? 'underline' : 'none' }}>
                    {c.day}
                  </span>
                  {c.data?.pdfFiles?.length > 0 && (
                    <span style={{ color: W.inkMute, opacity: 0.7, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {Ico.file()}{c.data.pdfFiles.length > 1 && <span style={{ fontSize: 9, fontWeight: 600 }}>×{c.data.pdfFiles.length}</span>}
                    </span>
                  )}
                </div>
                {comp?.contado > 0 && (
                  <div className="money" style={{ fontSize: 11, marginTop: 'auto' }}>
                    {fmtMoney(comp.contado)}
                  </div>
                )}
                {comp?.descuadre != null && Math.abs(comp.descuadre) > 0.5 && (
                  <div className="money" style={{ fontSize: 10, color: W.alarm }}>
                    {fmtMoneySigned(comp.descuadre)}
                  </div>
                )}
                {state === 'pending' && (
                  <div style={{ fontSize: 10, color: W.warn, marginTop: 'auto', fontStyle: 'italic' }}>contar →</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, color: W.inkMute, flexWrap: 'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:10, height:10, borderRadius:3, background: W.accentSoft, border:`1px solid ${W.accentBorder}` }}/>Cuadrado</span>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:10, height:10, borderRadius:3, background: W.alarmSoft, border:`1px solid ${W.alarmBorder}` }}/>Descuadre</span>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:10, height:10, borderRadius:3, background:W.warnSoft, border:`1px solid ${W.warnBorder}` }}/>PDF cargado, falta conteo</span>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ width:10, height:10, borderRadius:3, background:W.paper, border:`1px solid ${W.lineSoft}` }}/>Sin datos</span>
        </div>
      </div>
    </div>
  );
};

// ========== Resumen del mes ==========
const ResumenMes = ({ store }) => {
  const ym = store.ui.selectedMonth;
  const days = store.monthDays(ym);

  let totalEfectivo = 0, totalTarjeta = 0, totalTransf = 0;
  let totalGastos = 0, totalNotas = 0, totalContado = 0, totalDescuadre = 0;
  let totalPropina = 0;

  for (const d of days) {
    const c = computeDay(d);
    totalEfectivo += c.porMetodo.efectivo.total;
    totalTarjeta  += c.porMetodo.tarjeta.total;
    totalTransf   += c.porMetodo.transferencia.total;
    totalGastos   += c.gastosTotal;
    totalNotas    += c.notasTotal;
    if (c.hasInput) {
      totalContado += c.contado;
      totalDescuadre += c.descuadre || 0;
    }
    totalPropina += Number(d.propinaTotal) || 0;
  }

  // Extras del mes — affects month-end total
  const extras = store.getExtrasMes(ym);
  const totalExtrasMes = extras.reduce((a,e) => a + (Number(e.monto)||0), 0);
  const efectivoFinalMes = totalContado - totalExtrasMes;

  return (
    <div className="app-main">
      <MonthNavHeader
        ym={ym}
        onPrev={() => store.selectMonth(ymPrev(ym))}
        onNext={() => store.selectMonth(ymNext(ym))}
        onPick={(v) => store.selectMonth(v)}
        subtitle={`${days.length} días con datos`}
      />

      {/* Top stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo contado</div>
          <Money value={totalContado} big/>
          <div className="sub" style={{ marginTop: 2 }}>suma de "Efectivo en mano" diario</div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Tarjeta</div>
          <Money value={totalTarjeta} big/>
          <div className="sub" style={{ marginTop: 2 }}>para conciliar con banco</div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Transferencia</div>
          <Money value={totalTransf} big/>
          <div className="sub" style={{ marginTop: 2 }}>para conciliar con banco</div>
        </div>
        <div className="box" style={{ padding: 14, background: totalDescuadre === 0 ? W.paper : (totalDescuadre > 0 ? '#f5faf2' : '#fcf4f1'), borderColor: totalDescuadre === 0 ? W.line : (totalDescuadre > 0 ? '#cfe0c4' : '#e6c7bc') }}>
          <div className="h3" style={{ marginBottom: 4 }}>Descuadre acumulado</div>
          <span className="money" style={{ fontSize: 22, fontWeight: 600, color: totalDescuadre === 0 ? W.ink : (totalDescuadre > 0 ? W.accent : W.alarm) }}>
            {fmtMoneySigned(totalDescuadre)}
          </span>
        </div>
      </div>

      {/* Month-end summary */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo mes</div>
          <Money value={totalContado} big/>
        </div>
        <div className="box" style={{ padding: 14, background: W.warnSoft, borderColor: W.warnBorder }}>
          <div className="h3" style={{ marginBottom: 4 }}>Extras del mes</div>
          <Money value={-totalExtrasMes} big/>
          <div className="sub" style={{ marginTop: 2 }}>{extras.length} registros</div>
        </div>
        <div className="box" style={{ padding: 14, background: W.accentSoft, borderColor: W.accentBorder }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo final del mes</div>
          <Money value={efectivoFinalMes} big/>
          <div className="sub" style={{ marginTop: 2 }}>al cierre · esperado en caja</div>
        </div>
      </div>

      {/* Days table */}
      <div className="box" style={{ overflow: 'hidden' }}>
        <table className="tbl" style={{ fontSize: 12 }}>
          <thead style={{ background: W.paperAlt }}>
            <tr>
              <th style={{ width: 70 }}>Día</th>
              <th>PDF</th>
              <th style={{ textAlign: 'right' }}>Efectivo</th>
              <th style={{ textAlign: 'right' }}>Tarjeta</th>
              <th style={{ textAlign: 'right' }}>Transf.</th>
              <th style={{ textAlign: 'right' }}>Gastos</th>
              <th style={{ textAlign: 'right' }}>Notas</th>
              <th style={{ textAlign: 'right' }}>Contado</th>
              <th style={{ textAlign: 'right' }}>Descuadre</th>
              <th style={{ width: 30 }}/>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const c = computeDay(d);
              const ok = c.descuadre !== null && Math.abs(c.descuadre) < 1;
              return (
                <tr key={d.date} onClick={() => { store.selectDate(d.date); store.navigate('cuadre'); }} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, color: W.ink }}>{shortDateLabel(d.date)}</td>
                  <td>{(() => {
                    const files = d.pdfFiles || [];
                    if (files.length === 0) return <span className="tag" style={{ color: W.inkGhost }}>—</span>;
                    if (files.length === 1) return <span className="tag tag-pdf">{Ico.file()} {files[0].name}</span>;
                    return <span className="tag tag-pdf" title={files.map(f=>f.name).join('\n')}>{Ico.file()} {files.length} PDFs</span>;
                  })()}</td>
                  <td className="t-num">{fmtMoney(c.porMetodo.efectivo.total)}</td>
                  <td className="t-num" style={{ color: W.inkSoft }}>{fmtMoney(c.porMetodo.tarjeta.total)}</td>
                  <td className="t-num" style={{ color: W.inkSoft }}>{fmtMoney(c.porMetodo.transferencia.total)}</td>
                  <td className="t-num">{fmtMoney(c.gastosTotal)}</td>
                  <td className="t-num">{fmtMoney(c.notasTotal)}</td>
                  <td className="t-num">{c.hasInput ? fmtMoney(c.contado) : <span style={{ color: W.inkGhost }}>—</span>}</td>
                  <td className="t-num" style={{ color: c.descuadre === null || c.descuadre === 0 ? W.inkSoft : W.alarm }}>
                    {c.descuadre === null ? '—' : fmtMoneySigned(c.descuadre)}
                  </td>
                  <td>
                    {c.descuadre === null
                      ? <span className="tag" style={{ background: W.fill, color: W.inkMute }}>—</span>
                      : ok ? <span style={{ color: W.accent }}>{Ico.check()}</span>
                           : <span style={{ color: W.alarm }}>{Ico.warn()}</span>}
                  </td>
                </tr>
              );
            })}
            {days.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px 0', color: W.inkGhost, fontStyle: 'italic' }}>
                Sin días registrados en {ymLabel(ym)}. <a href="#cuadre" onClick={(e)=>{e.preventDefault();store.navigate('cuadre');}} style={{ color: W.accent }}>Cuadrar hoy →</a>
              </td></tr>
            )}
          </tbody>
          {days.length > 0 && (
            <tfoot>
              <tr style={{ background: W.paperAlt, fontWeight: 600 }}>
                <td style={{ color: W.ink }}>Total</td>
                <td/>
                <td className="t-num">{fmtMoney(totalEfectivo)}</td>
                <td className="t-num">{fmtMoney(totalTarjeta)}</td>
                <td className="t-num">{fmtMoney(totalTransf)}</td>
                <td className="t-num">{fmtMoney(totalGastos)}</td>
                <td className="t-num">{fmtMoney(totalNotas)}</td>
                <td className="t-num">{fmtMoney(totalContado)}</td>
                <td className="t-num">{fmtMoneySigned(totalDescuadre)}</td>
                <td/>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPropina > 0 && (
        <div style={{ marginTop: 12, fontSize: 11.5, color: W.inkMute, fontStyle: 'italic' }}>
          Propinas del mes (informativo): {fmtMoney(totalPropina)}
        </div>
      )}
    </div>
  );
};

// ========== Extras del Mes ==========
const ExtrasMesView = ({ store }) => {
  const ym = store.ui.selectedMonth;
  const extras = store.getExtrasMes(ym);
  const total = extras.reduce((a,e) => a + (Number(e.monto)||0), 0);

  // Month-end totals
  const days = store.monthDays(ym);
  let efectivoMes = 0;
  for (const d of days) {
    const c = computeDay(d);
    if (c.hasInput) efectivoMes += c.contado;
  }
  const final = efectivoMes - total;

  // Year-by-month chart
  const year = parseInt(ym.slice(0,4));
  const monthsData = [];
  for (let m = 1; m <= 12; m++) {
    const k = `${year}-${String(m).padStart(2,'0')}`;
    const list = store.data.extrasMes[k] || [];
    monthsData.push({ ym: k, label: MONTH_NAMES[m-1].slice(0,3), monto: list.reduce((a,e)=>a+(Number(e.monto)||0),0) });
  }
  const maxYear = Math.max(1, ...monthsData.map(m => m.monto));

  return (
    <div className="app-main">
      <MonthNavHeader
        ym={ym}
        onPrev={() => store.selectMonth(ymPrev(ym))}
        onNext={() => store.selectMonth(ymNext(ym))}
        onPick={(v) => store.selectMonth(v)}
        subtitle="Gastos varios — se restan del total acumulado al cierre de mes"
        right={
          <button className="btn btn-primary" onClick={() => store.addExtraMes(ym, { fecha: todayISO(), desc: '', monto: 0 })}>
            {Ico.plus()} Nuevo extra
          </button>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 16 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo acumulado del mes</div>
          <Money value={efectivoMes} big/>
          <div className="sub" style={{ marginTop: 2 }}>suma del efectivo contado por día</div>
        </div>
        <div className="box" style={{ padding: 14, background: W.warnSoft, borderColor: W.warnBorder }}>
          <div className="h3" style={{ marginBottom: 4 }}>Extras del mes</div>
          <Money value={-total} big/>
          <div className="sub" style={{ marginTop: 2 }}>{extras.length} registros</div>
        </div>
        <div className="box" style={{ padding: 14, background: W.accentSoft, borderColor: W.accentBorder }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo final del mes</div>
          <Money value={final} big/>
          <div className="sub" style={{ marginTop: 2 }}>esperado en caja al cierre</div>
        </div>
      </div>

      <div className="box" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Fecha</th>
              <th>Descripción</th>
              <th style={{ width: 160, textAlign: 'right' }}>Monto</th>
              <th style={{ width: 30 }}/>
            </tr>
          </thead>
          <tbody>
            {extras.map(e => (
              <tr key={e.id}>
                <td>
                  <input
                    type="date"
                    className="input input-mono"
                    value={e.fecha || ''}
                    onChange={(ev) => store.updateExtraMes(ym, e.id, { fecha: ev.target.value })}
                    style={{ padding: '4px 6px', fontSize: 12, border: 'none', background: 'transparent' }}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    value={e.desc || ''}
                    onChange={(ev) => store.updateExtraMes(ym, e.id, { desc: ev.target.value })}
                    placeholder="Descripción del extra…"
                    style={{ padding: '4px 6px', fontSize: 12.5, border: 'none', background: 'transparent' }}
                  />
                </td>
                <td>
                  <MoneyInput
                    value={e.monto}
                    onChange={(v) => store.updateExtraMes(ym, e.id, { monto: v })}
                    style={{ padding: '4px 6px', fontSize: 12.5, border: 'none', background: 'transparent', width: '100%' }}
                  />
                </td>
                <td>
                  <button
                    className="btn btn-ghost btn-danger"
                    style={{ padding: 4 }}
                    onClick={() => store.removeExtraMes(ym, e.id)}
                  >{Ico.trash()}</button>
                </td>
              </tr>
            ))}
            {extras.length === 0 && (
              <tr className="muted">
                <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', fontStyle: 'italic', color: W.inkGhost }}>
                  Sin extras este mes — clic "Nuevo extra" para agregar
                </td>
              </tr>
            )}
          </tbody>
          {extras.length > 0 && (
            <tfoot>
              <tr style={{ background: W.paperAlt }}>
                <td/>
                <td style={{ fontWeight: 600 }}>Total</td>
                <td className="t-num" style={{ fontWeight: 600 }}>{fmtMoney(total)}</td>
                <td/>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Year chart */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 className="h2">Extras por mes · año {year}</h4>
          <span className="sub">para rastrear el patrón</span>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {monthsData.map((md, i) => {
              const maxPx = 110;
              const hPx = md.monto > 0 ? Math.max(3, (md.monto/maxYear)*maxPx) : 1;
              const isActive = md.ym === ym;
              return (
                <div
                  key={i}
                  onClick={() => store.selectMonth(md.ym)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                >
                  <div className="money" style={{ fontSize: 9.5, color: W.inkMute, opacity: md.monto > 0 ? 1 : 0, height: 12 }}>
                    {md.monto > 0 ? Math.round(md.monto/1000) + 'k' : ''}
                  </div>
                  <div style={{
                    width: '100%', height: `${hPx}px`,
                    background: md.monto > 0 ? (isActive ? W.ink : W.fillDeep) : W.lineSoft,
                    borderRadius: 3
                  }}/>
                  <div style={{ fontSize: 11, color: isActive ? W.ink : W.inkMute, fontWeight: isActive ? 600 : 400 }}>{md.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== Descuadres ==========
const Descuadres = ({ store }) => {
  const [filter, setFilter] = React.useState('all'); // all | sobrante | faltante
  const allDays = Object.values(store.data.days).sort((a,b) => b.date.localeCompare(a.date));

  const rows = [];
  for (const d of allDays) {
    const c = computeDay(d);
    if (c.descuadre !== null && Math.abs(c.descuadre) > 0.5) {
      rows.push({ date: d.date, comp: c, notas: (d.notas||[]).map(n => n.descripcion).filter(Boolean).join(' · ') });
    }
  }

  const filtered = rows.filter(r => {
    if (filter === 'sobrante') return r.comp.descuadre > 0;
    if (filter === 'faltante') return r.comp.descuadre < 0;
    return true;
  });

  const sumPos = rows.filter(r => r.comp.descuadre > 0).reduce((a,r) => a + r.comp.descuadre, 0);
  const sumNeg = rows.filter(r => r.comp.descuadre < 0).reduce((a,r) => a + r.comp.descuadre, 0);
  const sumAll = sumPos + sumNeg;

  return (
    <div className="app-main">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="h1">Histórico de descuadres</h1>
          <div className="sub">Días donde el efectivo contado no cuadró con lo esperado</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="btn" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos ({rows.length})</option>
            <option value="sobrante">Sobrantes</option>
            <option value="faltante">Faltantes</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Total descuadres</div>
          <Money value={sumAll} signed big/>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Sobrantes</div>
          <Money value={sumPos} big/>
          <div style={{ fontSize: 11, color: W.accent, marginTop: 2 }}>+{rows.filter(r=>r.comp.descuadre>0).length} días</div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Faltantes</div>
          <Money value={sumNeg} big/>
          <div style={{ fontSize: 11, color: W.alarm, marginTop: 2 }}>−{rows.filter(r=>r.comp.descuadre<0).length} días</div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Días con descuadre</div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>{rows.length}</div>
        </div>
      </div>

      <div className="box" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Día</th>
              <th style={{ width: 110 }}>Tipo</th>
              <th style={{ textAlign: 'right', width: 140 }}>Monto</th>
              <th>Notas del día</th>
              <th style={{ width: 30 }}/>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const pos = r.comp.descuadre > 0;
              return (
                <tr key={r.date} onClick={() => { store.selectDate(r.date); store.navigate('cuadre'); }} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, color: W.ink }}>{shortDateLabel(r.date)} · {r.date.slice(0,4)}</td>
                  <td>
                    <span className="tag" style={{ background: pos ? W.accentSoft : W.alarmSoft, color: pos ? W.accent : W.alarm }}>
                      {pos ? '↑ Sobrante' : '↓ Faltante'}
                    </span>
                  </td>
                  <td className="t-num" style={{ color: pos ? W.accent : W.alarm, fontWeight: 600 }}>{fmtMoneySigned(r.comp.descuadre)}</td>
                  <td style={{ color: r.notas ? W.inkSoft : W.inkGhost, fontStyle: r.notas ? 'normal' : 'italic' }}>
                    {r.notas || '—'}
                  </td>
                  <td style={{ color: W.inkGhost }}>{Ico.chev()}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px 0', color: W.inkGhost, fontStyle: 'italic' }}>
                {rows.length === 0 ? '¡Sin descuadres! Todo cuadra perfecto.' : 'Sin descuadres con ese filtro'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ========== Resumen Anual ==========
const ResumenAnual = ({ store }) => {
  const [year, setYear] = React.useState(() => parseInt(store.ui.selectedMonth.slice(0,4)));
  const allYears = new Set(Object.keys(store.data.days).map(d => d.slice(0,4)));
  allYears.add(String(year));
  const yearOptions = [...allYears].sort();

  const meses = [];
  let totals = { contado: 0, efectivo: 0, tarjeta: 0, transf: 0, gastos: 0, notas: 0, descuadre: 0, extrasMes: 0 };
  for (let m = 1; m <= 12; m++) {
    const ym = `${year}-${String(m).padStart(2,'0')}`;
    const days = store.monthDays(ym);
    let contado = 0, efectivo = 0, tarjeta = 0, transf = 0, gastos = 0, notas = 0, descuadre = 0;
    for (const d of days) {
      const c = computeDay(d);
      efectivo += c.porMetodo.efectivo.total;
      tarjeta += c.porMetodo.tarjeta.total;
      transf += c.porMetodo.transferencia.total;
      gastos += c.gastosTotal;
      notas  += c.notasTotal;
      if (c.hasInput) {
        contado += c.contado;
        descuadre += c.descuadre || 0;
      }
    }
    const extrasMes = (store.data.extrasMes[ym] || []).reduce((a,e)=>a+(Number(e.monto)||0), 0);
    const final = contado - extrasMes;
    meses.push({ ym, label: MONTH_NAMES[m-1], days: days.length, contado, efectivo, tarjeta, transf, gastos, notas, descuadre, extrasMes, final });
    totals.contado += contado;
    totals.efectivo += efectivo;
    totals.tarjeta += tarjeta;
    totals.transf += transf;
    totals.gastos += gastos;
    totals.notas += notas;
    totals.descuadre += descuadre;
    totals.extrasMes += extrasMes;
  }
  const totalFinal = totals.contado - totals.extrasMes;
  const maxV = Math.max(1, ...meses.map(m => m.contado));

  return (
    <div className="app-main">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="h1">Resumen {year}</h1>
          <div className="sub">Total por mes — efectivo en mano al final</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="btn" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 16 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo contado año</div>
          <Money value={totals.contado} big/>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Tarjeta</div>
          <Money value={totals.tarjeta} big/>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Transferencia</div>
          <Money value={totals.transf} big/>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Salidas (gastos+notas)</div>
          <Money value={totals.gastos + totals.notas} big/>
        </div>
        <div className="box" style={{ padding: 14, background: W.accentSoft, borderColor: W.accentBorder }}>
          <div className="h3" style={{ marginBottom: 4 }}>Efectivo final año</div>
          <Money value={totalFinal} big/>
          <div className="sub" style={{ marginTop: 2 }}>menos extras del mes</div>
        </div>
      </div>

      <div className="box" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Mes</th>
              <th style={{ width: 60, textAlign: 'right' }}>Días</th>
              <th style={{ textAlign: 'right' }}>Contado</th>
              <th style={{ width: 110 }}/>
              <th style={{ textAlign: 'right' }}>Tarjeta</th>
              <th style={{ textAlign: 'right' }}>Transf.</th>
              <th style={{ textAlign: 'right' }}>Salidas</th>
              <th style={{ textAlign: 'right' }}>Extras Mes</th>
              <th style={{ textAlign: 'right' }}>Final</th>
              <th style={{ textAlign: 'right' }}>Descuadre</th>
              <th style={{ width: 30 }}/>
            </tr>
          </thead>
          <tbody>
            {meses.map(m => {
              const isEmpty = m.days === 0;
              return (
                <tr
                  key={m.ym}
                  className={isEmpty ? 'muted' : ''}
                  onClick={() => { if (!isEmpty) { store.selectMonth(m.ym); store.navigate('resumen-mes'); } }}
                  style={{ cursor: isEmpty ? 'default' : 'pointer' }}
                >
                  <td style={{ fontWeight: 500, color: isEmpty ? W.inkGhost : W.ink }}>{m.label}</td>
                  <td className="t-num" style={{ color: isEmpty ? W.inkGhost : W.inkSoft }}>{m.days || '—'}</td>
                  <td className="t-num">{m.contado ? fmtMoney(m.contado) : '—'}</td>
                  <td>{m.contado > 0 && <div className="bar"><i style={{ width: `${(m.contado/maxV)*100}%` }}/></div>}</td>
                  <td className="t-num">{m.tarjeta ? fmtMoney(m.tarjeta) : '—'}</td>
                  <td className="t-num">{m.transf ? fmtMoney(m.transf) : '—'}</td>
                  <td className="t-num">{(m.gastos+m.notas) ? fmtMoney(m.gastos+m.notas) : '—'}</td>
                  <td className="t-num">{m.extrasMes ? fmtMoney(m.extrasMes) : '—'}</td>
                  <td className="t-num" style={{ fontWeight: 500 }}>{m.final ? fmtMoney(m.final) : '—'}</td>
                  <td className="t-num" style={{ color: m.descuadre === 0 ? W.inkSoft : (m.descuadre > 0 ? W.accent : W.alarm) }}>
                    {m.descuadre !== 0 ? fmtMoneySigned(m.descuadre) : '—'}
                  </td>
                  <td style={{ color: W.inkGhost }}>{!isEmpty && Ico.chev()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: W.paperAlt, fontWeight: 600 }}>
              <td style={{ color: W.ink }}>Total año</td>
              <td/>
              <td className="t-num">{fmtMoney(totals.contado)}</td>
              <td/>
              <td className="t-num">{fmtMoney(totals.tarjeta)}</td>
              <td className="t-num">{fmtMoney(totals.transf)}</td>
              <td className="t-num">{fmtMoney(totals.gastos + totals.notas)}</td>
              <td className="t-num">{fmtMoney(totals.extrasMes)}</td>
              <td className="t-num">{fmtMoney(totalFinal)}</td>
              <td className="t-num">{fmtMoneySigned(totals.descuadre)}</td>
              <td/>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ========== Propinas ==========
const PropinasView = ({ store }) => {
  // Default range: current selected month
  const initialYm = store.ui.selectedMonth;
  const lastDay = daysInMonth(initialYm);
  const defaultFrom = `${initialYm}-01`;
  const defaultTo   = `${initialYm}-${String(lastDay).padStart(2,'0')}`;

  const [from, setFrom] = React.useState(defaultFrom);
  const [to,   setTo]   = React.useState(defaultTo);
  const [preset, setPreset] = React.useState('month');

  const applyPreset = (p) => {
    setPreset(p);
    const t = todayISO();
    if (p === 'today') { setFrom(t); setTo(t); }
    else if (p === 'week') {
      // Parse as local date to avoid UTC off-by-one
      const [y,m,d] = t.split('-').map(Number);
      const dt = new Date(y, m-1, d);
      const dow = dt.getDay();
      dt.setDate(dt.getDate() - dow);
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth()+1).padStart(2,'0');
      const dd = String(dt.getDate()).padStart(2,'0');
      setFrom(`${yy}-${mm}-${dd}`);
      setTo(t);
    }
    else if (p === 'month') {
      const ym = t.slice(0,7);
      setFrom(`${ym}-01`);
      setTo(`${ym}-${String(daysInMonth(ym)).padStart(2,'0')}`);
    }
    else if (p === 'year') {
      const y = t.slice(0,4);
      setFrom(`${y}-01-01`);
      setTo(`${y}-12-31`);
    }
  };

  // Collect days in range
  const inRange = Object.values(store.data.days)
    .filter(d => d.date >= from && d.date <= to)
    .sort((a,b) => a.date.localeCompare(b.date));

  const withProp = inRange.filter(d => Number(d.propinaTotal || 0) > 0);

  const total = inRange.reduce((a,d) => a + (Number(d.propinaTotal) || 0), 0);
  const avgPerDay = withProp.length > 0 ? total / withProp.length : 0;
  const bestDay   = withProp.reduce((best, d) => (!best || d.propinaTotal > best.propinaTotal ? d : best), null);

  // Build all calendar days in range for display
  const allDates = [];
  {
    const start = new Date(from);
    const end = new Date(to);
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate()+1)) {
      allDates.push(dt.toISOString().slice(0,10));
    }
  }

  const exportToExcel = () => {
    if (!window.XLSX) {
      alert('Librería XLSX no disponible. Recarga la página e intenta de nuevo.');
      return;
    }
    const XLSX = window.XLSX;

    // Build data: one row per day in range (include zero-propina days for completeness)
    const aoa = [
      ['Fecha', 'Día', 'Propina', 'Nota'],
    ];
    const byDate = Object.fromEntries(inRange.map(d => [d.date, d]));
    for (const iso of allDates) {
      const d = byDate[iso];
      const monto = d ? (Number(d.propinaTotal) || 0) : 0;
      const dayName = DAY_NAMES[new Date(iso + 'T12:00:00').getDay()];
      aoa.push([
        iso,
        dayName,
        monto,
        d?.pdfFiles?.map(f => f.name).join(' · ') || '',
      ]);
    }
    aoa.push([]);
    aoa.push(['Total', '', total, '']);
    aoa.push(['Promedio (días con propina)', '', avgPerDay, '']);
    aoa.push(['Días con propina', '', withProp.length, '']);
    aoa.push(['Días en el rango', '', allDates.length, '']);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Format the propina column as Colombian currency
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 1; R <= range.e.r; R++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: 2 });
      if (ws[addr] && typeof ws[addr].v === 'number') {
        ws[addr].t = 'n';
        ws[addr].z = '"$"#,##0';
      }
    }
    // Column widths
    ws['!cols'] = [ { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 30 } ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propinas');

    const filename = `propinas-cargo-${from}-a-${to}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="app-main">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="h1">Propinas</h1>
          <div className="sub">Selecciona un rango y exporta a Excel</div>
        </div>
        <button className="btn btn-primary" onClick={exportToExcel} disabled={inRange.length === 0}>
          {Ico.excel()} Exportar Excel
        </button>
      </div>

      {/* Range picker */}
      <div className="box" style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="h3">DESDE</span>
            <input
              type="date"
              className="input input-mono"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }}
              style={{ width: 'auto', padding: '5px 8px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="h3">HASTA</span>
            <input
              type="date"
              className="input input-mono"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPreset('custom'); }}
              style={{ width: 'auto', padding: '5px 8px' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            {[
              ['today', 'Hoy'],
              ['week',  'Esta semana'],
              ['month', 'Este mes'],
              ['year',  'Este año'],
            ].map(([k,l]) => (
              <button
                key={k}
                className="btn"
                onClick={() => applyPreset(k)}
                style={{
                  padding: '5px 10px', fontSize: 11.5,
                  background: preset === k ? W.ink : W.paper,
                  color: preset === k ? W.paper : W.inkSoft,
                  borderColor: preset === k ? W.ink : W.line,
                }}
              >{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 14 }}>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Total propinas</div>
          <Money value={total} big/>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Promedio por día</div>
          <Money value={Math.round(avgPerDay)} big/>
          <div className="sub" style={{ marginTop: 2 }}>solo días con propina</div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Días con propina</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 600 }}>{withProp.length}</span>
            <span style={{ fontSize: 12, color: W.inkMute }}>/ {allDates.length}</span>
          </div>
        </div>
        <div className="box" style={{ padding: 14 }}>
          <div className="h3" style={{ marginBottom: 4 }}>Mejor día</div>
          {bestDay ? (
            <>
              <Money value={bestDay.propinaTotal} big/>
              <div className="sub" style={{ marginTop: 2 }}>{shortDateLabel(bestDay.date)}</div>
            </>
          ) : <div className="money money-big" style={{ color: W.inkGhost }}>—</div>}
        </div>
      </div>

      {/* Days table */}
      <div className="box" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Fecha</th>
              <th style={{ width: 110 }}>Día</th>
              <th>PDF</th>
              <th style={{ textAlign: 'right', width: 160 }}>Propina</th>
              <th style={{ width: 220 }}>Distribución</th>
              <th style={{ width: 30 }}/>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const byDate = Object.fromEntries(inRange.map(d => [d.date, d]));
              const maxV = Math.max(1, ...withProp.map(d => d.propinaTotal));
              return allDates.map(iso => {
                const d = byDate[iso];
                const propina = d ? (Number(d.propinaTotal) || 0) : 0;
                const dayName = DAY_NAMES[new Date(iso + 'T12:00:00').getDay()];
                return (
                  <tr
                    key={iso}
                    onClick={() => { if (d) { store.selectDate(iso); store.navigate('cuadre'); } }}
                    style={{ cursor: d ? 'pointer' : 'default' }}
                    className={!d || propina === 0 ? 'muted' : ''}
                  >
                    <td style={{ fontWeight: 500, color: propina > 0 ? W.ink : W.inkGhost }}>{shortDateLabel(iso)}</td>
                    <td style={{ color: W.inkSoft }}>{dayName}</td>
                    <td>{(() => {
                      const files = d?.pdfFiles || [];
                      if (files.length === 0) return <span style={{ color: W.inkGhost }}>—</span>;
                      if (files.length === 1) return <span className="tag tag-pdf">{Ico.file()} {files[0].name}</span>;
                      return <span className="tag tag-pdf">{Ico.file()} {files.length} PDFs</span>;
                    })()}</td>
                    <td className="t-num" style={{ color: propina > 0 ? W.ink : W.inkGhost }}>{propina > 0 ? fmtMoney(propina) : '—'}</td>
                    <td>
                      {propina > 0 && (
                        <div className="bar" style={{ width: '100%' }}>
                          <i style={{ width: `${(propina/maxV)*100}%` }}/>
                        </div>
                      )}
                    </td>
                    <td style={{ color: W.inkGhost }}>{d && Ico.chev()}</td>
                  </tr>
                );
              });
            })()}
            {allDates.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px 0', color: W.inkGhost, fontStyle: 'italic' }}>
                Rango inválido
              </td></tr>
            )}
          </tbody>
          {allDates.length > 0 && (
            <tfoot>
              <tr style={{ background: W.paperAlt, fontWeight: 600 }}>
                <td style={{ color: W.ink }} colSpan="3">Total del rango</td>
                <td className="t-num">{fmtMoney(total)}</td>
                <td colSpan="2"/>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11.5, color: W.inkMute, fontStyle: 'italic' }}>
        La propina se auto-rellena del PDF cuando se sube. También se puede editar manualmente desde el "Cuadre del día".
      </div>
    </div>
  );
};

Object.assign(window, { Calendario, ResumenMes, ExtrasMesView, Descuadres, ResumenAnual, PropinasView });
