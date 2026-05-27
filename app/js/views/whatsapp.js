// ===== VISTA: WHATSAPP (Vincular y enviar mensajes directos) =====
const WhatsappView = {
  state: {
    status: localStorage.getItem('canchaos_wa_status') || 'DISCONNECTED', // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
    chats: [
      { id: 1, nombre: 'Ariel Vera (Dueño)', tel: '5491122334455', ultimo: 'Che, ¿cómo viene la reserva de la Cancha 2?', fecha: '10:45', leido: true },
      { id: 2, nombre: 'Martín Palermo', tel: '5491155443322', ultimo: 'Joyita Nico, guardame 4 Gatorades de manzana.', fecha: '09:30', leido: false },
      { id: 3, nombre: 'Juan Román Riquelme', tel: '5491199887766', ultimo: 'Se liberó el turno de las 21? Avisame crack.', fecha: 'Ayer', leido: true },
      { id: 4, nombre: 'Leo Messi', tel: '5491133221100', ultimo: 'Confirmadísimo el abono mensual de los viernes.', fecha: 'Ayer', leido: true }
    ],
    selectedChatId: 1,
    messages: {
      1: [
        { sender: 'them', text: 'Hola Nico! ¿Todo bien?', time: '10:40' },
        { sender: 'me', text: '¡Qué hacés, Ariel crack! Todo de diez por acá. ¿En qué te puedo ayudar hoy? ⚽🔥', time: '10:42' },
        { sender: 'them', text: 'Che, ¿cómo viene la reserva de la Cancha 2? ¿Hay algún pago pendiente?', time: '10:44' },
        { sender: 'them', text: 'Che, ¿cómo viene la reserva de la Cancha 2?', time: '10:45' }
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
      ]
    }
  },

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Cargar jugadores del CRM
    try {
      this.state.crmJugadores = await DB.getJugadores(sucursal);
    } catch(e) {
      console.error("Error al cargar jugadores del CRM para WhatsApp:", e);
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
    this.renderActiveChat();

    // Atar listener de búsqueda
    const searchInput = document.getElementById('waContactSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.renderChatsList(e.target.value);
      };
    }
  },

  renderLayout(container) {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col overflow-hidden">
        <!-- Header -->
        <div class="flex justify-between items-center shrink-0">
          <div>
            <h1 class="text-3xl font-black text-primary tracking-tight">💬 WhatsApp Business Link</h1>
            <p class="text-on-surface-variant font-medium mt-1">Conectá el WhatsApp del negocio y chateá sin salir de CanchaOS</p>
          </div>
          <!-- Status Badge -->
          <div id="waStatusBadge" class="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs border">
            <!-- Dynamic Status will render here -->
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-hidden">
          
          <!-- LEFT PANEL: Vincular & Chats -->
          <div class="col-span-1 flex flex-col gap-6 min-h-0">
            <!-- Connection Widget (QR or Connected Status) -->
            <div id="connectionWidget" class="glass-panel rounded-3xl p-5 border border-outline-variant/30 flex flex-col items-center text-center shrink-0">
              <!-- Content injected based on Status -->
            </div>

            <!-- Active Chats List -->
            <div class="flex-1 glass-panel rounded-3xl border border-outline-variant/30 flex flex-col min-h-0">
              <div class="p-4 border-b border-outline-variant/30 bg-surface-container-low/50 flex flex-col gap-2 shrink-0">
                <div class="flex justify-between items-center">
                  <h2 class="text-sm font-bold text-on-surface uppercase tracking-wider">Conversaciones Activas</h2>
                  <span class="text-[10px] bg-[#c3f400]/25 text-[#c3f400] px-2 py-0.5 rounded-full font-bold">Lobby</span>
                </div>
                <!-- Buscador de contactos -->
                <div class="relative mt-1">
                  <input type="text" id="waContactSearch" class="w-full bg-[#0c0e14] border border-slate-700/80 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#c3f400] transition-colors" placeholder="Buscar contacto en CRM o escribir tel...">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size:16px">search</span>
                  <button id="waClearSearch" onclick="WhatsappView.clearSearch()" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200" style="display:none;"><span class="material-symbols-outlined" style="font-size:16px">close</span></button>
                </div>
              </div>
              <div id="chatsListContainer" class="flex-1 overflow-y-auto p-2 space-y-1">
                <!-- Chats list will render here -->
              </div>
            </div>
          </div>

          <!-- RIGHT PANEL: Chat Window -->
          <div class="col-span-1 lg:col-span-2 glass-panel rounded-3xl border border-outline-variant/30 flex flex-col min-h-0 overflow-hidden">
            <div id="activeChatHeader" class="p-4 border-b border-outline-variant/30 bg-surface-container-low/50 flex items-center justify-between shrink-0">
              <!-- Injected active chat header -->
            </div>
            
            <div id="chatMessagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0c0e14]/50">
              <!-- Chat history injected here -->
            </div>
            
            <!-- Quick templates (Nico Box) -->
            <div class="p-2.5 bg-surface-container-low/30 border-t border-outline-variant/20 shrink-0">
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1">🤖 Plantillas rápidas de Nico:</p>
              <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                <button onclick="WhatsappView.applyTemplate('sena')" class="flex-shrink-0 bg-primary-container/15 hover:bg-primary-container/25 border border-primary-container/30 text-[#c3f400] text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer">💳 Recordatorio Seña</button>
                <button onclick="WhatsappView.applyTemplate('abono')" class="flex-shrink-0 bg-[#00e3fd]/10 hover:bg-[#00e3fd]/20 border border-[#00e3fd]/30 text-[#00e3fd] text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer">🌟 Abono Mensual</button>
                <button onclick="WhatsappView.applyTemplate('espera')" class="flex-shrink-0 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer">🔔 Se liberó Turno</button>
                <button onclick="WhatsappView.applyTemplate('cumple')" class="flex-shrink-0 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-500 text-[10px] font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer">🎂 Regalo Cumple</button>
              </div>
            </div>

            <!-- Message Input Area -->
            <div class="p-3 bg-surface border-t border-outline-variant/30 flex gap-2 shrink-0">
              <input type="text" id="chatMessageInput" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-primary transition-colors" placeholder="Escribí un mensaje..." autocomplete="off" onkeypress="if(event.key === 'Enter') WhatsappView.sendMessage()">
              <button onclick="WhatsappView.sendMessage()" class="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-container hover:opacity-90 transition-opacity text-on-primary-fixed cursor-pointer">
                <span class="material-symbols-outlined" style="font-size:22px">send</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  updateStatusUI() {
    const badge = document.getElementById('waStatusBadge');
    const widget = document.getElementById('connectionWidget');
    if (!badge || !widget) return;

    if (this.state.status === 'DISCONNECTED') {
      badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse";
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-400"></span> DESCONECTADO`;
      
      widget.innerHTML = `
        <div class="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-3"><span class="material-symbols-outlined text-3xl">cloud_off</span></div>
        <h3 class="font-bold text-sm text-on-surface">Vincular Celular</h3>
        <p class="text-xs text-slate-500 my-2 leading-relaxed max-w-xs">Escanear el QR te permite chatear y enviar confirmaciones automáticas con tu número del negocio.</p>
        <button onclick="WhatsappView.startQrGeneration()" class="mt-2 w-full py-3 bg-primary text-dark rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 text-xs shadow-lg shadow-primary/10">
          <span class="material-symbols-outlined text-sm">qr_code_2</span> GENERAR CÓDIGO QR
        </button>
      `;
    } 
    else if (this.state.status === 'INITIALIZING') {
      badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse";
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span> INICIANDO...`;
      
      widget.innerHTML = `
        <div class="w-24 h-24 flex items-center justify-center my-4 relative">
          <div class="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 class="font-bold text-sm text-on-surface">Levantando Cliente Virtual</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">CanchaOS se está conectando a la red segura de WhatsApp Web. Esperá un toque crack...</p>
      `;
    } 
    else if (this.state.status === 'QR_READY') {
      badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30";
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> QR GENERADO`;
      
      widget.innerHTML = `
        <h3 class="font-black text-sm text-lime-400 italic">VINCULAR VESTUARIO 🏟️</h3>
        <p class="text-[10px] text-slate-500 mt-1 max-w-xs">Abrí WhatsApp en tu cel → Menú → Dispositivos Vinculados → Escanear Código QR</p>
        
        <!-- QR Code Container with scanning overlay -->
        <div class="relative w-44 h-44 bg-white p-2 rounded-2xl my-4 overflow-hidden border border-slate-700 shadow-xl shadow-black/40">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=canchaos_qr_mockup_auth_${Date.now()}" alt="WhatsApp QR Code" class="w-full h-full opacity-85" id="waQrImage" />
          <div class="absolute inset-0 border-y border-primary/50 bg-gradient-to-b from-primary/10 to-transparent qr-scanner-line pointer-events-none"></div>
        </div>

        <div class="flex items-center justify-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10 animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Esperando escaneo del celular...
        </div>
      `;

      // Simular escaneo exitoso del QR después de 6 segundos para fines del walkthrough e interactividad
      this._qrTimeout = setTimeout(() => {
        this.setConnectionSuccess();
      }, 7000);
    } 
    else if (this.state.status === 'CONNECTED') {
      badge.className = "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> CONECTADO`;

      widget.innerHTML = `
        <div class="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mb-2"><span class="material-symbols-outlined text-2xl">verified_user</span></div>
        <h3 class="font-bold text-xs text-on-surface">VINCULADO: Lanús Sports OS</h3>
        <p class="text-[10px] text-slate-500 mt-1 font-mono">+54 9 11 3909-1975</p>
        
        <div class="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-outline-variant/20">
          <div class="p-2 bg-surface/40 border border-outline-variant/20 rounded-xl text-center">
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Respuestas</p>
            <p class="text-md font-black text-primary">Automatizadas</p>
          </div>
          <div class="p-2 bg-surface/40 border border-outline-variant/20 rounded-xl text-center">
            <p class="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Velocidad</p>
            <p class="text-md font-black text-[#00e3fd]">Instantánea</p>
          </div>
        </div>
        
        <button onclick="WhatsappView.disconnect()" class="mt-4 w-full py-2 bg-red-500/15 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold transition-all text-[11px] uppercase tracking-wider cursor-pointer">
          Cerrar Sesión 🔐
        </button>
      `;
    }
  },

  startQrGeneration() {
    this.state.status = 'INITIALIZING';
    localStorage.setItem('canchaos_wa_status', 'INITIALIZING');
    this.updateStatusUI();
    
    setTimeout(() => {
      this.state.status = 'QR_READY';
      localStorage.setItem('canchaos_wa_status', 'QR_READY');
      this.updateStatusUI();
    }, 2500);
  },

  setConnectionSuccess() {
    this.state.status = 'CONNECTED';
    localStorage.setItem('canchaos_wa_status', 'CONNECTED');
    this.updateStatusUI();
    App.toast('📶 ¡WhatsApp vinculado con éxito! Sesión activa. 🏆', 'success');
  },

  disconnect() {
    if (this._qrTimeout) clearTimeout(this._qrTimeout);
    this.state.status = 'DISCONNECTED';
    localStorage.setItem('canchaos_wa_status', 'DISCONNECTED');
    this.updateStatusUI();
    App.toast('🔐 Sesión de WhatsApp cerrada.', 'info');
  },

  renderChatsList(query = '') {
    const list = document.getElementById('chatsListContainer');
    if (!list) return;

    const clearBtn = document.getElementById('waClearSearch');
    if (clearBtn) {
      clearBtn.style.display = query.trim() ? 'block' : 'none';
    }

    const q = query.toLowerCase().trim();
    
    // 1. Filtrar chats activos
    const filteredActive = this.state.chats.filter(c => 
      c.nombre.toLowerCase().includes(q) || 
      c.tel.includes(q)
    );

    let html = '';

    if (filteredActive.length > 0) {
      html += filteredActive.map(chat => {
        const isSelected = chat.id === this.state.selectedChatId;
        const activeClass = isSelected ? 'wa-chat-active' : 'hover:bg-slate-800/40';
        const readBadge = !chat.leido ? `<span class="w-2.5 h-2.5 rounded-full bg-primary-container flex-shrink-0 animate-pulse"></span>` : '';
        
        return `
          <div onclick="WhatsappView.selectChat(${chat.id})" class="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-outline-variant/10 ${activeClass}">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center font-bold text-slate-300 text-sm flex-shrink-0">
                ${chat.nombre.charAt(0)}
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-sm text-on-surface truncate">${chat.nombre}</h3>
                <p class="text-xs text-slate-400 mt-0.5 truncate">${chat.ultimo}</p>
              </div>
            </div>
            <div class="text-right flex flex-col items-end gap-1 flex-shrink-0 pl-2">
              <span class="text-[10px] text-slate-500 font-mono">${chat.fecha}</span>
              ${readBadge}
            </div>
          </div>
        `;
      }).join('');
    } else if (q && !/^\d+$/.test(q)) {
      html += `<div class="p-4 text-center text-xs text-slate-500">Sin chats activos para "${query}"</div>`;
    }

    // 2. Si hay query, buscar en el CRM (Jugadores)
    if (q) {
      const activeTels = new Set(this.state.chats.map(c => c.tel));
      const crmMatches = (this.state.crmJugadores || []).filter(j => {
        const fullNombre = `${j.nombre} ${j.apellido || ''}`.toLowerCase();
        const tel = String(j.telefono || '');
        return (fullNombre.includes(q) || tel.includes(q)) && !activeTels.has(tel);
      });

      if (crmMatches.length > 0) {
        html += `
          <div class="px-3 py-2 mt-4 mb-2">
            <p class="text-[10px] text-[#c3f400] font-bold uppercase tracking-wider">Contactos del CRM / Agenda</p>
          </div>
        `;
        
        html += crmMatches.map(j => {
          const nombreCompleto = `${j.nombre} ${j.apellido || ''}`.trim();
          const telefono = j.telefono;
          
          return `
            <div onclick="WhatsappView.startChatWithCRM('${nombreCompleto}', '${telefono}')" class="flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-slate-800/40 border border-dashed border-outline-variant/20 hover:border-[#c3f400]/30 transition-all">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-full bg-primary-container/10 border border-primary-container/30 flex items-center justify-center font-bold text-primary-container text-xs flex-shrink-0">
                  ${nombreCompleto.charAt(0)}
                </div>
                <div class="min-w-0">
                  <h3 class="font-bold text-xs text-on-surface truncate">${nombreCompleto}</h3>
                  <p class="text-[10px] text-slate-400 font-mono mt-0.5">${telefono}</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-primary-container shrink-0 pr-1 hover:scale-110 transition-transform" style="font-size:18px">chat</span>
            </div>
          `;
        }).join('');
      }

      // 3. Opción de abrir chat directo por número si parece un teléfono
      const digits = q.replace(/\D/g, '');
      if (digits.length >= 8) {
        html += `
          <div class="px-2 mt-4">
            <button onclick="WhatsappView.startChatWithCRM('Contacto Nuevo', '${digits}')" class="w-full py-3 bg-[#c3f400]/10 hover:bg-[#c3f400]/20 border border-dashed border-[#c3f400]/30 text-[#c3f400] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span class="material-symbols-outlined text-sm">add_call</span>
              CHATEAR CON +${digits}
            </button>
          </div>
        `;
      }
    }

    list.innerHTML = html || `
      <div class="p-8 text-center text-xs text-slate-500">
        <span class="material-symbols-outlined text-slate-600 text-3xl mb-2">chat_bubble</span>
        <p>No tenés chats activos.</p>
      </div>
    `;
  },

  renderActiveChat() {
    const header = document.getElementById('activeChatHeader');
    const container = document.getElementById('chatMessagesContainer');
    if (!header || !container) return;

    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    if (!chat) return;

    // Header render
    header.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-11 h-11 rounded-full bg-gradient-to-br from-primary-container to-lime-600 flex items-center justify-center text-on-primary-fixed font-black text-md shadow-md flex-shrink-0">
          ${chat.nombre.charAt(0)}
        </div>
        <div class="min-w-0">
          <h3 class="font-black text-sm text-on-surface truncate">${chat.nombre}</h3>
          <p class="text-xs text-slate-500 font-mono mt-0.5">${chat.tel}</p>
        </div>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <a href="https://wa.me/${chat.tel}" target="_blank" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-container hover:bg-slate-800 transition-colors" title="Abrir en celular">
          <span class="material-symbols-outlined text-[20px]">open_in_new</span>
        </a>
      </div>
    `;

    // Messages render
    const msgs = this.state.messages[chat.id] || [];
    container.innerHTML = msgs.map(m => {
      const isMe = m.sender === 'me';
      const wrapperClass = isMe ? 'items-end' : 'items-start';
      const bubbleClass = isMe 
        ? 'bg-primary-container text-on-primary-fixed rounded-br-sm shadow-primary-container/10 font-bold' 
        : 'bg-[#1e1f26] text-slate-200 border border-slate-700/50 rounded-bl-sm';
      const nameColor = 'text-slate-500';
      
      return `
        <div class="flex flex-col gap-0.5 ${wrapperClass} max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'} animate-in slide-in-from-bottom-2 duration-200">
          <div class="${bubbleClass} px-4 py-2.5 rounded-2xl text-xs leading-relaxed">
            <p>${m.text}</p>
          </div>
          <span class="text-[9px] ${nameColor} font-mono mt-0.5 pr-1 pl-1">${m.time}</span>
        </div>
      `;
    }).join('');

    // Auto-scroll to bottom
    setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
  },

  selectChat(id) {
    this.state.selectedChatId = id;
    const chat = this.state.chats.find(c => c.id === id);
    if (chat) chat.leido = true;
    
    // Limpiamos el buscador al seleccionar
    this.clearSearch();
    this.renderActiveChat();
  },

  sendMessage() {
    const input = document.getElementById('chatMessageInput');
    if (!input) return;

    const val = input.value.trim();
    if (!val) return;

    const chat = this.state.chats.find(c => c.id === this.state.selectedChatId);
    if (!chat) return;

    // Agregar mensaje
    const hour = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    this.state.messages[chat.id] = this.state.messages[chat.id] || [];
    this.state.messages[chat.id].push({ sender: 'me', text: val, time: hour });
    
    // Actualizar último mensaje en chat list
    chat.ultimo = val;
    chat.fecha = hour;
    chat.leido = true;

    // Limpiar input y renderizar
    input.value = '';
    this.renderChatsList();
    this.renderActiveChat();
    
    // Simular respuesta automática de Nico si le hablan al jefe
    if (chat.id === 1) {
      setTimeout(() => {
        this.state.messages[1].push({ 
          sender: 'them', 
          text: '¡Joyita Nico! Quedó espectacular. Cuidame esa ganancia neta. 🏆', 
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        });
        chat.ultimo = '¡Joyita Nico! Quedó espectacular. Cuidame esa ganancia neta. 🏆';
        chat.leido = false;
        this.renderChatsList();
        this.renderActiveChat();
        App.playNotificationSound();
      }, 3500);
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

  startChatWithCRM(nombre, telefono) {
    // Limpiamos el buscador
    this.clearSearch();
    
    // Verificamos si ya existe el chat (por teléfono)
    let chat = this.state.chats.find(c => c.tel === telefono);
    if (!chat) {
      // Creamos un nuevo ID incremental
      const newId = this.state.chats.reduce((max, c) => Math.max(max, c.id), 0) + 1;
      chat = {
        id: newId,
        nombre: nombre,
        tel: telefono,
        ultimo: 'Chat iniciado desde CRM',
        fecha: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        leido: true
      };
      this.state.chats.push(chat);
      
      // Inicializar mensajes vacíos para este chat
      this.state.messages[newId] = [
        { sender: 'them', text: `Hola Nico! Soy ${nombre}.`, time: 'Hace un momento' },
        { sender: 'me', text: `¡Hola ${nombre.split(' ')[0]} crack! ⚽ Acá Nico de CanchaOS. ¿Cómo va todo?`, time: 'Hace un momento' }
      ];
    }
    
    // Seleccionar y refrescar
    this.state.selectedChatId = chat.id;
    this.renderChatsList();
    this.renderActiveChat();
    App.toast(`💬 Chat con ${nombre} iniciado.`, 'success');
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
    
    this.renderChatsList('');
  }
};

// Registrar globalmente en window para que App.js pueda rutear
window.WhatsappView = WhatsappView;
