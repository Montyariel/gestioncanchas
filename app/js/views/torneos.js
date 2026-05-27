// ===== VISTA: TORNEOS CHAMPIONS LEAGUE BRACKET =====
const TorneosView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Inyectar estilos premium del bracket eliminatorio y podio de copas
    container.innerHTML = `
      <style>
        /* Moving space grid background */
        .bracket-board {
          background-color: #0b0d19;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
          background-position: center;
          position: relative;
          min-height: 400px;
          border-radius: 24px;
        }
        
        /* Metallic Match Cards */
        .match-card-3d {
          background: linear-gradient(135deg, #161a26, #0e111a);
          border: 1.5px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          z-index: 10;
        }
        .match-card-3d:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: #c3f400;
          box-shadow: 0 15px 30px rgba(195, 244, 0, 0.15), 0 0 15px rgba(195, 244, 0, 0.05);
        }
        
        /* Active Bracket Connectors */
        .bracket-connector-r {
          position: absolute;
          border: 2px solid rgba(255, 255, 255, 0.06);
          border-left: none;
          z-index: 1;
          transition: all 0.4s ease;
        }
        .match-card-3d:hover + .bracket-connector-r {
          border-color: #c3f400;
          filter: drop-shadow(0 0 4px #c3f400);
        }
        
        /* Trophy Spinning Animation */
        @keyframes trophySpin {
          0% { transform: rotateY(0deg) translateY(0); }
          50% { transform: rotateY(180deg) translateY(-4px); }
          100% { transform: rotateY(360deg) translateY(0); }
        }
        @keyframes shineStar {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .trophy-glow-gold {
          filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.5));
          animation: trophySpin 6s infinite linear;
        }
        .trophy-glow-silver {
          filter: drop-shadow(0 0 6px rgba(192, 192, 192, 0.4));
          animation: trophySpin 6s infinite linear;
          animation-delay: 2s;
        }
        .trophy-glow-bronze {
          filter: drop-shadow(0 0 6px rgba(205, 127, 50, 0.4));
          animation: trophySpin 6s infinite linear;
          animation-delay: 4s;
        }
      </style>

      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 class="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 32px;">emoji_events</span>
              Torneos &amp; Ligas CanchaOS
            </h1>
            <p class="text-on-surface-variant font-medium mt-1">Gestiona fixture eliminatorios, ligas fijas y el podio de campeones.</p>
          </div>
          <button class="bg-[#c3f400] text-[#161e00] px-5 py-2.5 rounded-xl font-bold hover:bg-[#d4ff1a] active:scale-95 transition-all flex items-center gap-2 border-none shadow-lg shadow-[#c3f400]/10 cursor-pointer" onclick="App.toast('Módulo de creación próximamente disponible', 'info')">
            <span class="material-symbols-outlined icon-fill">add_circle</span>
            Crear Nuevo Torneo
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          <!-- BRACKETS CAMPEONATO (2/3 Col) -->
          <div class="lg:col-span-2 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col h-full overflow-hidden">
            <div class="p-5 border-b border-slate-800/60 bg-slate-950/20 flex justify-between items-center">
              <h2 class="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span class="material-symbols-outlined text-[#ffd700]">trophy</span>
                Copa de Verano Premium 2026
              </h2>
              <span class="bg-[#c3f400]/10 text-[#c3f400] border border-[#c3f400]/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 led-active">
                <span class="w-1.5 h-1.5 rounded-full bg-[#c3f400] animate-pulse"></span> Fase Final
              </span>
            </div>
            
            <!-- Bracket Board Visual Area -->
            <div class="flex-1 overflow-x-auto overflow-y-auto p-8 flex items-center justify-center bracket-board">
              
              <div class="flex gap-16 min-w-max items-center h-full relative">
                
                <!-- COLUMN 1: QUARTER FINALS -->
                <div class="flex flex-col justify-center gap-8 w-60 relative z-10">
                  
                  <!-- Match 1 Card -->
                  <div class="relative">
                    <div class="match-card-3d rounded-2xl overflow-hidden">
                      <div class="p-3 border-b border-slate-850 flex justify-between items-center bg-slate-950/30">
                        <span class="font-bold text-slate-200 text-xs flex items-center gap-1.5">Los Pibes FC <span class="text-[#c3f400] font-black">🥇</span></span>
                        <span class="font-mono text-sm font-black text-[#c3f400]">3</span>
                      </div>
                      <div class="p-3 flex justify-between items-center bg-slate-900/40 opacity-40">
                        <span class="font-medium text-slate-400 text-xs">Real Suciedad</span>
                        <span class="font-mono text-sm font-bold text-slate-400">1</span>
                      </div>
                    </div>
                    <!-- Connector line to Semis Match 1 -->
                    <div class="bracket-connector-r" style="top: 50%; right: -64px; width: 64px; height: 96px; border-radius: 0 16px 0 0; border-bottom: none;"></div>
                  </div>

                  <!-- Match 2 Card -->
                  <div class="relative">
                    <div class="match-card-3d rounded-2xl overflow-hidden">
                      <div class="p-3 border-b border-slate-850 flex justify-between items-center bg-slate-900/40 opacity-40">
                        <span class="font-medium text-slate-400 text-xs">Aston Birra</span>
                        <span class="font-mono text-sm font-bold text-slate-400">0</span>
                      </div>
                      <div class="p-3 flex justify-between items-center bg-slate-950/30">
                        <span class="font-bold text-slate-200 text-xs flex items-center gap-1.5">Deportivo Tapita <span class="text-slate-400 font-bold">🥈</span></span>
                        <span class="font-mono text-sm font-black text-[#c3f400]">2</span>
                      </div>
                    </div>
                    <!-- Connector line to Semis Match 1 -->
                    <div class="bracket-connector-r" style="bottom: 50%; right: -64px; width: 64px; height: 96px; border-radius: 0 0 16px 0; border-top: none;"></div>
                  </div>

                </div>

                <!-- COLUMN 2: SEMI FINALS -->
                <div class="flex flex-col justify-center gap-16 w-60 relative z-10">
                  
                  <!-- Semis Match (Match 3) -->
                  <div class="match-card-3d rounded-2xl overflow-hidden border border-[#c3f400]/20 shadow-[0_0_20px_rgba(195,244,0,0.08)]">
                    <div class="p-3 border-b border-slate-850 flex justify-between items-center bg-slate-950/40">
                      <span class="font-bold text-slate-200 text-xs flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-[#c3f400] animate-pulse"></span>
                        Los Pibes FC
                      </span>
                      <span class="font-mono text-xs text-slate-500">-</span>
                    </div>
                    <div class="p-3 flex justify-between items-center bg-slate-950/40">
                      <span class="font-bold text-slate-200 text-xs flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-[#c3f400] animate-pulse"></span>
                        Deportivo Tapita
                      </span>
                      <span class="font-mono text-xs text-slate-500">-</span>
                    </div>
                    <div class="bg-[#c3f400]/10 border-t border-slate-800 text-[#c3f400] text-center py-1.5 text-[9px] font-black uppercase tracking-widest font-mono">
                      Hoy 21:00 hs · Cancha 1 🏟️
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

          <!-- TROPHY ROOM & POSICIONES (1/3 Col) -->
          <div class="lg:col-span-1 flex flex-col gap-6">
            
            <!-- Trophy Room Podio -->
            <div class="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 flex flex-col items-center shadow-2xl relative overflow-hidden">
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.03),transparent_70%)] pointer-events-none"></div>
              <h3 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 self-start flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[#ffd700]" style="font-size:14px;">workspace_premium</span>
                Podio de Campeones (Trophy Room)
              </h3>
              
              <!-- Podio visual elements -->
              <div class="flex items-end justify-center gap-5 w-full py-4 border-b border-slate-800/80 mb-4">
                
                <!-- 2nd Place -->
                <div class="flex flex-col items-center">
                  <span class="text-2xl trophy-glow-silver mb-2">🥈</span>
                  <div class="w-12 h-14 bg-slate-800 rounded-t-xl border border-slate-700/60 flex items-center justify-center shadow-md">
                    <span class="text-[10px] font-black text-slate-400">2do</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-400 mt-2 truncate w-14 text-center">Tapita</span>
                </div>

                <!-- 1st Place (Gold) -->
                <div class="flex flex-col items-center">
                  <span class="text-3xl trophy-glow-gold mb-2">🏆</span>
                  <div class="w-14 h-20 bg-yellow-500/10 border-t-2 border-l border-r border-[#ffd700]/30 rounded-t-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/5">
                    <span class="text-xs font-black text-[#ffd700]">1ro</span>
                  </div>
                  <span class="text-xs font-black text-[#ffd700] mt-2 truncate w-16 text-center">Pibes FC</span>
                </div>

                <!-- 3rd Place -->
                <div class="flex flex-col items-center">
                  <span class="text-2xl trophy-glow-bronze mb-2">🥉</span>
                  <div class="w-12 h-10 bg-slate-800/50 rounded-t-xl border border-slate-750 flex items-center justify-center shadow-md">
                    <span class="text-[10px] font-black text-amber-600">3ro</span>
                  </div>
                  <span class="text-[10px] font-bold text-slate-500 mt-2 truncate w-14 text-center">Aston</span>
                </div>

              </div>

              <div class="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono text-center">
                🏆 COPA DE VERANO CANCHAOS LEYENDAS
              </div>
            </div>

            <!-- Tabla General -->
            <div class="bg-slate-900/40 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl flex-1 max-h-[300px]">
              <div class="p-5 border-b border-slate-800 bg-slate-950/20">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="material-symbols-outlined text-[#c3f400]" style="font-size:18px;">format_list_numbered</span>
                  Tabla General de Posiciones
                </h3>
              </div>
              <div class="flex-1 overflow-y-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-slate-950/60 sticky top-0 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th class="py-2.5 px-4 w-8 text-center">#</th>
                      <th class="py-2.5 px-4">Plantel</th>
                      <th class="py-2.5 px-4 text-center w-12">PTS</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-850 text-slate-300">
                    <tr class="bg-[#c3f400]/5 font-semibold text-slate-200">
                      <td class="py-3 px-4 text-center font-black text-[#c3f400] font-mono text-sm">1</td>
                      <td class="py-3 px-4 font-bold flex items-center gap-1.5">Los Pibes FC <span class="text-[10px]" title="Clasificado a playoffs">🔥</span></td>
                      <td class="py-3 px-4 text-center font-black text-[#c3f400] font-mono text-sm">15</td>
                    </tr>
                    <tr class="hover:bg-slate-800/10 transition-colors">
                      <td class="py-3 px-4 text-center font-bold text-slate-400 font-mono text-xs">2</td>
                      <td class="py-3 px-4">Deportivo Tapita</td>
                      <td class="py-3 px-4 text-center font-bold font-mono text-xs">12</td>
                    </tr>
                    <tr class="hover:bg-slate-800/10 transition-colors">
                      <td class="py-3 px-4 text-center font-bold text-slate-400 font-mono text-xs">3</td>
                      <td class="py-3 px-4">Aston Birra</td>
                      <td class="py-3 px-4 text-center font-bold font-mono text-xs">9</td>
                    </tr>
                    <tr class="hover:bg-slate-800/10 transition-colors opacity-60">
                      <td class="py-3 px-4 text-center font-bold text-slate-500 font-mono text-xs">4</td>
                      <td class="py-3 px-4 text-slate-400">Real Suciedad</td>
                      <td class="py-3 px-4 text-center font-semibold font-mono text-xs">4</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    `;
  }
};
