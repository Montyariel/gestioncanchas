// ===== VISTA: REPORTES ESTRATÉGICOS — Nico Analytics =====
const ReportesView = {
  async render(sucursal) {
    const c = document.getElementById('viewContainer');
    const label = sucursal === 'lanus' ? 'Lanús' : 'Belgrano';
    c.innerHTML = `
      <section class="grid grid-cols-1 gap-6 mb-8">
        <div class="bg-surface-container-low rounded-xl p-8 border border-surface-container-highest flex items-center justify-between">
          <div>
            <h1 class="font-h1 text-h1 text-on-surface mb-1">📊 Reportes Estratégicos</h1>
            <p class="text-on-surface-variant">Inteligencia de negocio generada por Nico · ${label}</p>
          </div>
          <div class="flex gap-3">
            <button onclick="ReportesView._setPeriodo(7)" id="btn7d" class="rp-btn rp-active px-4 py-2 rounded-lg text-sm font-bold transition-all">7 días</button>
            <button onclick="ReportesView._setPeriodo(30)" id="btn30d" class="rp-btn px-4 py-2 rounded-lg text-sm font-bold transition-all border border-slate-700 text-slate-400 hover:border-lime-400 hover:text-lime-400">30 días</button>
          </div>
        </div>
      </section>
      <div id="rp-body" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>`;

    this._sucursal = sucursal;
    this._periodo = 7;
    await this._renderAll();
  },

  _setPeriodo(d) {
    this._periodo = d;
    document.getElementById('btn7d').className  = d===7  ? 'rp-btn rp-active px-4 py-2 rounded-lg text-sm font-bold' : 'rp-btn px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 text-slate-400 hover:border-lime-400 hover:text-lime-400 transition-all';
    document.getElementById('btn30d').className = d===30 ? 'rp-btn rp-active px-4 py-2 rounded-lg text-sm font-bold' : 'rp-btn px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 text-slate-400 hover:border-lime-400 hover:text-lime-400 transition-all';
    this._renderAll();
  },

  async _renderAll() {
    const body = document.getElementById('rp-body');
    if (!body) return;
    body.innerHTML = [1,2,3,4,5,6].map(() =>
      `<div class="bg-surface-container rounded-xl p-6 border border-surface-container-highest"><div class="skeleton" style="height:180px"></div></div>`
    ).join('');

    try {
      const [ranking, pico, balance, vips, abandon, buffet, ticket, margen, comp] = await Promise.allSettled([
        NicoAnalytics.rankingCanchas(this._sucursal, this._periodo),
        NicoAnalytics.horaPico(this._sucursal, this._periodo),
        NicoAnalytics.balanceNeto(this._sucursal, this._periodo),
        NicoAnalytics.clientesVip(this._sucursal, this._periodo),
        NicoAnalytics.alertaAbandono(this._sucursal),
        NicoAnalytics.productosEstrellaVsPerros(this._sucursal),
        NicoAnalytics.ticketPromedio(this._sucursal, this._periodo),
        NicoAnalytics.margenBuffet(this._sucursal),
        NicoAnalytics.rendimientoPorSucursal(this._periodo)
      ]);
      const g = r => r.status === 'fulfilled' ? r.value : null;

      body.innerHTML = [
        this._cardRankingCanchas(g(ranking)),
        this._cardHoraPico(g(pico)),
        this._cardBalance(g(balance)),
        this._cardVips(g(vips), g(abandon)),
        this._cardBuffet(g(buffet)),
        this._cardComparativa(g(comp), g(ticket), g(margen))
      ].join('');
    } catch(e) {
      body.innerHTML = `<div class="col-span-2 p-6 rounded-xl border border-red-900 bg-red-900/10 text-red-400">Error: ${e.message}</div>`;
    }
  },

  _card(titulo, icono, contenido, span2 = false) {
    return `<div class="bg-surface-container rounded-xl p-6 border border-surface-container-highest ${span2 ? 'md:col-span-2' : ''}">
      <div class="flex items-center gap-2 mb-5">
        <span style="font-size:20px">${icono}</span>
        <h3 style="font-size:15px;font-weight:700;color:#e2e2eb">${titulo}</h3>
      </div>
      ${contenido}
    </div>`;
  },

  _bar(pct, color = '#c3f400') {
    return `<div style="height:8px;background:#1e1f26;border-radius:10px;overflow:hidden;margin-top:6px">
      <div style="height:100%;width:${Math.min(pct,100)}%;background:${color};border-radius:10px;transition:width .6s ease"></div>
    </div>`;
  },

  _cardRankingCanchas(data) {
    if (!data?.length) return this._card('Ranking de Canchas', '🏟️', '<p style="color:#8e9379;font-size:13px">Sin datos suficientes.</p>');
    const max = data[0].ingresos || 1;
    const rows = data.map((c, i) => `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:#e2e2eb;font-weight:600">${['🥇','🥈','🥉'][i] || '▪️'} ${c.nombre}</span>
          <span style="color:#c3f400;font-weight:700">${fmt.money(c.ingresos)}</span>
        </div>
        ${this._bar(Math.round((c.ingresos/max)*100))}
        <div style="display:flex;gap:16px;margin-top:4px;font-size:11px;color:#8e9379">
          <span>✅ ${c.ocupados} reservados</span>
          <span>⬜ ${c.horasMuertas} libres</span>
          <span>📊 ${c.ocupacion}%</span>
        </div>
      </div>`).join('');
    return this._card('Ranking de Canchas', '🏟️', rows);
  },

  _cardHoraPico(data) {
    if (!data?.length) return this._card('Hora Pico', '⚡', '<p style="color:#8e9379;font-size:13px">Sin datos.</p>');
    const sorted = [...data].sort((a, b) => a.hora > b.hora ? 1 : -1).slice(0, 8);
    const max = Math.max(...sorted.map(h => h.ocupados), 1);
    const rows = sorted.map(h => {
      const color = h.pct >= 80 ? '#c3f400' : h.pct >= 40 ? '#f59e0b' : '#ffb4ab';
      const tag   = h.pct >= 80 ? '🔥 PICO' : h.pct >= 40 ? '· Normal' : '· Bache';
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:12px">
          <span style="color:#e2e2eb;font-weight:600">${h.hora}</span>
          <span style="color:${color};font-size:10px;font-weight:700">${h.pct}% ${tag}</span>
        </div>
        ${this._bar(h.pct, color)}
      </div>`;
    }).join('');
    const pico = data[0];
    return this._card('Análisis Hora Pico', '⚡',
      `<div style="background:rgba(195,244,0,.06);border:1px solid rgba(195,244,0,.2);border-radius:10px;padding:10px;margin-bottom:14px;font-size:13px">
        🔥 Hora pico: <strong style="color:#c3f400">${pico?.hora}</strong> — ${pico?.pct}% de ocupación
      </div>${rows}`);
  },

  _cardBalance(data) {
    if (!data) return this._card('Balance Financiero', '💰', '<p style="color:#8e9379;font-size:13px">Sin datos.</p>');
    const { totalIngresos, totalEgresos, netoTotal, promedioDiario, dias } = data;
    const color = netoTotal >= 0 ? '#c3f400' : '#ffb4ab';
    const maxVal = Math.max(...dias.map(d => Math.max(d.ingresos, d.egresos)), 1);
    const chartBars = dias.slice(-7).map(d => {
      const hI = Math.round((d.ingresos / maxVal) * 80);
      const hE = Math.round((d.egresos  / maxVal) * 80);
      const dia = d.fecha?.slice(-5) || '';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">
        <div style="display:flex;gap:2px;align-items:flex-end;height:80px">
          <div style="width:8px;height:${hI}px;background:#c3f400;border-radius:3px 3px 0 0" title="Ingresos"></div>
          <div style="width:8px;height:${hE}px;background:#ffb4ab;border-radius:3px 3px 0 0" title="Egresos"></div>
        </div>
        <span style="font-size:9px;color:#8e9379">${dia}</span>
      </div>`;
    }).join('');

    return this._card('Balance Financiero', '💰', `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">INGRESOS</div><div style="font-size:20px;font-weight:800;color:#c3f400;font-family:Lexend">${fmt.money(totalIngresos)}</div></div>
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">EGRESOS</div><div style="font-size:20px;font-weight:800;color:#ffb4ab;font-family:Lexend">${fmt.money(totalEgresos)}</div></div>
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">NETO</div><div style="font-size:20px;font-weight:800;font-family:Lexend;color:${color}">${fmt.money(netoTotal)}</div></div>
      </div>
      <div style="display:flex;gap:4px;align-items:flex-end;height:90px;padding:0 4px;margin-bottom:6px">${chartBars}</div>
      <div style="display:flex;gap:12px;font-size:11px;color:#8e9379">
        <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:#c3f400;border-radius:2px;display:inline-block"></span>Ingresos</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:#ffb4ab;border-radius:2px;display:inline-block"></span>Egresos</span>
        <span style="margin-left:auto">Prom/día: <strong style="color:#e2e2eb">${fmt.money(promedioDiario)}</strong></span>
      </div>`);
  },

  _cardVips(vips, abandon) {
    const vipRows = (vips || []).slice(0, 5).map((c, i) =>
      `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e1f26">
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(195,244,0,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#c3f400">${c.rank}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600;color:#e2e2eb">${c.nombre}</div></div>
        <div style="text-align:right"><div style="font-size:12px;font-weight:700;color:#c3f400">${c.reservas} reservas</div><div style="font-size:11px;color:#8e9379">${fmt.money(c.gasto)}</div></div>
      </div>`).join('');

    const abandonRows = (abandon || []).slice(0, 3).map(c =>
      `<div style="font-size:12px;color:#f59e0b;padding:4px 0">⚠️ ${c.nombre} — última: ${fmt.date(c.ultimaReserva)}</div>`
    ).join('') || '<div style="font-size:12px;color:#8e9379">Sin alertas de abandono 🎉</div>';

    return this._card('Clientes VIP & Abandono', '👥', `
      <div style="margin-bottom:12px">${vipRows || '<p style="color:#8e9379;font-size:13px">Sin datos.</p>'}</div>
      <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:10px;padding:10px">
        <div style="font-size:11px;font-weight:700;color:#f59e0b;margin-bottom:6px">🚨 ALERTA ABANDONO (+15 días sin jugar)</div>
        ${abandonRows}
      </div>`);
  },

  _cardBuffet(data) {
    if (!data) return this._card('Buffet Analytics', '🌭', '<p style="color:#8e9379;font-size:13px">Sin datos.</p>');
    const { estrellas, perros, normales } = data;
    const estrella = (estrellas || []).slice(0, 3).map(p =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #1e1f26">
        <span style="color:#c3f400">⭐ ${p.item}</span>
        <span style="color:#8e9379">${p.vendasPeriodo} ventas · ${fmt.money(p.precio_venta)}</span>
      </div>`).join('') || '<div style="font-size:12px;color:#8e9379">Sin ventas registradas</div>';

    const perro = (perros || []).slice(0, 3).map(p =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #1e1f26">
        <span style="color:#ffb4ab">🐕 ${p.item}</span>
        <span style="color:#8e9379">Stock: ${p.cantidad} · Sin ventas</span>
      </div>`).join('') || '<div style="font-size:12px;color:#8e9379">Sin productos sin rotación 🎉</div>';

    return this._card('Buffet: Estrella vs Perros', '🌭', `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#c3f400;margin-bottom:6px">⭐ PRODUCTOS ESTRELLA</div>
        ${estrella}
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#ffb4ab;margin-bottom:6px">🐕 SIN ROTACIÓN</div>
        ${perro}
      </div>`);
  },

  _cardComparativa(comp, ticket, margen) {
    if (!comp) return this._card('Comparativa Sedes', '🏆', '<p style="color:#8e9379;font-size:13px">Sin datos.</p>', true);
    const { lanus, belgrano, ganadorSemana } = comp;
    const maxNeto = Math.max(Math.abs(lanus?.netoTotal || 0), Math.abs(belgrano?.netoTotal || 0), 1);

    return this._card('Comparativa Lanús vs Belgrano', '🏆', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        ${[{d: lanus, label:'Lanús'},{d: belgrano, label:'Belgrano'}].map(({d, label}) => `
          <div style="background:#111319;border-radius:12px;padding:14px;border:1.5px solid ${ganadorSemana===label?'#c3f400':'#1e1f26'}">
            <div style="font-size:12px;font-weight:700;color:${ganadorSemana===label?'#c3f400':'#8e9379'};margin-bottom:8px">${ganadorSemana===label?'🏆':''} ${label}</div>
            <div style="font-size:22px;font-weight:800;color:#e2e2eb;font-family:Lexend">${fmt.money(d?.netoTotal||0)}</div>
            <div style="font-size:11px;color:#8e9379;margin-top:4px">Ing: ${fmt.money(d?.totalIngresos||0)} · Eg: ${fmt.money(d?.totalEgresos||0)}</div>
            ${this._bar(d?.share||0)}
            <div style="font-size:10px;color:#8e9379;margin-top:3px">${d?.share||0}% del total del sistema</div>
          </div>`).join('')}
      </div>
      ${ticket ? `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
        <div style="background:#111319;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8e9379;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Ticket Promedio</div>
          <div style="font-size:18px;font-weight:800;color:#c3f400;font-family:Lexend">${fmt.money(ticket.ticketPromedio)}</div>
        </div>
        <div style="background:#111319;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8e9379;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Solo Cancha</div>
          <div style="font-size:18px;font-weight:800;color:#e2e2eb;font-family:Lexend">${fmt.money(ticket.ticketSoloCancha)}</div>
        </div>
        <div style="background:#111319;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#8e9379;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Buffet Extra</div>
          <div style="font-size:18px;font-weight:800;color:#bdf4ff;font-family:Lexend">${fmt.money(ticket.ticketBuffetExtra)}</div>
        </div>
      </div>` : ''}
      ${margen?.margenPromedio ? `
      <div style="margin-top:12px;background:rgba(195,244,0,.06);border:1px solid rgba(195,244,0,.2);border-radius:10px;padding:12px;font-size:13px">
        📈 Margen promedio buffet: <strong style="color:#c3f400">${margen.margenPromedio}%</strong>
        ${margen.estrellaMargen ? ` · Mejor producto: <strong style="color:#e2e2eb">${margen.estrellaMargen.item} (${margen.estrellaMargen.margen}%)</strong>` : ''}
      </div>` : ''}`, true);
  }
};

// Estilos para botón activo
const _rpStyle = document.createElement('style');
_rpStyle.textContent = `.rp-active { background: rgba(195,244,0,.15); color: #c3f400; border: 1.5px solid #c3f400; }`;
document.head.appendChild(_rpStyle);
