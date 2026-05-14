// ============================================================
// NICO ANALYTICS ENGINE — Motor de Reportes Estratégicos
// Transforma datos crudos en inteligencia de negocio
// ============================================================

const NicoAnalytics = {

  // ============================================================
  // ÁREA 1: OCUPACIÓN Y RENDIMIENTO
  // ============================================================

  /**
   * Ranking de canchas por ingresos generados y horas muertas
   */
  async rankingCanchas(sucursal, dias = 30) {
    const desde = this._fechaHace(dias);
    const hasta = fmt.dateISO();

    const { data: turnos, error } = await db
      .from('turnos')
      .select('*, canchas(id, nombre, precio, sucursal_id)')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;

    const filtrados = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );

    const mapa = {};
    filtrados.forEach(t => {
      const id = t.cancha_id;
      if (!mapa[id]) {
        mapa[id] = {
          id,
          nombre: t.canchas?.nombre || 'Cancha',
          precio: t.canchas?.precio || 0,
          total: 0,
          ocupados: 0,
          libres: 0,
          ingresos: 0
        };
      }
      mapa[id].total++;
      if (t.reservado) {
        mapa[id].ocupados++;
        mapa[id].ingresos += (t.canchas?.precio || 0);
      } else {
        mapa[id].libres++;
      }
    });

    return Object.values(mapa)
      .map(c => ({
        ...c,
        ocupacion: c.total > 0 ? Math.round((c.ocupados / c.total) * 100) : 0,
        horasMuertas: c.libres
      }))
      .sort((a, b) => b.ingresos - a.ingresos);
  },

  /**
   * Análisis de hora pico — cuándo la demanda supera la oferta
   */
  async horaPico(sucursal, dias = 14) {
    const desde = this._fechaHace(dias);
    const { data: turnos, error } = await db
      .from('turnos')
      .select('hora, reservado, canchas(sucursal_id)')
      .gte('fecha', desde);

    if (error) throw error;

    const filtrados = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );

    const horas = {};
    filtrados.forEach(t => {
      const h = (t.hora || '').substring(0, 5);
      if (!horas[h]) horas[h] = { total: 0, ocupados: 0 };
      horas[h].total++;
      if (t.reservado) horas[h].ocupados++;
    });

    return Object.entries(horas)
      .map(([hora, d]) => ({
        hora,
        total: d.total,
        ocupados: d.ocupados,
        libres: d.total - d.ocupados,
        pct: d.total > 0 ? Math.round((d.ocupados / d.total) * 100) : 0
      }))
      .sort((a, b) => b.pct - a.pct);
  },

  /**
   * Tasa de cancelación — reservados con pago pendiente o cancelados
   */
  async tasaCancelacion(sucursal, dias = 30) {
    const desde = this._fechaHace(dias);

    // Turnos reservados en el período
    const { data: turnos } = await db
      .from('turnos')
      .select('id, reservado, fecha, canchas(sucursal_id)')
      .gte('fecha', desde)
      .eq('reservado', true);

    const filtrados = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );

    // Reservas con pago pendiente
    const { data: reservas } = await db
      .from('reservas')
      .select('estado_pago, created_at')
      .gte('created_at', `${desde}T00:00:00`);

    const pendientes = (reservas || []).filter(r =>
      r.estado_pago === 'pendiente' || !r.estado_pago
    );
    const pagadas = (reservas || []).filter(r => r.estado_pago === 'pagado');
    const total = reservas?.length || 1;

    return {
      totalReservas: filtrados.length,
      pagosPendientes: pendientes.length,
      pagosConcretados: pagadas.length,
      tasaPendiente: Math.round((pendientes.length / total) * 100),
      tasaConversion: Math.round((pagadas.length / total) * 100),
      periodo: dias
    };
  },

  // ============================================================
  // ÁREA 2: FINANCIERO Y CAJA
  // ============================================================

  /**
   * Balance neto por período (diario, semanal, mensual)
   */
  async balanceNeto(sucursal, dias = 7) {
    const desde = this._fechaHace(dias);
    const hasta = fmt.dateISO();

    const { data: gastos } = await db
      .from('gastos')
      .select('*')
      .ilike('sucursal', `%${sucursal}%`)
      .gte('created_at', `${desde}T00:00:00`)
      .order('created_at');

    // Agrupar por día
    const porDia = {};
    (gastos || []).forEach(g => {
      const dia = g.created_at?.split('T')[0] || g.fecha || 'sin fecha';
      if (!porDia[dia]) porDia[dia] = { ingresos: 0, egresos: 0 };
      if (g.monto < 0) {
        porDia[dia].ingresos += Math.abs(g.monto);
      } else {
        porDia[dia].egresos += g.monto;
      }
    });

    const dias_arr = Object.entries(porDia).map(([fecha, d]) => ({
      fecha,
      ingresos: d.ingresos,
      egresos: d.egresos,
      neto: d.ingresos - d.egresos
    })).sort((a, b) => a.fecha > b.fecha ? 1 : -1);

    const totalIngresos = dias_arr.reduce((s, d) => s + d.ingresos, 0);
    const totalEgresos  = dias_arr.reduce((s, d) => s + d.egresos, 0);

    return {
      sucursal,
      periodo: dias,
      desde,
      hasta,
      dias: dias_arr,
      totalIngresos,
      totalEgresos,
      netoTotal: totalIngresos - totalEgresos,
      promedioDiario: dias_arr.length ? Math.round((totalIngresos - totalEgresos) / dias_arr.length) : 0
    };
  },

  /**
   * Comparativa entre Lanús y Belgrano
   */
  async rendimientoPorSucursal(dias = 30) {
    const [lanus, belgrano] = await Promise.all([
      this.balanceNeto('lanus', dias),
      this.balanceNeto('belgrano', dias)
    ]);

    const totalSistema = lanus.netoTotal + belgrano.netoTotal;
    return {
      lanus: { ...lanus, share: totalSistema > 0 ? Math.round((lanus.netoTotal / totalSistema) * 100) : 0 },
      belgrano: { ...belgrano, share: totalSistema > 0 ? Math.round((belgrano.netoTotal / totalSistema) * 100) : 0 },
      totalSistema,
      ganadorSemana: lanus.netoTotal >= belgrano.netoTotal ? 'Lanús' : 'Belgrano',
      periodo: dias
    };
  },

  /**
   * Análisis de métodos de pago (MercadoPago vs efectivo)
   */
  async metodosPago(dias = 30) {
    const desde = this._fechaHace(dias);
    const { data: reservas } = await db
      .from('reservas')
      .select('estado_pago, notas, created_at')
      .gte('created_at', `${desde}T00:00:00`);

    let mp = 0, efectivo = 0, pendiente = 0;
    (reservas || []).forEach(r => {
      const notas = (r.notas || '').toLowerCase();
      if (r.estado_pago === 'pagado') {
        if (notas.includes('mercadopago') || notas.includes('mp') || notas.includes('link')) mp++;
        else efectivo++;
      } else {
        pendiente++;
      }
    });

    const total = mp + efectivo + pendiente || 1;
    return {
      mercadoPago: { cantidad: mp, pct: Math.round((mp / total) * 100) },
      efectivo:    { cantidad: efectivo, pct: Math.round((efectivo / total) * 100) },
      pendiente:   { cantidad: pendiente, pct: Math.round((pendiente / total) * 100) },
      total: mp + efectivo + pendiente,
      periodo: dias
    };
  },

  // ============================================================
  // ÁREA 3: FIDELIZACIÓN Y COMPORTAMIENTO
  // ============================================================

  /**
   * Top 10 clientes VIP del último mes
   */
  async clientesVip(sucursal, dias = 30) {
    const desde = this._fechaHace(dias);

    const { data: turnos } = await db
      .from('turnos')
      .select('cliente_nombre, fecha, canchas(precio, sucursal_id)')
      .eq('reservado', true)
      .gte('fecha', desde)
      .not('cliente_nombre', 'is', null);

    const filtrados = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );

    const mapa = {};
    filtrados.forEach(t => {
      const nombre = t.cliente_nombre;
      if (!mapa[nombre]) mapa[nombre] = { nombre, reservas: 0, gasto: 0 };
      mapa[nombre].reservas++;
      mapa[nombre].gasto += (t.canchas?.precio || 0);
    });

    return Object.values(mapa)
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 10)
      .map((c, i) => ({ ...c, rank: i + 1 }));
  },

  /**
   * Alerta de abandono — clientes que no aparecen hace 15+ días
   */
  async alertaAbandono(sucursal, diasInactivos = 15, diasHistorial = 60) {
    const desde = this._fechaHace(diasHistorial);
    const corte  = this._fechaHace(diasInactivos);

    const { data: turnos } = await db
      .from('turnos')
      .select('cliente_nombre, fecha, canchas(sucursal_id)')
      .eq('reservado', true)
      .gte('fecha', desde)
      .not('cliente_nombre', 'is', null);

    const filtrados = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );

    // Agrupar última fecha por cliente
    const clientes = {};
    filtrados.forEach(t => {
      const n = t.cliente_nombre;
      if (!clientes[n]) clientes[n] = { nombre: n, ultimaReserva: t.fecha, totalReservas: 0 };
      if (t.fecha > clientes[n].ultimaReserva) clientes[n].ultimaReserva = t.fecha;
      clientes[n].totalReservas++;
    });

    // Clientes que jugaban seguido pero no aparecen desde el corte
    return Object.values(clientes)
      .filter(c => c.ultimaReserva < corte && c.totalReservas >= 2)
      .sort((a, b) => a.ultimaReserva > b.ultimaReserva ? -1 : 1)
      .slice(0, 10);
  },

  /**
   * Ticket promedio por cliente (cancha + buffet)
   */
  async ticketPromedio(sucursal, dias = 30) {
    const desde = this._fechaHace(dias);

    // Ingresos de turnos
    const { data: turnos } = await db
      .from('turnos')
      .select('canchas(precio, sucursal_id)')
      .eq('reservado', true)
      .gte('fecha', desde);

    const turnosFilt = (turnos || []).filter(t =>
      t.canchas?.sucursal_id?.toLowerCase().includes(sucursal.toLowerCase())
    );
    const ingTurnos = turnosFilt.reduce((s, t) => s + (t.canchas?.precio || 0), 0);

    // Ingresos del buffet (gastos negativos = ventas)
    const { data: gastos } = await db
      .from('gastos')
      .select('monto, concepto')
      .ilike('sucursal', `%${sucursal}%`)
      .lt('monto', 0)
      .gte('created_at', `${desde}T00:00:00`);

    const ingBuffet = (gastos || [])
      .filter(g => (g.concepto || '').toLowerCase().includes('buffet'))
      .reduce((s, g) => s + Math.abs(g.monto), 0);

    const totalClientes = turnosFilt.length || 1;

    return {
      sucursal,
      periodo: dias,
      totalClientes: turnosFilt.length,
      ingresosTurnos: ingTurnos,
      ingresosBuffet: ingBuffet,
      ingresoTotal: ingTurnos + ingBuffet,
      ticketPromedio: Math.round((ingTurnos + ingBuffet) / totalClientes),
      ticketSoloCancha: Math.round(ingTurnos / totalClientes),
      ticketBuffetExtra: Math.round(ingBuffet / totalClientes)
    };
  },

  // ============================================================
  // ÁREA 4: EFICIENCIA DEL BUFFET
  // ============================================================

  /**
   * Productos estrella vs perros (rotación y rentabilidad)
   */
  async productosEstrellaVsPerros(sucursal) {
    const { data: stock } = await db
      .from('stock')
      .select('*')
      .ilike('sucursal', `%${sucursal}%`);

    if (!stock?.length) return { estrellas: [], perros: [], normales: [] };

    // Buscar historial de ventas en gastos
    const { data: ventas } = await db
      .from('gastos')
      .select('concepto, monto')
      .ilike('sucursal', `%${sucursal}%`)
      .lt('monto', 0)
      .ilike('concepto', '%Buffet%');

    // Contar ventas por producto
    const ventasPorProd = {};
    (ventas || []).forEach(v => {
      const match = stock.find(s =>
        (v.concepto || '').toLowerCase().includes(s.item.toLowerCase())
      );
      if (match) {
        ventasPorProd[match.id] = (ventasPorProd[match.id] || 0) + 1;
      }
    });

    const productos = stock.map(s => {
      const vendidasUnids = ventasPorProd[s.id] || 0;
      const margen = s.precio_venta && s.precio_costo
        ? Math.round(((s.precio_venta - s.precio_costo) / s.precio_venta) * 100)
        : null;
      return {
        id: s.id,
        item: s.item,
        cantidad: s.cantidad,
        precio_venta: s.precio_venta || 0,
        precio_costo: s.precio_costo || 0,
        margen,
        vendasPeriodo: vendidasUnids,
        stockBajo: s.cantidad < 10,
        categoria: this._categorizarProducto(vendidasUnids, s.cantidad)
      };
    });

    return {
      sucursal,
      estrellas: productos.filter(p => p.categoria === 'estrella').sort((a, b) => b.vendasPeriodo - a.vendasPeriodo),
      normales:  productos.filter(p => p.categoria === 'normal'),
      perros:    productos.filter(p => p.categoria === 'perro').sort((a, b) => a.vendasPeriodo - b.vendasPeriodo),
      todos: productos
    };
  },

  /**
   * Margen de contribución del buffet
   */
  async margenBuffet(sucursal) {
    const { data: stock } = await db
      .from('stock')
      .select('*')
      .ilike('sucursal', `%${sucursal}%`);

    if (!stock?.length) return null;

    const conMargen = (stock || []).filter(s => s.precio_venta && s.precio_costo);
    const sinMargen = stock.length - conMargen.length;

    const resumen = conMargen.map(s => ({
      item: s.item,
      costo: s.precio_costo,
      venta: s.precio_venta,
      margen: Math.round(((s.precio_venta - s.precio_costo) / s.precio_venta) * 100),
      ganancia_unitaria: s.precio_venta - s.precio_costo
    })).sort((a, b) => b.margen - a.margen);

    const margenPromedio = conMargen.length
      ? Math.round(resumen.reduce((s, p) => s + p.margen, 0) / resumen.length)
      : 0;

    return {
      sucursal,
      productos: resumen,
      margenPromedio,
      sinDatos: sinMargen,
      estrellaMargen: resumen[0] || null,
      peorMargen: resumen[resumen.length - 1] || null
    };
  },

  // ============================================================
  // REPORTE EJECUTIVO COMPLETO (Resumen dominical)
  // ============================================================
  async reporteEjecutivoSemanal() {
    const [lanus7, belgrano7, comp, lanusCanchas, belgranoCanchas, lanusBuf, belgranoBuf] = await Promise.allSettled([
      this.balanceNeto('lanus', 7),
      this.balanceNeto('belgrano', 7),
      this.rendimientoPorSucursal(7),
      this.rankingCanchas('lanus', 7),
      this.rankingCanchas('belgrano', 7),
      this.productosEstrellaVsPerros('lanus'),
      this.productosEstrellaVsPerros('belgrano')
    ]);

    const get = r => r.status === 'fulfilled' ? r.value : null;

    return {
      periodo: 'Últimos 7 días',
      generadoEn: new Date().toLocaleString('es-AR'),
      financiero: {
        lanus: get(lanus7),
        belgrano: get(belgrano7),
        comparativa: get(comp)
      },
      canchas: {
        lanus: get(lanusCanchas),
        belgrano: get(belgranoCanchas)
      },
      buffet: {
        lanus: get(lanusBuf),
        belgrano: get(belgranoBuf)
      }
    };
  },

  // ============================================================
  // UTILIDADES
  // ============================================================

  _fechaHace(dias) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().split('T')[0];
  },

  _categorizarProducto(ventas, stock) {
    if (ventas >= 5) return 'estrella';
    if (ventas === 0 && stock > 20) return 'perro';
    return 'normal';
  },

  // Formatter para texto de reporte
  formatearReporteFinanciero(data) {
    if (!data) return 'Sin datos disponibles.';
    const { sucursal, periodo, totalIngresos, totalEgresos, netoTotal, promedioDiario } = data;
    const emoji = netoTotal >= 0 ? '📈' : '📉';
    return `${emoji} Balance ${sucursal?.toUpperCase()} (${periodo}d)\n` +
      `💰 Ingresos: ${fmt.money(totalIngresos)}\n` +
      `💸 Egresos:  ${fmt.money(totalEgresos)}\n` +
      `💵 Neto:     ${fmt.money(netoTotal)}\n` +
      `📊 Prom/día: ${fmt.money(promedioDiario)}`;
  }
};
