// ===== VISTA: BUFFET / STOCK =====
const BuffetView = {
  cart: [],
  stockItems: [],
  sucursal: null,

  async render(sucursal) {
    this.sucursal = sucursal;
    this.cart = [];
    const container = document.getElementById('viewContainer');
    
    // Mostramos un loader simple
    container.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center bg-surface">
        <div class="skeleton" style="width:300px;height:300px;border-radius:20px"></div>
      </div>
    `;

    try {
      this.stockItems = await DB.getStock(sucursal) || [];
      this.renderUI();
    } catch(e) {
      container.innerHTML = `<div class="p-10 text-error">Error cargando stock: ${e.message}</div>`;
    }
  },

  renderUI() {
    const container = document.getElementById('viewContainer');
    
    const html = `
    <div class="absolute inset-0 flex bg-background overflow-hidden">
      <!-- Catalog Area -->
      <div class="flex-1 overflow-y-auto p-16">
        <header class="mb-10">
          <h2 class="font-h1 text-h1 text-on-surface mb-1">Buffet &amp; Bar</h2>
          <p class="font-body-lg text-body-lg text-on-surface-variant">Elevate your game with our premium selections.</p>
        </header>

        <!-- Quick Order Presets (Bento) -->
        <section class="mb-16">
          <h3 class="font-h3 text-h3 text-on-surface mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary-fixed" data-icon="bolt">bolt</span>
            Quick Presets
          </h3>
          <div class="grid grid-cols-3 gap-6">
            <div onclick="BuffetView.addPreset('Third Half Combo')" class="col-span-2 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant hover:border-primary-fixed transition-colors h-64">
              <img alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzaEJ9IGGc0nMdJr7Xeg9ZtzW2QW9wP5VBTfp6_IfurppHkAWoNXANOQ_VlGx2Q5v84xWrUs82mYISnwrCZKxqqQTGDlKbS-h4HqGrB4PGo3DNguXGx_bUv2MN8S7vLVPSv6YYHf4dy-4jsetRuykOu0tHw43QmMmGxcqaVi-v_ZGL6UTbvtEPos_X8xowSGPztqXqc5Qn-1wb60OJbNn2X-gmUvgi9FI3hau6A2444gV21UtFk_FpKklmZ1jG2_uIeSyhV8-v54IS"/>
              <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              <div class="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                <div>
                  <span class="font-label-caps text-label-caps text-secondary-fixed bg-secondary-fixed/10 px-3 py-1 rounded-full mb-2 inline-block">MOST POPULAR</span>
                  <h4 class="font-h2 text-h2 text-on-surface leading-tight mb-1">Third Half Combo</h4>
                  <p class="font-body-md text-body-md text-on-surface-variant">6 Ice-cold Beers + Large Neapolitan Pizza</p>
                </div>
                <button class="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-lg font-h3 text-body-md whitespace-nowrap hover:opacity-90 active:scale-95 transition-all">
                  Add - $35
                </button>
              </div>
            </div>
            
            <div onclick="BuffetView.addPreset('Recovery Pack')" class="col-span-1 relative rounded-xl overflow-hidden group cursor-pointer border border-outline-variant hover:border-primary-fixed transition-colors h-64">
              <img alt="" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmMlD1WHpDMrWLQqVRz6CodZgRenJJXwvGzj4dFLCwyBUQdLgTyQ_x8DQ4d4tDbkBh4Ry0FTzpS8tuyaZdPWj4WKQ54_w7EUm_ru4iW7OSXf4qars2fBd-2xWblX6iQOzUbjkl3oKJINkw1alC9m5vh5ai1zVPgLkh3Yo3cBw7CaAdv7fxf3uuPsVApMdzH9tGton57SudAqMSa7S0jvIVP6cV9C-kILs5wQTCe2R2asyKnlWvMVPK36yECP96mltGpwv-OylS1yWh"/>
              <div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              <div class="absolute bottom-0 left-0 p-6 w-full">
                <h4 class="font-h3 text-h3 text-on-surface mb-1">Recovery Pack</h4>
                <p class="font-body-md text-body-md text-on-surface-variant mb-4">2 Isotonics + Protein Bar</p>
                <button class="w-full bg-surface-container-high text-on-surface border border-outline-variant px-4 py-2 rounded-lg font-h3 text-body-md hover:border-primary-fixed transition-all">
                  Add - $12
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Category Nav -->
        <div class="flex gap-4 mb-10 border-b border-surface-container-highest pb-3">
          <button class="font-h3 text-body-lg text-primary-fixed border-b-2 border-primary-fixed pb-2 px-2">All Items</button>
          <button class="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors pb-2 px-2">Drinks</button>
          <button class="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors pb-2 px-2">Snacks</button>
          <button class="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors pb-2 px-2">Pizzas</button>
        </div>

        <!-- Catalog Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="buffetCatalogGrid">
          <!-- Items will be injected here -->
        </div>
      </div>

      <!-- Cart Sidebar -->
      <aside class="w-96 bg-surface-container-lowest border-l border-surface-container-highest flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10" id="buffetCartSidebar">
        <!-- Cart will be injected here -->
      </aside>
    </div>
    `;

    container.innerHTML = html;
    this.renderCatalog();
    this.renderCart();
  },

  getImg(name) {
    const n = name.toLowerCase();
    if (n.includes('jorgito') || n.includes('alfajor')) return 'img/alfajor_jorgito.png';
    if (n.includes('quilmes')) return 'img/cerveza_quilmes.png';
    if (n.includes('heineken')) return 'img/cerveza_heineken.png';
    if (n.includes('brahma')) return 'img/cerveza_brahma.png';
    if (n.includes('gatorade') || n.includes('isotonic')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpMvS8HOphEcqHw8-6S6L5K-v0qxTyD9M_aVQbo0C2zJtZFyqEZJw9nQzSY12Lf3oRX6RGTVv2Z82pIL_zhdiSvkYYl-umzgGDXCEcn9818r2aGI8ul6ylRWmZdAAUfEbf-sjjVnQxQ6QVdEPK5wc5HSu5hW2RCd0BPKOV7RHjdwFLCGLsdIOFNTnkMc55v1pD-19b7RB959CJ9luYaWB5HtyNZha6Yrt2K_LkKjb-chNFSARdOQ88vCuOJ_nAcgxT4zQimiEjwyhn';
    if (n.includes('coca') || n.includes('cola') || n.includes('sprite') || n.includes('agua')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-NjEhztvleWnB-wlgrh8TncFrUaVENYlpp7jF17gtZW90_DhwIzJEoti1--YIdTviIaU1VCjcCmL8x60S9vUNT8eqRhYM-IH3izGw-VafgJ0PlZt3NRbWY5ikjcWUWj6bioYHuDZCYnj_LIDO7eTU0f4hCltESi4e4Bf-Sdi2mfU_4SLnSdlotK9Tycwel57GR_i9LVwGq6HLoOvVYMd3wIpPIf5l1cenrB8eYEPnYtbuKZFSTc8-h9J1kb8faENllUzpVRHPE-Pr';
    if (n.includes('cerveza') || n.includes('lager')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS5IFjU8KGfq6ywZTr3jfBJ3RwTFUsIdv4lkyyy40br1NyZc5CkZmv5zmvJ2dWqm_KqspBJt1TOymW4J3P59Hfe-3BdqdmNM-D-F1cyCtN75uizsiqbaH2nrh-iGYp--O7qOP2SB_18ajI98n1Rbwwyg07pCNfY83OSRaD6Af46YvAffcXqSZFZr8wBRGFvnrPXSrANZ7SvPmqUN3dgbd8Uz_OqY3BRtortovMwyiMMKtbvFgEhOhYc9MhjyJtGwvqaEzDzRv200Oa';
    if (n.includes('pizza') || n.includes('pechera')) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCU6ZHOgUQSYPAKJLg00qn7dNPMxTtY95hxnfNkuhZaZFr1XWTyBtiUMrG6ykkuaJbiEwNhY8KQNVsqhHIO5D_fLVjSfJuztEuCdR1-7k_cQXVWlZAxkLhlP9CT_PPZ80BZrioEXl_KSUv-wna6nVcRxNKk8r-qEvpqpBKDPpH_felVRKBwhukOAapcW1a0jrHHfmMj8wnGG1pLrlwjh9ILBF85hx2U21Qi3kag8QmuqZgkxLYbLbtq_uIIw1QqkhUhyRXCQSCHUM6';
    if (n.includes('pelota')) return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=600&auto=format&fit=crop';
  },

  renderCatalog() {
    const grid = document.getElementById('buffetCatalogGrid');
    if (!grid) return;

    if (!this.stockItems.length) {
      grid.innerHTML = `<div class="col-span-full p-10 text-center text-on-surface-variant bg-surface-container rounded-xl">Sin stock cargado en esta sucursal</div>`;
      return;
    }

    grid.innerHTML = this.stockItems.map(s => {
      const stockColor = s.cantidad < 5 ? 'text-error' : 'text-on-surface-variant';
      const stockBadge = s.cantidad < 5 ? 
        `<div class="absolute top-3 right-3 bg-error/90 backdrop-blur-sm px-2 py-1 rounded font-label-caps text-label-caps text-on-error">LOW: ${s.cantidad}</div>` : 
        `<div class="absolute top-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded font-label-caps text-label-caps text-on-surface">${s.cantidad} en stock</div>`;

      return `
      <div class="bg-surface-container rounded-xl overflow-hidden border border-outline-variant border-t-surface-bright flex flex-col group">
        <div class="h-48 overflow-hidden relative">
          <img alt="${s.item}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${this.getImg(s.item)}"/>
          ${stockBadge}
        </div>
        <div class="p-6 flex-1 flex flex-col">
          <h4 class="font-h3 text-h3 text-on-surface mb-1">${s.item}</h4>
          <p class="font-body-md text-body-md ${stockColor} mb-4 flex-1">
            ${s.cantidad > 0 ? `Disponible` : 'Agotado'}
          </p>
          <div class="flex items-center justify-between mt-auto">
            <span class="font-stat-number text-stat-number text-on-surface">${fmt.money(s.precio_venta)}</span>
            <button onclick="BuffetView.addToCart(${s.id})" ${s.cantidad <= 0 ? 'disabled' : ''} class="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-on-surface hover:bg-primary-fixed hover:text-on-primary-fixed hover:border-primary-fixed transition-colors active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
              <span class="material-symbols-outlined" data-icon="add">add</span>
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('');
  },

  renderCart() {
    const sidebar = document.getElementById('buffetCartSidebar');
    if (!sidebar) return;

    let total = 0;
    let itemsHtml = '';
    const totalItems = this.cart.reduce((sum, item) => sum + item.qty, 0);

    if (this.cart.length === 0) {
      itemsHtml = `
        <div class="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
          <span class="material-symbols-outlined text-[64px] mb-4 opacity-50">shopping_cart</span>
          <p class="font-body-md text-body-md">El carrito está vacío.</p>
          <p class="text-sm mt-2 opacity-75">Agregá productos desde el catálogo.</p>
        </div>
      `;
    } else {
      itemsHtml = `<div class="flex-1 overflow-y-auto p-6 flex flex-col gap-4">` + this.cart.map((item, index) => {
        total += item.precio_venta * item.qty;
        return `
        <!-- Cart Item -->
        <div class="flex items-center gap-4 bg-surface-container p-3 rounded-lg border border-outline-variant/50">
          <div class="w-12 h-12 rounded bg-surface-container-high overflow-hidden">
            <img alt="${item.item}" class="w-full h-full object-cover" src="${this.getImg(item.item)}"/>
          </div>
          <div class="flex-1">
            <h5 class="font-h3 text-body-md text-on-surface leading-tight">${item.item}</h5>
            <span class="font-body-md text-sm text-on-surface-variant">${fmt.money(item.precio_venta)}</span>
          </div>
          <div class="flex items-center gap-2 bg-background rounded-lg border border-outline-variant/50 p-1">
            <button onclick="BuffetView.updateQty(${index}, -1)" class="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">remove</span></button>
            <span class="font-stat-number text-sm w-4 text-center">${item.qty}</span>
            <button onclick="BuffetView.updateQty(${index}, 1)" class="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant"><span class="material-symbols-outlined text-[16px]">add</span></button>
          </div>
        </div>
        `;
      }).join('') + `</div>`;
    }

    sidebar.innerHTML = `
      <div class="p-6 border-b border-surface-container-highest flex items-center justify-between bg-surface-container/50">
        <h2 class="font-h2 text-h3 text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined">shopping_cart</span>
          Current Order
        </h2>
        <span class="bg-primary-fixed/20 text-primary-fixed font-label-caps text-label-caps px-2 py-1 rounded-full">${totalItems} ITEMS</span>
      </div>
      
      ${itemsHtml}
      
      <div class="p-6 bg-surface-container border-t border-surface-container-highest">
        <div class="mb-4">
          <label class="font-label-caps text-label-caps text-on-surface-variant mb-2 block">DELIVERY TARGET</label>
          <div class="relative">
            <select id="buffetDeliveryTarget" class="w-full bg-background border border-outline-variant rounded-lg py-3 px-4 appearance-none font-body-md text-on-surface focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed">
              <option value="bar">Pick up at Bar</option>
              <option value="cancha1">Send to Cancha 1</option>
              <option value="cancha2">Send to Cancha 2</option>
              <option value="cancha3">Send to Cancha 3</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
        <div class="flex justify-between items-end mb-6">
          <span class="font-body-lg text-body-lg text-on-surface-variant">Total</span>
          <span class="font-stat-number text-[32px] text-on-surface leading-none">${fmt.money(total)}</span>
        </div>
        <button onclick="BuffetView.checkout()" ${totalItems === 0 ? 'disabled' : ''} class="w-full bg-primary-fixed text-on-primary-fixed font-h2 text-body-lg py-4 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,244,0,0.2)] disabled:opacity-50 disabled:pointer-events-none">
          <span class="material-symbols-outlined">send</span>
          Place Order
        </button>
      </div>
    `;
  },

  addToCart(id) {
    const stockItem = this.stockItems.find(s => s.id === id);
    if (!stockItem || stockItem.cantidad <= 0) return;

    const existing = this.cart.find(c => c.id === id);
    if (existing) {
      if (existing.qty < stockItem.cantidad) {
        existing.qty++;
      } else {
        App.toast('Stock insuficiente ❌', 'error');
        return;
      }
    } else {
      this.cart.push({ ...stockItem, qty: 1 });
    }
    this.renderCart();
  },

  updateQty(index, delta) {
    const item = this.cart[index];
    if (!item) return;
    
    const stockItem = this.stockItems.find(s => s.id === item.id);
    
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      this.cart.splice(index, 1);
    } else if (stockItem && newQty > stockItem.cantidad) {
      App.toast('Stock insuficiente ❌', 'error');
      return;
    } else {
      item.qty = newQty;
    }
    this.renderCart();
  },

  addPreset(name) {
    App.toast(`Aplicando preset: ${name}`, 'info');
    // Para la demo, simplemente agregamos una bebida aleatoria si existe
    const bebida = this.stockItems.find(s => s.item.toLowerCase().includes('gatorade') || s.item.toLowerCase().includes('coca'));
    if (bebida) this.addToCart(bebida.id);
  },

  async checkout() {
    if (this.cart.length === 0) return;
    
    const btn = document.querySelector('#buffetCartSidebar button[onclick="BuffetView.checkout()"]');
    if (btn) btn.innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> Procesando...`;

    try {
      // Create stock updates
      for (const item of this.cart) {
        const stockItem = this.stockItems.find(s => s.id === item.id);
        if (stockItem) {
          const newStock = stockItem.cantidad - item.qty;
          await DB.updateStock(item.id, newStock);
        }
      }
      
      const total = this.cart.reduce((sum, item) => sum + item.precio_venta * item.qty, 0);
      
      // Intentar registrar el ingreso en la Caja Diaria (si hay una abierta)
      try {
        const { data: sesiones } = await db
          .from('sesiones_caja')
          .select('id')
          .eq('sucursal', this.sucursal)
          .eq('estado', 'abierta')
          .order('fecha_apertura', { ascending: false })
          .limit(1);

        if (sesiones && sesiones.length > 0) {
          const desc = this.cart.map(c => `${c.qty}x ${c.item}`).join(', ');
          await db.from('movimientos_caja').insert([{
            sesion_id: sesiones[0].id,
            tipo: 'ingreso',
            categoria: 'Venta Buffet',
            monto: total,
            descripcion: `Venta Buffet: ${desc}`
          }]);
        } else {
          console.warn("No hay caja abierta. La venta no se registró en el Libro Diario.");
          App.toast("⚠️ Venta realizada, pero la Caja está cerrada. Abrí la caja para futuros registros.", "error");
        }
      } catch (errCaja) {
        console.error("Error registrando en caja:", errCaja);
      }

      App.toast(`✅ Venta registrada: ${fmt.money(total)}`, 'success');
      
      // Reload stock from DB and clear cart
      this.cart = [];
      this.stockItems = await DB.getStock(this.sucursal);
      
      this.renderCatalog();
      this.renderCart();
    } catch(e) {
      App.toast('Error al procesar venta: ' + e.message, 'error');
      if (btn) btn.innerHTML = `<span class="material-symbols-outlined">send</span> Place Order`;
    }
  }
};
