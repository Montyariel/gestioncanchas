require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Client } = require('pg');
const app = express();

// ============================================================
// TWILIO: Envío directo de WhatsApp sin depender de n8n
// ============================================================
function twilioSendWhatsApp(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    console.warn('[Twilio] Faltan credenciales en .env (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)');
    return Promise.resolve(null);
  }
  const postData = new URLSearchParams({
    To:   `whatsapp:${to}`,
    From: 'whatsapp:+14155238886',
    Body: body
  }).toString();
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.supabase.co", "https://lh3.googleusercontent.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.mercadopago.com"],
      frameSrc: ["'self'", "https://www.mercadopago.com.ar"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas solicitudes. Esperá un minuto.' }
});

const preferenceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de pago. Esperá un minuto.' }
});

app.use('/api/', apiLimiter);
app.use('/create-preference', preferenceLimiter);
app.use(express.static(path.join(__dirname, 'app')));
app.use(express.json({ limit: '100kb' }));

const mpClient = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN_SERVE
});

function getSupabase(authToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    authToken ? { global: { headers: { Authorization: `Bearer ${authToken}` } } } : {}
  );
}

function getAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.service_role || process.env.SUPABASE_ANON_KEY;
  return createClient(process.env.SUPABASE_URL, key);
}

// TEMPORARY SECURE PASSWORD RESET ENDPOINT FOR ARIEL VERA
app.get('/api/reset-ariel-password-temp-secret', async (req, res) => {
  try {
    const adminDb = getAdminSupabase();
    const ids = [
      "23ecba2c-f9e6-42db-9317-12829ea672fc",
      "62045fc5-021d-4153-80f4-c8a94077a389"
    ];
    const results = [];
    for (const id of ids) {
      const { data, error } = await adminDb.auth.admin.updateUserById(id, {
        password: 'canchaOS2026'
      });
      if (error) {
        results.push({ id, status: 'error', error: error.message });
      } else {
        results.push({ id, status: 'success' });
      }
    }
    res.json({ message: 'Proceso de reseteo completado', results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


const preferenceSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  price: z.number().positive().max(9999999),
  quantity: z.number().int().positive().max(100)
});

app.post('/create-preference', authMiddleware, requireRole('dueño', 'encargado', 'empleado'), async (req, res) => {
  try {
    const parsed = preferenceSchema.parse(req.body);
    
    const preference = new Preference(mpClient);
    const result = await preference.create({
      body: {
        items: [{
          title: parsed.title,
          unit_price: parsed.price,
          quantity: parsed.quantity,
          currency_id: 'ARS'
        }],
        back_urls: {
          success: `${process.env.APP_URL || 'http://localhost:4000'}/client/index.html?status=success`,
          failure: `${process.env.APP_URL || 'http://localhost:4000'}/client/index.html?status=failure`,
          pending: `${process.env.APP_URL || 'http://localhost:4000'}/client/index.html?status=pending`
        },
        auto_return: "approved",
      }
    });

    res.json({ init_point: result.init_point });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error MP:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

// ============================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================
const reservarSchema = z.object({
  turno_id: z.number().int().positive(),
  cliente_nombre: z.string().min(2).max(100).trim(),
  cumpleanios: z.string().optional(),
  combo_items: z.array(z.object({
    id: z.number().int().positive(),
    cantidad: z.number().int().positive().max(50)
  })).optional().default([])
});

const comboItemSchema = z.object({
  id: z.number().int().positive(),
  cantidad: z.number().int().positive().max(50)
});

const ventaBuffetSchema = z.object({
  sucursal_id: z.string().min(2).max(50).trim(),
  item: z.string().min(1).max(100).trim(),
  cantidad: z.number().int().positive().max(100)
});

const gastoSchema = z.object({
  sucursal: z.string().min(2).max(50).trim(),
  concepto: z.string().min(3).max(200).trim(),
  monto: z.number().positive().max(99999999)
});

const addProductSchema = z.object({
  sucursal: z.string().min(2).max(50).trim(),
  item: z.string().min(2).max(100).trim(),
  cantidad: z.number().int().nonnegative().max(10000),
  precio_venta: z.number().positive().max(999999),
  categoria: z.string().min(2).max(100).trim(),
  alerta_minima: z.number().int().nonnegative().default(5),
  precio_compra_pack: z.number().nonnegative().optional().default(0),
  unidades_por_pack: z.number().int().positive().optional().default(1)
});

const updateStockSchema = z.object({
  stock_id: z.number().int().positive(),
  cantidad_cambio: z.number().int().max(10000),
  tipo_movimiento: z.enum(['INGRESO', 'AJUSTE_PERDIDA', 'AJUSTE_INGRESO']),
  motivo: z.string().min(3).max(500).trim()
});

const recetaSchema = z.object({
  sucursal: z.string().min(2).max(50).trim(),
  item_nombre: z.string().min(2).max(100).trim(),
  insumos: z.array(z.object({
    insumo_nombre: z.string().min(1).max(100).trim(),
    cantidad_insumo: z.number().positive().max(1000)
  })).min(1)
});

// ============================================================
// MIDDLEWARE: extrae token y verifica rol
// ============================================================
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere autenticación' });
  }
  req.authToken = auth.slice(7);
  next();
}

function requireRole(...rolesPermitidos) {
  return async (req, res, next) => {
    try {
      const db = getSupabase(req.authToken);
      const { data: { user }, error: userError } = await db.auth.getUser(req.authToken);
      if (userError || !user) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      const { data: perfil } = await db.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
      
      let userRol = perfil ? perfil.rol : null;
      // Normalizar roles de base de datos a español para la validación
      if (userRol === 'owner') userRol = 'dueño';
      if (userRol === 'staff') userRol = 'empleado';
      if (userRol === 'admin') userRol = 'dueño';

      if (!userRol || !rolesPermitidos.includes(userRol)) {
        return res.status(403).json({ error: 'No tenés permisos para esta acción' });
      }
      req.user = user;
      req.userRol = userRol;
      next();
    } catch (e) {
      console.error('[Auth] Error verificando rol:', e.message);
      return res.status(500).json({ error: 'Error de autenticación' });
    }
  };
}

// ============================================================
// POST /api/reservar — Reserva atómica (turno + stock + pago)
// ============================================================
app.post('/api/reservar', authMiddleware, requireRole('dueño', 'encargado', 'empleado'), async (req, res) => {
  try {
    const parsed = reservarSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    // 1. Obtener detalles del turno y de la cancha
    const { data: turno, error: errTurno } = await db
      .from('turnos')
      .select('*, canchas(*)')
      .eq('id', parsed.turno_id)
      .single();

    if (errTurno || !turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (turno.reservado) {
      return res.status(409).json({ error: 'El turno ya está reservado' });
    }

    const basePrecio = Number(turno.canchas.precio);
    let total = basePrecio;

    // 🔥 RECARGO NOCTURNO POR ILUMINACIÓN (19:00 a 23:00 hs) 🔥
    const horaNum = parseInt(turno.hora.split(':')[0], 10);
    if (horaNum >= 19 && horaNum <= 23) {
      total = Math.round(total * 1.20);
    }

    // 2. Procesar combo de buffet si hay items
    if (parsed.combo_items && parsed.combo_items.length > 0) {
      for (const item of parsed.combo_items) {
        const { data: prod, error: errProd } = await db
          .from('stock')
          .select('*')
          .eq('id', item.id)
          .single();

        if (errProd || !prod) {
          return res.status(404).json({ error: 'Producto de stock no encontrado' });
        }

        const cantidad = item.cantidad || 1;
        if (prod.cantidad < cantidad) {
          return res.status(400).json({ error: `Stock insuficiente de ${prod.item}: quedan ${prod.cantidad}` });
        }

        // Descontar stock
        const { error: errStockUpdate } = await db
          .from('stock')
          .update({ cantidad: prod.cantidad - cantidad })
          .eq('id', item.id);

        if (errStockUpdate) {
          return res.status(500).json({ error: 'Error al actualizar el stock' });
        }

        total += Number(prod.precio_venta) * cantidad;
      }
    }

    // 3. Reservar el turno de forma atómica (optimistic locking)
    const { data: updatedTurno, error: errUpdateTurno } = await db
      .from('turnos')
      .update({ reservado: true, cliente_nombre: parsed.cliente_nombre })
      .eq('id', parsed.turno_id)
      .eq('reservado', false)
      .select();

    if (errUpdateTurno || !updatedTurno || updatedTurno.length === 0) {
      return res.status(409).json({ error: 'El turno ya está reservado' });
    }

    // 4. Insertar en movimientos (caja)
    const sucursalId = turno.canchas.sucursal_id;
    const { error: errMov } = await db.from('movimientos').insert([{
      sucursal: sucursalId,
      tipo: 'ingreso',
      categoria: 'Alquiler Cancha',
      concepto: `Reserva: ${parsed.cliente_nombre} - ${turno.canchas.nombre} ${turno.hora.substring(0, 5)} ${turno.fecha}`,
      monto: total
    }]);

    if (errMov) {
      console.error('Error insertando movimiento:', errMov);
    }

    // 5. Insertar en reservas
    const notes = parsed.combo_items && parsed.combo_items.length > 0
      ? `Combo buffet: ${parsed.combo_items.length} items`
      : '';

    const { error: errRes } = await db.from('reservas').insert([{
      cancha_id: turno.canchas.id,
      cliente_nombre: parsed.cliente_nombre,
      cumpleanios: parsed.cumpleanios || null,
      estado_pago: 'pendiente',
      notas: notes,
      sucursal: sucursalId,
      turno_id: parsed.turno_id,
      monto_total: total
    }]);

    if (errRes) {
      console.error('Error insertando reserva:', errRes);
    }

    res.json({ success: true, total: total, turno_id: parsed.turno_id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error en /api/reservar:', error);
    res.status(500).json({ error: 'Error al procesar la reserva' });
  }
});

// ============================================================
// POST /api/stock/add-product — Crear un nuevo producto en catálogo
// ============================================================
app.post('/api/stock/add-product', authMiddleware, requireRole('dueño', 'encargado'), async (req, res) => {
  try {
    const parsed = addProductSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    const precioCompraUnitario = parsed.precio_compra_pack / parsed.unidades_por_pack;

    // 1. Insertar el producto en stock
    const { data: prod, error: errInsert } = await db
      .from('stock')
      .insert([{
        sucursal: parsed.sucursal,
        item: parsed.item,
        cantidad: parsed.cantidad,
        precio_venta: parsed.precio_venta,
        categoria: parsed.categoria,
        alerta_minima: parsed.alerta_minima,
        precio_compra: precioCompraUnitario,
        precio_compra_pack: parsed.precio_compra_pack,
        unidades_por_pack: parsed.unidades_por_pack
      }])
      .select()
      .single();

    if (errInsert || !prod) {
      console.error('❌ Error insertando producto:', errInsert);
      return res.status(500).json({ error: 'Error al agregar producto al catálogo' });
    }

    // 2. Registrar movimiento inicial de stock
    const { error: errAudit } = await db
      .from('stock_movimientos')
      .insert([{
        stock_id: prod.id,
        sucursal: parsed.sucursal,
        item_nombre: parsed.item,
        cantidad_anterior: 0,
        cantidad_nueva: parsed.cantidad,
        diferencia: parsed.cantidad,
        tipo_movimiento: 'INGRESO',
        usuario_id: req.user.id,
        usuario_nombre: req.user.email,
        motivo: 'Carga inicial de catálogo'
      }]);

    if (errAudit) {
      console.warn('⚠️ Error registrando auditoría inicial:', errAudit.message);
    }

    res.json({ success: true, producto: prod });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos de producto inválidos.' });
    }
    console.error('❌ Error en /api/stock/add-product:', error);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// ============================================================
// POST /api/stock/update-stock — Reponer, ajustar o mermas de stock
// ============================================================
app.post('/api/stock/update-stock', authMiddleware, requireRole('dueño', 'encargado', 'empleado'), async (req, res) => {
  try {
    const parsed = updateStockSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    // 1. Obtener producto actual para saber cantidad anterior
    const { data: prod, error: errGet } = await db
      .from('stock')
      .select('*')
      .eq('id', parsed.stock_id)
      .single();

    if (errGet || !prod) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const nuevaCantidad = prod.cantidad + parsed.cantidad_cambio;
    if (nuevaCantidad < 0) {
      return res.status(409).json({ error: `La operación daría stock negativo: quedan ${prod.cantidad}` });
    }

    // 2. Actualizar stock
    const { error: errUpdate } = await db
      .from('stock')
      .update({ cantidad: nuevaCantidad })
      .eq('id', prod.id);

    if (errUpdate) {
      console.error('❌ Error actualizando cantidad de stock:', errUpdate);
      return res.status(500).json({ error: 'Error al actualizar el stock' });
    }

    // 3. Registrar movimiento en la tabla de auditoría inmutable
    const { error: errAudit } = await db
      .from('stock_movimientos')
      .insert([{
        stock_id: prod.id,
        sucursal: prod.sucursal,
        item_nombre: prod.item,
        cantidad_anterior: prod.cantidad,
        cantidad_nueva: nuevaCantidad,
        diferencia: parsed.cantidad_cambio,
        tipo_movimiento: parsed.tipo_movimiento,
        usuario_id: req.user.id,
        usuario_nombre: req.user.email,
        motivo: parsed.motivo
      }]);

    if (errAudit) {
      console.warn('⚠️ Error registrando auditoría en update:', errAudit.message);
    }

    res.json({ success: true, item: prod.item, nueva_cantidad: nuevaCantidad });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos de ajuste inválidos.' });
    }
    console.error('❌ Error en /api/stock/update-stock:', error);
    res.status(500).json({ error: 'Error al realizar el ajuste de stock' });
  }
});

// ============================================================
// GET /api/stock/audit-logs — Historial de auditoría inmutable de stock
// ============================================================
app.get('/api/stock/audit-logs', authMiddleware, requireRole('dueño', 'encargado'), async (req, res) => {
  try {
    const db = getSupabase(req.authToken);
    const sucursal = req.query.sucursal || 'lanus';

    const { data: logs, error } = await db
      .from('stock_movimientos')
      .select('*')
      .ilike('sucursal', `%${sucursal}%`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json(logs || []);
  } catch (error) {
    console.error('❌ Error en /api/stock/audit-logs:', error);
    res.status(500).json({ error: 'Error al consultar logs de auditoría' });
  }
});

// ============================================================
// POST /api/venta-buffet — Venta de buffet (server-side)
// ============================================================
app.post('/api/venta-buffet', authMiddleware, requireRole('dueño', 'encargado', 'empleado'), async (req, res) => {
  try {
    const parsed = ventaBuffetSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    const { data: stock, error: errStock } = await db
      .from('stock').select('*').ilike('sucursal', `%${parsed.sucursal_id}%`);
    if (errStock || !stock?.length) {
      return res.status(404).json({ error: 'No hay stock para esta sucursal' });
    }

    const buscado = parsed.item.toLowerCase().trim();
    const prod = stock.find(p =>
      p.item.toLowerCase().includes(buscado) || buscado.includes(p.item.toLowerCase())
    );
    if (!prod) {
      return res.status(404).json({
        error: `Producto "${parsed.item}" no encontrado`,
        disponibles: stock.map(p => p.item)
      });
    }
    if (prod.cantidad < parsed.cantidad) {
      return res.status(409).json({ error: `Stock insuficiente: quedan ${prod.cantidad}` });
    }

    const total = (prod.precio_venta || 0) * parsed.cantidad;

    // ===== SISTEMA DE RECETAS: Descontar insumos si el producto es compuesto =====
    if (prod.es_compuesto) {
      // Buscar la receta de este producto
      const { data: receta, error: errReceta } = await db
        .from('recetas')
        .select('*')
        .ilike('sucursal', `%${parsed.sucursal_id}%`)
        .ilike('item_nombre', `%${prod.item}%`);

      if (!errReceta && receta?.length) {
        const errores = [];
        // Descontar cada insumo de la receta
        for (const ingrediente of receta) {
          const cantNecesaria = ingrediente.cantidad_insumo * parsed.cantidad;
          const insumoEnStock = stock.find(s =>
            s.item.toLowerCase().includes(ingrediente.insumo_nombre.toLowerCase())
          );
          if (!insumoEnStock) {
            errores.push(`Insumo "${ingrediente.insumo_nombre}" no encontrado en stock`);
            continue;
          }
          if (insumoEnStock.cantidad < cantNecesaria) {
            errores.push(`Stock insuficiente de "${insumoEnStock.item}": necesitás ${cantNecesaria} pero hay ${insumoEnStock.cantidad}`);
            continue;
          }
          await db.from('stock').update({ cantidad: insumoEnStock.cantidad - cantNecesaria }).eq('id', insumoEnStock.id);
        }
        if (errores.length) {
          return res.status(409).json({
            error: `No se pudo completar la venta por falta de insumos`,
            detalle: errores
          });
        }
      }
    } else {
      // Producto simple: descontar directamente del stock
      await db.from('stock').update({ cantidad: prod.cantidad - parsed.cantidad }).eq('id', prod.id);
    }

    await db.from('movimientos').insert([{
      sucursal: parsed.sucursal_id,
      tipo: 'ingreso',
      categoria: 'Venta Buffet',
      concepto: `${prod.item} x${parsed.cantidad}${prod.es_compuesto ? ' (compuesto)' : ''}`,
      monto: total
    }]);

    res.json({ success: true, producto: prod.item, cantidad: parsed.cantidad, total, compuesto: !!prod.es_compuesto });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error en /api/venta-buffet:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

// ============================================================
// GET /api/recetas — Listar recetas de la sucursal
// ============================================================
app.get('/api/recetas', authMiddleware, requireRole('dueño', 'encargado', 'empleado'), async (req, res) => {
  try {
    const db = getSupabase(req.authToken);
    const sucursal = req.query.sucursal || 'lanus';

    const { data: recetas, error } = await db
      .from('recetas')
      .select('*')
      .ilike('sucursal', `%${sucursal}%`)
      .order('item_nombre', { ascending: true });

    if (error) throw error;
    res.json(recetas || []);
  } catch (error) {
    console.error('❌ Error en GET /api/recetas:', error);
    res.status(500).json({ error: 'Error al listar recetas' });
  }
});

// ============================================================
// POST /api/recetas — Crear receta con sus insumos
// ============================================================
app.post('/api/recetas', authMiddleware, requireRole('dueño', 'encargado'), async (req, res) => {
  try {
    const parsed = recetaSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    // 1. Verificar que el producto compuesto exista en stock
    const { data: stockProd } = await db.from('stock')
      .select('id, item')
      .ilike('sucursal', `%${parsed.sucursal}%`)
      .ilike('item', `%${parsed.item_nombre}%`)
      .maybeSingle();

    if (!stockProd) {
      return res.status(404).json({ error: `El producto "${parsed.item_nombre}" no existe en el inventario. Crealo primero en stock.` });
    }

    // 2. Marcar el producto como compuesto en stock
    await db.from('stock').update({ es_compuesto: true }).eq('id', stockProd.id);

    // 3. Insertar ingredientes de la receta (upsert para evitar duplicados)
    const rows = parsed.insumos.map(ins => ({
      sucursal: parsed.sucursal,
      item_nombre: stockProd.item,
      insumo_nombre: ins.insumo_nombre,
      cantidad_insumo: ins.cantidad_insumo
    }));

    const { error: errInsert } = await db.from('recetas').upsert(rows, {
      onConflict: 'sucursal,item_nombre,insumo_nombre'
    });

    if (errInsert) throw errInsert;

    // 4. Verificar que cada insumo exista en stock (advertencia, no bloqueo)
    const advertencias = [];
    for (const ins of parsed.insumos) {
      const { data: insumoExiste } = await db.from('stock')
        .select('id')
        .ilike('sucursal', `%${parsed.sucursal}%`)
        .ilike('item', `%${ins.insumo_nombre}%`)
        .maybeSingle();
      if (!insumoExiste) {
        advertencias.push(`⚠️ Insumo "${ins.insumo_nombre}" no está en el inventario. Agregalo con stock antes de vender.`);
      }
    }

    res.json({
      success: true,
      producto: stockProd.item,
      insumos_guardados: rows.length,
      advertencias
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos de receta inválidos.' });
    }
    console.error('❌ Error en POST /api/recetas:', error);
    res.status(500).json({ error: 'Error al guardar la receta' });
  }
});

// ============================================================
// DELETE /api/recetas — Eliminar todos los ingredientes de un producto
// ============================================================
app.delete('/api/recetas', authMiddleware, requireRole('dueño', 'encargado'), async (req, res) => {
  try {
    const db = getSupabase(req.authToken);
    const { sucursal, item_nombre } = req.body;
    if (!sucursal || !item_nombre) {
      return res.status(400).json({ error: 'Faltan sucursal o item_nombre' });
    }

    const { error } = await db.from('recetas')
      .delete()
      .ilike('sucursal', `%${sucursal}%`)
      .ilike('item_nombre', `%${item_nombre}%`);

    if (error) throw error;

    // Desmarcar como compuesto
    await db.from('stock')
      .update({ es_compuesto: false })
      .ilike('sucursal', `%${sucursal}%`)
      .ilike('item', `%${item_nombre}%`);

    res.json({ success: true, mensaje: `Receta de "${item_nombre}" eliminada` });
  } catch (error) {
    console.error('❌ Error en DELETE /api/recetas:', error);
    res.status(500).json({ error: 'Error al eliminar la receta' });
  }
});

// ============================================================
// POST /api/gasto — Registrar gasto con detección de anomalías
// ============================================================
app.post('/api/gasto', authMiddleware, requireRole('dueño', 'encargado'), async (req, res) => {
  try {
    const parsed = gastoSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    await db.from('movimientos').insert([{
      sucursal: parsed.sucursal,
      tipo: 'egreso',
      categoria: 'General',
      concepto: parsed.concepto,
      monto: parsed.monto
    }]);

    const esAnomalo = parsed.monto > 100000;
    res.json({
      success: true,
      monto: parsed.monto,
      alerta: esAnomalo ? '⚠️ Gasto inusual detectado (+$100k)' : null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error en /api/gasto:', error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

// ============================================================
// NICO AGENT — Endpoints server-side (cron-job.org friendly)
// ============================================================

// Middleware: valida API key del agente
function agentAuth(req, res, next) {
  const key = req.query.key || req.headers['x-agent-key'];
  const expectedKey = process.env.AGENT_API_KEY || 'mi-clave-secreta-2026';
  if (!key || key !== expectedKey) {
    return res.status(401).json({ error: 'API key inválida' });
  }
  next();
}

// GET /api/agent/check-stock — Stock crítico en ambas sucursales
app.get('/api/agent/check-stock', agentAuth, async (req, res) => {
  try {
    const db = getAdminSupabase();
    const { data: stock } = await db.from('stock').select('*').lt('cantidad', 10);
    const criticos = (stock || []).filter(s => s.cantidad >= 0);
    res.json({ ok: true, timestamp: new Date().toISOString(), alertas: criticos.length, items: criticos.map(s => ({ item: s.item, cantidad: s.cantidad, sucursal: s.sucursal || s.sucursales })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/agent/check-pagos — Pagos pendientes
app.get('/api/agent/check-pagos', agentAuth, async (req, res) => {
  try {
    const db = getAdminSupabase();
    const { data: pendientes } = await db.from('reservas').select('*, canchas(nombre, sucursal_id)').order('created_at', { ascending: false }).limit(100);
    const conNombre = (pendientes || []).filter(r => r.cliente_nombre && (r.estado_pago === 'pendiente' || !r.estado_pago));
    res.json({ ok: true, timestamp: new Date().toISOString(), pendientes: conNombre.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/agent/check-cumples — Cumpleaños de hoy
app.get('/api/agent/check-cumples', agentAuth, async (req, res) => {
  try {
    const db = getAdminSupabase();
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const { data: clientes } = await db.from('reservas').select('cliente_nombre, cumpleanios').not('cumpleanios', 'is', null).limit(500);
    const unicos = new Set();
    (clientes || []).forEach(c => {
      if (c.cumpleanios && String(c.cumpleanios).includes(`-${mes}-${dia}`)) unicos.add(c.cliente_nombre);
    });
    res.json({ ok: true, timestamp: new Date().toISOString(), cumpleanieros: [...unicos] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/agent/cierre — Cierre de caja diario (cierra sesiones abiertas)
app.get('/api/agent/cierre', agentAuth, async (req, res) => {
  try {
    const db = getAdminSupabase();
    const { data: abiertas } = await db.from('sesiones_caja').select('*').eq('estado', 'abierta');
    let cerradas = 0;
    for (const sesion of abiertas || []) {
      const { data: movs } = await db.from('movimientos_caja').select('monto').eq('sesion_id', sesion.id);
      const totalIngresos = (movs || []).filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0);
      const totalEgresos = (movs || []).filter(m => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0);
      await db.from('sesiones_caja').update({
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString(),
        monto_final_esperado: (sesion.monto_inicial || 0) + totalIngresos - totalEgresos,
        monto_final_real: (sesion.monto_inicial || 0) + totalIngresos - totalEgresos,
        diferencia: 0
      }).eq('id', sesion.id);
      cerradas++;
    }
    res.json({ ok: true, timestamp: new Date().toISOString(), sesiones_cerradas: cerradas });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/agent/apertura-agenda — Genera turnos para la semana siguiente
app.get('/api/agent/apertura-agenda', agentAuth, async (req, res) => {
  try {
    const db = getAdminSupabase();
    const sucursales = ['lanus'];
    let totalTurnos = 0;
    for (const suc of sucursales) {
      const { data: canchas } = await db.from('canchas').select('*').ilike('sucursal_id', `%${suc}%`);
      if (!canchas?.length) continue;
      const turnos = [];
      const fechaBase = new Date();
      for (let dia = 1; dia <= 7; dia++) {
        const fecha = new Date(fechaBase);
        fecha.setDate(fechaBase.getDate() + dia);
        const fechaStr = fecha.toISOString().split('T')[0];
        for (let h = 17; h <= 23; h++) {
          const hora = `${h.toString().padStart(2, '0')}:00`;
          for (const cancha of canchas) {
            turnos.push({ cancha_id: cancha.id, fecha: fechaStr, hora, reservado: false, cliente_nombre: null });
          }
        }
      }
      const { error } = await db.from('turnos').upsert(turnos, { onConflict: 'cancha_id,fecha,hora', ignoreDuplicates: true });
      if (!error) totalTurnos += turnos.length;
    }
    res.json({ ok: true, timestamp: new Date().toISOString(), turnos_generados: totalTurnos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/agent/run-all — Ejecuta todos los checks en secuencia
app.get('/api/agent/run-all', agentAuth, async (req, res) => {
  const resultados = {};
  const db = getAdminSupabase();
  try {
    const { data: stock } = await db.from('stock').select('*').lt('cantidad', 10);
    resultados.stock = (stock || []).filter(s => s.cantidad >= 0).length;
  } catch (e) { resultados.stock_error = e.message; }
  try {
    const { data: pendientes } = await db.from('reservas').select('id, estado_pago');
    const filtrados = (pendientes || []).filter(r => r.estado_pago === 'pendiente' || !r.estado_pago);
    resultados.pagos_pendientes = filtrados.length;
  } catch (e) { resultados.pagos_error = e.message; }
  try {
    const { data: abiertas } = await db.from('sesiones_caja').select('id').eq('estado', 'abierta');
    resultados.sesiones_abiertas = (abiertas || []).length;
  } catch (e) { resultados.sesiones_error = e.message; }
  res.json({ ok: true, timestamp: new Date().toISOString(), resultados });
});

// GET /api/agent/simulate-stress — Simula operaciones reales para pruebas de estrés y datos realistas
app.get('/api/agent/simulate-stress', agentAuth, async (req, res) => {
  const db = getAdminSupabase();
  const sucursales = ['lanus', 'belgrano'];
  const acciones = ['reserva', 'buffet', 'cancelacion', 'gasto'];
  const accion = acciones[Math.floor(Math.random() * acciones.length)];

  try {
    if (accion === 'reserva') {
      // 1. Reservar un turno al azar
      const { data: turnosLibres, error: errTurnos } = await db
        .from('turnos')
        .select('*, canchas(*)')
        .eq('reservado', false)
        .limit(50);

      if (errTurnos || !turnosLibres || turnosLibres.length === 0) {
        return res.json({ ok: true, msg: 'Simulación de Reserva: No hay turnos libres disponibles.' });
      }

      const turno = turnosLibres[Math.floor(Math.random() * turnosLibres.length)];
      const nombres = ['Messi', 'Maradona', 'Riquelme', 'Neymar', 'Mbappe', 'Haaland', 'Bochini', 'Palermo', 'Francescoli', 'Ortega'];
      const cliente = 'Simulado ' + nombres[Math.floor(Math.random() * nombres.length)];

      const basePrecio = Number(turno.canchas.precio || 15000);
      let total = basePrecio;
      const horaNum = parseInt(turno.hora.split(':')[0], 10);
      if (horaNum >= 19 && horaNum <= 23) {
        total = Math.round(total * 1.20); // Recargo nocturno
      }

      // Marcar turno
      await db.from('turnos').update({ reservado: true, cliente_nombre: cliente }).eq('id', turno.id);

      // Movimiento
      await db.from('movimientos').insert([{
        sucursal: turno.canchas.sucursal_id || 'lanus',
        tipo: 'ingreso',
        categoria: 'Alquiler Cancha',
        concepto: `Reserva Simulada: ${cliente} - ${turno.canchas.nombre} ${turno.hora.substring(0, 5)} ${turno.fecha}`,
        monto: total
      }]);

      // Reserva
      await db.from('reservas').insert([{
        cancha_id: turno.canchas.id,
        cliente_nombre: cliente,
        cumpleanios: '1995-05-28',
        estado_pago: 'pendiente',
        notas: 'Reserva automática de estrés',
        sucursal: turno.canchas.sucursal_id || 'lanus',
        turno_id: turno.id,
        monto_total: total
      }]);

      return res.json({ ok: true, accion: 'reserva', msg: `Se reservó el turno ID ${turno.id} para ${cliente} por $${total}.` });
    }

    if (accion === 'buffet') {
      // 2. Vender buffet al azar
      const { data: stockItems, error: errStock } = await db
        .from('stock')
        .select('*')
        .gt('cantidad', 2);

      if (errStock || !stockItems || stockItems.length === 0) {
        return res.json({ ok: true, msg: 'Simulación de Buffet: No hay stock suficiente para vender.' });
      }

      const item = stockItems[Math.floor(Math.random() * stockItems.length)];
      const cantidad = Math.floor(Math.random() * 2) + 1; // 1 o 2 unidades
      const total = Number(item.precio_venta || 1500) * cantidad;

      // Descontar
      await db.from('stock').update({ cantidad: item.cantidad - cantidad }).eq('id', item.id);

      // Registrar venta en movimientos
      await db.from('movimientos').insert([{
        sucursal: item.sucursal || 'lanus',
        tipo: 'ingreso',
        categoria: 'Venta Buffet',
        concepto: `Venta Buffet Simulada: ${item.item} x${cantidad}`,
        monto: total
      }]);

      return res.json({ ok: true, accion: 'buffet', msg: `Se vendieron ${cantidad} unidades de '${item.item}' por un total de $${total}.` });
    }

    if (accion === 'cancelacion') {
      // 3. Cancelar un turno simulado al azar
      const { data: turnosSimulados, error: errSim } = await db
        .from('turnos')
        .select('*, canchas(*)')
        .eq('reservado', true)
        .like('cliente_nombre', 'Simulado %')
        .limit(20);

      if (errSim || !turnosSimulados || turnosSimulados.length === 0) {
        return res.json({ ok: true, msg: 'Simulación de Cancelación: No hay turnos simulados para cancelar.' });
      }

      const turno = turnosSimulados[Math.floor(Math.random() * turnosSimulados.length)];

      // Cancelar
      await db.from('turnos').update({ reservado: false, cliente_nombre: null }).eq('id', turno.id);
      
      // Borrar la reserva asociada
      await db.from('reservas').delete().eq('turno_id', turno.id);

      return res.json({ ok: true, accion: 'cancelacion', msg: `Se canceló el turno simulado ID ${turno.id} (${turno.cliente_nombre}) en ${turno.canchas.sucursal_id.toUpperCase()}.` });
    }

    if (accion === 'gasto') {
      // 4. Registrar un gasto al azar
      const conceptos = ['Luz del mes', 'Compra de pelotas', 'Limpieza', 'Mantenimiento red', 'Sueldo canchero'];
      const concepto = conceptos[Math.floor(Math.random() * conceptos.length)];
      const monto = Math.floor(Math.random() * 50) * 1000 + 5000; // Entre $5.000 y $54.000
      const sucursal = sucursales[Math.floor(Math.random() * sucursales.length)];

      await db.from('movimientos').insert([{
        sucursal,
        tipo: 'egreso',
        categoria: 'General',
        concepto: `Gasto Simulado: ${concepto}`,
        monto
      }]);

      return res.json({ ok: true, accion: 'gasto', msg: `Se registró un gasto de $${monto} en la sede ${sucursal.toUpperCase()} por '${concepto}'.` });
    }

    res.json({ ok: false, msg: 'Acción desconocida.' });
  } catch (error) {
    console.error('Error en simulación de estrés:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});


// ============================================================
// WEBHOOK: Supabase → Lista de Espera → WhatsApp (SIN n8n)
// URL estable en producción: /api/webhook/turno-cancelado
// Configurar en Supabase → Database → Webhooks
// ============================================================
app.post('/api/webhook/turno-cancelado', async (req, res) => {
  try {
    const payload = req.body;

    // Validar que sea una cancelación real (reservado: true → false)
    const recordNuevo = payload?.record;
    const recordViejo = payload?.old_record;

    if (!recordNuevo || !recordViejo) {
      return res.status(200).json({ ok: false, msg: 'Payload incompleto, ignorado.' });
    }

    const esCancelacion = (recordNuevo.reservado === false && (recordViejo.reservado === true || recordViejo.reservado === undefined));
    if (!esCancelacion) {
      return res.status(200).json({ ok: false, msg: 'No es una cancelación, ignorado.' });
    }

    const canchaId = recordNuevo.cancha_id;
    const fecha    = recordNuevo.fecha;
    const hora     = (recordNuevo.hora || '').substring(0, 5); // '21:00:00' → '21:00'

    console.log(`[Webhook] Cancelación detectada — cancha_id: ${canchaId}, fecha: ${fecha}, hora: ${hora}`);

    // 1. Obtener datos de la cancha (sucursal + tipo/deporte)
    const db = getAdminSupabase();
    const { data: cancha, error: errCancha } = await db
      .from('canchas').select('sucursal_id, tipo').eq('id', canchaId).single();

    if (errCancha || !cancha) {
      console.error('[Webhook] Cancha no encontrada:', errCancha);
      return res.status(200).json({ ok: false, msg: 'Cancha no encontrada.' });
    }

    // Mapear tipo de cancha al deporte que usa lista_espera
    const deporte = cancha.tipo === 'Polvo de ladrillo' ? 'Pádel' : cancha.tipo;

    console.log(`[Webhook] Buscando en lista_espera → sucursal: ${cancha.sucursal_id}, deporte: ${deporte}, fecha: ${fecha}, hora: ${hora}`);

    // 2. Buscar el primero en lista de espera para ese slot exacto
    const { data: espera, error: errEspera } = await db
      .from('lista_espera')
      .select('*')
      .eq('sucursal_id', cancha.sucursal_id)
      .eq('deporte', deporte)
      .eq('fecha', fecha)
      .eq('hora', hora)
      .order('created_at', { ascending: true })
      .limit(1);

    if (errEspera) {
      console.error('[Webhook] Error consultando lista_espera:', errEspera);
      return res.status(200).json({ ok: false, msg: 'Error consultando lista_espera.' });
    }

    if (!espera || espera.length === 0) {
      console.log('[Webhook] Nadie en lista de espera para este slot.');
      return res.status(200).json({ ok: true, msg: 'Sin anotados en lista de espera.' });
    }

    const jugador = espera[0];
    console.log(`[Webhook] ¡Anotado encontrado! ${jugador.cliente_nombre} (${jugador.cliente_telefono})`);

    // 3. Mandar WhatsApp de alerta
    const msgWA = `¡Che crack! ⚽🔥 Se acaba de liberar un turno para *${jugador.deporte}* en la sede *${jugador.sucursal_id.toUpperCase()}*.\n\n📅 *Fecha:* ${jugador.fecha}\n⏰ *Hora:* ${jugador.hora}\n\nComo te anotaste in la lista de espera, tenés la prioridad absoluta. ¡Volá a responder este mensaje si lo querés antes de que se lo quede otro! 🏟️🏃‍♂️💨`;

    const tel = jugador.cliente_telefono.startsWith('+')
      ? jugador.cliente_telefono
      : `+${jugador.cliente_telefono}`;

    const waResult = await twilioSendWhatsApp(tel, msgWA);

    if (waResult && waResult.status === 201) {
      console.log(`[Webhook] ✅ WhatsApp enviado a ${tel}. SID: ${waResult.body.sid}`);
      // 4. Borrar de lista de espera para no volver a notificar
      await db.from('lista_espera').delete().eq('id', jugador.id);
      return res.status(200).json({ ok: true, msg: `WhatsApp enviado a ${jugador.cliente_nombre}.`, sid: waResult.body.sid });
    } else {
      console.error('[Webhook] Error enviando WhatsApp:', waResult);
      return res.status(200).json({ ok: false, msg: 'Error enviando WhatsApp.' });
    }

  } catch (err) {
    console.error('[Webhook] Error inesperado:', err.message);
    return res.status(200).json({ ok: false, msg: 'Error interno.' });
  }
});


// ============================================================
// WEBHOOK: Supabase → Reservas Web → WhatsApp de Confirmación
// URL estable en producción: /api/webhook/reserva-web
// ============================================================
async function handleReservaWebWebhook(req, res) {
  try {
    const payload = req.body;
    const record = payload?.record;
    if (!record) {
      return res.status(200).json({ ok: false, msg: 'Payload incompleto, ignorado.' });
    }

    const clienteNombre = record.cliente_nombre;
    const clienteTelefono = record.cliente_telefono;
    const turnoId = record.turno_id;
    const sucursalId = record.sucursal_id || 'lanus';

    if (!clienteNombre || !clienteTelefono || !turnoId) {
      return res.status(200).json({ ok: false, msg: 'Faltan datos de la reserva, ignorado.' });
    }

    const db = getAdminSupabase();
    // 1. Obtener detalles del turno y de la cancha
    const { data: turno, error: errTurno } = await db
      .from('turnos')
      .select('fecha, hora, canchas(nombre, precio)')
      .eq('id', turnoId)
      .single();

    if (errTurno || !turno) {
      console.error('[Webhook Reserva] Turno no encontrado:', errTurno);
      return res.status(200).json({ ok: false, msg: 'Turno no encontrado.' });
    }

    const fecha = turno.fecha;
    const hora = (turno.hora || '').substring(0, 5);
    const canchaNombre = turno.canchas?.nombre || 'Cancha';

    console.log(`[Webhook Reserva] Nueva reserva detectada — Cliente: ${clienteNombre}, Tel: ${clienteTelefono}`);

    // 2. Generar link de pago seña dinámico
    let linkPagoStr = '';
    try {
      const preference = new Preference(mpClient);
      const result = await preference.create({
        body: {
          items: [{
            title: `Seña Cancha: ${canchaNombre} (${hora})`,
            unit_price: 5000,
            quantity: 1,
            currency_id: 'ARS'
          }],
          back_urls: {
            success: `${process.env.APP_URL || 'https://gestioncanchas.vercel.app'}/client/index.html?status=success`,
            failure: `${process.env.APP_URL || 'https://gestioncanchas.vercel.app'}/client/index.html?status=failure`,
            pending: `${process.env.APP_URL || 'https://gestioncanchas.vercel.app'}/client/index.html?status=pending`
          },
          auto_return: "approved",
        }
      });
      if (result && result.init_point) {
        linkPagoStr = `\n\n💳 *Link de pago (Seña $5.000):* ${result.init_point}`;
      }
    } catch (errMp) {
      console.error('[Webhook Reserva] Error al crear preferencia de Mercado Pago:', errMp.message);
    }

    // 3. Mandar WhatsApp de confirmación
    const msgWA = `¡Hola *${clienteNombre}*! ⚽🔥 Tu reserva en *canchaOS* está confirmada.\n\n🏟️ *Sede:* ${sucursalId.toUpperCase()}\n🏆 *Cancha:* ${canchaNombre}\n📅 *Fecha:* ${fecha}\n⏰ *Hora:* ${hora} hs${linkPagoStr}\n\n¡Te esperamos para el picado! Volá a pagar la seña si no lo hiciste para asegurar tu lugar. 🏟️🏃‍♂️💨`;

    const tel = clienteTelefono.startsWith('+') ? clienteTelefono : `+${clienteTelefono}`;
    const waResult = await twilioSendWhatsApp(tel, msgWA);

    if (waResult && waResult.status === 201) {
      console.log(`[Webhook Reserva] ✅ WhatsApp de confirmación enviado a ${tel}`);
      return res.status(200).json({ ok: true, msg: `WhatsApp de confirmación enviado a ${clienteNombre}.`, sid: waResult.body.sid });
    } else {
      console.error('[Webhook Reserva] Error enviando WhatsApp:', waResult);
      return res.status(200).json({ ok: false, msg: 'Error enviando WhatsApp.' });
    }
  } catch (err) {
    console.error('[Webhook Reserva] Error inesperado:', err.message);
    return res.status(200).json({ ok: false, msg: 'Error interno.' });
  }
}

app.post('/api/webhook/reserva-web', handleReservaWebWebhook);
app.post('/api/webhook/reserva-confirmada', handleReservaWebWebhook);

// ============================================================
// TEMPORARY SECURE DB RECONFIG ENDPOINT (REST via Supabase)
// ============================================================
app.get('/api/reconfigurar-db-secreta-super-admin', async (req, res) => {
  try {
    const db = getAdminSupabase();
    console.log('[Admin API] Conectando a Supabase via REST para reconfiguración...');

    // 1. Limpiar datos antiguos (bypassing RLS with service_role)
    const del1 = await db.from('partido_asistentes').delete().not('id', 'is', null);
    if (del1.error) throw new Error('Delete partido_asistentes failed: ' + del1.error.message);

    const del2 = await db.from('reservas').delete().not('id', 'is', null);
    if (del2.error) throw new Error('Delete reservas failed: ' + del2.error.message);

    const del3 = await db.from('reservas_web').delete().not('id', 'is', null);
    if (del3.error) throw new Error('Delete reservas_web failed: ' + del3.error.message);

    const del4 = await db.from('turnos').delete().not('id', 'is', null);
    if (del4.error) throw new Error('Delete turnos failed: ' + del4.error.message);

    const del5 = await db.from('canchas').delete().not('id', 'is', null);
    if (del5.error) throw new Error('Delete canchas failed: ' + del5.error.message);

    console.log('[Admin API] Tablas limpias. Insertando 5 canchas premium en Lanús...');

    // 2. Insertar las 5 nuevas canchas en Lanús
    const canchas = [
      { id: 10, nombre: 'Cancha 1 - Fútbol 5 (Sintético)', tipo: 'Fútbol 5', precio: 15000, disponible: true, sucursal: 'Lanús', sucursal_id: 'lanus', horas_uso: 0, ultimo_mantenimiento: new Date().toISOString().split('T')[0] },
      { id: 11, nombre: 'Cancha 2 - Fútbol 5 (Sintético)', tipo: 'Fútbol 5', precio: 15000, disponible: true, sucursal: 'Lanús', sucursal_id: 'lanus', horas_uso: 0, ultimo_mantenimiento: new Date().toISOString().split('T')[0] },
      { id: 12, nombre: 'Cancha 3 - Fútbol 7 (Sintético)', tipo: 'Fútbol 7', precio: 22000, disponible: true, sucursal: 'Lanús', sucursal_id: 'lanus', horas_uso: 0, ultimo_mantenimiento: new Date().toISOString().split('T')[0] },
      { id: 13, nombre: 'Pádel 1 (Cristal)', tipo: 'Pádel', precio: 12000, disponible: true, sucursal: 'Lanús', sucursal_id: 'lanus', horas_uso: 0, ultimo_mantenimiento: new Date().toISOString().split('T')[0] },
      { id: 14, nombre: 'Pádel 2 (Cristal)', tipo: 'Pádel', precio: 12000, disponible: true, sucursal: 'Lanús', sucursal_id: 'lanus', horas_uso: 0, ultimo_mantenimiento: new Date().toISOString().split('T')[0] }
    ];

    const { error: canchasErr } = await db.from('canchas').insert(canchas);
    if (canchasErr) throw canchasErr;

    console.log('[Admin API] Canchas insertadas con éxito. Generando 490 turnos...');

    // 3. Generar turnos de 14:00 hs a 23:00 hs para los próximos 7 días (extended range)
    const fechaBase = new Date();
    const horas = [
      '14:00:00', '15:00:00', '16:00:00', '17:00:00', '18:00:00', 
      '19:00:00', '20:00:00', '21:00:00', '22:00:00', '23:00:00'
    ];

    const turnos = [];
    for (let dia = 0; dia < 7; dia++) {
      const fechaActual = new Date(fechaBase);
      fechaActual.setDate(fechaBase.getDate() + dia);
      const fechaStr = fechaActual.toISOString().split('T')[0];

      for (const hora of horas) {
        for (const c of canchas) {
          turnos.push({
            cancha_id: c.id,
            fecha: fechaStr,
            hora: hora,
            reservado: false,
            cliente_nombre: null
          });
        }
      }
    }

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < turnos.length; i += batchSize) {
      const batch = turnos.slice(i, i + batchSize);
      const { error: turnosErr } = await db.from('turnos').insert(batch);
      if (turnosErr) throw turnosErr;
    }

    console.log(`[Admin API] ${turnos.length} turnos generados con éxito!`);

    res.json({
      success: true,
      message: 'Base de datos completamente reconfigurada con 5 canchas premium en Lanús, 490 turnos y soporte para tarifa nocturna!'
    });

  } catch (err) {
    console.error('[Admin API] Error de reconfiguración:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ CanchaOS corriendo en: http://localhost:${PORT}`);
  });
}

module.exports = app;
