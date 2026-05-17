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
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.supabase.co"],
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

async function requireRole(...rolesPermitidos) {
  return async (req, res, next) => {
    try {
      const db = getSupabase(req.authToken);
      const { data: { user }, error: userError } = await db.auth.getUser(req.authToken);
      if (userError || !user) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      const { data: perfil } = await db.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
      if (!perfil || !rolesPermitidos.includes(perfil.rol)) {
        return res.status(403).json({ error: 'No tenés permisos para esta acción' });
      }
      req.user = user;
      req.userRol = perfil.rol;
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

    // Convertir combo_items al formato JSONB que espera la RPC
    const comboItems = parsed.combo_items.map(i => ({ id: i.id, cantidad: i.cantidad }));

    // Llamar a la RPC atómica en Supabase
    const { data, error } = await db.rpc('reservar_atomico', {
      p_turno_id: parsed.turno_id,
      p_cliente_nombre: parsed.cliente_nombre,
      p_cumpleanios: parsed.cumpleanios || null,
      p_combo_items: JSON.stringify(comboItems)
    });

    if (error) {
      console.error('❌ Error en RPC reservar_atomico:', error);
      return res.status(500).json({ error: 'Error al procesar la reserva' });
    }

    if (!data.success) {
      return res.status(409).json({ error: data.error });
    }

    res.json({ success: true, total: data.total, turno_id: data.turno_id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error en /api/reservar:', error);
    res.status(500).json({ error: 'Error al procesar la reserva' });
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
      return res.status(400).json({ error: 'Datos inválidos. Revisá los campos e intentá de nuevo.' });
    }
    console.error('❌ Error en /api/venta-buffet:', error);
    res.status(500).json({ error: 'Error al procesar la venta' });
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
