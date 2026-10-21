// ==========================================================================
// GYNAEQ Shop & Catalog Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for store initialization
  await store.init();

  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('category');
  const initialBrand = urlParams.get('brand');
  const initialSearch = urlParams.get('search');

  const shopGridEl = document.getElementById('shop-product-grid');
  const resultsCountEl = document.getElementById('shop-results-count');
  const catFiltersEl = document.getElementById('category-filters-container');
  const brandFiltersEl = document.getElementById('brand-filters-container');
  const inStockCheckbox = document.getElementById('filter-stock-only');
  const inStockCountEl = document.getElementById('in-stock-count');
  const sortSelect = document.getElementById('shop-sort-select');
  const activeChipsEl = document.getElementById('active-filters-chips');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnGrid = document.getElementById('btn-view-grid');
  const btnList = document.getElementById('btn-view-list');

  let selectedCategories = initialCat ? [initialCat] : [];
  let selectedBrands = initialBrand ? [initialBrand] : [];
  let selectedCerts = [];
  let inStockOnly = false;
  let currentSort = 'featured';
  let searchQuery = initialSearch || '';
  let viewMode = 'grid';

  // 1. Render Sidebar Categories
  function renderCategoriesSidebar() {
    if (!catFiltersEl) return;
    const categories = store.getCategories();
    catFiltersEl.innerHTML = categories.map(cat => `
      <label class="filter-checkbox-label">
        <span style="display: flex; align-items: center;">
          <input type="checkbox" class="cat-filter-cb" value="${cat.id}" ${selectedCategories.includes(cat.id) ? 'checked' : ''}>
          ${cat.name}
        </span>
        <span class="filter-count-badge">${cat.count}</span>
      </label>
    `).join('');

    catFiltersEl.querySelectorAll('.cat-filter-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedCategories.push(cb.value);
        } else {
          selectedCategories = selectedCategories.filter(id => id !== cb.value);
        }
        applyFilters();
      });
    });
  }

  // 2. Render Sidebar Brands
  function renderBrandsSidebar() {
    if (!brandFiltersEl) return;
    const brands = store.getBrands();
    const products = store.getProducts();

    brandFiltersEl.innerHTML = brands.map(b => {
      const count = products.filter(p => p.brandId === b.id || p.brand.toLowerCase() === b.name.toLowerCase()).length;
      return `
        <label class="filter-checkbox-label">
          <span style="display: flex; align-items: center;">
            <input type="checkbox" class="brand-filter-cb" value="${b.id}" ${selectedBrands.includes(b.id) ? 'checked' : ''}>
            ${b.name}
          </span>
          <span class="filter-count-badge">${count}</span>
        </label>
      `;
    }).join('');

    brandFiltersEl.querySelectorAll('.brand-filter-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedBrands.push(cb.value);
        } else {
          selectedBrands = selectedBrands.filter(id => id !== cb.value);
        }
        applyFilters();
      });
    });

    if (inStockCountEl) {
      inStockCountEl.textContent = products.filter(p => p.inStock).length;
    }
  }

  // 3. Filter and Sort Logic
  function applyFilters() {
    let list = store.getProducts();

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.shortDesc?.toLowerCase().includes(q)
      );
    }

    // Categories
    if (selectedCategories.length > 0) {
      list = list.filter(p => selectedCategories.includes(p.categoryId));
    }

    // Brands
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brandId) || selectedBrands.some(b => p.brand.toLowerCase().includes(b)));
    }

    // Stock
    if (inStockOnly) {
      list = list.filter(p => p.inStock);
    }

    // Certifications
    if (selectedCerts.length > 0) {
      list = list.filter(p => {
        const certs = (p.certifications || []).join(' ');
        return selectedCerts.every(c => certs.includes(c));
      });
    }

    // Sort
    if (currentSort === 'price-asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (currentSort === 'price-desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (currentSort === 'name-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    renderActiveChips();
    renderProductsList(list);
  }

  // 4. Render Active Chips
  function renderActiveChips() {
    if (!activeChipsEl) return;
    const chips = [];

    if (searchQuery) {
      chips.push(`<span class="active-filter-chip">Search: "${searchQuery}" <span class="btn-remove-chip" data-remove="search">&times;</span></span>`);
    }

    selectedCategories.forEach(cid => {
      const cat = store.getCategories().find(c => c.id === cid);
      chips.push(`<span class="active-filter-chip">${cat?.name || cid} <span class="btn-remove-chip" data-remove-cat="${cid}">&times;</span></span>`);
    });

    selectedBrands.forEach(bid => {
      const b = store.getBrands().find(br => br.id === bid);
      chips.push(`<span class="active-filter-chip">Brand: ${b?.name || bid} <span class="btn-remove-chip" data-remove-brand="${bid}">&times;</span></span>`);
    });

    if (inStockOnly) {
      chips.push(`<span class="active-filter-chip">In Stock Only <span class="btn-remove-chip" data-remove="stock">&times;</span></span>`);
    }

    activeChipsEl.innerHTML = chips.join('');

    activeChipsEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-remove');
        if (type === 'search') searchQuery = '';
        if (type === 'stock') {
          inStockOnly = false;
          if (inStockCheckbox) inStockCheckbox.checked = false;
        }
        applyFilters();
      });
    });

    activeChipsEl.querySelectorAll('[data-remove-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-remove-cat');
        selectedCategories = selectedCategories.filter(id => id !== cid);
        renderCategoriesSidebar();
        applyFilters();
      });
    });

    activeChipsEl.querySelectorAll('[data-remove-brand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const bid = btn.getAttribute('data-remove-brand');
        selectedBrands = selectedBrands.filter(id => id !== bid);
        renderBrandsSidebar();
        applyFilters();
      });
    });
  }

  // 5. Render Products
  function renderProductsList(products) {
    if (!shopGridEl) return;
    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${products.length} medical hardware systems`;
    }

    if (products.length === 0) {
      shopGridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 24px; text-align: center; background: #FFFFFF; border-radius: var(--radius-outer-xl); border: 1px dashed var(--border-hairline);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--color-navy-900); margin-bottom: 8px;">No matching equipment found</h3>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 20px;">Try clearing filters or search for another obstetric or gynecological system.</p>
          <button id="btn-empty-reset" class="btn-primary" style="margin: 0 auto;">Clear All Filters</button>
        </div>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', resetAll);
      return;
    }

    shopGridEl.className = `product-grid ${viewMode === 'list' ? 'list-view' : ''}`;

    shopGridEl.innerHTML = products.map(p => {
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
                  <span>View Details &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function resetAll() {
    selectedCategories = [];
    selectedBrands = [];
    selectedCerts = [];
    inStockOnly = false;
    searchQuery = '';
    currentSort = 'featured';
    if (inStockCheckbox) inStockCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'featured';
    document.querySelectorAll('.cert-filter').forEach(c => c.checked = false);
    renderCategoriesSidebar();
    renderBrandsSidebar();
    applyFilters();
  }

  // Event Listeners
  btnReset?.addEventListener('click', resetAll);

  inStockCheckbox?.addEventListener('change', (e) => {
    inStockOnly = e.target.checked;
    applyFilters();
  });

  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilters();
  });

  document.querySelectorAll('.cert-filter').forEach(cb => {
    cb.addEventListener('change', () => {
      selectedCerts = Array.from(document.querySelectorAll('.cert-filter:checked')).map(c => c.value);
      applyFilters();
    });
  });

  btnGrid?.addEventListener('click', () => {
    viewMode = 'grid';
    btnGrid.classList.add('active');
    btnList.classList.remove('active');
    applyFilters();
  });

  btnList?.addEventListener('click', () => {
    viewMode = 'list';
    btnList.classList.add('active');
    btnGrid.classList.remove('active');
    applyFilters();
  });

  // Initial Load
  renderCategoriesSidebar();
  renderBrandsSidebar();
  applyFilters();
});
