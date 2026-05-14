// ===== VISTA: CAJA DIARIA =====
const CajaView = {
  sesionActiva: null,
  movimientos: [],

  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    const role = (JSON.parse(localStorage.getItem('sportplex_user')) || {}).rol || 'empleado';
    
    // UI Layout principal
    container.innerHTML = `
      <div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-on-surface tracking-tight flex items-center gap-3">
            <span class="material-symbols-outlined text-[#c3f400]" style="font-size: 32px;">point_of_sale</span>
            Caja Diaria
          </h1>
          <p class="text-on-surface-variant mt-1 text-sm">Apertura, movimientos y cierre de turno en ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}.</p>
        </div>
        <div id="cajaStatusBadge"></div>
      </div>

      <div id="cajaContent" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Skeleton Loader -->
        <div class="lg:col-span-3 bg-surface-container rounded-2xl border border-surface-container-highest p-8 text-center skeleton h-64"></div>
      </div>
    `;

    await this.loadCajaState(sucursal);
  },

  async loadCajaState(sucursal) {
    try {
      // 1. Buscar si hay una sesión abierta para esta sucursal
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
      badge.innerHTML = `<span class="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-400"></span> CAJA CERRADA</span>`;
    }

    document.getElementById('cajaContent').innerHTML = `
      <div class="lg:col-span-3 bg-surface-container rounded-2xl border border-surface-container-highest p-12 text-center shadow-xl flex flex-col items-center">
        <div class="w-24 h-24 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined text-slate-500" style="font-size: 48px;">lock</span>
        </div>
        <h2 class="text-2xl font-bold text-on-surface mb-2">El turno no ha comenzado</h2>
        <p class="text-slate-400 max-w-md mb-8">Para poder registrar ventas, pagos a proveedores o alquileres, primero debés abrir la caja indicando con cuánto dinero físico arrancás en el mostrador.</p>
        
        <div class="bg-surface-container-high p-6 rounded-xl border border-surface-container-highest w-full max-w-sm">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-left">Monto Físico Inicial ($)</label>
          <input type="number" id="inputMontoInicial" class="w-full bg-surface border border-surface-container-highest rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#c3f400] mb-4 text-2xl font-bold text-center" placeholder="Ej: 5000">
          <button onclick="CajaView.abrirCaja()" class="w-full py-3 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all shadow-lg flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">key</span>
            Abrir Turno de Caja
          </button>
        </div>
      </div>
    `;
  },

  renderCajaAbierta() {
    const badge = document.getElementById('cajaStatusBadge');
    if(badge) {
      badge.innerHTML = `<span class="bg-lime-400/20 text-lime-400 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span> TURNO ACTIVO</span>`;
    }

    const inicial = parseFloat(this.sesionActiva.monto_inicial || 0);
    
    let totalIngresos = 0;
    let totalEgresos = 0;
    
    this.movimientos.forEach(m => {
      if(m.tipo === 'ingreso') totalIngresos += parseFloat(m.monto);
      if(m.tipo === 'egreso') totalEgresos += parseFloat(m.monto);
    });

    const cajaEsperada = inicial + totalIngresos - totalEgresos;

    document.getElementById('cajaContent').innerHTML = `
      <!-- COLUMNA IZQUIERDA: RESUMEN Y CIERRE -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-surface-container rounded-2xl border border-surface-container-highest p-6 shadow-xl relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-10">
            <span class="material-symbols-outlined" style="font-size: 80px;">account_balance_wallet</span>
          </div>
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 relative z-10">Balance del Turno</h3>
          
          <div class="space-y-4 relative z-10">
            <div class="flex justify-between items-center pb-3 border-b border-surface-container-highest">
              <span class="text-slate-300">Fondo Inicial</span>
              <span class="font-bold text-white">$${inicial.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-surface-container-highest">
              <span class="text-slate-300">Ingresos</span>
              <span class="font-bold text-lime-400">+$${totalIngresos.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center pb-3 border-b border-surface-container-highest">
              <span class="text-slate-300">Egresos</span>
              <span class="font-bold text-red-400">-$${totalEgresos.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center pt-2">
              <span class="text-slate-400 text-sm uppercase font-bold">Caja Esperada</span>
              <span class="text-3xl font-black text-[#c3f400]">$${cajaEsperada.toLocaleString()}</span>
            </div>
          </div>

          <button onclick="CajaView.modalCerrarCaja(${cajaEsperada})" class="w-full mt-6 py-3 rounded-lg font-bold border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <span class="material-symbols-outlined">lock_clock</span>
            Cerrar Turno (Arqueo)
          </button>
        </div>
      </div>

      <!-- COLUMNA DERECHA: REGISTRO Y LIBRO DIARIO -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Nuevo Movimiento -->
        <div class="bg-surface-container rounded-2xl border border-surface-container-highest p-6 shadow-xl">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Registrar Movimiento Manual</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Tipo</label>
              <select id="movTipo" class="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-on-surface focus:border-[#c3f400]" onchange="CajaView.updateCategorias()">
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso (Gasto)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Categoría</label>
              <select id="movCat" class="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-on-surface focus:border-[#c3f400]">
                <!-- Llenado dinámicamente -->
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 mb-2">Monto ($)</label>
              <input type="number" id="movMonto" class="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-on-surface focus:border-[#c3f400]" placeholder="0">
            </div>
            <div>
              <button onclick="CajaView.registrarMovimiento()" class="w-full py-2.5 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all flex items-center justify-center gap-2">
                <span class="material-symbols-outlined" style="font-size:18px">add</span>
                Añadir
              </button>
            </div>
          </div>
          <div class="mt-4">
            <input type="text" id="movDesc" class="w-full bg-surface border border-surface-container-highest rounded-lg px-3 py-2 text-sm text-on-surface focus:border-[#c3f400]" placeholder="Descripción / Aclaración (Opcional)">
          </div>
        </div>

        <!-- Historial -->
        <div class="bg-surface-container rounded-2xl border border-surface-container-highest p-6 shadow-xl">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Libro Diario (Movimientos)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="text-xs uppercase text-slate-500 border-b border-surface-container-highest">
                  <th class="pb-3 font-semibold">Hora</th>
                  <th class="pb-3 font-semibold">Tipo / Categoría</th>
                  <th class="pb-3 font-semibold">Detalle</th>
                  <th class="pb-3 font-semibold text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                ${this.movimientos.map(m => {
                  const hora = new Date(m.creado_at).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
                  const esIngreso = m.tipo === 'ingreso';
                  return `
                    <tr class="border-b border-surface-container-highest/50 hover:bg-surface/30 transition-colors">
                      <td class="py-3 text-slate-400">${hora}</td>
                      <td class="py-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${esIngreso ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'}">
                          <span class="material-symbols-outlined" style="font-size:14px">${esIngreso ? 'arrow_downward' : 'arrow_upward'}</span>
                          ${m.categoria}
                        </span>
                      </td>
                      <td class="py-3 text-slate-300 truncate max-w-[200px]">${m.descripcion || '-'}</td>
                      <td class="py-3 text-right font-bold ${esIngreso ? 'text-lime-400' : 'text-red-400'}">
                        ${esIngreso ? '+' : '-'}$${parseFloat(m.monto).toLocaleString()}
                      </td>
                    </tr>
                  `;
                }).join('') || `<tr><td colspan="4" class="py-6 text-center text-slate-500">No hay movimientos en este turno.</td></tr>`}
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
        <option value="Venta Buffet">Venta Buffet</option>
        <option value="Alquiler Cancha">Alquiler Cancha</option>
        <option value="Ingreso Varios">Otros Ingresos</option>
      `;
    } else {
      selectCat.innerHTML = `
        <option value="Pago Proveedor">Pago a Proveedor</option>
        <option value="Limpieza">Art. Limpieza / Mantenimiento</option>
        <option value="Adelanto Sueldo">Adelanto de Sueldo</option>
        <option value="Gastos Varios">Gastos Varios</option>
      `;
    }
  },

  async abrirCaja() {
    const monto = document.getElementById('inputMontoInicial').value;
    if(!monto || monto < 0) {
      App.toast('Ingresá un monto inicial válido.', 'error');
      return;
    }

    const sucursal = document.querySelector('.bg-lime-400\\/20') ? 'lanus' : 'belgrano'; 
    // Hack para la sucursal activa, o se la pasamos en la navegación
    const btnActivo = document.querySelector('#sidebar [data-sucursal].border-lime-400');
    const sucDefinitiva = btnActivo ? btnActivo.dataset.sucursal : 'lanus';

    try {
      const { data, error } = await db
        .from('sesiones_caja')
        .insert([{
          sucursal: sucDefinitiva,
          monto_inicial: monto,
          estado: 'abierta'
        }]);
      
      if(error) throw error;
      
      App.toast('Caja abierta correctamente.', 'success');
      this.loadCajaState(sucDefinitiva);
    } catch (err) {
      console.error(err);
      App.toast('Error al abrir la caja.', 'error');
    }
  },

  async registrarMovimiento() {
    const tipo = document.getElementById('movTipo').value;
    const cat = document.getElementById('movCat').value;
    const monto = document.getElementById('movMonto').value;
    const desc = document.getElementById('movDesc').value;

    if(!monto || monto <= 0) {
      App.toast('Monto inválido', 'error');
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

      App.toast('Movimiento registrado', 'success');
      this.loadCajaState(this.sesionActiva.sucursal);
    } catch (err) {
      console.error(err);
      App.toast('Error al registrar.', 'error');
    }
  },

  modalCerrarCaja(cajaEsperada) {
    const overlay = document.getElementById('modalOverlay');
    const body = document.getElementById('modalBody');
    
    document.querySelector('#modalReserva h2').innerText = 'Cerrar Turno (Arqueo de Caja)';
    document.querySelector('.step')?.parentElement?.remove(); // Ocultar los steps

    body.innerHTML = `
      <div class="bg-surface-container p-6 rounded-xl text-center">
        <p class="text-slate-400 mb-6">Contá el dinero físico de la caja registradora e ingresá el monto exacto. El sistema calculará si hay diferencias.</p>
        
        <div class="flex justify-between items-center mb-6 px-4">
          <span class="text-slate-300">Según el sistema:</span>
          <span class="text-xl font-bold text-[#c3f400]">$${cajaEsperada.toLocaleString()}</span>
        </div>

        <div class="text-left">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Efectivo Físico Contado ($)</label>
          <input type="number" id="inputArqueo" class="w-full bg-surface border border-surface-container-highest rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-[#c3f400] mb-4 text-2xl font-bold text-center" placeholder="0">
        </div>

        <div class="flex gap-3 mt-4">
          <button onclick="document.getElementById('modalOverlay').classList.remove('open')" class="flex-1 py-3 rounded-lg font-bold border border-surface-container-highest text-slate-400 hover:text-white transition-all">Cancelar</button>
          <button onclick="CajaView.ejecutarCierre(${cajaEsperada})" class="flex-1 py-3 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all flex items-center justify-center gap-2">
            Confirmar Arqueo
          </button>
        </div>
      </div>
    `;

    overlay.classList.add('open');
  },

  async ejecutarCierre(esperado) {
    const fisico = document.getElementById('inputArqueo').value;
    if(fisico === '') return;

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
      App.toast(`Turno cerrado. Diferencia: $${diferencia}`, diferencia < 0 ? 'error' : 'success');
      this.loadCajaState(this.sesionActiva.sucursal);

      // Notificamos a Nico Agent si hubo diferencia negativa
      if (diferencia < 0) {
        if(window.NicoAgent) {
          NicoAgent._pushAlert({
            tipo: 'anomalia',
            icono: '⚠️',
            titulo: 'Faltante de Caja',
            detalle: `Se cerró la caja en ${this.sesionActiva.sucursal} con un faltante de $${Math.abs(diferencia)}.`,
            prioridad: 'critical',
            timestamp: new Date()
          });
        }
      }

    } catch (err) {
      console.error(err);
      App.toast('Error al cerrar la caja.', 'error');
    }
  }
};
