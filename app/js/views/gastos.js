// ===== VISTA: GASTOS =====
const GastosView = {
  async render(sucursal) {
    const container = document.getElementById('viewContainer');
    
    if (!document.getElementById('gastos-styles')) {
      const style = document.createElement('style');
      style.id = 'gastos-styles';
      style.textContent = `
        .glass-panel {
            background: rgba(25, 27, 34, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
          <div>
            <h1 class="text-3xl font-black text-primary tracking-tight">Gastos & Finanzas</h1>
            <p class="text-on-surface-variant font-medium mt-1">Registro de ingresos y egresos · ${sucursal.charAt(0).toUpperCase()+sucursal.slice(1)}</p>
          </div>
          <button class="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm" onclick="GastosView.showForm()">
            <span class="material-symbols-outlined icon-fill">add_circle</span>
            Registrar Gasto
          </button>
        </div>

        <!-- Form Overlay (Hidden by default) -->
        <div id="gastoForm" class="hidden glass-panel rounded-2xl p-6 border border-primary/30 mb-6 relative overflow-hidden shadow-2xl">
          <div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-2 mb-4">
              <span class="material-symbols-outlined text-primary">receipt_long</span>
              <h2 class="text-xl font-bold text-on-surface">Nuevo Registro</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Concepto</label>
                <input class="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="gastoConcepto" placeholder="Ej: Compra pelotas, Pago luz..." />
              </div>
              <div>
                <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Monto ($)</label>
                <input class="w-full bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" id="gastoMonto" type="number" placeholder="0" />
              </div>
            </div>
            <div class="flex gap-3 mt-6">
              <button class="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity" onclick="GastosView.guardar('${sucursal}')">Guardar Registro</button>
              <button class="bg-transparent border border-outline-variant text-on-surface-variant hover:text-on-surface px-6 py-2 rounded-lg font-bold transition-colors" onclick="GastosView.hideForm()">Cancelar</button>
            </div>
          </div>
        </div>

        <!-- Content Area -->
        <div id="gastosContent" class="flex-1 flex flex-col gap-6 overflow-hidden">
          <div class="skeleton h-32 rounded-2xl"></div>
          <div class="skeleton flex-1 rounded-2xl"></div>
        </div>
      </div>
    `;
    await this.load(sucursal);
  },

  showForm() { document.getElementById('gastoForm').classList.remove('hidden'); },
  hideForm() { document.getElementById('gastoForm').classList.add('hidden'); },

  async guardar(sucursal) {
    const concepto = document.getElementById('gastoConcepto').value.trim();
    const monto = parseFloat(document.getElementById('gastoMonto').value);
    if (!concepto || isNaN(monto) || monto <= 0) { App.toast('Completá concepto y monto ⚠️', 'error'); return; }
    try {
      await DB.addGasto(sucursal, concepto, monto);
      App.toast('✅ Gasto registrado', 'success');
      this.hideForm();
      document.getElementById('gastoConcepto').value = '';
      document.getElementById('gastoMonto').value = '';
      await this.load(sucursal);
    } catch(e) { App.toast('Error: ' + e.message, 'error'); }
  },

  async load(sucursal) {
    try {
      const gastos = await DB.getGastos(sucursal);
      const el = document.getElementById('gastosContent');

      const totalIngresos = gastos.filter(g=>g.monto<0).reduce((s,g)=>s+Math.abs(g.monto),0);
      const totalEgresos = gastos.filter(g=>g.monto>0).reduce((s,g)=>s+g.monto,0);
      const neta = totalIngresos - totalEgresos;

      const netaColor = neta >= 0 ? 'text-secondary-fixed' : 'text-error';
      const netaBg = neta >= 0 ? 'bg-secondary-fixed/10 border-secondary-fixed/30' : 'bg-error/10 border-error/30';

      el.innerHTML = `
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
            <div class="absolute -right-4 -top-4 text-primary/10"><span class="material-symbols-outlined text-[80px]">trending_up</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Total Ingresos</p>
            <p class="text-3xl font-black text-primary">${fmt.money(totalIngresos)}</p>
          </div>
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border border-outline-variant/30">
            <div class="absolute -right-4 -top-4 text-error/10"><span class="material-symbols-outlined text-[80px]">trending_down</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Total Egresos</p>
            <p class="text-3xl font-black text-error">${fmt.money(totalEgresos)}</p>
          </div>
          <div class="glass-panel rounded-2xl p-6 relative overflow-hidden border ${netaBg}">
            <div class="absolute -right-4 -top-4 ${neta >= 0 ? 'text-secondary-fixed/10' : 'text-error/10'}"><span class="material-symbols-outlined text-[80px]">account_balance</span></div>
            <p class="text-on-surface-variant text-sm font-bold tracking-wider mb-2 uppercase">Ganancia Neta</p>
            <p class="text-3xl font-black ${netaColor}">${fmt.money(neta)}</p>
          </div>
        </div>

        <!-- Table -->
        <div class="glass-panel rounded-2xl border border-outline-variant/30 flex flex-col flex-1 overflow-hidden">
          <div class="p-6 border-b border-outline-variant/30 bg-surface-container-low/50">
            <h2 class="text-xl font-bold text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">list_alt</span>
              Historial de Movimientos
            </h2>
          </div>
          
          <div class="flex-1 overflow-y-auto">
            ${gastos.length ? `
              <table class="w-full text-left border-collapse">
                <thead class="bg-surface-container sticky top-0 z-10 border-b border-outline-variant/50">
                  <tr>
                    <th class="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha</th>
                    <th class="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Concepto</th>
                    <th class="py-3 px-6 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Monto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                  ${gastos.map(g => `
                    <tr class="hover:bg-surface-container/50 transition-colors group">
                      <td class="py-4 px-6 text-sm text-on-surface-variant">${fmt.date(g.created_at)}</td>
                      <td class="py-4 px-6 text-sm font-bold text-on-surface">${g.concepto}</td>
                      <td class="py-4 px-6 text-right">
                        ${g.monto < 0 
                          ? `<span class="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1">+ ${fmt.money(Math.abs(g.monto))}</span>`
                          : `<span class="bg-error/20 text-error px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1">- ${fmt.money(Math.abs(g.monto))}</span>`
                        }
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div class="p-12 text-center h-full flex flex-col items-center justify-center">
                <span class="material-symbols-outlined text-5xl text-on-surface-variant mb-4">receipt_long</span>
                <p class="text-on-surface font-medium text-lg mb-1">Sin movimientos registrados</p>
                <p class="text-on-surface-variant text-sm">Registrá tu primer gasto o ingreso usando el botón superior.</p>
              </div>
            `}
          </div>
        </div>
      `;
    } catch(e) { App.toast('Error cargando gastos: ' + e.message, 'error'); }
  }
};
