// ============================================================
// NICO CHAT v2.0 — Chat inteligente conectado al agente 24/7
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const chatBtn      = document.getElementById('nicoChatBtn');
  const chatWindow   = document.getElementById('nicoChatWindow');
  const closeBtn     = document.getElementById('nicoChatCloseBtn');
  const sendBtn      = document.getElementById('nicoChatSendBtn');
  const input        = document.getElementById('nicoChatInput');
  const messages     = document.getElementById('nicoChatMessages');

  // ============================================================
  // TOGGLE CHAT
  // ============================================================
  const toggleChat = () => {
    if (chatWindow.classList.contains('hidden')) {
      chatWindow.classList.remove('hidden');
      setTimeout(() => chatWindow.classList.remove('opacity-0', 'translate-y-4'), 10);
      input.focus();
    } else {
      chatWindow.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => chatWindow.classList.add('hidden'), 300);
    }
  };

  chatBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // ============================================================
  // RENDERIZADO DE MENSAJES
  // ============================================================
  const addMessage = (html, isUser = false) => {
    const wrap = document.createElement('div');
    wrap.className = `flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`;

    const bubble = document.createElement('div');
    bubble.className = `px-4 py-2.5 rounded-2xl text-sm max-w-[88%] leading-relaxed ${
      isUser
        ? 'bg-[#10B981] text-[#0B0F19] rounded-tr-sm font-medium'
        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
    }`;
    if (isUser) {
      bubble.textContent = html;
    } else {
      bubble.innerHTML = html;
    }
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  const addTypingIndicator = () => {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-1 items-start typing-wrap';
    wrap.innerHTML = `
      <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800 flex gap-1.5 items-center">
        <span style="width:7px;height:7px;border-radius:50%;background:#10B981;animation:nicoBounce .8s infinite"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#10B981;animation:nicoBounce .8s .15s infinite"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#10B981;animation:nicoBounce .8s .3s infinite"></span>
      </div>`;
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
    return wrap;
  };

  // Inyectar animación si no existe
  if (!document.getElementById('nico-anim-style')) {
    const s = document.createElement('style');
    s.id = 'nico-anim-style';
    s.textContent = `
      @keyframes nicoBounce {
        0%,100% { transform: translateY(0); opacity:.6; }
        50%      { transform: translateY(-5px); opacity:1; }
      }`;
    document.head.appendChild(s);
  }

  // ============================================================
  // QUICK ACTIONS — Botones de acceso rápido
  // ============================================================
  const quickActions = [
    { label: '📊 Reporte del día',   cmd: 'reporte del día' },
    { label: '🎂 Cumpleañeros',       cmd: 'cumpleaños de hoy' },
    { label: '📦 Stock crítico',      cmd: 'stock crítico' },
    { label: '⚡ Horarios libres',    cmd: 'horarios vacíos' },
    { label: '🏟️ Ranking canchas',   cmd: 'ranking de canchas' },
    { label: '👥 Clientes VIP',       cmd: 'clientes vip' },
    { label: '🌭 Análisis buffet',    cmd: 'análisis buffet' },
    { label: '📈 Comparativa sedes',  cmd: 'comparativa sedes' },
  ];

  const renderQuickActions = () => {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-wrap gap-2 px-1 quick-actions';
    quickActions.forEach(qa => {
      const btn = document.createElement('button');
      btn.className = 'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:scale-105';
      btn.style.cssText = 'border-color:#10B981;color:#10B981;background:rgba(16,185,129,.08)';
      btn.textContent = qa.label;
      btn.addEventListener('click', () => {
        input.value = qa.cmd;
        handleSend();
      });
      wrap.appendChild(btn);
    });
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  };

  // Mostrar quick actions al inicio
  renderQuickActions();

  // ============================================================
  // PROCESAMIENTO DE MENSAJES — Lógica de Nico
  // ============================================================
  const handleSend = async () => {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';

    // Eliminar quick actions al primer mensaje
    document.querySelectorAll('.quick-actions').forEach(el => el.remove());

    const typing = addTypingIndicator();

    // Contexto actual
    const sucursal = (typeof App !== 'undefined') ? App.state.sucursal : 'lanus';
    const hoy = fmt.dateISO(new Date());
    const lowerText = text.toLowerCase();

    let respuesta = '';

    try {
      // ---- 1. CUMPLEAÑOS ----
      if (/cumple|cumplea|cumpleanios|festejo/i.test(lowerText)) {
        await NicoAgent.checkCumpleanios(true);
        const alert = NicoAgent._alerts.find(a => a.tipo === 'cumpleanios');

        if (alert?.cumpleaneros?.length) {
          const links = alert.cumpleaneros.map(c => {
            const msg = encodeURIComponent(
              `¡Hola ${c.cliente_nombre}! ⚽ Acá Nico de CanchaControl. ¡Muy feliz cumpleaños crack! 🎂 Tenés un Gatorade gratis o un 10% OFF en tu próxima reserva. ¡Avisame cuándo venís!`
            );
            return `🎁 <strong>${c.cliente_nombre}</strong><br>
              <a href="https://wa.me/?text=${msg}" target="_blank" style="color:#10B981;font-weight:700">📱 Mandar WA</a>`;
          }).join('<br><br>');

          respuesta = `¡Revisé la base! Hoy tenemos <strong style="color:#10B981">${alert.cumpleaneros.length} cumpleañero${alert.cumpleaneros.length > 1 ? 's' : ''}</strong>:<br><br>${links}<br><br>⚽ ¡Mandales el regalito que se lo merecen!`;
        } else {
          respuesta = '¡No hay cumpleañeros registrados para hoy crack! Si querés agregar uno, usá el modal de reserva y completá la fecha de cumple. 🎂';
        }
      }

      // ---- 2. REPORTE / BALANCE / CIERRE ----
      else if (/reporte|cierre|balance|resumen|ventas|como viene|cuanto hicimos|ingreso/i.test(lowerText)) {
        const m = await DB.getMetrics(sucursal, hoy);
        const neto = m.ingresos - m.egresos;
        respuesta = `
          ¡Acá el reporte de <strong>${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}</strong> hoy! 📊<br><br>
          💰 <strong>Ingresos:</strong> ${fmt.money(m.ingresos)}<br>
          💸 <strong>Egresos:</strong> ${fmt.money(m.egresos)}<br>
          <strong style="color:#10B981;font-size:15px">💵 Ganancia Neta: ${fmt.money(neto)}</strong><br><br>
          🏟️ <strong>Ocupación:</strong> ${m.ocupacion}% (${m.ocupados} ocupados · ${m.libres} libres)<br>
          📦 <strong>Alertas stock:</strong> ${m.stockAlertas > 0 ? `<span style="color:#ffb4ab">${m.stockAlertas} productos críticos ⚠️</span>` : 'Todo OK ✅'}
        `;
      }

      // ---- 3. STOCK / BUFFET ----
      else if (/stock|buffet|bebida|producto|queda|inventario|crítico/i.test(lowerText)) {
        await NicoAgent.checkStockCritico(true);
        const stock = await DB.getStock(sucursal);
        const criticos = stock.filter(s => s.cantidad < 10);
        const ok = stock.filter(s => s.cantidad >= 10);

        if (criticos.length) {
          respuesta = `
            📦 <strong>Stock crítico en ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}:</strong><br><br>
            ${criticos.map(s =>
              `<span style="color:${s.cantidad < 3 ? '#ffb4ab' : '#f59e0b'}">⚠️ ${s.item}: ${s.cantidad} unidades</span>`
            ).join('<br>')}<br><br>
            <strong style="color:#10B981">Avisale a Ariel para reponer. ¡No podemos quedarnos sin stock en el partido! 🔥</strong>
          `;
        } else {
          respuesta = `✅ ¡Stock OK en ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}! Tenemos ${stock.length} productos bien abastecidos. ¡Listos para el partido! ⚽`;
        }
      }

      // ---- 4. HORARIOS LIBRES / BACHES / HAPPY HOUR ----
      else if (/libre|vacio|vacío|bache|promo|happy|horario.*libre|cancha.*libre|ocupaci/i.test(lowerText)) {
        const turnos = await DB.getTurnos(sucursal, hoy);
        const libres = turnos.filter(t => !t.reservado);
        const total = turnos.length || 1;
        const pct = Math.round(((total - libres.length) / total) * 100);

        if (libres.length > 0) {
          const slots = [...new Set(libres.slice(0,4).map(t => t.hora?.substring(0,5)))];
          respuesta = `
            Analicé la agenda de hoy. <strong style="color:#f59e0b">Ocupación: ${pct}%</strong><br><br>
            🕐 Horarios libres: <strong>${slots.join(', ')}</strong><br><br>
            💡 <strong>Estrategia Happy Hour propuesta:</strong><br>
            ${slots.map(h => `• <strong>${h}</strong>: Cancha + 6 Aguas al costo`).join('<br>')}<br><br>
            <button onclick="App.navigate('agenda'); document.getElementById('nicoChatCloseBtn').click();"
              style="margin-top:8px;padding:7px 16px;border-radius:8px;background:#10B981;color:#0B0F19;font-size:12px;font-weight:700;cursor:pointer;border:none">
              📅 Ver Agenda
            </button>
          `;
        } else {
          respuesta = `🔥 ¡Excelente crack! Estamos al <strong style="color:#10B981">100% de ocupación hoy</strong>. Sin baches. ¡A facturar! 🚀`;
        }
      }

      // ---- 5. PAGOS PENDIENTES ----
      else if (/pago|pendiente|cobro|cobrar|deuda|link.*pago/i.test(lowerText)) {
        await NicoAgent.checkPagosPendientes(true);
        const alert = NicoAgent._alerts.find(a => a.tipo === 'pagos');
        if (alert) {
          respuesta = `
            💳 <strong>Pagos pendientes detectados:</strong><br><br>
            ${(alert.detalle || '').replace(/\n/g, '<br>')}<br><br>
            <button onclick="App.navigate('reservas'); document.getElementById('nicoChatCloseBtn').click();"
              style="margin-top:8px;padding:7px 16px;border-radius:8px;background:#10B981;color:#0B0F19;font-size:12px;font-weight:700;cursor:pointer;border:none">
              💳 Ver Reservas
            </button>
          `;
        } else {
          respuesta = '✅ ¡Todo pago, crack! No hay reservas con pagos pendientes. ⚽';
        }
      }

      // ---- 6. REGISTRAR GASTO ----
      else if (/gasto|pagué|pague|gasté|gasté|sueldo|luz|internet|alquiler|compré|compramos/i.test(lowerText)) {
        const nums = text.match(/\d[\d.,]*/g);
        const raw = nums ? nums[0].replace(/[.,]/g, '') : null;
        const amount = raw ? parseInt(raw) : null;

        if (amount && amount > 0) {
          await DB.addGasto(sucursal, `Gasto registrado por Nico: "${text}"`, amount);
          if (amount > 100000) NicoAgent.detectarAnomalia('gasto_inusual', { monto: amount, concepto: text });
          respuesta = `
            ✅ ¡Listo! Registré el gasto de <strong style="color:#10B981">${fmt.money(amount)}</strong> en Finanzas.<br><br>
            ${amount > 100000
              ? '⚠️ <strong style="color:#f59e0b">Nota: Monto inusual detectado. Lo marqué para revisión.</strong>'
              : '💸 Todo bajo control, crack.'
            }
          `;
        } else {
          respuesta = `Crack, entendí que registraste un gasto pero no pude leer el monto. ¿Cuánto fue? Escribilo así: <em>"Pagué $15000 de luz"</em> 💡`;
        }
      }

      // ---- 7. VIPS / GOLEADORES ----
      else if (/vip|goleador|fiel|mejor cliente|top|ranking/i.test(lowerText)) {
        const vips = await NicoAgent.checkGoleadoresVip();
        if (vips?.length) {
          respuesta = `
            🏆 <strong>Top clientes VIP (más de 10 reservas):</strong><br><br>
            ${vips.slice(0,5).map((v, i) =>
              `<span style="color:#10B981">${['🥇','🥈','🥉','🏅','🏅'][i]}</span> ${v.nombre} — <strong>${v.partidos} partidos</strong> (${v.sucursal?.toUpperCase()})`
            ).join('<br>')}<br><br>
            💡 <strong>Propuesta:</strong> ¿Les ofrecemos un pack de aguas o 20% OFF en la próxima reserva? Son fenómenos que se lo merecen.
          `;
        } else {
          respuesta = `Todavía no hay clientes con más de 10 reservas registradas. ¡Dale que en cuanto lleguen te aviso! 🔥`;
        }
      }

      // ---- 8. APERTURA AGENDA ----
      else if (/abrir agenda|generar agenda|crear turnos|agenda semanal|semana que viene/i.test(lowerText)) {
        respuesta = '🔄 ¡Dale, generando la agenda semanal para ambas sedes! Esperá un segundito...';
        typing.remove();
        addMessage(respuesta, false);

        await NicoAgent.aperturaAgendaSemanal();
        addMessage('✅ ¡Agenda generada para Lanús y Belgrano! Ya están listos los turnos de la semana. ⚽🔥', false);
        return;
      }

      // ---- 9. ALERTAS / PANEL ----
      else if (/alerta|alertas|panel|novedad|novedades|qué hay|que hay|situación/i.test(lowerText)) {
        NicoPanel.toggle();
        respuesta = `¡Abrí el panel de alertas! Ahí tenés el resumen de todo lo que detecté. 📊`;
      }

      // ---- 8. RANKING CANCHAS ----
      else if (/ranking|cancha.*mejor|mejor.*cancha|rendimiento.*cancha|más.*usada/i.test(lowerText)) {
        const data = await NicoAnalytics.rankingCanchas(sucursal, 30);
        if (!data?.length) { respuesta = 'Sin datos de canchas todavía crack. Necesitamos más turnos en el sistema. ⚽'; }
        else {
          const rows = data.map((c, i) =>
            `${['🥇','🥈','🥉'][i]||'▪️'} <strong>${c.nombre}</strong> — ${fmt.money(c.ingresos)} · ${c.ocupacion}% ocupación`
          ).join('<br>');
          respuesta = `🏟️ <strong>Ranking de canchas (últimos 30 días):</strong><br><br>${rows}<br><br>
            <button onclick="App.navigate('reportes'); document.getElementById('nicoChatCloseBtn').click();"
              style="margin-top:8px;padding:7px 16px;border-radius:8px;background:#10B981;color:#0B0F19;font-size:12px;font-weight:700;cursor:pointer;border:none">
              📊 Ver Reportes completos
            </button>`;
        }
      }

      // ---- 9. CLIENTES VIP ----
      else if (/vip|mejor.*cliente|top.*cliente|fiel|abandono|inactiv/i.test(lowerText)) {
        const [vips, abandon] = await Promise.all([
          NicoAnalytics.clientesVip(sucursal, 30),
          NicoAnalytics.alertaAbandono(sucursal)
        ]);
        const vipRows = (vips||[]).slice(0,5).map((c,i)=>
          `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} <strong>${c.nombre}</strong> — ${c.reservas} reservas · ${fmt.money(c.gasto)}`
        ).join('<br>') || 'Sin datos suficientes aún.';
        const abandonRows = (abandon||[]).length
          ? abandon.slice(0,3).map(c=>`⚠️ <strong>${c.nombre}</strong> — última: ${fmt.date(c.ultimaReserva)}`).join('<br>')
          : '✅ ¡Todos los clientes activos!';
        respuesta = `👥 <strong>Top VIPs (30 días):</strong><br><br>${vipRows}<br><br>🚨 <strong>Alerta abandono (+15 días sin jugar):</strong><br><br>${abandonRows}`;
      }

      // ---- 10. ANÁLISIS BUFFET ----
      else if (/buffet|estrella|perro|rotaci|margen|rentab|heladera|producto/i.test(lowerText)) {
        const [cat, margen] = await Promise.all([
          NicoAnalytics.productosEstrellaVsPerros(sucursal),
          NicoAnalytics.margenBuffet(sucursal)
        ]);
        const estrellas = (cat?.estrellas||[]).slice(0,3).map(p=>`⭐ ${p.item}`).join(', ') || 'Sin datos';
        const perros    = (cat?.perros||[]).slice(0,3).map(p=>`🐕 ${p.item}`).join(', ') || '¡Ninguno! 🎉';
        respuesta = `🌭 <strong>Análisis Buffet ${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}:</strong><br><br>
          ⭐ <strong>Productos estrella:</strong> ${estrellas}<br>
          🐕 <strong>Sin rotación:</strong> ${perros}<br>
          ${margen?.margenPromedio ? `📈 <strong>Margen promedio:</strong> <span style="color:#10B981">${margen.margenPromedio}%</span>` : ''}
          <br><br>
          <button onclick="App.navigate('reportes'); document.getElementById('nicoChatCloseBtn').click();"
            style="margin-top:8px;padding:7px 16px;border-radius:8px;background:#10B981;color:#0B0F19;font-size:12px;font-weight:700;cursor:pointer;border:none">
            📊 Ver Reportes
          </button>`;
      }

      // ---- 11. COMPARATIVA SEDES ----
      else if (/comparativa|vs|versus|sede|lanus.*belgrano|belgrano.*lanus|ticket|promedio/i.test(lowerText)) {
        const [comp, ticket] = await Promise.all([
          NicoAnalytics.rendimientoPorSucursal(30),
          NicoAnalytics.ticketPromedio(sucursal, 30)
        ]);
        respuesta = `📈 <strong>Comparativa 30 días:</strong><br><br>
          🏟️ <strong>Lanús:</strong> ${fmt.money(comp?.lanus?.netoTotal||0)} (${comp?.lanus?.share||0}% del sistema)<br>
          🏟️ <strong>Belgrano:</strong> ${fmt.money(comp?.belgrano?.netoTotal||0)} (${comp?.belgrano?.share||0}%)<br>
          🏆 <strong>Ganador:</strong> <span style="color:#10B981">${comp?.ganadorSemana||'—'}</span><br><br>
          💳 Ticket promedio (${sucursal === 'lanus' ? 'Lanús' : 'Belgrano'}): <strong style="color:#10B981">${fmt.money(ticket?.ticketPromedio||0)}</strong><br>
          &nbsp;&nbsp;⚽ Solo cancha: ${fmt.money(ticket?.ticketSoloCancha||0)} · 🥤 Buffet extra: ${fmt.money(ticket?.ticketBuffetExtra||0)}`;
      }

      // ---- 12. APERTURA AGENDA ----
      else if (/abrir agenda|generar agenda|crear turnos|agenda semanal|semana que viene/i.test(lowerText)) {
        typing.remove();
        addMessage('🔄 ¡Dale, generando la agenda semanal para ambas sedes! Esperá un segundito...', false);
        await NicoAgent.aperturaAgendaSemanal();
        addMessage('✅ ¡Agenda generada para Lanús y Belgrano! Ya están listos los turnos de la semana. ⚽🔥', false);
        return;
      }

      // ---- 13. PANEL / ALERTAS ----
      else if (/alerta|panel|novedad|situaci/i.test(lowerText)) {
        NicoPanel.toggle();
        respuesta = '¡Abrí el panel de alertas! Ahí tenés todo lo que detecté. 📊';
      }

      // ---- FALLBACK ----
      else {
        respuesta = `¡Golazo crack! ⚽ No estoy seguro cómo ayudarte con eso.<br><br>
          Probá con: <strong>reporte</strong>, <strong>cumpleaños</strong>, <strong>stock</strong>, <strong>horarios libres</strong>, <strong>pagos pendientes</strong>, <strong>ranking canchas</strong>, <strong>clientes vip</strong>, <strong>análisis buffet</strong>, <strong>comparativa sedes</strong>.`;
      }

    } catch(e) {
      respuesta = `Uy crack, hubo un error técnico: <em>${e.message}</em>. Avisale a Ariel. 🔧`;
      console.error('[NicoChat] Error:', e);
    }

    setTimeout(() => {
      typing.remove();
      addMessage(respuesta, false);
    }, 1000 + Math.random() * 600);
  };

  sendBtn.addEventListener('click', handleSend);
  input.addEventListener('keypress', e => { if (e.key === 'Enter') handleSend(); });

  // ============================================================
  // PANEL DE ALERTAS NICO — Botón en el chat header
  // ============================================================
  const panelBtn = document.getElementById('nico-panel-toggle');
  if (panelBtn) {
    panelBtn.addEventListener('click', () => NicoPanel.toggle());
  }
});
