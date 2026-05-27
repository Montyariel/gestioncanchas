// ===== VISTA: BUFFET / STOCK =====
const BuffetView = {
  cart: [],
  stockItems: [],
  sucursal: null,
  _activeCategory: 'all',

  setCategory(category) {
    this._activeCategory = category;
    this.renderUI();
  },

  async render(sucursal) {
    this.sucursal = sucursal;
    this.cart = [];
    this._activeCategory = 'all';
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
        <header class="mb-10 flex items-center justify-between">
          <div>
            <h2 class="font-h1 text-h1 text-on-surface mb-1">Buffet &amp; Bar</h2>
            <p class="font-body-lg text-body-lg text-on-surface-variant">Elevate your game with our premium selections.</p>
          </div>
          <button onclick="BuffetView.openAdminModal()" class="flex items-center gap-2 bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] px-5 py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer border-none font-body-md">
            <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
            Gestionar Inventario
          </button>
        </header>

        <!-- Offline Alert Banner -->
        <div id="offlineStockAlert" class="hidden mb-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl px-5 py-3 text-sm flex items-center gap-2.5 animate-pulse">
          <span class="material-symbols-outlined text-[20px]">wifi_off</span>
          <span><strong>Modo Resiliente Offline Activo:</strong> Estás sin conexión a internet. Podés reponer o vender stock normalmente, las operaciones se guardarán localmente y se sincronizarán al recuperar la señal.</span>
        </div>

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
          <button onclick="BuffetView.setCategory('all')" class="${this._activeCategory === 'all' ? 'font-h3 text-body-lg text-primary-fixed border-b-2 border-primary-fixed' : 'font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface'} pb-2 px-2 transition-all cursor-pointer border-none bg-transparent">All Items</button>
          <button onclick="BuffetView.setCategory('drinks')" class="${this._activeCategory === 'drinks' ? 'font-h3 text-body-lg text-primary-fixed border-b-2 border-primary-fixed' : 'font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface'} pb-2 px-2 transition-all cursor-pointer border-none bg-transparent">Drinks</button>
          <button onclick="BuffetView.setCategory('snacks')" class="${this._activeCategory === 'snacks' ? 'font-h3 text-body-lg text-primary-fixed border-b-2 border-primary-fixed' : 'font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface'} pb-2 px-2 transition-all cursor-pointer border-none bg-transparent">Snacks</button>
          <button onclick="BuffetView.setCategory('pizzas')" class="${this._activeCategory === 'pizzas' ? 'font-h3 text-body-lg text-primary-fixed border-b-2 border-primary-fixed' : 'font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface'} pb-2 px-2 transition-all cursor-pointer border-none bg-transparent">Pizzas</button>
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
    
    if (!navigator.onLine) {
      const alertEl = document.getElementById('offlineStockAlert');
      if (alertEl) alertEl.classList.remove('hidden');
    }
  },

  getImg(name) {
    const n = name.toLowerCase();
    if (n.includes('hamburguesa')) return '/assets/images/champion_burger.png';
    if (n.includes('pancho')) return '/assets/images/executive_hotdog.png';
    if (n.includes('picada')) return '/assets/images/premium_picada.png';
    
    if (n.includes('coca') || n.includes('cola')) return '/assets/images/coca_cola.png';
    if (n.includes('sprite') || n.includes('fanta')) return '/assets/images/sprite.png';
    if (n.includes('gatorade') || n.includes('powerade')) return '/assets/images/gatorade.png';
    if (n.includes('red bull') || n.includes('speed')) return '/assets/images/red_bull.png';
    if (n.includes('agua')) return '/assets/images/agua_mineral.png';
    if (n.includes('jugo') || n.includes('licuado')) return '/assets/images/sports_drinks.png';

    if (n.includes('jorgito') || n.includes('alfajor')) return '/img/alfajor_jorgito.png';
    if (n.includes('quilmes')) return '/img/cerveza_quilmes.png';
    if (n.includes('heineken')) return '/img/cerveza_heineken.png';
    if (n.includes('brahma')) return '/img/cerveza_brahma.png';
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

    let filtered = this.stockItems;
    if (this._activeCategory !== 'all') {
      filtered = this.stockItems.filter(s => {
        const itemLower = s.item.toLowerCase();
        if (this._activeCategory === 'drinks') {
          return itemLower.includes('gatorade') || itemLower.includes('powerade') || itemLower.includes('coca') || itemLower.includes('cola') || itemLower.includes('sprite') || itemLower.includes('fanta') || itemLower.includes('cerveza') || itemLower.includes('beer') || itemLower.includes('agua') || itemLower.includes('jugo') || itemLower.includes('heineken') || itemLower.includes('quilmes') || itemLower.includes('brahma') || itemLower.includes('bebida') || itemLower.includes('isoton');
        }
        if (this._activeCategory === 'snacks') {
          return itemLower.includes('alfajor') || itemLower.includes('jorgito') || itemLower.includes('snack') || itemLower.includes('pancho') || itemLower.includes('hamburguesa') || itemLower.includes('picada') || itemLower.includes('papas') || itemLower.includes('papas fritas') || itemLower.includes('barra');
        }
        if (this._activeCategory === 'pizzas') {
          return itemLower.includes('pizza') || itemLower.includes('muzzarella') || itemLower.includes('napolitana') || itemLower.includes('fugazzeta');
        }
        return true;
      });
    }

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-full p-10 text-center text-on-surface-variant bg-surface-container rounded-xl">Sin productos disponibles en esta categoría</div>`;
      return;
    }

    grid.innerHTML = filtered.map(s => {
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
          <h4 class="font-h3 text-h3 text-on-surface mb-1 line-clamp-2" title="${s.item}">${s.item}</h4>
          <p class="font-body-md text-body-md ${stockColor} mb-4 mt-2 flex-1">
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
          <div class="relative mb-4">
            <select id="buffetDeliveryTarget" class="w-full bg-background border border-outline-variant rounded-lg py-3 px-4 appearance-none font-body-md text-on-surface focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed">
              <option value="bar">Pick up at Bar</option>
              <option value="cancha1">Send to Cancha 1</option>
              <option value="cancha2">Send to Cancha 2</option>
              <option value="cancha3">Send to Cancha 3</option>
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
          
          <label class="font-label-caps text-label-caps text-on-surface-variant mb-2 block">MÉTODO DE PAGO</label>
          <div class="relative">
            <select id="buffetMetodoPago" class="w-full bg-background border border-outline-variant rounded-lg py-3 px-4 appearance-none font-body-md text-on-surface focus:ring-1 focus:ring-primary-fixed focus:border-primary-fixed">
              <option value="Efectivo">Efectivo</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="Transferencia">Transferencia Bancaria</option>
              <option value="Débito">Tarjeta Débito</option>
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
    if (name === 'Third Half Combo') {
      const cerveza = this.stockItems.find(s => {
        const itemLower = s.item.toLowerCase();
        return itemLower.includes('cerveza') || itemLower.includes('quilmes') || itemLower.includes('heineken') || itemLower.includes('brahma') || itemLower.includes('corona') || itemLower.includes('lager');
      });
      const pizza = this.stockItems.find(s => {
        const itemLower = s.item.toLowerCase();
        return itemLower.includes('pizza') || itemLower.includes('muzzarella') || itemLower.includes('napolitana') || itemLower.includes('fugazzeta');
      });
      
      let addedAny = false;
      if (cerveza) {
        const qtyToAdd = Math.min(6, cerveza.cantidad);
        if (qtyToAdd > 0) {
          for (let i = 0; i < qtyToAdd; i++) {
            this.addToCart(cerveza.id);
          }
          addedAny = true;
        } else {
          App.toast('No hay stock de Cerveza en este momento ⚠️', 'error');
        }
      } else {
        App.toast('Cerveza no disponible en inventario ⚠️', 'error');
      }
      
      if (pizza) {
        if (pizza.cantidad > 0) {
          this.addToCart(pizza.id);
          addedAny = true;
        } else {
          App.toast('No hay stock de Pizza en este momento ⚠️', 'error');
        }
      } else {
        App.toast('Pizza no disponible en inventario ⚠️', 'error');
      }
      
      if (addedAny) {
        App.toast('¡Tercer Tiempo cargado! 6 Cervezas y 1 Pizza agregadas 🍻🍕⚽', 'success');
      }
    } else if (name === 'Recovery Pack') {
      const gatorade = this.stockItems.find(s => {
        const itemLower = s.item.toLowerCase();
        return itemLower.includes('gatorade') || itemLower.includes('powerade') || itemLower.includes('isot');
      });
      const snack = this.stockItems.find(s => {
        const itemLower = s.item.toLowerCase();
        return itemLower.includes('alfajor') || itemLower.includes('jorgito') || itemLower.includes('barra') || itemLower.includes('snack') || itemLower.includes('pancho') || itemLower.includes('hamburguesa');
      });
      
      let addedAny = false;
      if (gatorade) {
        const qtyToAdd = Math.min(2, gatorade.cantidad);
        if (qtyToAdd > 0) {
          for (let i = 0; i < qtyToAdd; i++) {
            this.addToCart(gatorade.id);
          }
          addedAny = true;
        } else {
          App.toast('No hay stock de Bebida Isotónica ⚠️', 'error');
        }
      } else {
        App.toast('Bebidas Isotónicas no disponibles en inventario ⚠️', 'error');
      }
      
      if (snack) {
        if (snack.cantidad > 0) {
          this.addToCart(snack.id);
          addedAny = true;
        } else {
          App.toast('No hay stock de Snacks/Alfajores ⚠️', 'error');
        }
      } else {
        App.toast('Snack no disponible en inventario ⚠️', 'error');
      }
      
      if (addedAny) {
        App.toast('¡Pack de Recuperación cargado! 2 Bebidas y 1 Snack agregados ⚡🥤🍫', 'success');
      }
    } else {
      App.toast(`Aplicando preset: ${name}`, 'info');
    }
  },

  async checkout() {
    if (this.cart.length === 0) return;
    
    const btn = document.querySelector('#buffetCartSidebar button[onclick="BuffetView.checkout()"]');
    if (btn) btn.innerHTML = `<span class="material-symbols-outlined animate-spin">refresh</span> Procesando...`;

    try {
      const total = this.cart.reduce((sum, item) => sum + item.precio_venta * item.qty, 0);

      // Usar API segura para cada producto
      for (const item of this.cart) {
        await API.ventaBuffet(this.sucursal, item.item, item.qty);
      }
      
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
          const descItems = this.cart.map(c => `${c.qty}x ${c.item}`).join(', ');
          const metodoPago = document.getElementById('buffetMetodoPago')?.value || 'Efectivo';
          
          await db.from('movimientos_caja').insert([{
            sesion_id: sesiones[0].id,
            tipo: 'ingreso',
            categoria: 'Venta Buffet',
            monto: total,
            descripcion: `[${metodoPago}] Venta Buffet: ${descItems}`
          }]);
        } else {
          console.warn("No hay caja abierta. La venta no se registró en el Libro Diario.");
          App.toast("⚠️ Venta realizada, pero la Caja está cerrada. Abrí la caja para futuros registros.", "error");
        }
      } catch (errCaja) {
        console.error("Error registrando en caja:", errCaja);
      }

      App.toast(`✅ Venta registrada: ${fmt.money(total)}`, 'success');
      
      this.cart = [];
      this.stockItems = await DB.getStock(this.sucursal);
      
      this.renderCatalog();
      this.renderCart();
    } catch(e) {
      App.toast('Error al procesar venta: ' + e.message, 'error');
      if (btn) btn.innerHTML = `<span class="material-symbols-outlined">send</span> Place Order`;
    }
  },

  // ============================================================
  // ADMIN DE INVENTARIO SEGURO (MODAL + AUDITORÍA HISTÓRICA)
  // ============================================================
  
  _activeAdminTab: 0, // 0 = Stock Control, 1 = Nuevo Producto, 2 = Auditoría, 3 = Recetas
  
  openAdminModal() {
    let modal = document.getElementById('inventoryAdminModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'inventoryAdminModal';
      modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 transition-all';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    this._activeAdminTab = 0;
    this.renderAdminModalUI();
  },

  closeAdminModal() {
    const modal = document.getElementById('inventoryAdminModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    // Refrescar el catálogo principal tras salir del admin
    this.render(this.sucursal);
  },

  async setAdminTab(tabIndex) {
    this._activeAdminTab = tabIndex;
    this.renderAdminModalUI();
  },

  async renderAdminModalUI() {
    const modal = document.getElementById('inventoryAdminModal');
    if (!modal) return;

    const isOffline = !navigator.onLine;

    // Renderizar cabecera del modal y tabs
    let contentHtml = `
    <div class="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-lime-400 text-3xl">shield_person</span>
          <div>
            <h3 class="text-xl font-bold text-slate-100 font-h2">Control y Auditoría de Stock</h3>
            <p class="text-xs text-slate-400">canchaOS Blindaje Anti-Robo &amp; Carga Segura</p>
          </div>
        </div>
        <button onclick="BuffetView.closeAdminModal()" class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors border-none cursor-pointer">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <!-- Offline Indicator -->
      ${isOffline ? `
      <div class="bg-yellow-500/10 text-yellow-400 border-b border-yellow-500/20 px-8 py-3 text-xs font-semibold flex items-center gap-2 animate-pulse">
        <span class="material-symbols-outlined text-[16px]">wifi_off</span>
        MODO RESILIENTE OFFLINE ACTIVO - Los cambios en stock se guardarán de forma local y se sincronizarán solos.
      </div>
      ` : ''}

      <!-- Modal Tabs -->
      <div class="flex border-b border-slate-800 bg-slate-950/20">
        <button onclick="BuffetView.setAdminTab(0)" class="flex-1 py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer border-none ${this._activeAdminTab === 0 ? 'text-lime-400 border-lime-400 bg-lime-400/5' : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'}">
          📦 Control y Reposición
        </button>
        <button onclick="BuffetView.setAdminTab(1)" class="flex-1 py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer border-none ${this._activeAdminTab === 1 ? 'text-lime-400 border-lime-400 bg-lime-400/5' : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'}" ${isOffline ? 'disabled title="No disponible sin internet"' : ''}>
          🍔 Cargar Nuevo Producto
        </button>
        <button onclick="BuffetView.setAdminTab(2)" class="flex-1 py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer border-none ${this._activeAdminTab === 2 ? 'text-lime-400 border-lime-400 bg-lime-400/5' : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'}">
          📋 Auditoría Inmutable
        </button>
        <button onclick="BuffetView.setAdminTab(3)" style="display: none;" class="flex-1 py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer border-none ${this._activeAdminTab === 3 ? 'text-lime-400 border-lime-400 bg-lime-400/5' : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'}">
          🧾 Recetas
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-8 overflow-y-auto flex-1 bg-slate-900/50">
    `;

    // --- TAB 0: CONTROL Y REPOSICIÓN ---
    if (this._activeAdminTab === 0) {
      contentHtml += `
        <div class="flex flex-col gap-6">
          <div class="flex justify-between items-center">
            <h4 class="text-md font-bold text-slate-200">Inventario Actual en ${this.sucursal.toUpperCase()}</h4>
            <span class="text-xs text-slate-400">Presioná + o - para modificar cantidades. Todo cambio requiere motivo.</span>
          </div>
          
          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/30">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th class="p-4">Producto</th>
                  <th class="p-4">Categoría</th>
                  <th class="p-4 text-center">Cant. Actual</th>
                  <th class="p-4 text-right">Precio Venta</th>
                  <th class="p-4 text-center">Acciones de Auditoría</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50 text-sm text-slate-300">
                ${this.stockItems.map(s => {
                  const critical = s.cantidad < 5;
                  return `
                  <tr class="hover:bg-slate-800/30 transition-colors">
                    <td class="p-4 font-bold text-slate-200">${s.item}</td>
                    <td class="p-4 text-xs font-semibold text-slate-400">${s.categoria}</td>
                    <td class="p-4 text-center">
                      <span class="px-2.5 py-1 rounded font-bold ${critical ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}">
                        ${s.cantidad}
                      </span>
                    </td>
                    <td class="p-4 text-right font-semibold text-lime-400">${fmt.money(s.precio_venta)}</td>
                    <td class="p-4">
                      <div class="flex gap-2 justify-center">
                        <button onclick="BuffetView.reponerStockPrompt(${s.id})" class="px-3 py-1.5 rounded-lg bg-lime-400 text-[#161e00] font-bold text-xs hover:bg-lime-300 active:scale-95 transition-all border-none cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">add</span> Reponer
                        </button>
                        <button onclick="BuffetView.ajustarStockPrompt(${s.id})" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-500/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">remove</span> Pérdida / Ajuste
                        </button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // --- TAB 1: CARGAR NUEVO PRODUCTO ---
    else if (this._activeAdminTab === 1) {
      contentHtml += `
        <div class="max-w-xl mx-auto flex flex-col gap-6">
          <h4 class="text-md font-bold text-slate-200 border-b border-slate-800 pb-3">Cargar Producto al Catálogo del Buffet</h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Nombre del Producto</label>
              <input type="text" id="newProdName" placeholder="Gaseosa Coca-Cola 500ml, Panes de hamburguesa, etc." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
              <select id="newProdCategory" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors outline-none cursor-pointer">
                <option value="Bebidas">Bebidas</option>
                <option value="Cervezas">Cervezas</option>
                <option value="Hamburguesas">Hamburguesas</option>
                <option value="Panchos">Panchos</option>
                <option value="Picadas">Picadas</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Precio de Venta ($)</label>
              <input type="number" id="newProdPrice" placeholder="Precio venta en ARS" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Inicial</label>
              <input type="number" id="newProdStock" value="10" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Alerta Stock Mínimo</label>
              <input type="number" id="newProdAlert" value="5" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
            </div>

            <!-- Costeo Inteligente por Pack (Wholesale) -->
            <div class="col-span-2 p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h5 class="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">inventory_2</span> 
                Costeo Inteligente por Pack (Wholesale)
              </h5>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Precio de Compra del Pack ($)</label>
                  <input type="number" id="newProdPackPrice" placeholder="Ej: 2400" min="0" step="any" oninput="BuffetView.updateUnitPricePreview()" class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Unidades por Pack</label>
                  <input type="number" id="newProdPackUnits" value="1" min="1" oninput="BuffetView.updateUnitPricePreview()" class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-lime-400 transition-colors" />
                </div>
              </div>
              <p id="unitPriceFeedback" class="text-xs text-lime-400 font-bold mt-1">
                Costo unitario calculado: $0.00
              </p>
            </div>
          </div>

          <button onclick="BuffetView.addNewProduct()" class="w-full py-3.5 mt-4 rounded-xl font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none font-body-md shadow-lg shadow-lime-400/10">
            <span class="material-symbols-outlined">save</span>
            Registrar Producto en Inventario
          </button>
        </div>
      `;
    }

    // --- TAB 2: AUDITORÍA INMUTABLE ---
    else if (this._activeAdminTab === 2) {
      contentHtml += `
        <div class="flex flex-col gap-6">
          <div class="flex justify-between items-center">
            <h4 class="text-md font-bold text-slate-200">Historial Inmutable de Auditoría - Sede ${this.sucursal.toUpperCase()}</h4>
            <span class="flex items-center gap-1.5 text-xs text-lime-400 bg-lime-400/10 px-3 py-1.5 rounded-full border border-lime-400/20">
              <span class="material-symbols-outlined text-[14px]">lock</span> A Prueba de Manipulaciones
            </span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/30 max-h-[45vh] overflow-y-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-950/60 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
                  <th class="p-4">Fecha / Hora</th>
                  <th class="p-4">Producto</th>
                  <th class="p-4">Movimiento</th>
                  <th class="p-4 text-center">Variación</th>
                  <th class="p-4">Responsable</th>
                  <th class="p-4">Concepto / Motivo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/50 text-sm text-slate-300" id="auditLogsBody">
                <tr>
                  <td colspan="6" class="p-8 text-center text-slate-400">
                    <span class="material-symbols-outlined animate-spin text-lime-400 mb-2">refresh</span><br>
                    Cargando logs del historial seguro...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // --- TAB 3: RECETAS (PRODUCTOS COMPUESTOS) ---
    else if (this._activeAdminTab === 3) {
      contentHtml += `
        <style>
          .insumo-chip { transition: all 0.15s ease; }
          .insumo-chip:hover { transform: scale(1.02); }
          .receta-canvas-empty { border: 2px dashed rgba(163,230,53,0.2); }
          #recetaSearchInsumo:focus { border-color: #c3f400; }
          #recetaSearchProducto:focus { border-color: #c3f400; }
        </style>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-md font-bold text-slate-200">🧾 Constructor de Recetas</h4>
              <p class="text-xs text-slate-400 mt-0.5">Buscá el producto final, clic en los insumos para agregarlos. Así de rápido.</p>
            </div>
          </div>

          <!-- BUILDER: 2 COLUMNAS -->
          <div class="grid grid-cols-2 gap-4" style="min-height:400px">

            <!-- COLUMNA IZQUIERDA: Catálogo de insumos -->
            <div class="bg-slate-950/60 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
              <div class="p-4 border-b border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase mb-2">Insumos disponibles</p>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                  <input id="recetaSearchInsumo" type="text" placeholder="Buscar insumo..." 
                    oninput="BuffetView._filterInsumos(this.value)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-lime-400 transition-colors" />
                </div>
              </div>
              <div id="insumoCatalog" class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                ${this.stockItems.map(s => `
                  <button 
                    class="insumo-chip w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-lime-400/50 hover:bg-lime-400/5 text-left cursor-pointer"
                    data-item="${s.item.replace(/"/g,'&quot;')}"
                    onclick="BuffetView._addChip('${s.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')"
                  >
                    <span class="material-symbols-outlined text-slate-500 text-[16px]">add_circle</span>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-slate-200 truncate">${s.item}</div>
                      <div class="text-[10px] text-slate-500">${s.categoria} · Stock: ${s.cantidad}</div>
                    </div>
                    ${s.es_compuesto ? '<span class="text-[10px] bg-lime-400/10 text-lime-400 px-1.5 py-0.5 rounded flex-shrink-0">🧾</span>' : ''}
                  </button>`).join('')}
              </div>
            </div>

            <!-- COLUMNA DERECHA: Canvas de la receta -->
            <div class="bg-slate-950/60 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
              
              <!-- Selector de producto final -->
              <div class="p-4 border-b border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase mb-2">Producto final que vas a vender</p>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">restaurant</span>
                  <input id="recetaSearchProducto" type="text" placeholder="Escribi el nombre del producto terminado..." 
                    oninput="BuffetView._filterProductoFinal(this.value)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-lime-400 transition-colors" />
                </div>
                <div id="recetaProductoSuggestions" class="mt-1 flex flex-col gap-1 hidden"></div>
                <input type="hidden" id="recetaProductoValor" value="" />
              </div>

              <!-- Chips de insumos agregados -->
              <div class="flex-1 overflow-y-auto p-4">
                <p class="text-xs font-bold text-slate-400 uppercase mb-3">Insumos de la receta</p>
                <div id="recetaChips" class="flex flex-col gap-2 receta-canvas-empty rounded-xl p-3 min-h-[140px]">
                  <div id="recetaChipsEmpty" class="flex flex-col items-center justify-center h-24 text-slate-600 text-xs text-center">
                    <span class="material-symbols-outlined text-2xl mb-1">touch_app</span>
                    Clic en los insumos de la izquierda
                  </div>
                </div>
              </div>

              <!-- Costo en tiempo real -->
              <div id="recetaCostoBar" class="px-4 pb-3 hidden">
                <div class="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 flex items-center justify-between text-xs">
                  <span class="text-slate-400">Costo insumos: <span id="rcCosto" class="text-slate-200 font-bold">$0</span></span>
                  <span class="text-slate-400">Precio venta: <span id="rcVenta" class="text-lime-400 font-bold">$0</span></span>
                  <span id="rcMargenBadge" class="px-2 py-0.5 rounded text-xs font-bold">Margen: -</span>
                </div>
              </div>

              <!-- Botón guardar -->
              <div class="p-4 pt-0">
                <button onclick="BuffetView.saveReceta()" 
                  class="w-full py-3 rounded-xl font-bold bg-[#c3f400] text-[#161e00] hover:bg-[#d4ff1a] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-lime-400/10">
                  <span class="material-symbols-outlined">save</span>
                  Guardar Receta
                </button>
              </div>
            </div>
          </div>

          <!-- RECETAS GUARDADAS -->
          <div>
            <h5 class="text-sm font-bold text-slate-300 mb-3">Recetas activas</h5>
            <div id="recetasGuardadasList" class="text-slate-500 text-sm">
              <span class="material-symbols-outlined animate-spin text-lime-400 text-[16px]">refresh</span> Cargando...
            </div>
          </div>
        </div>
      `;
    }

    contentHtml += `
      </div>
      
      <!-- Modal Footer -->
      <div class="px-8 py-4 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3 text-xs text-slate-400">
        🛡️ canchaOS Security v2.0 • Las alteraciones de stock no autorizadas se notifican automáticamente.
      </div>
    </div>
    `;

    modal.innerHTML = contentHtml;

    if (this._activeAdminTab === 2) this.loadAuditLogs();
    if (this._activeAdminTab === 3) this.loadRecetas();
  },

  _recetaChips: [],

  _filterInsumos(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('#insumoCatalog .insumo-chip').forEach(btn => {
      const name = btn.dataset.item?.toLowerCase() || '';
      btn.style.display = name.includes(q) ? '' : 'none';
    });
  },

  _filterProductoFinal(query) {
    const q = query.toLowerCase();
    const box = document.getElementById('recetaProductoSuggestions');
    const hidden = document.getElementById('recetaProductoValor');
    if (!box) return;
    const matches = this.stockItems.filter(s => s.item.toLowerCase().includes(q) && q.length > 0);
    if (!matches.length) { box.classList.add('hidden'); hidden.value = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = matches.slice(0, 6).map(s => `
      <button onclick="BuffetView._selectProductoFinal('${s.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')" 
        class="w-full text-left px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-lime-400/50 text-xs text-slate-200 cursor-pointer flex items-center gap-2">
        <span class="material-symbols-outlined text-lime-400 text-[14px]">check_circle</span>
        ${s.item}
      </button>`).join('');
  },

  _selectProductoFinal(item) {
    const inp = document.getElementById('recetaSearchProducto');
    const hidden = document.getElementById('recetaProductoValor');
    const box = document.getElementById('recetaProductoSuggestions');
    if (inp) inp.value = item;
    if (hidden) hidden.value = item;
    if (box) box.classList.add('hidden');
    const prod = this.stockItems.find(s => s.item === item);
    document.getElementById('rcVenta').textContent = prod ? fmt.money(prod.precio_venta) : '$0';
    this._updateCostoBar();
  },

  _addChip(item) {
    const existing = this._recetaChips.find(c => c.item === item);
    if (existing) existing.qty += 1;
    else this._recetaChips.push({ item, qty: 1 });
    this._renderChips();
    this._updateCostoBar();
  },

  _removeChip(item) {
    this._recetaChips = this._recetaChips.filter(c => c.item !== item);
    this._renderChips();
    this._updateCostoBar();
  },

  _changeChipQty(item, delta) {
    const chip = this._recetaChips.find(c => c.item === item);
    if (!chip) return;
    chip.qty = Math.max(0.5, Math.round((chip.qty + delta) * 10) / 10);
    this._renderChips();
    this._updateCostoBar();
  },

  _renderChips() {
    const container = document.getElementById('recetaChips');
    if (!container) return;
    if (this._recetaChips.length === 0) {
      container.innerHTML = `<div class="flex flex-col items-center justify-center h-24 text-slate-600 text-xs text-center">Clic en los insumos de la izquierda</div>`;
      return;
    }
    container.innerHTML = this._recetaChips.map(c => `
      <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 group mb-2">
        <span class="material-symbols-outlined text-lime-400 text-[16px]">restaurant</span>
        <span class="flex-1 text-sm text-slate-200 font-semibold truncate">${c.item}</span>
        <div class="flex items-center gap-1">
          <button onclick="BuffetView._changeChipQty('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}', -0.5)" class="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700 text-[12px] font-bold">-</button>
          <span class="text-lime-400 font-bold text-sm w-8 text-center">${c.qty}</span>
          <button onclick="BuffetView._changeChipQty('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}', 0.5)" class="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700 text-[12px] font-bold">+</button>
        </div>
        <button onclick="BuffetView._removeChip('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')" class="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/30 text-red-400 flex items-center justify-center cursor-pointer border border-red-500/20"><span class="material-symbols-outlined text-[13px]">close</span></button>
      </div>`).join('');
  },

  _updateCostoBar() {
    const costo = this._recetaChips.reduce((sum, c) => {
      const insumo = this.stockItems.find(s => s.item === c.item);
      return sum + ((insumo?.precio_compra || 0) * c.qty);
    }, 0);
    const ventaEl = document.getElementById('rcVenta');
    const costoEl = document.getElementById('rcCosto');
    const badge = document.getElementById('rcMargenBadge');
    const bar = document.getElementById('recetaCostoBar');
    if (!bar) return;
    if (this._recetaChips.length > 0) bar.classList.remove('hidden');
    if (costoEl) costoEl.textContent = fmt.money(costo);
    const ventaText = ventaEl?.textContent?.replace(/[^0-9]/g, '') || '0';
    const venta = parseInt(ventaText) || 0;
    if (badge && costo > 0 && venta > 0) {
      const margen = Math.round(((venta - costo) / venta) * 100);
      badge.textContent = `Margen: ${margen}%`;
      badge.className = `px-2 py-0.5 rounded text-xs font-bold ${margen >= 30 ? 'bg-lime-400/10 text-lime-400' : margen >= 10 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`;
    }
  },

  async saveReceta() {
    const item_nombre = document.getElementById('recetaProductoValor')?.value?.trim() || document.getElementById('recetaSearchProducto')?.value?.trim();
    if (!item_nombre || this._recetaChips.length === 0) { App.toast('Completá producto e insumos ⚠️', 'error'); return; }
    const insumos = this._recetaChips.map(c => ({ insumo_nombre: c.item, cantidad_insumo: c.qty }));
    try {
      await API.saveReceta(this.sucursal, item_nombre, insumos);
      App.toast(`✅ Receta guardada!`, 'success');
      this._recetaChips = []; this._renderChips();
      this.stockItems = await DB.getStock(this.sucursal);
      await this.loadRecetas();
    } catch (e) { App.toast('Error al guardar: ' + e.message, 'error'); }
  },

  async loadRecetas() {
    const container = document.getElementById('recetasGuardadasList');
    if (!container) return;
    try {
      const recetas = await API.getRecetas(this.sucursal);
      if (!recetas || recetas.length === 0) { container.innerHTML = 'Sin recetas creadas.'; return; }
      const grouped = {};
      for (const r of recetas) { if (!grouped[r.item_nombre]) grouped[r.item_nombre] = []; grouped[r.item_nombre].push(r); }
      container.innerHTML = `<div class="grid grid-cols-2 gap-3">${Object.entries(grouped).map(([producto, items]) => {
        const costoTotal = items.reduce((sum, ing) => { const insumo = this.stockItems.find(s => s.item.toLowerCase().includes(ing.insumo_nombre.toLowerCase())); return sum + ((insumo?.precio_compra || 0) * ing.cantidad_insumo); }, 0);
        const productoEnStock = this.stockItems.find(s => s.item === producto);
        const precioVenta = productoEnStock?.precio_venta || 0;
        const margen = costoTotal > 0 && precioVenta > 0 ? Math.round(((precioVenta - costoTotal) / precioVenta) * 100) : null;
        return `<div class="bg-slate-950/60 border border-slate-700 rounded-xl p-4"><div class="flex items-start justify-between mb-3"><div><div class="font-bold text-slate-200 text-sm">${producto}</div><div class="text-xs text-slate-500">Margen: ${margen}%</div></div><button onclick="BuffetView.deleteReceta('${producto.replace(/'/g, "\\'")}')" class="text-red-400 text-xs">🗑️</button></div></div>`;
      }).join('')}</div>`;
    } catch (e) { container.innerHTML = 'Error cargando recetas.'; }
  },

  async deleteReceta(item_nombre) {
    if (!confirm(`¿Eliminar la receta de "${item_nombre}"?`)) return;
    try {
      await API.deleteReceta(this.sucursal, item_nombre);
      App.toast('Receta eliminada', 'info');
      this.stockItems = await DB.getStock(this.sucursal);
      await this.loadRecetas();
    } catch (e) { App.toast('Error al eliminar: ' + e.message, 'error'); }
  },

  async loadAuditLogs() {
    const tbody = document.getElementById('auditLogsBody');
    if (!tbody) return;

    try {
      const logs = await API.getAuditLogs(this.sucursal);
      
      if (!logs || logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="p-8 text-center text-slate-400">
              📭 Sin movimientos de auditoría registrados para esta sucursal.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = logs.map(l => {
        const dateStr = new Date(l.created_at).toLocaleString('es-AR');
        
        let typeBadge = '';
        if (l.tipo_movimiento === 'INGRESO') {
          typeBadge = '<span class="bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded text-xs font-semibold">📈 REPOSICIÓN</span>';
        } else if (l.tipo_movimiento === 'VENTA') {
          typeBadge = '<span class="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">🛒 VENTA</span>';
        } else if (l.tipo_movimiento === 'AJUSTE_PERDIDA') {
          typeBadge = '<span class="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-xs font-semibold">🚨 MERMA / PÉRDIDA</span>';
        } else {
          typeBadge = `<span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-semibold">${l.tipo_movimiento}</span>`;
        }

        const diffStr = l.diferencia > 0 ? `+${l.diferencia}` : `${l.diferencia}`;
        const diffColor = l.diferencia > 0 ? 'text-lime-400' : 'text-red-400';

        return `
          <tr class="hover:bg-slate-800/20 transition-colors">
            <td class="p-4 text-xs font-mono text-slate-400">${dateStr}</td>
            <td class="p-4 font-bold text-slate-200">${l.item_nombre}</td>
            <td class="p-4">${typeBadge}</td>
            <td class="p-4 text-center font-bold font-mono ${diffColor}">${diffStr}</td>
            <td class="p-4 text-slate-300 font-semibold">${l.usuario_nombre || 'API / System'}</td>
            <td class="p-4 text-xs italic text-slate-400 max-w-xs truncate" title="${l.motivo || ''}">${l.motivo || '—'}</td>
          </tr>
        `;
      }).join('');

    } catch (e) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-red-400">
            ❌ Error al cargar logs: ${e.message}
          </td>
        </tr>
      `;
    }
  },

  updateUnitPricePreview() {
    const packPriceInput = document.getElementById('newProdPackPrice');
    const packUnitsInput = document.getElementById('newProdPackUnits');
    const feedback = document.getElementById('unitPriceFeedback');
    
    if (!packPriceInput || !packUnitsInput || !feedback) return;
    
    const price = parseFloat(packPriceInput.value) || 0;
    const units = parseInt(packUnitsInput.value) || 1;
    
    if (units <= 0) {
      feedback.textContent = '⚠️ Las unidades por pack deben ser al menos 1';
      feedback.className = 'text-xs text-red-400 font-bold mt-1';
      return;
    }
    
    const unitPrice = price / units;
    feedback.textContent = `✨ Costo unitario calculado: $${unitPrice.toFixed(2)}`;
    feedback.className = 'text-xs text-lime-400 font-bold mt-1';
  },

  async addNewProduct() {
    const item = document.getElementById('newProdName').value.trim();
    const categoria = document.getElementById('newProdCategory').value;
    const precio_venta = parseFloat(document.getElementById('newProdPrice').value);
    const cantidad = parseInt(document.getElementById('newProdStock').value);
    const alerta_minima = parseInt(document.getElementById('newProdAlert').value || 5);

    const precio_compra_pack = parseFloat(document.getElementById('newProdPackPrice').value || 0);
    const unidades_por_pack = parseInt(document.getElementById('newProdPackUnits').value || 1);

    if (!item || isNaN(precio_venta) || isNaN(cantidad)) {
      App.toast('❌ Completá todos los campos correctamente', 'error');
      return;
    }

    if (unidades_por_pack <= 0) {
      App.toast('❌ Las unidades por pack deben ser al menos 1', 'error');
      return;
    }

    try {
      const payload = {
        sucursal: this.sucursal,
        item,
        precio_venta,
        cantidad,
        categoria,
        alerta_minima,
        precio_compra_pack,
        unidades_por_pack
      };

      await API.addProduct(payload);
      App.toast('🍔 ¡Producto agregado al inventario con éxito!', 'success');
      
      // Volver a cargar stock local
      this.stockItems = await DB.getStock(this.sucursal);
      this.setAdminTab(0); // Volver a la pestaña de control
    } catch (e) {
      App.toast('Error al agregar producto: ' + e.message, 'error');
    }
  },

  async reponerStockPrompt(stockId) {
    const prod = this.stockItems.find(s => s.id === stockId);
    if (!prod) return;

    const qtyStr = prompt(`Reponer stock de [${prod.item}]:\n¿Cuántas unidades se agregaron al buffet?`);
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      App.toast('❌ Ingresá una cantidad válida', 'error');
      return;
    }

    const motivo = prompt(`Motivo de la reposición (ej. Ariel compró stock):`, 'Reposición de stock / compra Ariel');
    if (motivo === null || motivo.trim().length < 3) {
      App.toast('❌ Se requiere un motivo válido para auditar la tarea', 'error');
      return;
    }

    try {
      await API.updateStockAudit(stockId, qty, 'INGRESO', motivo.trim());
      App.toast('📈 Stock repuesto con éxito y log guardado.', 'success');
      
      // Recargar stock y renderizar modal
      this.stockItems = await DB.getStock(this.sucursal);
      this.renderAdminModalUI();
    } catch (e) {
      App.toast('Error en reposición: ' + e.message, 'error');
    }
  },

  async ajustarStockPrompt(stockId) {
    const prod = this.stockItems.find(s => s.id === stockId);
    if (!prod) return;

    const qtyStr = prompt(`Registrar Pérdida / Ajuste de [${prod.item}]:\n¿Cuántas unidades se perdieron o retiraron?\n(Ingresá número positivo, ej. 2)`);
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr);
    if (isNaN(qty) || qty <= 0) {
      App.toast('❌ Ingresá una cantidad válida', 'error');
      return;
    }

    if (qty > prod.cantidad) {
      App.toast('❌ No podés retirar más unidades de las disponibles', 'error');
      return;
    }

    const motivo = prompt(`Motivo del retiro / pérdida (ej. Botellas rotas, vencido, consumo no registrado):`);
    if (motivo === null || motivo.trim().length < 3) {
      App.toast('❌ Se requiere un motivo válido para auditar la tarea y evitar robos', 'error');
      return;
    }

    try {
      // Registrar cantidad de cambio negativa
      await API.updateStockAudit(stockId, -qty, 'AJUSTE_PERDIDA', motivo.trim());
      App.toast('🚨 Pérdida/Ajuste registrado en el historial inmutable.', 'warning');
      
      // Recargar stock y renderizar modal
      this.stockItems = await DB.getStock(this.sucursal);
      this.renderAdminModalUI();
    } catch (e) {
      App.toast('Error al ajustar stock: ' + e.message, 'error');
    }
  }
};

