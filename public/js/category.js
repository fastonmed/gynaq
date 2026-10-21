// ==========================================================================
// GYNAEQ Category Landing Page Controller
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
  if (metaDesc) metaDesc.content = `${activeCategory.name} official UAE catalog, authorized hospital distributor, CE/FDA certification, and Dubai warehouse delivery.`;

  const bcName = document.getElementById('bc-cat-name');
  if (bcName) bcName.textContent = activeCategory.name;

  // 2. Populate Hero Banner
  const titleEl = document.getElementById('cat-title');
  if (titleEl) titleEl.textContent = activeCategory.name;

  const descEl = document.getElementById('cat-desc');
  if (descEl) descEl.textContent = activeCategory.shortDesc || activeCategory.description || 'Specialized gynecological and maternal diagnostics medical equipment authorized for UAE hospitals and clinics.';

  const statProductsEl = document.getElementById('cat-stat-products');
  if (statProductsEl) statProductsEl.textContent = `${activeCategory.count} Systems`;

  const heroImgEl = document.getElementById('cat-hero-img');
  if (heroImgEl && activeCategory.image) {
    heroImgEl.src = activeCategory.image;
    heroImgEl.alt = activeCategory.name;
  }

  // 3. Render Category Switcher Pills
  const switcherEl = document.getElementById('cat-switcher-pills');
  if (switcherEl) {
    switcherEl.innerHTML = `
      <a href="/shop" class="filter-pill">All Equipment (${store.getProducts().length})</a>
      ${categories.map(c => `
        <a href="/category?id=${c.id}" class="filter-pill ${c.id === activeCategory.id ? 'active' : ''}">
          ${c.name} (${c.count})
        </a>
      `).join('')}
    `;
  }

  // 4. Filter products for this category
  const gridEl = document.getElementById('cat-product-grid');
  const countEl = document.getElementById('cat-results-count');
  const brandFilterEl = document.getElementById('cat-brand-filter');
  const sortFilterEl = document.getElementById('cat-sort-select');

  // Populate brand filter dropdown
  const categoryProducts = store.getProducts().filter(p => p.categoryId === activeCategory.id);
  const brandIds = [...new Set(categoryProducts.map(p => p.brandId))];
  const relevantBrands = store.getBrands().filter(b => brandIds.includes(b.id));

  if (brandFilterEl) {
    brandFilterEl.innerHTML = `
      <option value="all">All Authorized Brands (${categoryProducts.length})</option>
      ${relevantBrands.map(b => `
        <option value="${b.id}">${b.name} (${categoryProducts.filter(p => p.brandId === b.id).length})</option>
      `).join('')}
    `;

    brandFilterEl.addEventListener('change', renderFilteredList);
  }

  if (sortFilterEl) {
    sortFilterEl.addEventListener('change', renderFilteredList);
  }

  function renderFilteredList() {
    let list = [...categoryProducts];

    const selectedBrand = brandFilterEl ? brandFilterEl.value : 'all';
    if (selectedBrand !== 'all') {
      list = list.filter(p => p.brandId === selectedBrand);
    }

    const sortVal = sortFilterEl ? sortFilterEl.value : 'featured';
    if (sortVal === 'price-asc') {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortVal === 'price-desc') {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    if (countEl) {
      countEl.textContent = `Showing ${list.length} certified machines in ${activeCategory.name}`;
    }

    if (!gridEl) return;

    if (list.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 32px; text-align: center; background: #FFFFFF; border-radius: var(--radius-outer-xl); border: 1px dashed var(--border-hairline); box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03);">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #F0F9FF; color: #0284C7; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--color-navy-900); margin-bottom: 8px;">Hospital Tender & Turnkey Procurement Available</h3>
          <p style="color: var(--color-text-secondary); font-size: 0.925rem; max-width: 620px; margin: 0 auto 24px; line-height: 1.6;">
            GYNAEQ engineers supply, calibrate, and license the complete <strong>${activeCategory.name}</strong> equipment portfolio for UAE & GCC healthcare institutions upon indent or hospital tender. Contact our biomedical division for custom procurement, official manufacturer pricing, and turnkey delivery.
          </p>
          <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
            <button class="btn-primary" onclick="if(window.GynaeqLayout){window.GynaeqLayout.openRFQDrawer();}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
              <span>Request Custom Department RFQ</span>
            </button>
            <a href="/shop" class="btn-secondary">
              <span>Browse In-Stock Inventory (${store.getProducts().length})</span>
            </a>
          </div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = list.map(p => {
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
                <a href="/product?id=${p.id}" class="btn-card-quickview">
                  <span>Details &rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderFilteredList();
});
