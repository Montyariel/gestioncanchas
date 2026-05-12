// ===== VISTA: TORNEOS =====
const TorneosView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    if (!document.getElementById('torneos-styles')) {
      const style = document.createElement('style');
      style.id = 'torneos-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(25, 27, 34, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .bracket-node {
            position: relative;
        }
        .bracket-node::after {
            content: '';
            position: absolute;
            right: -24px;
            top: 50%;
            width: 24px;
            height: 2px;
            background: rgba(255,255,255,0.1);
        }
        .bracket-node.winner::after {
            background: #c3f400;
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 class="text-3xl font-black text-primary tracking-tight">Torneos y Ligas</h1>
            <p class="text-on-surface-variant font-medium mt-1">Gestiona campeonatos y tabla de posiciones</p>
          </div>
          <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm" onclick="App.toast('Modo de creación próximamente', 'info')">
            <span class="material-symbols-outlined icon-fill">add</span>
            Crear Torneo
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          <!-- Brackets View -->
          <div class="lg:col-span-2 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col h-full overflow-hidden">
            <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50 flex justify-between items-center">
              <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">emoji_events</span>
                Copa de Verano 2026
              </h2>
              <span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> En Juego
              </span>
            </div>
            
            <div class="flex-1 overflow-x-auto overflow-y-auto p-8 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-surface-container-low via-background to-background">
              <!-- Visual Mockup of Brackets -->
              <div class="flex gap-12 min-w-max items-center h-full">
                <!-- Quarter Finals -->
                <div class="flex flex-col gap-8 w-64">
                  <!-- Match 1 -->
                  <div class="bg-surface-container border border-outline-variant/50 rounded-xl overflow-hidden shadow-lg bracket-node winner relative group">
                    <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="p-3 border-b border-outline-variant/30 flex justify-between items-center">
                      <span class="font-bold text-on-surface">Los Pibes FC</span>
                      <span class="font-stat-number text-primary">3</span>
                    </div>
                    <div class="p-3 flex justify-between items-center opacity-50">
                      <span class="font-medium text-on-surface-variant">Real Suciedad</span>
                      <span class="font-stat-number text-on-surface-variant">1</span>
                    </div>
                  </div>
                  <!-- Match 2 -->
                  <div class="bg-surface-container border border-outline-variant/50 rounded-xl overflow-hidden shadow-lg bracket-node winner relative group mt-4">
                     <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="p-3 border-b border-outline-variant/30 flex justify-between items-center opacity-50">
                      <span class="font-medium text-on-surface-variant">Aston Birra</span>
                      <span class="font-stat-number text-on-surface-variant">0</span>
                    </div>
                    <div class="p-3 flex justify-between items-center">
                      <span class="font-bold text-on-surface">Deportivo Tapita</span>
                      <span class="font-stat-number text-primary">2</span>
                    </div>
                  </div>
                </div>

                <!-- Semi Finals -->
                <div class="flex flex-col justify-center gap-16 w-64 h-full relative">
                  <!-- Connector Lines -->
                  <div class="absolute -left-12 top-[30%] bottom-[30%] w-12 border-t-2 border-b-2 border-r-2 border-primary/50 rounded-r-xl"></div>
                  <div class="absolute -left-12 top-1/2 w-12 border-t-2 border-primary/50"></div>
                  
                  <!-- Match 3 -->
                  <div class="bg-surface-container border border-primary/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(195,244,0,0.1)] bracket-node relative group z-10">
                    <div class="p-3 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high">
                      <span class="font-bold text-on-surface flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Los Pibes FC</span>
                      <span class="font-stat-number text-on-surface-variant">-</span>
                    </div>
                    <div class="p-3 flex justify-between items-center bg-surface-container-high">
                      <span class="font-bold text-on-surface flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Deportivo Tapita</span>
                      <span class="font-stat-number text-on-surface-variant">-</span>
                    </div>
                    <div class="bg-primary text-on-primary text-center py-1 text-[10px] font-bold uppercase tracking-widest">
                      Hoy 21:00 hs - Cancha 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Leaderboard Sidebar -->
          <div class="lg:col-span-1 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col h-full overflow-hidden">
            <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
              <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-secondary-fixed">format_list_numbered</span>
                Tabla General
              </h2>
            </div>
            <div class="flex-1 overflow-y-auto p-0">
              <table class="w-full text-left">
                <thead class="bg-surface-container sticky top-0 border-b border-outline-variant/50">
                  <tr>
                    <th class="py-2 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-8">#</th>
                    <th class="py-2 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Equipo</th>
                    <th class="py-2 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-center">PTS</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30 text-sm">
                  <tr class="bg-primary/5 hover:bg-surface-container/50 transition-colors">
                    <td class="py-3 px-4 font-black text-primary">1</td>
                    <td class="py-3 px-4 font-bold text-on-surface">Los Pibes FC</td>
                    <td class="py-3 px-4 text-center font-black text-primary">15</td>
                  </tr>
                  <tr class="hover:bg-surface-container/50 transition-colors">
                    <td class="py-3 px-4 font-bold text-on-surface-variant">2</td>
                    <td class="py-3 px-4 font-bold text-on-surface">Deportivo Tapita</td>
                    <td class="py-3 px-4 text-center font-bold text-on-surface">12</td>
                  </tr>
                  <tr class="hover:bg-surface-container/50 transition-colors">
                    <td class="py-3 px-4 font-bold text-on-surface-variant">3</td>
                    <td class="py-3 px-4 font-bold text-on-surface">Aston Birra</td>
                    <td class="py-3 px-4 text-center font-bold text-on-surface">9</td>
                  </tr>
                  <tr class="hover:bg-surface-container/50 transition-colors">
                    <td class="py-3 px-4 font-bold text-on-surface-variant">4</td>
                    <td class="py-3 px-4 font-bold text-on-surface">Real Suciedad</td>
                    <td class="py-3 px-4 text-center font-bold text-on-surface">4</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
