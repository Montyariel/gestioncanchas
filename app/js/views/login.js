// ===== VISTA: LOGIN =====
const LoginView = {
  async render() {
    // Escondemos el sidebar y topbar si estamos en el login
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) sidebar.classList.add('hidden', 'lg:hidden');
    if (topbar) topbar.classList.add('hidden');
    
    if (mainContent) {
      mainContent.classList.add('ml-0');
      mainContent.classList.remove('lg:ml-64', 'pt-20');
      mainContent.classList.add('pt-0');
    }
    
    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div class="min-h-screen w-full flex items-center justify-center p-4" style="background-color: var(--surface);">
        <div class="bg-surface-container rounded-2xl border border-surface-container-highest p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          
          <!-- Elementos decorativos -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#c3f400]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="text-center mb-8 relative z-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-high border border-surface-container-highest mb-4 shadow-lg">
              <span class="material-symbols-outlined text-4xl text-[#c3f400]">sports_tennis</span>
            </div>
            <h1 class="text-3xl font-black text-on-surface tracking-tight">Sport<span class="text-[#c3f400]">Plex</span></h1>
            <p class="text-on-surface-variant mt-2 text-sm font-medium">Acceso seguro al sistema</p>
          </div>

          <div class="space-y-5 relative z-10">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size: 20px;">mail</span>
                <input id="loginEmail" type="email" placeholder="admin@sportplex.com" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size: 20px;">lock</span>
                <input id="loginPassword" type="password" placeholder="••••••••" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
              </div>
            </div>

            <!-- MOCK DE ROLES PARA DESARROLLO -->
            <div class="pt-2 border-t border-surface-container-highest mt-6">
              <label class="block text-xs font-bold text-[#c3f400] uppercase tracking-wider mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size: 14px;">developer_mode</span>
                Simulador de Rol (Desarrollo)
              </label>
              <select id="loginRoleMock" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer outline-none">
                <option value="dueño">👑 Dueño (Acceso Total)</option>
                <option value="encargado">💼 Encargado</option>
                <option value="empleado">👨‍💻 Empleado</option>
              </select>
            </div>

            <button onclick="LoginView.login()" class="w-full mt-4 py-3 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all shadow-lg shadow-[#c3f400]/20 flex items-center justify-center gap-2">
              Ingresar al Sistema
              <span class="material-symbols-outlined" style="font-size: 20px;">login</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  login() {
    const email = document.getElementById('loginEmail').value;
    const rol = document.getElementById('loginRoleMock').value;
    
    // Guardamos la sesión (mock temporal)
    localStorage.setItem('sportplex_user', JSON.stringify({ 
      email: email || 'admin@sportplex.com', 
      rol: rol,
      nombre: email ? email.split('@')[0] : 'Administrador'
    }));
    
    App.toast(`¡Bienvenido! Rol activo: ${rol.toUpperCase()}`, 'success');

    // Restaurar UI
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) {
      sidebar.classList.remove('hidden', 'lg:hidden');
    }
    if (topbar) topbar.classList.remove('hidden');
    
    if (mainContent) {
      mainContent.classList.remove('ml-0', 'pt-0');
      mainContent.classList.add('pt-20');
      // En desktop, devolvemos el margen
      if (window.innerWidth >= 1024) {
        mainContent.classList.add('lg:ml-64');
      }
    }

    // Actualizar nombre en la UI
    const userNameEl = document.getElementById('userNameDisplay');
    if (userNameEl) {
      const u = JSON.parse(localStorage.getItem('sportplex_user'));
      userNameEl.textContent = u.nombre;
    }

    // Control de permisos visuales (ocultar tabs si es empleado, etc)
    LoginView.applyRoleRestrictions(rol);

    // Redirección basada en roles
    if (rol === 'dueño') {
      App.navigate('dashboard');
    } else if (rol === 'encargado') {
      // TODO: Crear vista de caja, por ahora dashboard
      App.navigate('dashboard'); 
    } else {
      App.navigate('agenda'); // Empleado directo a la trinchera
    }
  },

  applyRoleRestrictions(rol) {
    // Tareas del empleado: alquilar canchas, vender buffet, manejar reservas.
    // Tareas del encargado/dueño: todo lo anterior + reportes, gastos globales, dashboard.
    
    const viewsToHideFromEmpleado = ['dashboard', 'gastos', 'reportes'];
    
    viewsToHideFromEmpleado.forEach(view => {
      const tab = document.querySelector(`[data-view="${view}"]`);
      if (tab) {
        if (rol === 'empleado') {
          tab.parentElement.style.display = 'none'; // Ocultar el <li> completo
        } else {
          tab.parentElement.style.display = 'block';
        }
      }
    });
  },

  logout() {
    localStorage.removeItem('sportplex_user');
    localStorage.removeItem('sportplex_caja_abierta');
    App.navigate('login');
  }
};
