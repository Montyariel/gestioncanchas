// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://vcwqhxuyngqcnpptirtb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DATA LAYER =====
const DB = {

  // --- CANCHAS ---
  async getCanchas(sucursal) {
    const { data, error } = await db.from('canchas').select('*').ilike('sucursal_id', `%${sucursal}%`);
    if (error) throw error;
    return data || [];
  },

  // --- TURNOS ---
  async getTurnos(sucursal, fecha) {
    const { data, error } = await db
      .from('turnos').select('*, canchas(nombre, precio, sucursal_id)')
      .ilike('canchas.sucursal_id', `%${sucursal}%`)
      .eq('fecha', fecha)
      .order('hora');
    if (error) throw error;
    return (data || []).filter(t => t.canchas);
  },

  async getDisponibilidadWeb(sucursal, fecha) {
    const { data, error } = await db
      .from('turnos').select('*, canchas(nombre, precio, sucursal_id, tipo)')
      .ilike('canchas.sucursal_id', `%${sucursal}%`)
      .eq('fecha', fecha)
      .eq('reservado', false)
      .order('hora');
    if (error) throw error;
    return (data || []).filter(t => t.canchas);
  },

  async getTurnosByCancha(canchaId, fecha) {
    const { data, error } = await db.from('turnos').select('*')
      .eq('cancha_id', canchaId).eq('fecha', fecha).order('hora');
    if (error) throw error;
    return data || [];
  },

  async reservarTurno(turnoId, clienteNombre) {
    const { error } = await db.from('turnos')
      .update({ reservado: true, cliente_nombre: clienteNombre })
      .eq('id', turnoId);
    if (error) throw error;
  },

  async reservarDesdeWeb({ turnoId, clienteNombre, sucursalId, montoSena = 0 }) {
    // 1. Marcar el turno como reservado
    await this.reservarTurno(turnoId, clienteNombre);
    
    // 2. Insertar en reservas_web para tracking
    const { error } = await db.from('reservas_web').insert([{
      turno_id: turnoId,
      cliente_nombre: clienteNombre,
      sucursal_id: sucursalId,
      monto_seña: montoSena,
      estado_pago: montoSena > 0 ? 'señado' : 'pendiente'
    }]);
    
    if (error) {
      console.warn("No se pudo registrar en reservas_web, pero el turno quedó reservado:", error);
    }
  },

  async cancelarTurno(turnoId) {
    const { error } = await db.from('turnos')
      .update({ reservado: false, cliente_nombre: null })
      .eq('id', turnoId);
    if (error) throw error;
  },

  // --- RESERVAS ---
  async getReservas(sucursal) {
    const { data, error } = await db
      .from('reservas').select('*, canchas(nombre, sucursal_id)')
      .ilike('canchas.sucursal_id', `%${sucursal}%`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).filter(r => r.canchas);
  },

  // Reservas enriquecidas con datos del turno
  async getReservasDetalladas(sucursal) {
    // Primero intentamos desde la tabla turnos (tiene hora, cancha, fecha)
    const { data: turnos, error: t1 } = await db
      .from('turnos')
      .select('id, hora, fecha, cliente_nombre, reservado, cancha_id, canchas(nombre, precio, sucursal_id)')
      .eq('reservado', true)
      .not('cliente_nombre', 'is', null);
    if (t1) throw t1;

    // Filtrar por sucursal
    const filtrados = (turnos || []).filter(t =>
      t.canchas && (t.canchas.sucursal_id || '').toLowerCase().includes(sucursal.toLowerCase())
    );

    // Enriquecer con datos de la tabla reservas si existe
    let reservasDB = [];
    try {
      const { data: r } = await db.from('reservas').select('*').order('created_at', { ascending: false }).limit(200);
      reservasDB = r || [];
    } catch(_) {}

    return filtrados.map(t => {
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
  },

  async crearReserva(canchaId, clienteNombre, notas = '') {
    const { data, error } = await db.from('reservas')
      .insert([{ cancha_id: canchaId, cliente_nombre: clienteNombre, notas }])
      .select().single();
    if (error) throw error;
    return data;
  },

  async updateReservaEstado(id, estado) {
    // Intentamos actualizar en tabla reservas; si no existe, la creamos
    const { data: existing } = await db.from('reservas').select('id').eq('id', id).maybeSingle();
    if (existing) {
      const { error } = await db.from('reservas').update({ estado_pago: estado }).eq('id', id);
      if (error) throw error;
    } else {
      // Fallback: actualizar en turnos si el id es de turno
      if (estado === 'cancelado') {
        await this.cancelarTurno(id);
      }
    }
  },

  async registrarAbono({ cliente, cancha, hora, fechas, precio_unitario, cumpleanios, sucursal }) {
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
      // Si la tabla no tiene esos campos, guardamos con campos básicos
      const { error: e2 } = await db.from('reservas').insert([{
        cliente_nombre: cliente,
        notas: `ABONO MENSUAL: ${cancha} ${hora} — ${fechas} fechas x $${precio_unitario} = $${total}`
      }]);
      if (e2) throw e2;
    }
  },

  // Cache de stock para el modal de combo
  _stockCache: [],

  // --- STOCK ---
  async getStock(sucursal) {
    const { data, error } = await db.from('stock').select('*').ilike('sucursal', `%${sucursal}%`);
    if (error) throw error;
    return data || [];
  },

  async updateStock(id, nuevaCantidad) {
    const { error } = await db.from('stock').update({ cantidad: nuevaCantidad }).eq('id', id);
    if (error) throw error;
  },

  async addStockItem(item) {
    const { error } = await db.from('stock').insert([item]);
    if (error) throw error;
  },

  // --- MOVIMIENTOS (reemplaza a gastos) ---
  async getMovimientos(sucursal) {
    const { data, error } = await db.from('movimientos').select('*')
      .ilike('sucursal', `%${sucursal}%`)
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  },

  async addMovimiento(sucursal, tipo, categoria, concepto, monto, ref) {
    const payload = { sucursal, tipo, categoria, concepto, monto };
    if (ref) { payload.referencia_tipo = ref.tipo; payload.referencia_id = ref.id; }
    const { error } = await db.from('movimientos').insert([payload]);
    if (error) throw error;
  },

  // Mantener compatibilidad con código legacy
  async getGastos(sucursal) {
    return this.getMovimientos(sucursal);
  },

  async addGasto(sucursal, concepto, monto) {
    const tipo = monto < 0 ? 'ingreso' : 'egreso';
    return this.addMovimiento(sucursal, tipo, 'General', concepto, Math.abs(monto));
  },

  // --- CLIENTES / GOLEADORES ---
  async getGoleadores(sucursal) {
    const { data, error } = await db.from('reservas')
      .select('cliente_nombre, canchas(sucursal_id)')
      .ilike('canchas.sucursal_id', `%${sucursal}%`);
    if (error) throw error;
    const counts = {};
    (data || []).filter(r => r.canchas).forEach(r => {
      const n = r.cliente_nombre || 'Anónimo';
      counts[n] = (counts[n] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([nombre, partidos]) => ({ nombre, partidos }))
      .sort((a, b) => b.partidos - a.partidos)
      .slice(0, 20);
  },

  async getJugadores(sucursal) {
    const { data, error } = await db.from('jugadores').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // --- MÉTRICAS DASHBOARD ---
  async getMetrics(sucursal, fecha) {
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
  },

  // --- CRM JUGADORES ---
  async registrarJugador(datos) {
    const { error } = await db.from('jugadores').upsert([datos], { onConflict: 'telefono' });
    if (error) throw error;
    return true;
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
    const r = await fetch('/api/reservar', {
      method: 'POST',
      headers: await this._headers(),
      body: JSON.stringify({ turno_id: turnoId, cliente_nombre: clienteNombre, cumpleanios, combo_items: comboItems || [] })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error al reservar');
    return data;
  },

  async ventaBuffet(sucursalId, item, cantidad) {
    const r = await fetch('/api/venta-buffet', {
      method: 'POST',
      headers: await this._headers(),
      body: JSON.stringify({ sucursal_id: sucursalId, item, cantidad })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error en venta');
    return data;
  },

  async registrarGasto(sucursal, concepto, monto) {
    const r = await fetch('/api/gasto', {
      method: 'POST',
      headers: await this._headers(),
      body: JSON.stringify({ sucursal, concepto, monto })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error al registrar gasto');
    return data;
  }
};

// Utils globales
const fmt = {
  money: (n) => '$' + (n || 0).toLocaleString('es-AR'),
  date: (d) => new Date(d).toLocaleDateString('es-AR'),
  dateISO: (d) => (d || new Date()).toISOString().split('T')[0]
};
