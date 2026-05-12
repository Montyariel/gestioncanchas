// ===== VISTA: GOLEADORES (Ranking de clientes) =====
const GoleadoresView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    if (!document.getElementById('goleadores-styles')) {
      const style = document.createElement('style');
      style.id = 'goleadores-styles';
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
            <h1 class="text-3xl font-black text-primary tracking-tight">🏆 Goleadores y Fidelidad</h1>
            <p class="text-on-surface-variant font-medium mt-1">Ranking de los clientes más fieles del complejo</p>
          </div>
          <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
            <span class="material-symbols-outlined icon-fill">campaign</span>
            Crear Promoción
          </button>
        </div>

        <div id="goleadoresContent" class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          <div class="col-span-1 lg:col-span-3 flex justify-center items-center h-64"><div class="skeleton w-full h-full rounded-2xl"></div></div>
        </div>
      </div>
    `;
    
    try {
      const goleadores = await DB.getGoleadores(sucursal);
      const el = document.getElementById('goleadoresContent');

      const vips = goleadores.filter(g => g.partidos >= 10);
      const totalPartidos = goleadores.reduce((acc, curr) => acc + curr.partidos, 0);

      el.innerHTML = `
        <!-- Stats Overview -->
        <div class="col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
            <div class="absolute -right-6 -top-6 text-primary/10"><span class="material-symbols-outlined text-[100px]">groups</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Total Jugadores</p>
            <p class="text-4xl font-black text-on-surface">${goleadores.length}</p>
          </div>
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
            <div class="absolute -right-6 -top-6 text-primary/10"><span class="material-symbols-outlined text-[100px]">sports_soccer</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Partidos Históricos</p>
            <p class="text-4xl font-black text-primary">${totalPartidos}</p>
          </div>
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
            <div class="absolute -right-6 -top-6 text-secondary-fixed/10"><span class="material-symbols-outlined text-[100px]">workspace_premium</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Clientes VIP</p>
            <p class="text-4xl font-black text-secondary-fixed">${vips.length}</p>
          </div>
        </div>

        <!-- Leaderboard -->
        <div class="lg:col-span-2 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col h-full overflow-hidden">
          <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">leaderboard</span>
              Ranking General
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            ${goleadores.length ? goleadores.slice(0, 50).map((g, i) => {
              let posStyle = "bg-surface-container text-on-surface-variant";
              let medal = i + 1;
              if (i === 0) { posStyle = "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"; medal = "🥇"; }
              if (i === 1) { posStyle = "bg-gray-300/20 text-gray-300 border border-gray-300/30"; medal = "🥈"; }
              if (i === 2) { posStyle = "bg-orange-500/20 text-orange-400 border border-orange-500/30"; medal = "🥉"; }

              return `
              <div class="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container transition-colors group cursor-pointer border border-transparent hover:border-outline-variant/30">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${posStyle}">
                    ${medal}
                  </div>
                  <div>
                    <h3 class="font-bold text-on-surface group-hover:text-primary transition-colors">${g.nombre}</h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">Última reserva: ${g.partidos > 0 ? 'Reciente' : 'Desconocida'}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xl font-black text-primary">${g.partidos}</div>
                  <div class="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Partidos</div>
                </div>
              </div>
            `;
            }).join('') : `<div class="p-10 text-center text-on-surface-variant">No hay datos de clientes aún.</div>`}
          </div>
        </div>

        <!-- VIP Club -->
        <div class="lg:col-span-1 glass-panel rounded-2xl border border-outline-variant/30 flex flex-col h-full overflow-hidden">
          <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary-fixed">star</span>
              Club VIP
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            ${vips.length ? vips.map(g => `
              <div class="bg-gradient-to-r from-surface-container to-surface-container-high p-4 rounded-xl border border-outline-variant/30 relative overflow-hidden">
                <div class="absolute -right-2 -bottom-2 text-secondary-fixed/5"><span class="material-symbols-outlined text-[80px]">star</span></div>
                <div class="relative z-10">
                  <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-secondary-fixed text-lg">${g.nombre}</h3>
                    <span class="bg-secondary-fixed/20 text-secondary-fixed text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">Premium</span>
                  </div>
                  <p class="text-sm text-on-surface-variant mb-4"><strong class="text-on-surface">${g.partidos}</strong> reservas completadas.</p>
                  <button onclick="App.toast('Beneficio enviado a ${g.nombre}', 'success')" class="w-full py-2 bg-transparent border border-secondary-fixed text-secondary-fixed hover:bg-secondary-fixed/10 transition-colors rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">card_giftcard</span>
                    Dar Premio
                  </button>
                </div>
              </div>
            `).join('') : `
              <div class="p-8 text-center">
                <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-3">military_tech</span>
                <p class="text-on-surface text-sm font-medium mb-1">Aún no hay VIPs</p>
                <p class="text-xs text-on-surface-variant">Llegan a VIP con 10 partidos.</p>
              </div>
            `}
          </div>
        </div>
      `;
    } catch(e) {
      App.toast('Error cargando goleadores: ' + e.message, 'error');
    }
  }
};
