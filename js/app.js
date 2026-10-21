// ==========================================================================
// GYNAEQ PUBLIC STOREFRONT CONTROLLER
// Complete B2B/B2C Medical Equipment Catalog & RFQ Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.gynaeqStore;
  await store.init();

  // DOM Elements
  const productGridEl = document.getElementById('product-grid');
  const bentoGridEl = document.getElementById('bento-grid');
  const filterPillsEl = document.getElementById('category-filter-pills');
  const brandFilterEl = document.getElementById('brand-filter');
  const sortFilterEl = document.getElementById('sort-filter');
  const stockFilterEl = document.getElementById('stock-filter');
  const resultsCountEl = document.getElementById('results-count');
  const searchInputEl = document.getElementById('header-search-input');
  const searchDropdownEl = document.getElementById('search-dropdown');
  const cartBadgeEls = document.querySelectorAll('.cart-badge');
  const compareBadgeEls = document.querySelectorAll('.compare-badge');
  const rfqDrawerEl = document.getElementById('rfq-drawer-backdrop');
  const cartItemsListEl = document.getElementById('cart-items-list');
  const quickviewBackdropEl = document.getElementById('quickview-backdrop');
  const compareTrayEl = document.getElementById('compare-tray');
  const compareModalEl = document.getElementById('compare-modal-backdrop');

  // Format Currency
  function formatAED(amount) {
    if (!amount) return 'Contact for Quote';
    return 'AED ' + Number(amount).toLocaleString('en-US');
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? '#10B981' : '#F59E0B'}" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ─── CATEGORY SPECIALIZED SVG ICONS ──────────────────────────────────────
  const CATEGORY_ICONS = {
    'ultrasound': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H10a2 2 0 0 1 2 2v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V4"/><path d="M14 6a5 5 0 0 1 5 5"/><path d="M14 2a9 9 0 0 1 9 9"/><circle cx="8" cy="18" r="3"/></svg>`,
    'fetal-monitoring': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.5 9h3l2-3 2.5 6 2-4 1.5 2h4"/></svg>`,
    'colposcopy': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/><line x1="3" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="21" y2="12"/></svg>`,
    'beds-chairs': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h20"/><path d="M4 18v-5a2 2 0 0 1 2-2h4l4 3h6a2 2 0 0 1 2 2v2"/><path d="M6 11V7a2 2 0 0 1 2-2h2"/><circle cx="6" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>`,
    'electrosurgery': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    'surgical-hysteroscopy': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 7 3-3a2.12 2.12 0 1 1 3 3l-3 3"/><path d="m5 16 6-6"/><path d="m2 22 4-4"/><circle cx="12" cy="12" r="3"/><path d="M8 8a6 6 0 0 1 8 8"/></svg>`,
    'ivf-fertility': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 4 3 7 8 12 5-5 8-8 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="10" r="1"/></svg>`,
    'consumables': `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`
  };

  // ─── RENDER BENTO CATEGORIES ─────────────────────────────────────────────
  function renderBentoCategories() {
    if (!bentoGridEl) return;
    const categories = store.getCategories();
    bentoGridEl.innerHTML = categories.map(cat => {
      const accent = cat.accentColor || '#E11D48';
      const glow = cat.ambientGlow || 'rgba(225, 29, 72, 0.15)';
      const bg = cat.accentBg || '#F8FAFC';

      return `
        <div class="category-card bento-card" data-category="${cat.id}">
          <!-- Top Illustrative Visual Stage -->
          <div class="category-card-stage" style="--stage-accent: ${accent}; --stage-bg: ${bg}; --stage-glow: ${glow};">
            <div class="category-stage-ambient"></div>
            <div class="category-card-top-pill" style="color: ${accent}; background: ${accent}14; border-color: ${accent}28;">
              ${cat.badge || 'Hospital Division'}
            </div>
            <div class="category-image-wrap">
              <img src="${cat.image || '/assets/ultrasound.jpg'}" alt="${cat.name}" loading="lazy" class="category-device-artwork">
            </div>
          </div>

          <!-- Body Details -->
          <div class="category-card-body">
            <h3 class="category-card-title">${cat.name}</h3>
            <p class="category-card-desc">${cat.shortDesc}</p>
          </div>

          <!-- Interactive Action Footer -->
          <div class="category-card-footer">
            <div class="category-cta-btn">
              <span>Explore ${cat.name.split(' ')[0]}</span>
              <span class="category-cta-circle">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Click Category to Navigate to Dedicated Category Page
    bentoGridEl.querySelectorAll('.bento-card').forEach(card => {
      card.addEventListener('click', () => {
        const catId = card.getAttribute('data-category');
        window.location.href = `/category?id=${catId}`;
      });
    });

    // Category Slider Navigation Controls
    const catSliderPrev = document.getElementById('category-slider-prev');
    const catSliderNext = document.getElementById('category-slider-next');

    if (catSliderPrev && catSliderNext) {
      catSliderPrev.onclick = () => {
        const firstCard = bentoGridEl.firstElementChild;
        const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 320;
        bentoGridEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      };

      catSliderNext.onclick = () => {
        const firstCard = bentoGridEl.firstElementChild;
        const scrollAmount = firstCard ? firstCard.offsetWidth + 24 : 320;
        bentoGridEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      };
    }
  }

  // ─── RENDER FILTER PILLS ─────────────────────────────────────────────────
  function renderFilterPills() {
    if (!filterPillsEl) return;
    const categories = store.getCategories();
    filterPillsEl.innerHTML = `
      <button class="filter-pill active" data-category="all">All Equipment (${store.getProducts().length})</button>
      ${categories.map(cat => `
        <button class="filter-pill" data-category="${cat.id}">${cat.name} (${cat.count})</button>
      `).join('')}
    `;

    filterPillsEl.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.getAttribute('data-category');
        store.filters.category = cat;
        updateFilterPills(cat);
        renderProducts();
      });
    });
  }

  function updateFilterPills(activeCat) {
    if (!filterPillsEl) return;
    filterPillsEl.querySelectorAll('.filter-pill').forEach(pill => {
      if (pill.getAttribute('data-category') === activeCat) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
  }

  // ─── RENDER BRAND DROPDOWN ───────────────────────────────────────────────
  function renderBrandDropdown() {
    if (!brandFilterEl) return;
    const brands = store.getBrands();
    brandFilterEl.innerHTML = `
      <option value="all">All Global Brands</option>
      ${brands.map(b => `
        <option value="${b.id}">${b.name} (${b.origin})</option>
      `).join('')}
    `;
    brandFilterEl.addEventListener('change', (e) => {
      store.filters.brand = e.target.value;
      renderProducts();
    });
  }

  // ─── RENDER PRODUCTS ─────────────────────────────────────────────────────
  function renderProducts() {
    if (!productGridEl) return;
    const products = store.getFilteredProducts();

    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${products.length} medical machines`;
    }

    if (products.length === 0) {
      productGridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 24px; text-align: center; background: #FFFFFF; border-radius: var(--radius-outer-xl); border: 1px dashed var(--border-hairline);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--color-navy-900); margin-bottom: 8px;">No matching equipment found</h3>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 20px;">Try clearing filters or search for another obstetric or gynecological system.</p>
          <button id="btn-clear-filters" class="btn-primary" style="margin: 0 auto;">Clear All Filters</button>
        </div>
      `;
      document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
        store.filters = { category: 'all', brand: 'all', search: '', stockOnly: false, sort: 'featured' };
        if (brandFilterEl) brandFilterEl.value = 'all';
        if (stockFilterEl) stockFilterEl.checked = false;
        if (searchInputEl) searchInputEl.value = '';
        updateFilterPills('all');
        renderProducts();
      });
      return;
    }

    productGridEl.innerHTML = products.map(p => {
      const isCompared = store.compareList.includes(p.id);
      const specsList = Object.entries(p.specifications || {}).slice(0, 3);

      return `
        <div class="product-card bezel-outer" data-id="${p.id}">
          <div class="product-card-inner bezel-inner">
            <div class="product-card-media">
              <span class="product-badge-tag ${p.badge ? 'product-badge-primary' : ''}">${p.badge || 'CE Certified'}</span>
              <label class="product-compare-checkbox">
                <input type="checkbox" class="compare-toggle" data-id="${p.id}" ${isCompared ? 'checked' : ''}>
                Compare
              </label>
              <a href="/product?id=${p.id}" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">
                <img src="${p.image}" alt="${p.title}" loading="lazy">
              </a>
            </div>

            <div style="flex: 1; display: flex; flex-direction: column;">
              <div class="product-meta-row">
                <span class="product-brand">${p.brand}</span>
                <span class="product-sku">${p.sku}</span>
              </div>

              <h3 class="product-title" title="${p.title}">
                <a href="/product?id=${p.id}" style="color: inherit;">${p.title}</a>
              </h3>

              <ul class="product-specs-list">
                ${specsList.map(([key, val]) => `
                  <li class="product-specs-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span><strong>${key}:</strong> ${val}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="product-card-footer">
              <div class="product-pricing-row">
                <div class="product-price-box">
                  <span class="product-price-label">Official UAE Price</span>
                  <span class="product-price-value">${p.callForPrice ? 'Contact For Quote' : formatAED(p.price)}</span>
                </div>
                <div class="product-stock-status">
                  <span class="stock-indicator-dot"></span>
                  <span>In Stock (Dubai)</span>
                </div>
              </div>

              <div class="product-card-actions">
                <button class="btn-card-rfq" data-add-rfq="${p.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  <span>Request Quote</span>
                </button>
                <a href="/product?id=${p.id}" class="btn-card-quickview" title="View Full Specifications">
                  <span>Details &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach Event Listeners to Buttons
    productGridEl.querySelectorAll('[data-quickview]').forEach(btn => {
      btn.addEventListener('click', () => {
        openQuickView(btn.getAttribute('data-quickview'));
      });
    });

    productGridEl.querySelectorAll('[data-add-rfq]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-add-rfq');
        store.addToCart(id, 1);
        const p = store.getProductById(id);
        showToast(`Added ${p?.sku} to your official RFQ Quote Cart!`);
        openRFQDrawer();
      });
    });

    productGridEl.querySelectorAll('.compare-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = chk.getAttribute('data-id');
        store.toggleCompare(id);
        renderCompareTray();
      });
    });
  }

  // ─── LIVE SEARCH & AUTOCOMPLETE ──────────────────────────────────────────
  if (searchInputEl && searchDropdownEl) {
    searchInputEl.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      store.filters.search = q;

      if (q.length < 2) {
        searchDropdownEl.classList.remove('active');
        searchDropdownEl.innerHTML = '';
        renderProducts();
        return;
      }

      const matched = store.getProducts().filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      ).slice(0, 5);

      if (matched.length > 0) {
        searchDropdownEl.innerHTML = matched.map(p => `
          <div class="search-item" data-id="${p.id}">
            <img src="${p.image}" class="search-thumb" alt="${p.title}">
            <div class="search-item-info">
              <div class="search-item-title">${p.title}</div>
              <div class="search-item-meta">${p.brand} &bull; ${p.sku} &bull; <strong style="color: var(--color-primary);">${p.callForPrice ? 'Quote' : formatAED(p.price)}</strong></div>
            </div>
          </div>
        `).join('');
        searchDropdownEl.classList.add('active');

        searchDropdownEl.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            searchDropdownEl.classList.remove('active');
            openQuickView(id);
          });
        });
      } else {
        searchDropdownEl.innerHTML = `<div style="padding: 12px; font-size: 0.85rem; color: var(--color-text-muted); text-align: center;">No equipment matching "${q}"</div>`;
        searchDropdownEl.classList.add('active');
      }

      renderProducts();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!searchInputEl.contains(e.target) && !searchDropdownEl.contains(e.target)) {
        searchDropdownEl.classList.remove('active');
      }
    });
  }

  // Stock Filter
  if (stockFilterEl) {
    stockFilterEl.addEventListener('change', (e) => {
      store.filters.stockOnly = e.target.checked;
      renderProducts();
    });
  }

  // Sort Filter
  if (sortFilterEl) {
    sortFilterEl.addEventListener('change', (e) => {
      store.filters.sort = e.target.value;
      renderProducts();
    });
  }

  // ─── RFQ SLIDE-OVER DRAWER CONTROLLER ────────────────────────────────────
  function updateCartCounters() {
    const count = store.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadgeEls.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }

  function renderCartDrawer() {
    if (!cartItemsListEl) return;
    if (store.cart.length === 0) {
      cartItemsListEl.innerHTML = `
        <div style="text-align: center; padding: 48px 12px;">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: #F1F5F9; color: var(--color-text-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h4 style="font-family: var(--font-heading); font-weight: 700; color: var(--color-navy-900); margin-bottom: 6px;">Your RFQ Cart is Empty</h4>
          <p style="font-size: 0.85rem; color: var(--color-text-muted);">Add medical machines or clinic consumables from the catalog to request a formal hospital quotation.</p>
        </div>
      `;
      document.getElementById('rfq-submit-container')?.classList.add('hidden');
      return;
    }

    document.getElementById('rfq-submit-container')?.classList.remove('hidden');

    cartItemsListEl.innerHTML = store.cart.map(item => {
      const p = store.getProductById(item.productId);
      if (!p) return '';
      return `
        <div class="cart-item-card">
          <img src="${p.image}" class="cart-item-thumb" alt="${p.title}">
          <div class="cart-item-info">
            <h4 class="cart-item-title">${p.title}</h4>
            <div class="cart-item-sku">${p.brand} &bull; ${p.sku}</div>
            <div class="cart-qty-row">
              <button class="qty-btn" data-qty-minus="${p.id}">-</button>
              <span class="qty-number">${item.quantity}</span>
              <button class="qty-btn" data-qty-plus="${p.id}">+</button>
              <span class="cart-item-remove" data-remove="${p.id}">Remove</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Cart Quantity Buttons
    cartItemsListEl.querySelectorAll('[data-qty-plus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qty-plus');
        const item = store.cart.find(i => i.productId === id);
        if (item) store.updateCartQuantity(id, item.quantity + 1);
      });
    });

    cartItemsListEl.querySelectorAll('[data-qty-minus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qty-minus');
        const item = store.cart.find(i => i.productId === id);
        if (item && item.quantity > 1) store.updateCartQuantity(id, item.quantity - 1);
      });
    });

    cartItemsListEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        store.removeFromCart(id);
      });
    });

    const totalEst = store.getCartTotal();
    const estEl = document.getElementById('rfq-cart-estimate');
    if (estEl) estEl.textContent = totalEst > 0 ? formatAED(totalEst) : 'Subject to Formal Review';
  }

  function openRFQDrawer() {
    renderCartDrawer();
    rfqDrawerEl?.classList.add('active');
  }

  function closeRFQDrawer() {
    rfqDrawerEl?.classList.remove('active');
  }

  document.querySelectorAll('[data-trigger-rfq-drawer]').forEach(btn => {
    btn.addEventListener('click', openRFQDrawer);
  });

  document.getElementById('close-rfq-drawer')?.addEventListener('click', closeRFQDrawer);
  rfqDrawerEl?.addEventListener('click', (e) => {
    if (e.target === rfqDrawerEl) closeRFQDrawer();
  });

  // Handle RFQ Form Submission
  const rfqForm = document.getElementById('rfq-submission-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(rfqForm);

      const itemsRequested = store.cart.map(i => {
        const p = store.getProductById(i.productId);
        return `${p?.title} (Qty: ${i.quantity}, SKU: ${p?.sku})`;
      }).join('; ');

      const rfqPayload = {
        facilityName: formData.get('facilityName'),
        contactName: formData.get('contactName'),
        role: formData.get('role'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        city: formData.get('city') || 'Dubai',
        country: 'UAE',
        productRequested: itemsRequested || 'Direct Catalog Equipment Inquiries',
        quantity: store.cart.reduce((s, i) => s + i.quantity, 0),
        estimatedBudget: store.getCartTotal(),
        urgency: formData.get('urgency') || 'Immediate',
        notes: formData.get('notes') || '',
        status: 'New',
        priority: 'High',
        assignedTo: 'Fuhad (Super Admin)'
      };

      const btnSubmit = rfqForm.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Transmitting to Biomedical Team...';
      }

      await store.submitRFQ(rfqPayload);

      showToast(`RFQ successfully submitted! Reference RFQ generated. Our team will contact you within 2 hours.`);
      store.clearCart();
      rfqForm.reset();
      closeRFQDrawer();

      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Submit Formal RFQ Request';
      }
    });
  }

  // ─── QUICK VIEW MODAL CONTROLLER ─────────────────────────────────────────
  function openQuickView(productId) {
    const p = store.getProductById(productId);
    if (!p || !quickviewBackdropEl) return;

    const modalBody = quickviewBackdropEl.querySelector('.quickview-modal-content');
    if (!modalBody) return;

    const specsRows = Object.entries(p.specifications || {}).map(([k, v]) => `
      <tr>
        <td class="spec-key">${k}</td>
        <td class="spec-val">${v}</td>
      </tr>
    `).join('');

    const certPills = (p.certifications || []).map(c => `
      <span style="display: inline-block; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-pill); margin-right: 6px; margin-bottom: 6px;">
        ✓ ${c}
      </span>
    `).join('');

    modalBody.innerHTML = `
      <div class="quickview-grid">
        <div class="quickview-media-box">
          <img src="${p.image}" alt="${p.title}">
        </div>
        <div class="quickview-content">
          <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.8rem; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
            ${p.brand} &bull; ${p.categoryName}
          </div>
          <h2 class="quickview-title">${p.title}</h2>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 12px;">SKU: ${p.sku}</div>
          
          <div class="quickview-price-tag">
            ${p.callForPrice ? 'Contact for Official Quote' : formatAED(p.price)}
          </div>

          <div style="margin-bottom: 14px;">
            ${certPills}
          </div>

          <p style="font-size: 0.95rem; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 18px;">
            ${p.shortDesc}
          </p>

          <table class="specs-table">
            <tbody>
              ${specsRows}
            </tbody>
          </table>

          <div style="display: flex; gap: 12px; margin-top: auto;">
            <button class="btn-primary" id="btn-quickview-add-rfq" style="flex: 1; justify-content: center;">
              Add to Official RFQ
            </button>
            <a href="https://wa.me/971508921100?text=Hello%20Gynaeq,%20I%20am%20inquiring%20about%20${encodeURIComponent(p.title)}%20(SKU:%20${p.sku})" target="_blank" class="btn-secondary" style="justify-content: center;">
              WhatsApp Specialist
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-quickview-add-rfq')?.addEventListener('click', () => {
      store.addToCart(p.id, 1);
      quickviewBackdropEl.classList.remove('active');
      showToast(`Added ${p.sku} to your official RFQ!`);
      openRFQDrawer();
    });

    quickviewBackdropEl.classList.add('active');
  }

  document.getElementById('close-quickview-btn')?.addEventListener('click', () => {
    quickviewBackdropEl?.classList.remove('active');
  });

  quickviewBackdropEl?.addEventListener('click', (e) => {
    if (e.target === quickviewBackdropEl) quickviewBackdropEl.classList.remove('active');
  });

  // ─── COMPARISON TRAY CONTROLLER ──────────────────────────────────────────
  function renderCompareTray() {
    if (!compareTrayEl) return;
    const count = store.compareList.length;

    compareBadgeEls.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });

    if (count === 0) {
      compareTrayEl.style.display = 'none';
      return;
    }

    compareTrayEl.style.display = 'flex';
    const itemsContainer = document.getElementById('compare-tray-items');
    if (itemsContainer) {
      itemsContainer.innerHTML = store.compareList.map(id => {
        const p = store.getProductById(id);
        if (!p) return '';
        return `
          <div style="display: flex; align-items: center; gap: 8px; background: #FFFFFF; padding: 4px 10px; border-radius: var(--radius-pill); border: 1px solid var(--border-hairline);">
            <img src="${p.image}" style="width: 24px; height: 24px; object-fit: contain;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-navy-900); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</span>
            <button style="color: var(--color-text-muted); cursor: pointer; font-size: 0.9rem;" data-remove-compare="${p.id}">&times;</button>
          </div>
        `;
      }).join('');

      itemsContainer.querySelectorAll('[data-remove-compare]').forEach(b => {
        b.addEventListener('click', () => {
          store.removeFromCompare(b.getAttribute('data-remove-compare'));
          renderProducts();
          renderCompareTray();
        });
      });
    }
  }

  const handleOpenCompare = () => {
    if (store.compareList.length < 2) {
      showToast('Please select at least 2 medical systems to compare specifications.', 'warning');
      return;
    }
    openCompareModal();
  };

  document.getElementById('btn-open-compare-modal')?.addEventListener('click', handleOpenCompare);
  document.getElementById('btn-open-compare-tray-btn')?.addEventListener('click', handleOpenCompare);

  function openCompareModal() {
    if (!compareModalEl) return;
    const modalContent = document.getElementById('compare-modal-content');
    if (!modalContent) return;

    const products = store.compareList.map(id => store.getProductById(id)).filter(Boolean);

    // Collect all spec keys
    const allKeys = new Set();
    products.forEach(p => {
      Object.keys(p.specifications || {}).forEach(k => allKeys.add(k));
    });

    modalContent.innerHTML = `
      <div style="overflow-x: auto; padding: 24px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr>
              <th style="padding: 14px; background: #F8FAFC; border-bottom: 2px solid var(--border-hairline); width: 220px;">Specification</th>
              ${products.map(p => `
                <th style="padding: 14px; background: #FFFFFF; border-bottom: 2px solid var(--border-hairline); vertical-align: top; text-align: center;">
                  <img src="${p.image}" style="height: 120px; object-fit: contain; margin: 0 auto 10px;">
                  <div style="font-family: var(--font-heading); font-weight: 800; font-size: 0.95rem; color: var(--color-navy-900);">${p.title}</div>
                  <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 6px;">${p.sku}</div>
                  <div style="font-family: var(--font-heading); font-weight: 800; color: var(--color-primary);">${p.callForPrice ? 'Quote' : formatAED(p.price)}</div>
                  <button class="btn-card-rfq" style="margin-top: 10px; width: 100%; justify-content: center;" onclick="window.gynaeqStore.addToCart('${p.id}', 1); document.getElementById('compare-modal-backdrop').classList.remove('active');">
                    Add to Quote
                  </button>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px 14px; font-weight: 700; background: #F8FAFC; border-bottom: 1px solid var(--border-subtle);">Brand / Manufacturer</td>
              ${products.map(p => `<td style="padding: 10px 14px; text-align: center; border-bottom: 1px solid var(--border-subtle);">${p.brand}</td>`).join('')}
            </tr>
            <tr>
              <td style="padding: 10px 14px; font-weight: 700; background: #F8FAFC; border-bottom: 1px solid var(--border-subtle);">Official Warranty</td>
              ${products.map(p => `<td style="padding: 10px 14px; text-align: center; border-bottom: 1px solid var(--border-subtle); color: var(--color-success); font-weight: 600;">${p.warranty}</td>`).join('')}
            </tr>
            ${Array.from(allKeys).map(k => `
              <tr>
                <td style="padding: 10px 14px; font-weight: 700; background: #F8FAFC; border-bottom: 1px solid var(--border-subtle);">${k}</td>
                ${products.map(p => `
                  <td style="padding: 10px 14px; text-align: center; border-bottom: 1px solid var(--border-subtle);">
                    ${p.specifications && p.specifications[k] ? p.specifications[k] : '—'}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    compareModalEl.classList.add('active');
  }

  document.getElementById('close-compare-modal-btn')?.addEventListener('click', () => {
    compareModalEl?.classList.remove('active');
  });

  compareModalEl?.addEventListener('click', (e) => {
    if (e.target === compareModalEl) compareModalEl.classList.remove('active');
  });

  // ─── REACTIVE STORE SUBSCRIPTIONS ────────────────────────────────────────
  store.on('cart:updated', () => {
    updateCartCounters();
    renderCartDrawer();
  });

  store.on('compare:updated', () => {
    renderCompareTray();
  });

  store.on('products:updated', () => {
    renderProducts();
  });

  // ─── FASTONMED HERO PRODUCT IMAGE ROTATOR & INTERACTIVE SHOWCASE ────────
  function initHeroProductShowcase() {
    const imgEl = document.getElementById('hero-product-img');
    const linkEl = document.getElementById('hero-product-link');
    const titleEl = document.getElementById('hero-product-title');
    const descEl = document.getElementById('hero-product-desc');
    const divisionEl = document.getElementById('hero-product-division');
    const stockEl = document.getElementById('hero-product-stock');
    const btnEl = document.getElementById('hero-product-btn');
    const categoryBadgeEl = document.getElementById('showcase-category-badge');
    const dotsEl = document.getElementById('hero-showcase-dots');
    const prevBtn = document.getElementById('hero-showcase-prev');
    const nextBtn = document.getElementById('hero-showcase-next');
    const showcaseCard = document.querySelector('.hero-showcase-card');
    const skuEl = document.getElementById('hero-product-sku');
    const counterCurrEl = document.getElementById('hero-counter-curr');
    const hudTextEl = document.getElementById('hero-hud-text');
    const stageTitleEl = document.getElementById('hero-stage-product-title');
    const specChipsEl = document.getElementById('hero-spec-chips');

    if (!imgEl) return;

    if (!prevBtn && !dotsEl) {
      imgEl.src = '/assets/products/ventilator.png';
      imgEl.alt = 'Best Medical Equipment Supplier in UAE';
      return;
    }

    const heroProducts = [
      {
        id: 'electric-gynaecology-examination-chair',
        name: 'Electric Gynaecology Examination Chair',
        shortName: 'Exam Chair',
        sku: 'REF: GYN-ELC-200',
        division: 'CLINICAL FURNITURE',
        badge: 'Specialty Flagship',
        hud: 'Motorized 3-Actuator Memory',
        specs: ['Dual Memory Actuators', 'Ergonomic Leg Crutches', 'Wireless Remote'],
        desc: 'Motorized multi-position ergonomics with dual actuator memory & integrated leg supports.',
        image: '/assets/products/electric-gynaecology-examination-chair.jpg',
        href: '/product/electric-gynaecology-examination-chair',
        stock: 'Dubai Warehouse Ready'
      },
      {
        id: 'edan-c6a-video-colposcope',
        name: 'EDAN C6A HD Video Colposcope',
        shortName: 'Colposcope',
        sku: 'REF: EDN-C6A-PRO',
        division: 'CERVICAL SCREENING',
        badge: 'Diagnostic Precision',
        hud: 'Sony CMOS · 24x Optical Zoom',
        specs: ['Sony 4K Sensor', 'Multi-Step 24x Zoom', 'Green Filter R-Way'],
        desc: 'Sony optical sensor with multi-step magnification, green filter & clinical R-way evaluation.',
        image: '/assets/products/edan-c6a-video-colposcope.png',
        href: '/product/edan-c6a-video-colposcope',
        stock: 'MoHAP Registered'
      },
      {
        id: 'aveus-av-classic-3-fetal-monitor',
        name: 'Aveus AV Classic 3 Fetal & Maternal Monitor',
        shortName: 'Fetal CTG',
        sku: 'REF: AV-CTG-300',
        division: 'MATERNITY MONITORING',
        badge: 'Ward Core Hardware',
        hud: '12.1" TFT · Twin Telemetry',
        specs: ['Twin CTG Telemetry', 'Auto Fischer Scoring', 'Built-in Printer'],
        desc: '12.1" Wide color TFT screen with twin CTG telemetry & automated Fischer score analysis.',
        image: '/assets/products/aveus-av-classic-3-fetal-monitor.png',
        href: '/product/aveus-av-classic-3-fetal-monitor',
        stock: '24h Delivery Dubai'
      },
      {
        id: 'basco-india-cryo-004-deluxe-cryosurgical-system-for-gynaecology-general-surgery-ent-dermatology',
        name: 'Basco Cryo-004 Deluxe Cryosurgical System',
        shortName: 'Cryo-004',
        sku: 'REF: BSC-CRYO-04',
        division: 'SURGICAL & LEAP',
        badge: 'Operative Suite',
        hud: 'Non-Electric N2O/CO2 System',
        specs: ['Instant Defrost System', 'Gold-Plated Probes', 'Integrated Gauge'],
        desc: 'Non-electric N2O/CO2 cryo unit with instant defrost, pressure gauge & specialized gold probes.',
        image: '/assets/products/basco-india-cryo-004-deluxe-cryosurgical-system-for-gynaecology-general-surgery-ent-dermatology.webp',
        href: '/product/basco-india-cryo-004-deluxe-cryosurgical-system-for-gynaecology-general-surgery-ent-dermatology',
        stock: 'In Stock · CE Certified'
      },
      {
        id: 'askir-c30-professional-electric-surgical-suction-machine-ca-mi',
        name: 'Askir C30 Professional Surgical Suction Unit',
        shortName: 'Suction Unit',
        sku: 'REF: CAMI-C30-PRO',
        division: 'THEATRE & ASPIRATION',
        badge: 'Italian Precision',
        hud: '40 L/min Continuous Flow',
        specs: ['Dual Autoclavable Jars', 'High-Flow 40L/min', 'CA-MI Made in Italy'],
        desc: 'High-flow 40L/min continuous suction pump with dual autoclavable collection jars.',
        image: '/assets/products/askir-c30-professional-electric-surgical-suction-machine-ca-mi.png',
        href: '/product/askir-c30-professional-electric-surgical-suction-machine-ca-mi',
        stock: 'CA-MI Italy · In Stock'
      },
      {
        id: 'tsunlandscope-portable-electronic',
        name: 'Tsunlandscope Portable Electronic Colposcope',
        shortName: 'Handheld',
        sku: 'REF: TSU-POC-01',
        division: 'POINT-OF-CARE DIAGNOSTICS',
        badge: 'Portable Diagnostic',
        hud: '2.5M CMOS · Polarized LED',
        specs: ['Polarized LED Ring', 'Live HDMI/USB Feed', 'Ergonomic Grip'],
        desc: 'High-resolution handheld video colposcope with polarized LED ring & live HDMI/USB feed.',
        image: '/assets/products/tsunlandscope-portable-electronic.png',
        href: '/product/tsunlandscope-portable-electronic',
        stock: 'Dubai Showroom Unit'
      }
    ];

    let currentIndex = 0;
    let autoPlayTimer = null;
    let isHovered = false;
    const AUTOPLAY_DURATION = 4800;

    // Render Segmented Switcher Controls
    if (dotsEl) {
      dotsEl.innerHTML = heroProducts.map((p, idx) => `
        <button type="button" class="showcase-segment-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="View ${p.name}">
          <span class="showcase-segment-num">0${idx + 1}</span>
          <span class="showcase-segment-label">${p.shortName || p.name.split(' ')[0]}</span>
          <div class="showcase-segment-progress">
            <span class="showcase-segment-progress-fill"></span>
          </div>
        </button>
      `).join('');

      dotsEl.querySelectorAll('.showcase-segment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetIdx = Number(btn.getAttribute('data-index'));
          showProduct(targetIdx);
          restartTimer();
        });
      });
    }

    function animateProgress() {
      if (!dotsEl) return;
      dotsEl.querySelectorAll('.showcase-segment-progress-fill').forEach((fill, i) => {
        if (i === currentIndex) {
          fill.style.transition = 'none';
          fill.style.width = '0%';
          void fill.offsetWidth; // force reflow
          if (!isHovered) {
            fill.style.transition = `width ${AUTOPLAY_DURATION}ms linear`;
            fill.style.width = '100%';
          }
        } else {
          fill.style.transition = 'none';
          fill.style.width = '0%';
        }
      });
    }

    function showProduct(index) {
      currentIndex = (index + heroProducts.length) % heroProducts.length;
      const product = heroProducts[currentIndex];

      // Re-trigger animation on image
      imgEl.style.animation = 'none';
      void imgEl.offsetWidth; // force reflow
      imgEl.src = product.image;
      imgEl.alt = product.name;
      imgEl.style.animation = 'heroImgFadeIn 0.45s cubic-bezier(0.32, 0.72, 0, 1)';

      if (linkEl) linkEl.href = product.href;
      if (titleEl) titleEl.textContent = product.name;
      if (descEl) descEl.textContent = product.desc;
      if (divisionEl) divisionEl.textContent = product.division;
      if (categoryBadgeEl) categoryBadgeEl.textContent = product.badge || 'Featured Clinical Hardware';
      if (skuEl) skuEl.textContent = product.sku || `REF: GYN-0${currentIndex + 1}`;
      if (counterCurrEl) counterCurrEl.textContent = '0' + (currentIndex + 1);
      if (hudTextEl) hudTextEl.textContent = product.hud || product.division;
      if (stageTitleEl) stageTitleEl.textContent = product.name;

      if (specChipsEl && product.specs) {
        specChipsEl.innerHTML = product.specs.map(spec => `
          <span class="showcase-mini-chip">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${spec}
          </span>
        `).join('');
      }

      if (stockEl) {
        stockEl.innerHTML = `<span class="stock-indicator"></span> ${product.stock}`;
      }
      if (btnEl) btnEl.href = product.href;

      // Update Active Segment Button
      if (dotsEl) {
        dotsEl.querySelectorAll('.showcase-segment-btn').forEach((btn, i) => {
          btn.classList.toggle('active', i === currentIndex);
        });
      }

      animateProgress();
    }

    function nextProduct() {
      showProduct(currentIndex + 1);
    }

    function prevProduct() {
      showProduct(currentIndex - 1);
    }

    // Arrow Nav Handlers
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.preventDefault();
        prevProduct();
        restartTimer();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        nextProduct();
        restartTimer();
      };
    }

    // Timer Management
    function startTimer() {
      stopTimer();
      animateProgress();
      autoPlayTimer = setInterval(() => {
        if (!isHovered) {
          nextProduct();
        }
      }, AUTOPLAY_DURATION);
    }

    function stopTimer() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function restartTimer() {
      stopTimer();
      startTimer();
    }

    // Pause on hover so the user can easily read or click
    if (showcaseCard) {
      showcaseCard.addEventListener('mouseenter', () => {
        isHovered = true;
        // Pause current progress bar
        if (dotsEl) {
          const activeFill = dotsEl.querySelector('.showcase-segment-btn.active .showcase-segment-progress-fill');
          if (activeFill) {
            const computedWidth = window.getComputedStyle(activeFill).width;
            activeFill.style.transition = 'none';
            activeFill.style.width = computedWidth;
          }
        }
      });

      showcaseCard.addEventListener('mouseleave', () => {
        isHovered = false;
        restartTimer();
      });
    }

    // Initial load
    showProduct(0);
    startTimer();
  }

  // Initial Boot
  initHeroProductShowcase();
  renderBentoCategories();
  renderFilterPills();
  renderBrandDropdown();
  renderProducts();
  updateCartCounters();
  renderCompareTray();
});
