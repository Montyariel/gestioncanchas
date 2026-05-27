// ===== VISTA: AGENDA =====
const AgendaView = {
  currentDate: new Date(),

  getSlotPrice(basePrecio, hora) {
    const h = parseInt(hora.split(':')[0], 10);
    if (h >= 19 && h <= 23) {
      return Math.round(basePrecio * 1.20);
    }
    return basePrecio;
  },

  getWeatherIconForHour(horaStr) {
    const h = parseInt(horaStr.split(':')[0], 10);
    const alert = window.currentWeatherAlert || (typeof WeatherService !== 'undefined' ? WeatherService.alertState : null);
    
    if (alert === 'roja') return '⛈️';
    if (alert === 'amarilla') return '🌧️';

    if (typeof WeatherService !== 'undefined' && WeatherService.currentData) {
      const code = WeatherService.currentData.weather_code;
      const meta = WeatherService.getWeatherMeta(code);
      if (h >= 19 || h <= 6) {
        if (meta.emoji === '☀️') return '🌙';
        if (meta.emoji === '🌤️' || meta.emoji === '⛅') return '☁️';
      }
      return meta.emoji;
    }

    if (h >= 19 || h <= 6) return '🌙';
    if (h >= 12 && h <= 17) return '☀️';
    return '⛅';
  },

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Inject required styles if not present
    if (!document.getElementById('agenda-styles')) {
      const style = document.createElement('style');
      style.id = 'agenda-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(20, 22, 28, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: -10px 0 30px rgba(0,0,0,0.5);
        }
        .grass-texture {
            background-color: #1a4731;
            background-image: 
                linear-gradient(90deg, transparent 50%, rgba(255,255,255,.03) 50%),
                linear-gradient(rgba(255,255,255,.01) 50%, transparent 50%);
            background-size: 40px 40px;
            position: relative;
        }
        .grass-texture::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(46, 213, 115, 0.15) 0%, transparent 100%);
            pointer-events: none;
        }
        .time-grid {
            display: grid;
            gap: 12px;
        }
        .reserved-badge {
            background: #2ed573;
            color: #000;
            font-weight: 900;
            font-size: 9px;
            padding: 1px 6px;
            border-radius: 3px;
            text-transform: uppercase;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        .slot-morning {
            background: linear-gradient(135deg, rgba(14, 116, 144, 0.12) 0%, rgba(3, 105, 120, 0.04) 100%);
            border: 1px solid rgba(14, 116, 144, 0.22) !important;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slot-morning:hover {
            background: linear-gradient(135deg, rgba(14, 116, 144, 0.22) 0%, rgba(3, 105, 120, 0.08) 100%) !important;
            border-color: #06b6d4 !important;
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.25);
            transform: translateY(-2px);
        }
        .slot-afternoon {
            background: linear-gradient(135deg, rgba(194, 65, 12, 0.12) 0%, rgba(180, 83, 9, 0.04) 100%);
            border: 1px solid rgba(194, 65, 12, 0.22) !important;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slot-afternoon:hover {
            background: linear-gradient(135deg, rgba(194, 65, 12, 0.22) 0%, rgba(180, 83, 9, 0.08) 100%) !important;
            border-color: #f97316 !important;
            box-shadow: 0 0 15px rgba(249, 115, 22, 0.25);
            transform: translateY(-2px);
        }
        .slot-night {
            background: linear-gradient(135deg, rgba(109, 40, 217, 0.12) 0%, rgba(76, 29, 149, 0.04) 100%);
            border: 1px solid rgba(109, 40, 217, 0.22) !important;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slot-night:hover {
            background: linear-gradient(135deg, rgba(109, 40, 217, 0.22) 0%, rgba(76, 29, 149, 0.08) 100%) !important;
            border-color: #c3f400 !important;
            box-shadow: 0 0 15px rgba(195, 244, 0, 0.3);
            transform: translateY(-2px);
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row gap-gutter h-full">
        <!-- Left/Center Canvas: Calendar Grid -->
        <div class="flex-1 min-w-0 flex flex-col bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden shadow-lg relative h-full">
          <!-- Filters & Controls Header -->
          <div class="p-md border-b border-surface-container-high flex flex-col gap-sm bg-surface z-10">
            <div class="flex justify-between items-center bg-surface flex-wrap gap-4 w-full">
              <div class="flex gap-sm">
                <button class="px-md py-2 rounded-full font-label-caps text-label-caps bg-primary-container text-on-primary-container flex items-center gap-xs shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">check</span>
                  Todas
                </button>
              </div>
              <div class="flex items-center gap-md">
                <div class="flex items-center bg-surface-container rounded-lg border border-outline-variant overflow-hidden">
                  <button onclick="AgendaView.changeDay(-1)" class="p-2 hover:bg-surface-container-highest transition-colors text-on-surface-variant">
                    <span class="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span id="agendaDateLabel" class="px-md font-body-md font-medium text-on-surface"></span>
                  <button onclick="AgendaView.changeDay(1)" class="p-2 hover:bg-surface-container-highest transition-colors text-on-surface-variant">
                    <span class="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
                <button onclick="AgendaView.goToday()" class="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors" title="Ir a hoy">
                  <span class="material-symbols-outlined">calendar_today</span>
                </button>
              </div>
            </div>
            <!-- Transparent Night Surcharge Banner -->
            <div class="bg-primary/5 text-primary border border-primary/20 rounded-lg p-3 text-xs flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
              <span><strong>💡 Tarifas Nocturnas:</strong> Los turnos de 19:00 a 23:00 hs contemplan un +20% por costos de iluminación artificial.</span>
            </div>
            ${window.currentWeatherAlert === 'roja' ? `
              <div class="bg-red-950/40 text-red-400 border border-red-900/50 rounded-lg p-3 text-xs flex items-center justify-between gap-2 animate-pulse mt-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">dangerous</span>
                  <span><strong>⛈️ ALERTA METEOROLÓGICA ROJA:</strong> Tormentas eléctricas severas en Lanús. Te sugerimos reasignar las reservas preventivamente para evitar cancelaciones de último momento.</span>
                </div>
                <button onclick="AgendaView.abrirReasignadorClima()" class="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1 rounded text-[10px] tracking-wide uppercase transition-all shadow-lg active:scale-95">Reasignar Reservas</button>
              </div>
            ` : window.currentWeatherAlert === 'amarilla' ? `
              <div class="bg-amber-950/30 text-amber-400 border border-amber-900/40 rounded-lg p-3 text-xs flex items-center justify-between gap-2 mt-2">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">warning</span>
                  <span><strong>⚠️ ALERTA METEOROLÓGICA AMARILLA:</strong> Lloviznas o vientos fuertes en Lanús. Monitoreá el clima para coordinar con los clientes del bloque actual.</span>
                </div>
                <button onclick="AgendaView.abrirReasignadorClima()" class="bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 py-1 rounded text-[10px] tracking-wide uppercase transition-all shadow-lg active:scale-95">Coordinar Turnos</button>
              </div>
            ` : ''}
          </div>
          
          <div id="agendaContent" class="flex-1 flex flex-col overflow-hidden relative">
            <div class="p-10 text-center"><div class="skeleton" style="height:400px;border-radius:12px"></div></div>
          </div>
        </div>

        <!-- Right Canvas: Booking Details Sidebar (Bento Style) -->
        <aside class="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-md hidden overflow-y-auto pr-1" id="agendaSidebar">
          <!-- Populated dynamically when selecting a slot -->
        </aside>
      </div>
    `;

    this.updateDateLabel();
    await this.loadAgenda(sucursal);
  },

  updateDateLabel() {
    const el = document.getElementById('agendaDateLabel');
    if (el) el.textContent = this.currentDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
  },

  changeDay(delta) {
    this.currentDate.setDate(this.currentDate.getDate() + delta);
    this.updateDateLabel();
    this.loadAgenda(App.state.sucursal);
  },

  goToday() {
    this.currentDate = new Date();
    this.updateDateLabel();
    this.loadAgenda(App.state.sucursal);
  },

  abrirReasignadorClima() {
    App.navigate('reservas');
    App.toast('🔍 Listado de reservas para reasignar por clima.', 'info');
  },

  async loadAgenda(sucursal) {
    const fecha = fmt.dateISO(this.currentDate);
    const content = document.getElementById('agendaContent');
    if (!content) return;

    try {
      const [canchas, turnos] = await Promise.all([
        DB.getCanchas(sucursal),
        DB.getTurnos(sucursal, fecha)
      ]);

      if (!canchas.length) {
        content.innerHTML = `<div class="p-10 flex flex-col items-center justify-center h-full text-center"><div class="text-6xl mb-4">🏟️</div><h3 class="font-h3 text-on-surface">No hay canchas configuradas</h3></div>`;
        return;
      }

      // Generate hours from 14:00 to 23:00 (or based on turnos)
      let horas = [...new Set(turnos.map(t => t.hora))].sort();
      if (!horas.length) {
        horas = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
      }

      // Dynamic grid columns based on number of canchas
      const gridCols = `80px repeat(${canchas.length}, minmax(180px, 1fr))`;

      let html = `
        <!-- Grid Header (Courts) Wrapper for scroll sync -->
        <div class="grid-header-scroll-sync overflow-x-hidden bg-surface-container-low border-b border-surface-container-high sticky top-0 z-20">
          <div class="time-grid px-md py-sm" style="grid-template-columns: ${gridCols}; min-width: max-content;">
            <div class="font-label-caps text-label-caps text-on-surface-variant flex items-center justify-end pr-sm">HORA</div>
            ${canchas.map(c => `
              <div class="font-label-caps text-label-caps text-on-surface text-center py-2 bg-surface-container rounded-md border-t border-outline-variant flex flex-col">
                <span>${c.nombre}</span>
                <span class="text-[10px] text-on-surface-variant mt-1">${fmt.money(c.precio)} base</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Scrollable Grid Body -->
        <div class="grid-body-scroll-sync flex-1 overflow-auto p-md relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-background to-background">
          <!-- Actual Content Grid -->
          <div class="time-grid relative" style="grid-template-columns: ${gridCols}; min-width: max-content;">
            
            <!-- Timeline Column -->
            <div class="flex flex-col gap-sm">
              ${horas.map(hora => {
                const icon = AgendaView.getWeatherIconForHour(hora);
                return `
                <div class="h-24 flex flex-col items-end justify-start pr-sm text-on-surface-variant font-label-caps text-[10px] relative">
                  <span class="font-bold">${hora}</span>
                  <span class="text-xs mt-1.5 opacity-80 cursor-help" title="Pronóstico del clima para las ${hora}">${icon}</span>
                </div>`;
              }).join('')}
            </div>

            <!-- Court Columns -->
            ${canchas.map(c => `
              <div class="relative flex flex-col gap-sm">
                ${horas.map(hora => {
                  const turno = turnos.find(t => t.hora === hora && t.cancha_id === c.id);
                  if (!turno) {
                    return `<div class="h-24 rounded-lg border border-surface-container-highest bg-surface opacity-50"></div>`;
                  }
                  
                  const finalPrecio = AgendaView.getSlotPrice(c.precio, hora);
                  if (turno.reservado) {
                    return `
                      <div class="h-24 rounded-lg grass-texture border-l-4 border-primary p-sm flex flex-col cursor-pointer hover:brightness-110 transition-all relative overflow-hidden group shadow-lg" onclick="AgendaView.showBookingDetails(${turno.id}, '${c.nombre}', '${hora}', '${turno.cliente_nombre || 'Sin Nombre'}', ${finalPrecio})">
                        <div class="flex justify-between items-start mb-xs relative z-10">
                          <span class="reserved-badge">RESERVADO</span>
                          <span class="text-[10px] font-black text-white/50">${hora}</span>
                        </div>
                        <h4 class="font-body-sm font-black text-white relative z-10 truncate drop-shadow-md uppercase tracking-tight">${turno.cliente_nombre || 'Sin Nombre'}</h4>
                        <div class="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-white/30 text-sm">info</span>
                        </div>
                      </div>
                    `;
                  } else {
                    const hNum = parseInt(hora.split(':')[0], 10);
                    let slotClass = '';
                    let accentColor = '';
                    let accentLabel = '';
                    if (hNum >= 8 && hNum <= 12) {
                      slotClass = 'slot-morning';
                      accentColor = 'text-cyan-400';
                      accentLabel = 'Matutino 🌅';
                    } else if (hNum >= 13 && hNum <= 18) {
                      slotClass = 'slot-afternoon';
                      accentColor = 'text-amber-500';
                      accentLabel = 'Soleado ☀️';
                    } else {
                      slotClass = 'slot-night';
                      accentColor = 'text-[#c3f400]';
                      accentLabel = 'Premium 🌙';
                    }

                    return `
                      <div onclick="App.openReservaModal(${turno.id}, '${c.nombre.replace(/'/g, "\\'")}', '${hora}', ${finalPrecio})" 
                        class="h-24 rounded-xl cursor-pointer ${slotClass} flex items-center justify-center group shadow-sm relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out"></div>
                        <div class="flex flex-col items-center z-10">
                          <span class="material-symbols-outlined ${accentColor} text-xl group-hover:scale-110 transition-transform duration-300">add_circle</span>
                          <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-300 transition-colors">${accentLabel}</span>
                          <span class="text-[10px] font-black text-white mt-0.5">${fmt.money(finalPrecio)}</span>
                        </div>
                      </div>
                    `;
                  }
                }).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      content.innerHTML = html;

      // Sincronizar el scroll horizontal del header con el del body
      const headerScroll = content.querySelector('.grid-header-scroll-sync');
      const bodyScroll = content.querySelector('.grid-body-scroll-sync');
      if (headerScroll && bodyScroll) {
        bodyScroll.addEventListener('scroll', () => {
          headerScroll.scrollLeft = bodyScroll.scrollLeft;
        });
      }
      document.getElementById('agendaSidebar').classList.add('hidden');
    } catch(e) {
      App.toast('Error cargando agenda: ' + e.message, 'error');
    }
  },

  showBookingDetails(turnoId, canchaNombre, hora, clienteNombre, precio) {
    const sidebar = document.getElementById('agendaSidebar');
    sidebar.classList.remove('hidden');
    
    sidebar.innerHTML = `
      <!-- Selected Slot Summary Card -->
      <div class="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group mt-4 lg:mt-0 animate-slide-in h-fit">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex justify-between items-start mb-5 relative z-10">
          <div class="max-w-[70%]">
            <h3 class="text-xl font-black text-white tracking-tighter mb-1 italic uppercase leading-none">${canchaNombre}</h3>
            <span class="reserved-badge">TURNO OCUPADO 🏟️</span>
          </div>
          <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-2xl">stadium</span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-5 relative z-10">
          <div class="bg-white/5 p-3 rounded-xl border border-white/10">
            <span class="block text-[9px] font-black text-slate-500 uppercase mb-1">Fecha</span>
            <span class="text-md font-bold text-white">${this.currentDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div class="bg-white/5 p-3 rounded-xl border border-white/10">
            <span class="block text-[9px] font-black text-slate-500 uppercase mb-1">Horario</span>
            <span class="text-md font-bold text-white">${hora} HS</span>
          </div>
        </div>
        
        <div class="bg-primary/5 rounded-xl p-4 border border-primary/20 mb-5 relative z-10">
          <h4 class="text-[9px] font-black text-primary uppercase mb-1 flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">person</span>
            DETALLES DEL CLIENTE
          </h4>
          <p class="text-xl font-black text-white truncate">${clienteNombre}</p>
        </div>
        
        <div class="flex justify-between items-center mb-6 px-1">
          <div>
            <span class="block text-[9px] font-black text-slate-500 uppercase">VALOR DEL TURNO</span>
            <span class="text-2xl font-black text-primary">${fmt.money(precio)}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
            <button onclick="AgendaView.generarLink('${canchaNombre}', '${hora}', ${precio})" class="w-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 font-bold py-3 rounded-xl hover:bg-cyan-500 hover:text-dark transition-all flex justify-center items-center gap-2 text-sm">
              <span class="material-symbols-outlined text-md">link</span>
              GENERAR LINK MP
            </button>
            <button onclick="AgendaView.cancelar(${turnoId})" class="w-full bg-red-500/10 border border-red-500/40 text-red-500 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all flex justify-center items-center gap-2 text-sm">
              <span class="material-symbols-outlined text-md">cancel</span>
              CANCELAR TURNO
            </button>
        </div>
      </div>
    `;
  },

  async cancelar(turnoId) {
    if (!confirm('¿Cancelar este turno?')) return;
    try {
      await DB.cancelarTurno(turnoId);
      App.toast('Turno cancelado ✅', 'success');
      document.getElementById('agendaSidebar').classList.add('hidden');
      await this.loadAgenda(App.state.sucursal);
    } catch(e) {
      App.toast('Error: ' + e.message, 'error');
    }
  },

  async generarLink(cancha, hora, precio) {
    try {
      App.toast('Generando link de pago...', 'info');
      const response = await fetch('/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Turno: ${cancha} (${hora})`,
          price: precio || 5000,
          quantity: 1
        })
      });
      const data = await response.json();
      
      if (data.init_point) {
        const link = data.init_point;
        navigator.clipboard.writeText(link).then(() => {
          App.toast('¡Link copiado! 📋', 'success');
        });
        const win = window.open(link, '_blank');
        if (!win) prompt('Copiá el link, crack:', link);
      } else {
        throw new Error('Error en API de Mercado Pago');
      }
    } catch (err) {
      App.toast('Error: ' + err.message, 'error');
    }
  }
};
