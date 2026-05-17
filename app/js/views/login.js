// ===== VISTA: LOGIN =====
const LoginView = {
  async render() {
    const { data: { session } } = await db.auth.getSession().catch(() => ({ data: { session: null } }));
    if (session?.user) {
      const userData = await LoginView._cargarUsuario(session.user.id);
      if (userData) {
        LoginView._iniciarSesion(userData);
        return;
      }
    }

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
    
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const container = document.getElementById('viewContainer');
    container.innerHTML = `
      <div class="min-h-screen w-full flex items-center justify-center p-4" style="background-color: var(--surface);">
        <div class="bg-surface-container rounded-2xl border border-surface-container-highest p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
          
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#c3f400]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="text-center mb-8 relative z-10">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-container-high border border-surface-container-highest mb-4 shadow-lg">
              <span class="material-symbols-outlined text-4xl text-[#c3f400]">sports_tennis</span>
            </div>
            <h1 class="text-3xl font-black text-on-surface tracking-tight">Cancha<span class="text-[#c3f400]">OS</span></h1>
            <p class="text-on-surface-variant mt-2 text-sm font-medium">Acceso seguro al sistema</p>
          </div>

          <div id="loginError" class="hidden mb-4 p-3 rounded-lg text-sm font-medium" style="background:rgba(255,180,171,.15);color:#ffb4ab;border:1px solid rgba(255,180,171,.3)"></div>

          <div class="space-y-5 relative z-10">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size: 20px;">mail</span>
                <input id="loginEmail" type="email" placeholder="admin@canchaos.com" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="font-size: 20px;">lock</span>
                <input id="loginPassword" type="password" placeholder="••••••••" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors" />
              </div>
            </div>

            ${isLocalhost ? `
            <div class="pt-2 border-t border-surface-container-highest mt-6">
              <label class="block text-xs font-bold text-[#c3f400] uppercase tracking-wider mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined" style="font-size: 14px;">developer_mode</span>
                Modo desarrollo (sin auth real) — SOLO LOCAL
              </label>
              <select id="loginRoleMock" class="w-full bg-surface-container-high border border-surface-container-highest rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#c3f400] transition-colors cursor-pointer outline-none">
                <option value="dueño">👑 Dueño (Acceso Total)</option>
                <option value="encargado">💼 Encargado</option>
                <option value="empleado">👨‍💻 Empleado</option>
              </select>
              <button onclick="LoginView.loginMock()" class="w-full mt-3 py-3 rounded-lg font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all flex items-center justify-center gap-2 text-sm">
                <span class="material-symbols-outlined" style="font-size: 18px;">developer_mode</span>
                Acceso rápido (desarrollo)
              </button>
            </div>
            ` : ''}

            <button onclick="LoginView.loginReal()" class="w-full mt-4 py-3 rounded-lg font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] transition-all shadow-lg shadow-[#c3f400]/20 flex items-center justify-center gap-2">
              Ingresar al Sistema
              <span class="material-symbols-outlined" style="font-size: 20px;">login</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async loginReal() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!email || !password) {
      LoginView._mostrarError('Completá email y contraseña');
      return;
    }

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userData = await LoginView._cargarUsuario(data.user.id);
      if (!userData) {
        await db.from('perfiles').insert([{
          id: data.user.id,
          nombre: email.split('@')[0],
          rol: 'empleado',
          sucursal: 'ambas'
        }]);
        const { data: nuevo } = await db.from('perfiles').select('*').eq('id', data.user.id).single();
        if (nuevo) LoginView._iniciarSesion(nuevo);
        return;
      }

      LoginView._iniciarSesion(userData);
    } catch (e) {
      LoginView._mostrarError('Error: ' + e.message);
    }
  },

  async _cargarUsuario(userId) {
    try {
      const { data } = await db.from('perfiles').select('*').eq('id', userId).maybeSingle();
      return data;
    } catch { return null; }
  },

  _mostrarError(msg) {
    const el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  },

  loginMock() {
    const email = document.getElementById('loginEmail').value;
    const rol = document.getElementById('loginRoleMock').value;
    
    localStorage.setItem('canchaos_user', JSON.stringify({ 
      email: email || 'admin@canchaos.com', 
      rol: rol,
      nombre: email ? email.split('@')[0] : 'Administrador'
    }));
    
    const userData = { email: email || 'admin@canchaos.com', rol, nombre: email ? email.split('@')[0] : 'Administrador' };
    LoginView._iniciarSesion(userData);
  },

  _iniciarSesion(userData) {
    const rol = userData.rol || 'empleado';
    App.toast(`¡Bienvenido! Rol activo: ${rol.toUpperCase()}`, 'success');

    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('topbar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) sidebar.classList.remove('hidden', 'lg:hidden');
    if (topbar) topbar.classList.remove('hidden');
    
    if (mainContent) {
      mainContent.classList.remove('ml-0', 'pt-0');
      mainContent.classList.add('pt-20');
      if (window.innerWidth >= 1024) mainContent.classList.add('lg:ml-64');
    }

    const userNameEl = document.getElementById('userNameDisplay');
    if (userNameEl) userNameEl.textContent = (userData.nombre || 'A').charAt(0).toUpperCase();

    LoginView.applyRoleRestrictions(rol);
    App.redirectUserBasedOnRole({ rol });
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

  async logout() {
    await db.auth.signOut().catch(() => {});
    localStorage.removeItem('canchaos_user');
    localStorage.removeItem('canchaos_caja_abierta');
    App.navigate('login');
  }
};
