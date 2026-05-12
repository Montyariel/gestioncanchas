// ===== VISTA: MATCHMAKING =====
const MatchmakingView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    if (!document.getElementById('matchmaking-styles')) {
      const style = document.createElement('style');
      style.id = 'matchmaking-styles';
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
            <h1 class="text-3xl font-black text-secondary-fixed tracking-tight">Matchmaking</h1>
            <p class="text-on-surface-variant font-medium mt-1">Encuentra jugadores y completa tu equipo</p>
          </div>
          <button class="bg-secondary-fixed text-on-secondary-fixed px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm" onclick="App.toast('Modo de publicación próximamente', 'info')">
            <span class="material-symbols-outlined icon-fill">campaign</span>
            Publicar Partido
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          <!-- Filters Sidebar -->
          <div class="lg:col-span-1 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden h-max">
            <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
              <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary-fixed">tune</span>
                Filtros
              </h2>
            </div>
            <div class="p-6 space-y-6">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Nivel de Juego</label>
                <div class="flex flex-col gap-2">
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-outline-variant/50 bg-surface-container text-secondary-fixed focus:ring-secondary-fixed" checked>
                    <span class="text-on-surface font-medium group-hover:text-secondary-fixed transition-colors">Amateur</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-outline-variant/50 bg-surface-container text-secondary-fixed focus:ring-secondary-fixed" checked>
                    <span class="text-on-surface font-medium group-hover:text-secondary-fixed transition-colors">Intermedio</span>
                  </label>
                  <label class="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" class="w-5 h-5 rounded border-outline-variant/50 bg-surface-container text-secondary-fixed focus:ring-secondary-fixed">
                    <span class="text-on-surface font-medium group-hover:text-secondary-fixed transition-colors">Avanzado</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Deporte</label>
                <div class="flex gap-2">
                  <button class="flex-1 bg-secondary-fixed text-on-secondary-fixed py-2 rounded-lg font-bold text-sm">Fútbol</button>
                  <button class="flex-1 bg-surface-container border border-outline-variant/50 text-on-surface-variant py-2 rounded-lg font-bold text-sm hover:text-on-surface transition-colors">Pádel</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Feed -->
          <div class="lg:col-span-2 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col h-full overflow-hidden">
             <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50 flex justify-between items-center">
              <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary-fixed">radar</span>
                Partidos Abiertos
              </h2>
              <span class="text-sm font-bold text-on-surface-variant">3 encontrados</span>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <!-- Match 1 -->
              <div class="bg-surface-container border border-outline-variant/50 rounded-xl p-5 hover:border-secondary-fixed/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div class="absolute right-0 top-0 w-24 h-24 bg-secondary-fixed/5 rounded-bl-full pointer-events-none group-hover:bg-secondary-fixed/10 transition-colors"></div>
                
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xl text-secondary-fixed border border-secondary-fixed/30">L</div>
                    <div>
                      <h3 class="font-bold text-on-surface text-lg group-hover:text-secondary-fixed transition-colors">Fútbol 5 - Los Pibes FC</h3>
                      <p class="text-sm text-on-surface-variant">Organizado por Lucas M.</p>
                    </div>
                  </div>
                  <span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Faltan 2</span>
                </div>

                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Fecha</span>
                    <span class="text-on-surface font-medium text-sm">Hoy, 20:00 hs</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Nivel</span>
                    <span class="text-on-surface font-medium text-sm">Intermedio</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Costo Aprox</span>
                    <span class="text-secondary-fixed font-bold text-sm">$2.500 c/u</span>
                  </div>
                </div>

                <button class="w-full py-3 bg-secondary-fixed/10 text-secondary-fixed font-bold rounded-lg border border-secondary-fixed/30 hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors flex justify-center items-center gap-2">
                  <span class="material-symbols-outlined text-[20px]">sports_soccer</span>
                  Unirme al Partido
                </button>
              </div>

               <!-- Match 2 -->
              <div class="bg-surface-container border border-outline-variant/50 rounded-xl p-5 hover:border-secondary-fixed/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xl text-secondary-fixed border border-secondary-fixed/30">M</div>
                    <div>
                      <h3 class="font-bold text-on-surface text-lg group-hover:text-secondary-fixed transition-colors">Fútbol 7 - Mixto</h3>
                      <p class="text-sm text-on-surface-variant">Organizado por Martina P.</p>
                    </div>
                  </div>
                  <span class="bg-error/20 text-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Falta 1</span>
                </div>

                <div class="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Fecha</span>
                    <span class="text-on-surface font-medium text-sm">Mañana, 19:00 hs</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Nivel</span>
                    <span class="text-on-surface font-medium text-sm">Amateur</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Costo Aprox</span>
                    <span class="text-secondary-fixed font-bold text-sm">$2.000 c/u</span>
                  </div>
                </div>

                <button class="w-full py-3 bg-secondary-fixed/10 text-secondary-fixed font-bold rounded-lg border border-secondary-fixed/30 hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors flex justify-center items-center gap-2">
                  <span class="material-symbols-outlined text-[20px]">sports_soccer</span>
                  Unirme al Partido
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    `;
  }
};
