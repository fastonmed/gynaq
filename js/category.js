// ==========================================================================
// GYNAEQ Category Page Controller (Ecomus Fashion/Luxury Architecture)
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await store.init();

  const urlParams = new URLSearchParams(window.location.search);
  let catId = urlParams.get('id');

  if (!catId) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1 && pathParts[0] === 'category') {
      catId = pathParts[1];
    }
  }

  // Default to first category if none specified
  const categories = store.getCategories();
  if (!catId && categories.length > 0) {
    catId = categories[0].id;
  }

  const activeCategory = categories.find(c => c.id === catId) || categories[0];

  // 1. Set Page Meta Title & Breadcrumb
  document.title = `${activeCategory.name} Medical Equipment | GYNAEQ UAE`;
  const metaDesc = document.getElementById('category-page-desc');
  if (metaDesc) {
    metaDesc.content = `${activeCategory.name} official UAE catalog, authorized hospital distributor, CE/FDA certification, and Dubai warehouse delivery.`;
  }

  const bcName = document.getElementById('bc-cat-name');
  if (bcName) bcName.textContent = activeCategory.name;

  // 2. Populate Hero Banner
  const titleEl = document.getElementById('cat-title');
  if (titleEl) titleEl.textContent = activeCategory.name;

  const descEl = document.getElementById('cat-desc');
  if (descEl) {
    descEl.textContent = activeCategory.shortDesc || activeCategory.description || 'Specialized gynecological and maternal diagnostics medical equipment authorized for UAE hospitals and clinics.';
  }

  // 3. Render Subcategory Horizontal Switcher Pills (Ecomus Style)
  const switcherEl = document.getElementById('cat-switcher-pills');
  if (switcherEl) {
    switcherEl.innerHTML = `
      <a href="/shop" class="ecomus-subcat-pill">All Equipment (${store.getProducts().length})</a>
      ${categories.map(c => `
        <a href="/category?id=${c.id}" class="ecomus-subcat-pill ${c.id === activeCategory.id ? 'active' : ''}">
          ${c.name} (${c.count})
        </a>
      `).join('')}
    `;
  }

  // 4. Filter State
  let selectedBrands = [];
  let inStockOnly = false;
  let selectedCerts = [];
  let currentSort = 'featured';
  let currentGrid = 'grid-4col';

  const gridEl = document.getElementById('cat-product-grid');
  const countBadgeEl = document.getElementById('cat-count-badge');
  const resultsCountEl = document.getElementById('cat-results-count');
  const sortSelect = document.getElementById('cat-sort-select');
  const activeChipsContainer = document.getElementById('active-chips-container');
  const activeFilterCountBadge = document.getElementById('active-filter-count');

  // Filter Drawer elements
  const filterDrawerBackdrop = document.getElementById('filter-drawer-backdrop');
  const btnToggleDrawer = document.getElementById('btn-toggle-filter-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-filter-drawer');
  const btnApplyDrawer = document.getElementById('btn-apply-drawer-filters');
  const btnResetDrawer = document.getElementById('btn-reset-drawer-filters');
  const drawerCategoriesList = document.getElementById('drawer-categories-list');
  const drawerBrandsList = document.getElementById('drawer-brands-list');
  const drawerStockCheckbox = document.getElementById('drawer-filter-stock');
  const drawerStockCount = document.getElementById('drawer-stock-count');

  // Drawer Toggle Handlers
  function openFilterDrawer() {
    filterDrawerBackdrop?.classList.add('active');
  }
  function closeFilterDrawer() {
    filterDrawerBackdrop?.classList.remove('active');
  }

  btnToggleDrawer?.addEventListener('click', openFilterDrawer);
  btnCloseDrawer?.addEventListener('click', closeFilterDrawer);
  filterDrawerBackdrop?.addEventListener('click', (e) => {
    if (e.target === filterDrawerBackdrop) closeFilterDrawer();
  });

  // Populate Drawer Categories
  if (drawerCategoriesList) {
    drawerCategoriesList.innerHTML = categories.map(c => `
      <a href="/category?id=${c.id}" class="ecomus-filter-item" style="text-decoration: none; font-weight: ${c.id === activeCategory.id ? '700; color: var(--beco-primary);' : 'normal;'}">
        <span>${c.id === activeCategory.id ? '● ' : ''}${c.name}</span>
        <span class="ecomus-filter-count">${c.count}</span>
      </a>
    `).join('');
  }

  // Populate Drawer Brands
  const categoryProducts = store.getProducts().filter(p => p.categoryId === activeCategory.id);
  const brandIds = [...new Set(categoryProducts.map(p => p.brandId))];
  const relevantBrands = store.getBrands().filter(b => brandIds.includes(b.id));

  if (drawerBrandsList) {
    drawerBrandsList.innerHTML = relevantBrands.map(b => {
      const count = categoryProducts.filter(p => p.brandId === b.id).length;
      return `
        <label class="ecomus-filter-item">
          <span>
            <input type="checkbox" class="drawer-brand-cb" value="${b.id}" ${selectedBrands.includes(b.id) ? 'checked' : ''}>
            ${b.name}
          </span>
          <span class="ecomus-filter-count">${count}</span>
        </label>
      `;
    }).join('');

    drawerBrandsList.querySelectorAll('.drawer-brand-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedBrands.push(cb.value);
        } else {
          selectedBrands = selectedBrands.filter(id => id !== cb.value);
        }
      });
    });
  }

  if (drawerStockCount) {
    drawerStockCount.textContent = categoryProducts.filter(p => p.inStock).length;
  }

  // Stock and cert event listeners in drawer
  drawerStockCheckbox?.addEventListener('change', (e) => {
    inStockOnly = e.target.checked;
  });

  document.querySelectorAll('.drawer-cert-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedCerts = Array.from(document.querySelectorAll('.drawer-cert-cb:checked')).map(c => c.value);
    });
  });

  btnApplyDrawer?.addEventListener('click', () => {
    closeFilterDrawer();
    renderFilteredList();
  });

  btnResetDrawer?.addEventListener('click', () => {
    selectedBrands = [];
    inStockOnly = false;
    selectedCerts = [];
    if (drawerStockCheckbox) drawerStockCheckbox.checked = false;
    document.querySelectorAll('.drawer-brand-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('.drawer-cert-cb').forEach(cb => cb.checked = false);
    closeFilterDrawer();
    renderFilteredList();
  });

  // Sort Dropdown
  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderFilteredList();
  });

  // Grid Switchers (Ecomus Signature)
  const btnGrid3 = document.getElementById('btn-grid-3col');
  const btnGrid4 = document.getElementById('btn-grid-4col');
  const btnGridList = document.getElementById('btn-grid-list');

  function setGridMode(mode) {
    currentGrid = mode;
    [btnGrid3, btnGrid4, btnGridList].forEach(b => b?.classList.remove('active'));
    if (mode === 'grid-3col') btnGrid3?.classList.add('active');
    if (mode === 'grid-4col') btnGrid4?.classList.add('active');
    if (mode === 'grid-list') btnGridList?.classList.add('active');

    if (gridEl) {
      gridEl.className = `ecomus-product-grid ${mode}`;
    }
  }

  btnGrid3?.addEventListener('click', () => setGridMode('grid-3col'));
  btnGrid4?.addEventListener('click', () => setGridMode('grid-4col'));
  btnGridList?.addEventListener('click', () => setGridMode('grid-list'));

  // Render Active Chips
  function renderActiveChips() {
    if (!activeChipsContainer) return;
    const chips = [];

    selectedBrands.forEach(bid => {
      const b = store.getBrands().find(br => br.id === bid);
      chips.push(`
        <span class="ecomus-chip">
          Brand: ${b?.name || bid}
          <span class="ecomus-chip-remove" data-remove-brand="${bid}">&times;</span>
        </span>
      `);
    });

    if (inStockOnly) {
      chips.push(`
        <span class="ecomus-chip">
          In Stock Only
          <span class="ecomus-chip-remove" data-remove-stock="true">&times;</span>
        </span>
      `);
    }

    selectedCerts.forEach(cert => {
      chips.push(`
        <span class="ecomus-chip">
          ${cert}
          <span class="ecomus-chip-remove" data-remove-cert="${cert}">&times;</span>
        </span>
      `);
    });

    const activeFilterCount = selectedBrands.length + (inStockOnly ? 1 : 0) + selectedCerts.length;
    if (activeFilterCountBadge) {
      activeFilterCountBadge.textContent = activeFilterCount;
      activeFilterCountBadge.style.display = activeFilterCount > 0 ? 'inline-flex' : 'none';
    }

    if (chips.length > 0) {
      chips.push(`<button class="ecomus-clear-all" id="btn-clear-all-chips">Clear All</button>`);
      activeChipsContainer.innerHTML = chips.join('');
      activeChipsContainer.style.display = 'flex';

      // Event handlers for removing chips
      activeChipsContainer.querySelectorAll('[data-remove-brand]').forEach(btn => {
        btn.addEventListener('click', () => {
          const bid = btn.getAttribute('data-remove-brand');
          selectedBrands = selectedBrands.filter(id => id !== bid);
          document.querySelectorAll(`.drawer-brand-cb[value="${bid}"]`).forEach(cb => cb.checked = false);
          renderFilteredList();
        });
      });

      activeChipsContainer.querySelectorAll('[data-remove-stock]').forEach(btn => {
        btn.addEventListener('click', () => {
          inStockOnly = false;
          if (drawerStockCheckbox) drawerStockCheckbox.checked = false;
          renderFilteredList();
        });
      });

      activeChipsContainer.querySelectorAll('[data-remove-cert]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cert = btn.getAttribute('data-remove-cert');
          selectedCerts = selectedCerts.filter(c => c !== cert);
          document.querySelectorAll(`.drawer-cert-cb[value="${cert}"]`).forEach(cb => cb.checked = false);
          renderFilteredList();
        });
      });

      document.getElementById('btn-clear-all-chips')?.addEventListener('click', () => {
        selectedBrands = [];
        inStockOnly = false;
        selectedCerts = [];
        if (drawerStockCheckbox) drawerStockCheckbox.checked = false;
        document.querySelectorAll('.drawer-brand-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.drawer-cert-cb').forEach(cb => cb.checked = false);
        renderFilteredList();
      });
    } else {
      activeChipsContainer.innerHTML = '';
      activeChipsContainer.style.display = 'none';
    }
  }

  // 5. Render Filtered Product Grid
  function renderFilteredList() {
    let list = [...categoryProducts];

    // Filter by Brand
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brandId));
    }

    // Filter by Stock
    if (inStockOnly) {
      list = list.filter(p => p.inStock);
    }

    // Filter by Certifications
    if (selectedCerts.length > 0) {
      list = list.filter(p => {
        const certs = (p.certifications || []).join(' ');
        return selectedCerts.every(c => certs.includes(c));
      });
    }

    // Sorting
    if (currentSort === 'price-asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (currentSort === 'price-desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (currentSort === 'name-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (countBadgeEl) {
      countBadgeEl.textContent = `(${list.length} systems)`;
    }
    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${list.length} certified machines in ${activeCategory.name}`;
    }

    renderActiveChips();

    if (!gridEl) return;

    if (list.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 32px; text-align: center; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--beco-border-subtle); box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #FDF2F7; color: var(--beco-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 800; color: var(--beco-text-dark); margin-bottom: 8px;">Hospital Tender &amp; Turnkey Indent Available</h3>
          <p style="color: var(--beco-text-secondary); font-size: 0.925rem; max-width: 620px; margin: 0 auto 24px; line-height: 1.6;">
            GYNAEQ engineers supply, calibrate, and license the complete <strong>${activeCategory.name}</strong> equipment portfolio for UAE &amp; GCC healthcare institutions upon tender or hospital indent. Contact our biomedical division for custom procurement, official manufacturer pricing, and turnkey delivery.
          </p>
          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <button class="beco-btn beco-btn-primary" style="background: var(--beco-primary); color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: 700; border: none; cursor: pointer;" onclick="if(window.GynaeqLayout){window.GynaeqLayout.openRFQDrawer();}">
              <span>Request Custom Department RFQ</span>
            </button>
            <a href="/shop" class="beco-btn" style="background: #F1F5F9; color: var(--beco-text-dark); padding: 12px 24px; border-radius: 6px; font-weight: 700; text-decoration: none;">
              <span>Browse All In-Stock Inventory (${store.getProducts().length})</span>
            </a>
          </div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = list.map(p => {
      const isCompared = store.compareList.includes(p.id);
      const waMsg = `Hello GYNAEQ Sales Team,\nI would like to inquire about: *${p.title}* (SKU: ${p.sku}, Price: ${p.callForPrice ? 'Quote' : formatAED(p.price)}).\nLink: https://www.gynaeq.com/product?id=${p.id}`;
      const waLink = `https://wa.me/971508893589?text=${encodeURIComponent(waMsg)}`;

      return `
        <div class="ecomus-card" data-id="${p.id}">
          <div class="ecomus-card-stage">
            <div class="ecomus-card-badges">
              ${p.inStock ? '<span class="ecomus-badge-chip ecomus-badge-green">In Dubai Stock</span>' : ''}
            </div>

            <label class="ecomus-card-compare">
              <input type="checkbox" class="compare-toggle" data-id="${p.id}" ${isCompared ? 'checked' : ''}>
              <span>Compare</span>
            </label>

            <a href="/product?id=${p.id}" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">
              <img src="${p.image}" alt="${p.title}" loading="lazy">
            </a>

            <!-- Slide-up Hover Action Bar (Ecomus Style) -->
            <div class="ecomus-hover-actions">
              <button class="ecomus-action-btn" data-add-rfq="${p.id}" title="Add to RFQ Basket">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Add Quote</span>
              </button>
              <a href="${waLink}" target="_blank" class="ecomus-action-btn btn-wa" title="WhatsApp Enquiry">
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div class="ecomus-card-body">
            <div class="ecomus-card-brand">${p.brand}</div>
            <h3 class="ecomus-card-title">
              <a href="/product?id=${p.id}">${p.title}</a>
            </h3>
            <div class="ecomus-card-specs">
              ${p.shortDesc || p.description?.substring(0, 100) || 'Hospital standard equipment with DHA & MoHAP registration.'}
            </div>
            <div class="ecomus-card-price-row">
              <div class="ecomus-card-price">${p.callForPrice ? 'Contact For Quote' : formatAED(p.price)}</div>
              <div class="ecomus-card-stock">
                <span class="ecomus-card-stock-dot"></span>
                <span>${p.inStock ? 'In Stock (Dubai)' : 'On Order'}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Initial render
  renderFilteredList();
});
