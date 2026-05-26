// ===== CLIENT APP LOGIC =====

function getSlotPrice(basePrecio, hora) {
    const h = parseInt(hora.split(':')[0], 10);
    if (h >= 19 && h <= 23) {
        return Math.round(basePrecio * 1.20);
    }
    return basePrecio;
}

const UI = {
    dateCarousel: document.getElementById('dateCarousel'),
    slotsGrid: document.getElementById('slotsGrid'),
    sedeSelector: document.getElementById('sedeSelector'),
    ctaPanel: document.getElementById('ctaPanel'),
    reservaResumen: document.getElementById('reservaResumen'),
    reservaPrecio: document.getElementById('reservaPrecio'),
    confirmBtn: document.getElementById('confirmBtn'),
    sportBtns: document.querySelectorAll('.sport-btn'),
    nicoClientBtn: document.getElementById('nicoClientBtn'),
    nicoMessage: document.getElementById('nicoMessage'),
    successModal: document.getElementById('successModal'),
    waLink: document.getElementById('waLink')
};

let state = {
    sede: 'lanus',
    deporte: 'Fútbol 5',
    fecha: new Date().toISOString().split('T')[0],
    selectedSlot: null,
    turnos: []
};

// --- INIT ---
function init() {
    const params = new URLSearchParams(window.location.search);
    const partidoId = params.get('partido');
    
    if (partidoId) {
        state.partidoId = parseInt(partidoId);
        loadMatchLobby(state.partidoId);
    } else {
        setupDates();
        attachListeners();
        loadTurnos();
    }

    // Carga de jugadores CRM en segundo plano para el autocompletado
    DB.getJugadores().then(jugadores => {
        state.crmJugadores = jugadores || [];
        updateCrmDatalist();
    }).catch(e => console.error("Error al cargar jugadores CRM:", e));
    
    // Proactive Nico after 5 seconds
    setTimeout(() => {
        UI.nicoMessage.style.opacity = '1';
        UI.nicoMessage.style.transform = 'translateX(0)';
    }, 5000);
}

function updateCrmDatalist() {
    let datalist = document.getElementById('crmJugadoresList');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'crmJugadoresList';
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = (state.crmJugadores || []).map(j => {
        const full = `${j.nombre} ${j.apellido || ''}`.trim();
        return `<option value="${full}">${full} (${j.telefono || ''})</option>`;
    }).join('');
}

// --- SETUP DATES ---
function setupDates() {
    UI.dateCarousel.innerHTML = '';
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const isToday = i === 0;
        
        const card = document.createElement('div');
        card.className = `date-card flex-none w-20 py-4 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${isToday ? 'bg-primary text-dark border-primary' : 'bg-surface border-slate-700 text-slate-400'}`;
        card.dataset.date = iso;
        card.innerHTML = `
            <span class="text-[10px] font-bold uppercase">${isToday ? 'HOY' : days[d.getDay()]}</span>
            <span class="text-xl font-black">${d.getDate()}</span>
        `;
        
        card.onclick = () => {
            document.querySelectorAll('.date-card').forEach(c => {
                c.classList.remove('bg-primary', 'text-dark', 'border-primary');
                c.classList.add('bg-surface', 'border-slate-700', 'text-slate-400');
            });
            card.classList.remove('bg-surface', 'border-slate-700', 'text-slate-400');
            card.classList.add('bg-primary', 'text-dark', 'border-primary');
            state.fecha = iso;
            loadTurnos();
        };
        
        UI.dateCarousel.appendChild(card);
    }
}

