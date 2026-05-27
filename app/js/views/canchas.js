// ===== VISTA: CANCHAS (MAQUETA VISUAL 3D & ADMINISTRACIÓN) =====
const CanchasView = {
  currentView: localStorage.getItem('canchaos_canchas_view') || '3d', // '3d' o 'lista'
  selectedCanchaId: null,

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    this.selectedCanchaId = null; // reset selection

    // Inyectar estilos premium si no existen
    if (!document.getElementById('canchas-3d-styles')) {
      const style = document.createElement('style');
      style.id = 'canchas-3d-styles';
      style.textContent = `
        .glass-panel {
          background: rgba(25, 27, 34, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stadium-scene {
          perspective: 1200px;
          perspective-origin: 50% 20%;
          overflow: visible;
        }
        .stadium-field {
          transform: rotateX(32deg) rotateY(-4deg) rotateZ(-3deg);
          transform-style: preserve-3d;
          background: radial-gradient(circle, #0f2d1e 0%, #06130b 100%);
          border: 4px solid #1e293b;
          box-shadow: 0 35px 80px rgba(0,0,0,0.8), inset 0 0 50px rgba(0,0,0,0.9);
          position: relative;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .stadium-field:hover {
          transform: rotateX(28deg) rotateY(-2deg) rotateZ(-2deg);
        }
        .cancha-3d-box {
          transform-style: preserve-3d;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .cancha-3d-box.selected {
          transform: translateZ(25px) scale(1.03) !important;
          box-shadow: 0 25px 50px rgba(0,0,0,0.8), 0 0 25px rgba(195,244,0,0.6);
          border-color: #c3f400 !important;
        }
        .cancha-3d-box:hover:not(.selected) {
          transform: translateZ(12px) scale(1.01);
          box-shadow: 0 18px 35px rgba(0,0,0,0.7), 0 0 15px rgba(195,244,0,0.25);
        }
        /* Surfaces Styling */
        .surface-futbol {
          background: linear-gradient(to right, #14532d 50%, #15803d 50%);
          background-size: 30px 100%;
          border: 2px solid rgba(255,255,255,0.45);
          box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
        }
        .surface-padel {
          background: radial-gradient(circle, #0284c7 20%, #1e3a8a 95%);
          border: 2px solid #00daf3;
          box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 0 10px rgba(0, 218, 243, 0.25);
        }
        .surface-parquet {
          background: repeating-linear-gradient(45deg, #ca8a04, #ca8a04 8px, #a16207 8px, #a16207 16px);
          border: 2px solid #fef08a;
          box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        /* LED Status Indicator */
        .led-indicator {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .led-indicator-green {
          background: #c3f400;
          box-shadow: 0 0 8px #c3f400;
        }
        .led-indicator-red {
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
        }
        .led-indicator-orange {
          background: #f97316;
          box-shadow: 0 0 8px #f97316;
          animation: ledBlink 1.5s infinite alternate;
        }
        @keyframes ledBlink {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        /* Tab active neón */
        .tab-active {
          background: rgba(195,244,0,0.1) !important;
          color: #c3f400 !important;
          border-color: #c3f400 !important;
          font-weight: bold;
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 class="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size:32px">stadium</span>
              Instalaciones 🏟️
            </h1>
            <p class="text-on-surface-variant font-medium mt-1">Configuración física, tipo de superficies y estados de cancha · Sede ${sucursal.charAt(0).toUpperCase()+sucursal.slice(1)}</p>
          </div>
          
          <!-- View switcher Tabs -->
          <div class="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button onclick="CanchasView.selectView('3d')" id="tabView3d" class="px-4 py-2 text-xs rounded-lg text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-1.5 border border-transparent">
              <span class="material-symbols-outlined text-[16px]">3d_rotation</span> Maqueta 3D
            </button>
            <button onclick="CanchasView.selectView('lista')" id="tabViewLista" class="px-4 py-2 text-xs rounded-lg text-slate-400 hover:text-slate-200 transition-all uppercase tracking-wider font-semibold cursor-pointer flex items-center gap-1.5 border border-transparent">
              <span class="material-symbols-outlined text-[16px]">view_list</span> Vista Lista
            </button>
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          
          <!-- LEFT CANVAS: Layout render area -->
          <div class="flex-1 glass-panel rounded-3xl border border-outline-variant/30 overflow-hidden flex flex-col p-6 relative bg-slate-950/20 shadow-2xl">
            <div class="shrink-0 mb-4 flex justify-between items-center">
              <h2 id="leftPanelTitle" class="text-lg font-bold text-white flex items-center gap-2">
                <!-- Title injected dynamically -->
              </h2>
              <span id="canchasCountBadge" class="text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider">
                <!-- Counts injected -->
              </span>
            </div>
            
            <div class="flex-1 min-h-0 overflow-y-auto flex items-center justify-center relative p-4" id="canchasRenderArea">
              <!-- Grid or 3D Maquette loaded here -->
            </div>
          </div>

          <!-- RIGHT CANVAS: Bento Administration Sidebar -->
          <aside class="w-full lg:w-[350px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto" id="canchasSidebar">
            <!-- Sidebar Bento box content injected dynamically -->
          </aside>

        </div>
      </div>
    `;

    // Highlight active view tab
    document.getElementById('tabView3d').classList.toggle('tab-active', this.currentView === '3d');
    document.getElementById('tabViewLista').classList.toggle('tab-active', this.currentView === 'lista');

    await this.loadCanchasData(sucursal);
  },

  selectView(viewType) {
    this.currentView = viewType;
    localStorage.setItem('canchaos_canchas_view', viewType);
    this.render(App.state.sucursal);
  },

  async loadCanchasData(sucursal) {
    const renderArea = document.getElementById('canchasRenderArea');
    const sidebar = document.getElementById('canchasSidebar');
    if (!renderArea || !sidebar) return;

    renderArea.innerHTML = `<div class="p-10 text-center w-full"><div class="skeleton h-80 w-full rounded-2xl"></div></div>`;
    sidebar.innerHTML = `<div class="skeleton h-96 w-full rounded-2xl"></div>`;

    try {
      const canchas = await DB.getCanchas(sucursal);
      const fecha = fmt.dateISO();
      
      const turnosPorCancha = {};
      for (const c of canchas) {
        turnosPorCancha[c.id] = await DB.getTurnosByCancha(c.id, fecha);
      }

      // Update badge counts
      const countsBadge = document.getElementById('canchasCountBadge');
      if (countsBadge) {
        countsBadge.textContent = `${canchas.length} Instalaciones`;
      }

      if (!canchas.length) {
        renderArea.innerHTML = `
          <div class="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            <span class="material-symbols-outlined text-5xl text-slate-600 mb-4">stadium</span>
            <p class="text-white font-bold text-lg mb-1">No hay canchas cargadas crack</p>
            <p class="text-slate-500 text-xs leading-normal">Cargá canchas en Supabase para habilitar tu complejo.</p>
          </div>
        `;
        sidebar.innerHTML = `
          <div class="glass-panel rounded-2xl p-5 border border-slate-800 text-slate-500 text-xs text-center">
            Ninguna cancha seleccionada.
          </div>
        `;
        return;
      }

      // Inyectar título del panel
      document.getElementById('leftPanelTitle').innerHTML = this.currentView === '3d'
        ? `<span class="material-symbols-outlined text-[#c3f400]">3d_rotation</span> Maqueta Táctica 3D`
        : `<span class="material-symbols-outlined text-[#c3f400]">view_list</span> Lista de Instalaciones`;

      if (this.currentView === '3d') {
        this.render3DMaquette(canchas, turnosPorCancha, renderArea);
      } else {
        this.renderListView(canchas, turnosPorCancha, renderArea);
      }

      // Cargar sidebar inicial (seleccionar primera cancha automáticamente)
      this.selectCancha(canchas[0].id, canchas, turnosPorCancha);

    } catch (e) {
      console.error(e);
      App.toast('Error al renderizar canchas: ' + e.message, 'error');
    }
  },

  render3DMaquette(canchas, turnos, container) {
    container.innerHTML = `
      <div class="stadium-scene w-full max-w-lg h-96 flex items-center justify-center p-2">
        <div class="stadium-field w-full h-[280px] rounded-3xl p-6 flex items-center justify-center gap-6 border-[3px] border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-visible">
          <!-- White pitch lines simulation -->
          <div class="absolute inset-4 border border-white/5 pointer-events-none rounded-xl"></div>
          <div class="absolute inset-y-4 left-1/2 -translate-x-1/2 border-l border-white/5 pointer-events-none"></div>
          <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/5 pointer-events-none"></div>

          ${canchas.map(c => {
            const list = turnos[c.id] || [];
            const libres = list.filter(t => !t.reservado).length;
            const estado = c.status === 'maintenance' ? 'maintenance' : (libres > 0 ? 'available' : 'occupied');

            let surfClass = 'surface-futbol';
            const tipoLower = (c.tipo || c.type || 'futbol').toLowerCase();
            if (tipoLower.includes('padel') || tipoLower.includes('pádel')) surfClass = 'surface-padel';
            else if (tipoLower.includes('basket') || tipoLower.includes('basquet') || tipoLower.includes('parquet')) surfClass = 'surface-parquet';

            let ledClass = 'led-indicator-green';
            if (estado === 'occupied') ledClass = 'led-indicator-red';
            else if (estado === 'maintenance') ledClass = 'led-indicator-orange';

            return `
              <div onclick="CanchasView.clickCancha3d(${c.id})" 
                id="cancha3d-${c.id}" 
                class="cancha-3d-box flex-1 h-[210px] rounded-2xl relative flex flex-col items-center justify-end p-4 border border-white/10 ${surfClass} shadow-[0_15px_30px_rgba(0,0,0,0.6)]" 
                style="transform: translateZ(0px);">
                
                <!-- Status LED -->
                <div class="led-indicator ${ledClass}"></div>

                <!-- 3D Stadium Pole Light simulation overlay inside -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/5 rounded-2xl"></div>

                <!-- Text Labels in 3D -->
                <div class="relative z-10 text-center space-y-1">
                  <h4 class="font-black text-xs text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">${c.nombre}</h4>
                  <p class="text-[9px] font-black text-[#c3f400] uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">${c.tipo?.toUpperCase() || 'FÚTBOL'}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderListView(canchas, turnos, container) {
    container.innerHTML = `
      <div class="w-full space-y-3 p-2">
        ${canchas.map(c => {
          const list = turnos[c.id] || [];
          const libres = list.filter(t => !t.reservado).length;
          const total = list.length;
          const ocupados = total - libres;
          const estado = c.status === 'maintenance' ? 'maintenance' : (libres > 0 ? 'available' : 'occupied');

          let statusBadge = '';
          let rowClass = 'border-slate-800/80 hover:border-[#c3f400]/40';

          if (estado === 'available') {
            statusBadge = `<span class="bg-[#c3f400]/10 text-[#c3f400] border border-[#c3f400]/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-[#c3f400] led-pulse-green"></span> Disponible</span>`;
          } else if (estado === 'occupied') {
            statusBadge = `<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-red-400 led-pulse-red"></span> Completo</span>`;
          } else {
            statusBadge = `<span class="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-400 led-pulse-orange"></span> Mantenimiento</span>`;
            rowClass = 'border-orange-500/20 bg-orange-500/5 opacity-80';
          }

          const fillPercent = total ? Math.round((ocupados / total) * 100) : 0;
          const tipo = (c.tipo || c.type || 'futbol').toLowerCase();
          const typeIcon = tipo.includes('padel') || tipo.includes('pádel') ? 'sports_tennis' : 'sports_soccer';

          return `
            <div onclick="CanchasView.clickCancha3d(${c.id})" 
              id="canchaRow-${c.id}" 
              class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border ${rowClass} bg-slate-900/30 hover:bg-slate-900/60 transition-all cursor-pointer group">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 group-hover:border-[#c3f400]/40 transition-colors">
                  <span class="material-symbols-outlined text-slate-400 group-hover:text-[#c3f400] transition-colors">${typeIcon}</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-sm text-white">${c.nombre}</h3>
                    ${statusBadge}
                  </div>
                  <p class="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">${c.tipo || 'Fútbol'} · ${total > 0 ? `${libres} libres de ${total}` : 'Sin horarios hoy'}</p>
                </div>
              </div>

              <div class="flex items-center gap-4 mt-3 sm:mt-0">
                <div class="text-right">
                  <div class="text-sm font-black text-white">${fmt.money(c.precio)}</div>
                  <div class="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Base x Hora</div>
                </div>
                <span class="material-symbols-outlined text-slate-600 group-hover:text-[#c3f400] transition-colors" style="font-size:16px">chevron_right</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  clickCancha3d(canchaId) {
    // Quitar clases seleccionadas de todos los renders
    document.querySelectorAll('.cancha-3d-box').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('[id^="canchaRow-"]').forEach(el => el.classList.remove('border-[#c3f400]', 'bg-slate-900/50'));

    const element3d = document.getElementById(`cancha3d-${canchaId}`);
    if (element3d) element3d.classList.add('selected');

    const elementRow = document.getElementById(`canchaRow-${canchaId}`);
    if (elementRow) {
      elementRow.classList.add('border-[#c3f400]', 'bg-slate-900/50');
    }

    this.selectedCanchaId = canchaId;
    this.refreshSidebar(canchaId);
  },

  async refreshSidebar(canchaId) {
    const sidebar = document.getElementById('canchasSidebar');
    if (!sidebar) return;

    try {
      const sucursal = App.state.sucursal;
      const canchas = await DB.getCanchas(sucursal);
      const cancha = canchas.find(c => c.id === canchaId);
      if (!cancha) return;

      const fecha = fmt.dateISO();
      const turnos = await DB.getTurnosByCancha(canchaId, fecha);
      const libres = turnos.filter(t => !t.reservado).length;
      const total = turnos.length;
      const ocupados = total - libres;
      const fillPercent = total ? Math.round((ocupados / total) * 100) : 0;

      const tipo = (cancha.tipo || 'futbol').toLowerCase();

      sidebar.innerHTML = `
        <!-- BENTO ADMIN CARD 1: Detalle Físico -->
        <div class="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 class="text-sm font-black text-white uppercase tracking-tight">${cancha.nombre}</h3>
              <span class="text-[9px] text-[#c3f400] font-black uppercase tracking-wider">Detalles de Instalación</span>
            </div>
            <span class="material-symbols-outlined text-slate-500 text-lg">admin_panel_settings</span>
          </div>

          <!-- Ocupacion radial progress bar inside info box -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Ocupación Hoy</span>
              <span class="text-lg font-black text-white block mt-0.5">${fillPercent}%</span>
              <div class="w-full bg-slate-950 h-1 mt-2 rounded-full overflow-hidden">
                <div class="bg-[#c3f400] h-full" style="width: ${fillPercent}%"></div>
              </div>
            </div>
            <div class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
              <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Bloques Horarios</span>
              <span class="text-sm font-bold text-white block mt-0.5">${libres} libres / ${total} total</span>
            </div>
          </div>
        </div>

        <!-- BENTO ADMIN CARD 2: Formulario de Reconfiguración de Nico -->
        <div class="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 animate-in fade-in duration-300 shadow-xl">
          <div class="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <span class="material-symbols-outlined text-[#c3f400] text-sm">construction</span>
            <span class="text-xs font-bold text-white uppercase tracking-wider">Ajustar Superficie y Tarifa</span>
          </div>

          <!-- Surface Type Select -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tipo de Superficie</label>
            <select id="editCanchaTipo" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#c3f400] cursor-pointer">
              <option value="futbol" ${tipo === 'futbol' ? 'selected' : ''}>⚽ Césped Sintético (Fútbol)</option>
              <option value="padel" ${tipo === 'padel' ? 'selected' : ''}>🎾 Cristal Templado (Pádel)</option>
              <option value="parquet" ${tipo === 'parquet' ? 'selected' : ''}>🏀 Madera Parquet (Básquet/Salón)</option>
            </select>
          </div>

          <!-- Price Input -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tarifa Base por Hora ($)</label>
            <input type="number" id="editCanchaPrecio" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#c3f400] font-mono font-bold" value="${cancha.precio || 5000}">
          </div>

          <!-- Status toggle -->
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80">
            <div>
              <span class="text-xs font-bold text-white block">Mantenimiento</span>
              <span class="text-[9px] text-slate-500">¿Bloquear reservas por reparaciones?</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="editCanchaMantenimiento" class="sr-only peer" ${cancha.status === 'maintenance' ? 'checked' : ''}>
              <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          <!-- Save Button -->
          <button onclick="CanchasView.saveCanchaSettings(${canchaId})" class="w-full py-3 bg-[#c3f400] text-[#161e00] hover:opacity-90 font-black rounded-xl text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-lg shadow-[#c3f400]/10 cursor-pointer flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-sm font-bold">save</span>
            Guardar Configuración
          </button>
        </div>
      `;

    } catch (e) {
      console.error(e);
      sidebar.innerHTML = `<div class="p-4 text-xs text-red-400">Error: ${e.message}</div>`;
    }
  },

  async selectCancha(canchaId, canchas, turnos) {
    this.clickCancha3d(canchaId);
  },

  async saveCanchaSettings(canchaId) {
    const editTipo = document.getElementById('editCanchaTipo').value;
    const editPrecio = parseFloat(document.getElementById('editCanchaPrecio').value);
    const editMantenimiento = document.getElementById('editCanchaMantenimiento').checked;

    if (isNaN(editPrecio) || editPrecio < 0) {
      App.toast('Ingresá una tarifa base válida crack.', 'error');
      return;
    }

    App.toast('Guardando cambios... 💾', 'info');

    try {
      const nuevoStatus = editMantenimiento ? 'maintenance' : 'active';

      // 1. Persistir tipo de superficie y estado en Supabase
      const { error } = await db.from('canchas')
        .update({ 
          tipo: editTipo,
          precio: editPrecio,
          status: nuevoStatus
        })
        .eq('id', canchaId);

      if (error) throw error;

      // 2. Limpiar cache local de canchas de la sucursal activa
      const sucursal = App.state.sucursal;
      localStorage.removeItem(`canchaos_cache_canchas_${sucursal}`);

      App.toast('🏟️ ¡Instalaciones reconfiguradas! Nico guardó la pizarra. ⚽🔥', 'success');

      // 3. Recargar vista
      await this.render(sucursal);

    } catch (e) {
      console.error(e);
      App.toast('Error al guardar ajustes de cancha: ' + e.message, 'error');
    }
  }
};

// Registrar en window
window.CanchasView = CanchasView;
