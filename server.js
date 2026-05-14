const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { createClient } = require("@supabase/supabase-js");
const { MercadoPagoConfig, Preference } = require('mercadopago');

// 1. CONFIGURACIÓN CENTRAL
const supabase = createClient('https://vcwqhxuyngqcnpptirtb.supabase.co', 'sb_publishable_KC_PbsOU5-S20oOOMZW-SQ_OsAZeeNl');
const client = new MercadoPagoConfig({ 
  accessToken: 'APP_USR-5221439410750753-050922-39aa72f43a055cd28b86996cc019b9ab-3390919754' 
});

const server = new Server(
  { name: "nico-sports-os-full", version: "10.0.0" },
  { capabilities: { tools: {} } }
);

// 2. LISTADO DE HERRAMIENTAS
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { 
      name: "pos_venta_buffet", 
      description: "Venta rápida. Si no encuentra el nombre exacto, busca el más parecido.", 
      inputSchema: { 
        type: "object", 
        properties: { item: { type: "string" }, cantidad: { type: "number" }, sucursal_id: { type: "string" } }, 
        required: ["item", "cantidad", "sucursal_id"] 
      } 
    },
    { 
      name: "vista_dashboard", 
      description: "Muestra estado de turnos, mantenimiento y stock por sucursal.", 
      inputSchema: { 
        type: "object", 
        properties: { sucursal_id: { type: "string" }, rol: { type: "string" } }, 
        required: ["sucursal_id", "rol"] 
      } 
    },
    { 
      name: "crear_reserva_premium", 
      description: "Reserva con combo y datos de cumple.", 
      inputSchema: { 
        type: "object", 
        properties: { turno_id: { type: "number" }, cliente_nombre: { type: "string" }, cumpleanos: { type: "string" }, item_buffet: { type: "string" }, cantidad_buffet: { type: "number" }, precio_item: { type: "number" } }, 
        required: ["turno_id", "cliente_nombre"] 
      } 
    },
    // 🔥 NUEVA HERRAMIENTA: EL ABRE-CANCHAS AUTOMÁTICO 🔥
    {
      name: "abrir_agenda_semanal",
      description: "Genera automáticamente todos los turnos libres para los próximos 7 días en una sucursal específica, dentro del rango de horas indicado.",
      inputSchema: {
        type: "object",
        properties: {
          sucursal_id: { type: "string", description: "Ej: lanus o belgrano" },
          hora_inicio: { type: "number", description: "Hora en la que abre el complejo (ej: 18)" },
          hora_fin: { type: "number", description: "Última hora de turno (ej: 23)" }
        },
        required: ["sucursal_id", "hora_inicio", "hora_fin"]
      }
    },
    // 📊 CIERRE DE CAJA AUTOMÁTICO
    {
      name: "cierre_caja",
      description: "Calcula el balance del día: ingresos, egresos y ganancia neta por sucursal.",
      inputSchema: {
        type: "object",
        properties: {
          sucursal_id: { type: "string", description: "lanus o belgrano" },
          fecha: { type: "string", description: "Fecha YYYY-MM-DD. Por defecto hoy." }
        },
        required: ["sucursal_id"]
      }
    },
    // 💳 REVISAR PAGOS PENDIENTES
    {
      name: "check_pagos_pendientes",
      description: "Revisa reservas con pago pendiente y genera recordatorios.",
      inputSchema: {
        type: "object",
        properties: {
          sucursal_id: { type: "string", description: "lanus, belgrano, o ambas" }
        },
        required: []
      }
    },
    // 🎂 CUMPLEAÑEROS DEL DÍA
    {
      name: "check_cumpleanios",
      description: "Detecta clientes que cumplen años hoy y genera mensajes de WhatsApp con regalo.",
      inputSchema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    // 📦 STOCK CRÍTICO
    {
      name: "check_stock_critico",
      description: "Detecta productos del buffet por debajo del mínimo (10 unidades) y emite alertas.",
      inputSchema: {
        type: "object",
        properties: {
          sucursal_id: { type: "string", description: "lanus, belgrano, o ambas" },
          umbral: { type: "number", description: "Mínimo de unidades (por defecto 10)" }
        },
        required: []
      }
    }
  ]
}));

