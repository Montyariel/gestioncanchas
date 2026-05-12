// ===== VISTA: DASHBOARD — Dark Theme Stitch =====
const DashboardView = {
  async render(sucursal) {
    const fecha = fmt.dateISO();
    const container = document.getElementById('viewContainer');

    const dayName = new Date().toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    container.innerHTML = `
      <!-- Welcome Banner -->
      <section class="grid grid-cols-1 gap-6 mb-8">
        <div class="bg-surface-container-low rounded-xl p-10 relative overflow-hidden border border-surface-container-highest shadow-lg flex items-center justify-between">
          <div class="relative z-10">
            <h1 class="font-h1 text-h1 text-on-surface mb-2">¡Buen día! 👋</h1>
            <p class="font-body-lg text-body-lg text-on-surface-variant">Resumen de hoy — ${dayName}</p>
          </div>
          <div class="hidden md:block absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary-fixed/10 to-transparent"></div>
          <button onclick="App.navigate('agenda')" class="relative z-10 hidden md:flex items-center gap-2 py-3 px-5 rounded-lg font-bold text-sm transition-opacity hover:opacity-90" style="background:#c3f400;color:#161e00">
            <span class="material-symbols-outlined" style="font-size:18px">calendar_month</span>
            Ver Agenda
          </button>
        </div>
      </section>

      <!-- Stats Cards -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="metricsGrid">
        ${[1,2,3,4].map(()=>`<div class="bg-surface-container rounded-xl p-6 border-t border-surface-container-highest"><div class="skeleton" style="height:80px"></div></div>`).join('')}
      </section>

      <!-- Bento Layout -->
      <section class="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8" id="dashBottom">
        <div class="col-span-1 md:col-span-8 bg-surface-container rounded-xl p-8 border-t border-surface-container-highest">
          <div class="skeleton" style="height:240px"></div>
        </div>
        <div class="col-span-1 md:col-span-4 bg-surface-container rounded-xl p-6 border-t border-surface-container-highest">
          <div class="skeleton" style="height:240px"></div>
        </div>
      </section>

      <!-- Happy Hour -->
      <div id="happyHourSection"></div>`;

    try {
      const m = await DB.getMetrics(sucursal, fecha);

      document.getElementById('metricsGrid').innerHTML = `
        <div class="bg-surface-container rounded-xl p-6 border-t border-surface-container-highest shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:rgba(195,244,0,.1)">
              <span class="material-symbols-outlined" style="color:#c3f400;font-size:20px">sports_soccer</span>
            </div>
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8e9379">CANCHAS</span>
          </div>
          <div style="font-size:28px;font-weight:700;color:#c3f400;font-family:Lexend,sans-serif;letter-spacing:-0.02em">${m.canchas}</div>
          <p style="font-size:13px;color:#8e9379;margin-top:6px">Canchas activas — ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}</p>
        </div>
        <div class="bg-surface-container rounded-xl p-6 border-t border-surface-container-highest shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:rgba(0,218,243,.1)">
              <span class="material-symbols-outlined" style="color:#00daf3;font-size:20px">bolt</span>
            </div>
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8e9379">OCUPACIÓN</span>
          </div>
          <div style="font-size:28px;font-weight:700;color:#e2e2eb;font-family:Lexend,sans-serif">${m.ocupacion}<span style="font-size:16px;color:#8e9379">%</span></div>
          <p style="font-size:13px;color:#8e9379;margin-top:6px">${m.ocupados} ocupados · ${m.libres} libres</p>
        </div>
        <div class="bg-surface-container rounded-xl p-6 border-t border-surface-container-highest shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:rgba(195,244,0,.1)">
              <span class="material-symbols-outlined" style="color:#c3f400;font-size:20px">payments</span>
            </div>
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8e9379">INGRESOS</span>
          </div>
          <div style="font-size:22px;font-weight:700;color:#e2e2eb;font-family:Lexend,sans-serif">${fmt.money(m.ingresos)}</div>
          <p style="font-size:13px;color:#8e9379;margin-top:6px">${m.egresos > 0 ? 'Gastos: ' + fmt.money(m.egresos) : 'Sin gastos hoy'}</p>
        </div>
        <div class="bg-surface-container rounded-xl p-6 border-t border-surface-container-highest shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background:rgba(255,180,171,.1)">
              <span class="material-symbols-outlined" style="color:#ffb4ab;font-size:20px">inventory_2</span>
            </div>
            <span style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8e9379">STOCK BAJO</span>
          </div>
          <div style="font-size:28px;font-weight:700;font-family:Lexend,sans-serif;color:${m.stockAlertas>0?'#ffb4ab':'#e2e2eb'}">${m.stockAlertas}</div>
          <p style="font-size:13px;margin-top:6px;color:${m.stockAlertas>0?'#ffb4ab':'#8e9379'}">${m.stockAlertas > 0 ? '⚠️ Reponer pronto' : '✅ Stock OK'}</p>
        </div>`;

      // Turnos del día
      const turnos = await DB.getTurnos(sucursal, fecha);
      const proximos = turnos.filter(t => !t.reservado).slice(0, 6);
      const ocupados = turnos.filter(t => t.reservado).slice(0, 6);

      document.getElementById('dashBottom').innerHTML = `
        <!-- Próximos libres -->
        <div class="col-span-1 md:col-span-8 bg-surface-container rounded-xl p-8 border-t border-surface-container-highest shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 style="font-size:22px;font-weight:700;color:#e2e2eb">🟢 Turnos disponibles hoy</h2>
              <p style="font-size:14px;color:#8e9379;margin-top:4px">Hacé click en Reservar para asignar un cliente</p>
            </div>
            <button onclick="App.navigate('agenda')" style="padding:8px 16px;border-radius:8px;border:1.5px solid #444933;background:transparent;color:#c4c9ac;font-size:13px;font-weight:600;cursor:pointer">Ver Agenda</button>
          </div>
          ${proximos.length ? `
          <div style="display:flex;flex-direction:column;gap:0">
            ${proximos.map(t => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #333;transition:.2s">
                <div style="display:flex;align-items:center;gap:14px">
                  <div style="width:44px;height:44px;border-radius:10px;background:rgba(195,244,0,.08);border:1px solid rgba(195,244,0,.2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#c3f400">${t.hora?.substring(0,5)||'—'}</div>
                  <div>
                    <div style="font-weight:700;font-size:14px;color:#e2e2eb">${t.canchas?.nombre || 'Cancha'}</div>
                    <div style="font-size:12px;color:#8e9379">${fmt.money(t.canchas?.precio)}/hora</div>
                  </div>
                </div>
                <button onclick="App.openReservaModal(${t.id}, '${(t.canchas?.nombre||'Cancha').replace(/'/g,"\\'")}', '${t.hora}', ${t.canchas?.precio || 0})"
                  style="padding:8px 16px;border-radius:8px;background:#c3f400;color:#161e00;font-size:13px;font-weight:700;cursor:pointer">
                  + Reservar
                </button>
              </div>`).join('')}
          </div>` : `
          <div style="text-align:center;padding:48px 20px;color:#8e9379">
            <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:12px;display:block">check_circle</span>
            <p style="font-size:16px;font-weight:600;color:#c4c9ac">Sin turnos libres hoy</p>
          </div>`}
        </div>

        <!-- Actividad reciente -->
        <div class="col-span-1 md:col-span-4 bg-surface-container rounded-xl p-6 border-t border-surface-container-highest shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div class="flex items-center justify-between mb-6">
            <h3 style="font-size:16px;font-weight:700;color:#e2e2eb">🔴 Ocupados hoy</h3>
            <button onclick="App.navigate('reservas')" style="font-size:12px;color:#c3f400;background:none;border:none;cursor:pointer;font-weight:600">Ver todos</button>
          </div>
          ${ocupados.length ? `
          <div style="display:flex;flex-direction:column;gap:16px">
            ${ocupados.map(t => `
              <div style="display:flex;gap:12px">
                <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,180,171,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-symbols-outlined" style="color:#ffb4ab;font-size:16px">lock</span>
                </div>
                <div>
                  <p style="font-weight:600;font-size:14px;color:#e2e2eb">${t.canchas?.nombre || 'Cancha'} — ${t.hora}</p>
                  <p style="font-size:13px;color:#c4c9ac">${t.cliente_nombre || 'Sin nombre'}</p>
                </div>
              </div>`).join('')}
          </div>` : `
          <div style="text-align:center;padding:32px 0;color:#8e9379">
            <span class="material-symbols-outlined" style="font-size:36px;display:block;margin-bottom:8px">event_available</span>
            <p style="font-size:14px">Sin reservas aún</p>
          </div>`}
        </div>`;

      // Happy Hour analysis
      this.renderHappyHour(sucursal, turnos);

      // Badge stock sidebar
      const badgeStock = document.getElementById('badge-stock');
      if (badgeStock) badgeStock.style.display = m.stockAlertas > 0 ? 'inline-flex' : 'none';

    } catch(e) {
      container.innerHTML += `<div style="padding:20px;color:#ffb4ab;background:rgba(255,180,171,.1);border-radius:12px;border:1px solid rgba(255,180,171,.2)">
        <strong>Error cargando dashboard:</strong> ${e.message}
      </div>`;
      console.error('Dashboard error:', e);
    }
  },

  renderHappyHour(sucursal, turnos) {
    const section = document.getElementById('happyHourSection');
    if (!section || !turnos.length) return;

    const horarios = {};
    turnos.forEach(t => {
      if (!horarios[t.hora]) horarios[t.hora] = { total: 0, ocupados: 0 };
      horarios[t.hora].total++;
      if (t.reservado) horarios[t.hora].ocupados++;
    });

    const flojos = Object.entries(horarios)
      .map(([hora, d]) => ({ hora, pct: Math.round((d.ocupados / d.total) * 100), libre: d.total - d.ocupados }))
      .filter(h => h.pct < 40)
      .sort((a, b) => a.pct - b.pct);

    if (!flojos.length) {
      section.innerHTML = `
        <div style="background:rgba(195,244,0,.06);border:1px solid rgba(195,244,0,.2);border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px">
          <span style="font-size:36px">🔥</span>
          <div>
            <div style="font-weight:800;font-size:16px;color:#c3f400">¡Excelente ocupación hoy!</div>
            <div style="font-size:13px;color:#8e9379;margin-top:4px">Todos los horarios tienen más del 40% de ocupación. ¡Sos un crack, Ariel!</div>
          </div>
        </div>`;
      return;
    }

    section.innerHTML = `
      <div style="background:#1e1f26;border:1px solid #444933;border-radius:14px;padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
          <span style="font-size:15px;font-weight:700;color:#f59e0b;display:flex;align-items:center;gap:8px">
            <span class="material-symbols-outlined" style="font-size:20px">bolt</span>
            Análisis Happy Hour — Puntos Flojos
          </span>
          <span style="background:rgba(245,158,11,.15);color:#f59e0b;font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px">${flojos.length} horario${flojos.length>1?'s':''} con baja ocupación</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:18px">
          ${flojos.map(h => `
            <div style="background:#111319;border:1px solid #444933;border-radius:12px;padding:14px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:18px;font-weight:800;color:#e2e2eb">${h.hora?.substring(0,5)||h.hora}</span>
                <span style="background:rgba(245,158,11,.15);color:#f59e0b;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px">${h.pct}%</span>
              </div>
              <div style="height:6px;background:#333;border-radius:10px;overflow:hidden">
                <div style="height:100%;width:${h.pct}%;background:#f59e0b;border-radius:10px"></div>
              </div>
              <div style="font-size:12px;color:#8e9379;margin-top:6px">${h.libre} lugar${h.libre>1?'es':''} libre${h.libre>1?'s':''}</div>
            </div>`).join('')}
        </div>
        <div style="background:rgba(245,158,11,.06);border-radius:12px;padding:16px;border:1.5px dashed rgba(245,158,11,.3)">
          <div style="font-weight:700;font-size:14px;color:#f59e0b;margin-bottom:8px">💡 Estrategia Happy Hour para Ariel:</div>
          <div style="font-size:13px;color:#c4c9ac;line-height:1.7">
            ${flojos.map(h => `• <strong style="color:#e2e2eb">${h.hora?.substring(0,5)||h.hora}</strong>: Solo ${h.pct}% ocupado. Propuesta: <em>Cancha + 6 Aguas al costo</em>.`).join('<br>')}
          </div>
          <button onclick="App.navigate('buffet')" style="margin-top:12px;padding:8px 16px;border-radius:8px;background:#c3f400;color:#161e00;font-size:13px;font-weight:700;cursor:pointer">
            📦 Ver stock para el combo
          </button>
        </div>
      </div>`;
  }
};