// --- LOAD TURNOS ---
async function loadTurnos() {
    UI.slotsGrid.innerHTML = `
        <div class="col-span-3 py-12 text-center text-slate-500">
            <div class="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-[10px] font-bold uppercase tracking-widest">Buscando ${state.deporte}...</p>
        </div>
    `;
    
    try {
        // Traemos turnos y canchas para validar existencia
        const [slots, allCanchas] = await Promise.all([
            DB.getDisponibilidadWeb(state.sede, state.fecha),
            DB.getCanchas(state.sede)
        ]);
        
        UI.slotsGrid.innerHTML = '';
        
        // 1. Validamos si el deporte existe en esta sede
        const deporteExiste = allCanchas.some(c => {
            const t = c.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const d = state.deporte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (d.includes('5')) return t.includes('5');
            if (d.includes('7')) return t.includes('7');
            if (d.includes('padel')) return t.includes('padel') || t.includes('ladrillo') || t.includes('tenis');
            return t.includes(d);
        });

        if (!deporteExiste) {
            UI.slotsGrid.innerHTML = `
                <div class="col-span-3 py-12 text-center text-slate-500 bg-red-500/5 rounded-3xl border border-dashed border-red-500/20">
                    <span class="material-symbols-outlined text-red-500/50 mb-2">block</span>
                    <p class="text-xs font-bold text-red-400/80 uppercase">Deporte no disponible</p>
                    <p class="text-[10px] mt-1 text-slate-500 italic">Esta sede no cuenta con canchas de ${state.deporte}.</p>
                </div>
            `;
            return;
        }

        // 2. Si el deporte existe, filtramos los turnos libres
        const filtered = slots.filter(s => {
            const tipo = s.canchas.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const dep = state.deporte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            if (dep.includes('5')) return tipo.includes('5');
            if (dep.includes('7')) return tipo.includes('7');
            if (dep.includes('padel')) return tipo.includes('padel') || tipo.includes('ladrillo') || tipo.includes('tenis');
            
            return tipo.includes(dep);
        });

        if (filtered.length === 0) {
            UI.slotsGrid.innerHTML = `
                <div class="col-span-3 py-8 px-4 text-center bg-surface/30 rounded-3xl border border-dashed border-slate-800">
                    <p class="text-xs">¡Agotado! 😱 <br> No quedan turnos de <b class="text-primary">${state.deporte}</b> libres.</p>
                    <button id="waitlistBtn" class="mt-4 w-full bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-white px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/5 slot-btn">
                        ANOTARME EN LISTA DE ESPERA <span class="material-symbols-outlined text-sm">notifications_active</span>
                    </button>
                </div>
            `;
            document.getElementById('waitlistBtn').onclick = () => openWaitlistForm();
            return;
        }

        filtered.forEach(slot => {
            const card = document.createElement('div');
            const isSelected = state.selectedSlot?.id === slot.id;
            const finalPrecio = getSlotPrice(slot.canchas.precio, slot.hora);
            
            card.className = `
                slot-btn relative overflow-hidden group p-4 rounded-[24px] border transition-all duration-300 active:scale-95 text-center
                ${isSelected ? 'bg-primary border-primary' : 'bg-surface border-slate-800 hover:border-primary/50'}
            `;
            
            card.innerHTML = `
                <p class="text-[10px] font-bold uppercase ${isSelected ? 'text-dark/60' : 'text-slate-500'} mb-1">${slot.canchas.nombre}</p>
                <p class="text-xl font-black ${isSelected ? 'text-dark' : 'text-white'}">${slot.hora}</p>
                <p class="text-[10px] font-bold ${isSelected ? 'text-dark/80' : 'text-primary'} mt-1">$${finalPrecio.toLocaleString()}</p>
            `;

            card.onclick = () => selectSlot(slot, card);
            UI.slotsGrid.appendChild(card);
        });

        // Banner de lista de espera al final por si buscan otro horario
        const waitlistBanner = document.createElement('div');
        waitlistBanner.className = 'col-span-3 mt-4 p-4 text-center bg-surface/30 rounded-3xl border border-dashed border-slate-800';
        waitlistBanner.innerHTML = `
            <p class="text-[11px] text-slate-400">¿Buscás otro horario de <b>${state.deporte}</b>? ⏰ ¡Sumate a la lista!</p>
            <button id="waitlistBtnSec" class="mt-2 w-full bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-white px-4 py-2.5 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent/5 slot-btn">
                ANOTARME EN LISTA DE ESPERA <span class="material-symbols-outlined text-sm">notifications_active</span>
            </button>
        `;
        UI.slotsGrid.appendChild(waitlistBanner);
        document.getElementById('waitlistBtnSec').onclick = () => openWaitlistForm();
    } catch (err) {
        console.error("Error cargando turnos:", err);
        UI.slotsGrid.innerHTML = `<p class="col-span-3 text-red-400 text-center text-xs p-10 font-bold">Error de conexión con la base de datos.</p>`;
    }
}

// --- SELECT SLOT ---
function selectSlot(turno, el) {
    document.querySelectorAll('.slot-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
    });
    el.classList.add('ring-2', 'ring-primary', 'bg-primary/10', 'border-primary');
    
    state.selectedSlot = turno;
    
    // Update CTA
    const d = new Date(turno.fecha);
    const fechaTxt = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    const finalPrecio = getSlotPrice(turno.canchas.precio, turno.hora);
    UI.reservaResumen.innerText = `${fechaTxt} • ${turno.hora} • ${turno.canchas.nombre}`;
    UI.reservaPrecio.innerText = `$${finalPrecio.toLocaleString()}`;
    
    UI.ctaPanel.classList.remove('translate-y-full');
}

