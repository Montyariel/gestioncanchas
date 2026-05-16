// ===== APP.JS — Motor principal de CanchaOS =====
const App = {
  state: {
    sucursal: 'lanus',
    currentView: 'dashboard'
  },

  // Mapa de vistas
  views: {
    dashboard:   { render: (s) => DashboardView.render(s),   label: 'Dashboard' },
    canchas:     { render: (s) => CanchasView.render(s),     label: 'Canchas' },
    agenda:      { render: (s) => AgendaView.render(s),      label: 'Agenda' },
    reservas:    { render: (s) => ReservasView.render(s),    label: 'Reservas' },
    caja:        { render: (s) => CajaView.render(s),        label: 'Caja Diaria' },
    buffet:      { render: (s) => BuffetView.render(s),      label: 'Buffet' },
    gastos:      { render: (s) => GastosView.render(s),      label: 'Gastos' },
    goleadores:  { render: (s) => GoleadoresView.render(s),  label: 'Goleadores' },
    torneos:     { render: (s) => TorneosView.render(s),     label: 'Torneos' },
    matchmaking: { render: (s) => MatchmakingView.render(s), label: 'Matchmaking' },
    reportes:    { render: (s) => ReportesView.render(s),    label: 'Reportes' },
    login:       { render: (s) => LoginView.render(s),       label: 'Acceso' }
  },

  // --- INIT ---
  async init() {
    const hideLoader = () => {
      const loader = document.getElementById('loader');
      if (loader) loader.classList.add('hidden');
    };
    setTimeout(hideLoader, 3000);
    try {
      this.bindEvents();
      this.startClock();
      this.setupRealtimeListeners();
      this.setupAuthListener();
      
      const { data: { session } } = await db.auth.getSession().catch(() => ({ data: { session: null } }));
      if (session?.user) {
        const { data: userData } = await db.from('perfiles').select('*').eq('id', session.user.id).maybeSingle();
        if (userData) {
          const rol = userData.rol || 'empleado';
          LoginView.applyRoleRestrictions(rol);
          const userNameEl = document.getElementById('userNameDisplay');
          if (userNameEl) userNameEl.textContent = (userData.nombre || 'A').charAt(0).toUpperCase();
          await this.redirectUserBasedOnRole({ rol });
          return;
        }
      }
      
      const user = localStorage.getItem('canchaos_user');
      if (!user) {
        await this.navigate('login');
      } else {
        const u = JSON.parse(user);
        if (typeof LoginView !== 'undefined' && LoginView.applyRoleRestrictions) {
          LoginView.applyRoleRestrictions(u.rol);
          const userNameEl = document.getElementById('userNameDisplay');
          if (userNameEl) userNameEl.textContent = (u.nombre || 'A').charAt(0).toUpperCase();
        }
        await this.redirectUserBasedOnRole(u);
      }
    } catch(e) {
      console.error('CanchaOS init error:', e);
    } finally {
      setTimeout(hideLoader, 800);
    }
  },

  setupAuthListener() {
    db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('canchaos_user');
        this.navigate('login');
      }
    });
  },

  async redirectUserBasedOnRole(u) {
    if (u.rol === 'empleado') {
      try {
        // Verificar si hay caja abierta en la sucursal actual
        const { data } = await db.from('sesiones_caja')
          .select('id')
          .eq('sucursal', this.state.sucursal)
          .eq('estado', 'abierta')
          .limit(1);
          
        if (!data || data.length === 0) {
          await this.navigate('caja');
          this.toast('👋 ¡Buen turno! Por favor, abrí la caja para comenzar.', 'info');
        } else {
          await this.navigate('agenda');
        }
      } catch(e) {
        console.error("Error al verificar caja:", e);
        await this.navigate('agenda');
      }
    } else {
      await this.navigate('dashboard');
    }
  },

  // --- REALTIME LISTENERS ---
  setupRealtimeListeners() {
    console.log("🏟️ CanchaOS: Escuchando reservas en tiempo real...");
    
    db.channel('custom-insert-channel')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reservas_web' },
        (payload) => {
          const nueva = payload.new;
          console.log('🔔 Nueva reserva web detectada:', nueva);
          
          this.toast(`🔥 ¡NUEVA RESERVA WEB! ${nueva.cliente_nombre} reservó en ${nueva.sucursal_id.toUpperCase()}`, 'success');
          this.playNotificationSound();

          if (this.state.currentView === 'agenda' || this.state.currentView === 'reservas') {
            this.navigate(this.state.currentView);
          }
        }
      )
      .subscribe((status) => {
        console.log("🏟️ Estado de suscripción Realtime:", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("❌ Error de Realtime: Probablemente falta habilitar la tabla en el Dashboard de Supabase.");
        }
      });
  },

  playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // La
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn("No se pudo reproducir el sonido de notificación:", e);
    }
  },

  // --- NAVIGATE ---
  async navigate(viewName) {
    if (!this.views[viewName]) return;
    this.state.currentView = viewName;

    // Update nav active state (Tailwind dark theme)
    document.querySelectorAll('.nav-item').forEach(el => {
      const isActive = el.dataset.view === viewName;
      el.classList.toggle('nav-active', isActive);
      el.classList.toggle('text-slate-400', !isActive);
      el.classList.toggle('hover:bg-slate-800', !isActive);
      el.classList.toggle('hover:text-slate-200', !isActive);
    });

    // Update breadcrumb
    document.getElementById('currentViewLabel').textContent = this.views[viewName].label;

    // Render view
    await this.views[viewName].render(this.state.sucursal);

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.remove('open');
    }
  },

  // --- SUCURSAL SWITCH ---
  async switchSucursal(sucursal) {
    this.state.sucursal = sucursal;
    const btnL = document.getElementById('btnLanus');
    const btnB = document.getElementById('btnBelgrano');
    // Lanús styles
    btnL.style.background   = sucursal === 'lanus' ? 'rgba(195,244,0,.1)' : 'transparent';
    btnL.style.color        = sucursal === 'lanus' ? '#c3f400' : '#94a3b8';
    btnL.style.borderColor  = sucursal === 'lanus' ? '#c3f400' : '#334155';
    // Belgrano styles
    btnB.style.background   = sucursal === 'belgrano' ? 'rgba(195,244,0,.1)' : 'transparent';
    btnB.style.color        = sucursal === 'belgrano' ? '#c3f400' : '#94a3b8';
    btnB.style.borderColor  = sucursal === 'belgrano' ? '#c3f400' : '#334155';
    document.getElementById('currentSucursalLabel').textContent = sucursal === 'lanus' ? '🏟️ Lanús' : '🏟️ Belgrano';
    await this.navigate(this.state.currentView);
  },

  // --- MODAL RESERVA (multi-step + combo buffet) ---
  openReservaModal(turnoId, canchaName, hora, precio) {
    this._reservaData = { turnoId, canchaName, hora, precio, step: 1, comboItems: [] };
    this.renderModalStep(1);
    document.getElementById('modalOverlay').classList.add('open');
  },

  renderModalStep(step) {
    const d = this._reservaData;
    const body = document.getElementById('modalBody');
    [1,2,3].forEach(i => {
      const el = document.getElementById(`step${i}-indicator`);
      if (!el) return;
      const span = el.querySelector('span');
      if (i === step) {
        el.style.color = '#c3f400';
        if (span) { span.style.borderColor = '#c3f400'; span.style.background = 'rgba(195,244,0,.1)'; span.style.color = '#c3f400'; }
      } else if (i < step) {
        el.style.color = '#c3f400';
        if (span) { span.style.borderColor = '#c3f400'; span.style.background = '#c3f400'; span.style.color = '#161e00'; }
      } else {
        el.style.color = '#8e9379';
        if (span) { span.style.borderColor = '#444933'; span.style.background = 'transparent'; span.style.color = '#8e9379'; }
      }
    });

    if (step === 1) {
      // ===== STEP 1: Info del turno + oferta combo =====
      const stockPreview = DB._stockCache || [];
      const bebidasDisp = stockPreview.filter(s => s.cantidad > 0).slice(0, 4);
      body.innerHTML = `
        <div style="text-align:center;padding:16px 0 8px">
          <div style="font-size:44px;margin-bottom:10px">🏟️</div>
          <h3 style="font-size:20px;font-weight:800;margin-bottom:4px;color:#e2e2eb">${d.canchaName}</h3>
          <p style="color:#8e9379;margin-bottom:4px">Horario: <strong style="color:#e2e2eb">${d.hora}</strong></p>
          <p style="font-size:26px;font-weight:800;color:#c3f400;margin:10px 0">${fmt.money(d.precio)}</p>
        </div>
        ${bebidasDisp.length ? `
        <div style="background:rgba(195,244,0,.06);border-radius:14px;padding:14px;border:1px solid rgba(195,244,0,.2)">
          <div style="font-weight:700;font-size:13px;color:#c3f400;margin-bottom:10px">🎯 ¿Sumamos algo del buffet al pedido?</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" id="comboSelector">
            ${bebidasDisp.map(s => `
              <div id="combo-${s.id}" onclick="App.toggleCombo(${s.id}, '${s.item.replace(/'/g,"\\'")}}', ${s.precio_venta||0})"
                style="background:#1e1f26;border:1.5px solid #444933;border-radius:10px;padding:10px;cursor:pointer;transition:all 0.2s;text-align:center">
                <div style="font-size:12px;font-weight:600;color:#c4c9ac">${s.item}</div>
                <div style="font-size:14px;font-weight:800;color:#c3f400">${fmt.money(s.precio_venta)}</div>
              </div>`).join('')}
          </div>
          <div id="comboPrecioTotal" style="margin-top:8px;font-size:13px;color:#8e9379"></div>
        </div>` : ''}
        <div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 0 0">
          <button style="padding:10px 20px;border-radius:10px;border:1.5px solid #444933;background:transparent;color:#c4c9ac;font-size:14px;font-weight:600;cursor:pointer" onclick="App.closeModal()">Cancelar</button>
          <button style="padding:10px 20px;border-radius:10px;background:#c3f400;color:#161e00;font-size:14px;font-weight:700;cursor:pointer" onclick="App.renderModalStep(2)">Siguiente →</button>
        </div>`;

      // Precargar stock en cache
      DB.getStock(this.state.sucursal).then(s => { DB._stockCache = s; }).catch(() => {});

    } else if (step === 2) {
      const comboTotal = d.comboItems.reduce((s, i) => s + i.precio, 0);
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:13px;font-weight:600;color:#c4c9ac">👤 Nombre del cliente *</label>
          <input id="clienteNombre" placeholder="Ej: Juan Pérez" autofocus value="${d.clienteNombre || ''}"
            style="background:#111319;border:1.5px solid #444933;border-radius:10px;padding:11px 14px;font-size:14px;color:#e2e2eb;outline:none;width:100%;font-family:Inter,sans-serif" />
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="font-size:13px;font-weight:600;color:#c4c9ac">🎂 Cumpleaños (opcional)</label>
          <input id="clienteCumple" type="date" value="${d.clienteCumple || ''}"
            style="background:#111319;border:1.5px solid #444933;border-radius:10px;padding:11px 14px;font-size:14px;color:#e2e2eb;outline:none;width:100%;font-family:Inter,sans-serif" />
        </div>
        ${d.comboItems.length ? `
        <div style="background:rgba(195,244,0,.06);border-radius:12px;padding:12px;border:1px solid rgba(195,244,0,.2)">
          <div style="font-weight:700;font-size:13px;color:#c3f400;margin-bottom:6px">🛒 Combo seleccionado</div>
          ${d.comboItems.map(i => `<div style="font-size:13px;color:#c4c9ac">• ${i.nombre} — ${fmt.money(i.precio)}</div>`).join('')}
          <div style="font-weight:800;font-size:15px;color:#c3f400;margin-top:6px">Subtotal: ${fmt.money(comboTotal)}</div>
        </div>` : ''}
        <div style="background:#111319;border-radius:12px;padding:14px;border:1px solid #444933">
          <div style="display:flex;justify-content:space-between;font-size:14px;color:#c4c9ac"><span>Cancha:</span><strong style="color:#e2e2eb">${fmt.money(d.precio)}</strong></div>
          ${d.comboItems.length ? `<div style="display:flex;justify-content:space-between;font-size:14px;color:#c4c9ac;margin-top:6px"><span>Combo:</span><strong style="color:#e2e2eb">${fmt.money(comboTotal)}</strong></div>` : ''}
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#c3f400;margin-top:10px;padding-top:10px;border-top:1px solid #444933"><span>Total:</span><span>${fmt.money(d.precio + comboTotal)}</span></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:4px">
          <button style="padding:10px 20px;border-radius:10px;border:1.5px solid #444933;background:transparent;color:#c4c9ac;font-size:14px;font-weight:600;cursor:pointer" onclick="App.renderModalStep(1)">← Atrás</button>
          <button style="padding:10px 20px;border-radius:10px;background:#c3f400;color:#161e00;font-size:14px;font-weight:700;cursor:pointer" onclick="App.confirmarReserva()">Confirmar →</button>
        </div>`;

    } else if (step === 3) {
      const total = d.precio + (d.comboItems || []).reduce((s, i) => s + i.precio, 0);
      body.innerHTML = `
        <div style="text-align:center;padding:16px 0">
          <div style="font-size:52px;margin-bottom:10px;animation:bounce .5s ease">⚽</div>
          <h3 style="font-size:22px;font-weight:800;color:#c3f400;margin-bottom:8px">¡GOLAZO!</h3>
          <p style="color:#c4c9ac;margin-bottom:4px">Reserva confirmada para <strong style="color:#e2e2eb">${d.clienteNombre}</strong></p>
          <p style="color:#8e9379;font-size:14px">${d.canchaName} · ${d.hora}</p>
          <p style="font-size:20px;font-weight:800;color:#c3f400;margin-top:10px">Total: ${fmt.money(total)}</p>
          ${d.comboItems?.length ? `<p style="font-size:12px;color:#8e9379">Incluye combo buffet 🎉</p>` : ''}
        </div>
        <div style="background:rgba(195,244,0,.06);border:1.5px dashed rgba(195,244,0,.3);border-radius:12px;padding:14px;text-align:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:#e2e2eb">💥 Oferta exclusiva</div>
          <div style="font-size:13px;color:#c4c9ac;margin-bottom:10px">
            Mirá crack, si pagás ahora te hago un <strong style="color:#c3f400">10% de descuento</strong>.<br>
            Total con descuento: <strong style="color:#c3f400">${fmt.money(Math.round(total * 0.9))}</strong>
          </div>
          <button style="padding:8px 18px;border-radius:8px;background:#c3f400;color:#161e00;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:10px" onclick="App.aplicarDescuento()">🔥 Aplicar 10% descuento</button>
          
          <div style="border-top:1px solid rgba(195,244,0,0.2);margin-top:10px;padding-top:10px">
            <button id="modalMpBtn" style="padding:10px 20px;border-radius:10px;background:#009EE3;color:#white;font-size:13px;font-weight:800;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px" onclick="App.generarLinkModal(${total})">
              <span class="material-symbols-outlined">payments</span> GENERAR LINK DE PAGO
            </button>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:4px">
          <button style="padding:10px 20px;border-radius:10px;border:1.5px solid #444933;background:transparent;color:#c4c9ac;font-size:14px;font-weight:600;cursor:pointer" onclick="App.closeModal()">Cerrar</button>
          <button style="padding:10px 20px;border-radius:10px;border:1.5px solid #444933;background:transparent;color:#c4c9ac;font-size:14px;font-weight:600;cursor:pointer" onclick="App.navigate('reservas')">Ver Reservas</button>
        </div>`;
    }
  },

  toggleCombo(id, nombre, precio) {
    const d = this._reservaData;
    const idx = d.comboItems.findIndex(i => i.id === id);
    const el = document.getElementById(`combo-${id}`);
    if (idx >= 0) {
      d.comboItems.splice(idx, 1);
      if (el) { el.style.borderColor = '#444933'; el.style.background = '#1e1f26'; }
    } else {
      d.comboItems.push({ id, nombre, precio });
      if (el) { el.style.borderColor = '#c3f400'; el.style.background = 'rgba(195,244,0,.08)'; }
    }
    const total = d.comboItems.reduce((s, i) => s + i.precio, 0);
    const el2 = document.getElementById('comboPrecioTotal');
    if (el2) el2.textContent = d.comboItems.length ? `Combo: ${fmt.money(total)} — ${d.comboItems.map(i=>i.nombre).join(', ')}` : '';
  },

  async confirmarReserva() {
    const nombre = document.getElementById('clienteNombre')?.value.trim();
    if (!nombre) { this.toast('Ingresá el nombre del cliente ⚠️', 'error'); return; }
    this._reservaData.clienteNombre = nombre;
    this._reservaData.clienteCumple = document.getElementById('clienteCumple')?.value || null;
    try {
      await API.reservar(
        this._reservaData.turnoId,
        nombre,
        this._reservaData.clienteCumple,
        this._reservaData.comboItems
      );

      this.renderModalStep(3);
      this.toast('¡Reserva confirmada! ⚽🔥', 'success');
      if (this.views[this.state.currentView]) {
        setTimeout(() => this.views[this.state.currentView].render(this.state.sucursal), 2000);
      }
    } catch(e) {
      this.toast('Error al reservar: ' + e.message, 'error');
    }
  },

  aplicarDescuento() {
    this._reservaData.precioConDescuento = Math.round((this._reservaData.precio + (this._reservaData.comboItems || []).reduce((s,i)=>s+i.precio, 0)) * 0.9);
    this.toast('💥 ¡Descuento del 10% aplicado! ¡Volá a pagarlo que los turnos se agotan! 🔥⚽', 'success');
    this.renderModalStep(3);
  },

  async generarLinkModal(total) {
    const d = this._reservaData;
    const finalTotal = d.precioConDescuento || total;
    const btn = document.getElementById('modalMpBtn');
    
    try {
      btn.innerHTML = `<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generando...`;
      btn.disabled = true;

      const response = await fetch('/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Reserva Cancha: ${d.canchaName} (${d.hora})`,
          price: finalTotal,
          quantity: 1
        })
      });
      const data = await response.json();
      
      if (data.init_point) {
        const link = data.init_point;
        navigator.clipboard.writeText(link).then(() => {
          this.toast('¡Link copiado! 📋 Pasaselo al cliente.', 'success');
        });
        
        btn.innerHTML = `<span class="material-symbols-outlined">check</span> LINK GENERADO Y COPIADO`;
        btn.style.background = '#2ed573';
        
        // Abrir en nueva pestaña
        window.open(link, '_blank');
      } else {
        throw new Error('Error de Mercado Pago');
      }
    } catch (err) {
      this.toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">payments</span> REINTENTAR GENERAR`;
    }
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    this._reservaData = null;
  },

  // --- TOAST ---
  toast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span style="font-size:18px">${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  },

  // --- CLOCK ---
  startClock() {
    const el = document.getElementById('topbarTime');
    const update = () => {
      el.textContent = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 60000);
  },

  // --- EVENTS ---
  bindEvents() {
    // Nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigate(el.dataset.view);
      });
    });

    // Sucursal switcher
    document.getElementById('btnLanus').addEventListener('click', () => this.switchSucursal('lanus'));
    document.getElementById('btnBelgrano').addEventListener('click', () => this.switchSucursal('belgrano'));

    // Menu button (mobile) — abre sidebar
    document.getElementById('menuBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });

    // Sidebar close (mobile X)
    const sidebarClose = document.getElementById('sidebarClose');
    if (sidebarClose) sidebarClose.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
      document.getElementById('refreshBtn').style.opacity = '0.5';
      await this.navigate(this.state.currentView);
      document.getElementById('refreshBtn').style.opacity = '1';
    });

    // Nueva Reserva button
    document.getElementById('nuevaReservaBtn').addEventListener('click', () => {
      this.navigate('agenda');
    });

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }
};

// Bounce animation for success
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
  .combo-item:hover { border-color: var(--accent) !important; background: var(--accent-light) !important; }
`;
document.head.appendChild(style);

// ===== ARRANQUE =====
document.addEventListener('DOMContentLoaded', () => App.init());
