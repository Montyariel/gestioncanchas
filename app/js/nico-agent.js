// ============================================================
// NICO AGENT 24/7 — SPORTPLEX CEREBRO OPERATIVO
// Motor autónomo de tareas programadas y detección de alertas
// ============================================================

const NicoAgent = {

  // ---- Estado interno del agente ----
  _alerts: [],          // Alertas activas pendientes de revisión
  _lastRun: {},         // Timestamps de la última ejecución por tarea
  _intervalsActive: [], // Referencias a intervals para cleanup
  _initialized: false,

  // ============================================================
  // INICIALIZACIÓN PRINCIPAL
  // ============================================================
  async init() {
    if (this._initialized) return;
    this._initialized = true;

    console.log('[NicoAgent] 🤖 Iniciando protocolo 24/7...');

    // Tareas de arranque inmediato (al cargar la app)
    await this._runStartupChecks();

    // ---- SCHEDULER: Tareas recurrentes ----

    // Cada 6 horas → revisar pagos pendientes
    this._scheduleTask('pagos_pendientes', 6 * 60 * 60 * 1000, async () => {
      await this.checkPagosPendientes();
    });

    // Cada hora → monitoreo de stock crítico
    this._scheduleTask('stock_critico', 60 * 60 * 1000, async () => {
      await this.checkStockCritico();
    });

    // Cada 24 horas → cumpleaños del día
    this._scheduleTask('cumpleanios', 24 * 60 * 60 * 1000, async () => {
      await this.checkCumpleanios();
    });

    // Cada día a las 23:59 → cierre de caja
    this._scheduleDailyAt(23, 59, async () => {
      await this.cierreCaja();
    });

    // Cada lunes a las 08:00 → apertura de agenda semanal
    this._scheduleWeeklyOn(1, 8, 0, async () => {
      await this.aperturaAgendaSemanal();
    });

    // Cada 30 min → análisis de ocupación y Happy Hour
    this._scheduleTask('ocupacion', 30 * 60 * 1000, async () => {
      await this.checkOcupacion();
    });

    // Domingos a las 21:00 → resumen ejecutivo semanal
    this._scheduleWeeklyOn(0, 21, 0, async () => {
      await this.resumenEjecutivoSemanal();
    });

    console.log('[NicoAgent] ✅ Todos los schedulers activos.');
  },

  // ============================================================
  // STARTUP: Chequeos inmediatos al cargar la app
  // ============================================================
  async _runStartupChecks() {
    // Ejecutar en paralelo para no bloquear el arranque
    try {
      const [, , ,] = await Promise.allSettled([
        this.checkCumpleanios(true),
        this.checkStockCritico(true),
        this.checkPagosPendientes(true),
        this.checkOcupacion(true),
      ]);
    } catch (e) {
      console.error('[NicoAgent] Error en startup checks:', e);
    }
  },

  // ============================================================
  // ÁREA 1: AGENDA — APERTURA AUTOMÁTICA SEMANAL
  // Todos los lunes a las 08:00, genera la agenda de la semana siguiente
  // ============================================================
  async aperturaAgendaSemanal() {
    console.log('[NicoAgent] 📅 Ejecutando apertura semanal de agenda...');
    const sucursales = ['lanus'];
    const resultados = [];

    for (const sucursal of sucursales) {
      try {
        const canchas = await DB.getCanchas(sucursal);
        if (!canchas.length) continue;

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

        const { createClient } = window.supabase || {};
        // Usar el cliente global db (definido en supabase-client.js)
        await db.from('turnos').upsert(turnos, { onConflict: 'cancha_id,fecha,hora', ignoreDuplicates: true });

        resultados.push(`✅ ${sucursal.toUpperCase()}: ${turnos.length} turnos generados`);
      } catch (e) {
        resultados.push(`❌ ${sucursal.toUpperCase()}: Error — ${e.message}`);
      }
    }

    this._pushAlert({
      tipo: 'agenda',
      icono: '📅',
      titulo: 'Apertura semanal ejecutada',
      detalle: resultados.join('\n'),
      prioridad: 'info',
      timestamp: new Date()
    });

    this._showToast('📅 ¡Agenda semanal generada para Lanús y Belgrano! 🔥', 'success');
  },

  // ============================================================
  // ÁREA 1: PAGOS PENDIENTES — Cada 6 horas
  // ============================================================
  async checkPagosPendientes(silencioso = false) {
    try {
      // Buscar reservas con estado_pago = 'pendiente' o sin pago
      const { data: pendientes, error } = await db
        .from('reservas')
        .select('*, canchas(nombre, sucursal_id)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !pendientes) return;

      const conNombre = pendientes.filter(r => r.cliente_nombre && (r.estado_pago === 'pendiente' || !r.estado_pago));
      if (!conNombre.length) return;

      this._pushAlert({
        tipo: 'pagos',
        icono: '💳',
        titulo: `${conNombre.length} pago${conNombre.length > 1 ? 's' : ''} pendiente${conNombre.length > 1 ? 's' : ''}`,
        detalle: conNombre.slice(0, 3).map(r =>
          `• ${r.cliente_nombre} — ${r.canchas?.nombre || 'Cancha'}`
        ).join('\n') + (conNombre.length > 3 ? `\n  ...y ${conNombre.length - 3} más` : ''),
        prioridad: 'warning',
        timestamp: new Date(),
        accion: { label: 'Ver Reservas', vista: 'reservas' }
      });

      if (!silencioso) {
        this._showToast(`💳 ¡${conNombre.length} pagos pendientes detectados! Revisá Reservas.`, 'warning');
      }
    } catch (e) {
      console.error('[NicoAgent] checkPagosPendientes error:', e);
    }
  },

  // ============================================================
  // ÁREA 2: STOCK CRÍTICO — Monitoreo continuo
  // ============================================================
  async checkStockCritico(silencioso = false) {
    try {
      const sucursales = ['lanus'];
      let alertasTotal = [];

      for (const sucursal of sucursales) {
        const stock = await DB.getStock(sucursal);
        const criticos = stock.filter(s => s.cantidad < 10);
        alertasTotal = alertasTotal.concat(criticos.map(s => ({ ...s, sucursal })));
      }

      // Actualizar badge en sidebar
      const badge = document.getElementById('badge-stock');
      if (badge) {
        badge.style.display = alertasTotal.length > 0 ? 'inline-flex' : 'none';
      }

      if (!alertasTotal.length) return;

      this._pushAlert({
        tipo: 'stock',
        icono: '📦',
        titulo: `Stock crítico: ${alertasTotal.length} producto${alertasTotal.length > 1 ? 's' : ''}`,
        detalle: alertasTotal.slice(0, 5).map(s =>
          `• ${s.item} — ${s.cantidad} unid. (${s.sucursal?.toUpperCase()})`
        ).join('\n'),
        prioridad: alertasTotal.some(s => s.cantidad < 3) ? 'critical' : 'warning',
        timestamp: new Date(),
        accion: { label: 'Ver Buffet', vista: 'buffet' }
      });

      if (!silencioso && alertasTotal.length > 0) {
        this._showToast(`📦 Stock crítico: ${alertasTotal.map(s => s.item).join(', ')}`, 'error');
      }
    } catch (e) {
      console.error('[NicoAgent] checkStockCritico error:', e);
    }
  },

  // ============================================================
  // ÁREA 3: CUMPLEAÑOS — Diariamente a las 09:00
  // ============================================================
  async checkCumpleanios(silencioso = false) {
    try {
      const hoy = new Date();
      const mesHoy = String(hoy.getMonth() + 1).padStart(2, '0');
      const diaHoy = String(hoy.getDate()).padStart(2, '0');
      const sufijo = `-${mesHoy}-${diaHoy}`;

      const { data: clientes, error } = await db
        .from('reservas')
        .select('cliente_nombre, cumpleanios')
        .not('cumpleanios', 'is', null)
        .limit(500);

      if (error || !clientes) return;

      // Agrupar cumpleañeros únicos por nombre
      const seen = new Set();
      const cumpleaneros = clientes.filter(c => {
        if (!c.cumpleanios || seen.has(c.cliente_nombre)) return false;
        const cumple = String(c.cumpleanios);
        const match = cumple.endsWith(sufijo) || cumple.includes(sufijo);
        if (match) seen.add(c.cliente_nombre);
        return match;
      });

      if (!cumpleaneros.length) return;

      this._pushAlert({
        tipo: 'cumpleanios',
        icono: '🎂',
        titulo: `¡${cumpleaneros.length} cumpleaño${cumpleaneros.length > 1 ? 's' : ''} hoy!`,
        detalle: cumpleaneros.map(c =>
          `🎁 ${c.cliente_nombre}`
        ).join('\n'),
        prioridad: 'festivo',
        timestamp: new Date(),
        cumpleaneros: cumpleaneros
      });

      if (!silencioso) {
        this._showToast(
          `🎂 ¡${cumpleaneros.map(c => c.cliente_nombre).join(', ')} cumple hoy! Mandales la promo. 🎉`,
          'success'
        );
      }
    } catch (e) {
      console.error('[NicoAgent] checkCumpleanios error:', e);
    }
  },

  // ============================================================
  // ÁREA 3: RANKING VIP — Goleadores
  // ============================================================
  async checkGoleadoresVip() {
    try {
      const sucursales = ['lanus'];
      const vips = [];

      for (const sucursal of sucursales) {
        const goleadores = await DB.getGoleadores(sucursal);
        const superVips = goleadores.filter(g => g.partidos >= 10);
        vips.push(...superVips.map(g => ({ ...g, sucursal })));
      }

      if (!vips.length) return null;
      return vips;
    } catch (e) {
      console.error('[NicoAgent] checkGoleadoresVip error:', e);
      return null;
    }
  },

  // ============================================================
  // ÁREA 4: CIERRE DE CAJA — Diariamente a las 23:59
  // ============================================================
  async cierreCaja() {
    const fecha = fmt.dateISO();
    try {
      const sucursales = ['lanus'];
      let reporteTexto = `📊 CIERRE DE CAJA — ${fecha}\n${'═'.repeat(30)}\n`;
      let totalNeto = 0;

      for (const sucursal of sucursales) {
        const m = await DB.getMetrics(sucursal, fecha);
        const neto = m.ingresos - m.egresos;
        totalNeto += neto;
        reporteTexto += `\n🏟️ ${sucursal.toUpperCase()}\n`;
        reporteTexto += `  💰 Ingresos:  ${fmt.money(m.ingresos)}\n`;
        reporteTexto += `  💸 Egresos:   ${fmt.money(m.egresos)}\n`;
        reporteTexto += `  💵 Neto:      ${fmt.money(neto)}\n`;
        reporteTexto += `  🏟️ Ocupación: ${m.ocupacion}% (${m.ocupados}/${m.ocupados + m.libres})\n`;
      }

      reporteTexto += `\n${'─'.repeat(30)}\n`;
      reporteTexto += `🏆 GANANCIA NETA TOTAL: ${fmt.money(totalNeto)}\n`;

      this._pushAlert({
        tipo: 'cierre',
        icono: '📊',
        titulo: `Cierre de caja — ${fecha}`,
        detalle: reporteTexto,
        prioridad: totalNeto >= 0 ? 'info' : 'warning',
        timestamp: new Date()
      });

      this._showToast(`📊 Cierre de caja listo. Ganancia neta: ${fmt.money(totalNeto)} 🔥`, 'success');
    } catch (e) {
      console.error('[NicoAgent] cierreCaja error:', e);
    }
  },

  // ============================================================
  // ÁREA 4: OCUPACIÓN / DETECCIÓN ANOMALÍAS
  // ============================================================
  async checkOcupacion(silencioso = false) {
    try {
      const fecha = fmt.dateISO();
      const sucursal = (typeof App !== 'undefined') ? App.state.sucursal : 'lanus';
      const turnos = await DB.getTurnos(sucursal, fecha);
      if (!turnos.length) return;

      const libres = turnos.filter(t => !t.reservado);
      const pct = Math.round(((turnos.length - libres.length) / turnos.length) * 100);

      // Si hay canchas sin ninguna reserva para mañana, alertar
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      const mananaStr = manana.toISOString().split('T')[0];
      const turnosManana = await DB.getTurnos(sucursal, mananaStr);
      const reservasManana = turnosManana.filter(t => t.reservado).length;

      if (reservasManana === 0 && turnosManana.length > 0) {
        this._pushAlert({
          tipo: 'ocupacion',
          icono: '⚡',
          titulo: '¡Mañana sin reservas!',
          detalle: `${sucursal.toUpperCase()} no tiene ninguna reserva para mañana. Activá una promo de Hora Feliz.`,
          prioridad: 'warning',
          timestamp: new Date(),
          accion: { label: 'Ver Agenda', vista: 'agenda' }
        });

        if (!silencioso) {
          this._showToast('⚡ Mañana sin reservas. ¿Activamos Happy Hour?', 'warning');
        }
      }
    } catch (e) {
      console.error('[NicoAgent] checkOcupacion error:', e);
    }
  },

  // ============================================================
  // DETECCIÓN DE ANOMALÍAS — Reserva en horario bloqueado / gasto inusual
  // ============================================================
  detectarAnomalia(tipo, datos) {
    let mensaje = '';
    switch (tipo) {
      case 'gasto_inusual':
        if (datos.monto > 100000) {
          mensaje = `⚠️ Gasto inusual detectado: ${fmt.money(datos.monto)} — "${datos.concepto}". Revisalo.`;
          this._pushAlert({
            tipo: 'anomalia',
            icono: '🚨',
            titulo: 'Gasto inusual detectado',
            detalle: `Monto: ${fmt.money(datos.monto)}\nConcepto: ${datos.concepto}`,
            prioridad: 'critical',
            timestamp: new Date()
          });
          this._showToast(mensaje, 'error');
        }
        break;
      case 'horario_bloqueado':
        mensaje = `⛔ Intento de reserva en horario bloqueado: ${datos.hora} — ${datos.cancha}`;
        this._pushAlert({
          tipo: 'anomalia',
          icono: '⛔',
          titulo: 'Reserva en horario bloqueado',
          detalle: mensaje,
          prioridad: 'critical',
          timestamp: new Date()
        });
        this._showToast(mensaje, 'error');
        break;
    }
  },

  // ============================================================
  // RESUMEN EJECUTIVO DOMINICAL (Domingos 21:00)
  // ============================================================
  async resumenEjecutivoSemanal() {
    try {
      const reporte = await NicoAnalytics.reporteEjecutivoSemanal();
      const { lanus, belgrano } = reporte.financiero;
      const ganador = reporte.financiero.comparativa?.ganadorSemana || '—';
      const totalSistema = reporte.financiero.comparativa?.totalSistema || 0;

      const resumen = `📊 RESUMEN SEMANAL — CanchaOS\n${'═'.repeat(28)}\n` +
        `🏆 Ganador de la semana: ${ganador}\n` +
        `💵 Total sistema: ${fmt.money(totalSistema)}\n\n` +
        `🏟️ LANÚS: ${fmt.money(lanus?.netoTotal || 0)}\n` +
        `🏟️ BELGRANO: ${fmt.money(belgrano?.netoTotal || 0)}`;

      this._pushAlert({
        tipo: 'resumen_semanal',
        icono: '📊',
        titulo: 'Resumen ejecutivo semanal',
        detalle: resumen,
        prioridad: 'info',
        timestamp: new Date(),
        accion: { label: 'Ver Reportes', vista: 'reportes' }
      });

      this._showToast(`📊 Resumen semanal listo. Total sistema: ${fmt.money(totalSistema)} 🔥`, 'success');
    } catch (e) {
      console.error('[NicoAgent] resumenEjecutivoSemanal error:', e);
    }
  },

  // ============================================================
  // UTILIDADES INTERNAS
  // ============================================================

  // Registrar alerta en el panel de Nico
  _pushAlert(alert) {
    // Evitar duplicados del mismo tipo en la misma hora
    const ahora = Date.now();
    const recent = this._alerts.find(a =>
      a.tipo === alert.tipo &&
      ahora - new Date(a.timestamp).getTime() < 30 * 60 * 1000
    );
    if (recent) return;

    this._alerts.unshift(alert);
    if (this._alerts.length > 50) this._alerts.pop();

    // Actualizar el badge del panel de alertas
    this._updateAlertBadge();

    // Notificar al panel si está abierto
    if (typeof NicoPanel !== 'undefined') {
      NicoPanel.refresh();
    }
  },

  _updateAlertBadge() {
    const badge = document.getElementById('nico-alert-badge');
    if (!badge) return;
    const count = this._alerts.length;
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  },

  _showToast(msg, type = 'info') {
    if (typeof App !== 'undefined' && App.toast) {
      App.toast(msg, type);
    }
  },

  // Scheduler genérico por intervalo
  _scheduleTask(name, intervalMs, fn) {
    // Ejecutar la primera vez con pequeño delay para no bloquear startup
    const timeout = setTimeout(async () => {
      try { await fn(); } catch (e) { console.error(`[NicoAgent] Task ${name} error:`, e); }
    }, 5000);

    const interval = setInterval(async () => {
      try { await fn(); } catch (e) { console.error(`[NicoAgent] Task ${name} error:`, e); }
    }, intervalMs);

    this._intervalsActive.push(interval);
    console.log(`[NicoAgent] ⏰ Scheduler "${name}" activo (cada ${Math.round(intervalMs / 60000)} min)`);
  },

  // Scheduler diario a una hora específica
  _scheduleDailyAt(hour, minute, fn) {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === hour && now.getMinutes() === minute) {
        const key = `daily_${hour}_${minute}_${fmt.dateISO()}`;
        if (!this._lastRun[key]) {
          this._lastRun[key] = true;
          fn().catch(e => console.error('[NicoAgent] Daily task error:', e));
        }
      }
    };
    const interval = setInterval(checkTime, 60000);
    this._intervalsActive.push(interval);
    console.log(`[NicoAgent] ⏰ Scheduler diario activo (${hour}:${String(minute).padStart(2, '0')})`);
  },

  // Scheduler semanal (dayOfWeek: 0=Dom, 1=Lun, ...)
  _scheduleWeeklyOn(dayOfWeek, hour, minute, fn) {
    const checkTime = () => {
      const now = new Date();
      if (now.getDay() === dayOfWeek && now.getHours() === hour && now.getMinutes() === minute) {
        const key = `weekly_${dayOfWeek}_${hour}_${minute}_${fmt.dateISO()}`;
        if (!this._lastRun[key]) {
          this._lastRun[key] = true;
          fn().catch(e => console.error('[NicoAgent] Weekly task error:', e));
        }
      }
    };
    const interval = setInterval(checkTime, 60000);
    this._intervalsActive.push(interval);
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    console.log(`[NicoAgent] ⏰ Scheduler semanal activo (${dias[dayOfWeek]} ${hour}:${String(minute).padStart(2, '0')})`);
  },

  // Detener todos los schedulers (útil para testing)
  destroy() {
    this._intervalsActive.forEach(i => clearInterval(i));
    this._intervalsActive = [];
    this._initialized = false;
    console.log('[NicoAgent] ⛔ Todos los schedulers detenidos.');
  }
};

