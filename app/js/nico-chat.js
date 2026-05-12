document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('nicoChatBtn');
  const window = document.getElementById('nicoChatWindow');
  const closeBtn = document.getElementById('nicoChatCloseBtn');
  const sendBtn = document.getElementById('nicoChatSendBtn');
  const input = document.getElementById('nicoChatInput');
  const messagesContainer = document.getElementById('nicoChatMessages');

  // Toggle chat
  const toggleChat = () => {
    if (window.classList.contains('hidden')) {
      window.classList.remove('hidden');
      setTimeout(() => {
        window.classList.remove('opacity-0', 'translate-y-4');
      }, 10);
      input.focus();
    } else {
      window.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        window.classList.add('hidden');
      }, 300);
    }
  };

  btn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Add message
  const addMessage = (text, isUser = false) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`;
    
    const bubble = document.createElement('div');
    bubble.className = `px-4 py-2 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
      isUser 
        ? 'bg-lime-400 text-[#161e00] rounded-tr-sm' 
        : 'bg-slate-800 text-slate-200 rounded-tl-sm'
    }`;
    bubble.innerHTML = text;
    
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // Handle Send
  const handleSend = async () => {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, true);
    input.value = '';
    
    // Simulate thinking
    const typingDiv = document.createElement('div');
    typingDiv.className = 'text-xs text-slate-500 italic ml-2 mt-1 typing-indicator';
    typingDiv.textContent = 'Nico está procesando...';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Determine context
    const lowerText = text.toLowerCase();
    let responseText = '';
    
    // Sucursal activa en CanchaOS
    let sucursal = 'lanus';
    if (document.getElementById('btnBelgrano') && document.getElementById('btnBelgrano').classList.contains('text-lime-400')) {
      sucursal = 'belgrano';
    }
    const hoy = fmt.dateISO(new Date());

    try {
      // 1. Cumpleaños
      if (/cumple|cumpleaño|cumpleaños/i.test(lowerText)) {
        responseText = `
          ¡Revisé la base de datos! Hoy cumplen <strong>Juan Perez</strong> y <strong>Ariel Test</strong>.<br><br>
          Acá tenés los links para mandarles su regalito:<br><br>
          🎁 <strong>Juan Perez:</strong><br>
          <a href="https://wa.me/5491112345678?text=%C2%A1Hola%20Juan%21%20%E2%9A%BD%EF%B8%8F%20Ac%C3%A1%20Nico%20de%20CanchaOS.%20%C2%A1Muy%20feliz%20cumplea%C3%B1os%20crack%21%20%F0%9F%8E%82%20Para%20festejarlo%2C%20ten%C3%A9s%20un%20Gatorade%20gratis%20o%20un%2010%25%20de%20descuento%20en%20tu%20pr%C3%B3xima%20reserva.%20%C2%A1Avisame%20cu%C3%A1ndo%20ven%C3%ADs%20y%20te%20lo%20dejo%20separado%21" target="_blank" class="text-lime-400 hover:underline">Enviar WhatsApp a Juan</a><br><br>
          🎁 <strong>Ariel Test:</strong><br>
          <a href="https://wa.me/5491198765432?text=%C2%A1Hola%20Ariel%21%20%E2%9A%BD%EF%B8%8F%20Ac%C3%A1%20Nico%20de%20CanchaOS.%20%C2%A1Muy%20feliz%20cumplea%C3%B1os%20crack%21%20%F0%9F%8E%82%20Para%20festejarlo%2C%20ten%C3%A9s%20un%20Gatorade%20gratis%20o%20un%2010%25%20de%20descuento%20en%20tu%20pr%C3%B3xima%20reserva.%20%C2%A1Avisame%20cu%C3%A1ndo%20ven%C3%ADs%20y%20te%20lo%20dejo%20separado%21" target="_blank" class="text-lime-400 hover:underline">Enviar WhatsApp a Ariel</a>
        `;
      }
      // 2. Reportes, Ocupación y Balance
      else if (/reporte|cierre|balance|resumen|como viene el dia|cómo viene el día|cuantas canchas|cuántas canchas|reservad|estado|ventas/i.test(lowerText)) {
        const metrics = await DB.getMetrics(sucursal, hoy);
        responseText = `
          ¡Acá tenés el reporte de hoy para <strong>${sucursal.toUpperCase()}</strong>! 📊<br><br>
          💰 <strong>Ingresos (Caja):</strong> ${fmt.money(metrics.ingresos)}<br>
          💸 <strong>Egresos (Gastos):</strong> ${fmt.money(metrics.egresos)}<br>
          💵 <strong>Ganancia Neta:</strong> <span class="text-lime-400 font-bold">${fmt.money(metrics.ingresos - metrics.egresos)}</span><br><br>
          🏟️ <strong>Ocupación:</strong> ${metrics.ocupacion}% (${metrics.ocupados} turnos de ${metrics.ocupados + metrics.libres})<br>
          📦 <strong>Stock Crítico:</strong> ${metrics.stockAlertas} productos por debajo del mínimo.
        `;
      }
      // 3. Horarios Muertos y Promociones
      else if (/muerto|bache|promoci|promo|vacío|vacio|demanda|libres|horarios libres|canchas libres/i.test(lowerText)) {
        const turnos = await DB.getTurnos(sucursal, hoy);
        const libres = turnos.filter(t => !t.reservado);
        if (libres.length > 0) {
          const primeros = libres.slice(0, 2);
          let horarios = primeros.map(t => `${t.hora}:00 en ${t.canchas.nombre}`).join(' y a las ');
          responseText = `
            Analicé la agenda de hoy y detecté baja demanda. Tenemos canchas libres a las <strong>${horarios}</strong>.<br><br>
            💡 <strong>Acción Propuesta:</strong> ¿Querés que mande un WhatsApp a los top 5 goleadores de la sede ofreciendo la cancha al costo + 6 aguas de regalo?<br><br>
            <button onclick="this.innerHTML='¡Enviados! ✅'; this.classList.add('opacity-50')" class="mt-2 bg-lime-400 text-slate-900 font-bold py-1.5 px-4 rounded-xl hover:opacity-90 transition-opacity">Sí, enviar Promos 🔥</button>
          `;
        } else {
          responseText = `¡Excelente noticia! Revisé la agenda de hoy y estamos al <strong>100% de ocupación</strong>. No hay baches. ¡A facturar a lo loco! 🚀`;
        }
      }
      // 4. Ingreso de Stock
      else if (/entró|entraron|agregar|llegó|llego|compre|compré|bajaron/i.test(lowerText) && /stock|quilmes|gatorade|agua|cajón|cajones|unidades|mercaderia|mercadería/i.test(lowerText)) {
        const nums = text.match(/\d+/g);
        const qty = nums ? parseInt(nums[0]) : 10;
        responseText = `¡Anotado! Acabo de registrar el ingreso de <strong>${qty} unidades</strong> al stock del buffet en el sistema. Ya están disponibles para la venta. 📦✅`;
      }
      // 5. Gastos
      else if (/gasto|pagué|pague|salió|salio|cobró|cobro|sueldo|luz|agua|gas|internet/i.test(lowerText)) {
        const nums = text.match(/\d+/g);
        // Extract numbers, could be something like 15000 or 15.000
        const rawAmount = text.replace(/[^\d]/g, '');
        const amount = rawAmount ? parseInt(rawAmount) : 5000;
        
        await DB.addGasto(sucursal, `Gasto registrado por Nico AI: "${text}"`, amount);
        responseText = `¡Listo, crack! Ya dejé asentado el gasto por <strong>${fmt.money(amount)}</strong> en el módulo de Finanzas. Todo bajo control. 💸📉`;
      }
      // Fallback
      else {
        responseText = '¡Golazo, crack! ⚽ Entendí tu mensaje, pero no estoy seguro a cuál de mis herramientas asociarlo. Tratá de incluir palabras clave como <strong>reporte, baches, cumple, pagué, o entraron unidades</strong>.';
      }
    } catch (e) {
      responseText = `Uy, hubo un error técnico al conectarme al sistema: ${e.message}`;
    }

    setTimeout(() => {
      typingDiv.remove();
      addMessage(responseText, false);
    }, 1200);
  };

  sendBtn.addEventListener('click', handleSend);
});
