// ===== VISTA: CAJA DIARIA FINTECH PREMIUM =====
const CajaView = {
  sesionActiva: null,
  movimientos: [],

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    // UI Layout principal con diseño estelar estilo Dashboard Fintech
    container.innerHTML = `
      <style>
        /* Caja Fuerte 3D Styles */
        .safe-scene {
          perspective: 1000px;
        }
        .safe-body {
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #1e293b, #0f172a);
        }
        .safe-body:hover {
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 20px rgba(195, 244, 0, 0.1);
        }
        /* Brushed Metal Cards */
        .metal-card {
          background: linear-gradient(135deg, #1e1f26, #111319);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .metal-card::before {
          content: '';
          position: absolute;
          top: 0; left: -150%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .metal-card:hover::before {
          left: 150%;
        }
        .metal-card:hover {
          transform: translateY(-4px);
          border-color: rgba(195, 244, 0, 0.3);
          box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 15px rgba(195, 244, 0, 0.05);
        }
        /* Thermal Receipt Slot & Printing Styles */
        .receipt-printer-slot {
          background: #090d16;
          height: 12px;
          border-radius: 6px;
          box-shadow: inset 0 3px 6px rgba(0,0,0,0.9), 0 1px 2px rgba(255,255,255,0.05);
          position: relative;
          margin-bottom: -6px;
          z-index: 10;
        }
        .receipt-paper {
          background: #fbfbfb;
          color: #111827;
          font-family: 'Courier New', Courier, monospace;
          box-shadow: 0 15px 40px rgba(0,0,0,0.6);
          border-bottom: 4px dashed #d1d5db;
          overflow: hidden;
          max-height: 0px;
          opacity: 0;
          transform: translateY(-20px);
          animation: printReceipt 2.2s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
          animation-delay: 0.5s;
        }
        @keyframes printReceipt {
          0% {
            max-height: 0px;
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            max-height: 520px;
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Neon Pulsing Badge */
        .led-active {
          box-shadow: 0 0 10px rgba(195,244,0,0.5);
        }
        .led-inactive {
          box-shadow: 0 0 10px rgba(239,68,68,0.5);
        }
      </style>

      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-on-surface tracking-tight flex items-center gap-3">
            <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 32px;">point_of_sale</span>
            Caja Diaria
          </h1>
          <p class="text-on-surface-variant mt-1 text-sm">Apertura interactiva 3D, libro diario en tiempo real y arqueos automatizados en ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}.</p>
        </div>
        <div id="cajaStatusBadge"></div>
      </div>

      <div id="cajaContent" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Skeleton Loader -->
        <div class="lg:col-span-3 bg-surface-container rounded-2xl border border-surface-container-highest p-8 text-center skeleton h-[480px]"></div>
      </div>
    `;

    await this.loadCajaState(sucursal);
  },

  async loadCajaState(sucursal) {
    try {
      // Buscar si hay una sesión abierta para esta sucursal
      const { data: sesiones, error } = await db
        .from('sesiones_caja')
        .select('*')
        .eq('sucursal', sucursal)
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (sesiones && sesiones.length > 0) {
        this.sesionActiva = sesiones[0];
        // Cargar movimientos
        const { data: movs } = await db
          .from('movimientos_caja')
          .select('*')
          .eq('sesion_id', this.sesionActiva.id)
          .order('creado_at', { ascending: false });
        this.movimientos = movs || [];
        this.renderCajaAbierta();
      } else {
        this.sesionActiva = null;
        this.movimientos = [];
        this.renderCajaCerrada();
      }
    } catch (err) {
      console.error("Error al cargar la caja:", err);
      document.getElementById('cajaContent').innerHTML = `
        <div class="lg:col-span-3 bg-surface-container rounded-2xl border border-surface-container-highest p-8 text-center">
          <p class="text-error">Error al conectar con la base de datos de Caja.</p>
        </div>
      `;
    }
  },

  renderCajaCerrada() {
    const badge = document.getElementById('cajaStatusBadge');
    if(badge) {
      badge.innerHTML = `<span class="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 led-inactive"><span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]"></span> CAJA CERRADA</span>`;
    }

    document.getElementById('cajaContent').innerHTML = `
      <div class="lg:col-span-3 bg-surface-container/60 rounded-3xl border border-surface-container-highest p-8 md:p-12 text-center shadow-2xl flex flex-col items-center justify-center relative overflow-hidden" style="min-height: 520px;">
        <!-- Neon header tag -->
        <div class="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase tracking-widest animate-pulse">
          <span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
          Sede ${App?.state?.sucursal?.toUpperCase() || 'LANUS'} · Turno Bloqueado
        </div>

        <div class="safe-scene flex flex-col lg:flex-row items-center justify-center gap-12 mt-6 z-10 w-full max-w-4xl">
          
          <!-- 3D Steel Safe Graphic -->
          <div class="safe-body relative w-72 h-72 rounded-3xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 border-[6px] border-slate-600 shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_2px_10px_rgba(255,255,255,0.15)] flex items-center justify-center overflow-hidden flex-shrink-0">
            <!-- Hinges -->
            <div class="absolute left-[-2px] top-12 w-3.5 h-12 bg-slate-500 rounded-r-md border border-slate-400"></div>
            <div class="absolute left-[-2px] bottom-12 w-3.5 h-12 bg-slate-500 rounded-r-md border border-slate-400"></div>

            <!-- Safe Door (which rotates open) -->
            <div id="safeDoor" class="absolute inset-0 bg-gradient-to-tr from-slate-800 via-slate-900 to-slate-800 flex flex-col items-center justify-center transition-all duration-[1200ms] ease-in-out z-20" style="transform-origin: left center;">
              <!-- Metallic Dial Plate -->
              <div class="relative w-40 h-40 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 border-[6px] border-slate-700 shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.08)] flex items-center justify-center cursor-pointer">
                <!-- Circular notches -->
                <div class="absolute inset-2 rounded-full border-2 border-dashed border-slate-600/30"></div>
                
                <!-- Outer Dial Ring (Spins) -->
                <div id="safeDial" class="absolute inset-0 flex items-center justify-center transition-transform duration-[1500ms] ease-out">
                  <!-- Center handle -->
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 border-4 border-slate-500 shadow-md flex items-center justify-center relative">
                    <!-- Wheel spokes -->
                    <div class="absolute w-2 h-16 bg-slate-500 rounded-full" style="top: -8px;"></div>
                    <div class="absolute w-16 h-2 bg-slate-500 rounded-full" style="left: -8px;"></div>
                    <div class="absolute w-2.5 h-2.5 bg-[#c3f400] rounded-full shadow-[0_0_8px_#c3f400]"></div>
                  </div>
                  <!-- Numbers on dial -->
                  <span class="absolute text-[9px] font-mono font-bold text-slate-400" style="top: 10px;">0</span>
                  <span class="absolute text-[9px] font-mono font-bold text-slate-400" style="right: 10px;">25</span>
                  <span class="absolute text-[9px] font-mono font-bold text-slate-400" style="bottom: 10px;">50</span>
                  <span class="absolute text-[9px] font-mono font-bold text-slate-400" style="left: 10px;">75</span>
                </div>
              </div>
              <div class="mt-3 font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">CanchaOS SecureLock v2</div>
            </div>

            <!-- Safe Inside content (seen when open) -->
            <div class="absolute inset-4 rounded-2xl bg-[#090b10] border border-slate-800 shadow-[inset_0_8px_20px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center text-center p-4">
              <span class="material-symbols-outlined text-[#c3f400] text-5xl animate-bounce">lock_open</span>
              <h4 class="text-xs font-black text-[#c3f400] uppercase mt-3 tracking-widest">¡TURNO AVALADO!</h4>
              <p class="text-[9px] text-slate-500 mt-1.5 max-w-[150px] leading-relaxed">Caja fuerte abierta. Registros de transacciones habilitados.</p>
            </div>
          </div>

          <!-- Fintech Keypad & Control Panel -->
          <div class="w-full max-w-sm bg-slate-950/80 p-6 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col text-left">
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#c3f400]" style="font-size:18px;">key</span>
              Apertura del Turno
            </h3>
            <p class="text-xs text-slate-500 mb-4 leading-normal">Ingresá el saldo físico inicial disponible en el mostrador para desbloquear la sesión.</p>

            <!-- Digital Display -->
            <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-4 flex flex-col relative overflow-hidden">
              <div class="absolute top-0 right-0 bg-[#c3f400]/5 px-2 py-0.5 rounded-bl text-[8px] text-[#c3f400] font-mono uppercase tracking-widest">DISPLAY</div>
              <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Monto Inicial en Efectivo</label>
              <div class="flex items-center">
                <span class="text-2xl font-black text-slate-600 mr-1.5">$</span>
                <input type="text" id="inputMontoInicial" value="" 
                  oninput="this.value = this.value.replace(/\D/g, '')"
                  class="w-full bg-transparent border-none text-2xl font-black text-[#c3f400] focus:ring-0 focus:outline-none p-0 placeholder-slate-800 font-mono" 
                  placeholder="0" autofocus>
              </div>
            </div>

            <!-- Digital Keypad -->
            <div class="grid grid-cols-3 gap-1.5 mb-4">
              <button onclick="CajaView.keypadPress('1')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">1</button>
              <button onclick="CajaView.keypadPress('2')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">2</button>
              <button onclick="CajaView.keypadPress('3')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">3</button>
              <button onclick="CajaView.keypadPress('4')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">4</button>
              <button onclick="CajaView.keypadPress('5')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">5</button>
              <button onclick="CajaView.keypadPress('6')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">6</button>
              <button onclick="CajaView.keypadPress('7')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">7</button>
              <button onclick="CajaView.keypadPress('8')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">8</button>
              <button onclick="CajaView.keypadPress('9')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">9</button>
              <button onclick="CajaView.keypadPress('C')" class="py-2.5 rounded-lg bg-red-950/20 hover:bg-red-900/30 active:scale-95 transition-all text-red-400 font-bold text-md border border-red-900/30">C</button>
              <button onclick="CajaView.keypadPress('0')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">0</button>
              <button onclick="CajaView.keypadPress('00')" class="py-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 active:scale-95 transition-all text-slate-200 hover:text-white font-bold text-md border border-slate-800">00</button>
            </div>

            <!-- Action Button -->
            <button onclick="CajaView.animarYAbrirCaja()" class="w-full py-3.5 rounded-xl font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c3f400]/20 hover:scale-[1.01] border-none font-h3 cursor-pointer">
              <span class="material-symbols-outlined text-[20px] font-bold">rotate_right</span>
              Girar Dial y Habilitar Caja
            </button>
          </div>

        </div>
      </div>
    `;

    // Habilitar auto-foco y teclado dinámico para no usar mouse
    setTimeout(() => {
      const input = document.getElementById('inputMontoInicial');
      if (input) {
        input.focus();
      }
    }, 100);

    const handleGlobalKeydown = (e) => {
      const input = document.getElementById('inputMontoInicial');
      if (!input) {
        document.removeEventListener('keydown', handleGlobalKeydown);
        return;
      }

      // Ignorar si el usuario está escribiendo en el chat o en otro modal
      if (document.activeElement && document.activeElement !== input &&
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA' || 
           document.activeElement.isContentEditable)) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        CajaView.animarYAbrirCaja();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        CajaView.keypadPress('C');
      } else if (e.key >= '0' && e.key <= '9') {
        if (document.activeElement !== input) {
          input.focus();
        }
      }
    };

    if (window._cajaClosedKeydownHandler) {
      document.removeEventListener('keydown', window._cajaClosedKeydownHandler);
    }
    window._cajaClosedKeydownHandler = handleGlobalKeydown;
    document.addEventListener('keydown', handleGlobalKeydown);
  },

  keypadPress(val) {
    const input = document.getElementById('inputMontoInicial');
    if (!input) return;
    if (val === 'C') {
      input.value = '';
    } else {
      if (input.value.length < 9) {
        input.value += val;
      }
    }
  },

  async animarYAbrirCaja() {
    const input = document.getElementById('inputMontoInicial');
    const val = input ? input.value : '';
    if (!val || parseFloat(val) < 0) {
      App.toast('Ingresá un monto inicial válido, crack.', 'error');
      return;
    }

    const dial = document.getElementById('safeDial');
    const door = document.getElementById('safeDoor');
    
    // 1. Girar Dial visualmente
    if (dial) {
      dial.style.transform = 'rotate(720deg)';
    }

    // Esperar que termine el giro
    await new Promise(r => setTimeout(r, 1200));

    // 2. Abrir la puerta 3D con perspectiva
    if (door) {
      door.style.transform = 'perspective(1000px) rotateY(-115deg)';
    }

    // Esperar que se complete la animación
    await new Promise(r => setTimeout(r, 1000));

    // 3. Ejecutar apertura real en Supabase
    await this.abrirCajaReal(parseFloat(val));
  },

  async abrirCajaReal(monto) {
    const sucDefinitiva = App?.state?.sucursal || 'lanus';

    try {
      const { data, error } = await db
        .from('sesiones_caja')
        .insert([{
          sucursal: sucDefinitiva,
          monto_inicial: monto,
          estado: 'abierta'
        }]);
      
      if(error) throw error;
      
      App.toast('¡Caja fuerte abierta correctamente! ¡Buen turno comercial! 🏟️⚽', 'success');
      this.loadCajaState(sucDefinitiva);
    } catch (err) {
      console.error(err);
      App.toast('Error al abrir la sesión en la base de datos.', 'error');
    }
  },

  renderCajaAbierta() {
    const badge = document.getElementById('cajaStatusBadge');
    if(badge) {
      badge.innerHTML = `<span class="bg-lime-400/10 text-lime-400 border border-lime-400/20 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 led-active"><span class="w-2.5 h-2.5 rounded-full bg-[#c3f400] animate-pulse shadow-[0_0_8px_#c3f400]"></span> TURNO ACTIVO</span>`;
    }

    const inicial = parseFloat(this.sesionActiva.monto_inicial || 0);
    
    let totalIngresos = 0;
    let totalEgresos = 0;
    
    let efectivoIngresos = 0;
    let digitalIngresos = 0;

    this.movimientos.forEach(m => {
      const amt = parseFloat(m.monto || 0);
      const desc = m.descripcion || '';
      
      if (m.tipo === 'ingreso') {
        totalIngresos += amt;
        if (desc.includes('[Efectivo]')) {
          efectivoIngresos += amt;
        } else {
          digitalIngresos += amt;
        }
      } else {
        totalEgresos += amt;
      }
    });

    const cajaEsperada = inicial + totalIngresos - totalEgresos;

    // Calcular porcentajes para el gráfico circular SVG
    const totalMedios = efectivoIngresos + digitalIngresos;
    const pctEfectivo = totalMedios > 0 ? Math.round((efectivoIngresos / totalMedios) * 100) : 0;
    const pctDigital = totalMedios > 0 ? Math.round((digitalIngresos / totalMedios) * 100) : 0;
    
    // Circunferencia SVG = 2 * PI * r = 2 * 3.14159 * 36 = 226.2
    const strokeEfectivo = (pctEfectivo / 100) * 226.2;
    const strokeDigital = 226.2 - strokeEfectivo;

    document.getElementById('cajaContent').innerHTML = `
      <!-- COLUMNA IZQUIERDA: RESUMEN FINTECH Y GRÁFICO -->
      <div class="lg:col-span-1 space-y-6">
        
        <!-- Tarjeta Balance Metálica Premium -->
        <div class="metal-card rounded-3xl p-6 shadow-2xl relative">
          <div class="absolute top-0 right-0 p-4 opacity-[0.03]">
            <span class="material-symbols-outlined" style="font-size: 90px;">account_balance_wallet</span>
          </div>
          
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">Estado Financiero</h3>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center pb-3.5 border-b border-slate-800/60">
              <span class="text-slate-400 text-sm">Fondo de Caja Inicial</span>
              <span class="font-bold text-slate-200 font-mono">$${inicial.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center pb-3.5 border-b border-slate-800/60">
              <span class="text-slate-400 text-sm">Total de Ingresos</span>
              <span class="font-bold text-[#c3f400] font-mono">+$${totalIngresos.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center pb-3.5 border-b border-slate-800/60">
              <span class="text-slate-400 text-sm">Total de Egresos</span>
              <span class="font-bold text-red-400 font-mono">-$${totalEgresos.toLocaleString()}</span>
            </div>
            <div class="flex flex-col gap-1 pt-3">
              <span class="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Saldo Esperado en Mostrador</span>
              <div class="flex items-baseline justify-between">
                <span class="text-3xl font-black text-[#c3f400] tracking-tight font-mono">$${cajaEsperada.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button onclick="CajaView.modalCerrarCaja(${cajaEsperada})" class="w-full mt-6 py-3.5 rounded-xl font-bold border-2 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer outline-none shadow-md font-body-md">
            <span class="material-symbols-outlined text-[18px]">lock_clock</span>
            Realizar Arqueo y Cierre
          </button>
        </div>

        <!-- Gráfico Circular de Distribución Financiera -->
        <div class="metal-card rounded-3xl p-6 shadow-2xl flex flex-col items-center">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 self-start">Flujo por Canal de Pago</h3>
          
          ${totalMedios > 0 ? `
            <div class="flex items-center gap-8 w-full justify-center py-2">
              <!-- SVG Donut Chart -->
              <div class="relative w-28 h-28 flex-shrink-0">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <!-- Base Track -->
                  <circle cx="50" cy="50" r="36" stroke="#1e293b" stroke-width="12" fill="transparent" />
                  <!-- Digital Fill (Mercado Pago, Transf) -->
                  <circle cx="50" cy="50" r="36" stroke="#00e3fd" stroke-width="12" fill="transparent"
                    stroke-dasharray="226.2" stroke-dashoffset="0" />
                  <!-- Cash Fill (Efectivo) -->
                  <circle cx="50" cy="50" r="36" stroke="#c3f400" stroke-width="12" fill="transparent"
                    stroke-dasharray="226.2" stroke-dashoffset="${strokeDigital}" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-xs font-bold text-slate-400">Total</span>
                  <span class="text-sm font-black text-slate-100 font-mono">$${totalMedios.toLocaleString()}</span>
                </div>
              </div>

              <!-- Legend -->
              <div class="flex flex-col gap-3 text-left">
                <div class="flex items-center gap-2.5">
                  <span class="w-3 h-3 rounded-full bg-[#c3f400] shadow-[0_0_6px_#c3f400]"></span>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold">Efectivo (${pctEfectivo}%)</div>
                    <div class="text-sm font-bold text-slate-200 font-mono">$${efectivoIngresos.toLocaleString()}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2.5">
                  <span class="w-3 h-3 rounded-full bg-[#00e3fd] shadow-[0_0_6px_#00e3fd]"></span>
                  <div>
                    <div class="text-[10px] text-slate-500 uppercase font-bold">Digital (${pctDigital}%)</div>
                    <div class="text-sm font-bold text-slate-200 font-mono">$${digitalIngresos.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <div class="text-center py-8 text-slate-500 text-xs">
              <span class="material-symbols-outlined text-3xl mb-2 opacity-50">analytics</span>
              <p>Esperando las primeras ventas o reservas para graficar el flujo.</p>
            </div>
          `}
        </div>

      </div>

      <!-- COLUMNA DERECHA: REGISTRO Y LIBRO DIARIO -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Nuevo Movimiento Manual -->
        <div class="metal-card rounded-3xl p-6 shadow-2xl">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5">Ingresar Operación Manual</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Operación</label>
              <select id="movTipo" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer" onchange="CajaView.updateCategorias()">
                <option value="ingreso">🟢 Ingreso</option>
                <option value="egreso">🔴 Egreso (Gasto)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Categoría</label>
              <select id="movCat" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer">
                <!-- Llenado dinámicamente -->
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Importe ($)</label>
              <input type="number" id="movMonto" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors font-mono" placeholder="0">
            </div>
            <div>
              <button onclick="CajaView.registrarMovimiento()" class="w-full py-2 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] active:scale-95 transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                Registrar
              </button>
            </div>
          </div>
          
          <div class="mt-4 flex flex-col md:flex-row gap-4">
            <div class="md:w-1/3">
              <label class="block text-xs font-bold text-slate-400 mb-2">Canal de Pago</label>
              <select id="movMetodo" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer">
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Mercado Pago">📱 Mercado Pago</option>
                <option value="Transferencia">⚡ Transferencia Bancaria</option>
                <option value="Débito">💳 Tarjeta Débito</option>
              </select>
            </div>
            <div class="md:w-2/3">
              <label class="block text-xs font-bold text-slate-400 mb-2">Concepto / Glosa (Opcional)</label>
              <input type="text" id="movDesc" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c3f400] transition-colors" placeholder="Ej: Compra de carbón para buffet, etc...">
            </div>
          </div>
        </div>

        <!-- Libro Diario Histórico -->
        <div class="metal-card rounded-3xl p-6 shadow-2xl">
          <div class="flex justify-between items-center mb-5">
            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Libro Diario (Shift Actual)</h3>
            <span class="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-mono font-bold border border-slate-700">${this.movimientos.length} OPERACIONES</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="text-[10px] uppercase text-slate-500 border-b border-slate-800/80">
                  <th class="pb-3 font-semibold tracking-wider">Hora</th>
                  <th class="pb-3 font-semibold tracking-wider">Categoría</th>
                  <th class="pb-3 font-semibold tracking-wider">Detalle de Operación</th>
                  <th class="pb-3 font-semibold text-right tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${this.movimientos.map(m => {
                  const hora = new Date(m.creado_at).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
                  const esIngreso = m.tipo === 'ingreso';
                  return `
                    <tr class="border-b border-slate-900 hover:bg-slate-800/20 transition-colors">
                      <td class="py-3.5 text-slate-500 font-mono text-xs">${hora}</td>
                      <td class="py-3.5">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${esIngreso ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}">
                          <span class="material-symbols-outlined text-[12px]">${esIngreso ? 'arrow_downward' : 'arrow_upward'}</span>
                          ${m.categoria.toUpperCase()}
                        </span>
                      </td>
                      <td class="py-3.5 text-slate-300 truncate max-w-[240px]" title="${m.descripcion || '-'}">${m.descripcion || '-'}</td>
                      <td class="py-3.5 text-right font-black font-mono ${esIngreso ? 'text-lime-400' : 'text-red-400'}">
                        ${esIngreso ? '+' : '-'}$${parseFloat(m.monto).toLocaleString()}
                      </td>
                    </tr>
                  `;
                }).join('') || `<tr><td colspan="4" class="py-12 text-center text-slate-500 text-xs">No hay movimientos registrados en esta sesión aún.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
    this.updateCategorias();
  },

  updateCategorias() {
    const tipo = document.getElementById('movTipo')?.value;
    const selectCat = document.getElementById('movCat');
    if(!selectCat) return;

    if (tipo === 'ingreso') {
      selectCat.innerHTML = `
        <option value="Venta Buffet">🍔 Venta Buffet</option>
        <option value="Alquiler Cancha">⚽ Alquiler Cancha</option>
        <option value="Ingreso Varios">💡 Otros Ingresos</option>
      `;
    } else {
      selectCat.innerHTML = `
        <option value="Pago Proveedor">📦 Pago a Proveedor</option>
        <option value="Limpieza">🧼 Limpieza / Mant.</option>
        <option value="Adelanto Sueldo">💼 Adelanto Sueldo</option>
        <option value="Gastos Varios">💸 Gastos Varios</option>
      `;
    }
  },

  async registrarMovimiento() {
    const tipo = document.getElementById('movTipo').value;
    const cat = document.getElementById('movCat').value;
    const monto = document.getElementById('movMonto').value;
    const metodo = document.getElementById('movMetodo').value;
    const descRaw = document.getElementById('movDesc').value;
    
    const desc = `[${metodo}] ${descRaw}`.trim();

    if(!monto || parseFloat(monto) <= 0) {
      App.toast('El importe ingresado es inválido, crack.', 'error');
      return;
    }

    try {
      const { error } = await db
        .from('movimientos_caja')
        .insert([{
          sesion_id: this.sesionActiva.id,
          tipo: tipo,
          categoria: cat,
          monto: monto,
          descripcion: desc
        }]);
      
      if(error) throw error;

      App.toast('¡Movimiento asentado en el Libro Diario! 🚀', 'success');
      this.loadCajaState(this.sesionActiva.sucursal);
    } catch (err) {
      console.error(err);
      App.toast('Error al asentar el registro manual.', 'error');
    }
  },

  modalCerrarCaja(cajaEsperada) {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    
    document.querySelector('#modalReserva h2').innerText = 'Cerrar Turno (Arqueo Financiero)';
    
    // Ocultar indicadores de reserva si existen en el modal compartido
    const steps = document.querySelector('#modalReserva .step')?.parentElement;
    if (steps) steps.style.display = 'none';

    body.innerHTML = `
      <div class="bg-surface-container rounded-2xl text-center">
        <p class="text-slate-400 text-xs mb-6 leading-relaxed">Contá el dinero físico real que tenés físicamente en el mostrador e ingresalo abajo. El sistema calculará automáticamente si existen diferencias.</p>
        
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center mb-6">
          <span class="text-xs text-slate-400 uppercase tracking-widest font-bold">Caja Esperada (Sistema):</span>
          <span class="text-xl font-mono font-black text-[#c3f400]">$${cajaEsperada.toLocaleString()}</span>
        </div>

        <div class="text-left mb-6">
          <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Efectivo Físico Contado ($)</label>
          <input type="number" id="inputArqueo" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-[#c3f400] text-3xl font-black text-center font-mono placeholder-slate-800" placeholder="0">
        </div>

        <div class="flex gap-3">
          <button onclick="document.getElementById('modalOverlay').classList.remove('open')" class="flex-1 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800">
            Volver
          </button>
          <button onclick="CajaView.ejecutarCierre(${cajaEsperada})" class="flex-1 py-3.5 rounded-xl font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all flex items-center justify-center gap-2 border-none font-h3 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">lock_clock</span>
            Cerrar Turno
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
  },

  async ejecutarCierre(esperado) {
    const fisico = document.getElementById('inputArqueo').value;
    if(fisico === '') {
      App.toast('Ingresá el monto de arqueo contado, crack.', 'error');
      return;
    }

    const real = parseFloat(fisico);
    const diferencia = real - esperado;

    try {
      const { error } = await db
        .from('sesiones_caja')
        .update({
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          monto_final_esperado: esperado,
          monto_final_real: real,
          diferencia: diferencia
        })
        .eq('id', this.sesionActiva.id);

      if(error) throw error;

      document.getElementById('modalOverlay').classList.remove('open');

      // Si hay faltante crítico, disparamos alerta a Nico Agent
      if (diferencia < 0) {
        App.toast(`Turno cerrado con faltante de $${Math.abs(diferencia)} ⚠️`, 'error');
        if(window.NicoAgent) {
          NicoAgent._pushAlert({
            tipo: 'anomalia',
            icono: '⚠️',
            titulo: 'Faltante de Caja',
            detalle: `Se cerró la caja de ${this.sesionActiva.sucursal.toUpperCase()} con un faltante físico de $${Math.abs(diferencia)}.`,
            prioridad: 'critical',
            timestamp: new Date()
          });
        }
      } else if (diferencia > 0) {
        App.toast(`¡Cierre exitoso! Sobrante: $${diferencia} 🤑`, 'success');
      } else {
        App.toast('¡Caja balanceada perfecta! ¡Un golazo de arqueo! 🏆⚽', 'success');
      }

      // Mostrar el reporte interactivo con la impresora térmica
      this.mostrarReporteCierre(esperado, real, diferencia);

      // Recargar el estado comercial
      this.loadCajaState(this.sesionActiva.sucursal);

    } catch (err) {
      console.error(err);
      App.toast('Error al cerrar la sesión en el servidor.', 'error');
    }
  },

  mostrarReporteCierre(esperado, real, diferencia) {
    const inicial = parseFloat(this.sesionActiva.monto_inicial || 0);
    
    // Desglose del reporte
    let catIngresos = {};
    let catEgresos = {};
    let totalIngresos = 0;
    let totalEgresos = 0;

    this.movimientos.forEach(m => {
      const mnt = parseFloat(m.monto || 0);
      if(m.tipo === 'ingreso') {
        totalIngresos += mnt;
        catIngresos[m.categoria] = (catIngresos[m.categoria] || 0) + mnt;
      } else {
        totalEgresos += mnt;
        catEgresos[m.categoria] = (catEgresos[m.categoria] || 0) + mnt;
      }
    });

    const usr = JSON.parse(localStorage.getItem('canchaos_user')) || {};
    const nombreEmpl = usr.nombre || 'Administrador';
    const fecha = new Date().toLocaleDateString('es-AR');
    const hora = new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});

    let desgloseIngresos = Object.keys(catIngresos).map(k => `  • ${k.padEnd(16)} $${catIngresos[k].toLocaleString().padStart(8)}`).join('\n');
    if(!desgloseIngresos) desgloseIngresos = "  Sin ingresos registrados.";

    let desgloseEgresos = Object.keys(catEgresos).map(k => `  • ${k.padEnd(16)} -$${catEgresos[k].toLocaleString().padStart(7)}`).join('\n');
    if(!desgloseEgresos) desgloseEgresos = "  Sin egresos registrados.";

    const difTexto = diferencia === 0 
      ? '  [x] ARQUEO PERFECTO ($0.00)' 
      : (diferencia > 0 ? `  [+] SOBRANTE:  +$${diferencia.toLocaleString()}` : `  [-] FALTANTE:  -$${Math.abs(diferencia).toLocaleString()}`);

    const ticketTexto = `--------------------------------
   CANCHAOS DEPORTIVO PREMIUM
   SEDE: ${this.sesionActiva.sucursal.toUpperCase()}
--------------------------------
FECHA: ${fecha} | HORA: ${hora}
RESP: ${nombreEmpl.toUpperCase()}
--------------------------------
RESUMEN CONTABLE:
  Fondo Inicial:   $${inicial.toLocaleString().padStart(9)}
  (+) Ingresos:    $${totalIngresos.toLocaleString().padStart(9)}
  (-) Egresos:    -$${totalEgresos.toLocaleString().padStart(9)}
  (=) Esp. Sistema:$${esperado.toLocaleString().padStart(9)}
--------------------------------
ARQUEO FISICO:
  Efectivo Caja:   $${real.toLocaleString().padStart(9)}
${difTexto}
--------------------------------
DESGLOSE INGRESOS:
${desgloseIngresos}
--------------------------------
DESGLOSE EGRESOS:
${desgloseEgresos}
--------------------------------
      ¡GRACIAS POR EL TURNO!
      canchaOS Blindaje Fintech
================================`;

    const encodedText = encodeURIComponent(`🏟️ *CIERRE DE CAJA — CANCHAOS ${this.sesionActiva.sucursal.toUpperCase()}* 🏟️\n\n` + ticketTexto);
    const waLink = `https://wa.me/?text=${encodedText}`;
    const mailLink = `mailto:admin@canchaos.com?subject=Arqueo%20Caja%20${this.sesionActiva.sucursal}%20${fecha}&body=${encodedText}`;

    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    
    document.querySelector('#modalReserva h2').innerHTML = '<span class="material-symbols-outlined text-[#c3f400]">receipt_long</span> Ticket de Cierre Imprimiéndose';

    body.innerHTML = `
      <div class="bg-surface-container rounded-2xl text-center">
        <p class="text-slate-400 text-xs mb-6">El arqueo se guardó en la base de datos de auditoría. Abajo podés ver el ticket físico animado.</p>
        
        <!-- Animated Thermal Printer Simulation -->
        <div class="w-full max-w-sm mx-auto mb-6">
          <!-- Printer Slot -->
          <div class="receipt-printer-slot"></div>
          
          <!-- Printing Ticket -->
          <div class="receipt-paper mx-auto w-[94%] p-5 rounded-t text-left">
            <pre class="text-[10px] leading-relaxed font-mono whitespace-pre text-slate-800 overflow-x-auto">${ticketTexto}</pre>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3">
          <a href="${waLink}" target="_blank" class="flex-1 py-3 bg-[#25D366] text-white hover:bg-[#1ebe57] rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all">
            <span class="material-symbols-outlined text-[16px]">chat</span>
            Enviar por WhatsApp
          </a>
          <a href="${mailLink}" target="_blank" class="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all">
            <span class="material-symbols-outlined text-[16px]">mail</span>
            Enviar por Email
          </a>
        </div>
        
        <button onclick="document.getElementById('modalOverlay').classList.remove('open')" class="mt-4 w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer transition-all">
          Cerrar Reporte
        </button>
      </div>
    `;

    overlay.classList.add('open');
  }
};
