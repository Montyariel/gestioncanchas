// ===== VISTA: CANCHAS =====
const CanchasView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    if (!document.getElementById('canchas-styles')) {
      const style = document.createElement('style');
      style.id = 'canchas-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(25, 27, 34, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 class="text-3xl font-black text-primary tracking-tight">Instalaciones</h1>
            <p class="text-on-surface-variant font-medium mt-1">Estado en tiempo real · ${sucursal.charAt(0).toUpperCase()+sucursal.slice(1)}</p>
          </div>
          <button class="bg-surface-container border border-outline-variant text-on-surface px-4 py-2 rounded-lg font-bold hover:bg-surface-container-high transition-colors flex items-center gap-2" onclick="App.toast('Modo edición activado', 'info')">
            <span class="material-symbols-outlined icon-fill">edit</span>
            Editar Configuración
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div class="glass-panel rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
            <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
              <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">stadium</span>
                Estado de Canchas
              </h2>
            </div>
            
            <div class="p-6 space-y-4" id="courtsGrid">
              ${[1,2,3,4].map(()=>`<div class="skeleton h-24 w-full rounded-xl"></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const canchas = await DB.getCanchas(sucursal);
      const fecha = fmt.dateISO();
      const grid = document.getElementById('courtsGrid');
      
      if (!canchas.length) {
        grid.innerHTML = `
          <div class="p-12 text-center border border-dashed border-outline-variant rounded-xl bg-surface-container-lowest">
            <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-4">stadium</span>
            <p class="text-on-surface font-medium text-lg mb-2">No hay canchas configuradas</p>
            <p class="text-on-surface-variant text-sm">Agrega instalaciones para comenzar a recibir reservas.</p>
          </div>
        `;
        return;
      }

      const turnosPorCancha = {};
      for (const c of canchas) {
        turnosPorCancha[c.id] = await DB.getTurnosByCancha(c.id, fecha);
      }

      grid.innerHTML = canchas.map(c => {
        const turnos = turnosPorCancha[c.id] || [];
        const libres = turnos.filter(t => !t.reservado).length;
        const total = turnos.length;
        const ocupados = total - libres;
        const estado = c.status === 'maintenance' ? 'maintenance' : (libres > 0 ? 'available' : 'occupied');
        
        let statusBadge = '';
        let rowClass = 'border-outline-variant/30 hover:border-primary/50';
        
        if (estado === 'available') {
          statusBadge = `<span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span> Disponible</span>`;
        } else if (estado === 'occupied') {
          statusBadge = `<span class="bg-error/20 text-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-error"></span> Sin Turnos</span>`;
        } else {
          statusBadge = `<span class="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Mantenimiento</span>`;
          rowClass = 'border-orange-500/30 bg-orange-500/5 opacity-80 hover:border-orange-500/50';
        }

        const tipo = (c.tipo || c.type || 'futbol').toLowerCase();
        const typeIcon = tipo.includes('padel') || tipo.includes('pádel') ? 'sports_tennis' : 'sports_soccer';
        const typeName = tipo.includes('padel') || tipo.includes('pádel') ? 'Pádel' : 'Fútbol';

        const fillPercent = total ? Math.round((ocupados/total)*100) : 0;

        return `
          <div class="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border ${rowClass} bg-surface-container transition-all cursor-pointer group" onclick="App.navigate('agenda')">
            <div class="flex items-center gap-4 mb-4 md:mb-0">
              <div class="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center border border-outline-variant/50 group-hover:border-primary/50 transition-colors">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">${typeIcon}</span>
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="font-bold text-on-surface text-lg">${c.nombre}</h3>
                  ${statusBadge}
                </div>
                <p class="text-sm text-on-surface-variant mt-1 flex items-center gap-2">
                  <span class="uppercase text-[10px] tracking-widest font-bold bg-surface px-2 py-0.5 rounded border border-outline-variant/50">${typeName}</span>
                  ${total > 0 ? `${libres} libres de ${total} hoy` : 'Sin agenda para hoy'}
                </p>
              </div>
            </div>
            
            <div class="flex items-center gap-6 md:w-1/3 justify-between md:justify-end">
              ${total > 0 ? `
              <div class="flex-1 md:max-w-[120px]">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-on-surface-variant font-medium">Ocupación</span>
                  <span class="text-on-surface font-bold">${fillPercent}%</span>
                </div>
                <div class="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-outline-variant/30">
                  <div class="bg-primary h-full rounded-full" style="width: ${fillPercent}%"></div>
                </div>
              </div>` : '<div class="flex-1"></div>'}
              
              <div class="text-right">
                <div class="text-lg font-black text-on-surface">${fmt.money(c.precio)}</div>
                <div class="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Por Hora</div>
              </div>
              
              <button class="w-8 h-8 rounded hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors" onclick="event.stopPropagation(); App.toast('Mantenimiento no implementado', 'info')">
                <span class="material-symbols-outlined text-[18px]">build</span>
              </button>
            </div>
          </div>
        `;
      }).join('');

      const activeCanchas = canchas.filter(c=>c.status!=='maintenance').length;
      const badgeEl = document.getElementById('badge-canchas');
      if(badgeEl) {
          badgeEl.textContent = activeCanchas;
          badgeEl.style.display = activeCanchas > 0 ? 'inline-block' : 'none';
      }

    } catch(e) {
      App.toast('Error cargando canchas: ' + e.message, 'error');
    }
  }
};
