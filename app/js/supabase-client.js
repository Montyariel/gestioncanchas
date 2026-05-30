// ===== SUPABASE CLIENT & OFFLINE RESILIENCE LAYER =====
const SUPABASE_URL = 'https://vcwqhxuyngqcnpptirtb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== RESILIENCIA OFFLINE & COLA DE ACCIONES (PWA) =====
const OfflineManager = {
  getQueue() {
    try {
      return JSON.parse(localStorage.getItem('canchaos_offline_queue')) || [];
    } catch (e) {
      return [];
    }
  },
  
  saveQueue(queue) {
    localStorage.setItem('canchaos_offline_queue', JSON.stringify(queue));
  },
  
  enqueue(method, args, mockResult = { success: true }) {
    const queue = this.getQueue();
    queue.push({
      id: Date.now(),
      method,
      args,
      timestamp: new Date().toISOString()
    });
    this.saveQueue(queue);
    
    // Alerta visual de Nico
    if (typeof App !== 'undefined' && App.toast) {
      App.toast('📶 Sin internet. Operando en Modo Resiliente. Se guardó localmente. ⚡', 'warning');
    }
    
    // Intentar actualizar localmente el caché de forma optimista
    this.applyOptimisticUpdate(method, args);
    
    return Promise.resolve(mockResult);
  },
  
  applyOptimisticUpdate(method, args) {
    try {
      // Ajustar optimísticamente el stock cacheado si cambiamos stock
      if (method === 'updateStock') {
        const [id, nuevaCantidad] = args;
        const sucursal = (typeof BuffetView !== 'undefined') ? BuffetView.sucursal : 'lanus';
        const cacheKey = `canchaos_cache_stock_${sucursal}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (cached) {
          const item = cached.find(s => s.id === id);
          if (item) item.cantidad = nuevaCantidad;
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }
      }
      
      // Ajustar optimísticamente si se marca un turno como reservado/cancelado
      if (method === 'reservarTurno') {
        const [turnoId, clienteNombre] = args;
        const sucursal = (typeof AgendaView !== 'undefined') ? AgendaView.sucursal : 'lanus';
        const fecha = (typeof AgendaView !== 'undefined') ? AgendaView.fechaSeleccionada : new Date().toISOString().split('T')[0];
        const cacheKey = `canchaos_cache_turnos_${sucursal}_${fecha}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (cached) {
          const slot = cached.find(t => t.id === turnoId);
          if (slot) {
            slot.reservado = true;
            slot.cliente_nombre = clienteNombre;
          }
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }
      }
      
      if (method === 'cancelarTurno') {
        const [turnoId] = args;
        const sucursal = (typeof AgendaView !== 'undefined') ? AgendaView.sucursal : 'lanus';
        const fecha = (typeof AgendaView !== 'undefined') ? AgendaView.fechaSeleccionada : new Date().toISOString().split('T')[0];
        const cacheKey = `canchaos_cache_turnos_${sucursal}_${fecha}`;
        const cached = JSON.parse(localStorage.getItem(cacheKey));
        if (cached) {
          const slot = cached.find(t => t.id === turnoId);
          if (slot) {
            slot.reservado = false;
            slot.cliente_nombre = null;
          }
          localStorage.setItem(cacheKey, JSON.stringify(cached));
        }
      }
    } catch (e) {
      console.error('[Offline] Error en actualización optimista:', e);
    }
  },
  
  async sync() {
    if (!navigator.onLine) return;
    const queue = this.getQueue();
    if (queue.length === 0) return;
    
    if (typeof App !== 'undefined' && App.toast) {
      App.toast(`📶 ¡Conexión recuperada! Sincronizando ${queue.length} operaciones offline... ⚽🚀`, 'info');
    }
    
    const failed = [];
    for (const action of queue) {
      try {
        if (action.method.startsWith('API.')) {
          const apiMethod = action.method.replace('API.', '');
          await API[apiMethod](...action.args);
        } else {
          await DB[action.method](...action.args);
        }
        console.log(`[OfflineSync] Éxito al sincronizar ${action.method}`);
      } catch (e) {
        console.error(`[OfflineSync] Fallo al sincronizar ${action.method}`, e);
        failed.push(action); // Mantener en cola si falla por red/otro error
      }
    }
    
    this.saveQueue(failed);
    
    if (failed.length === 0) {
      if (typeof App !== 'undefined' && App.toast) {
        App.toast('✅ ¡Sincronización completa! Datos de caja e inventario actualizados. 🏆', 'success');
      }
      // Recargar la vista actual para reflejar los datos frescos
      if (typeof App !== 'undefined' && App.state && App.state.currentView) {
        App.navigate(App.state.currentView);
      }
    } else {
      if (typeof App !== 'undefined' && App.toast) {
        App.toast(`⚠️ ${failed.length} operaciones no pudieron sincronizarse. Se reintentará luego.`, 'warning');
      }
    }
  }
};

