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
            <button onclick="ReportesView._setPeriodo(30)" id="btn30d" class="rp-btn px-4 py-2 rounded-lg text-sm font-bold transition-all border border-slate-700 text-slate-400 hover:border-[#10B981] hover:text-[#10B981]">30 días</button>
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
    document.getElementById('btn7d').className  = d===7  ? 'rp-btn rp-active px-4 py-2 rounded-lg text-sm font-bold' : 'rp-btn px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 text-slate-400 hover:border-[#10B981] hover:text-[#10B981] transition-all';
    document.getElementById('btn30d').className = d===30 ? 'rp-btn rp-active px-4 py-2 rounded-lg text-sm font-bold' : 'rp-btn px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 text-slate-400 hover:border-[#10B981] hover:text-[#10B981] transition-all';
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

  _bar(pct, color = '#10B981') {
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
          <span style="color:#10B981;font-weight:700">${fmt.money(c.ingresos)}</span>
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
      const color = h.pct >= 80 ? '#10B981' : h.pct >= 40 ? '#f59e0b' : '#ffb4ab';
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
      `<div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:10px;margin-bottom:14px;font-size:13px">
        🔥 Hora pico: <strong style="color:#10B981">${pico?.hora}</strong> — ${pico?.pct}% de ocupación
      </div>${rows}`);
  },

  _cardBalance(data) {
    if (!data) return this._card('Balance Financiero', '💰', '<p style="color:#8e9379;font-size:13px">Sin datos.</p>');
    const { totalIngresos, totalEgresos, netoTotal, promedioDiario, dias } = data;
    const color = netoTotal >= 0 ? '#10B981' : '#ffb4ab';
    const maxVal = Math.max(...dias.map(d => Math.max(d.ingresos, d.egresos)), 1);
    const chartBars = dias.slice(-7).map(d => {
      const hI = Math.round((d.ingresos / maxVal) * 80);
      const hE = Math.round((d.egresos  / maxVal) * 80);
      const dia = d.fecha?.slice(-5) || '';
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">
        <div style="display:flex;gap:2px;align-items:flex-end;height:80px">
          <div style="width:8px;height:${hI}px;background:#10B981;border-radius:3px 3px 0 0" title="Ingresos"></div>
          <div style="width:8px;height:${hE}px;background:#ffb4ab;border-radius:3px 3px 0 0" title="Egresos"></div>
        </div>
        <span style="font-size:9px;color:#8e9379">${dia}</span>
      </div>`;
    }).join('');

    return this._card('Balance Financiero', '💰', `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">INGRESOS</div><div style="font-size:20px;font-weight:800;color:#10B981;font-family:Lexend">${fmt.money(totalIngresos)}</div></div>
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">EGRESOS</div><div style="font-size:20px;font-weight:800;color:#ffb4ab;font-family:Lexend">${fmt.money(totalEgresos)}</div></div>
        <div><div style="font-size:11px;color:#8e9379;margin-bottom:2px">NETO</div><div style="font-size:20px;font-weight:800;font-family:Lexend;color:${color}">${fmt.money(netoTotal)}</div></div>
      </div>
      <div style="display:flex;gap:4px;align-items:flex-end;height:90px;padding:0 4px;margin-bottom:6px">${chartBars}</div>
      <div style="display:flex;gap:12px;font-size:11px;color:#8e9379">
        <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:#10B981;border-radius:2px;display:inline-block"></span>Ingresos</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;background:#ffb4ab;border-radius:2px;display:inline-block"></span>Egresos</span>
        <span style="margin-left:auto">Prom/día: <strong style="color:#e2e2eb">${fmt.money(promedioDiario)}</strong></span>
      </div>`);
  },

  _cardVips(vips, abandon) {
    const vipRows = (vips || []).slice(0, 5).map((c, i) =>
      `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #1e1f26">
        <div style="width:28px;height:28px;border-radius:50%;background:rgba(16,185,129,.1);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#10B981">${c.rank}</div>
        <div style="flex:1"><div style="font-size:13px;font-weight:600;color:#e2e2eb">${c.nombre}</div></div>
        <div style="text-align:right"><div style="font-size:12px;font-weight:700;color:#10B981">${c.reservas} reservas</div><div style="font-size:11px;color:#8e9379">${fmt.money(c.gasto)}</div></div>
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
        <span style="color:#10B981">⭐ ${p.item}</span>
        <span style="color:#8e9379">${p.vendasPeriodo} ventas · ${fmt.money(p.precio_venta)}</span>
      </div>`).join('') || '<div style="font-size:12px;color:#8e9379">Sin ventas registradas</div>';

    const perro = (perros || []).slice(0, 3).map(p =>
      `<div style="display:flex;justify-content:space-between;font-size:12px;padding:5px 0;border-bottom:1px solid #1e1f26">
        <span style="color:#ffb4ab">🐕 ${p.item}</span>
        <span style="color:#8e9379">Stock: ${p.cantidad} · Sin ventas</span>
      </div>`).join('') || '<div style="font-size:12px;color:#8e9379">Sin productos sin rotación 🎉</div>';

    return this._card('Buffet: Estrella vs Perros', '🌭', `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#10B981;margin-bottom:6px">⭐ PRODUCTOS ESTRELLA</div>
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

    // Inyectar estilos para comparativa premium y 3D
    if (!document.getElementById('reportes-comparison-styles')) {
      const style = document.createElement('style');
      style.id = 'reportes-comparison-styles';
      style.textContent = `
        @keyframes vsPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(16,185,129,0.3); border-color: #10B981; }
            50% { transform: scale(1.1); box-shadow: 0 0 24px rgba(16,185,129,0.7); border-color: #00e3fd; }
        }
        @keyframes sweep {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        @keyframes gridMove {
            0% { background-position: 0 0; }
            100% { background-position: 30px 30px; }
        }
        .hologram-card-active {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(17,19,25,0.95));
            border: 2px solid rgba(16,185,129,0.3) !important;
            box-shadow: 0 12px 36px -8px rgba(16,185,129,0.12);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hologram-card-active::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent);
            transform: skewX(-25deg);
            animation: sweep 4s infinite linear;
        }
        .hologram-card-active:hover {
            transform: translateY(-4px);
            border-color: rgba(16,185,129,0.6) !important;
            box-shadow: 0 20px 48px -10px rgba(16,185,129,0.22);
        }
        .hologram-card-inactive {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba(30,41,59,0.04), rgba(17,19,25,0.85));
            border: 1.5px solid rgba(255,255,255,0.05) !important;
            opacity: 0.75;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hologram-card-inactive::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 0), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 0);
            background-size: 15px 15px;
            animation: gridMove 20s linear infinite;
            pointer-events: none;
        }
        .hologram-card-inactive:hover {
            opacity: 0.9;
            border-color: rgba(255,255,255,0.15) !important;
        }
        .vs-badge-glow {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: #080a0f;
            border: 2.5px solid #10B981;
            color: #10B981;
            font-family: 'Lexend', sans-serif;
            font-size: 10px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(16,185,129,0.4);
            animation: vsPulse 3s infinite ease-in-out;
            z-index: 10;
        }
        .energy-bar-3d {
            height: 14px;
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 9999px;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.6);
        }
        .energy-fill-glow {
            height: 100%;
            border-radius: 9999px;
            background: linear-gradient(90deg, #10B981, #34D399, #10B981);
            background-size: 200% 200%;
            animation: progressGlow 2.5s infinite linear;
            box-shadow: 0 0 10px rgba(16,185,129,0.5);
            transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .energy-fill-muted {
            height: 100%;
            border-radius: 9999px;
            background: #334155;
            transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .energy-fill-empty {
            height: 100%;
            border-radius: 9999px;
            background: #1e2029;
        }
        .metallic-widget {
            background: linear-gradient(180deg, #181920, #0f1014);
            border: 1px solid rgba(255,255,255,0.04);
            box-shadow: 0 8px 24px -6px rgba(0,0,0,0.5);
            transition: all 0.3s ease;
        }
        .metallic-widget:hover {
            border-color: rgba(255,255,255,0.08);
            transform: translateY(-2px);
        }
      `;
      document.head.appendChild(style);
    }

    const renderingLanusActive = (lanus?.netoTotal || 0) > 0;
    const renderingBelgranoActive = (belgrano?.netoTotal || 0) > 0;

    return this._card('Comparativa Lanús vs Belgrano', '🏆', `
      <!-- Hologram VS Combat Panel -->
      <div class="relative flex flex-col md:flex-row gap-5 items-stretch justify-between mb-6">
        
        <!-- Tarjeta Lanús -->
        <div class="flex-1 rounded-3xl p-5 ${renderingLanusActive ? 'hologram-card-active' : 'hologram-card-inactive'} flex flex-col justify-between min-h-[195px]">
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-black tracking-widest ${renderingLanusActive ? 'text-[#10B981]' : 'text-slate-500'} uppercase">Sede Lanús</span>
              ${ganadorSemana === 'Lanús' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#10B981]/25 text-[#10B981]">🏆 SEDE GANADORA</span>' : ''}
            </div>
            <h2 class="text-3xl font-black font-stat-number tracking-tighter text-white mt-2 flex items-baseline gap-0.5">
              ${fmt.money(lanus?.netoTotal || 0)}
            </h2>
            <p class="text-[10px] text-slate-500 font-mono">Ingresos: ${fmt.money(lanus?.totalIngresos || 0)} • Egresos: ${fmt.money(lanus?.totalEgresos || 0)}</p>
          </div>

          <div class="space-y-1.5 mt-4">
            <div class="flex justify-between items-center text-[9px] font-bold text-slate-400">
              <span>CUOTA DE MERCADO</span>
              <span class="${renderingLanusActive ? 'text-[#10B981]' : 'text-slate-500'}">${lanus?.share || 0}% del total</span>
            </div>
            <div class="energy-bar-3d">
              <div class="${renderingLanusActive ? 'energy-fill-glow' : 'energy-fill-muted'}" style="width: ${lanus?.share || 0}%"></div>
            </div>
          </div>
        </div>

        <!-- VS Divider Badge -->
        <div class="hidden md:flex items-center justify-center vs-divider pointer-events-none">
          <div class="vs-badge-glow">VS</div>
        </div>

        <!-- Tarjeta Belgrano -->
        <div class="flex-1 rounded-3xl p-5 ${renderingBelgranoActive ? 'hologram-card-active' : 'hologram-card-inactive'} flex flex-col justify-between min-h-[195px]">
          <div class="space-y-1">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-black tracking-widest ${renderingBelgranoActive ? 'text-[#10B981]' : 'text-slate-500'} uppercase">Sede Belgrano</span>
              ${ganadorSemana === 'Belgrano' ? '<span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#10B981]/25 text-[#10B981]">🏆 SEDE GANADORA</span>' : ''}
              ${!renderingBelgranoActive ? '<span class="text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 tracking-wider">💤 EN REPOSO</span>' : ''}
            </div>
            <h2 class="text-3xl font-black font-stat-number tracking-tighter text-white mt-2 flex items-baseline gap-0.5">
              ${fmt.money(belgrano?.netoTotal || 0)}
            </h2>
            <p class="text-[10px] text-slate-500 font-mono">Ingresos: ${fmt.money(belgrano?.totalIngresos || 0)} • Egresos: ${fmt.money(belgrano?.totalEgresos || 0)}</p>
          </div>

          <div class="space-y-1.5 mt-4">
            <div class="flex justify-between items-center text-[9px] font-bold text-slate-400">
              <span>CUOTA DE MERCADO</span>
              <span class="${renderingBelgranoActive ? 'text-[#10B981]' : 'text-slate-500'}">${belgrano?.share || 0}% del total</span>
            </div>
            <div class="energy-bar-3d">
              <div class="${renderingBelgranoActive ? 'energy-fill-glow' : 'energy-fill-empty'}" style="width: ${belgrano?.share || 0}%"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- Métricas del Ticket Promedio y Buffet con diseño metálico -->
      ${ticket ? `
      <div class="grid grid-cols-3 gap-3">
        <div class="metallic-widget rounded-2xl p-3 text-center">
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Ticket Promedio</p>
          <p class="text-md font-black text-[#10B981] font-stat-number">${fmt.money(ticket.ticketPromedio)}</p>
        </div>
        <div class="metallic-widget rounded-2xl p-3 text-center">
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Solo Cancha</p>
          <p class="text-md font-black text-white font-stat-number">${fmt.money(ticket.ticketSoloCancha)}</p>
        </div>
        <div class="metallic-widget rounded-2xl p-3 text-center">
          <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Buffet Extra</p>
          <p class="text-md font-black text-[#00e3fd] font-stat-number">${fmt.money(ticket.ticketBuffetExtra)}</p>
        </div>
      </div>` : ''}

      ${margen?.margenPromedio ? `
      <div class="mt-4 bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl p-3 flex items-center justify-between text-xs transition-all hover:bg-[#10B981]/10">
        <span class="flex items-center gap-1.5 font-medium"><span class="text-base">📈</span> Margen promedio buffet: <strong class="text-[#10B981]">${margen.margenPromedio}%</strong></span>
        ${margen.estrellaMargen ? `<span class="text-slate-500 text-[10px]">Mejor producto: <strong class="text-white font-bold">${margen.estrellaMargen.item} (${margen.estrellaMargen.margen}%)</strong></span>` : ''}
      </div>` : ''}`, true);
  }
};

// Estilos para botón activo
const _rpStyle = document.createElement('style');
_rpStyle.textContent = `.rp-active { background: rgba(16,185,129,.15); color: #10B981; border: 1.5px solid #10B981; }`;
document.head.appendChild(_rpStyle);
