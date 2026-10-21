// ==========================================================================
// GYNAEQ Shop & Catalog Controller (Ecomus Fashion/Luxury Architecture)
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await store.init();

  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('category');
  const initialBrand = urlParams.get('brand');
  const initialSearch = urlParams.get('search');

  // DOM Elements
  const shopGridEl = document.getElementById('shop-product-grid');
  const catalogCountBadgeEl = document.getElementById('shop-catalog-count-badge');
  const resultsCountEl = document.getElementById('shop-results-count');
  const categoriesPillsEl = document.getElementById('shop-categories-pills');
  const sortSelect = document.getElementById('shop-sort-select');
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

  // Filter State
  let selectedCategories = initialCat ? [initialCat] : [];
  let selectedBrands = initialBrand ? [initialBrand] : [];
  let selectedCerts = [];
  let inStockOnly = false;
  let currentSort = 'featured';
  let searchQuery = initialSearch || '';
  let currentGrid = 'grid-5col';

  // 1. Render Top Subcategory Switcher Pills (Ecomus Style)
  function renderSubcategoryPills() {
    if (!categoriesPillsEl) return;
    const categories = store.getCategories();
    const allCount = store.getProducts().length;
    const isAllActive = selectedCategories.length === 0;

    const products = store.getProducts();
    const categoryLabels = { all: 'All equipment', ultrasound: 'Ultrasound', 'fetal-monitoring': 'Fetal monitoring', colposcopy: 'Colposcopy', 'beds-chairs': 'Beds & chairs', electrosurgery: 'Electrosurgery', 'surgical-hysteroscopy': 'Hysteroscopy', 'ivf-fertility': 'IVF & fertility', consumables: 'Clinic supplies', 'critical-care': 'Critical care' };
    const categoryIconCells = { all: [0,0], ultrasound: [50,0], 'fetal-monitoring': [100,0], colposcopy: [0,50], 'beds-chairs': [50,50], electrosurgery: [100,50], 'surgical-hysteroscopy': [0,100], 'ivf-fertility': [50,100], consumables: [100,100], 'critical-care': [100,0] };
    const categoryCard = (id, name, count, image, active) => `
      <a href="/shop${id === 'all' ? '' : '?category=' + encodeURIComponent(id)}" class="catalog-category-card ${active ? 'active' : ''}" data-pill-cat="${id}">
        <div class="catalog-category-line catalog-category-dimensional" aria-hidden="true"><span class="category-clay-icon" style="background-position:${(categoryIconCells[id] || [0,0])[0]}% ${(categoryIconCells[id] || [0,0])[1]}%"></span></div>
        <strong>${categoryLabels[id] || name}</strong><span>${count} ${count === 1 ? 'item' : 'items'}</span>
      </a>`;
    categoriesPillsEl.innerHTML = categoryCard('all', 'All Gynecology Equipment', allCount, '/assets/hero_suite.jpg', isAllActive) + categories.map(c => {
      const items = products.filter(p => p.categoryId === c.id);
      return categoryCard(c.id, c.name, items.length, items[0]?.image || c.image || '/assets/hero_suite.jpg', selectedCategories.includes(c.id));
    }).join('');

    categoriesPillsEl.querySelectorAll('[data-pill-cat]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.preventDefault();
        const cid = pill.getAttribute('data-pill-cat');
        if (cid === 'all') {
          selectedCategories = [];
        } else {
          selectedCategories = [cid];
        }
        renderSubcategoryPills();
        syncDrawerCategories();
        applyFilters();
      });
    });
  }

  const catalogSearch = document.getElementById('catalog-search-input');
  if (catalogSearch) catalogSearch.value = searchQuery;
  catalogSearch?.addEventListener('input', () => { searchQuery = catalogSearch.value.trim(); applyFilters(); });
  document.getElementById('catalog-search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    searchQuery = catalogSearch.value.trim();
    applyFilters();
  });
  document.querySelectorAll('[data-category-step]').forEach(button => {
    button.addEventListener('click', () => categoriesPillsEl.scrollBy({left: Number(button.dataset.categoryStep) * categoriesPillsEl.clientWidth * 0.8, behavior: 'smooth'}));
  });

  // 2. Filter Drawer Handlers
  function openFilterDrawer() {
    filterDrawerBackdrop?.classList.add('active');
  }
  function closeFilterDrawer() {
    filterDrawerBackdrop?.classList.remove('active');
  }

  btnToggleDrawer?.addEventListener('click', openFilterDrawer);
  btnCloseDrawer?.addEventListener('click', closeFilterDrawer);
  shopGridEl?.addEventListener('click', e => {
    const wish = e.target.closest('[data-shop-wish]');
    if (wish) {
      let saved = []; try { saved = JSON.parse(localStorage.getItem('gynaeq_wishlist') || '[]'); } catch {}
      const id = wish.dataset.shopWish;
      const active = !saved.includes(id);
      saved = active ? [...saved, id] : saved.filter(x => x !== id);
      localStorage.setItem('gynaeq_wishlist', JSON.stringify(saved));
      wish.setAttribute('aria-pressed', String(active));
    }
    const compare = e.target.closest('[data-shop-compare]');
    if (compare) {
      store.toggleCompare(compare.dataset.shopCompare);
      compare.setAttribute('aria-pressed', String(store.compareList.includes(compare.dataset.shopCompare)));
    }
  });

  filterDrawerBackdrop?.addEventListener('click', (e) => {
    if (e.target === filterDrawerBackdrop) closeFilterDrawer();
  });

  // Populate Drawer Categories
  function renderDrawerCategories() {
    if (!drawerCategoriesList) return;
    const categories = store.getCategories();
    drawerCategoriesList.innerHTML = `<button type="button" class="shop-all-categories">All Categories <span>${store.getProducts().length}</span></button>` + categories.map(cat => `
      <label class="ecomus-filter-item">
        <span>
          <input type="checkbox" class="drawer-cat-cb" value="${cat.id}" ${selectedCategories.includes(cat.id) ? 'checked' : ''}>
          ${cat.name}
        </span>
        <span class="ecomus-filter-count">${store.getProducts().filter(p => p.categoryId === cat.id).length}</span>
      </label>
    `).join('');

    drawerCategoriesList.querySelector('.shop-all-categories')?.addEventListener('click', () => {
      selectedCategories = [];
      syncDrawerCategories();
      renderSubcategoryPills();
      applyFilters();
    });
    drawerCategoriesList.querySelectorAll('.drawer-cat-cb').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          selectedCategories.push(cb.value);
        } else {
          selectedCategories = selectedCategories.filter(id => id !== cb.value);
        }
      });
    });
  }

  function syncDrawerCategories() {
    document.querySelectorAll('.drawer-cat-cb').forEach(cb => {
      cb.checked = selectedCategories.includes(cb.value);
    });
  }

  // Populate Drawer Brands
  function renderDrawerBrands() {
    if (!drawerBrandsList) return;
    const brands = store.getBrands();
    const products = store.getProducts();

    drawerBrandsList.innerHTML = brands.map(b => {
      const count = products.filter(p => p.brandId === b.id || p.brand.toLowerCase() === b.name.toLowerCase()).length;
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

    if (drawerStockCount) {
      drawerStockCount.textContent = products.filter(p => p.inStock).length;
    }
  }

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
    renderSubcategoryPills();
    applyFilters();
  });

  btnResetDrawer?.addEventListener('click', () => {
    resetAllFilters();
    closeFilterDrawer();
  });

  // 3. Grid Column Switchers (Ecomus Signature)
  const btnGrid3 = document.getElementById('btn-grid-3col');
  const btnGrid4 = document.getElementById('btn-grid-5col');
  const btnGridList = document.getElementById('btn-grid-list');

  function setGridMode(mode) {
    currentGrid = mode;
    [btnGrid3, btnGrid4, btnGridList].forEach(b => b?.classList.remove('active'));
    if (mode === 'grid-3col') btnGrid3?.classList.add('active');
    if (mode === 'grid-5col') btnGrid4?.classList.add('active');
    if (mode === 'grid-list') btnGridList?.classList.add('active');

    if (shopGridEl) {
      shopGridEl.className = `ecomus-product-grid ${mode}`;
    }
  }

  btnGrid3?.addEventListener('click', () => setGridMode('grid-3col'));
  btnGrid4?.addEventListener('click', () => setGridMode('grid-5col'));
  btnGridList?.addEventListener('click', () => setGridMode('grid-list'));

  // Sort select listener
  sortSelect?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilters();
  });

  // 4. Filter & Sort Core Logic
  function applyFilters() {
    let list = store.getProducts();

    // Search Query
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

  // 5. Render Active Chips
  function renderActiveChips() {
    if (!activeChipsContainer) return;
    const chips = [];

    if (searchQuery) {
      chips.push(`
        <span class="ecomus-chip">
          Search: "${searchQuery}"
          <span class="ecomus-chip-remove" data-remove="search">&times;</span>
        </span>
      `);
    }

    selectedCategories.forEach(cid => {
      const cat = store.getCategories().find(c => c.id === cid);
      chips.push(`
        <span class="ecomus-chip">
          ${cat?.name || cid}
          <span class="ecomus-chip-remove" data-remove-cat="${cid}">&times;</span>
        </span>
      `);
    });

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
          <span class="ecomus-chip-remove" data-remove="stock">&times;</span>
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

    const activeCount = (searchQuery ? 1 : 0) + selectedCategories.length + selectedBrands.length + (inStockOnly ? 1 : 0) + selectedCerts.length;
    if (activeFilterCountBadge) {
      activeFilterCountBadge.textContent = activeCount;
      activeFilterCountBadge.style.display = activeCount > 0 ? 'inline-flex' : 'none';
    }

    if (chips.length > 0) {
      chips.push(`<button class="ecomus-clear-all" id="btn-clear-all-chips">Clear All</button>`);
      activeChipsContainer.innerHTML = chips.join('');
      activeChipsContainer.style.display = 'flex';

      // Chip Remove Handlers
      activeChipsContainer.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.getAttribute('data-remove');
          if (type === 'search') searchQuery = '';
          if (type === 'stock') {
            inStockOnly = false;
            if (drawerStockCheckbox) drawerStockCheckbox.checked = false;
          }
          applyFilters();
        });
      });

      activeChipsContainer.querySelectorAll('[data-remove-cat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cid = btn.getAttribute('data-remove-cat');
          selectedCategories = selectedCategories.filter(id => id !== cid);
          renderSubcategoryPills();
          syncDrawerCategories();
          applyFilters();
        });
      });

      activeChipsContainer.querySelectorAll('[data-remove-brand]').forEach(btn => {
        btn.addEventListener('click', () => {
          const bid = btn.getAttribute('data-remove-brand');
          selectedBrands = selectedBrands.filter(id => id !== bid);
          document.querySelectorAll(`.drawer-brand-cb[value="${bid}"]`).forEach(cb => cb.checked = false);
          applyFilters();
        });
      });

      activeChipsContainer.querySelectorAll('[data-remove-cert]').forEach(btn => {
        btn.addEventListener('click', () => {
          const cert = btn.getAttribute('data-remove-cert');
          selectedCerts = selectedCerts.filter(c => c !== cert);
          document.querySelectorAll(`.drawer-cert-cb[value="${cert}"]`).forEach(cb => cb.checked = false);
          applyFilters();
        });
      });

      document.getElementById('btn-clear-all-chips')?.addEventListener('click', resetAllFilters);
    } else {
      activeChipsContainer.innerHTML = '';
      activeChipsContainer.style.display = 'none';
    }
  }

  // Reset Filters
  function resetAllFilters() {
    selectedCategories = [];
    selectedBrands = [];
    selectedCerts = [];
    inStockOnly = false;
    searchQuery = '';
    currentSort = 'featured';
    if (drawerStockCheckbox) drawerStockCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'featured';
    document.querySelectorAll('.drawer-cat-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('.drawer-brand-cb').forEach(cb => cb.checked = false);
    document.querySelectorAll('.drawer-cert-cb').forEach(cb => cb.checked = false);
    renderSubcategoryPills();
    applyFilters();
  }

  // 6. Render Product Grid
  function renderProductsList(products) {
    if (!shopGridEl) return;

    if (catalogCountBadgeEl) {
      catalogCountBadgeEl.textContent = `(${products.length} systems)`;
    }
    if (resultsCountEl) {
      resultsCountEl.textContent = `Showing ${products.length} medical hardware systems`;
    }

    if (products.length === 0) {
      shopGridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 64px 32px; text-align: center; background: #FFFFFF; border-radius: 16px; border: 1px dashed var(--beco-border-subtle);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #FDF2F7; color: var(--beco-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--beco-text-dark); margin-bottom: 8px;">No matching equipment found</h3>
          <p style="color: var(--beco-text-muted); font-size: 0.9rem; margin-bottom: 20px;">Try clearing filters or search for another obstetric or gynecological system.</p>
          <button id="btn-empty-reset" class="beco-btn beco-btn-primary" style="margin: 0 auto; background: var(--beco-primary); color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 700; border: none; cursor: pointer;">Clear All Filters</button>
        </div>
      `;
      document.getElementById('btn-empty-reset')?.addEventListener('click', resetAllFilters);
      return;
    }

    const allCategoriesButton = drawerCategoriesList?.querySelector('.shop-all-categories');
    allCategoriesButton?.classList.toggle('active', selectedCategories.length === 0);
    shopGridEl.className = `ecomus-product-grid ${currentGrid}`;

    shopGridEl.innerHTML = products.map(p => {
      const isCompared = store.compareList.includes(p.id);
      const waMsg = `Hello GYNAEQ Sales Team,\nI would like to inquire about: *${p.title}* (SKU: ${p.sku}, Price: ${p.callForPrice ? 'Quote' : formatAED(p.price)}).\nLink: https://www.gynaeq.com/product?id=${p.id}`;
      const waLink = `https://wa.me/971508893589?text=${encodeURIComponent(waMsg)}`;

      return `
        <div class="ecomus-card" data-id="${p.id}">
          <div class="ecomus-card-stage">
            <div class="ecomus-card-badges">
              ${p.inStock ? '<span class="ecomus-badge-chip ecomus-badge-green">In Stock</span>' : ''}
            </div>

            <a href="/product?id=${p.id}" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">
              <img src="${p.image}" alt="${p.title}" loading="lazy">
            </a>

            <div class="shop-circle-actions">
              <button type="button" data-shop-wish="${p.id}" aria-label="Save to wishlist" aria-pressed="${(JSON.parse(localStorage.getItem('gynaeq_wishlist') || '[]')).includes(p.id)}"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>
              <button type="button" data-shop-compare="${p.id}" aria-label="Compare product" aria-pressed="${isCompared}"><svg viewBox="0 0 24 24"><path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 6-6s4-6 6-6h3m-4-4 4 4-4 4"/></svg></button>
              <a href="/product?id=${encodeURIComponent(p.id)}" aria-label="View product"><svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></a>
            </div>
          </div>

          <div class="ecomus-card-body">
            <div class="ecomus-card-brand">${p.brand}</div>
            <h3 class="ecomus-card-title" title="${String(p.title).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">
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

  filterDrawerBackdrop?.addEventListener('change', () => {
    if (window.matchMedia('(min-width: 1101px)').matches) {
      renderSubcategoryPills();
      applyFilters();
    }
  });

  // Initial Load
  renderSubcategoryPills();
  const footerCategoryLinks = document.getElementById('shop-footer-category-links');
  if (footerCategoryLinks && categoriesPillsEl) {
    categoriesPillsEl.querySelectorAll('.catalog-category-card').forEach(card => {
      const link = document.createElement('a');
      link.href = card.getAttribute('href');
      link.append(card.querySelector('.catalog-category-line').cloneNode(true));
      const label = document.createElement('span');
      label.textContent = card.querySelector('strong').textContent;
      link.append(label);
      const arrow = document.createElement('span');
      arrow.className = 'footer-category-chevron';
      arrow.textContent = '⌄';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(arrow);
      footerCategoryLinks.append(link);
    });
  }
  renderDrawerCategories();
  renderDrawerBrands();
  applyFilters();
});
