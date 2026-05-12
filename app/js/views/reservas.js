// ===== VISTA: RESERVAS =====
const ReservasView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Reservas</h1>
          <p class="page-subtitle">Historial completo de reservas confirmadas</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn--ghost" onclick="ReservasView.showAbonoModal()">
            📅 Abono Mensual
          </button>
          <button class="btn btn--primary" onclick="App.navigate('agenda')">
            + Nueva Reserva
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card" style="margin-bottom:20px;padding:16px">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
          <input class="form-input" id="filterCliente" placeholder="🔍 Buscar por cliente..." style="max-width:240px"
            oninput="ReservasView.filterTable()" />
          <select class="form-input form-select" id="filterEstado" style="max-width:180px" onchange="ReservasView.filterTable()">
            <option value="">Todos los estados</option>
            <option value="pagado">✅ Pagado</option>
            <option value="pendiente">⏳ Pendiente</option>
            <option value="cancelado">❌ Cancelado</option>
          </select>
          <div style="margin-left:auto;font-size:13px;color:var(--text-muted)" id="reservasCount"></div>
        </div>
      </div>

      <div class="card">
        <div id="reservasTable"><div class="skeleton" style="height:300px"></div></div>
      </div>

      <!-- MODAL ABONO MENSUAL -->
      <div class="modal-overlay" id="abonoModalOverlay" onclick="if(event.target===this)ReservasView.closeAbonoModal()">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <h2 class="modal-title">📅 Abono Mensual</h2>
            <button class="modal-close" onclick="ReservasView.closeAbonoModal()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" id="abonoModalBody">
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
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><p class="empty-state-title">Sin reservas aún</p><p class="empty-state-text">Las reservas confirmadas aparecerán aquí</p></div>`;
      return;
    }
    el.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Cliente</th>
            <th>Cancha</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Precio</th>
            <th>Estado pago</th>
            <th>Acciones</th>
          </tr></thead>
          <tbody id="reservasTbody">
            ${reservas.map(r => `
              <tr data-cliente="${(r.cliente_nombre||'').toLowerCase()}" data-estado="${r.estado_pago||'pendiente'}">
                <td>
                  <div style="font-weight:700">${r.cliente_nombre || '—'}</div>
                  ${r.cumpleanios ? `<div style="font-size:11px;color:var(--pink)">🎂 ${fmt.date(r.cumpleanios)}</div>` : ''}
                </td>
                <td>${r.canchas?.nombre || r.turno_cancha || '—'}</td>
                <td style="color:var(--text-muted);font-size:13px">${r.turno_fecha ? fmt.date(r.turno_fecha) : fmt.date(r.created_at)}</td>
                <td><span class="badge badge--cyan">${r.turno_hora || '—'}</span></td>
                <td style="font-weight:700;color:var(--accent)">${r.precio ? fmt.money(r.precio) : '—'}</td>
                <td>${this.estadoBadge(r.estado_pago)}</td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap">
                    ${r.estado_pago !== 'pagado' ? `<button class="btn btn--sm" style="background:var(--green-light);color:var(--green);border:1.5px solid var(--green)" onclick="ReservasView.marcarPagado(${r.id})">✅ Pagado</button>` : ''}
                    ${r.turno_id ? `<button class="btn btn--danger btn--sm" onclick="ReservasView.cancelarReserva(${r.id}, ${r.turno_id})">❌</button>` : ''}
                  </div>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  estadoBadge(estado) {
    const map = {
      pagado:   `<span class="badge badge--green">✅ Pagado</span>`,
      pendiente:`<span class="badge badge--yellow">⏳ Pendiente</span>`,
      cancelado:`<span class="badge badge--red">❌ Cancelado</span>`
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
      await DB.updateReservaEstado(reservaId, 'pagado');
      App.toast('🎉 ¡GOLAZO! Pago registrado crack', 'success');
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

  // ===== ABONO MENSUAL =====
  showAbonoModal() {
    const body = document.getElementById('abonoModalBody');
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">👤 Nombre del cliente</label>
        <input class="form-input" id="abonoCliente" placeholder="Ej: Martín García" autofocus />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">🏟️ Cancha</label>
          <input class="form-input" id="abonoCancha" placeholder="Ej: Cancha 1" />
        </div>
        <div class="form-group">
          <label class="form-label">🕐 Horario fijo</label>
          <input class="form-input" id="abonoHora" placeholder="Ej: 20:00" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">📆 Fechas del mes</label>
          <select class="form-input form-select" id="abonoFechas">
            <option value="4">4 fechas</option>
            <option value="5">5 fechas</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">💰 Precio por fecha ($)</label>
          <input class="form-input" id="abonoPrecio" type="number" placeholder="0" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">🎂 Cumpleaños (opcional)</label>
        <input class="form-input" id="abonoCumple" type="date" />
      </div>
      <div id="abonoResumen" style="margin-top:12px;padding:14px;background:var(--accent-light);border-radius:12px;font-size:14px;display:none">
        <div style="font-weight:700;color:var(--accent);margin-bottom:4px">📊 Resumen del abono</div>
        <div id="abonoResumenTexto"></div>
      </div>
      <div class="modal-footer" style="margin:0 -24px -24px;padding:16px 24px">
        <button class="btn btn--ghost" onclick="ReservasView.closeAbonoModal()">Cancelar</button>
        <button class="btn btn--ghost" onclick="ReservasView.calcularAbono()">Calcular 🔢</button>
        <button class="btn btn--primary" onclick="ReservasView.confirmarAbono()">Confirmar Abono ⚽</button>
      </div>`;
    document.getElementById('abonoModalOverlay').classList.add('open');
  },

  calcularAbono() {
    const precio = parseFloat(document.getElementById('abonoPrecio')?.value || 0);
    const fechas = parseInt(document.getElementById('abonoFechas')?.value || 4);
    const cliente = document.getElementById('abonoCliente')?.value || '';
    const hora = document.getElementById('abonoHora')?.value || '';
    if (!precio || !cliente) { App.toast('Completá cliente y precio ⚠️', 'error'); return; }
    const total = precio * fechas;
    const desc = total * 0.1;
    document.getElementById('abonoResumen').style.display = 'block';
    document.getElementById('abonoResumenTexto').innerHTML = `
      <div>👤 <strong>${cliente}</strong> · ⏰ ${hora || '—'}</div>
      <div>📆 ${fechas} fechas × ${fmt.money(precio)} = <strong>${fmt.money(total)}</strong></div>
      <div style="color:var(--green);margin-top:4px">🎁 Con descuento 10%: <strong>${fmt.money(total - desc)}</strong></div>`;
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
      App.toast(`🎉 ¡GOLAZO DE MEDIA CANCHA! Abono de ${cliente} registrado (${fechas} fechas)`, 'success');
      this.closeAbonoModal();
      await this.load(this._sucursal);
    } catch(e) { App.toast('Error: ' + e.message, 'error'); }
  },

  closeAbonoModal() {
    document.getElementById('abonoModalOverlay').classList.remove('open');
  }
};