// --- ATTACH LISTENERS ---
function attachListeners() {
    UI.sedeSelector.onchange = (e) => {
        state.sede = e.target.value;
        loadTurnos();
    };

    UI.sportBtns.forEach(btn => {
        btn.onclick = () => {
            UI.sportBtns.forEach(b => {
                b.classList.remove('active', 'bg-primary', 'text-dark');
                b.classList.add('bg-surface', 'border-slate-700', 'text-slate-400');
            });
            btn.classList.add('active', 'bg-primary', 'text-dark');
            btn.classList.remove('bg-surface', 'border-slate-700', 'text-slate-400');
            
            // Normalizamos para que coincida con el filtro de loadTurnos
            const sport = btn.dataset.sport.toLowerCase();
            if (sport.includes('5')) state.deporte = 'Fútbol 5';
            else if (sport.includes('7')) state.deporte = 'Fútbol 7';
            else if (sport.includes('padel')) state.deporte = 'Pádel';
            
            loadTurnos();
        };
    });

    UI.confirmBtn.onclick = async () => {
        // En lugar de prompt, mostramos un formulario en el CTA
        UI.ctaPanel.innerHTML = `
            <div class="p-6 space-y-4 bg-dark border-t border-primary/30 rounded-t-[40px] animate-in fade-in slide-in-from-bottom-10 duration-500">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-primary font-black italic italic">FICHA DE JUGADOR 🏟️</h3>
                    <button onclick="location.reload()" class="text-slate-500"><span class="material-symbols-outlined">close</span></button>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <input id="regNombre" type="text" placeholder="Nombre" list="crmJugadoresList" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
                    <input id="regApellido" type="text" placeholder="Apellido" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
                </div>
                <input id="regTel" type="tel" placeholder="WhatsApp (Ej: 1122334455)" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
                
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] text-slate-500 font-bold ml-1 uppercase">Fecha de Nacimiento 🎂</label>
                    <div class="grid grid-cols-3 gap-2">
                        <input id="regDia" type="number" placeholder="Día" min="1" max="31" class="bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 text-center outline-none focus:border-primary">
                        <input id="regMes" type="number" placeholder="Mes" min="1" max="12" class="bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 text-center outline-none focus:border-primary">
                        <input id="regAnio" type="number" placeholder="Año" min="1940" max="2020" class="bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 text-center outline-none focus:border-primary">
                    </div>
                </div>

                <button id="finalConfirmBtn" class="w-full bg-primary text-dark py-5 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                    CONFIRMAR Y UNIRME AL CLUB <span class="material-symbols-outlined">bolt</span>
                </button>
                <p class="text-[9px] text-center text-slate-500 italic">Al confirmar, te unís a nuestro club de beneficios exclusivo.</p>
            </div>
        `;

        // Autocompletado inteligente al escribir el nombre
        const regNombreInput = document.getElementById('regNombre');
        regNombreInput.oninput = (e) => {
            const val = e.target.value.trim().toLowerCase();
            const match = (state.crmJugadores || []).find(j => 
                `${j.nombre} ${j.apellido || ''}`.trim().toLowerCase() === val ||
                j.nombre.toLowerCase() === val
            );
            if (match) {
                document.getElementById('regApellido').value = match.apellido || '';
                document.getElementById('regTel').value = match.telefono || '';
                if (match.fecha_nacimiento) {
                    const parts = match.fecha_nacimiento.split('-');
                    if (parts.length === 3) {
                        document.getElementById('regAnio').value = parts[0];
                        document.getElementById('regMes').value = parseInt(parts[1]);
                        document.getElementById('regDia').value = parseInt(parts[2]);
                    }
                }
            }
        };

        document.getElementById('finalConfirmBtn').onclick = async () => {
            const nombre = document.getElementById('regNombre').value.trim();
            const apellido = document.getElementById('regApellido').value.trim();
            const telefono = document.getElementById('regTel').value.trim();
            
            const dia = document.getElementById('regDia').value.padStart(2, '0');
            const mes = document.getElementById('regMes').value.padStart(2, '0');
            const anio = document.getElementById('regAnio').value;
            const cumple = (dia && mes && anio) ? `${anio}-${mes}-${dia}` : null;

            if (!nombre || !telefono) { alert('Por favor, completá nombre y WhatsApp, crack.'); return; }
            if (cumple && (dia > 31 || mes > 12 || anio < 1940)) { alert('La fecha parece medio rara, ¿la chequeás?'); return; }

            const btn = document.getElementById('finalConfirmBtn');
            btn.disabled = true;
            btn.innerHTML = `<div class="w-6 h-6 border-3 border-dark border-t-transparent rounded-full animate-spin"></div>`;

            try {
                // 1. Guardamos la reserva
                await DB.reservarDesdeWeb({
                    turnoId: state.selectedSlot.id,
                    clienteNombre: `${nombre} ${apellido}`,
                    clienteTelefono: telefono,
                    sucursalId: state.sede
                });

                // 2. Guardamos/Actualizamos el jugador en el CRM
                await DB.registrarJugador({
                    nombre,
                    apellido,
                    telefono,
                    fecha_nacimiento: cumple,
                    sucursal_preferida: state.sede
                });

                state.clienteNombre = nombre;
                showSuccess();
            } catch (err) {
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.innerHTML = `REINTENTAR <span class="material-symbols-outlined">refresh</span>`;
            }
        };
    };
    
    UI.nicoClientBtn.onclick = () => {
        UI.nicoMessage.style.opacity = UI.nicoMessage.style.opacity === '1' ? '0' : '1';
    };
}

async function showSuccess() {
    UI.successModal.classList.remove('hidden');
    
    const origin = window.location.origin + window.location.pathname;
    const lobbyLink = `${origin}?partido=${state.selectedSlot.id}`;
    const d = new Date(state.selectedSlot.fecha);
    const fechaTxt = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    const horaTxt = (state.selectedSlot.hora || '').substring(0, 5);
    
    const msg = `¡Gente! ⚽🔥 Reservé la cancha en CanchaOS para el ${fechaTxt} a las ${horaTxt} hs (${state.selectedSlot.canchas.nombre}).\n\nEntren al link para confirmar su lugar en el equipo, ver quiénes jugamos y cuánto ponemos cada uno:\n👉 ${lobbyLink} 🏃‍♂️💨`;
    
    UI.waLink.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;

    // Mostrar el botón de Listo inmediatamente después de hacer click en WhatsApp (Convocatoria obligatoria)
    UI.waLink.onclick = () => {
        const listo = document.getElementById('successListoBtn');
        if (listo) {
            listo.classList.remove('hidden');
            listo.classList.add('animate-bounce');
            setTimeout(() => listo.classList.remove('animate-bounce'), 1000);
        }
    };
    
    // Mercado Pago Link
    try {
        const response = await fetch('/create-preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `Seña Cancha: ${state.selectedSlot.canchas.nombre} (${state.selectedSlot.hora})`,
                price: 5000,
                quantity: 1
            })
        });
        const data = await response.json();
        
        if (data.init_point) {
            const payBtn = document.createElement('button');
            payBtn.className = "w-full bg-[#009EE3] text-white py-4 rounded-2xl font-black mb-4 flex items-center justify-center gap-2 shadow-lg shadow-[#009EE3]/20";
            payBtn.innerHTML = `PAGAR SEÑA CON MERCADO PAGO <span class="material-symbols-outlined">payments</span>`;
            payBtn.onclick = () => window.location.href = data.init_point;
            
            const listoBtn = document.getElementById('successListoBtn');
            if (listoBtn) {
                listoBtn.parentElement.insertBefore(payBtn, listoBtn);
            }
        }
    } catch (err) { console.error("MP Error:", err); }
}

