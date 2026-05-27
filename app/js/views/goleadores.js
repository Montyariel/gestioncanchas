// ===== VISTA: GOLEADORES (Salón de la Fama Balón de Oro) =====
const GoleadoresView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // Inyectar estilos premium auto-contenidos para las cartas FUT
    if (!document.getElementById('goleadores-styles')) {
      const style = document.createElement('style');
      style.id = 'goleadores-styles';
      style.textContent = `
        /* FUT Card container */
        .fut-card {
          position: relative;
          width: 190px;
          height: 270px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ffd700 0%, #b8860b 50%, #d4af37 100%);
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(212, 175, 55, 0.15);
          transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform-style: preserve-3d;
          perspective: 1000px;
          cursor: pointer;
        }
        .fut-card:hover {
          transform: translateY(-8px) scale(1.03) rotateY(5deg);
          box-shadow: 0 20px 35px rgba(0,0,0,0.7), 0 0 25px rgba(212, 175, 55, 0.45);
        }
        .fut-card-inner {
          position: absolute;
          inset: 4px;
          background: linear-gradient(135deg, #111319 0%, #1e2028 60%, #0d0f14 100%);
          border-radius: 12px;
          border: 1.5px solid #d4af37;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          overflow: hidden;
        }
        .fut-card-sheen {
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transform: skewX(-30deg);
          transition: 0.5s;
          pointer-events: none;
          z-index: 10;
        }
        .fut-card:hover .fut-card-sheen {
          left: 150%;
          transition: 0.8s ease-out;
        }
        .fut-card-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: absolute;
          left: 10px;
          top: 10px;
          gap: 1px;
        }
        .fut-rating {
          font-family: 'Lexend', sans-serif;
          font-size: 20px;
          font-weight: 900;
          color: #ffd700;
          line-height: 1;
        }
        .fut-badge-text {
          font-size: 8px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .fut-flag {
          font-size: 11px;
          margin-top: 2px;
        }
        .fut-avatar-box {
          width: 72px;
          height: 72px;
          background: radial-gradient(circle, rgba(212,175,55,0.12) 20%, transparent 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 15px;
          border-radius: 50%;
        }
        .fut-player-name {
          font-family: 'Lexend', sans-serif;
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          text-transform: uppercase;
          margin-top: 12px;
          text-align: center;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 4px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
        .fut-line {
          width: 80%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
          margin: 6px 0;
        }
        .fut-stats-grid {
          display: flex;
          gap: 10px;
          font-family: 'Lexend', sans-serif;
          font-size: 9px;
          color: #9ba3bb;
          font-weight: 500;
        }
        .fut-stats-grid span {
          font-weight: 900;
          color: #ffd700;
        }
        .fut-stats-col {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
          text-align: left;
        }
        /* Top 3 ribbons */
        .ribbon-vip {
          position: absolute;
          top: 8px;
          right: -25px;
          background: linear-gradient(135deg, #ffd700, #b8860b);
          color: #161e00;
          font-size: 7px;
          font-weight: 900;
          padding: 2px 24px;
          transform: rotate(45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 5;
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 pb-20">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-black text-primary tracking-tight flex items-center gap-3">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 32px;">military_tech</span>
              Salón de la Fama CanchaOS
            </h1>
            <p class="text-on-surface-variant font-medium mt-1">Ranking de fidelidad de clientes VIP y convocatoria directa.</p>
          </div>
          <button class="bg-[#c3f400] text-[#161e00] px-5 py-2.5 rounded-xl font-bold hover:bg-[#d4ff1a] active:scale-95 transition-all flex items-center gap-2 border-none">
            <span class="material-symbols-outlined">campaign</span>
            Notificar Promo General
          </button>
        </div>

        <div id="goleadoresContent" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="col-span-1 lg:col-span-3 flex justify-center items-center h-64"><div class="skeleton w-full h-full rounded-2xl"></div></div>
        </div>
      </div>
    `;
    
    try {
      const goleadores = await DB.getGoleadores(sucursal);
      const jugadores = await DB.getJugadores(sucursal);
      const el = document.getElementById('goleadoresContent');

      const vips = goleadores.filter(g => g.partidos >= 10);
      const totalPartidos = goleadores.reduce((acc, curr) => acc + curr.partidos, 0);

      // Render del dashboard con elementos de fidelidad premium
      el.innerHTML = `
        <!-- Stats Overview Cards -->
        <div class="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <div class="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center gap-4 relative overflow-hidden group">
            <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-[#c3f400] group-hover:text-[#161e00] transition-all">
              <span class="material-symbols-outlined">groups</span>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Jugadores</p>
              <p class="text-2xl font-black text-slate-100 font-mono mt-0.5">${goleadores.length}</p>
            </div>
          </div>
          <div class="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center gap-4 relative overflow-hidden group">
            <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-[#c3f400] group-hover:text-[#161e00] transition-all">
              <span class="material-symbols-outlined">sports_soccer</span>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Partidos Jugados</p>
              <p class="text-2xl font-black text-slate-100 font-mono mt-0.5">${totalPartidos}</p>
            </div>
          </div>
          <div class="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center gap-4 relative overflow-hidden group">
            <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-[#ffd700]/80 group-hover:bg-[#ffd700] group-hover:text-[#161e00] transition-all">
              <span class="material-symbols-outlined">workspace_premium</span>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Clientes Leyenda VIP</p>
              <p class="text-2xl font-black text-[#ffd700] font-mono mt-0.5">${vips.length}</p>
            </div>
          </div>
          <div class="bg-slate-900/60 rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center gap-4 relative overflow-hidden group">
            <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-[#c3f400] group-hover:text-[#161e00] transition-all">
              <span class="material-symbols-outlined">database</span>
            </div>
            <div>
              <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Club de Beneficios CRM</p>
              <p class="text-2xl font-black text-slate-100 font-mono mt-0.5">${jugadores.length}</p>
            </div>
          </div>
        </div>

        <!-- 3D FUT Gold Cards Container (Top 4 Leyendas del Complejo) -->
        <div class="lg:col-span-3 bg-slate-950/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 bg-[#ffd700]/5 px-3 py-1 rounded-bl text-[8px] text-[#ffd700] font-mono uppercase tracking-widest border-l border-b border-[#ffd700]/10 z-10">LEGENDS SHEEN ACTIVE</div>
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#ffd700]">trophy</span>
            Cuadro de Oro — Top VIPs de ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}
          </h3>
          
          <div class="flex flex-wrap items-center justify-center gap-6 py-4">
            ${goleadores.slice(0, 4).map((g, i) => {
              const baseRating = 85 + (4 - i) * 3; // e.g. 97, 94, 91, 88 overall ratings
              const fid = Math.min(g.partidos * 8, 99);
              const ast = 90 + (4 - i) * 2;
              const beb = 88 + (4 - i);
              const pnt = 99; // Nico always rates 99

              return `
              <!-- Holographic FUT Card -->
              <div class="fut-card group" onclick="App.toast('¡Clasificado como Leyenda CanchaOS! 🏆', 'success')">
                <div class="fut-card-sheen"></div>
                <div class="fut-card-inner">
                  <div class="ribbon-vip">LEYENDA</div>
                  
                  <!-- Left FUT Info -->
                  <div class="fut-card-header">
                    <div class="fut-rating">${baseRating}</div>
                    <div class="fut-badge-text">VIP</div>
                    <div class="fut-flag">🇦🇷</div>
                  </div>

                  <!-- Avatar Box -->
                  <div class="fut-avatar-box">
                    <span class="material-symbols-outlined text-[48px] text-[#ffd700]/30 animate-pulse">sports_soccer</span>
                  </div>

                  <!-- Player Name -->
                  <div class="fut-player-name" title="${g.nombre}">${g.nombre.split(' ')[0]}</div>
                  
                  <div class="fut-line"></div>

                  <!-- Stats Attributes Grid -->
                  <div class="fut-stats-grid">
                    <div class="fut-stats-col">
                      <div><span>${fid}</span> FID</div>
                      <div><span>${ast}</span> AST</div>
                    </div>
                    <div class="fut-stats-col border-l border-slate-700/50 pl-3">
                      <div><span>${beb}</span> BEB</div>
                      <div><span>${pnt}</span> PNT</div>
                    </div>
                  </div>
                </div>
              </div>
              `;
            }).join('') || `<div class="p-8 text-center text-slate-500 text-xs">Aún no hay clientes con partidos registrados para armar el podio.</div>`}
          </div>
        </div>

        <!-- Leaderboard (Resto del ranking en tabla moderna) -->
        <div class="lg:col-span-2 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col max-h-[500px] overflow-hidden">
          <div class="p-5 border-b border-slate-800/60 bg-slate-950/20 flex justify-between items-center">
            <h2 class="text-sm font-bold text-slate-300 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 20px;">leaderboard</span>
              Ranking de Fidelidad Completo
            </h2>
          </div>
          
          <div class="flex-1 overflow-y-auto p-4 space-y-2">
            ${goleadores.length ? goleadores.map((g, i) => {
              let posStyle = "bg-slate-950/60 text-slate-500 border border-slate-800";
              let crown = i + 1;
              if (i === 0) { posStyle = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"; crown = "🥇"; }
              if (i === 1) { posStyle = "bg-slate-300/10 text-slate-300 border border-slate-300/20"; crown = "🥈"; }
              if (i === 2) { posStyle = "bg-orange-500/10 text-orange-400 border border-orange-500/20"; crown = "🥉"; }

              return `
              <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:border-slate-800 transition-colors group cursor-pointer">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${posStyle}">
                    ${crown}
                  </div>
                  <div>
                    <h3 class="text-xs font-bold text-slate-200 group-hover:text-[#c3f400] transition-colors">${g.nombre}</h3>
                    <p class="text-[10px] text-slate-500 mt-0.5">Ratio de fidelidad: <span class="text-[#c3f400] font-bold">${Math.min(g.partidos * 10, 100)}%</span></p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-black text-slate-100 font-mono">${g.partidos}</div>
                  <div class="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Partidos</div>
                </div>
              </div>
            `;
            }).join('') : `<div class="p-10 text-center text-slate-500 text-xs">No hay datos de clientes para este listado.</div>`}
          </div>
        </div>

        <!-- CRM / Fichas de Convocatoria Directa -->
        <div class="lg:col-span-1 bg-slate-900/40 rounded-3xl border border-slate-800/80 flex flex-col max-h-[500px] overflow-hidden">
          <div class="p-5 border-b border-slate-800/60 bg-slate-950/20">
            <h2 class="text-sm font-bold text-slate-300 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 20px;">contacts</span>
              Base de Convocatoria Directa
            </h2>
          </div>
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            ${jugadores.length ? jugadores.map(j => {
              // Calcular cumpleaños
              const cumpleStr = j.fecha_nacimiento ? j.fecha_nacimiento.split('-').reverse().slice(0,2).join('/') : '';
              
              // Buscar partidos de este jugador en el ranking de goleadores
              const gol = goleadores.find(g => g.nombre.toLowerCase().includes(j.nombre.toLowerCase()) || (j.apellido && g.nombre.toLowerCase().includes(j.apellido.toLowerCase())));
              const partidosCount = gol ? gol.partidos : 0;

              // Generar mensaje contextual personalizado de Nico
              let msgNico = '';
              if (partidosCount >= 10) {
                msgNico = `¡Qué hacés crack, ${j.nombre}! Te habla Nico de CanchaOS. Sos un verdadero fenómeno del complejo y ya metiste ${partidosCount} partidazos con nosotros 🏟️⚽. Te ganaste una Gatorade helada post-partido o un 20% de descuento en el próximo turno. ¡Aprovechalo crack! 🔥⚽`;
              } else {
                msgNico = `¡Hola crack, ${j.nombre}! Te habla Nico de CanchaOS. ¿Cómo venís? Quería ver si se armaba partido esta semana en el complejo de ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}. Escribime y te reservo el horario de una, ¡dale! 🏟️⚽🏆`;
              }
              const waLink = `https://wa.me/${j.telefono}?text=${encodeURIComponent(msgNico)}`;

              return `
              <div class="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 group hover:border-[#c3f400]/40 transition-all text-left">
                <div class="flex justify-between items-start mb-2">
                  <div>
                    <h3 class="text-xs font-bold text-slate-200 group-hover:text-[#c3f400] transition-colors">${j.nombre} ${j.apellido || ''}</h3>
                    <p class="text-[9px] text-slate-500 font-mono mt-0.5">${partidosCount} partidos jugados</p>
                  </div>
                  ${cumpleStr ? `<span class="text-[9px] bg-[#c3f400]/10 text-[#c3f400] px-2 py-0.5 rounded-full border border-[#c3f400]/15 font-bold">🎂 ${cumpleStr}</span>` : ''}
                </div>
                <div class="flex items-center gap-1.5 mb-3">
                   <span class="material-symbols-outlined text-[14px] text-[#c3f400]">call</span>
                   <span class="text-xs font-mono text-slate-400">${j.telefono || 'Sin número'}</span>
                </div>
                <div class="flex gap-2">
                  <a href="${waLink}" target="_blank" 
                     class="flex-1 py-2 bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] rounded-xl text-[10px] font-bold text-center transition-all flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">chat</span>
                    CONVOCAR ⚽
                  </a>
                  <button onclick="App.toast('Perfil de ${j.nombre} actualizado en base', 'info')" class="px-2.5 border border-slate-800 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer">
                    <span class="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                </div>
              </div>
            `;
            }).join('') : `
              <div class="p-8 text-center text-slate-500 text-xs">
                <p>Nadie se unió al Club aún.</p>
                <p class="text-[9px] mt-1.5 opacity-60">Los jugadores aparecerán aquí cuando completen su ficha en el celu.</p>
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
