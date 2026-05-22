// ===== CLIENT APP LOGIC =====

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
    setupDates();
    attachListeners();
    loadTurnos();
    
    // Proactive Nico after 5 seconds
    setTimeout(() => {
        UI.nicoMessage.style.opacity = '1';
        UI.nicoMessage.style.transform = 'translateX(0)';
    }, 5000);
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
            
            card.className = `
                slot-btn relative overflow-hidden group p-4 rounded-[24px] border transition-all duration-300 active:scale-95 text-center
                ${isSelected ? 'bg-primary border-primary' : 'bg-surface border-slate-800 hover:border-primary/50'}
            `;
            
            card.innerHTML = `
                <p class="text-[10px] font-bold uppercase ${isSelected ? 'text-dark/60' : 'text-slate-500'} mb-1">${slot.canchas.nombre}</p>
                <p class="text-xl font-black ${isSelected ? 'text-dark' : 'text-white'}">${slot.hora}</p>
                <p class="text-[10px] font-bold ${isSelected ? 'text-dark/80' : 'text-primary'} mt-1">$${slot.canchas.precio.toLocaleString()}</p>
            `;

            card.onclick = () => selectSlot(slot, card);
            UI.slotsGrid.appendChild(card);
        });
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
    UI.reservaResumen.innerText = `${fechaTxt} • ${turno.hora} • ${turno.canchas.nombre}`;
    UI.reservaPrecio.innerText = `$${turno.canchas.precio.toLocaleString()}`;
    
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
                    <input id="regNombre" type="text" placeholder="Nombre" class="w-full bg-[#1e1f26] border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 outline-none focus:border-primary">
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
    const msg = `¡Gente! Reservé la cancha para el ${state.selectedSlot.fecha} a las ${state.selectedSlot.hora} en CanchaOS. ¡No falten!`;
    UI.waLink.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
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
            
            const listoBtn = UI.successModal.querySelector('button[onclick="location.reload()"]');
            listoBtn.parentElement.insertBefore(payBtn, listoBtn);
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

init();
