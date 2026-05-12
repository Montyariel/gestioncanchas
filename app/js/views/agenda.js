// ===== VISTA: AGENDA =====
const AgendaView = {
  currentDate: new Date(),

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Inject required styles if not present
    if (!document.getElementById('agenda-styles')) {
      const style = document.createElement('style');
      style.id = 'agenda-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(25, 27, 34, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .time-grid {
            display: grid;
            gap: 12px;
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="flex-1 overflow-hidden flex flex-col lg:flex-row gap-gutter h-full">
        <!-- Left/Center Canvas: Calendar Grid -->
        <div class="flex-1 flex flex-col bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden shadow-lg relative h-full">
          <!-- Filters & Controls Header -->
          <div class="p-md border-b border-surface-container-high flex justify-between items-center bg-surface z-10 flex-wrap gap-4">
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
          
          <div id="agendaContent" class="flex-1 flex flex-col overflow-hidden relative">
            <div class="p-10 text-center"><div class="skeleton" style="height:400px;border-radius:12px"></div></div>
          </div>
        </div>

        <!-- Right Canvas: Booking Details Sidebar (Bento Style) -->
        <aside class="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-md hidden" id="agendaSidebar">
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

      // Generate hours from 17:00 to 23:00 (or based on turnos)
      let horas = [...new Set(turnos.map(t => t.hora))].sort();
      if (!horas.length) {
        horas = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
      }

      // Dynamic grid columns based on number of canchas
      const gridCols = `80px repeat(${canchas.length}, minmax(180px, 1fr))`;

      let html = `
        <!-- Grid Header (Courts) -->
        <div class="time-grid px-md py-sm bg-surface-container-low border-b border-surface-container-high sticky top-0 z-20" style="grid-template-columns: ${gridCols}; min-width: max-content;">
          <div class="font-label-caps text-label-caps text-on-surface-variant flex items-center justify-end pr-sm">HORA</div>
          ${canchas.map(c => `
            <div class="font-label-caps text-label-caps text-on-surface text-center py-2 bg-surface-container rounded-md border-t border-outline-variant flex flex-col">
              <span>${c.nombre}</span>
              <span class="text-[10px] text-on-surface-variant mt-1">${fmt.money(c.precio)}</span>
            </div>
          `).join('')}
        </div>

        <!-- Scrollable Grid Body -->
        <div class="flex-1 overflow-auto p-md relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-background to-background">
          <!-- Actual Content Grid -->
          <div class="time-grid relative" style="grid-template-columns: ${gridCols}; min-width: max-content;">
            
            <!-- Timeline Column -->
            <div class="flex flex-col gap-sm">
              ${horas.map(hora => `
                <div class="h-24 flex items-start justify-end pr-sm text-on-surface-variant font-label-caps text-label-caps">${hora}</div>
              `).join('')}
            </div>

            <!-- Court Columns -->
            ${canchas.map(c => `
              <div class="relative flex flex-col gap-sm">
                ${horas.map(hora => {
                  const turno = turnos.find(t => t.hora === hora && t.cancha_id === c.id);
                  if (!turno) {
                    return `<div class="h-24 rounded-lg border border-surface-container-highest bg-surface opacity-50"></div>`;
                  }
                  
                  if (turno.reservado) {
                    return `
                      <div class="h-24 rounded-lg bg-surface-container-high border-l-4 border-error p-sm flex flex-col cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden group" onclick="AgendaView.showBookingDetails(${turno.id}, '${c.nombre}', '${hora}', '${turno.cliente_nombre || 'Sin Nombre'}', ${c.precio})">
                        <div class="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent pointer-events-none"></div>
                        <div class="flex justify-between items-start mb-xs relative z-10">
                          <span class="font-label-caps text-label-caps text-error bg-error/10 px-2 py-1 rounded">RESERVADO</span>
                          <span class="font-label-caps text-label-caps text-on-surface-variant">${hora}</span>
                        </div>
                        <h4 class="font-body-md font-medium text-on-surface relative z-10 truncate">${turno.cliente_nombre || 'Sin Nombre'}</h4>
                        <button class="absolute bottom-2 right-2 text-xs bg-error/20 text-error px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20" onclick="event.stopPropagation(); AgendaView.cancelar(${turno.id})">Cancelar</button>
                      </div>
                    `;
                  } else {
                    return `
                      <div onclick="App.openReservaModal(${turno.id}, '${c.nombre}', '${hora}', ${c.precio || 0})" class="h-24 rounded-lg border border-surface-container-highest bg-surface hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors flex items-center justify-center group shadow-sm">
                        <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl">add</span>
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
      <div class="glass-panel rounded-xl p-md shadow-2xl relative overflow-hidden group mt-4 lg:mt-0">
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div class="flex justify-between items-start mb-md relative z-10">
          <div>
            <h3 class="font-h3 text-h3 text-on-surface tracking-tight mb-xs">${canchaNombre}</h3>
            <p class="font-label-caps text-label-caps text-error bg-error/10 px-2 py-1 rounded inline-block border border-error/20">RESERVADO</p>
          </div>
          <span class="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-full">sports_soccer</span>
        </div>
        
        <div class="grid grid-cols-2 gap-sm mb-md relative z-10">
          <div class="bg-surface-container-low p-sm rounded-lg border border-surface-container-high">
            <span class="block font-label-caps text-label-caps text-on-surface-variant mb-1">DATE</span>
            <span class="font-body-md font-medium text-on-surface">${this.currentDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div class="bg-surface-container-low p-sm rounded-lg border border-surface-container-high">
            <span class="block font-label-caps text-label-caps text-on-surface-variant mb-1">TIME</span>
            <span class="font-body-md font-medium text-on-surface">${hora}</span>
          </div>
        </div>
        
        <div class="bg-surface-container-lowest rounded-xl p-md border border-surface-container-high mt-4 relative z-10">
          <h4 class="font-body-lg text-body-lg font-semibold text-on-surface mb-2 flex items-center gap-xs">
            <span class="material-symbols-outlined text-[20px] text-primary">person</span>
            Customer Details
          </h4>
          <p class="font-body-md text-on-surface-variant font-bold text-lg">${clienteNombre}</p>
        </div>
        
        <div class="border-t border-outline-variant/30 pt-md mt-4 relative z-10 flex justify-between items-end">
          <div>
            <span class="block font-label-caps text-label-caps text-on-surface-variant mb-xs">COURT PRICE</span>
            <span class="font-stat-number text-stat-number text-primary">${fmt.money(precio)}</span>
          </div>
        </div>

        <button onclick="AgendaView.cancelar(${turnoId})" class="w-full mt-6 bg-transparent border border-error text-error font-body-md font-semibold py-3 rounded-lg hover:bg-error/10 transition-colors flex justify-center items-center gap-xs">
          <span class="material-symbols-outlined text-[20px]">cancel</span>
          Cancelar Reserva
        </button>
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
  }
};

