// ===== VISTA: MATCHMAKING RADAR ARENA =====
const MatchmakingView = {
  activeMatches: [
    {
      id: 1,
      titulo: "Fútbol 5 — Los Pibes FC",
      organizador: "Lucas M.",
      fecha: "Hoy, 20:00 hs",
      nivel: "Intermedio",
      costo: "$2.500",
      totalSlots: 10,
      occupiedSlots: 8,
      deporte: "futbol",
      telefono: "5491133334444"
    },
    {
      id: 2,
      titulo: "Fútbol 7 — Mixto Relámpago",
      organizador: "Martina P.",
      fecha: "Mañana, 19:00 hs",
      nivel: "Amateur",
      costo: "$2.000",
      totalSlots: 14,
      occupiedSlots: 13,
      deporte: "futbol",
      telefono: "5491144445555"
    },
    {
      id: 3,
      titulo: "Pádel — Doble Mixto Desafío",
      organizador: "Gaston R.",
      fecha: "Hoy, 22:00 hs",
      nivel: "Avanzado",
      costo: "$4.000",
      totalSlots: 4,
      occupiedSlots: 3,
      deporte: "padel",
      telefono: "5491155556666"
    }
  ],

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Inyectar estilos premium del radar y camisetas
    container.innerHTML = `
      <style>
        /* Radar Scanning Animations */
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; box-shadow: 0 0 0 0 rgba(0, 227, 253, 0.4); }
          50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 10px 4px rgba(0, 227, 253, 0.7); }
        }
        @keyframes jerseyBlink {
          0%, 100% { border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); }
          50% { border-color: #ffd700; background: rgba(245, 158, 11, 0.25); box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); }
        }
        @keyframes printProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        .radar-panel {
          position: relative;
          background: linear-gradient(135deg, #10121a, #161922);
          border: 1px solid rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .radar-screen {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 2px solid rgba(0, 227, 253, 0.15);
          position: relative;
          background: radial-gradient(circle, rgba(0, 227, 253, 0.05) 10%, transparent 80%);
          overflow: hidden;
        }
        .radar-grid-line {
          position: absolute;
          inset: 15px;
          border: 1px dashed rgba(0, 227, 253, 0.1);
          border-radius: 50%;
        }
        .radar-grid-line-inner {
          position: absolute;
          inset: 35px;
          border: 1px dashed rgba(0, 227, 253, 0.08);
          border-radius: 50%;
        }
        .radar-sweep-hand {
          position: absolute;
          width: 50%; height: 2px;
          background: linear-gradient(90deg, rgba(0, 227, 253, 0.8), transparent);
          top: 50%; left: 50%;
          transform-origin: left center;
          animation: radarSweep 4s infinite linear;
          box-shadow: 0 0 8px rgba(0, 227, 253, 0.5);
        }
        .radar-blip {
          position: absolute;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00e3fd;
          animation: pulseGlow 2.5s infinite ease-in-out;
        }
        
        /* Jersey Roster visual representation */
        .jersey-mini {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .jersey-occupied {
          background: linear-gradient(135deg, #1e293b, #334155);
          color: #94a3b8;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .jersey-vacant {
          color: #ffd700;
          animation: jerseyBlink 2s infinite ease-in-out;
        }
        
        /* Join button loading bar overlay */
        .join-btn-progress {
          position: absolute;
          top: 0; left: 0; bottom: 0;
          background: rgba(0, 227, 253, 0.15);
          width: 0%;
          transition: width 1.2s linear;
        }
      </style>

      <div class="max-w-6xl mx-auto space-y-6 pb-20">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <span class="material-symbols-outlined text-[#00e3fd]" style="font-size: 32px;">radar</span>
              Matchmaking Radar Arena
            </h1>
            <p class="text-on-surface-variant font-medium mt-1">Completa partidos vacantes, recluta leyendas y cerrá reservas al instante.</p>
          </div>
          <button class="bg-[#00e3fd] text-[#00363d] px-5 py-2.5 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 border-none shadow-lg shadow-[#00e3fd]/10 cursor-pointer" onclick="MatchmakingView.modalPublicarPartido()">
            <span class="material-symbols-outlined icon-fill">campaign</span>
            Publicar Convocatoria
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- FILTROS & RADAR SIDEBAR -->
          <div class="lg:col-span-1 flex flex-col gap-6 h-max">
            
            <!-- Radar Scanning Widget -->
            <div class="radar-panel rounded-3xl p-6 border border-slate-800 flex flex-col items-center shadow-2xl">
              <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 self-start">Escáner de Proximidad CanchaOS</h3>
              
              <div class="radar-screen mb-4">
                <div class="radar-grid-line"></div>
                <div class="radar-grid-line-inner"></div>
                <div class="radar-sweep-hand"></div>
                
                <!-- Random animated players on radar -->
                <div class="radar-blip" style="top: 25%; left: 35%; animation-delay: 0.2s;"></div>
                <div class="radar-blip" style="top: 60%; left: 70%; animation-delay: 0.8s;"></div>
                <div class="radar-blip" style="top: 75%; left: 20%; animation-delay: 1.5s;"></div>
                <div class="radar-blip" style="top: 35%; left: 80%; animation-delay: 1.1s;"></div>
              </div>
              
              <div class="flex items-center gap-2 text-xs font-semibold text-[#00e3fd]">
                <span class="w-2.5 h-2.5 rounded-full bg-[#00e3fd] led-active animate-ping"></span>
                <span>Buscando jugadores libres en la zona...</span>
              </div>
            </div>

            <!-- Filters -->
            <div class="bg-slate-900/40 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00e3fd]" style="font-size: 18px;">tune</span>
                Filtros Tácticos
              </h3>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Nivel del Partido</label>
                <div class="flex flex-col gap-2.5">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-slate-800 bg-slate-950 text-[#00e3fd] focus:ring-0" checked>
                    <span class="text-slate-300 font-medium text-xs group-hover:text-[#00e3fd] transition-colors">Amateur</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-slate-800 bg-slate-950 text-[#00e3fd] focus:ring-0" checked>
                    <span class="text-slate-300 font-medium text-xs group-hover:text-[#00e3fd] transition-colors">Intermedio</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-slate-800 bg-slate-950 text-[#00e3fd] focus:ring-0">
                    <span class="text-slate-300 font-medium text-xs group-hover:text-[#00e3fd] transition-colors">Leyenda Avanzado</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Disciplina</label>
                <div class="flex gap-2.5">
                  <button class="flex-1 bg-[#00e3fd] text-[#00363d] py-2 rounded-xl font-bold text-xs border-none cursor-pointer">Fútbol ⚽</button>
                  <button class="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all">Pádel 🎾</button>
                </div>
              </div>
            </div>

          </div>

          <!-- FEED DE CONVOCATORIAS ABIERTAS -->
          <div class="lg:col-span-2 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col">
             <div class="p-5 border-b border-slate-800/60 bg-slate-950/20 flex justify-between items-center">
              <h2 class="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span class="material-symbols-outlined text-[#00e3fd]">sports_soccer</span>
                Convocatorias Activas
              </h2>
              <span class="text-xs font-bold text-slate-500 font-mono tracking-wide" id="matchesFoundCount">3 encontradas</span>
            </div>
            
            <div class="flex-1 overflow-y-auto p-5 space-y-4" id="matchmakingFeedContainer">
              <!-- Renderizado dinámico -->
            </div>
          </div>

        </div>
      </div>
    `;

    this.renderFeed();
  },

  renderFeed() {
    const feed = document.getElementById('matchmakingFeedContainer');
    if (!feed) return;

    feed.innerHTML = this.activeMatches.map(m => {
      const remaining = m.totalSlots - m.occupiedSlots;
      const isFull = remaining <= 0;
      
      // Armar la lista visual de camisetas
      let jerseysHtml = '';
      for (let i = 1; i <= m.totalSlots; i++) {
        if (i <= m.occupiedSlots) {
          jerseysHtml += `<div class="jersey-mini jersey-occupied" title="Jugador Confirmado">${i}</div>`;
        } else {
          jerseysHtml += `<div class="jersey-mini jersey-vacant" title="Espacio Disponible">?</div>`;
        }
      }

      // Mensaje comercial de Nico
      const msgNico = `¡Che crack, hablas con Nico! Vi que armaste partido de ${m.titulo} en CanchaOS 🏟️. Se me acaba de bajar gente y tengo la cancha ideal libre. ¿Querés que te sume un pack de 4 Gatorade frías a precio promocional y ya nos guardamos el turno? Avisame ya que vuela! ⚽🔥`;
      const waLink = `https://wa.me/${m.telefono}?text=${encodeURIComponent(msgNico)}`;

      return `
      <!-- Card Convocatoria -->
      <div class="bg-slate-900/30 border border-slate-800/60 hover:border-[#00e3fd]/40 rounded-2xl p-5 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col">
        <div class="absolute right-0 top-0 w-24 h-24 bg-[#00e3fd]/5 rounded-bl-full pointer-events-none group-hover:bg-[#00e3fd]/10 transition-all duration-500"></div>
        
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-slate-950 flex items-center justify-center font-bold text-lg text-[#00e3fd] border border-[#00e3fd]/20 uppercase">
              ${m.organizador[0]}
            </div>
            <div>
              <h3 class="font-bold text-slate-200 text-sm group-hover:text-[#00e3fd] transition-colors leading-tight">${m.titulo}</h3>
              <p class="text-[10px] text-slate-500 mt-1">Liderado por <span class="text-slate-300 font-bold">${m.organizador}</span></p>
            </div>
          </div>
          <span id="badge-slots-${m.id}" class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isFull ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#00e3fd]/10 text-[#00e3fd] border border-[#00e3fd]/20 animate-pulse'}">
            ${isFull ? 'Completo ⚽' : `Faltan ${remaining} cracks`}
          </span>
        </div>

        <!-- Mini-Jersey Roster visual Grid -->
        <div class="mb-5 bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-wrap gap-2 justify-center">
          ${jerseysHtml}
        </div>

        <div class="grid grid-cols-3 gap-2 text-left mb-4 border-t border-slate-850 pt-3.5">
          <div>
            <span class="block text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Fecha / Hora</span>
            <span class="text-slate-300 font-semibold text-xs font-mono">${m.fecha}</span>
          </div>
          <div>
            <span class="block text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Nivel Requerido</span>
            <span class="text-slate-300 font-semibold text-xs">${m.nivel}</span>
          </div>
          <div>
            <span class="block text-[8px] text-slate-500 uppercase tracking-widest font-bold mb-1">Costo Proporcional</span>
            <span class="text-[#00e3fd] font-black text-xs font-mono">${m.costo} / c.u</span>
          </div>
        </div>

        <div class="flex gap-2 mt-auto">
          <!-- Button Join -->
          <button id="btn-join-${m.id}" onclick="MatchmakingView.joinMatch(${m.id}); event.stopPropagation();" ${isFull ? 'disabled' : ''} class="relative flex-1 py-3 bg-[#00e3fd]/10 text-[#00e3fd] hover:bg-[#00e3fd] hover:text-[#00363d] font-bold rounded-xl border border-[#00e3fd]/30 transition-all flex justify-center items-center gap-1.5 cursor-pointer text-xs disabled:opacity-20 disabled:pointer-events-none">
            <div class="join-btn-progress" id="btn-progress-${m.id}"></div>
            <span class="material-symbols-outlined text-[16px] relative z-10">sports_soccer</span>
            <span class="relative z-10" id="btn-label-${m.id}">¡Me sumo al Partido!</span>
          </button>
          
          <a href="${waLink}" target="_blank" onclick="event.stopPropagation();" class="px-3 border border-slate-800 hover:border-[#25D366] rounded-xl bg-slate-950 hover:bg-[#25D366]/5 text-slate-500 hover:text-[#25D366] transition-all flex items-center justify-center cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">chat</span>
          </a>
        </div>
      </div>
      `;
    }).join('');
  },

  async joinMatch(matchId) {
    const match = this.activeMatches.find(m => m.id === matchId);
    if (!match || match.occupiedSlots >= match.totalSlots) return;

    const progress = document.getElementById(`btn-progress-${matchId}`);
    const btn = document.getElementById(`btn-join-${matchId}`);
    const label = document.getElementById(`btn-label-${matchId}`);
    
    if (!progress || !btn || !label) return;

    // Iniciar simulación de carga
    btn.style.pointerEvents = 'none';
    progress.style.width = '100%';
    label.innerText = 'Cargando táctica...';

    await new Promise(r => setTimeout(r, 1200));

    // Modificar datos locales
    match.occupiedSlots++;

    // Efecto de explosión de partículas en la interfaz
    App.toast(`¡Sumado con éxito al partido de ${match.organizador}! ¡A romperla crack! ⚽🏆🔥`, 'success');
    
    // Volver a renderizar
    this.renderFeed();
  },

  modalPublicarPartido() {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    
    document.querySelector('#modalReserva h2').innerText = 'Publicar Convocatoria';
    
    // Ocultar indicators si los hay
    const steps = document.querySelector('#modalReserva .step')?.parentElement;
    if (steps) steps.style.display = 'none';

    body.innerHTML = `
      <div class="bg-surface-container rounded-2xl text-left flex flex-col gap-4">
        <p class="text-slate-400 text-xs leading-normal">Publicá un partido incompleto en el escáner del complejo para que otros jugadores de Lanús/Belgrano se puedan postular rápidamente.</p>
        
        <div>
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nombre del Partido / Equipo</label>
          <input type="text" id="matchPubTitle" placeholder="Ej: Los Galácticos FC, Desafío Padel Lunes" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#00e3fd]">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Organizador</label>
            <input type="text" id="matchPubOrg" placeholder="Tu nombre" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#00e3fd]">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total de Jugadores</label>
            <select id="matchPubTotal" class="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#00e3fd]">
              <option value="10">Fútbol 5 (10 jugadores)</option>
              <option value="14">Fútbol 7 (14 jugadores)</option>
              <option value="4">Pádel Doble (4 jugadores)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fecha y Hora</label>
            <input type="text" id="matchPubFecha" placeholder="Ej: Hoy, 22:30 hs" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#00e3fd]">
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jugadores ya confirmados</label>
            <input type="number" id="matchPubOcc" value="8" min="1" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-[#00e3fd]">
          </div>
        </div>

        <div class="flex gap-3 mt-4">
          <button onclick="document.getElementById('modalOverlay').classList.remove('open')" class="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer">Cancelar</button>
          <button onclick="MatchmakingView.publicarPartidoConfirm()" class="flex-1 py-3 bg-[#00e3fd] text-[#00363d] font-bold rounded-xl hover:opacity-90 transition-all border-none cursor-pointer flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-[16px]">campaign</span>
            Lanzar Convocatoria
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
  },

  publicarPartidoConfirm() {
    const title = document.getElementById('matchPubTitle').value.trim();
    const org = document.getElementById('matchPubOrg').value.trim();
    const total = parseInt(document.getElementById('matchPubTotal').value);
    const date = document.getElementById('matchPubFecha').value.trim();
    const occupied = parseInt(document.getElementById('matchPubOcc').value || 1);

    if (!title || !org || !date || isNaN(occupied)) {
      App.toast('❌ Completá todos los datos de la convocatoria', 'error');
      return;
    }

    if (occupied >= total) {
      App.toast('❌ El número de confirmados no puede superar el total del partido', 'error');
      return;
    }

    const newMatch = {
      id: this.activeMatches.length + 1,
      titulo: title,
      organizador: org,
      fecha: date,
      nivel: "Intermedio",
      costo: "$2.200",
      totalSlots: total,
      occupiedSlots: occupied,
      deporte: total === 4 ? "padel" : "futbol",
      telefono: "5491133334444"
    };

    this.activeMatches.unshift(newMatch);
    document.getElementById('modalOverlay').classList.remove('open');
    App.toast('📢 ¡Convocatoria lanzada al escáner táctico! ¡A reventar esas canchas! 🏟️🔥', 'success');
    this.renderFeed();
  }
};
