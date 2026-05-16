// ===== VISTA: RESERVAS =====
const ReservasView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <section class="grid grid-cols-1 gap-6 mb-8">
        <div class="bg-surface-container-low rounded-xl p-8 border border-surface-container-highest flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 class="font-h1 text-h1 text-on-surface mb-1">📋 Historial de Reservas</h1>
            <p class="text-on-surface-variant">Registro completo de reservas confirmadas y abonos · ${sucursal.charAt(0).toUpperCase()+sucursal.slice(1)}</p>
          </div>
          <div class="flex gap-3">
            <button onclick="ReservasView.showAbonoModal()" class="px-5 py-2.5 rounded-lg text-sm font-bold border border-slate-700 text-slate-300 hover:border-[#c3f400] hover:text-[#c3f400] transition-all flex items-center gap-2">
              <span class="material-symbols-outlined" style="font-size:18px">calendar_month</span>
              Abono Mensual
            </button>
            <button onclick="App.navigate('agenda')" class="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all flex items-center gap-2 shadow-lg shadow-[#c3f400]/20">
              <span class="material-symbols-outlined" style="font-size:18px">add</span>
              Nueva Reserva
            </button>
          </div>
        </div>
      </section>

      <!-- Filtros -->
      <section class="bg-surface-container rounded-xl p-4 border border-surface-container-highest mb-6 flex flex-wrap gap-4 items-center">
        <div class="relative flex-1 min-w-[200px] max-w-[300px]">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:18px">search</span>
          <input id="filterCliente" oninput="ReservasView.filterTable()" placeholder="Buscar por cliente..." class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
        </div>
        <select id="filterEstado" onchange="ReservasView.filterTable()" class="bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer outline-none">
          <option value="">Todos los estados</option>
          <option value="pagado">✅ Pagado</option>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="cancelado">❌ Cancelado</option>
        </select>
        <div class="ml-auto">
          <span id="reservasCount" class="text-sm font-bold text-[#c3f400] bg-[#c3f400]/10 px-3 py-1.5 rounded-lg border border-[#c3f400]/20">Cargando...</span>
        </div>
      </section>

      <section class="bg-surface-container rounded-xl border border-surface-container-highest overflow-hidden">
        <div id="reservasTable"><div class="p-12 text-center flex flex-col items-center justify-center"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c3f400] mb-4"></div><p class="text-slate-400 text-sm">Cargando reservas...</p></div></div>
      </section>

      <!-- MODAL ABONO MENSUAL -->
      <div id="abonoModalOverlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex-col items-center justify-center p-4 transition-opacity" onclick="if(event.target===this)ReservasView.closeAbonoModal()" style="display: none;">
        <div class="bg-surface-container rounded-2xl w-full max-w-lg border border-surface-container-highest shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-6 border-b border-surface-container-highest flex justify-between items-center bg-surface-container-low">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2"><span class="material-symbols-outlined text-[#c3f400]">calendar_month</span> Abono Mensual</h2>
            <button onclick="ReservasView.closeAbonoModal()" class="text-slate-400 hover:text-white transition-colors"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="p-6 overflow-y-auto" id="abonoModalBody">
          </div>
        </div>
      </div>`;

    await this.load(sucursal);
    this._sucursal = sucursal;
  },

  _allReservas: [],

  async load(sucursal) {
    try {
      const reservas = await DB.getReservasDetalladas(sucursal);
      this._allReservas = reservas;
      this.renderTable(reservas);
      document.getElementById('reservasCount').textContent = `${reservas.length} reservas`;
    } catch(e) {
      App.toast('Error cargando reservas: ' + e.message, 'error');
    }
  },

  renderTable(reservas) {
    const el = document.getElementById('reservasTable');
    if (!el) return;
    if (!reservas.length) {
      el.innerHTML = `<div class="p-16 text-center flex flex-col items-center justify-center">
        <span class="material-symbols-outlined text-5xl text-slate-600 mb-4">inventory_2</span>
        <p class="text-on-surface font-bold text-lg mb-1">No hay reservas</p>
        <p class="text-slate-400 text-sm">Aún no hay reservas que coincidan con la búsqueda.</p>
      </div>`;
      return;
    }
    el.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-surface-container-low border-b border-surface-container-highest">
            <tr>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cancha</th>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha / Hora</th>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</th>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
              <th class="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody id="reservasTbody" class="divide-y divide-surface-container-highest">
            ${reservas.map(r => `
              <tr class="hover:bg-surface-container-high transition-colors group">
                <td class="py-4 px-6">
                  <div class="font-bold text-on-surface text-sm">${r.cliente_nombre || '—'}</div>
                  ${r.cumpleanios ? `<div class="text-[11px] text-[#ffb4ab] mt-0.5 flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:12px">cake</span> ${fmt.date(r.cumpleanios)}</div>` : ''}
                </td>
                <td class="py-4 px-6 text-sm text-slate-300 font-medium">${r.canchas?.nombre || r.turno_cancha || '—'}</td>
                <td class="py-4 px-6">
                  <div class="text-sm text-slate-300">${r.turno_fecha ? fmt.date(r.turno_fecha) : fmt.date(r.created_at)}</div>
                  <div class="text-xs font-bold text-cyan-400 mt-0.5">${r.turno_hora || '—'}</div>
                </td>
                <td class="py-4 px-6 font-bold text-[#c3f400] text-sm">${r.precio ? fmt.money(r.precio) : '—'}</td>
                <td class="py-4 px-6">${this.estadoBadge(r.estado_pago)}</td>
                <td class="py-4 px-6 text-right">
                  <div class="flex gap-2 justify-end">
                    ${r.estado_pago !== 'pagado' ? `
                      <button onclick="ReservasView.marcarPagado(${r.id})" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-[#c3f400] text-[#c3f400] hover:bg-[#c3f400] hover:text-[#161e00] transition-colors shadow-sm">✅ Pago</button>
                      <button onclick="ReservasView.generarLink(${r.id})" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-dark transition-colors shadow-sm flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">link</span> Link
                      </button>
                    ` : ''}
                    ${r.turno_id ? `<button onclick="ReservasView.cancelarReserva(${r.id}, ${r.turno_id})" class="p-1.5 rounded-lg text-slate-400 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors" title="Cancelar Reserva"><span class="material-symbols-outlined" style="font-size:18px">close</span></button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  estadoBadge(estado) {
    const map = {
      pagado:   `<span class="bg-[#c3f400]/10 text-[#c3f400] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border border-[#c3f400]/20"><span class="material-symbols-outlined" style="font-size:12px">check_circle</span> Pagado</span>`,
      pendiente:`<span class="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border border-amber-500/20"><span class="material-symbols-outlined" style="font-size:12px">schedule</span> Pendiente</span>`,
      cancelado:`<span class="bg-[#ffb4ab]/10 text-[#ffb4ab] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border border-[#ffb4ab]/20"><span class="material-symbols-outlined" style="font-size:12px">cancel</span> Cancelado</span>`
    };
    return map[estado] || map['pendiente'];
  },

  filterTable() {
    const txt = (document.getElementById('filterCliente')?.value || '').toLowerCase();
    const estado = document.getElementById('filterEstado')?.value || '';
    const filtered = this._allReservas.filter(r => {
      const matchCliente = !txt || (r.cliente_nombre || '').toLowerCase().includes(txt);
      const matchEstado  = !estado || (r.estado_pago || 'pendiente') === estado;
      return matchCliente && matchEstado;
    });
    this.renderTable(filtered);
    const c = document.getElementById('reservasCount');
    if (c) c.textContent = `${filtered.length} reservas`;
  },

  async marcarPagado(reservaId) {
    try {
      const reserva = this._allReservas.find(r => r.id === reservaId);
      await DB.updateReservaEstado(reservaId, 'pagado');
      App.toast('🎉 ¡GOLAZO! Pago registrado crack', 'success');

      // Registrar en Caja Diaria
      if (reserva && reserva.precio) {
        const { data: sesiones } = await db
          .from('sesiones_caja')
          .select('id')
          .eq('sucursal', this._sucursal)
          .eq('estado', 'abierta')
          .order('fecha_apertura', { ascending: false })
          .limit(1);

        if (sesiones && sesiones.length > 0) {
          await db.from('movimientos_caja').insert([{
            sesion_id: sesiones[0].id,
            tipo: 'ingreso',
            categoria: 'Alquiler Cancha',
            monto: reserva.precio,
            descripcion: `Pago Reserva: ${reserva.cliente_nombre || 'Cliente'}`
          }]);
        } else {
          console.warn("No hay caja abierta para registrar el pago de la reserva.");
          App.toast("⚠️ Pago registrado, pero la Caja está cerrada. Abrí la caja para futuros registros.", "error");
        }
      }

      await this.load(this._sucursal);
    } catch(e) { App.toast('Error: ' + e.message, 'error'); }
  },

  async cancelarReserva(reservaId, turnoId) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      await DB.updateReservaEstado(reservaId, 'cancelado');
      if (turnoId) await DB.cancelarTurno(turnoId);
      App.toast('Reserva cancelada ✅', 'success');
      await this.load(this._sucursal);
    } catch(e) { App.toast('Error: ' + e.message, 'error'); }
  },

  async generarLink(reservaId) {
    const reserva = this._allReservas.find(r => r.id === reservaId);
    if (!reserva) return;
    
    try {
      App.toast('Generando link de pago...', 'info');
      const response = await fetch('/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Turno: ${reserva.turno_cancha || 'Cancha'} (${reserva.turno_hora || ''})`,
          price: reserva.precio || 5000,
          quantity: 1
        })
      });
      const data = await response.json();
      
      if (data.init_point) {
        // Mostrar modal o alert con el link
        const link = data.init_point;
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(link).then(() => {
          App.toast('¡Link copiado al portapapeles! 📋', 'success');
        });

        // Opcional: mostrarlo en un prompt para asegurar
        const win = window.open(link, '_blank');
        if (!win) {
           prompt('Copiá el link para enviárselo al cliente, crack:', link);
        }
      } else {
        throw new Error('No se pudo generar el init_point');
      }
    } catch (err) {
      console.error(err);
      App.toast('Error con Mercado Pago: ' + err.message, 'error');
    }
  },

  // ===== ABONO MENSUAL =====
  showAbonoModal() {
    const body = document.getElementById('abonoModalBody');
    body.innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">👤 Nombre del cliente</label>
          <input id="abonoCliente" placeholder="Ej: Martín García" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" autofocus />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">🏟️ Cancha</label>
            <input id="abonoCancha" placeholder="Ej: Cancha 1" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">🕐 Horario fijo</label>
            <input id="abonoHora" placeholder="Ej: 20:00" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">📆 Fechas del mes</label>
            <select id="abonoFechas" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer outline-none">
              <option value="4">4 fechas</option>
              <option value="5">5 fechas</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">💰 Precio por fecha ($)</label>
            <input id="abonoPrecio" type="number" placeholder="0" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">🎂 Cumpleaños (opcional)</label>
          <input id="abonoCumple" type="date" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
        </div>
      </div>
      
      <div id="abonoResumen" class="mt-6 p-4 bg-[#c3f400]/5 border border-[#c3f400]/20 rounded-xl hidden">
        <div class="font-bold text-[#c3f400] text-sm mb-2">📊 Resumen del abono</div>
        <div id="abonoResumenTexto" class="text-sm space-y-1 text-slate-300"></div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-surface-container-highest flex justify-end gap-3">
        <button onclick="ReservasView.closeAbonoModal()" class="px-5 py-2.5 rounded-lg text-sm font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">Cancelar</button>
        <button onclick="ReservasView.calcularAbono()" class="px-5 py-2.5 rounded-lg text-sm font-bold border border-[#c3f400] text-[#c3f400] hover:bg-[#c3f400]/10 transition-colors">Calcular 🔢</button>
        <button onclick="ReservasView.confirmarAbono()" class="px-5 py-2.5 rounded-lg text-sm font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-colors shadow-lg shadow-[#c3f400]/20">Confirmar Abono ⚽</button>
      </div>`;
    const overlay = document.getElementById('abonoModalOverlay');
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden');
  },

  calcularAbono() {
    const precio = parseFloat(document.getElementById('abonoPrecio')?.value || 0);
    const fechas = parseInt(document.getElementById('abonoFechas')?.value || 4);
    const cliente = document.getElementById('abonoCliente')?.value || '';
    const hora = document.getElementById('abonoHora')?.value || '';
    if (!precio || !cliente) { App.toast('Completá cliente y precio ⚠️', 'error'); return; }
    const total = precio * fechas;
    const desc = total * 0.1;
    document.getElementById('abonoResumen').classList.remove('hidden');
    document.getElementById('abonoResumenTexto').innerHTML = `
      <div>👤 <strong>${cliente}</strong> · ⏰ ${hora || '—'}</div>
      <div>📆 ${fechas} fechas × ${fmt.money(precio)} = <strong>${fmt.money(total)}</strong></div>
      <div class="text-[#c3f400] mt-1 font-bold">🎁 Con descuento 10%: ${fmt.money(total - desc)}</div>`;
  },

  async confirmarAbono() {
    const cliente = document.getElementById('abonoCliente')?.value.trim();
    const cancha  = document.getElementById('abonoCancha')?.value.trim();
    const hora    = document.getElementById('abonoHora')?.value.trim();
    const fechas  = parseInt(document.getElementById('abonoFechas')?.value || 4);
    const precio  = parseFloat(document.getElementById('abonoPrecio')?.value || 0);
    const cumple  = document.getElementById('abonoCumple')?.value || null;
    if (!cliente || !precio) { App.toast('Completá los datos obligatorios ⚠️', 'error'); return; }
    try {
      await DB.registrarAbono({ cliente, cancha, hora, fechas, precio_unitario: precio, cumpleanios: cumple, sucursal: this._sucursal });
      
      const totalAbono = precio * fechas;
      
      // Registrar en Caja Diaria
      const { data: sesiones } = await db
        .from('sesiones_caja')
        .select('id')
        .eq('sucursal', this._sucursal)
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1);

      if (sesiones && sesiones.length > 0) {
        await db.from('movimientos_caja').insert([{
          sesion_id: sesiones[0].id,
          tipo: 'ingreso',
          categoria: 'Alquiler Cancha',
          monto: totalAbono,
          descripcion: `Abono Mensual: ${cliente} (${fechas} fechas)`
        }]);
      } else {
        App.toast("⚠️ Abono registrado, pero la Caja está cerrada.", "error");
      }

      App.toast(`🎉 ¡GOLAZO DE MEDIA CANCHA! Abono de ${cliente} registrado (${fechas} fechas)`, 'success');
      this.closeAbonoModal();
      await this.load(this._sucursal);
    } catch(e) { App.toast('Error: ' + e.message, 'error'); }
  },

  closeAbonoModal() {
    const overlay = document.getElementById('abonoModalOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => overlay.style.display = 'none', 300);
  }
};
