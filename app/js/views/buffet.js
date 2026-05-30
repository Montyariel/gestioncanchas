// ===== VISTA: BUFFET / STOCK PREMIM POS =====
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
    
    // Loader de diseño premium
    container.innerHTML = `
      <div class="absolute inset-0 flex items-center justify-center bg-surface">
        <div class="skeleton" style="width:360px;height:360px;border-radius:24px"></div>
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
    <style>
      /* Liquid Hover Animation */
      @keyframes waveRise {
        0% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(180deg); }
        100% { transform: translateY(0) rotate(360deg); }
      }
      @keyframes bubbleFloat {
        0% { transform: translateY(20px) scale(0.3); opacity: 0; }
        30% { opacity: 0.8; }
        80% { opacity: 0.4; }
        100% { transform: translateY(-160px) scale(1.1); opacity: 0; }
      }
      .liquid-bg {
        position: absolute;
        inset: 0;
        overflow: hidden;
        z-index: 1;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .group:hover .liquid-bg {
        opacity: 1;
      }
      .liquid-wave-1 {
        position: absolute;
        bottom: -70%; left: -50%;
        width: 200%; height: 200%;
        background: rgba(16, 185, 129, 0.08);
        border-radius: 38%;
        animation: waveRise 7s infinite linear;
      }
      .liquid-wave-2 {
        position: absolute;
        bottom: -75%; left: -45%;
        width: 190%; height: 190%;
        background: rgba(0, 227, 253, 0.05);
        border-radius: 42%;
        animation: waveRise 11s infinite linear;
      }
      .bubble-1 { position: absolute; bottom: 0; left: 20%; width: 6px; height: 6px; background: rgba(16,185,129,0.3); border-radius: 50%; animation: bubbleFloat 4s infinite ease-in; }
      .bubble-2 { position: absolute; bottom: 0; left: 50%; width: 4px; height: 4px; background: rgba(0,227,253,0.3); border-radius: 50%; animation: bubbleFloat 3s infinite ease-in; animation-delay: 1.5s; }
      .bubble-3 { position: absolute; bottom: 0; left: 75%; width: 8px; height: 8px; background: rgba(16,185,129,0.25); border-radius: 50%; animation: bubbleFloat 5s infinite ease-in; animation-delay: 0.8s; }

      /* Spring Easing Elastic Cart Sidebar */
      .spring-cart {
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      
      /* Bento combo card premium shine */
      .bento-glow-purple {
        background: linear-gradient(135deg, rgba(30, 27, 46, 0.95), rgba(17, 19, 25, 0.98));
        box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05);
        border: 1px solid rgba(156, 240, 255, 0.1);
      }
      .bento-glow-purple:hover {
        border-color: #00e3fd;
        box-shadow: 0 20px 45px rgba(0, 227, 253, 0.15);
      }
      .bento-glow-lime {
        background: linear-gradient(135deg, rgba(29, 32, 26, 0.95), rgba(17, 19, 25, 0.98));
        box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05);
        border: 1px solid rgba(16, 185, 129, 0.1);
      }
      .bento-glow-lime:hover {
        border-color: #10B981;
        box-shadow: 0 20px 45px rgba(16, 185, 129, 0.15);
      }
    </style>

    <div class="absolute inset-0 flex bg-background overflow-hidden">
      <!-- Catalog Area (Touch POS Grid) -->
      <div class="flex-1 overflow-y-auto p-8 md:p-12">
        <header class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="font-h1 text-h1 text-on-surface mb-1 flex items-center gap-2">
              <span class="material-symbols-outlined text-[#10B981] text-4xl">local_pizza</span>
              Buffet &amp; Bar
            </h2>
            <p class="text-on-surface-variant text-sm font-medium">Despacho táctil exprés de bebidas, minutas y combos. Sincronización inmutable.</p>
          </div>
          <button onclick="BuffetView.openAdminModal()" class="flex items-center gap-2 bg-[#10B981] text-[#0B0F19] hover:bg-emerald-400 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer border-none font-body-md active:scale-95">
            <span class="material-symbols-outlined" style="font-size: 20px;">inventory_2</span>
            Auditar Inventario
          </button>
        </header>

        <!-- Offline Alert Banner -->
        <div id="offlineStockAlert" class="hidden mb-6 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl px-5 py-3 text-sm flex items-center gap-2.5 animate-pulse">
          <span class="material-symbols-outlined text-[20px]">wifi_off</span>
          <span><strong>Modo Resiliente Offline Activo:</strong> Estás sin conexión a internet. Podés reponer o vender stock normalmente, las operaciones se guardarán localmente y se sincronizarán al recuperar la señal.</span>
        </div>

        <!-- Quick Order Presets (Futuristic Bento Grid) -->
        <section class="mb-12">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-[#10B981] text-[18px]">bolt</span>
            Combos Promocionales Nico
          </h3>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Combo 1 (2/3 size) -->
            <div onclick="BuffetView.addPreset('Third Half Combo')" class="lg:col-span-2 relative rounded-3xl overflow-hidden group cursor-pointer bento-glow-lime transition-all duration-300 h-64 flex flex-col justify-end">
              <img alt="Pizza y Cerveza" class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 opacity-45" src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop"/>
              <div class="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/70 to-transparent z-10"></div>
              
              <div class="relative z-20 p-6 w-full flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                  <span class="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-full mb-2 inline-block border border-[#10B981]/20 tracking-wider">EL PREFERIDO DE BELGRANO/LANUS</span>
                  <h4 class="text-2xl font-black text-on-surface leading-tight mb-1">Combo 3er Tiempo 🍻🍕</h4>
                  <p class="text-xs text-on-surface-variant font-medium">6 Cervezas heladas Quilmes/Brahma + 1 Pizza Grande de Muzzarella al horno.</p>
                </div>
                <button class="bg-[#10B981] text-[#0B0F19] px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-[#10B981]/10">
                  Agregar combo
                </button>
              </div>
            </div>
            
            <!-- Combo 2 (1/3 size) -->
            <div onclick="BuffetView.addPreset('Recovery Pack')" class="lg:col-span-1 relative rounded-3xl overflow-hidden group cursor-pointer bento-glow-purple transition-all duration-300 h-64 flex flex-col justify-end">
              <img alt="Gatorade" class="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 opacity-45" src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop"/>
              <div class="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/70 to-transparent z-10"></div>
              
              <div class="relative z-20 p-6 w-full flex flex-col justify-between h-full text-left">
                <span class="text-[9px] font-bold text-[#00e3fd] bg-[#00e3fd]/10 px-2.5 py-1 rounded-full border border-[#00e3fd]/20 tracking-wider self-start">POST-PARTIDO</span>
                <div>
                  <h4 class="text-xl font-black text-on-surface mb-1">Pack Recuperación ⚡🥤</h4>
                  <p class="text-xs text-on-surface-variant font-medium mb-3">2 Gatorade/Powerade frías + 1 Alfajor Jorgito.</p>
                  <button class="w-full bg-slate-800 text-slate-200 hover:text-white border border-slate-700 py-2 rounded-xl font-bold text-xs hover:border-[#00e3fd] transition-all">
                    Cargar Pack
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Category Nav -->
        <div class="flex gap-2 md:gap-4 mb-8 border-b border-slate-800/80 pb-3 overflow-x-auto">
          <button onclick="BuffetView.setCategory('all')" class="pb-2 px-3 transition-all cursor-pointer border-none bg-transparent ${this._activeCategory === 'all' ? 'font-bold text-[#10B981] border-b-2 border-[#10B981]' : 'text-slate-500 hover:text-slate-200'}">Todos</button>
          <button onclick="BuffetView.setCategory('drinks')" class="pb-2 px-3 transition-all cursor-pointer border-none bg-transparent ${this._activeCategory === 'drinks' ? 'font-bold text-[#10B981] border-b-2 border-[#10B981]' : 'text-slate-500 hover:text-slate-200'}">Bebidas y Cervezas 🥤🍻</button>
          <button onclick="BuffetView.setCategory('snacks')" class="pb-2 px-3 transition-all cursor-pointer border-none bg-transparent ${this._activeCategory === 'snacks' ? 'font-bold text-[#10B981] border-b-2 border-[#10B981]' : 'text-slate-500 hover:text-slate-200'}">Minutas y Snacks 🍔🍫</button>
          <button onclick="BuffetView.setCategory('pizzas')" class="pb-2 px-3 transition-all cursor-pointer border-none bg-transparent ${this._activeCategory === 'pizzas' ? 'font-bold text-[#10B981] border-b-2 border-[#10B981]' : 'text-slate-500 hover:text-slate-200'}">Pizzas 🍕</button>
        </div>

        <!-- Catalog Grid (Tactile POS Style) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="buffetCatalogGrid">
          <!-- Items will be injected here -->
        </div>
      </div>

      <!-- Cart Sidebar (Spring Drawer) -->
      <aside class="w-[360px] bg-slate-950 border-l border-slate-800 flex flex-col shadow-[-15px_0_35px_rgba(0,0,0,0.7)] z-10 spring-cart" id="buffetCartSidebar">
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
    if (n.includes('hamburguesa')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop';
    if (n.includes('pancho') || n.includes('hotdog')) return 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?q=80&w=600&auto=format&fit=crop';
    if (n.includes('picada')) return 'https://images.unsplash.com/photo-1541014741259-df5290dbb2f7?q=80&w=600&auto=format&fit=crop';
    
    if (n.includes('coca') || n.includes('cola')) return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop';
    if (n.includes('sprite')) return 'https://images.unsplash.com/photo-1625772290748-160b2a603897?q=80&w=600&auto=format&fit=crop';
    if (n.includes('gatorade') || n.includes('powerade') || n.includes('isoton')) return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=600&auto=format&fit=crop';
    if (n.includes('red bull') || n.includes('energy') || n.includes('speed')) return 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600&auto=format&fit=crop';
    if (n.includes('agua')) return 'https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=600&auto=format&fit=crop';
    
    if (n.includes('alfajor') || n.includes('jorgito')) return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?q=80&w=600&auto=format&fit=crop';
    if (n.includes('cerveza') || n.includes('quilmes') || n.includes('heineken') || n.includes('brahma')) return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=600&auto=format&fit=crop';
    if (n.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop';
    if (n.includes('pelota')) return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
  },

  renderCatalog() {
    const grid = document.getElementById('buffetCatalogGrid');
    if (!grid) return;

    if (!this.stockItems.length) {
      grid.innerHTML = `<div class="col-span-full p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">Sin stock cargado en esta sucursal</div>`;
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
      grid.innerHTML = `<div class="col-span-full p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">Sin productos disponibles en esta categoría</div>`;
      return;
    }

    grid.innerHTML = filtered.map(s => {
      const isCritical = s.cantidad < 5;
      const isOut = s.cantidad <= 0;
      
      const stockBadge = isOut 
        ? `<div class="absolute top-3 right-3 bg-red-600/90 text-white backdrop-blur-sm px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider">AGOTADO ❌</div>`
        : isCritical 
          ? `<div class="absolute top-3 right-3 bg-red-500/20 border border-red-500/30 text-red-400 backdrop-blur-sm px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider animate-pulse">STOCK CRÍTICO: ${s.cantidad}</div>`
          : `<div class="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 text-slate-300 backdrop-blur-sm px-2.5 py-1 rounded-md font-bold text-[9px] uppercase tracking-wider">${s.cantidad} EN STOCK</div>`;

      // Check if drink to add Liquid Animation in background
      const isDrink = s.item.toLowerCase().includes('coke') || s.item.toLowerCase().includes('coca') || s.item.toLowerCase().includes('cola') || s.item.toLowerCase().includes('gatorade') || s.item.toLowerCase().includes('cerveza') || s.item.toLowerCase().includes('beer') || s.item.toLowerCase().includes('agua') || s.item.toLowerCase().includes('powerade') || s.item.toLowerCase().includes('sprite') || s.item.toLowerCase().includes('fanta');

      return `
      <div class="relative bg-slate-900/60 rounded-3xl overflow-hidden border border-slate-800/80 hover:border-[#10B981]/40 flex flex-col group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-[#10B981]/5 hover:translate-y-[-4px] active:scale-[0.98]" onclick="BuffetView.addToCart(${s.id})">
        
        <!-- Liquid Sloshing Container (only for drinks) -->
        ${isDrink ? `
          <div class="liquid-bg">
            <div class="liquid-wave-1"></div>
            <div class="liquid-wave-2"></div>
            <div class="bubble-1"></div>
            <div class="bubble-2"></div>
            <div class="bubble-3"></div>
          </div>
        ` : ''}

        <!-- Product Image -->
        <div class="h-44 overflow-hidden relative bg-slate-950">
          <img alt="${s.item}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOut ? 'grayscale opacity-30' : ''}" src="${this.getImg(s.item)}"/>
          ${stockBadge}
        </div>

        <!-- Info -->
        <div class="p-5 flex-1 flex flex-col relative z-10 bg-slate-900/40">
          <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">${s.categoria.toUpperCase()}</span>
          <h4 class="text-md font-black text-slate-100 leading-tight mb-2 group-hover:text-[#10B981] transition-colors line-clamp-1" title="${s.item}">${s.item}</h4>
          
          <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/60">
            <span class="text-lg font-black text-slate-100 font-mono">${fmt.money(s.precio_venta)}</span>
            
            <button ${isOut ? 'disabled' : ''} class="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 group-hover:bg-[#10B981] group-hover:text-[#0B0F19] group-hover:border-[#10B981] transition-all cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">add</span>
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
        <div class="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
          <span class="material-symbols-outlined text-[54px] mb-4 text-[#10B981]/40">shopping_cart</span>
          <p class="font-bold text-sm text-slate-400">El mostrador está vacío</p>
          <p class="text-xs mt-1.5 opacity-70">Tocá los productos del catálogo a la izquierda para cargarlos.</p>
        </div>
      `;
    } else {
      itemsHtml = `<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">` + this.cart.map((item, index) => {
        total += item.precio_venta * item.qty;
        return `
        <!-- Cart Item -->
        <div class="flex items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/60">
          <div class="w-12 h-12 rounded-xl bg-slate-950 overflow-hidden flex-shrink-0">
            <img alt="${item.item}" class="w-full h-full object-cover" src="${this.getImg(item.item)}"/>
          </div>
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-bold text-slate-200 leading-snug truncate">${item.item}</h5>
            <span class="text-xs font-mono font-bold text-[#10B981] mt-0.5 block">${fmt.money(item.precio_venta)}</span>
          </div>
          <div class="flex items-center gap-1.5 bg-slate-950/80 rounded-xl border border-slate-800 p-1">
            <button onclick="BuffetView.updateQty(${index}, -1); event.stopPropagation();" class="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
              <span class="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span class="text-xs font-bold font-mono w-5 text-center text-slate-100">${item.qty}</span>
            <button onclick="BuffetView.updateQty(${index}, 1); event.stopPropagation();" class="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-800 text-slate-400 cursor-pointer border-none bg-transparent">
              <span class="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
        </div>
        `;
      }).join('') + `</div>`;
    }

    sidebar.innerHTML = `
      <div class="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
        <h2 class="text-md font-bold text-slate-200 flex items-center gap-2">
          <span class="material-symbols-outlined text-[#10B981]">shopping_cart</span>
          Pedido en Marcha
        </h2>
        <span class="bg-[#10B981]/10 text-[#10B981] font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-[#10B981]/20">${totalItems} items</span>
      </div>
      
      ${itemsHtml}
      
      <div class="p-5 bg-slate-950 border-t border-slate-800/80">
        <div class="mb-4">
          <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Destino de Entrega</label>
          <div class="relative mb-3">
            <select id="buffetDeliveryTarget" class="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-[#10B981] cursor-pointer">
              <option value="bar">Recoge en Mostrador del Bar 🏟️</option>
              <option value="cancha1">Enviar a Cancha 1 ⚽</option>
              <option value="cancha2">Enviar a Cancha 2 ⚽</option>
              <option value="cancha3">Enviar a Cancha 3 ⚽</option>
            </select>
          </div>
          
          <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Medio de Pago</label>
          <div class="relative">
            <select id="buffetMetodoPago" class="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 outline-none focus:border-[#10B981] cursor-pointer">
              <option value="Efectivo">💵 Efectivo Físico</option>
              <option value="Mercado Pago">📱 Mercado Pago</option>
              <option value="Transferencia">⚡ Transferencia Bancaria</option>
              <option value="Débito">💳 Tarjeta Débito</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-end mb-5 pt-3 border-t border-slate-800/50">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Total del Pedido</span>
          <span class="text-2xl font-black text-slate-100 font-mono leading-none">${fmt.money(total)}</span>
        </div>

        <button onclick="BuffetView.checkout()" ${totalItems === 0 ? 'disabled' : ''} class="w-full bg-[#10B981] text-[#0B0F19] font-bold py-3.5 rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-[#10B981]/10 disabled:opacity-30 disabled:pointer-events-none font-h3 text-sm">
          <span class="material-symbols-outlined text-[18px] font-bold">check_circle</span>
          Confirmar Venta y Despachar
        </button>
      </div>
    `;
  },

  addToCart(id) {
    const stockItem = this.stockItems.find(s => s.id === id);
    if (!stockItem || stockItem.cantidad <= 0) {
      App.toast('Producto agotado en el stock ⚠️', 'error');
      return;
    }

    const existing = this.cart.find(c => c.id === id);
    if (existing) {
      if (existing.qty < stockItem.cantidad) {
        existing.qty++;
      } else {
        App.toast('Stock disponible insuficiente ❌', 'error');
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
      App.toast('Stock disponible insuficiente ❌', 'error');
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
        return itemLower.includes('cerveza') || itemLower.includes('quilmes') || itemLower.includes('heineken') || itemLower.includes('brahma') || itemLower.includes('lager');
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
        return itemLower.includes('alfajor') || itemLower.includes('jorgito') || itemLower.includes('barra') || itemLower.includes('snack');
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
    if (btn) btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[16px]">refresh</span> Procesando...`;

    try {
      const total = this.cart.reduce((sum, item) => sum + item.precio_venta * item.qty, 0);

      // Despachar cada item de forma segura
      for (const item of this.cart) {
        await API.ventaBuffet(this.sucursal, item.item, item.qty);
      }
      
      // Registrar el ingreso en la Caja Diaria activa
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
          console.warn("No hay caja abierta. Venta guardada sin asentar en el arqueo.");
          App.toast("⚠️ Venta realizada, pero la Caja está cerrada. Abrí el turno de caja para asentar ingresos.", "error");
        }
      } catch (errCaja) {
        console.error("Error registrando en caja:", errCaja);
      }

      App.toast(`✅ ¡Venta registrada y descontada del stock: ${fmt.money(total)}!`, 'success');
      
      this.cart = [];
      this.stockItems = await DB.getStock(this.sucursal);
      
      this.renderCatalog();
      this.renderCart();
    } catch(e) {
      App.toast('Error al procesar la venta: ' + e.message, 'error');
      if (btn) btn.innerHTML = `<span class="material-symbols-outlined">send</span> Place Order`;
    }
  },

  // ============================================================
  // ADMIN DE INVENTARIO SEGURO (MODAL + AUDITORÍA HISTÓRICA)
  // ============================================================
  
  _activeAdminTab: 0, 
  
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

    // Estructura de cabecera y tabs del modal administrativo
    let contentHtml = `
    <div class="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
      <!-- Modal Header -->
      <div class="px-8 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-lime-400 text-3xl">shield_person</span>
          <div>
            <h3 class="text-xl font-bold text-slate-100 font-h2">Auditoría de Buffet</h3>
            <p class="text-xs text-slate-400">canchaOS Control de Pérdidas &amp; Abastecimiento Seguro</p>
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
          📋 Historial Seguro
        </button>
        <button onclick="BuffetView.setAdminTab(3)" class="flex-1 py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer border-none ${this._activeAdminTab === 3 ? 'text-lime-400 border-lime-400 bg-lime-400/5' : 'text-slate-400 border-transparent bg-transparent hover:text-slate-200'}">
          🧾 Recetas de Buffet
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
            <h4 class="text-md font-bold text-slate-200">Inventario en Sede ${this.sucursal.toUpperCase()}</h4>
            <span class="text-xs text-slate-400">Los cambios de inventario manual requerirán especificar un motivo.</span>
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
                      <span class="px-2.5 py-1 rounded font-bold ${critical ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'} font-mono">
                        ${s.cantidad}
                      </span>
                    </td>
                    <td class="p-4 text-right font-bold text-[#10B981] font-mono">${fmt.money(s.precio_venta)}</td>
                    <td class="p-4">
                      <div class="flex gap-2 justify-center">
                        <button onclick="BuffetView.reponerStockPrompt(${s.id})" class="px-3 py-1.5 rounded-lg bg-[#10B981] text-[#0B0F19] font-bold text-xs hover:bg-[#34D399] active:scale-95 transition-all border-none cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">add</span> Reponer
                        </button>
                        <button onclick="BuffetView.ajustarStockPrompt(${s.id})" class="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs hover:bg-red-500/30 active:scale-95 transition-all cursor-pointer flex items-center gap-1">
                          <span class="material-symbols-outlined text-[14px]">remove</span> Pérdida / Mermas
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
              <input type="text" id="newProdName" placeholder="Gaseosa Coca-Cola 500ml, Panes de hamburguesa, etc." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Categoría</label>
              <select id="newProdCategory" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors outline-none cursor-pointer">
                <option value="Drinks">Drinks (Bebidas)</option>
                <option value="Snacks">Snacks (Minutas)</option>
                <option value="Pizzas">Pizzas</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Precio de Venta ($)</label>
              <input type="number" id="newProdPrice" placeholder="Precio venta en ARS" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Stock Inicial</label>
              <input type="number" id="newProdStock" value="10" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase mb-2">Alerta Stock Mínimo</label>
              <input type="number" id="newProdAlert" value="5" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
            </div>

            <!-- Costeo Inteligente por Pack -->
            <div class="col-span-2 p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-3">
              <h5 class="text-xs font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px]">inventory_2</span> 
                Costeo Inteligente por Pack (Wholesale)
              </h5>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Precio de Compra del Pack ($)</label>
                  <input type="number" id="newProdPackPrice" placeholder="Ej: 2400" min="0" step="any" oninput="BuffetView.updateUnitPricePreview()" class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Unidades por Pack</label>
                  <input type="number" id="newProdPackUnits" value="1" min="1" oninput="BuffetView.updateUnitPricePreview()" class="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#10B981] transition-colors" />
                </div>
              </div>
              <p id="unitPriceFeedback" class="text-xs text-[#10B981] font-bold mt-1">
                Costo unitario calculado: $0.00
              </p>
            </div>
          </div>

          <button onclick="BuffetView.addNewProduct()" class="w-full py-3.5 mt-4 rounded-xl font-bold bg-[#10B981] text-[#0B0F19] hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none font-body-md shadow-lg shadow-[#10B981]/10">
            <span class="material-symbols-outlined">save</span>
            Registrar Producto en Inventario
          </button>
        </div>
      `;
    }

    // --- TAB 2: AUDITORÍA HISTÓRICA ---
    else if (this._activeAdminTab === 2) {
      contentHtml += `
        <div class="flex flex-col gap-6">
          <div class="flex justify-between items-center">
            <h4 class="text-md font-bold text-slate-200">Historial Seguro de Auditoría - Sede ${this.sucursal.toUpperCase()}</h4>
            <span class="flex items-center gap-1.5 text-xs text-[#10B981] bg-[#10B981]/10 px-3 py-1.5 rounded-full border border-[#10B981]/20">
              <span class="material-symbols-outlined text-[14px]">lock</span> Inalterable
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
                    <span class="material-symbols-outlined animate-spin text-[#10B981] mb-2">refresh</span><br>
                    Cargando logs del historial seguro...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // --- TAB 3: RECETAS DE BUFFET ---
    else if (this._activeAdminTab === 3) {
      contentHtml += `
        <style>
          .insumo-chip { transition: all 0.15s ease; }
          .insumo-chip:hover { transform: scale(1.02); }
          .receta-canvas-empty { border: 2px dashed rgba(16,185,129,0.2); }
          #recetaSearchInsumo:focus { border-color: #10B981; }
          #recetaSearchProducto:focus { border-color: #10B981; }
        </style>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="text-md font-bold text-slate-200">🧾 Constructor de Recetas</h4>
              <p class="text-xs text-slate-400 mt-0.5">Buscá el producto final y asociá los insumos del mostrador para deducirlos del stock automáticamente al vender.</p>
            </div>
          </div>

          <!-- BUILDER: 2 COLUMNAS -->
          <div class="grid grid-cols-2 gap-4" style="min-height:360px">

            <!-- COLUMNA IZQUIERDA: Catálogo de insumos -->
            <div class="bg-slate-950/60 border border-slate-700 rounded-xl flex flex-col overflow-hidden">
              <div class="p-4 border-b border-slate-800">
                <p class="text-xs font-bold text-slate-400 uppercase mb-2">Insumos disponibles</p>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[18px]">search</span>
                  <input id="recetaSearchInsumo" type="text" placeholder="Buscar insumo..." 
                    oninput="BuffetView._filterInsumos(this.value)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-[#10B981] transition-colors" />
                </div>
              </div>
              <div id="insumoCatalog" class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                ${this.stockItems.map(s => `
                  <button 
                    class="insumo-chip w-full flex items-center gap-3 px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 text-left cursor-pointer"
                    data-item="${s.item.replace(/"/g,'&quot;')}"
                    onclick="BuffetView._addChip('${s.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')"
                  >
                    <span class="material-symbols-outlined text-slate-500 text-[16px]">add_circle</span>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs font-semibold text-slate-200 truncate">${s.item}</div>
                      <div class="text-[10px] text-slate-500">${s.categoria} · Stock: ${s.cantidad}</div>
                    </div>
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
                  <input id="recetaSearchProducto" type="text" placeholder="Escribí el producto terminado..." 
                    oninput="BuffetView._filterProductoFinal(this.value)"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-[#10B981] transition-colors" />
                </div>
                <div id="recetaProductoSuggestions" class="mt-1 flex flex-col gap-1 hidden"></div>
                <input type="hidden" id="recetaProductoValor" value="" />
              </div>

              <!-- Chips de insumos agregados -->
              <div class="flex-1 overflow-y-auto p-4">
                <p class="text-xs font-bold text-slate-400 uppercase mb-3">Insumos asociados</p>
                <div id="recetaChips" class="flex flex-col gap-2 receta-canvas-empty rounded-xl p-3 min-h-[120px]">
                  <div id="recetaChipsEmpty" class="flex flex-col items-center justify-center h-20 text-slate-600 text-xs text-center">
                    <span class="material-symbols-outlined text-xl mb-1">touch_app</span>
                    Asociá insumos del lateral izquierdo
                  </div>
                </div>
              </div>

              <!-- Costo en tiempo real -->
              <div id="recetaCostoBar" class="px-4 pb-3 hidden">
                <div class="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center justify-between text-xs">
                  <span class="text-slate-400">Costo insumos: <span id="rcCosto" class="text-slate-200 font-bold">$0</span></span>
                  <span class="text-slate-400">Venta: <span id="rcVenta" class="text-[#10B981] font-bold">$0</span></span>
                  <span id="rcMargenBadge" class="px-2 py-0.5 rounded text-xs font-bold">Margen: -</span>
                </div>
              </div>

              <!-- Botón guardar -->
              <div class="p-4 pt-0">
                <button onclick="BuffetView.saveReceta()" 
                  class="w-full py-3 rounded-xl font-bold bg-[#10B981] text-[#0B0F19] hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-[#10B981]/10">
                  <span class="material-symbols-outlined">save</span>
                  Guardar Receta
                </button>
              </div>
            </div>
          </div>

          <!-- RECETAS GUARDADAS -->
          <div>
            <h5 class="text-sm font-bold text-slate-300 mb-3">Recetas activas en base</h5>
            <div id="recetasGuardadasList" class="text-slate-500 text-sm">
              <span class="material-symbols-outlined animate-spin text-[#10B981] text-[16px]">refresh</span> Cargando...
            </div>
          </div>
        </div>
      `;
    }

    contentHtml += `
      </div>
      
      <!-- Modal Footer -->
      <div class="px-8 py-4 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3 text-xs text-slate-400">
        🛡️ CanchaControl Security v2.0 • Las alteraciones de stock no autorizadas se notifican automáticamente.
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
        class="w-full text-left px-3 py-2 rounded bg-slate-900 border border-slate-800 hover:border-[#10B981]/50 text-xs text-slate-200 cursor-pointer flex items-center gap-2">
        <span class="material-symbols-outlined text-[#10B981] text-[14px]">check_circle</span>
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
      container.innerHTML = `<div class="flex flex-col items-center justify-center h-20 text-slate-600 text-xs text-center">Asociá insumos del lateral izquierdo</div>`;
      return;
    }
    container.innerHTML = this._recetaChips.map(c => `
      <div class="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 group mb-2">
        <span class="material-symbols-outlined text-[#10B981] text-[16px]">restaurant</span>
        <span class="flex-1 text-xs text-slate-200 font-semibold truncate">${c.item}</span>
        <div class="flex items-center gap-1">
          <button onclick="BuffetView._changeChipQty('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}', -0.5)" class="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700 text-[12px] font-bold border-none">-</button>
          <span class="text-[#10B981] font-bold text-xs w-6 text-center">${c.qty}</span>
          <button onclick="BuffetView._changeChipQty('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}', 0.5)" class="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700 text-[12px] font-bold border-none">+</button>
        </div>
        <button onclick="BuffetView._removeChip('${c.item.replace(/'/g,"\\'").replace(/"/g,'&quot;')}')" class="w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/30 text-red-400 flex items-center justify-center cursor-pointer border border-red-500/20 border-none"><span class="material-symbols-outlined text-[13px]">close</span></button>
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
      container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${Object.entries(grouped).map(([producto, items]) => {
        const costoTotal = items.reduce((sum, ing) => { const insumo = this.stockItems.find(s => s.item.toLowerCase().includes(ing.insumo_nombre.toLowerCase())); return sum + ((insumo?.precio_compra || 0) * ing.cantidad_insumo); }, 0);
        const productoEnStock = this.stockItems.find(s => s.item === producto);
        const precioVenta = productoEnStock?.precio_venta || 0;
        const margen = costoTotal > 0 && precioVenta > 0 ? Math.round(((precioVenta - costoTotal) / precioVenta) * 100) : null;
        return `<div class="bg-slate-950/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between"><div class="min-w-0 flex-1"><div class="font-bold text-slate-200 text-xs truncate">${producto}</div><div class="text-[10px] text-slate-500">Costo: ${fmt.money(costoTotal)} · Margen: ${margen}%</div></div><button onclick="BuffetView.deleteReceta('${producto.replace(/'/g, "\\'")}')" class="text-red-400 hover:text-red-300 text-sm border-none bg-transparent cursor-pointer ml-2">🗑️</button></div>`;
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
            <td colspan="6" class="p-8 text-center text-slate-400 text-xs">
              📭 Sin movimientos de auditoría registrados para esta sucursal.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = logs.slice(0, 100).map(l => {
        const dateStr = new Date(l.created_at).toLocaleString('es-AR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'});
        
        let typeBadge = '';
        if (l.tipo_movimiento === 'INGRESO') {
          typeBadge = '<span class="bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded text-[10px] font-bold border border-lime-400/15">📈 REPOSICIÓN</span>';
        } else if (l.tipo_movimiento === 'VENTA') {
          typeBadge = '<span class="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/15">🛒 VENTA</span>';
        } else if (l.tipo_movimiento === 'AJUSTE_PERDIDA') {
          typeBadge = '<span class="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/15">🚨 MERMA</span>';
        } else {
          typeBadge = `<span class="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">${l.tipo_movimiento}</span>`;
        }

        const diffStr = l.diferencia > 0 ? `+${l.diferencia}` : `${l.diferencia}`;
        const diffColor = l.diferencia > 0 ? 'text-lime-400' : 'text-red-400';

        return `
          <tr class="hover:bg-slate-800/20 transition-colors">
            <td class="p-3 text-[11px] font-mono text-slate-500">${dateStr}</td>
            <td class="p-3 font-bold text-slate-200 text-xs">${l.item_nombre}</td>
            <td class="p-3">${typeBadge}</td>
            <td class="p-3 text-center font-bold font-mono text-xs ${diffColor}">${diffStr}</td>
            <td class="p-3 text-slate-300 text-xs">${l.usuario_nombre || 'API / Sistema'}</td>
            <td class="p-3 text-[11px] italic text-slate-500 truncate max-w-[150px]" title="${l.motivo || ''}">${l.motivo || '—'}</td>
          </tr>
        `;
      }).join('');

    } catch (e) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-red-400 text-xs">
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
      
      this.stockItems = await DB.getStock(this.sucursal);
      this.setAdminTab(0); 
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
      App.toast('❌ Se requiere un motivo válido para auditar la tarea y evitar pérdidas no registradas', 'error');
      return;
    }

    try {
      await API.updateStockAudit(stockId, -qty, 'AJUSTE_PERDIDA', motivo.trim());
      App.toast('🚨 Pérdida/Ajuste registrado en el historial inmutable.', 'warning');
      
      this.stockItems = await DB.getStock(this.sucursal);
      this.renderAdminModalUI();
    } catch (e) {
      App.toast('Error al ajustar stock: ' + e.message, 'error');
    }
  }
};
