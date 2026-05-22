require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return createClient(process.env.SUPABASE_URL, key);
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

function requireRole(...rolesPermitidos) {
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

// ============================================================
// NICO AGENT — Endpoints server-side (cron-job.org friendly)
// ============================================================

// Middleware: valida API key del agente
function agentAuth(req, res, next) {
  const key = req.query.key || req.headers['x-agent-key'];
  if (!key || key !== process.env.AGENT_API_KEY) {
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
    const sucursales = ['lanus', 'belgrano'];
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
    const msgWA = `¡Che crack! ⚽🔥 Se acaba de liberar un turno para *${jugador.deporte}* en la sede *${jugador.sucursal_id.toUpperCase()}*.\n\n📅 *Fecha:* ${jugador.fecha}\n⏰ *Hora:* ${jugador.hora}\n\nComo te anotaste en la lista de espera, tenés la prioridad absoluta. ¡Volá a responder este mensaje si lo querés antes de que se lo quede otro! 🏟️🏃‍♂️💨`;

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
