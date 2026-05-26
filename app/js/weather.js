// weather.js - CanchaOS Weather Service (Open-Meteo Integration)

const WeatherService = {
  coords: { lat: -34.70, lon: -58.39 }, // Lanús, Buenos Aires
  alertState: null, // null (normal/verde), 'amarilla', 'roja'
  currentData: null,

  async init() {
    console.log('[WeatherService] 🌤️ Iniciando servicio de clima en tiempo real...');
    await this.fetchWeather();
    // Update every 5 minutes
    setInterval(() => this.fetchWeather(), 300000);
  },

  async fetchWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.coords.lat}&longitude=${this.coords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&timezone=America/Argentina/Buenos_Aires`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      if (data && data.current) {
        this.currentData = data.current;
        this.processWeather(data.current);
      }
    } catch (e) {
      console.warn('[WeatherService] Error al obtener clima:', e.message);
      // Fail silently to not impact core app, hide widget
      document.getElementById('weatherWidget')?.classList.add('hidden');
    }
  },

  processWeather(current) {
    const code = current.weather_code;
    const temp = Math.round(current.temperature_2m);
    const appTemp = Math.round(current.apparent_temperature);
    const wind = Math.round(current.wind_speed_10m);
    const rain = current.rain || 0;

    // Define alert levels
    let alert = null;
    let alertText = '';
    let alertDesc = '';

    // WMO Weather Codes: 95, 96, 99 are thunderstorms. Rain > 15 mm or wind > 60 km/h is Red Alert.
    if ([95, 96, 99].includes(code) || rain > 15 || wind > 60) {
      alert = 'roja';
      alertText = '🚨 ALERTA ROJA';
      alertDesc = 'Tormentas eléctricas intensas o ráfagas peligrosas de viento detectadas. ¡Se recomienda la inmediata suspensión de actividades y reasignación de reservas!';
    } 
    // Moderate rain (63, 65, 81, 82) or wind > 40 km/h is Yellow Alert.
    else if ([63, 65, 81, 82].includes(code) || rain > 5 || wind > 40) {
      alert = 'amarilla';
      alertText = '⚠️ ALERTA AMARILLA';
      alertDesc = 'Lluvias de consideración o vientos fuertes en la zona. Se aconseja monitorear y alertar preventivamente a los clientes de las próximas horas.';
    }

    this.alertState = alert;
    window.currentWeatherAlert = alert; // Global variable read by views

    // Get WMO weather code metadata
    const weatherMeta = this.getWeatherMeta(code);

    // Update UI Elements
    this.renderWidget(temp, weatherMeta.emoji, alert);
    this.renderDetailCard(temp, appTemp, wind, rain, current.relative_humidity_2m, weatherMeta.label, alert, alertText, alertDesc);

    // If an alert is active, refresh the current view if it is Agenda to display warning banner
    if (alert && (typeof App !== 'undefined' && App.state.currentView === 'agenda')) {
      // Small deferred refresh to avoid loops
      if (!this._hasAlerted) {
        this._hasAlerted = true;
        setTimeout(() => App.navigate('agenda'), 1000);
      }
    } else {
      this._hasAlerted = false;
    }
  },

  getWeatherMeta(code) {
    const mapping = {
      0: { emoji: '☀️', label: 'Despejado' },
      1: { emoji: '🌤️', label: 'Parcialmente Despejado' },
      2: { emoji: '⛅', label: 'Parcialmente Nublado' },
      3: { emoji: '☁️', label: 'Nublado' },
      45: { emoji: '🌫️', label: 'Niebla' },
      48: { emoji: '🌫️', label: 'Niebla Depositaria' },
      51: { emoji: '🌧️', label: 'Llovizna Leve' },
      53: { emoji: '🌧️', label: 'Llovizna Moderada' },
      55: { emoji: '🌧️', label: 'Llovizna Densa' },
      61: { emoji: '🌧️', label: 'Lluvia Leve' },
      63: { emoji: '🌧️', label: 'Lluvia Moderada' },
      65: { emoji: '🌧️', label: 'Lluvia Fuerte' },
      80: { emoji: '🌦️', label: 'Chubascos Leves' },
      81: { emoji: '🌦️', label: 'Chubascos Moderados' },
      82: { emoji: '🌧️', label: 'Chubascos Violentos' },
      95: { emoji: '⛈️', label: 'Tormenta Eléctrica' },
      96: { emoji: '⛈️', label: 'Tormenta con Granizo Leve' },
      99: { emoji: '⛈️', label: 'Tormenta con Granizo Fuerte' }
    };
    return mapping[code] || { emoji: '🌡️', label: 'Clima Variable' };
  },

  renderWidget(temp, emoji, alert) {
    const el = document.getElementById('weatherWidget');
    if (!el) return;

    let alertDot = '';
    if (alert === 'roja') {
      alertDot = `<span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span><span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>`;
      el.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      el.style.background = 'rgba(239, 68, 68, 0.05)';
    } else if (alert === 'amarilla') {
      alertDot = `<span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span><span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>`;
      el.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      el.style.background = 'rgba(245, 158, 11, 0.05)';
    } else {
      el.style.borderColor = '';
      el.style.background = '';
    }

    el.innerHTML = `
      <span class="text-sm">${emoji}</span>
      <span class="font-black text-xs text-white" style="font-family: 'Outfit', sans-serif;">${temp}°C</span>
      <span class="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Lanús</span>
      ${alertDot}
    `;
    el.classList.remove('hidden');
    el.classList.add('flex');
  },

  renderDetailCard(temp, appTemp, wind, rain, humidity, label, alert, alertText, alertDesc) {
    // Remove existing card if any
    let card = document.getElementById('weatherDetailCard');
    if (card) card.remove();

    card = document.createElement('div');
    card.id = 'weatherDetailCard';
    card.className = 'hidden absolute top-16 right-20 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300';
    card.style.fontFamily = "'Outfit', sans-serif";

    let alertSection = '';
    if (alert === 'roja') {
      alertSection = `
        <div class="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl">
          <div class="text-red-400 font-extrabold text-xs flex items-center gap-1.5 uppercase italic">
            <span class="material-symbols-outlined text-sm animate-pulse">dangerous</span> ${alertText}
          </div>
          <div class="text-[11px] text-slate-300 mt-1 leading-relaxed font-semibold">${alertDesc}</div>
        </div>
      `;
    } else if (alert === 'amarilla') {
      alertSection = `
        <div class="mt-4 p-3 bg-amber-950/40 border border-amber-900/50 rounded-xl">
          <div class="text-amber-400 font-extrabold text-xs flex items-center gap-1.5 uppercase italic">
            <span class="material-symbols-outlined text-sm">warning</span> ${alertText}
          </div>
          <div class="text-[11px] text-slate-300 mt-1 leading-relaxed font-semibold">${alertDesc}</div>
        </div>
      `;
    } else {
      alertSection = `
        <div class="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-xl flex items-center gap-2">
          <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <div class="text-[11px] text-slate-300 leading-relaxed font-bold">¡Clima óptimo para el picado, crack! Sin alertas meteorológicas. ⚽</div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex justify-between items-center pb-3 border-b border-slate-900">
        <div>
          <h4 class="text-white font-black text-sm tracking-wide flex items-center gap-1">🏟️ Complejo Lanús</h4>
          <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estado del Clima en Vivo</p>
        </div>
        <span class="text-2xl">${alert === 'roja' ? '⛈️' : alert === 'amarilla' ? '🌦️' : '☀️'}</span>
      </div>

      <div class="grid grid-cols-2 gap-4 mt-4">
        <div class="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex flex-col justify-center">
          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Temperatura</span>
          <span class="text-2xl font-black text-white mt-1">${temp}°C</span>
          <span class="text-[10px] text-slate-400 font-medium">S.T.: ${appTemp}°C</span>
        </div>
        <div class="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex flex-col justify-center">
          <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Condición</span>
          <span class="text-xs font-extrabold text-lime-400 mt-2 truncate">${label}</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mt-2">
        <div class="bg-slate-900/20 p-2 rounded-lg border border-slate-900 flex flex-col items-center">
          <span class="material-symbols-outlined text-slate-400 text-xs">air</span>
          <span class="text-[9px] text-slate-500 font-bold uppercase mt-1">Viento</span>
          <span class="text-[10px] text-white font-extrabold mt-0.5">${wind} km/h</span>
        </div>
        <div class="bg-slate-900/20 p-2 rounded-lg border border-slate-900 flex flex-col items-center">
          <span class="material-symbols-outlined text-slate-400 text-xs">rainy</span>
          <span class="text-[9px] text-slate-500 font-bold uppercase mt-1">Lluvia</span>
          <span class="text-[10px] text-white font-extrabold mt-0.5">${rain} mm</span>
        </div>
        <div class="bg-slate-900/20 p-2 rounded-lg border border-slate-900 flex flex-col items-center">
          <span class="material-symbols-outlined text-slate-400 text-xs">humidity_percentage</span>
          <span class="text-[9px] text-slate-500 font-bold uppercase mt-1">Humedad</span>
          <span class="text-[10px] text-white font-extrabold mt-0.5">${humidity}%</span>
        </div>
      </div>

      ${alertSection}
    `;

    document.querySelector('header').parentElement.appendChild(card);
    
    // Add event handlers
    const el = document.getElementById('weatherWidget');
    if (el) {
      el.onclick = (e) => {
        e.stopPropagation();
        card.classList.toggle('hidden');
      };
    }

    // Click outside closes
    document.addEventListener('click', (e) => {
      if (!card.classList.contains('hidden') && !card.contains(e.target) && e.target !== el) {
        card.classList.add('hidden');
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => WeatherService.init());
