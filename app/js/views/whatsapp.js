// ===== VISTA: WHATSAPP (Vincular y enviar mensajes directos) =====
const WhatsappView = {
  state: {
    status: localStorage.getItem('canchaos_wa_status') || 'DISCONNECTED', // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
    chats: [
      { id: 1, nombre: 'Ariel Vera (Dueño)', tel: '5491122334455', ultimo: '¡Joyita Nico! Quedó espectacular. Cuidame esa ganancia neta. 🏆', fecha: '10:45', leido: true, rol: 'EQUIPO' },
      { id: 2, nombre: 'Martín Palermo', tel: '5491155443322', ultimo: 'Joyita Nico, guardame 4 Gatorades de manzana.', fecha: '09:30', leido: false, rol: 'CLIENTE' },
      { id: 3, nombre: 'Juan Román Riquelme', tel: '5491199887766', ultimo: 'Se liberó el turno de las 21? Avisame crack.', fecha: 'Ayer', leido: true, rol: 'CLIENTE' },
      { id: 4, nombre: 'Leo Messi', tel: '5491133221100', ultimo: 'Confirmadísimo el abono mensual de los viernes.', fecha: 'Ayer', leido: true, rol: 'CLIENTE' },
      { id: 5, nombre: 'Distribuidora Quilmes / Coca-Cola', tel: '5491188776655', ultimo: 'Nico, mañana a las 10hs entra el camión con el pedido de Gatorades.', fecha: 'Ayer', leido: true, rol: 'PROVEEDOR' },
      { id: 6, nombre: 'Fábrica de Pelotas Penn & Redes', tel: '5491144332211', ultimo: 'El presupuesto por los 4 bolsones de pelotas de fútbol es $120.000.', fecha: 'Lunes', leido: true, rol: 'PROVEEDOR' },
      { id: 7, nombre: 'Proveedor de Salchichas y Pan', tel: '5491177665544', ultimo: 'Te dejo los 10 packs de panchos y panes en buffet a la tarde.', fecha: 'Lunes', leido: true, rol: 'PROVEEDOR' },
      { id: 8, nombre: 'Mantenimiento Canchas Lanús', tel: '5491166554433', ultimo: 'Cancha 1 y 2 cepilladas y listas para la tarde. Pádel 1 cristal limpio. 🧼', fecha: '11:15', leido: true, rol: 'EQUIPO' },
      { id: 9, nombre: 'Cajero Turno Noche', tel: '5491155667788', ultimo: 'Quedó la caja arqueada de ayer perfecta, Nico. Te dejé el sobre en el casillero.', fecha: '08:15', leido: true, rol: 'EQUIPO' }
    ],
    selectedChatId: null, // Por defecto ninguno para mostrar la pantalla de bienvenida limpia
    crmJugadores: [],
    searchQuery: ''
  },

  stateInitialized: false,
  _qrTimeout: null,

  initChatsAndMessages() {
    if (this.stateInitialized) return;
    this.stateInitialized = true;

    // Inicializar mensajes por defecto si no existen en el estado
    this.state.messages = {
      1: [
        { sender: 'them', text: 'Hola Nico! ¿Todo bien?', time: '10:40' },
        { sender: 'me', text: '¡Qué hacés, Ariel crack! Todo de diez por acá. ¿En qué te puedo ayudar hoy? ⚽🔥', time: '10:42' },
        { sender: 'them', text: 'Che, ¿cómo viene la reserva de la Cancha 2? ¿Hay algún pago pendiente?', time: '10:44' },
        { sender: 'them', text: '¡Joyita Nico! Quedó espectacular. Cuidame esa ganancia neta. 🏆', time: '10:45' }
      ],
      2: [
        { sender: 'me', text: '¡Hola Martín! Tu turno de Fútbol 5 para hoy a las 20:00 hs está confirmadísimo. 🏟️🏃‍♂️', time: '09:25' },
        { sender: 'them', text: 'Joyita Nico, guardame 4 Gatorades de manzana.', time: '09:30' }
      ],
      3: [
        { sender: 'them', text: 'Buenas, Román por acá. ¿Tenés alguna cancha libre para hoy a la noche?', time: 'Ayer 18:15' },
        { sender: 'me', text: 'Hola Román crack! ⚽ Mirá, hoy a las 21:00 hs se nos acaba de bajar un grupo por lesión. ¡Es tuya si me la confirmás ya con seña!', time: 'Ayer 18:20' },
        { sender: 'them', text: 'Se liberó el turno de las 21? Avisame crack.', time: 'Ayer 18:25' }
      ],
      4: [
        { sender: 'me', text: '¡Hola Leo! Te generé el link de abono mensual por las 4 fechas de los viernes a las 20:00 hs. Volá a pagarlo así te lo aseguro de por vida. ⚽👑', time: 'Ayer 12:00' },
        { sender: 'them', text: 'Confirmadísimo el abono mensual de los viernes.', time: 'Ayer 14:15' }
      ],
      5: [
        { sender: 'me', text: 'Buenas tardes! ¿Nos podrán entregar el pedido de Gatorades de manzana y pomelo para mañana temprano? 🥤', time: 'Ayer 16:10' },
        { sender: 'them', text: 'Nico, mañana a las 10hs entra el camión con el pedido de Gatorades.', time: 'Ayer 16:45' }
      ],
      6: [
        { sender: 'me', text: 'Hola muchachos! ¿Me pasan presupuesto por 4 bolsones de pelotas de fútbol nro 5 medio pique?', time: 'Lunes 14:00' },
        { sender: 'them', text: 'El presupuesto por los 4 bolsones de pelotas de fútbol es $120.000.', time: 'Lunes 15:30' }
      ],
      7: [
        { sender: 'me', text: 'Buenas! Necesitamos stock urgente de panchos y panes para el buffet de Lanús, nos quedamos en cero. 🌭🚨', time: 'Lunes 10:00' },
        { sender: 'them', text: 'Te dejo los 10 packs de panchos y panes en buffet a la tarde.', time: 'Lunes 11:00' }
      ],
      8: [
        { sender: 'me', text: '¿Cómo vienen las canchas para los turnos de hoy a la tarde?', time: '11:00' },
        { sender: 'them', text: 'Cancha 1 y 2 cepilladas y listas para la tarde. Pádel 1 cristal limpio. 🧼', time: '11:15' }
      ],
      9: [
        { sender: 'them', text: 'Quedó la caja arqueada de ayer perfecta, Nico. Te dejé el sobre en el casillero.', time: '08:15' },
        { sender: 'me', text: '¡Excelente laburo! Gracias por avisar crack. Nos vemos a la noche. 👍', time: '08:30' }
      ]
    };
  },

  async render(sucursal) {
    this.initChatsAndMessages();
    const container = document.getElementById('viewContainer');
    
    // Ocultar botón flotante de Nico Chat y su panel para que no se superpongan
    const nicoChatBtn = document.getElementById('nicoChatBtn');
    const nicoPanelBtn = document.getElementById('nico-panel-toggle');
    const nicoPanel = document.getElementById('nico-panel');
    const nicoChatWindow = document.getElementById('nicoChatWindow');

    if (nicoChatBtn) nicoChatBtn.style.setProperty('display', 'none', 'important');
    if (nicoPanelBtn) nicoPanelBtn.style.setProperty('display', 'none', 'important');
    if (nicoPanel) nicoPanel.classList.add('hidden');
    if (nicoChatWindow) nicoChatWindow.classList.add('hidden');

    // Restaurar los botones flotantes de Nico cuando se haga click en cualquier ítem de navegación
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const chatBtn = document.getElementById('nicoChatBtn');
        const panelBtn = document.getElementById('nico-panel-toggle');
        if (chatBtn) chatBtn.style.display = 'flex';
        if (panelBtn) panelBtn.style.display = 'flex';
      });
    });

    // Cargar jugadores del CRM de Supabase
    try {
      this.state.crmJugadores = await DB.getJugadores(sucursal);
    } catch(e) {
      console.error("Error al cargar jugadores del CRM:", e);
      this.state.crmJugadores = [];
    }

    if (!document.getElementById('whatsapp-styles')) {
      const style = document.createElement('style');
      style.id = 'whatsapp-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(25, 27, 34, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .wa-chat-active {
            background: rgba(195, 244, 0, 0.08);
            border-left: 4px solid #c3f400;
        }
        .qr-scanner-line {
            animation: scan 2s linear infinite;
        }
        .text-dark {
            color: #161e00 !important;
        }
        .bg-primary-container {
            background-color: #c3f400 !important;
        }
        .text-on-primary-fixed {
            color: #161e00 !important;
        }
        .chat-pattern-bg {
            background-color: #0c0e14;
            background-image: radial-gradient(rgba(195, 244, 0, 0.04) 1px, transparent 0), radial-gradient(rgba(195, 244, 0, 0.04) 1px, transparent 0);
            background-size: 24px 24px;
            background-position: 0 0, 12px 12px;
        }
        @keyframes scan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
        }
      `;
      document.head.appendChild(style);
    }

    this.renderLayout(container);
    this.updateStatusUI();
    this.renderChatsList();
    this.renderActiveWorkspace();

    // Enlazar eventos de búsqueda
    const searchInput = document.getElementById('waContactSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.state.searchQuery = e.target.value;
        this.renderChatsList(e.target.value);
      };
    }
  },

  renderLayout(container) {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto h-[calc(100vh-7rem)] flex flex-col overflow-hidden space-y-4">
        <!-- Header minimalista -->
        <div class="flex justify-between items-center shrink-0">
          <div>
            <h1 class="text-2xl font-black text-white tracking-tight flex items-center gap-2">💬 WhatsApp Link <span class="text-xs bg-[#c3f400]/15 text-[#c3f400] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">Business Central</span></h1>
            <p class="text-slate-500 text-xs mt-0.5">Comunicate de forma directa con tus clientes, proveedores y equipo de trabajo</p>
          </div>
          <!-- Status Badge minimalista -->
          <div id="waStatusBadge" class="flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs border">
            <!-- Injected Status badge -->
          </div>
        </div>

        <!-- Panel de trabajo tipo WhatsApp Web -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 overflow-hidden bg-slate-950/40 rounded-3xl border border-slate-800/80 shadow-2xl">
          
          <!-- PANEL IZQUIERDO: Buscador & Lista de chats -->
          <div class="col-span-1 border-r border-slate-800/80 flex flex-col min-h-0 bg-[#111319]/40">
            <!-- Header con buscador limpio -->
            <div class="p-4 border-b border-slate-800/60 flex flex-col gap-3 shrink-0">
              <div class="relative">
                <input type="text" id="waContactSearch" class="w-full bg-[#0c0e14] border border-slate-800 rounded-2xl pl-9 pr-8 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#c3f400] transition-all" placeholder="Buscar cliente, proveedor, equipo...">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size:16px">search</span>
                <button id="waClearSearch" onclick="WhatsappView.clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" style="display:none;"><span class="material-symbols-outlined" style="font-size:16px">close</span></button>
              </div>
            </div>

            <!-- Lista de Chats con Scroll Independiente -->
            <div id="chatsListContainer" class="flex-1 overflow-y-auto p-2 space-y-1">
              <!-- Chats list will render here -->
            </div>

            <!-- Footer minimalista del Sidebar -->
            <div id="sidebarConnectionFooter" class="p-3 border-t border-slate-800/80 bg-slate-950/20 shrink-0">
              <!-- Injected connection compact footer -->
            </div>
          </div>

          <!-- PANEL DERECHO: Workspace Dinámico (Chat, QR, o Bienvenida) -->
          <div id="chatWorkspace" class="col-span-1 lg:col-span-2 flex flex-col min-h-0 overflow-hidden relative">
            <!-- Dynamic Workspace Content -->
          </div>

        </div>
      </div>
    `;
  },

  updateStatusUI() {
    const badge = document.getElementById('waStatusBadge');
    const footer = document.getElementById('sidebarConnectionFooter');
    if (!badge || !footer) return;

    if (this.state.status === 'CONNECTED') {
      badge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> CONECTADO`;

      footer.innerHTML = `
        <div class="flex items-center justify-between gap-2 px-1">
          <div class="flex items-center gap-2 min-w-0">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"></div>
            <div class="min-w-0">
              <p class="text-[10px] font-black text-slate-300 truncate">Lanús Sports OS</p>
              <p class="text-[8px] text-slate-500 font-mono">+54 9 11 3909-1975</p>
            </div>
          </div>
          <button onclick="WhatsappView.disconnect()" class="text-[9px] font-bold px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/10 transition-colors uppercase tracking-wider cursor-pointer flex items-center gap-0.5">
            Desconectar <span class="material-symbols-outlined text-[10px]">logout</span>
          </button>
        </div>
      `;
    } else {
      const statusLabels = {
        DISCONNECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'DESCONECTADO', dot: 'bg-red-400' },
        INITIALIZING: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'CONECTANDO...', dot: 'bg-amber-400 animate-ping' },
        QR_READY: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'QR GENERADO', dot: 'bg-amber-400 animate-ping' }
      };

      const st = statusLabels[this.state.status] || statusLabels.DISCONNECTED;
      badge.className = `flex items-center gap-1.5 px-3 py-1 rounded-full font-black text-[10px] ${st.bg} ${st.text} ${st.border}`;
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${st.dot}"></span> ${st.label}`;

      footer.innerHTML = `
        <div class="flex items-center justify-between gap-2 px-1">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${st.dot}"></span>
            <span class="text-[10px] text-slate-400 font-bold">Sin vinculación</span>
          </div>
          <button onclick="WhatsappView.startQrGeneration()" class="text-[9px] font-black px-3 py-1.5 bg-[#c3f400] text-[#161e00] rounded-lg transition-transform active:scale-95 cursor-pointer uppercase flex items-center gap-0.5 shadow-md shadow-[#c3f400]/10">
            Vincular <span class="material-symbols-outlined text-[11px]">qr_code_2</span>
          </button>
        </div>
      `;
    }
  },

  renderChatsList(query = '') {
    const list = document.getElementById('chatsListContainer');
    if (!list) return;

    const clearBtn = document.getElementById('waClearSearch');
    if (clearBtn) {
      clearBtn.style.display = query.trim() ? 'block' : 'none';
    }

    const q = query.toLowerCase().trim();

    // 1. Filtrar chats activos locales
    let filteredChats = this.state.chats;
    if (q) {
      filteredChats = this.state.chats.filter(c => 
        c.nombre.toLowerCase().includes(q) || 
        c.tel.includes(q) ||
        (c.rol && c.rol.toLowerCase().includes(q))
      );
    }

    let html = '';

    // Agrupar los chats de WhatsApp activos por Rol para ordenarlos
    const rolesMap = { EQUIPO: 'Equipo de Trabajo 👥', PROVEEDOR: 'Proveedores de Insumos 📦', CLIENTE: 'Clientes Registrados ⚽' };
    
    if (this.state.status !== 'CONNECTED') {
      // Si no está conectado, no mostramos chats activos para forzar la vinculación
      list.innerHTML = `
        <div class="p-8 text-center text-xs text-slate-500 space-y-2">
          <span class="material-symbols-outlined text-4xl text-slate-600">cloud_off</span>
          <p class="font-bold text-slate-400">WhatsApp Desconectado</p>
          <p class="text-[10px] text-slate-600 leading-relaxed">Vinculá tu celular escaneando el código QR de la derecha para cargar tus chats y contactos activos.</p>
        </div>
      `;
      return;
    }

    if (filteredChats.length > 0) {
      // Agrupar chats
      const grouped = { EQUIPO: [], PROVEEDOR: [], CLIENTE: [] };
      filteredChats.forEach(c => {
        if (grouped[c.rol]) grouped[c.rol].push(c);
        else grouped.CLIENTE.push(c);
      });

      Object.entries(grouped).forEach(([rol, items]) => {
        if (items.length === 0) return;
        
        html += `
          <div class="px-3 py-2 mt-2 mb-1 shrink-0">
            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">${rolesMap[rol] || rol}</span>
          </div>
        `;

        html += items.map(chat => {
          const isSelected = chat.id === this.state.selectedChatId;
          const activeClass = isSelected ? 'wa-chat-active' : 'hover:bg-slate-800/40';
          const readBadge = !chat.leido ? `<span class="w-2 h-2 rounded-full bg-[#c3f400] flex-shrink-0 animate-pulse"></span>` : '';
          
          let roleColor = 'bg-slate-800 text-slate-300';
          if (chat.rol === 'PROVEEDOR') roleColor = 'bg-amber-500/10 text-amber-500';
          else if (chat.rol === 'EQUIPO') roleColor = 'bg-cyan-500/10 text-cyan-400';

          return `
            <div onclick="WhatsappView.selectChat(${chat.id})" class="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-outline-variant/10 ${activeClass} animate-in fade-in duration-200">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-slate-300 text-xs flex-shrink-0">
                  ${chat.nombre.charAt(0)}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h3 class="font-bold text-xs text-on-surface truncate">${chat.nombre}</h3>
                    <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${roleColor} scale-90 shrink-0">${chat.rol}</span>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-0.5 truncate">${chat.ultimo}</p>
                </div>
              </div>
              <div class="text-right flex flex-col items-end gap-1 flex-shrink-0 pl-1">
                <span class="text-[8px] text-slate-500 font-mono">${chat.fecha}</span>
                ${readBadge}
              </div>
            </div>
          `;
        }).join('');
      });
    }

    // 2. Si hay query, buscar en Supabase (CRM / Jugadores)
    if (q) {
      const activeTels = new Set(this.state.chats.map(c => c.tel));
      const crmMatches = (this.state.crmJugadores || []).filter(j => {
        const fullNombre = `${j.nombre} ${j.apellido || ''}`.toLowerCase();
        const tel = String(j.telefono || '');
        return (fullNombre.includes(q) || tel.includes(q)) && !activeTels.has(tel);
      });

      if (crmMatches.length > 0) {
        html += `
          <div class="px-3 py-2 mt-4 mb-1 border-t border-slate-800/60 pt-3">
            <span class="text-[9px] text-[#c3f400] font-bold uppercase tracking-wider">Contactos del CRM / Supabase</span>
          </div>
        `;
        
        html += crmMatches.map(j => {
          const nombreCompleto = `${j.nombre} ${j.apellido || ''}`.trim();
          const telefono = j.telefono;
          
          return `
            <div onclick="WhatsappView.startChatWithCRM('${nombreCompleto}', '${telefono}', 'CLIENTE')" class="flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-slate-800/40 border border-dashed border-slate-800 hover:border-[#c3f400]/30 transition-all duration-200">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-primary-container/10 border border-[#c3f400]/20 flex items-center justify-center font-bold text-primary-container text-xs flex-shrink-0">
                  ${nombreCompleto.charAt(0)}
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xs text-on-surface truncate">${nombreCompleto}</h3>
                  <p class="text-[10px] text-slate-500 font-mono mt-0.5">${telefono}</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-[#c3f400] shrink-0 pr-1 hover:scale-110 transition-transform" style="font-size:16px">chat</span>
            </div>
          `;
        }).join('');
      }

      // 3. Opción de abrir chat directo por número si parece un teléfono
      const digits = q.replace(/\D/g, '');
      if (digits.length >= 8) {
        html += `
          <div class="px-2 mt-4 border-t border-slate-800/60 pt-4">
            <button onclick="WhatsappView.startChatWithCRM('Contacto Nuevo', '${digits}', 'CLIENTE')" class="w-full py-3 bg-[#c3f400]/10 hover:bg-[#c3f400]/20 border border-dashed border-[#c3f400]/30 text-[#c3f400] text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider">
              <span class="material-symbols-outlined text-sm">add_call</span>
              Chatear con +${digits}
            </button>
          </div>
        `;
      }
    }

    list.innerHTML = html || `
      <div class="p-8 text-center text-xs text-slate-500">
        <span class="material-symbols-outlined text-slate-600 text-3xl mb-2">search</span>
        <p>No se encontraron resultados.</p>
        <p class="text-[10px] text-slate-600 mt-1">Probá escribiendo una categoría como "proveedor" o "equipo".</p>
      </div>
    `;
  },

  renderActiveWorkspace() {
    const ws = document.getElementById('chatWorkspace');
    if (!ws) return;

    if (this.state.status !== 'CONNECTED') {
      // --- WORKSPACE: PANTALLA DE VINCULACIÓN QR (CUANDO ESTÁ DESCONECTADO) ---
      this.renderConnectionView(ws);
    } else if (!this.state.selectedChatId) {
      // --- WORKSPACE: PANTALLA DE BIENVENIDA (CONECTADO PERO SIN CHAT) ---
      this.renderWelcomeView(ws);
    } else {
      // --- WORKSPACE: VENTANA DE CHAT ACTIVA ---
      this.renderChatWindowView(ws);
    }
  },

  renderConnectionView(container) {
    if (this.state.status === 'DISCONNECTED') {
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0c0e14]/30 space-y-6">
          <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 border border-red-500/20 shadow-2xl animate-pulse">
            <span class="material-symbols-outlined text-4xl">cloud_off</span>
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-white italic tracking-tight">VINCULÁ TU WHATSAPP BUSINESS</h2>
            <p class="text-slate-400 text-sm max-w-sm mx-auto">Conectá el número oficial del complejo deportivo para levantar todos tus contactos reales, chatear y automatizar los recordatorios de seña con un click.</p>
          </div>
          <button onclick="WhatsappView.startQrGeneration()" class="px-6 py-4 bg-[#c3f400] text-[#161e00] font-black rounded-2xl hover:scale-[1.03] transition-all cursor-pointer flex items-center gap-2 text-xs shadow-lg shadow-[#c3f400]/20 uppercase tracking-widest">
            <span class="material-symbols-outlined">qr_code_2</span> Generar Código QR de Conexión
          </button>
        </div>
      `;
    } 
    else if (this.state.status === 'INITIALIZING') {
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0c0e14]/30 space-y-4 animate-in fade-in duration-300">
          <div class="w-20 h-20 flex items-center justify-center relative">
            <div class="w-14 h-14 border-4 border-[#c3f400] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 class="text-xl font-black text-white italic tracking-tight">CONECTANDO CON EL SERVIDOR VIRTUAL</h2>
          <p class="text-slate-400 text-xs max-w-xs leading-relaxed">CanchaOS se está enlazando a la red segura de WhatsApp. Esperá un toque, crack... Levantando sesión...</p>
        </div>
      `;
    } 
    else if (this.state.status === 'QR_READY') {
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0c0e14]/30 space-y-5 animate-in zoom-in-95 duration-300">
          <div class="space-y-1">
            <h3 class="font-black text-lg text-[#c3f400] italic uppercase tracking-wider">VINCULAR VESTUARIO 🏟️</h3>
            <p class="text-[11px] text-slate-400 max-w-xs mx-auto">Abrí WhatsApp en tu celular → Dispositivos Vinculados → Escanear Código QR</p>
          </div>
          
          <!-- QR Code Container con mira de scanner -->
          <div class="relative w-52 h-52 bg-white p-3 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl shadow-black/60 flex items-center justify-center">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=canchaos_qr_mockup_auth_${Date.now()}" alt="WhatsApp QR Code" class="w-full h-full opacity-90" />
            <div class="absolute inset-0 border-y border-[#c3f400]/65 bg-gradient-to-b from-[#c3f400]/10 to-transparent qr-scanner-line pointer-events-none"></div>
          </div>

          <div class="flex items-center justify-center gap-2 text-xs text-amber-500 font-bold bg-amber-500/10 px-4 py-2.5 rounded-full border border-amber-500/20 animate-pulse">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span> Esperando que el celular escanee...
          </div>
        </div>
      `;

      // Simular escaneo de QR exitoso del usuario
      if (this._qrTimeout) clearTimeout(this._qrTimeout);
      this._qrTimeout = setTimeout(() => {
        this.setConnectionSuccess();
      }, 7000);
    }
  },

  renderWelcomeView(container) {
    container.innerHTML = `
      <div class="flex-1 flex flex-col items-center justify-center p-8 text-center chat-pattern-bg">
        <div class="w-16 h-16 bg-[#c3f400]/10 text-[#c3f400] border border-[#c3f400]/20 rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-3xl">chat</span>
        </div>
        <h2 class="text-2xl font-black text-white italic tracking-tight uppercase mb-1">¡WHATSAPP CONECTADO CRACK! 🟢</h2>
        <p class="text-slate-400 text-xs max-w-sm leading-relaxed mb-6">CanchaOS ya importó y sincronizó tus chats activos, contactos del CRM y proveedores. Seleccioná una conversación en el menú lateral para iniciar la comunicación.</p>
        <div class="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-xs text-left space-y-2">
          <div class="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">💡 Tip de Nico</div>
          <p class="text-[11px] text-slate-400 leading-normal">Podés usar el buscador de la izquierda para filtrar tus chats. Si escribís <strong class="text-[#c3f400]">"proveedor"</strong> te sugerirá los distribuidores, o <strong class="text-[#c3f400]">"equipo"</strong> para el personal.</p>
        </div>
      </div>
    `;
  },

  renderChatWindowView(container) {
    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    if (!chat) return;

    let roleBadgeColor = 'bg-slate-800 text-slate-300';
    if (chat.rol === 'PROVEEDOR') roleBadgeColor = 'bg-amber-500/10 text-amber-400';
    else if (chat.rol === 'EQUIPO') roleBadgeColor = 'bg-cyan-500/10 text-cyan-400';

    container.innerHTML = `
      <!-- Header de la conversación -->
      <div class="p-4 border-b border-slate-800 bg-[#111319]/80 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#c3f400] to-lime-600 flex items-center justify-center text-[#161e00] font-black text-sm shadow-md flex-shrink-0">
            ${chat.nombre.charAt(0)}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-black text-sm text-white truncate">${chat.nombre}</h3>
              <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${roleBadgeColor}">${chat.rol}</span>
            </div>
            <p class="text-[10px] text-slate-500 font-mono mt-0.5">${chat.tel}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="https://wa.me/${chat.tel}" target="_blank" class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#c3f400] hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all" title="Abrir chat en WhatsApp">
            <span class="material-symbols-outlined text-[18px]">open_in_new</span>
          </a>
        </div>
      </div>
      
      <!-- Mensajes del chat con patrón de fondo de chat -->
      <div id="chatMessagesContainer" class="flex-1 overflow-y-auto p-5 space-y-4 chat-pattern-bg min-h-0">
        <!-- Messages will be rendered here -->
      </div>
      
      <!-- Barra de herramientas de Plantillas de Nico (Ultra compacta y discreta) -->
      <div class="px-4 py-2 border-t border-slate-800 bg-slate-900/40 shrink-0">
        <div class="flex gap-2 overflow-x-auto hide-scrollbar py-0.5 items-center">
          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">🤖 Plantillas:</span>
          <button onclick="WhatsappView.applyTemplate('sena')" class="flex-shrink-0 bg-[#c3f400]/10 hover:bg-[#c3f400]/25 text-[#c3f400] text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">💳 Recordatorio Seña</button>
          <button onclick="WhatsappView.applyTemplate('abono')" class="flex-shrink-0 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">🌟 Abono Mensual</button>
          <button onclick="WhatsappView.applyTemplate('espera')" class="flex-shrink-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">🔔 Alerta Espera</button>
          <button onclick="WhatsappView.applyTemplate('cumple')" class="flex-shrink-0 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[9px] font-black px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">🎂 Saludo Cumple</button>
        </div>
      </div>

      <!-- Area de Entrada de texto para mandar mensaje -->
      <div class="p-3 bg-[#111319] border-t border-slate-800/80 flex gap-2 shrink-0">
        <input type="text" id="chatMessageInput" class="flex-1 bg-[#0c0e14] border border-slate-800 rounded-xl px-4 py-3.5 text-xs text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors" placeholder="Escribí un mensaje..." autocomplete="off" onkeypress="if(event.key === 'Enter') WhatsappView.sendMessage()">
        <button onclick="WhatsappView.sendMessage()" class="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-container hover:opacity-90 transition-opacity text-on-primary-fixed cursor-pointer shadow-lg shadow-[#c3f400]/10">
          <span class="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    `;

    this.renderChatMessagesOnly();
  },

  renderChatMessagesOnly() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    if (!chat) return;

    const msgs = this.state.messages[chat.id] || [];
    container.innerHTML = msgs.map(m => {
      const isMe = m.sender === 'me';
      const wrapperClass = isMe ? 'items-end' : 'items-start';
      
      // Estilo de la burbuja impecable
      const bubbleClass = isMe 
        ? 'bg-primary-container text-on-primary-fixed rounded-br-sm shadow-md font-medium' 
        : 'bg-[#1e1f26] text-slate-200 border border-slate-800 rounded-bl-sm';
      const nameColor = 'text-slate-500';
      
      return `
        <div class="flex flex-col gap-0.5 ${wrapperClass} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'} animate-in slide-in-from-bottom-2 duration-200">
          <div class="${bubbleClass} px-4 py-3 rounded-2xl text-[12px] leading-relaxed">
            <p>${m.text}</p>
          </div>
          <span class="text-[8px] ${nameColor} font-mono mt-0.5 pr-1 pl-1">${m.time}</span>
        </div>
      `;
    }).join('');

    // Auto-scroll al final del chat
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  },

  selectChat(id) {
    this.state.selectedChatId = id;
    const chat = this.state.chats.find(c => c.id === id);
    if (chat) chat.leido = true;
    
    // Limpiar el buscador e inyectar el chat activo en el Workspace
    this.clearSearch();
    this.renderActiveWorkspace();
  },

  sendMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    if (!chat) return;

    // Agregar mensaje al historial
    const hour = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    this.state.messages[chat.id] = this.state.messages[chat.id] || [];
    this.state.messages[chat.id].push({ sender: 'me', text: val, time: hour });
    
    // Actualizar previsualización en lista
    chat.ultimo = val;
    chat.fecha = hour;
    chat.leido = true;

    // Limpiar input y renderizar
    input.value = '';
    this.renderChatsList(this.state.searchQuery);
    this.renderChatMessagesOnly();
    
    // Respuestas automáticas dinámicas basadas en el rol o contacto
    this.simularRespuestaAutomatica(chat, val);
  },

  simularRespuestaAutomatica(chat, msgEnviado) {
    const hour = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    let respuesta = '';
    let delay = 3500;

    const lowercase = msgEnviado.toLowerCase();

    if (chat.id === 1) { // Ariel Vera (Dueño)
      respuesta = '¡Excelente Nico! Quedó bárbaro el módulo. Cuidame esa ganancia neta y el buffet. 🏆';
    } 
    else if (chat.rol === 'PROVEEDOR') {
      if (lowercase.includes('pedido') || lowercase.includes('gatorade') || lowercase.includes('coca') || lowercase.includes('pancho')) {
        respuesta = 'Recibido Nico! Ya lo agendé y mañana sale la entrega. Te aviso antes de entrar con el flete.';
      } else {
        respuesta = 'Hola Nico! Dejame consultarlo en el depósito y te confirmo el precio y la disponibilidad.';
      }
    } 
    else if (chat.rol === 'EQUIPO') {
      respuesta = 'Entendido Nico crack, ya estoy al tanto y queda todo bajo control por acá.';
    } 
    else if (chat.rol === 'CLIENTE') {
      if (lowercase.includes('seña') || lowercase.includes('seña') || lowercase.includes('pago')) {
        respuesta = 'Joyita Nico! Ahí te transferí la seña de la cancha. Pasame confirmación cuando te entre.';
      } else if (lowercase.includes('abono')) {
        respuesta = '¡Uff de una crack! Me viene de diez asegurar la cancha de los viernes de una vez por mes. Mandame el abono y te lo pago ya.';
      } else {
        respuesta = '¡Dale Nico crack! Nos vemos en el vestuario a la hora del partido. Guardame unas frías en la heladera.';
      }
    }

    if (respuesta) {
      setTimeout(() => {
        this.state.messages[chat.id].push({ sender: 'them', text: respuesta, time: hour });
        chat.ultimo = respuesta;
        chat.leido = false;
        
        if (this.state.selectedChatId === chat.id) {
          this.renderChatMessagesOnly();
          App.playNotificationSound();
        }
        this.renderChatsList(this.state.searchQuery);
      }, delay);
    }
  },

  applyTemplate(type) {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;

    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    const nombre = chat ? chat.nombre.split(' ')[0] : 'crack';

    let txt = '';
    if (type === 'sena') {
      txt = `¡Hola ${nombre}! ⚽ Te habla Nico de CanchaOS. Te recuerdo que tu reserva de hoy tiene una seña pendiente de $5.000. Volá a pagarlo así te aseguro el lugar antes de que nos lo saquen: https://canchaos.mercadopago.ar/sena 🏟️🏃‍♂️💨`;
    } else if (type === 'abono') {
      txt = `¡Qué hacés, ${nombre} crack! ⚽ Te habla Nico. Veo que jugás todas las semanas firme. ¿Por qué no te pasás al Abono Mensual? Te asegurás tu horario fijo de por vida y te olvidás de andar reservando cada semana. Avisame y te cobro las 4 fechas del mes de un solo golpe. 🏟️🔥`;
    } else if (type === 'espera') {
      txt = `¡Che ${nombre} crack! ⚽ Se acaba de bajar el grupo de las 21:00 hs de hoy. Como estabas anotado en la lista de espera tenés prioridad absoluta. ¡Es tuya si me la confirmás ya! Volá a responder que vuela. 🏟️🏃‍♂️💨`;
    } else if (type === 'cumple') {
      txt = `¡Hola ${nombre}! ⚽ Acá Nico de CanchaOS. ¡Muy feliz cumpleaños, crack! 🎂 Pasá por el buffet que hoy tenés un Gatorade frío de regalo de la casa o un 10% OFF en tu próxima reserva. ¡Que los cumplas fuerte, genio! 🏟️🎈`;
    }

    input.value = txt;
    input.focus();
  },

  startChatWithCRM(nombre, telefono, rol = 'CLIENTE') {
    this.clearSearch();
    
    // Verificamos si ya existe el chat
    let chat = this.state.chats.find(c => c.tel === telefono);
    if (!chat) {
      const newId = this.state.chats.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      chat = {
        id: newId,
        nombre: nombre,
        tel: telefono,
        ultimo: 'Chat iniciado desde CRM',
        fecha: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        leido: true,
        rol: rol
      };
      this.state.chats.push(chat);
      
      this.state.messages[newId] = [
        { sender: 'them', text: `Hola! Soy ${nombre}.`, time: 'Hace un momento' },
        { sender: 'me', text: `¡Hola ${nombre.split(' ')[0]} crack! ⚽ Acá Nico de CanchaOS. ¿Cómo va todo?`, time: 'Hace un momento' }
      ];
    }
    
    this.state.selectedChatId = chat.id;
    this.renderChatsList();
    this.renderActiveWorkspace();
    App.toast(`💬 Chat con ${nombre} iniciado.`, 'success');
  },

  startQrGeneration() {
    this.state.status = 'INITIALIZING';
    localStorage.setItem('canchaos_wa_status', 'INITIALIZING');
    this.updateStatusUI();
    this.renderActiveWorkspace();
    
    setTimeout(() => {
      this.state.status = 'QR_READY';
      localStorage.setItem('canchaos_wa_status', 'QR_READY');
      this.updateStatusUI();
      this.renderActiveWorkspace();
    }, 2500);
  },

  setConnectionSuccess() {
    this.state.status = 'CONNECTED';
    localStorage.setItem('canchaos_wa_status', 'CONNECTED');
    this.updateStatusUI();
    this.renderActiveWorkspace();
    this.renderChatsList();
    App.toast('📶 ¡WhatsApp vinculado con éxito! Sesión activa. 🏆', 'success');
  },

  disconnect() {
    if (this._qrTimeout) clearTimeout(this._qrTimeout);
    this.state.status = 'DISCONNECTED';
    localStorage.setItem('canchaos_wa_status', 'DISCONNECTED');
    this.state.selectedChatId = null;
    this.updateStatusUI();
    this.renderActiveWorkspace();
    this.renderChatsList();
    App.toast('🔐 Sesión de WhatsApp cerrada.', 'info');
  },
  
  clearSearch() {
    const searchInput = document.getElementById('waContactSearch');
    if (searchInput) {
      searchInput.value = '';
    }
    
    const clearBtn = document.getElementById('waClearSearch');
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
    
    this.state.searchQuery = '';
    this.renderChatsList('');
  }
};

// Registrar globalmente en window para que App.js pueda rutear
window.WhatsappView = WhatsappView;