// Escuchar cambios de red
window.addEventListener('online', () => OfflineManager.sync());
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => OfflineManager.sync(), 4000);
});

// ===== DATA LAYER WITH OFFLINE SUPPORT =====
const DB = {

  // Helper de red
  isOffline(error) {
    return !navigator.onLine || 
           (error && (error.message?.includes('fetch') || 
                      error.message?.includes('NetworkError') || 
                      error.message?.includes('Failed to fetch') ||
                      error.status === 0));
  },

  // --- CANCHAS ---
  async getCanchas(sucursal) {
    const cacheKey = `canchaos_cache_canchas_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('canchas').select('*').ilike('sucursal_id', `%${sucursal}%`);
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async updateCanchaTipo(canchaId, tipo) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('canchas')
        .update({ tipo: tipo })
        .eq('id', canchaId);
      if (error) throw error;
      const sucursal = App.state.sucursal;
      localStorage.removeItem(`canchaos_cache_canchas_${sucursal}`);
      return true;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('updateCanchaTipo', [canchaId, tipo]);
      }
      throw e;
    }
  },

  // --- TURNOS ---
  async getTurnos(sucursal, fecha) {
    const cacheKey = `canchaos_cache_turnos_${sucursal}_${fecha}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db
        .from('turnos').select('*, canchas(nombre, precio, sucursal_id)')
        .ilike('canchas.sucursal_id', `%${sucursal}%`)
        .eq('fecha', fecha)
        .order('hora');
      if (error) throw error;
      const res = (data || []).filter(t => t.canchas);
      localStorage.setItem(cacheKey, JSON.stringify(res));
      return res;
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async getDisponibilidadWeb(sucursal, fecha) {
    const cacheKey = `canchaos_cache_dispweb_${sucursal}_${fecha}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db
        .from('turnos').select('*, canchas(nombre, precio, sucursal_id, tipo)')
        .ilike('canchas.sucursal_id', `%${sucursal}%`)
        .eq('fecha', fecha)
        .eq('reservado', false)
        .order('hora');
      if (error) throw error;
      const res = (data || []).filter(t => t.canchas);
      localStorage.setItem(cacheKey, JSON.stringify(res));
      return res;
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async getTurnosByCancha(canchaId, fecha) {
    const cacheKey = `canchaos_cache_turnoscancha_${canchaId}_${fecha}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('turnos').select('*')
        .eq('cancha_id', canchaId).eq('fecha', fecha).order('hora');
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async reservarTurno(turnoId, clienteNombre) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('turnos')
        .update({ reservado: true, cliente_nombre: clienteNombre })
        .eq('id', turnoId);
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('reservarTurno', [turnoId, clienteNombre]);
      }
      throw e;
    }
  },

  async reservarDesdeWeb({ turnoId, clienteNombre, clienteTelefono, sucursalId, montoSena = 0 }) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      // 1. Marcar el turno como reservado
      await this.reservarTurno(turnoId, clienteNombre);
      
      // 2. Insertar en reservas_web para tracking
      const { error } = await db.from('reservas_web').insert([{
        turno_id: turnoId,
        cliente_nombre: clienteNombre,
        cliente_telefono: clienteTelefono ? fmt.phone(clienteTelefono) : null,
        sucursal_id: sucursalId,
        monto_seña: montoSena,
        estado_pago: montoSena > 0 ? 'señado' : 'pendiente'
      }]);
      
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('reservarDesdeWeb', [{ turnoId, clienteNombre, clienteTelefono, sucursalId, montoSena }]);
      }
      throw e;
    }
  },

  async anotarEnListaEspera({ clienteNombre, clienteTelefono, sucursalId, deporte, fecha, hora }) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('lista_espera').insert([{
        cliente_nombre: clienteNombre,
        cliente_telefono: fmt.phone(clienteTelefono),
        sucursal_id: sucursalId,
        deporte: deporte,
        fecha: fecha,
        hora: hora
      }]);
      if (error) throw error;
      return true;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('anotarEnListaEspera', [{ clienteNombre, clienteTelefono, sucursalId, deporte, fecha, hora }]);
      }
      throw e;
    }
  },

  async cancelarTurno(turnoId) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('turnos')
        .update({ reservado: false, cliente_nombre: null })
        .eq('id', turnoId);
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('cancelarTurno', [turnoId]);
      }
      throw e;
    }
  },

  // --- RESERVAS ---
  async getReservas(sucursal) {
    const cacheKey = `canchaos_cache_reservas_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db
        .from('reservas').select('*, canchas(nombre, sucursal_id)')
        .ilike('canchas.sucursal_id', `%${sucursal}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const res = (data || []).filter(r => r.canchas);
      localStorage.setItem(cacheKey, JSON.stringify(res));
      return res;
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async getReservasDetalladas(sucursal) {
    const cacheKey = `canchaos_cache_reservasdet_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data: turnos, error: t1 } = await db
        .from('turnos')
        .select('id, hora, fecha, cliente_nombre, reservado, cancha_id, canchas(nombre, precio, sucursal_id)')
        .eq('reservado', true)
        .not('cliente_nombre', 'is', null);
      if (t1) throw t1;

      const filtrados = (turnos || []).filter(t =>
        t.canchas && (t.canchas.sucursal_id || '').toLowerCase().includes(sucursal.toLowerCase())
      );

      let reservasDB = [];
      try {
        const { data: r } = await db.from('reservas').select('*').order('created_at', { ascending: false }).limit(200);
        reservasDB = r || [];
      } catch(_) {}

      const res = filtrados.map(t => {
        const reserva = reservasDB.find(r => r.turno_id === t.id || r.cliente_nombre === t.cliente_nombre);
        return {
          id: reserva?.id || t.id,
          turno_id: t.id,
          cliente_nombre: t.cliente_nombre,
          cumpleanios: reserva?.cumpleanios || null,
          turno_fecha: t.fecha,
          turno_hora: t.hora,
          turno_cancha: t.canchas?.nombre,
          precio: t.canchas?.precio,
          canchas: t.canchas,
          estado_pago: reserva?.estado_pago || 'pendiente',
          created_at: reserva?.created_at || t.fecha
        };
      }).sort((a, b) => (b.turno_fecha > a.turno_fecha ? 1 : -1));
      
      localStorage.setItem(cacheKey, JSON.stringify(res));
      return res;
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async crearReserva(canchaId, clienteNombre, notas = '') {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('reservas')
        .insert([{ cancha_id: canchaId, cliente_nombre: clienteNombre, notas }])
        .select().single();
      if (error) throw error;
      return data;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('crearReserva', [canchaId, clienteNombre, notas]);
      }
      throw e;
    }
  },

  async updateReservaEstado(id, estado) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data: existing } = await db.from('reservas').select('id').eq('id', id).maybeSingle();
      if (existing) {
        const { error } = await db.from('reservas').update({ estado_pago: estado }).eq('id', id);
        if (error) throw error;
      } else {
        if (estado === 'cancelado') {
          await this.cancelarTurno(id);
        }
      }
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('updateReservaEstado', [id, estado]);
      }
      throw e;
    }
  },

  async registrarAbono({ cliente, cancha, hora, fechas, precio_unitario, cumpleanios, sucursal }) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const total = precio_unitario * fechas;
      const { error } = await db.from('reservas').insert([{
        cliente_nombre: cliente,
        notas: `ABONO MENSUAL: ${cancha} ${hora} — ${fechas} fechas x ${precio_unitario}`,
        cumpleanios: cumpleanios || null,
        estado_pago: 'pendiente',
        tipo: 'abono',
        monto_total: total,
        sucursal
      }]);
      if (error) {
        const { error: e2 } = await db.from('reservas').insert([{
          cliente_nombre: cliente,
          notas: `ABONO MENSUAL: ${cancha} ${hora} — ${fechas} fechas x $${precio_unitario} = $${total}`
        }]);
        if (e2) throw e2;
      }
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('registrarAbono', [{ cliente, cancha, hora, fechas, precio_unitario, cumpleanios, sucursal }]);
      }
      throw e;
    }
  },

  _stockCache: null,

  // --- STOCK ---
  async getStock(sucursal) {
    const cacheKey = `canchaos_cache_stock_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('stock').select('*').ilike('sucursal', `%${sucursal}%`);
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async updateStock(id, nuevaCantidad) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('stock').update({ cantidad: nuevaCantidad }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('updateStock', [id, nuevaCantidad]);
      }
      throw e;
    }
  },

  async addStockItem(item) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { error } = await db.from('stock').insert([item]);
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('addStockItem', [item]);
      }
      throw e;
    }
  },

  // --- MOVIMIENTOS ---
  async getMovimientos(sucursal) {
    const cacheKey = `canchaos_cache_movimientos_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('movimientos').select('*')
        .ilike('sucursal', `%${sucursal}%`)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async addMovimiento(sucursal, tipo, categoria, concepto, monto, ref) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const payload = { sucursal, tipo, categoria, concepto, monto };
      if (ref) { payload.referencia_tipo = ref.tipo; payload.referencia_id = ref.id; }
      const { error } = await db.from('movimientos').insert([payload]);
      if (error) throw error;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('addMovimiento', [sucursal, tipo, categoria, concepto, monto, ref]);
      }
      throw e;
    }
  },

  async getGastos(sucursal) {
    const cacheKey = `canchaos_cache_gastos_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('gastos').select('*')
        .ilike('sucursal', `%${sucursal}%`)
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async addGasto(sucursal, concepto, monto) {
    const tipo = monto < 0 ? 'ingreso' : 'egreso';
    return this.addMovimiento(sucursal, tipo, 'General', concepto, Math.abs(monto));
  },

  // --- CLIENTES / GOLEADORES ---
  async getGoleadores(sucursal) {
    const cacheKey = `canchaos_cache_goleadores_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('reservas')
        .select('cliente_nombre, canchas(sucursal_id)')
        .ilike('canchas.sucursal_id', `%${sucursal}%`);
      if (error) throw error;
      const counts = {};
      (data || []).filter(r => r.canchas).forEach(r => {
        const n = r.cliente_nombre || 'Anónimo';
        counts[n] = (counts[n] || 0) + 1;
      });
      const res = Object.entries(counts)
        .map(([nombre, partidos]) => ({ nombre, partidos }))
        .sort((a, b) => b.partidos - a.partidos)
        .slice(0, 20);
      localStorage.setItem(cacheKey, JSON.stringify(res));
      return res;
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async getJugadores(sucursal) {
    const cacheKey = `canchaos_cache_jugadores`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db.from('jugadores').select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  // --- MÉTRICAS DASHBOARD ---
  async getMetrics(sucursal, fecha) {
    try {
      const [canchas, turnos, stock, gastos] = await Promise.all([
        this.getCanchas(sucursal),
        this.getTurnos(sucursal, fecha),
        this.getStock(sucursal),
        this.getGastos(sucursal)
      ]);

      const libres = turnos.filter(t => !t.reservado).length;
      const ocupados = turnos.filter(t => t.reservado).length;
      const total = turnos.length || 1;
      const ocupacion = Math.round((ocupados / total) * 100);

      const ingresos = gastos
        .filter(g => g.monto < 0)
        .reduce((s, g) => s + Math.abs(g.monto), 0);
      const egresos = gastos
        .filter(g => g.monto > 0)
        .reduce((s, g) => s + g.monto, 0);

      const stockAlertas = stock.filter(s => s.cantidad < 5).length;

      return { canchas: canchas.length, libres, ocupados, ocupacion, ingresos, egresos, stockAlertas, stock };
    } catch (e) {
      // Si falla en offline, devolvemos datos vacíos/seguros cacheables
      return { canchas: 0, libres: 0, ocupados: 0, ocupacion: 0, ingresos: 0, egresos: 0, stockAlertas: 0, stock: [] };
    }
  },

  async registrarJugador(datos) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      if (datos.telefono) {
        datos.telefono = fmt.phone(datos.telefono);
      }
      const { error } = await db.from('jugadores').upsert([datos], { onConflict: 'telefono' });
      if (error) throw error;
      return true;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('registrarJugador', [datos]);
      }
      throw e;
    }
  },

  async getTurnoDetallado(turnoId) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db
        .from('turnos')
        .select('*, canchas(nombre, precio, sucursal_id, tipo)')
        .eq('id', turnoId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // El turno no existe, retornamos null
        }
        throw error;
      }
      return data;
    } catch (e) {
      throw e;
    }
  },

  async getAsistentesPartido(turnoId) {
    const cacheKey = `canchaos_cache_asistentes_${turnoId}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const { data, error } = await db
        .from('partido_asistentes')
        .select('*')
        .eq('turno_id', turnoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (this.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async confirmarAsistenciaPartido({ turnoId, nombre, apellido, telefono, equipo }) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const telFormateado = fmt.phone(telefono);
      const nombreCompleto = `${nombre} ${apellido || ''}`.trim();
      
      // 1. Insertar en partido_asistentes
      const { error } = await db.from('partido_asistentes').insert([{
        turno_id: turnoId,
        nombre: nombreCompleto,
        telefono: telFormateado,
        equipo
      }]);
      if (error) throw error;

      // 2. Registrar/actualizar jugador en CRM general
      await this.registrarJugador({
        nombre,
        apellido: apellido || null,
        telefono: telFormateado
      });

      return true;
    } catch (e) {
      if (this.isOffline(e)) {
        return OfflineManager.enqueue('confirmarAsistenciaPartido', [{ turnoId, nombre, apellido, telefono, equipo }]);
      }
      throw e;
    }
  }
};

// ===== API CLIENT (llamadas seguras al backend) =====
const API = {
  async _headers() {
    const { data: { session } } = await db.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
    };
  },

  async reservar(turnoId, clienteNombre, cumpleanios, comboItems) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch('/api/reservar', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify({ turno_id: turnoId, cliente_nombre: clienteNombre, cumpleanios, combo_items: comboItems || [] })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al reservar');
      return data;
    } catch (e) {
      if (DB.isOffline(e)) {
        return OfflineManager.enqueue('API.reservar', [turnoId, clienteNombre, cumpleanios, comboItems]);
      }
      throw e;
    }
  },

  async ventaBuffet(sucursalId, item, cantidad) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch('/api/venta-buffet', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify({ sucursal_id: sucursalId, item, cantidad })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error en venta');
      return data;
    } catch (e) {
      if (DB.isOffline(e)) {
        // Encolar optimísticamente en offline
        return OfflineManager.enqueue('API.ventaBuffet', [sucursalId, item, cantidad]);
      }
      throw e;
    }
  },

  async registrarGasto(sucursal, concepto, monto) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch('/api/gasto', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify({ sucursal, concepto, monto })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al registrar gasto');
      return data;
    } catch (e) {
      if (DB.isOffline(e)) {
        return OfflineManager.enqueue('API.registrarGasto', [sucursal, concepto, monto]);
      }
      throw e;
    }
  },

  async addProduct(productData) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch('/api/stock/add-product', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify(productData)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al agregar producto');
      return data;
    } catch (e) {
      if (DB.isOffline(e)) {
        return OfflineManager.enqueue('API.addProduct', [productData]);
      }
      throw e;
    }
  },

  async updateStockAudit(stockId, cantidadCambio, tipoMovimiento, motivo) {
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch('/api/stock/update-stock', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify({ stock_id: stockId, cantidad_cambio: cantidadCambio, tipo_movimiento: tipoMovimiento, motivo })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al actualizar stock');
      return data;
    } catch (e) {
      if (DB.isOffline(e)) {
        return OfflineManager.enqueue('API.updateStockAudit', [stockId, cantidadCambio, tipoMovimiento, motivo]);
      }
      throw e;
    }
  },

  async getAuditLogs(sucursal) {
    const cacheKey = `canchaos_cache_auditlogs_${sucursal}`;
    try {
      if (!navigator.onLine) throw new Error('Offline');
      const r = await fetch(`/api/stock/audit-logs?sucursal=${sucursal}`, {
        method: 'GET',
        headers: await this._headers()
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al obtener logs de auditoría');
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
      return data || [];
    } catch (e) {
      if (DB.isOffline(e)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
      }
      throw e;
    }
  },

  async getRecetas(sucursal) {
    try {
      const r = await fetch(`/api/recetas?sucursal=${sucursal}`, {
        method: 'GET',
        headers: await this._headers()
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al obtener recetas');
      return data || [];
    } catch (e) {
      throw e;
    }
  },

  async saveReceta(sucursal, item_nombre, insumos) {
    try {
      const r = await fetch('/api/recetas', {
        method: 'POST',
        headers: await this._headers(),
        body: JSON.stringify({ sucursal, item_nombre, insumos })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al guardar receta');
      return data;
    } catch (e) {
      throw e;
    }
  },

  async deleteReceta(sucursal, item_nombre) {
    try {
      const r = await fetch('/api/recetas', {
        method: 'DELETE',
        headers: await this._headers(),
        body: JSON.stringify({ sucursal, item_nombre })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error al eliminar receta');
      return data;
    } catch (e) {
      throw e;
    }
  }
};

// Utils globales
const fmt = {
  money: (n) => '$' + (n || 0).toLocaleString('es-AR'),
  date: (d) => new Date(d).toLocaleDateString('es-AR'),
  dateISO: (d) => (d || new Date()).toISOString().split('T')[0],
  phone: (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    
    // Strip leading 0
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Strip leading 54
    if (cleaned.startsWith('54')) {
      cleaned = cleaned.substring(2);
    }
    
    // Strip leading 9
    if (cleaned.startsWith('9')) {
      cleaned = cleaned.substring(1);
    }
    
    // Handle '15' prefix
    if (cleaned.startsWith('15')) {
      cleaned = cleaned.substring(2);
      if (cleaned.length === 8) {
        cleaned = '11' + cleaned;
      }
    } else {
      for (let idx of [2, 3, 4]) {
        if (cleaned.substring(idx, idx + 2) === '15') {
          cleaned = cleaned.substring(0, idx) + cleaned.substring(idx + 2);
          break;
        }
      }
    }
    
    if (cleaned.length === 8) {
      cleaned = '11' + cleaned;
    }
    
    if (cleaned.length === 10) {
      return '549' + cleaned;
    }
    
    if (cleaned.length === 13 && cleaned.startsWith('549')) {
      return cleaned;
    }
    
    return '549' + cleaned;
  }
};

// Exponer en window
window.db = db;
window.DB = DB;
window.fmt = fmt;
window.API = API;
window.OfflineManager = OfflineManager;