// ============================================================
// NICO PANEL — UI de alertas y estado del agente
// ============================================================
const NicoPanel = {
  _open: false,

  toggle() {
    this._open = !this._open;
    const panel = document.getElementById('nico-panel');
    if (!panel) return;
    if (this._open) {
      panel.classList.remove('hidden', 'opacity-0', 'translate-y-4');
      this.refresh();
    } else {
      panel.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => panel.classList.add('hidden'), 300);
    }
  },

  refresh() {
    const container = document.getElementById('nico-panel-body');
    if (!container) return;
    const alerts = NicoAgent._alerts;

    if (!alerts.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#8e9379">
          <div style="font-size:36px;margin-bottom:10px">✅</div>
          <div style="font-size:14px;font-weight:600;color:#c4c9ac">Todo bajo control</div>
          <div style="font-size:12px;margin-top:4px">Nico está monitoreando en tiempo real</div>
        </div>`;
      return;
    }

    const prioColors = {
      critical: { bg: 'rgba(255,180,171,.1)', border: '#ffb4ab', text: '#ffb4ab' },
      warning: { bg: 'rgba(245,158,11,.1)', border: '#f59e0b', text: '#f59e0b' },
      festivo: { bg: 'rgba(195,244,0,.08)', border: '#c3f400', text: '#c3f400' },
      info: { bg: 'rgba(189,244,255,.08)', border: '#bdf4ff', text: '#bdf4ff' },
    };

    container.innerHTML = alerts.map(a => {
      const c = prioColors[a.prioridad] || prioColors.info;
      const time = new Date(a.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const detailSafe = (a.detalle || '').replace(/</g, '&lt;').replace(/\n/g, '<br>');

      let accionBtn = '';
      if (a.accion) {
        accionBtn = `<button onclick="App.navigate('${a.accion.vista}'); NicoPanel.toggle();"
          style="margin-top:8px;padding:5px 12px;border-radius:6px;background:${c.text};color:#161e00;font-size:11px;font-weight:700;cursor:pointer;border:none">
          ${a.accion.label} →
        </button>`;
      }

      // Botón especial para cumpleañeros
      let cumpleLinks = '';
      if (a.tipo === 'cumpleanios' && a.cumpleaneros?.length) {
        cumpleLinks = a.cumpleaneros.slice(0, 3).map(c =>
          `<a href="https://wa.me/?text=${encodeURIComponent(`¡Hola ${c.cliente_nombre}! ⚽ Acá Nico de CanchaOS. ¡Muy feliz cumpleaños crack! 🎂 Tenés un Gatorade gratis o un 10% OFF en tu próxima reserva. ¡Avisame cuándo venís!`)}"
            target="_blank"
            style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;padding:4px 10px;border-radius:6px;background:rgba(195,244,0,.15);color:#c3f400;font-size:11px;font-weight:700;text-decoration:none">
            📱 WA ${c.cliente_nombre}
          </a>`
        ).join(' ');
      }

      return `
        <div style="background:${c.bg};border:1px solid ${c.border};border-radius:10px;padding:12px 14px;margin-bottom:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;font-weight:700;color:${c.text}">${a.icono} ${a.titulo}</span>
            <span style="font-size:10px;color:#8e9379">${time}</span>
          </div>
          <div style="font-size:12px;color:#c4c9ac;line-height:1.6">${detailSafe}</div>
          ${cumpleLinks}
          ${accionBtn}
        </div>`;
    }).join('');
  }
};