// 3. LÓGICA DE EJECUCIÓN
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // --- AGENDA SEMANAL AUTOMÁTICA ---
    if (name === "abrir_agenda_semanal") {
      // 1. Buscamos todas las canchas de la sucursal
      const { data: canchas, error: errCanchas } = await supabase.from('canchas').select('id, nombre').ilike('sucursal_id', args.sucursal_id);
      if (errCanchas || !canchas || canchas.length === 0) throw new Error(`No encontré canchas para la sede ${args.sucursal_id}.`);

      const nuevosTurnos = [];
      const fechaBase = new Date();

      // 2. Armamos la grilla para los próximos 7 días
      for (let dia = 0; dia < 7; dia++) {
        const fechaActual = new Date(fechaBase);
        fechaActual.setDate(fechaBase.getDate() + dia);
        const fechaStr = fechaActual.toISOString().split('T')[0]; // Formato YYYY-MM-DD

        // 3. Generamos los horarios para cada día
        for (let h = args.hora_inicio; h <= args.hora_fin; h++) {
          const horaStr = `${h.toString().padStart(2, '0')}:00`; // Formato HH:00
          
          for (const cancha of canchas) {
            nuevosTurnos.push({
              cancha_id: cancha.id,
              fecha: fechaStr,
              hora: horaStr,
              reservado: false,
              cliente_nombre: null
            });
          }
        }
      }

      // 4. Inyectamos todo el paquete en la base de datos de un solo golpe
      const { error: errInsert } = await supabase.from('turnos').insert(nuevosTurnos);
      if (errInsert) throw new Error("Error de Supabase: " + errInsert.message);

      return { content: [{ type: "text", text: `✅ ¡GOLAZO! Agenda generada con éxito. Creé ${nuevosTurnos.length} turnos disponibles para los próximos 7 días en ${args.sucursal_id.toUpperCase()}, desde las ${args.hora_inicio}:00 hasta las ${args.hora_fin}:00 hs.` }] };
    }

    // --- POS BUFFET CON BÚSQUEDA INTELIGENTE ---
    if (name === "pos_venta_buffet") {
      const { data: todos, error: e1 } = await supabase.from('stock').select('*').ilike('sucursal', `%${args.sucursal_id}%`);
      if (e1 || !todos || todos.length === 0) throw new Error(`No hay stock para la sede ${args.sucursal_id}.`);

      const buscado = args.item.toLowerCase().trim();
      const prod = todos.find(p => p.item.toLowerCase().includes(buscado) || buscado.includes(p.item.toLowerCase()));
      
      if (!prod) {
        const disponibles = todos.map(p => p.item).join(", ");
        throw new Error(`No encontré '${args.item}'. Disponibles en ${args.sucursal_id}: ${disponibles}`);
      }
      if (prod.cantidad < args.cantidad) throw new Error(`Stock insuficiente de ${prod.item}. Quedan ${prod.cantidad}.`);

      await supabase.from('stock').update({ cantidad: prod.cantidad - args.cantidad }).eq('id', prod.id);
      const total = (prod.precio_venta || 0) * args.cantidad;
      await supabase.from('gastos').insert([{ sucursal: args.sucursal_id, concepto: `Venta Buffet: ${prod.item} x${args.cantidad}`, monto: -total }]);

      return { content: [{ type: "text", text: `✅ ¡GOL! Vendido: ${prod.item} x${args.cantidad}. Total: $${total}.` }] };
    }

    // --- VISTA DASHBOARD ---
    if (name === "vista_dashboard") {
      const { data: canchas } = await supabase.from('canchas').select('*, turnos(*)').ilike('sucursal_id', args.sucursal_id);
      const { data: stock } = await supabase.from('stock').select('*').ilike('sucursal', args.sucursal_id);

      let res = `🏟️ DASHBOARD: ${args.sucursal_id.toUpperCase()}\n--------------------------------\n`;
      canchas.forEach(c => {
        const libres = (c.turnos || []).filter(t => !t.reservado).length;
        res += `📍 ${c.nombre}: ${libres} libres | Uso: ${c.horas_uso || 0}/50hs ${ (c.horas_uso || 0) >= 45 ? '🚨' : '✅' }\n`;
      });
      const alertas = (stock || []).filter(s => s.cantidad < 5).map(s => `${s.item} (${s.cantidad})`);
      res += `\n📦 ALERTAS STOCK: ${alertas.length > 0 ? alertas.join(', ') : 'Todo OK'}`;
      return { content: [{ type: "text", text: res }] };
    }

    // --- RESERVA PREMIUM ---
    if (name === "crear_reserva_premium") {
      const { data: t } = await supabase.from('turnos').select('*, canchas(*)').eq('id', args.turno_id).single();
      const { data: res } = await supabase.from('reservas').insert([{ cancha_id: t.canchas.id, cliente_nombre: args.cliente_nombre, notas: args.cumpleanos ? `Cumple: ${args.cumpleanos}` : "" }]).select().single();
      
      const pref = new Preference(client);
      const items = [{ title: `Turno ${t.hora} - ${t.canchas.nombre}`, quantity: 1, unit_price: Number(t.canchas.precio), currency_id: 'ARS' }];
      if (args.item_buffet) items.push({ title: args.item_buffet, quantity: args.cantidad_buffet || 1, unit_price: args.precio_item || 0, currency_id: 'ARS' });
      
      const resp = await pref.create({ body: { items, external_reference: res.id.toString(), back_urls: { success: "https://www.mercadopago.com.ar" }, auto_return: "approved" } });
      await supabase.from('turnos').update({ reservado: true, cliente_nombre: args.cliente_nombre }).eq('id', args.turno_id);
      
      return { content: [{ type: "text", text: `🔗 Link de pago generado: ${resp.init_point}` }] };
    }

    // --- CIERRE DE CAJA ---
    if (name === "cierre_caja") {
      const fecha = args.fecha || new Date().toISOString().split('T')[0];
      const sucursales = args.sucursal_id === 'ambas' ? ['lanus', 'belgrano'] : [args.sucursal_id];
      let reporte = `📊 CIERRE DE CAJA — ${fecha}\n${'═'.repeat(30)}\n`;
      let totalNeto = 0;

      for (const suc of sucursales) {
        const { data: gastos } = await supabase.from('gastos').select('*').ilike('sucursal', `%${suc}%`).gte('created_at', fecha);
        const { data: turnos } = await supabase.from('turnos').select('*, canchas(sucursal_id)').eq('fecha', fecha).eq('reservado', true);
        const turnosSuc = (turnos || []).filter(t => t.canchas?.sucursal_id?.toLowerCase().includes(suc));
        const ingresos = (gastos || []).filter(g => g.monto < 0).reduce((s, g) => s + Math.abs(g.monto), 0);
        const egresos  = (gastos || []).filter(g => g.monto > 0).reduce((s, g) => s + g.monto, 0);
        const neto = ingresos - egresos;
        totalNeto += neto;
        reporte += `\n🏟️ ${suc.toUpperCase()}\n  💰 Ingresos: $${ingresos.toLocaleString('es-AR')}\n  💸 Egresos:  $${egresos.toLocaleString('es-AR')}\n  💵 Neto:     $${neto.toLocaleString('es-AR')}\n  🏟️ Reservas: ${turnosSuc.length}\n`;
      }

      reporte += `\n${'─'.repeat(30)}\n🏆 GANANCIA NETA TOTAL: $${totalNeto.toLocaleString('es-AR')}`;
      return { content: [{ type: "text", text: reporte }] };
    }

    // --- CHECK PAGOS PENDIENTES ---
    if (name === "check_pagos_pendientes") {
      const { data: pendientes } = await supabase
        .from('reservas')
        .select('cliente_nombre, created_at, canchas(nombre)')
        .or('estado_pago.eq.pendiente,estado_pago.is.null')
        .not('cliente_nombre', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!pendientes?.length) return { content: [{ type: "text", text: "✅ ¡Todo pago, crack! No hay reservas pendientes." }] };

      const lista = pendientes.map(r => `• ${r.cliente_nombre} — ${r.canchas?.nombre || 'Cancha'}`).join('\n');
      const msg = `💳 PAGOS PENDIENTES (${pendientes.length}):\n\n${lista}\n\n⚡ Acción: Contactar a cada cliente con el link de Mercado Pago.`;
      return { content: [{ type: "text", text: msg }] };
    }

    // --- CHECK CUMPLEAÑEROS ---
    if (name === "check_cumpleanios") {
      const hoy = new Date();
      const sufijo = `-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

      const { data: clientes } = await supabase
        .from('reservas')
        .select('cliente_nombre, cumpleanios')
        .not('cumpleanios', 'is', null)
        .limit(500);

      const seen = new Set();
      const cumpleaneros = (clientes || []).filter(c => {
        if (!c.cumpleanios || seen.has(c.cliente_nombre)) return false;
        const match = String(c.cumpleanios).endsWith(sufijo);
        if (match) seen.add(c.cliente_nombre);
        return match;
      });

      if (!cumpleaneros.length) return { content: [{ type: "text", text: "No hay cumpleañeros registrados para hoy." }] };

      const msgs = cumpleaneros.map(c => {
        const waMsg = encodeURIComponent(`¡Hola ${c.cliente_nombre}! ⚽ Acá Nico de CanchaOS. ¡Muy feliz cumpleaños crack! 🎂 Tenés un Gatorade gratis o un 10% OFF en tu próxima reserva.`);
        return `🎂 ${c.cliente_nombre}\nhttps://wa.me/?text=${waMsg}`;
      }).join('\n\n');

      return { content: [{ type: "text", text: `🎂 CUMPLEAÑEROS DE HOY:\n\n${msgs}` }] };
    }

    // --- CHECK STOCK CRÍTICO ---
    if (name === "check_stock_critico") {
      const umbral = args.umbral || 10;
      const sucursales = args.sucursal_id && args.sucursal_id !== 'ambas'
        ? [args.sucursal_id] : ['lanus', 'belgrano'];

      let alertas = [];
      for (const suc of sucursales) {
        const { data: stock } = await supabase.from('stock').select('*').ilike('sucursal', `%${suc}%`);
        const criticos = (stock || []).filter(s => s.cantidad < umbral);
        alertas = alertas.concat(criticos.map(s => `⚠️ [${suc.toUpperCase()}] ${s.item}: ${s.cantidad} unidades`));
      }

      if (!alertas.length) return { content: [{ type: "text", text: `✅ Stock OK en todas las sedes. Todo por encima de ${umbral} unidades.` }] };

      return { content: [{ type: "text", text: `📦 STOCK CRÍTICO:\n\n${alertas.join('\n')}\n\n🚨 Avisá a Ariel para reponer stock.` }] };
    }

  } catch (e) { return { content: [{ type: "text", text: "❌ Error: " + e.message }] }; }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch(console.error);