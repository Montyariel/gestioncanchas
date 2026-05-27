// ===== VISTA: DASHBOARD — Dark Theme Stitch Premium v4.0 =====
function getSlotPrice(precioBase, hora) {
  const base = Number(precioBase) || 15000;
  if (!hora) return base;
  const horaNum = parseInt(hora.split(':')[0], 10);
  if (horaNum >= 19 && horaNum <= 23) {
    return Math.round(base * 1.20);
  }
  return base;
}

const DashboardView = {
  async render(sucursal) {
    const fecha = fmt.dateISO();
    const container = document.getElementById('viewContainer');

    const dayName = new Date().toLocaleDateString('es-AR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    // Inyectar estilos CSS exclusivos con animaciones premium
    if (!document.getElementById('dashboard-styles')) {
      const style = document.createElement('style');
      style.id = 'dashboard-styles';
      style.textContent = `
        @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .glow-banner {
            background: linear-gradient(135deg, #161a24, #262e3d, #111319);
            background-size: 200% 200%;
            animation: gradientMove 8s ease infinite;
        }
        .glow-card {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glow-card:hover {
            transform: translateY(-5px);
            border-color: rgba(195, 244, 0, 0.3) !important;
            box-shadow: 0 16px 36px -12px rgba(195, 244, 0, 0.18);
        }
        .glow-card-blue:hover {
            transform: translateY(-5px);
            border-color: rgba(0, 218, 243, 0.3) !important;
            box-shadow: 0 16px 36px -12px rgba(0, 218, 243, 0.18);
        }
        .glow-card-red:hover {
            transform: translateY(-5px);
            border-color: rgba(255, 180, 171, 0.3) !important;
            box-shadow: 0 16px 36px -12px rgba(255, 180, 171, 0.18);
        }
        .cancha-led-ping {
            animation: ledPing 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ledPing {
            75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        .fill-bar {
            transition: width 1.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .radial-progress-svg {
            transform: rotate(-90deg);
        }
        .radial-circle {
            transition: stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        /* 3D Pitch Styles */
        .pitch-3d {
          position: relative;
          background: radial-gradient(circle, #2d6b38 20%, #1e4d26 90%);
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 12px;
          transform: perspective(700px) rotateX(28deg);
          transform-style: preserve-3d;
          box-shadow: 0 15px 35px rgba(0,0,0,0.6);
        }
        .pitch-3d-center-line {
          position: absolute;
          top: 0; bottom: 0; left: 50%;
          width: 2px;
          background: rgba(255,255,255,0.2);
          transform: translateX(-50%);
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <!-- Welcome Banner con Gradiente Animado y Facha -->
      <section class="grid grid-cols-1 gap-6 mb-8 animate-in fade-in duration-500">
        <div class="glow-banner rounded-3xl p-8 relative overflow-hidden border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="relative z-10 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="text-xs bg-[#c3f400]/15 text-[#c3f400] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">MODO GURÚ ACTIVO 🧠</span>
              <span class="w-1.5 h-1.5 rounded-full bg-[#c3f400] animate-pulse"></span>
            </div>
            <h1 class="font-h1 text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">¡Qué hacés, Ariel crack! 👋</h1>
            <p class="text-slate-400 text-xs md:text-sm font-medium">El estadio de ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'} está listo. Hoy es <strong class="text-white">${dayName}</strong></p>
          </div>
          <div class="hidden lg:block absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-[#c3f400]/5 to-transparent pointer-events-none"></div>
          <button onclick="App.navigate('agenda')" class="relative z-10 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shrink-0 shadow-lg shadow-[#c3f400]/10 cursor-pointer border-none" style="background:#c3f400;color:#161e00">
            <span class="material-symbols-outlined text-sm font-bold">calendar_month</span>
            Abrir Agenda Semanal
          </button>
        </div>
      </section>

      <!-- Weather Impact & Nico automated suggestions -->
      <div id="weatherAlertContainer" class="animate-in fade-in duration-500"></div>

      <!-- Grid de Métricas Principales (Stats Cards) con efecto Glow en Hover -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="metricsGrid">
        ${[1,2,3,4].map(()=>`
          <div class="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/80">
            <div class="skeleton" style="height:76px"></div>
          </div>`).join('')}
      </section>

      <!-- LIVE TACTICAL 3D PITCH (stadium complex representation) -->
      <div id="tacticalPitchContainer" class="animate-in fade-in duration-500"></div>

      <!-- Dashboard Bento Grid con Widgets Destacados y Modernos -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="dashBottom">
        <!-- Turnos Libres (8 columnas) -->
        <div class="col-span-1 lg:col-span-8 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80">
          <div class="skeleton" style="height:260px"></div>
        </div>
        <!-- Termómetro Radial de Nico (4 columnas) -->
        <div class="col-span-1 lg:col-span-4 bg-slate-900/40 rounded-3xl p-6 border border-slate-800/80">
          <div class="skeleton" style="height:260px"></div>
        </div>
      </section>

      <!-- Happy Hour Section -->
      <div id="happyHourSection" class="animate-in slide-in-from-bottom-6 duration-500"></div>`;

    try {
      const m = await DB.getMetrics(sucursal, fecha);

      // Inyectar Métricas Principales con efectos hover
      document.getElementById('metricsGrid').innerHTML = `
        <!-- Card Canchas -->
        <div class="glow-card bg-[#111319]/70 rounded-2xl p-5 border border-slate-800/80 shadow-lg">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-[#c3f400]/10 border border-[#c3f400]/20">
              <span class="material-symbols-outlined text-md font-bold text-[#c3f400]">sports_soccer</span>
            </div>
            <span class="text-[9px] font-black tracking-widest text-slate-500 uppercase">Canchas</span>
          </div>
          <div class="text-3xl font-black text-[#c3f400] font-stat-number tracking-tighter">${m.canchas}</div>
          <p class="text-[10px] text-slate-500 mt-2 font-medium">Complejos en ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}</p>
        </div>

        <!-- Card Ocupación -->
        <div class="glow-card-blue bg-[#111319]/70 rounded-2xl p-5 border border-slate-800/80 shadow-lg">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00daf3]/10 border border-[#00daf3]/20">
              <span class="material-symbols-outlined text-md font-bold text-[#00daf3]">bolt</span>
            </div>
            <span class="text-[9px] font-black tracking-widest text-slate-500 uppercase">Ocupación</span>
          </div>
          <div class="text-3xl font-black text-white font-stat-number tracking-tighter flex items-baseline gap-0.5">
            ${m.ocupacion}<span class="text-sm font-bold text-slate-500">%</span>
          </div>
          <p class="text-[10px] text-slate-500 mt-2 font-medium">${m.ocupados} reservados · ${m.libres} libres</p>
        </div>

        <!-- Card Ingresos -->
        <div class="glow-card bg-[#111319]/70 rounded-2xl p-5 border border-slate-800/80 shadow-lg">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-[#c3f400]/10 border border-[#c3f400]/20">
              <span class="material-symbols-outlined text-md font-bold text-[#c3f400]">payments</span>
            </div>
            <span class="text-[9px] font-black tracking-widest text-slate-500 uppercase">Ingresos Neto</span>
          </div>
          <div class="text-xl md:text-2xl font-black text-white font-stat-number tracking-tighter">${fmt.money(m.ingresos)}</div>
          <p class="text-[10px] text-slate-500 mt-2 font-medium">${m.egresos > 0 ? 'Caja: ' + fmt.money(m.egresos) + ' egresos' : 'Sin egresos cargados'}</p>
        </div>

        <!-- Card Stock Bajo -->
        <div class="glow-card-red bg-[#111319]/70 rounded-2xl p-5 border border-slate-800/80 shadow-lg">
          <div class="flex items-center gap-2.5 mb-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
              <span class="material-symbols-outlined text-md font-bold text-red-400">inventory_2</span>
            </div>
            <span class="text-[9px] font-black tracking-widest text-slate-500 uppercase">Alertas Stock</span>
          </div>
          <div class="text-3xl font-black font-stat-number tracking-tighter ${m.stockAlertas > 0 ? 'text-red-400' : 'text-slate-300'}">${m.stockAlertas}</div>
          <p class="text-[10px] mt-2 font-medium ${m.stockAlertas > 0 ? 'text-red-400 animate-pulse font-bold' : 'text-slate-500'}">
            ${m.stockAlertas > 0 ? '⚠️ Reponer panchos buffet' : '✅ Stock abastecido'}
          </p>
        </div>`;

      // Cargar Turnos
      const turnos = await DB.getTurnos(sucursal, fecha);
      const proximos = turnos.filter(t => !t.reservado).slice(0, 5);
      
      // Renderizar Alertas del Clima de Nico
      this.renderWeatherAlertBanner(sucursal);

      // Renderizar el Táctico de Canchas 3D en Vivo
      await this.renderTacticalPitch(sucursal, turnos);

      // Bento Layout inferior
      document.getElementById('dashBottom').innerHTML = `
        <!-- WIDGET 1: Canchas Libres & Ocupación en Vivo (8 columnas) -->
        <div class="col-span-1 lg:col-span-8 bg-[#111319]/65 rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col min-h-0 justify-between">
          <div class="flex items-start justify-between mb-4 flex-shrink-0">
            <div>
              <h2 class="text-lg font-black text-white italic flex items-center gap-2 uppercase tracking-tight">🟢 Turnos Disponibles hoy</h2>
              <p class="text-xs text-slate-500 mt-0.5">Asigná reservas en un click o cargá combos especiales de buffet</p>
            </div>
            <button onclick="App.navigate('agenda')" class="text-[10px] font-black uppercase px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:border-slate-700 transition-all cursor-pointer border-none">
              Ver Grilla Completa
            </button>
          </div>

          ${proximos.length ? `
          <!-- Lista de turnos interactivos -->
          <div class="flex-1 overflow-y-auto space-y-2.5 max-h-[320px] pr-1 scroll-smooth">
            ${proximos.map(t => {
              const precioSlot = getSlotPrice(t.canchas?.precio || 15000, t.hora);
              return `
              <div class="flex items-center justify-between p-3.5 bg-slate-950/30 rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all duration-300 group">
                <div class="flex items-center gap-3.5 min-w-0">
                  <div class="w-11 h-11 rounded-xl bg-[#c3f400]/10 border border-[#c3f400]/20 flex items-center justify-center font-black text-xs text-[#c3f400] shrink-0 group-hover:scale-105 transition-transform duration-300">
                    ${t.hora?.substring(0,5)||'—'}
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <h4 class="font-bold text-xs text-white truncate">${t.canchas?.nombre || 'Cancha'}</h4>
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 cancha-led-ping"></span>
                    </div>
                    <p class="text-[10px] text-slate-500 mt-0.5 font-mono">${fmt.money(precioSlot)}/hora • ${t.canchas?.tipo || 'Cancha'}</p>
                  </div>
                </div>
                <button onclick="App.openReservaModal(${t.id}, '${(t.canchas?.nombre||'Cancha').replace(/'/g,"\\'")}', '${t.hora}', ${precioSlot})"
                  class="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-fixed text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-[#c3f400]/5 flex items-center gap-1 border-none font-body-md">
                  Reservar <span class="material-symbols-outlined text-[10px] font-bold">add</span>
                </button>
              </div>`;
            }).join('')}
          </div>` : `
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <span class="material-symbols-outlined text-4xl text-slate-700 mb-2">sports_score</span>
            <h4 class="text-sm font-bold text-slate-400">¡Impresionante ocupación!</h4>
            <p class="text-[10px] text-slate-600">No hay turnos libres en Lanús para lo que queda del día.</p>
          </div>`}
        </div>

        <!-- WIDGET 2: El Termómetro de Nico (Progreso Circular Animado - 4 columnas) -->
        <div class="col-span-1 lg:col-span-4 bg-[#111319]/65 rounded-3xl p-6 border border-slate-800/80 shadow-xl flex flex-col items-center justify-between min-h-[360px]">
          <div class="w-full text-left shrink-0">
            <h3 class="text-sm font-black text-white italic uppercase tracking-wider">🌡️ Termómetro Reservas</h3>
            <p class="text-[10px] text-slate-500 mt-0.5">Estado térmico del complejo hoy</p>
          </div>

          <!-- SVG Radial Progress -->
          <div class="relative w-40 h-40 flex items-center justify-center shrink-0 my-4 animate-in zoom-in-95 duration-500">
            <svg class="radial-progress-svg" width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="56" fill="transparent" stroke="#1e2029" stroke-width="12"></circle>
              <circle class="radial-circle" cx="70" cy="70" r="56" fill="transparent" 
                stroke="${m.ocupacion < 40 ? '#f59e0b' : '#c3f400'}" stroke-width="12" 
                stroke-dasharray="351.8" 
                stroke-dashoffset="${351.8 - (351.8 * m.ocupacion) / 100}"
                stroke-linecap="round">
              </circle>
            </svg>
            <div class="absolute text-center">
              <span class="text-3xl font-black font-stat-number text-white">${m.ocupacion}%</span>
              <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Reservado</p>
            </div>
          </div>

          <!-- Nico Comentando el Termómetro -->
          <div class="w-full bg-[#0c0e14]/50 border border-slate-800 rounded-2xl p-3.5 text-center shrink-0">
            <p class="text-[10px] font-black text-[#c3f400] uppercase tracking-wider mb-1">🤖 Estado del Complejo:</p>
            <p class="text-[11px] text-slate-400 italic">
              ${m.ocupacion < 40 
                ? `"Che Ariel crack, el termómetro está frío (${m.ocupacion}%). ¡Nos metieron en el área! Abajo te dejé un plan Happy Hour listo para levantar las canchas al toque. ¡Activalo ya!"` 
                : m.ocupacion < 80 
                  ? `"¡Lindo partido estamos jugando! El complejo está templado y a buen ritmo. A seguir metiéndole que hoy ganamos caminando."`
                  : `"¡EXPLOTA EL ESTADIO CRACK! 🔥 100% de ocupación. La caja arde y los pibes están delirando de alegría. ¡A facturar!"`
              }
            </p>
          </div>
        </div>`;

      // Renderizar Análisis Happy Hour (Puntos Flojos)
      this.renderHappyHour(sucursal, turnos);

      // Badge stock en la barra lateral
      const badgeStock = document.getElementById('badge-stock');
      if (badgeStock) {
        badgeStock.style.display = m.stockAlertas > 0 ? 'inline-flex' : 'none';
      }

    } catch(e) {
      container.innerHTML += `
        <div class="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl mt-6 text-center space-y-2">
          <span class="material-symbols-outlined text-4xl">sports_alert</span>
          <h4 class="font-bold">Error cargando el Dashboard Premium</h4>
          <p class="text-xs text-slate-500">${e.message}</p>
        </div>`;
      console.error('Dashboard premium error:', e);
    }
  },

  renderWeatherAlertBanner(sucursal) {
    const alertBox = document.getElementById('weatherAlertContainer');
    if (!alertBox) return;

    const alert = window.currentWeatherAlert || (typeof WeatherService !== 'undefined' ? WeatherService.alertState : null);
    
    if (alert === 'roja') {
      alertBox.innerHTML = `
        <div class="bg-gradient-to-br from-red-950/40 to-slate-900/60 border border-red-500/30 rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-5"><span class="material-symbols-outlined text-[100px]">thunderstorm</span></div>
          <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl shadow-xl shrink-0">⛈️</div>
          <div class="text-left space-y-1.5">
            <h4 class="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5 font-h3 italic">
              <span class="material-symbols-outlined text-sm animate-pulse">dangerous</span> ALERTA METEOROLÓGICA CRÍTICA
            </h4>
            <p class="text-slate-300 text-xs md:text-sm font-medium">Nico dice: <span class="italic text-red-300 font-bold">"🚨 ¡ATENCIÓN ARIEL CRACK! Tormenta eléctrica inminente en Lanús. Usemos el WhatsApp Link preventivamente para suspender o mudar turnos al aire libre. ¡Seguridad ante todo, campeón! 🏟️🌩️"</span></p>
          </div>
        </div>`;
    } else if (alert === 'amarilla') {
      alertBox.innerHTML = `
        <div class="bg-gradient-to-br from-amber-950/40 to-slate-900/60 border border-amber-500/30 rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-5"><span class="material-symbols-outlined text-[100px]">rainy</span></div>
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl shadow-xl shrink-0">🌧️</div>
          <div class="text-left space-y-1.5">
            <h4 class="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 font-h3 italic">
              <span class="material-symbols-outlined text-sm">warning</span> ALERTA DE CLIMA LLUVIA
            </h4>
            <p class="text-slate-300 text-xs md:text-sm font-medium">Nico dice: <span class="italic text-amber-300 font-bold">"⚠️ ¡Ojo al dato Ariel crack! Se detectaron lluvias leves/moderadas en Lanús. ¿Por qué no mandás un WhatsApp rápido ofreciendo la Cancha Techada a los del turno siguiente o les regalamos unas Gatorades si se mojan jugando? ¡Que no decaiga el picado! 🌧️⚽"</span></p>
          </div>
        </div>`;
    } else {
      alertBox.innerHTML = `
        <div class="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl mb-8 flex flex-col md:flex-row items-center gap-5 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-5"><span class="material-symbols-outlined text-[100px]">sunny</span></div>
          <div class="w-14 h-14 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-4xl shadow-xl shrink-0">☀️</div>
          <div class="text-left space-y-1.5">
            <h4 class="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-h3 italic">
              <span class="material-symbols-outlined text-sm">check_circle</span> CONDICIÓN CLIMÁTICA EXCELENTE
            </h4>
            <p class="text-slate-300 text-xs md:text-sm font-medium">Nico dice: <span class="italic text-emerald-300 font-bold">"☀️ ¡Clima impecable en la zona, Ariel! Temperatura ideal para el picado. Las canchas al aire libre van a volar de reservas hoy. ¡A romperla crack! 🏟️🏆"</span></p>
          </div>
        </div>`;
    }
  },

  async renderTacticalPitch(sucursal, turnos) {
    const pitchBox = document.getElementById('tacticalPitchContainer');
    if (!pitchBox) return;

    const canchas = await DB.getCanchas(sucursal);
    const currentHour = new Date().getHours();

    const canchasStatusHtml = canchas.map((c, idx) => {
      // Buscar turno de esta cancha en el bloque horario actual
      const turnoActual = turnos.find(t => t.cancha_id === c.id && parseInt(t.hora.split(':')[0]) === currentHour);
      const reservado = turnoActual ? turnoActual.reservado : false;

      let position = '';
      if (idx === 0) position = 'top: 15%; left: 15%;';
      else if (idx === 1) position = 'top: 15%; left: 60%;';
      else if (idx === 2) position = 'top: 52%; left: 15%;';
      else if (idx === 3) position = 'top: 52%; left: 60%;';
      else position = 'top: 33%; left: 38%;'; // Center position for index 4+

      const statusColor = reservado ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-[#c3f400] shadow-[0_0_12px_#c3f400]';
      const statusLabel = reservado ? 'OCUPADA 🔴' : 'LIBRE 🟢';
      
      let actionBtn = '';
      if (!reservado && turnoActual) {
        const price = getSlotPrice(c.precio || 15000, turnoActual.hora);
        actionBtn = `
          <button onclick="App.openReservaModal(${turnoActual.id}, '${c.nombre.replace(/'/g, "\\'")}', '${turnoActual.hora}', ${price}); event.stopPropagation();" 
            class="mt-1.5 px-3 py-1 bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer">
            Reservar
          </button>`;
      }

      return `
      <!-- Cancha 3D Marker -->
      <div class="absolute p-3 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center z-20 hover:scale-105 hover:border-[#c3f400]/40 transition-all" style="width: 120px; ${position}">
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="w-2.5 h-2.5 rounded-full ${statusColor} ${!reservado ? 'cancha-led-ping' : ''}"></span>
          <span class="text-[9px] font-black text-slate-300 uppercase truncate max-w-[85px]">${c.nombre}</span>
        </div>
        <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">${statusLabel}</span>
        ${actionBtn}
      </div>
      `;
    }).join('');

    pitchBox.innerHTML = `
      <!-- LIVE TACTICAL 3D PITCH -->
      <section class="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-[32px] p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 bg-[#c3f400]/5 px-3 py-1 rounded-bl text-[8px] text-[#c3f400] font-mono uppercase tracking-widest border-l border-b border-[#c3f400]/10 z-10">LIVE STADIUM RADAR ACTIVE</div>
        <div class="mb-6">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span class="material-symbols-outlined text-[#c3f400]">stadium</span>
            Táctico de Canchas en Vivo — Complejo ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}
          </h3>
          <p class="text-xs text-slate-500 mt-1">Monitoreo tridimensional de disponibilidad para el bloque horario de las ${currentHour}:00 hs.</p>
        </div>

        <!-- 3D Stadium Field Container -->
        <div class="relative w-full h-[280px] bg-gradient-to-b from-[#0c0e14] to-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
          <!-- 3D Grass Pitch -->
          <div class="pitch-3d relative w-full max-w-[580px] h-[200px]">
            <div class="pitch-3d-center-line"></div>
            <!-- Goal Areas -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 border-b border-l border-r border-white/20"></div>
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-8 border-t border-l border-r border-white/20"></div>
            
            <!-- Canchas Markers placed dynamically -->
            ${canchasStatusHtml}
          </div>
        </div>
      </section>
    `;
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
        <div class="bg-[#c3f400]/5 border border-[#c3f400]/20 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-5">
          <div class="w-14 h-14 rounded-full bg-[#c3f400]/10 flex items-center justify-center text-3xl shadow-xl shadow-[#c3f400]/5 shrink-0">🏆</div>
          <div>
            <h4 class="font-black text-lg text-[#c3f400] italic uppercase tracking-wider">¡OCUPACIÓN PERFECTA, CRACK!</h4>
            <p class="text-slate-400 text-xs mt-1">Todos los horarios del complejo hoy superan el 40% de reservas. Seguimos a paso firme y con la rentabilidad al ángulo. ¡Seguí así, Ariel! ⚽🔥</p>
          </div>
        </div>`;
      return;
    }

    section.innerHTML = `
      <!-- Widget de Happy Hour con estilo Glassmorphism y Glow Naranja -->
      <div class="bg-gradient-to-br from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-[32px] p-6 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <h3 class="text-md font-black text-amber-500 italic flex items-center gap-2 uppercase tracking-wider">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              🔥 ALERTA DE PUNTOS FLOJOS (HAPPY HOUR)
            </h3>
            <p class="text-xs text-slate-500">Detecté franjas horarias desiertas. ¡Vamos a meterle el centro por WhatsApp a los pibes!</p>
          </div>
          <span class="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full self-start md:self-center shrink-0 tracking-wider">
            ${flojos.length} bache${flojos.length > 1 ? 's' : ''} crítico${flojos.length > 1 ? 's' : ''} hoy
          </span>
        </div>
 
        <!-- Bento de tarjetas de baches -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${flojos.map(h => `
            <div class="bg-[#0c0e14]/50 border border-slate-800/80 rounded-2xl p-4 space-y-2 relative overflow-hidden group">
              <div class="flex items-center justify-between">
                <span class="text-lg font-black text-white font-stat-number">${h.hora?.substring(0,5)||h.hora}</span>
                <span class="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-mono">${h.pct}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div class="fill-bar h-full bg-amber-500 rounded-full" style="width: ${h.pct}%"></div>
              </div>
              <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">${h.libre} cancha${h.libre > 1 ? 's' : ''} libre${h.libre > 1 ? 's' : ''}</p>
            </div>`).join('')}
        </div>
 
        <!-- Estrategia de Happy Hour Premium de Nico -->
        <div class="bg-amber-500/5 rounded-2xl p-5 border border-dashed border-amber-500/25 space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">💡</span>
            <h4 class="font-black text-sm text-amber-500 italic uppercase tracking-wider">ESTRATEGIA HAPPY HOUR ARMADA POR NICO</h4>
          </div>
          <div class="text-xs text-slate-400 leading-relaxed space-y-2">
            <p>Ariel crack, hoy las canchas en estos horarios son un desierto. Te armé este plan de contingencia comercial para tirarlo al grupo de WhatsApp Link al toque:</p>
            <div class="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2.5 font-medium">
              ${flojos.map(h => `
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>En el turno de las <strong class="text-white">${h.hora?.substring(0,5)||h.hora} hs</strong>: Cancha + 6 Aguas frías al costo.</span>
                </div>`).join('')}
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-3 pt-1">
            <button onclick="App.navigate('whatsapp')" class="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-amber-500/10 flex items-center gap-1.5 border-none">
              <span class="material-symbols-outlined text-sm font-bold">chat</span>
              Mandar Promo por WhatsApp Link
            </button>
            <button onclick="App.navigate('buffet')" class="px-5 py-3 rounded-xl bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
              Verificar stock buffet
            </button>
          </div>
        </div>
      </div>`;
  }
};
