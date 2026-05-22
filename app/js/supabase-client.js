// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://vcwqhxuyngqcnpptirtb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

  async reservarDesdeWeb({ turnoId, clienteNombre, clienteTelefono, sucursalId, montoSena = 0 }) {
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
    
    if (error) {
      console.warn("No se pudo registrar en reservas_web, pero el turno quedó reservado:", error);
    }
  },

  async anotarEnListaEspera({ clienteNombre, clienteTelefono, sucursalId, deporte, fecha, hora }) {
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
  _stockCache: null,

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
    const { data, error } = await db.from('gastos').select('*')
      .ilike('sucursal', `%${sucursal}%`)
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
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
    if (datos.telefono) {
      datos.telefono = fmt.phone(datos.telefono);
    }
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
    
    // Strip leading 9 (if it's before the area code, e.g. after stripping 54)
    if (cleaned.startsWith('9')) {
      cleaned = cleaned.substring(1);
    }
    
    // Handle the '15' prefix or infix
    if (cleaned.startsWith('15')) {
      cleaned = cleaned.substring(2);
      if (cleaned.length === 8) {
        cleaned = '11' + cleaned; // Assume BA area code if only 8 digits left
      }
    } else {
      // If it contains 15 in the middle (e.g. 111537908579 -> 1137908579)
      for (let idx of [2, 3, 4]) {
        if (cleaned.substring(idx, idx + 2) === '15') {
          cleaned = cleaned.substring(0, idx) + cleaned.substring(idx + 2);
          break;
        }
      }
    }
    
    // If we only have 8 digits, assume Buenos Aires (area code 11)
    if (cleaned.length === 8) {
      cleaned = '11' + cleaned;
    }
    
    // Now prepend 549 to the clean 10-digit number
    if (cleaned.length === 10) {
      return '549' + cleaned;
    }
    
    // Fallback: if it's already 13 digits and starts with 549, return it
    if (cleaned.length === 13 && cleaned.startsWith('549')) {
      return cleaned;
    }
    
    // Absolute fallback
    return '549' + cleaned;
  }
};

// Exponer en window para compatibilidad con inline onclick
window.db = db;
window.DB = DB;
window.fmt = fmt;
window.API = API;