function openWaitlistForm() {
    UI.ctaPanel.innerHTML = `
        <div class="p-6 space-y-4 bg-dark border-t border-accent/50 rounded-t-[40px] animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-accent font-black italic flex items-center gap-2">LISTA DE ESPERA 🔔</h3>
                <button onclick="location.reload()" class="text-slate-500"><span class="material-symbols-outlined">close</span></button>
            </div>
            <p class="text-[11px] text-slate-400">Si se libera un turno de <b class="text-primary">${state.deporte}</b> el <b class="text-white">${state.fecha}</b> en <b class="text-white">${state.sede.toUpperCase()}</b>, te avisamos por WhatsApp al instante crack.</p>
            
            <div class="grid grid-cols-2 gap-3">
                <input id="waitNombre" type="text" placeholder="Nombre" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-accent">
                <input id="waitApellido" type="text" placeholder="Apellido" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-accent">
            </div>
            <input id="waitTel" type="tel" placeholder="WhatsApp (Ej: 1122334455)" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-accent">
            
            <div class="flex flex-col gap-1">
                <label class="text-[10px] text-slate-500 font-bold ml-1 uppercase">Horario de Preferencia ⏰</label>
                <select id="waitHora" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-accent">
                    <option value="18:00">18:00 hs (Tarde)</option>
                    <option value="19:00">19:00 hs (Tarde/Noche)</option>
                    <option value="20:00">20:00 hs (Central)</option>
                    <option value="21:00" selected>21:00 hs (Central Premium)</option>
                    <option value="22:00">22:00 hs (Noche)</option>
                    <option value="23:00">23:00 hs (Trasnochadores)</option>
                </select>
            </div>

            <button id="finalWaitlistConfirmBtn" class="w-full bg-accent text-white py-5 rounded-2xl font-black shadow-lg shadow-accent/20 flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer">
                ACTIVAR ALERTA DE CANCHA <span class="material-symbols-outlined text-sm">notifications_active</span>
            </button>
            <p class="text-[9px] text-center text-slate-500 italic">Te sumás al sistema automático de alertas de cancha de canchaOS.</p>
        </div>
    `;
    
    UI.ctaPanel.classList.remove('translate-y-full');
    
    document.getElementById('finalWaitlistConfirmBtn').onclick = async () => {
        const nombre = document.getElementById('waitNombre').value.trim();
        const apellido = document.getElementById('waitApellido').value.trim();
        const telefono = document.getElementById('waitTel').value.trim();
        const hora = document.getElementById('waitHora').value;
        
        if (!nombre || !telefono) { alert('Por favor, completá nombre y WhatsApp, crack.'); return; }
        
        const btn = document.getElementById('finalWaitlistConfirmBtn');
        btn.disabled = true;
        btn.innerHTML = `<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>`;
        
        try {
            await DB.anotarEnListaEspera({
                clienteNombre: `${nombre} ${apellido}`,
                clienteTelefono: telefono,
                sucursalId: state.sede,
                deporte: state.deporte,
                fecha: state.fecha,
                hora: hora
            });
            
            showWaitlistSuccess(`${nombre} ${apellido}`);
        } catch (err) {
            alert('Error: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = `REINTENTAR <span class="material-symbols-outlined">refresh</span>`;
        }
    };
}

function showWaitlistSuccess(nombreCompleto) {
    UI.successModal.innerHTML = `
        <div class="text-center animate-slide-up max-w-sm">
            <div class="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-6 shadow-2xl shadow-accent/40">🔔</div>
            <h2 class="text-4xl font-black mb-2 text-white italic tracking-tighter uppercase text-accent">¡ANOTADO CRACK!</h2>
            <p class="text-slate-400 mb-8 p-4 bg-surface/50 rounded-[32px] border border-slate-800">
                Te registramos en la lista de espera para <br><b class="text-accent">${state.deporte}</b>.<br><br>
                Sede: <b class="text-white">${state.sede.toUpperCase()}</b><br>
                Fecha: <b class="text-white">${state.fecha}</b><br>
                <span class="text-[11px] text-slate-500 mt-4 block italic">Nico está atento por vos. Si se libera una cancha, ¡n8n te mete el centro por WhatsApp al toque! ⚽🔥</span>
            </p>
            <button onclick="location.reload()" class="w-full bg-white text-dark py-4 rounded-2xl font-black mb-4 cursor-pointer">¡DE UNA, JOYITA! 🏟️</button>
        </div>
    `;
    UI.successModal.classList.remove('hidden');
}

async function loadMatchLobby(partidoId) {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Show loading skeleton
    mainEl.innerHTML = `
        <div class="space-y-6 animate-pulse">
            <div class="h-8 bg-surface rounded-xl w-3/4"></div>
            <div class="h-32 bg-surface rounded-3xl"></div>
            <div class="h-64 bg-surface rounded-3xl"></div>
        </div>
    `;

    try {
        const turno = await DB.getTurnoDetallado(partidoId);
        if (!turno) {
            mainEl.innerHTML = `
                <div class="py-12 text-center text-slate-500">
                    <span class="material-symbols-outlined text-red-400 text-5xl mb-4">sports_alert</span>
                    <h3 class="text-xl font-bold text-white mb-2">Partido no encontrado</h3>
                    <p class="text-sm text-slate-400">El turno especificado no existe o fue cancelado. ¡Volvé a consultar con el capitán!</p>
                    <button onclick="window.location.href='index.html'" class="mt-6 bg-primary text-dark px-6 py-3 rounded-2xl font-bold">VER TURNOS LIBRES</button>
                </div>
            `;
            return;
        }

        const asistentes = await DB.getAsistentesPartido(partidoId);
        renderMatchLobbyView(mainEl, turno, asistentes);
    } catch (err) {
        console.error("Error al cargar lobby:", err);
        mainEl.innerHTML = `
            <div class="py-12 text-center text-slate-500">
                <p class="text-red-400 font-bold mb-4">Error al conectar con el servidor.</p>
                <button onclick="location.reload()" class="bg-primary text-dark px-6 py-3 rounded-2xl font-bold">REINTENTAR</button>
            </div>
        `;
    }
}

window.changePadelFormat = function(turnoId, cap) {
    localStorage.setItem(`canchaos_padel_capacidad_${turnoId}`, cap);
    location.reload();
};

function renderMatchLobbyView(container, turno, asistentes) {
    const d = new Date(turno.fecha);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaFormateada = `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
    const horaFormateada = (turno.hora || '').substring(0, 5) + ' hs';

    const deporte = (turno.canchas.tipo || '').toLowerCase();
    const esPadel = deporte.includes('padel') || deporte.includes('pádel') || deporte.includes('ladrillo') || deporte.includes('tenis');
    let capacidad = 10; // Default Fútbol 5
    let deporteNombre = 'Fútbol 5';
    if (deporte.includes('7')) { 
        capacidad = 14; 
        deporteNombre = 'Fútbol 7'; 
    } else if (esPadel) {
        const savedCap = localStorage.getItem(`canchaos_padel_capacidad_${turno.id}`);
        capacidad = savedCap ? parseInt(savedCap, 10) : 4; // Default to 4
        deporteNombre = 'Pádel';
    }

    const basePrecio = turno.canchas.precio || 15000;
    const finalPrecio = getSlotPrice(basePrecio, turno.hora);
    const precioPorCabeza = Math.round(finalPrecio / capacidad);

    const equipoA = asistentes.filter(a => a.equipo === 'A');
    const equipoB = asistentes.filter(a => a.equipo === 'B');

    const totalConfirmados = asistentes.length;

    // --- POSICIONAMIENTO TÁCTICO PARA LA CANCHA 2D ---
    const posicionesF5 = [
        { key: 'GK', label: 'ARQ', classesA: 'top-[4%] left-1/2 -translate-x-1/2', classesB: 'bottom-[4%] left-1/2 -translate-x-1/2' },
        { key: 'DF1', label: 'DEF', classesA: 'top-[18%] left-[15%]', classesB: 'bottom-[18%] left-[15%]' },
        { key: 'DF2', label: 'DEF', classesA: 'top-[18%] right-[15%]', classesB: 'bottom-[18%] right-[15%]' },
        { key: 'FW1', label: 'DEL', classesA: 'top-[33%] left-[15%]', classesB: 'bottom-[33%] left-[15%]' },
        { key: 'FW2', label: 'DEL', classesA: 'top-[33%] right-[15%]', classesB: 'bottom-[33%] right-[15%]' }
    ];

    const posicionesF7 = [
        { key: 'GK', label: 'ARQ', classesA: 'top-[3%] left-1/2 -translate-x-1/2', classesB: 'bottom-[3%] left-1/2 -translate-x-1/2' },
        { key: 'DF1', label: 'DFI', classesA: 'top-[15%] left-[8%]', classesB: 'bottom-[15%] left-[8%]' },
        { key: 'DF2', label: 'DFC', classesA: 'top-[15%] left-1/2 -translate-x-1/2', classesB: 'bottom-[15%] left-1/2 -translate-x-1/2' },
        { key: 'DF3', label: 'DFD', classesA: 'top-[15%] right-[8%]', classesB: 'bottom-[15%] right-[8%]' },
        { key: 'MF1', label: 'MED', classesA: 'top-[28%] left-[15%]', classesB: 'bottom-[28%] left-[15%]' },
        { key: 'MF2', label: 'MED', classesA: 'top-[28%] right-[15%]', classesB: 'bottom-[28%] right-[15%]' },
        { key: 'FW', label: 'DEL', classesA: 'top-[38%] left-1/2 -translate-x-1/2', classesB: 'bottom-[38%] left-1/2 -translate-x-1/2' }
    ];

    const posicionesPadel4 = [
        { key: 'D1', label: 'DRV', classesA: 'top-[18%] left-[23%]', classesB: 'bottom-[18%] left-[23%]' },
        { key: 'R1', label: 'REV', classesA: 'top-[18%] right-[23%]', classesB: 'bottom-[18%] right-[23%]' }
    ];

    const posicionesPadel2 = [
        { key: 'S1', label: 'JUG', classesA: 'top-[18%] left-1/2 -translate-x-1/2', classesB: 'bottom-[18%] left-1/2 -translate-x-1/2' }
    ];

    let config = posicionesF5;
    let bgGradient = 'from-emerald-950 via-emerald-900 to-emerald-950';
    let fieldLinesHtml = '';
    
    if (esPadel) {
        config = capacidad === 2 ? posicionesPadel2 : posicionesPadel4;
        bgGradient = 'from-blue-950 via-indigo-950 to-blue-950';
        fieldLinesHtml = `
            <!-- Líneas de Pádel de Cristal -->
            <div class="absolute inset-4 border border-white/15 rounded-lg pointer-events-none"></div>
            <div class="absolute top-1/2 left-0 w-full h-[2px] bg-slate-300/35 z-10 pointer-events-none shadow-sm shadow-white/10"></div>
            <div class="absolute top-[35%] left-0 w-full h-[1px] border-t border-dashed border-white/10 pointer-events-none"></div>
            <div class="absolute bottom-[35%] left-0 w-full h-[1px] border-t border-dashed border-white/10 pointer-events-none"></div>
            <div class="absolute top-0 bottom-0 left-1/2 w-[1px] border-l border-dashed border-white/10 pointer-events-none"></div>
        `;
    } else {
        config = capacidad === 14 ? posicionesF7 : posicionesF5;
        fieldLinesHtml = `
            <!-- Líneas de Cal del Césped -->
            <div class="absolute inset-4 border border-white/15 rounded-[28px] pointer-events-none"></div>
            <!-- Línea Media -->
            <div class="absolute top-1/2 left-0 w-full h-[2px] bg-white/15 pointer-events-none"></div>
            <!-- Círculo Central -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-white/15 bg-transparent pointer-events-none"></div>
            <!-- Área Chica Superior -->
            <div class="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 border-b border-x border-white/15 pointer-events-none"></div>
            <!-- Área Grande Superior -->
            <div class="absolute top-4 left-1/2 -translate-x-1/2 w-44 h-16 border-b border-x border-white/15 rounded-b-[20px] pointer-events-none"></div>
            <!-- Área Chica Inferior -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-8 border-t border-x border-white/15 pointer-events-none"></div>
            <!-- Área Grande Inferior -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 w-44 h-16 border-t border-x border-white/15 rounded-t-[20px] pointer-events-none"></div>
        `;
    }

    let playersHtml = '';
    
    config.forEach((pos, idx) => {
        // --- EQUIPO A (Verde / Arriba) ---
        const jugadorA = equipoA[idx];
        let itemAHtml = '';
        if (jugadorA) {
            const nombreMostrar = jugadorA.nombre.split(' ')[0].substring(0, 9);
            itemAHtml = `
                <div class="absolute ${pos.classesA} flex flex-col items-center gap-1 group animate-in zoom-in-95 duration-200">
                    <div class="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-lime-600 flex items-center justify-center text-dark font-black text-xl shadow-lg shadow-primary/20 border-2 border-primary active:scale-95 transition-transform hover:scale-105 duration-200">
                        🏃‍♂️
                        <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-dark border border-primary flex items-center justify-center text-[8px] font-bold text-primary">${idx + 1}</div>
                    </div>
                    <span class="bg-dark/85 backdrop-blur-md border border-primary/20 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md text-center max-w-[70px] truncate select-none">${nombreMostrar}</span>
                </div>
            `;
        } else {
            itemAHtml = `
                <button onclick="promptJoinLobby(${turno.id}, 'A')" class="absolute ${pos.classesA} flex flex-col items-center gap-1 group animate-pulse active:scale-90 transition-transform">
                    <div class="w-12 h-12 rounded-full border-2 border-dashed border-white/20 bg-slate-950/40 group-hover:border-primary/60 group-hover:bg-primary/5 flex items-center justify-center text-white/30 group-hover:text-primary transition-all duration-200">
                        <span class="material-symbols-outlined text-md">add</span>
                    </div>
                    <span class="bg-slate-900/60 border border-dashed border-white/10 text-white/40 group-hover:border-primary/30 group-hover:text-primary font-bold text-[8px] px-1.5 py-0.5 rounded-full select-none transition-colors">${pos.label}</span>
                </button>
            `;
        }
        
        // --- EQUIPO B (Negro/Cian / Abajo) ---
        const jugadorB = equipoB[idx];
        let itemBHtml = '';
        if (jugadorB) {
            const nombreMostrar = jugadorB.nombre.split(' ')[0].substring(0, 9);
            itemBHtml = `
                <div class="absolute ${pos.classesB} flex flex-col items-center gap-1 group animate-in zoom-in-95 duration-200">
                    <div class="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#00e3fd] to-blue-600 flex items-center justify-center text-dark font-black text-xl shadow-lg shadow-[#00e3fd]/20 border-2 border-[#00e3fd] active:scale-95 transition-transform hover:scale-105 duration-200">
                        🏃‍♂️
                        <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-dark border border-[#00e3fd] flex items-center justify-center text-[8px] font-bold text-[#00e3fd]">${idx + 1}</div>
                    </div>
                    <span class="bg-dark/85 backdrop-blur-md border border-[#00e3fd]/20 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-md text-center max-w-[70px] truncate select-none">${nombreMostrar}</span>
                </div>
            `;
        } else {
            itemBHtml = `
                <button onclick="promptJoinLobby(${turno.id}, 'B')" class="absolute ${pos.classesB} flex flex-col items-center gap-1 group animate-pulse active:scale-90 transition-transform">
                    <div class="w-12 h-12 rounded-full border-2 border-dashed border-white/20 bg-slate-950/40 group-hover:border-[#00e3fd]/60 group-hover:bg-[#00e3fd]/5 flex items-center justify-center text-white/30 group-hover:text-[#00e3fd] transition-all duration-200">
                        <span class="material-symbols-outlined text-md">add</span>
                    </div>
                    <span class="bg-slate-900/60 border border-dashed border-white/10 text-white/40 group-hover:border-[#00e3fd]/30 group-hover:text-[#00e3fd] font-bold text-[8px] px-1.5 py-0.5 rounded-full select-none transition-colors">${pos.label}</span>
                </button>
            `;
        }
        
        playersHtml += itemAHtml + itemBHtml;
    });

    const tacticalBoardHtml = `
        <div class="relative w-full h-[530px] rounded-[36px] overflow-hidden border border-slate-800 bg-gradient-to-b ${bgGradient} shadow-[inset_0_0_50px_rgba(0,0,0,0.4)] shadow-2xl p-4 my-6">
            ${fieldLinesHtml}
            ${playersHtml}
            
            <!-- Arcos Metálicos -->
            ${!esPadel ? `
            <div class="absolute -top-[2px] left-1/2 -translate-x-1/2 w-20 h-2 bg-slate-800 rounded-b-md border-x border-b border-white/30 z-10 pointer-events-none"></div>
            <div class="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-20 h-2 bg-slate-800 rounded-t-md border-x border-t border-white/30 z-10 pointer-events-none"></div>
            ` : ''}
        </div>
    `;

    const mapaUrl = (turno.canchas.sucursal_id === 'lanus')
        ? 'https://maps.google.com/?q=Lanus+Futbol+Canchas'
        : 'https://maps.google.com/?q=Belgrano+Futbol+Canchas';

    container.innerHTML = `
        <div class="space-y-6 animate-in fade-in duration-300 pb-10">
            <!-- Back to Booking (Hidden inside Lobby unless clicked) -->
            <div class="flex justify-between items-center shrink-0">
                <span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">PICADO CONVOCADO 🏟️</span>
                <button onclick="window.location.href='index.html'" class="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">arrow_back</span> Ver otros días
                </button>
            </div>

            <!-- CARD PRINCIPAL: DETALLES DEL PARTIDO -->
            <div class="p-6 bg-gradient-to-br from-surface to-[#16171d] border border-slate-800 rounded-[32px] shadow-2xl relative overflow-hidden">
                <div class="absolute -right-12 -top-12 text-slate-800/20"><span class="material-symbols-outlined text-[150px]">sports_soccer</span></div>
                
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">${deporteNombre} • ${turno.canchas.nombre}</p>
                <h2 class="text-3xl font-black italic tracking-tighter text-white mb-4">FICHA DE JUEGO</h2>
                
                <div class="space-y-3.5 relative z-10 text-sm font-semibold">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-xl">calendar_today</span>
                        <p class="text-slate-200">${fechaFormateada}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-xl">schedule</span>
                        <p class="text-white font-black">${horaFormateada}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-[#00e3fd] text-xl">location_on</span>
                        <div>
                            <p class="text-slate-200 font-bold">Sede ${turno.canchas.sucursal_id === 'lanus' ? '🏟️ LANÚS' : '🏟️ BELGRANO'}</p>
                            <a href="${mapaUrl}" target="_blank" class="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 mt-0.5">CÓMO LLEGAR <span class="material-symbols-outlined text-[10px]">open_in_new</span></a>
                        </div>
                    </div>
                </div>
            </div>

            ${esPadel ? `
            <!-- MODALIDAD DE PÁDEL SELECTOR -->
            <div class="p-5 bg-surface/50 border border-slate-800/85 rounded-3xl flex items-center justify-between gap-4 animate-in zoom-in duration-200">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-slate-300 uppercase tracking-widest mb-0.5">Modalidad de Juego 🎾</p>
                    <p class="text-[10px] text-slate-500">¿Singles o Dobles? Ajustá para el picado:</p>
                </div>
                <div class="flex bg-dark/80 p-1 rounded-2xl border border-slate-700/50 shadow-inner flex-shrink-0">
                    <button onclick="window.changePadelFormat(${turno.id}, 2)" class="px-3.5 py-2 rounded-xl text-xs font-black transition-all ${capacidad === 2 ? 'bg-primary text-dark shadow-md scale-95' : 'text-slate-500 hover:text-white'}">
                        Singles (2)
                    </button>
                    <button onclick="window.changePadelFormat(${turno.id}, 4)" class="px-3.5 py-2 rounded-xl text-xs font-black transition-all ${capacidad === 4 ? 'bg-primary text-dark shadow-md scale-95' : 'text-slate-500 hover:text-white'}">
                        Dobles (4)
                    </button>
                </div>
            </div>
            ` : ''}

            <!-- CONTADORES Y WIDGET CORTA LA BOCHA -->
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-surface/50 border border-slate-800 p-4 rounded-3xl text-center">
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Convocados</p>
                    <p class="text-2xl font-black text-white">${totalConfirmados} <span class="text-xs text-slate-500">/ ${capacidad}</span></p>
                </div>
                <div class="bg-surface/50 border border-slate-800 p-4 rounded-3xl text-center relative group overflow-hidden">
                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Corta la Bocha 💸</p>
                    <p class="text-2xl font-black text-primary">$${precioPorCabeza.toLocaleString()}</p>
                    <p class="text-[9px] text-slate-500">por jugador</p>
                </div>
            </div>

            <!-- CANCHA DE JUEGO TÁCTICA INTERACTIVA -->
            <div class="space-y-3">
                <h3 class="font-black italic text-sm text-white flex items-center justify-between px-1">
                    <span>🏆 VESTUARIO EN VIVO</span>
                    <span class="text-[10px] text-primary uppercase tracking-widest font-black flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> TÁCTICA ACTIVA
                    </span>
                </h3>
                
                ${tacticalBoardHtml}
                
                <div class="flex justify-between items-center px-2 text-[10px] text-slate-500 font-bold uppercase">
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-primary border border-primary/20"></span> Equipo Verde (${equipoA.length})</span>
                    <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#00e3fd] border border-[#00e3fd]/20"></span> Equipo Negro (${equipoB.length})</span>
                </div>
            </div>

            <!-- BANNER INSTALACION PWA OFFLINE-FIRST -->
            <div id="pwaInstallBanner" class="p-6 bg-gradient-to-r from-accent/25 to-[#1c1435] border border-accent/40 rounded-[32px] shadow-xl text-center space-y-4 flex flex-col items-center">
                <span class="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl shadow-lg shadow-accent/20 animate-bounce">smart_toy</span>
                <div>
                    <h4 class="font-black text-white italic text-md">¿Querés armar los partidos al toque? 📲</h4>
                    <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Bajate la app oficial de CanchaOS en tu pantalla de inicio para ver quiénes juegan y reservar en 2 clicks.</p>
                </div>
                <button onclick="installPWA()" class="w-full py-4 bg-white text-dark rounded-2xl font-black shadow-xl hover:scale-95 transition-all text-xs">
                    AGREGAR A MI PANTALLA PRINCIPAL
                </button>
            </div>
        </div>
    `;
}

function promptJoinLobby(turnoId, equipo) {
    // Render dynamic form in CTA Panel
    UI.ctaPanel.innerHTML = `
        <div class="p-6 space-y-4 bg-dark border-t border-primary/30 rounded-t-[40px] animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-primary font-black italic flex items-center gap-1.5"><span class="material-symbols-outlined">sports_soccer</span> ENTRAR AL EQUIPO ${equipo} 🏟️</h3>
                <button onclick="location.reload()" class="text-slate-500"><span class="material-symbols-outlined">close</span></button>
            </div>
            <p class="text-[11px] text-slate-400">Sumate a la formación oficial. Pone tus datos para que tus amigos sepan que jugás y sumarte al club de beneficios de CanchaOS.</p>
            <div class="grid grid-cols-2 gap-3">
                <input id="joinNombre" type="text" placeholder="Tu Nombre" list="crmJugadoresList" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
                <input id="joinApellido" type="text" placeholder="Tu Apellido" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
            </div>
            <input id="joinTel" type="tel" placeholder="WhatsApp (Ej: 1122334455)" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
            
            <button id="joinConfirmBtn" class="w-full bg-primary text-dark py-5 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
                CONFIRMAR Y CONVOCARME <span class="material-symbols-outlined">bolt</span>
            </button>
        </div>
    `;

    // Autocompletado inteligente al escribir el nombre
    const joinNombreInput = document.getElementById('joinNombre');
    joinNombreInput.oninput = (e) => {
        const val = e.target.value.trim().toLowerCase();
        const match = (state.crmJugadores || []).find(j => 
            `${j.nombre} ${j.apellido || ''}`.trim().toLowerCase() === val ||
            j.nombre.toLowerCase() === val
        );
        if (match) {
            document.getElementById('joinApellido').value = match.apellido || '';
            document.getElementById('joinTel').value = match.telefono || '';
        }
    };

    UI.ctaPanel.classList.remove('translate-y-full');

    document.getElementById('joinConfirmBtn').onclick = async () => {
        const nombre = document.getElementById('joinNombre').value.trim();
        const apellido = document.getElementById('joinApellido').value.trim();
        const telefono = document.getElementById('joinTel').value.trim();

        if (!nombre || !telefono) {
            alert('Por favor, ingresá nombre y WhatsApp para convocarte crack.');
            return;
        }

        const btn = document.getElementById('joinConfirmBtn');
        btn.disabled = true;
        btn.innerHTML = `<div class="w-6 h-6 border-3 border-dark border-t-transparent rounded-full animate-spin"></div>`;

        try {
            await DB.confirmarAsistenciaPartido({
                turnoId,
                nombre: `${nombre} ${apellido}`,
                telefono,
                equipo
            });

            // Success feedback
            UI.ctaPanel.innerHTML = `
                <div class="p-8 text-center bg-dark border-t border-primary/30 rounded-t-[40px] space-y-4">
                    <div class="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-dark text-3xl mx-auto shadow-lg shadow-primary/20">🏟️</div>
                    <h3 class="text-2xl font-black italic text-white uppercase tracking-tighter">¡LISTO CRACK CONVOCADO!</h3>
                    <p class="text-xs text-slate-400">Te sumaste con éxito al Equipo ${equipo}. ¡Nos vemos en la cancha!</p>
                    <button onclick="location.reload()" class="w-full bg-white text-dark py-4 rounded-2xl font-black">ENTRAR AL VESTUARIO 🏃‍♂️</button>
                </div>
            `;
        } catch (err) {
            alert('Error al ingresar: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = `REINTENTAR <span class="material-symbols-outlined">refresh</span>`;
        }
    };
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
        banner.classList.remove('hidden');
    }
});

async function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User choice PWA install: ${outcome}`);
        deferredPrompt = null;
    } else {
        alert("Para instalar CanchaOS:\n🤖 En Android: Tocá los 3 puntos de Chrome y elegí 'Instalar aplicación'.\n🍏 En iPhone: Tocá compartir en Safari y elegí 'Agregar a pantalla de inicio'.");
    }
}

init();
