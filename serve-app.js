require('dotenv').config();

const express = require('express');
const path = require('path');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Demasiadas solicitudes. Esperá un minuto.' }
});

app.use('/api/', apiLimiter);
app.use(express.static(path.join(__dirname, 'app')));
app.use(express.json());

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

const preferenceSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  price: z.number().positive().max(9999999),
  quantity: z.number().int().positive().max(100)
});

app.post('/create-preference', async (req, res) => {
  try {
    const parsed = preferenceSchema.parse(req.body);
    
    const preference = new Preference(client);
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
      return res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
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

// ============================================================
// MIDDLEWARE: extrae token de autorización
// ============================================================
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere autenticación' });
  }
  req.authToken = auth.slice(7);
  next();
}

// ============================================================
// POST /api/reservar — Reserva atómica (turno + stock + pago)
// ============================================================
app.post('/api/reservar', authMiddleware, async (req, res) => {
  try {
    const parsed = reservarSchema.parse(req.body);
    const db = getSupabase(req.authToken);

    // 1. Obtener turno con datos de la cancha
    const { data: turno, error: errTurno } = await db
      .from('turnos').select('*, canchas(*)').eq('id', parsed.turno_id).single();
    if (errTurno || !turno) return res.status(404).json({ error: 'Turno no encontrado' });
    if (turno.reservado) return res.status(409).json({ error: 'El turno ya está reservado' });

    const cancha = turno.canchas;
    const sucursal = cancha.sucursal_id;

    // 2. Validar stock del combo antes de tocar algo
    for (const item of parsed.combo_items) {
      const { data: stock } = await db.from('stock').select('*').eq('id', item.id).single();
      if (!stock || stock.cantidad < item.cantidad) {
        return res.status(409).json({ error: `Stock insuficiente de ${stock?.item || 'producto'}` });
      }
    }

    // 3. Marcar turno como reservado
    const { error: errReservar } = await db
      .from('turnos').update({ reservado: true, cliente_nombre: parsed.cliente_nombre }).eq('id', parsed.turno_id);
    if (errReservar) throw errReservar;

    // 4. Descontar stock del combo
    for (const item of parsed.combo_items) {
      const { data: stock } = await db.from('stock').select('cantidad').eq('id', item.id).single();
      await db.from('stock').update({ cantidad: stock.cantidad - item.cantidad }).eq('id', item.id);
    }

    // 5. Calcular total
    let total = cancha.precio || 0;
    for (const item of parsed.combo_items) {
      const { data: stock } = await db.from('stock').select('precio_venta').eq('id', item.id).single();
      total += (stock?.precio_venta || 0) * item.cantidad;
    }

    await db.from('movimientos').insert([{
      sucursal,
      tipo: 'ingreso',
      categoria: 'Alquiler Cancha',
      concepto: `Reserva: ${parsed.cliente_nombre} — ${cancha.nombre} ${turno.hora} ${turno.fecha}`,
      monto: total
    }]);

    // 7. Registrar en reservas
    await db.from('reservas').insert([{
      cancha_id: cancha.id,
      cliente_nombre: parsed.cliente_nombre,
      cumpleanios: parsed.cumpleanios || null,
      estado_pago: 'pendiente',
      notas: parsed.combo_items.length > 0 ? `Combo buffet: ${parsed.combo_items.length} items` : ''
    }]);

    res.json({ success: true, total, turno_id: parsed.turno_id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
    }
    console.error('❌ Error en /api/reservar:', error);
    res.status(500).json({ error: 'Error al procesar la reserva' });
  }
});

// ============================================================
// POST /api/venta-buffet — Venta de buffet (server-side)
// ============================================================
app.post('/api/venta-buffet', authMiddleware, async (req, res) => {
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

    await db.from('stock').update({ cantidad: prod.cantidad - parsed.cantidad }).eq('id', prod.id);
    const total = (prod.precio_venta || 0) * parsed.cantidad;
    await db.from('movimientos').insert([{
      sucursal: parsed.sucursal_id,
      tipo: 'ingreso',
      categoria: 'Venta Buffet',
      concepto: `${prod.item} x${parsed.cantidad}`,
      monto: total
    }]);

    res.json({ success: true, producto: prod.item, cantidad: parsed.cantidad, total });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
    }
    console.error('❌ Error en /api/venta-buffet:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
  }
});

// ============================================================
// POST /api/gasto — Registrar gasto con detección de anomalías
// ============================================================
app.post('/api/gasto', authMiddleware, async (req, res) => {
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
      return res.status(400).json({ error: 'Datos inválidos', detalles: error.errors });
    }
    console.error('❌ Error en /api/gasto:', error);
    res.status(500).json({ error: 'Error al registrar gasto' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ CanchaOS corriendo en: http://localhost:${PORT}`);
  });
}

module.exports = app;
