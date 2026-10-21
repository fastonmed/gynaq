// ==========================================================================
// GYNAEQ EXECUTIVE CRM & ADMIN CONTROLLER
// Exact Replica of FastonMed CRM Architecture, Workflows & AddProductModal
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.gynaeqStore;
  await store.init();

  let activeTab = 'products'; // Default to products as requested for comparison
  let viewMode = 'list'; // 'list' or 'grid'
  let currentSearch = '';
  let filterCategory = 'All';
  let filterBrand = 'All';
  let sortBy = 'default';
  let entriesPerPage = 25;
  let activeActionDropdownId = null;

  const PAGE_TITLES = {
    'dashboard': { title: 'Dashboard', subtitle: 'Executive Operations Hub & UAE Healthcare Pipeline' },
    'clients': { title: 'Organisations', subtitle: 'Hospitals, Clinics & Healthcare Facilities' },
    'people': { title: 'People Directory', subtitle: 'Healthcare Professionals, Engineers & Decision Makers' },
    'tasks': { title: 'Tasks', subtitle: 'Task Management & Biomedical Engineering Workload' },
    'calendar': { title: 'Client Work Calendar', subtitle: 'Team Schedule, Demonstrations & Site Visits' },
    'enquiries': { title: 'Website Enquiries', subtitle: 'RFQs and procurement requests received from gynaeq.com' },
    'leads': { title: 'Leads & Pipeline', subtitle: 'Hospital tender and clinical sale pipeline stages' },
    'quotations': { title: 'Quotation', subtitle: 'Medical equipment quotations, price estimates & client proposals' },
    'sales': { title: 'Invoice & Payment', subtitle: 'Invoices, customer billing & accounts receivable' },
    'product-expiry': { title: 'Product Expiry', subtitle: 'Sold products, warranty and AMC contract expiry tracking' },
    'products': { title: 'Product Catalog', subtitle: 'Medical equipment database & authorized trader agreements' },
    'companies': { title: 'Trader Companies', subtitle: 'UAE Medical Equipment & Consumable Suppliers' },
    'brands': { title: 'Medical Brands', subtitle: 'Authorized Brands & Global Manufacturer Directory' },
    'service-calendar': { title: 'Service Calendar', subtitle: 'Scheduled service visits, repairs, and calibration tasks' },
    'amc': { title: 'Service Track', subtitle: 'Preventative maintenance, calibration and service tasks sheet' },
    'maintenance-contracts': { title: 'Maintenance Contracts', subtitle: 'Annual Maintenance Contracts & SLA' },
    'reports': { title: 'Reports & Analytics', subtitle: 'GYNAEQ Business Performance, Margins & Metrics' }
  };

  const DEFAULT_CATEGORIES = [
    'Ultrasound & Fetal Imaging',
    'Fetal & Maternal Monitoring',
    'Colposcopy & Cervical Diagnostics',
    'Delivery & Examination Beds',
    'Gynecological Electrosurgery & LEEP',
    'Hysteroscopy & Endosurgery',
    'IVF & Reproductive Medicine',
    'Consumables & Clinic Supplies'
  ];

  const DEFAULT_BRANDS = [
    'GYNAEQ Medical',
    'EDAN Instruments',
    'CAMI Italy',
    'LED SpA Italy',
    'Basco India',
    'Sunland Medical',
    'AVEUS Medical',
    'Jumper Medical',
    'DP Medical',
    'GE HealthCare',
    'Mindray Women\'s Health',
    'Philips Medical'
  ];

  // Helper formatting
  function formatAED(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return 'AED 0';
    return 'AED ' + Number(amount).toLocaleString('en-US');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '10/14/2026';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '10/14/2026';
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const y = d.getFullYear();
      return `${m}/${day}/${y}`;
    } catch {
      return '10/14/2026';
    }
  }

  function getProductIdFormatted(p) {
    if (!p) return '#77000';
    const cleanId = String(p.id || '');
    const cleanName = String(p.title || p.name || '');
    const digits = cleanId.replace(/\D/g, '');
    const fallbackNum = cleanName.length > 0 ? Math.abs(cleanName.charCodeAt(0) * 17) : 100;
    return `#77${(digits || fallbackNum).toString().padStart(5, '0').slice(0, 5)}`;
  }

  function showToast(msg, isSuccess = true) {
    const toast = document.createElement('div');
    toast.className = 'crm-toast';
    toast.innerHTML = `
      <span style="font-size: 16px;">${isSuccess ? '✅' : '⚠️'}</span>
      <span>${msg}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ─── SIDEBAR TOGGLES & NAVIGATION ─────────────────────────────────────────
  const groupToggleBtns = document.querySelectorAll('[data-toggle-group]');
  groupToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupEl = btn.closest('.sidebar-group');
      if (groupEl) {
        groupEl.classList.toggle('expanded');
      }
    });
  });

  function setupNavLinks() {
    const allLinks = document.querySelectorAll('.sidebar-nav-link[data-tab], .sidebar-sub-link[data-tab]');
    allLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = link.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });
  }
  setupNavLinks();

  function switchTab(tab) {
    activeTab = tab;
    // Update active classes
    document.querySelectorAll('.sidebar-nav-link, .sidebar-sub-link').forEach(el => {
      if (el.getAttribute('data-tab') === tab) {
        el.classList.add('active');
        const parentGroup = el.closest('.sidebar-group');
        if (parentGroup) {
          parentGroup.classList.add('expanded');
          const groupBtn = parentGroup.querySelector('.sidebar-group-btn');
          if (groupBtn) groupBtn.classList.add('active');
        }
      } else {
        el.classList.remove('active');
      }
    });

    // Update group buttons active state if none of their children are active
    document.querySelectorAll('.sidebar-group').forEach(grp => {
      const hasActiveChild = Boolean(grp.querySelector('.sidebar-sub-link.active'));
      const groupBtn = grp.querySelector('.sidebar-group-btn');
      if (groupBtn) {
        if (hasActiveChild) groupBtn.classList.add('active');
        else groupBtn.classList.remove('active');
      }
    });

    // Update Header Titles
    const info = PAGE_TITLES[tab] || { title: 'GYNAEQ CRM', subtitle: 'Healthcare Suite' };
    const titleEl = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle || '';

    // Render Tab Content
    const container = document.getElementById('admin-tab-content');
    if (!container) return;

    if (tab === 'products') renderProductsTab(container);
    else if (tab === 'companies') renderCompaniesTab(container);
    else if (tab === 'enquiries') renderEnquiriesTab(container);
    else if (tab === 'quotations') renderQuotationsTab(container);
    else if (tab === 'clients') renderClientsTab(container);
    else if (tab === 'people') renderPeopleTab(container);
    else if (tab === 'tasks') renderTasksTab(container);
    else if (tab === 'leads') renderLeadsTab(container);
    else if (tab === 'brands') renderBrandsTab(container);
    else if (tab === 'amc' || tab === 'service-calendar' || tab === 'maintenance-contracts') renderAmcTab(container);
    else renderDashboardTab(container);
  }

  // Close floating popovers on click outside
  window.addEventListener('click', () => {
    if (activeActionDropdownId) {
      activeActionDropdownId = null;
      document.querySelectorAll('.action-popover-menu').forEach(el => el.remove());
    }
  });

  // ─── TAB: PRODUCTS (FASTONMED DITTO LAYOUT) ──────────────────────────────
  function renderProductsTab(container) {
    const products = store.getProducts();
    const companies = store.data.traderCompanies || [];
    const brands = store.getBrands();

    // Compute active counts
    const totalInStock = products.reduce((acc, p) => acc + (Number(p.inStockCount) || (p.inStock ? 3 : 0)), 0);

    // Filter & Sort
    const filtered = products.filter(p => {
      const prodId = getProductIdFormatted(p).toLowerCase();
      const name = (p.title || p.name || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();
      const model = (p.model || p.sku || '').toLowerCase();
      const cat = (p.categoryName || p.category || '').toLowerCase();

      const q = currentSearch.toLowerCase().trim();
      const matchSearch = !q || name.includes(q) || brand.includes(q) || model.includes(q) || prodId.includes(q) || cat.includes(q);
      const matchCategory = filterCategory === 'All' || (p.categoryName === filterCategory || p.category === filterCategory);
      const matchBrand = filterBrand === 'All' || (p.brand && p.brand.toLowerCase() === filterBrand.toLowerCase());

      return matchSearch && matchCategory && matchBrand;
    }).sort((a, b) => {
      if (sortBy === 'name') return (a.title || a.name || '').localeCompare(b.title || b.name || '');
      if (sortBy === 'brand') return (a.brand || '').localeCompare(b.brand || '');
      if (sortBy === 'price_asc') return (Number(a.price || a.sellingPrice) || 0) - (Number(b.price || b.sellingPrice) || 0);
      if (sortBy === 'price_desc') return (Number(b.price || b.sellingPrice) || 0) - (Number(a.price || a.sellingPrice) || 0);
      return 0; // Default recent
    });

    const paginated = filtered.slice(0, entriesPerPage);

    container.innerHTML = `
      <!-- FastonMed Toolbar Card -->
      <div class="catalog-toolbar-card">
        <div class="catalog-toolbar-inner">
          <!-- Left: Entries selector + Search -->
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b;">
              <span>Showing</span>
              <select class="catalog-select" id="entries-per-page-select" style="width: 70px;">
                <option value="10" ${entriesPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${entriesPerPage === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${entriesPerPage === 50 ? 'selected' : ''}>50</option>
                <option value="100" ${entriesPerPage === 100 ? 'selected' : ''}>100</option>
              </select>
              <span>entries</span>
            </div>

            <div class="catalog-search-wrap">
              <span class="search-icon">🔍</span>
              <input type="text" id="catalog-search-input" class="form-input" placeholder="Search by ID, model, brand..." value="${currentSearch}">
            </div>
          </div>

          <!-- Right: Filters + View switch + Add button -->
          <div class="catalog-toolbar-actions">
            <!-- Category Filter -->
            <select class="catalog-select" id="catalog-filter-category" style="min-width: 175px;">
              <option value="All">All Categories (${DEFAULT_CATEGORIES.length})</option>
              ${DEFAULT_CATEGORIES.map(c => `
                <option value="${c}" ${filterCategory === c ? 'selected' : ''}>${c}</option>
              `).join('')}
            </select>

            <!-- Brand Filter -->
            <select class="catalog-select" id="catalog-filter-brand" style="min-width: 165px;">
              <option value="All">All Brands (${DEFAULT_BRANDS.length})</option>
              ${DEFAULT_BRANDS.map(b => `
                <option value="${b}" ${filterBrand === b ? 'selected' : ''}>${b}</option>
              `).join('')}
            </select>

            <!-- Sort Dropdown -->
            <select class="catalog-select" id="catalog-sort-select" style="min-width: 175px;">
              <option value="default" ${sortBy === 'default' ? 'selected' : ''}>Recently Added (Default)</option>
              <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Product Name (A-Z)</option>
              <option value="brand" ${sortBy === 'brand' ? 'selected' : ''}>Brand (A-Z)</option>
              <option value="price_asc" ${sortBy === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price_desc" ${sortBy === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
            </select>

            <!-- Grid/List Switcher -->
            <div class="view-mode-toggle">
              <button type="button" class="view-mode-btn ${viewMode === 'grid' ? 'active' : ''}" id="btn-view-grid">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Grid</span>
              </button>
              <button type="button" class="view-mode-btn ${viewMode === 'list' ? 'active' : ''}" id="btn-view-list">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span>List</span>
              </button>
            </div>

            <!-- Sync Button -->
            <button type="button" class="btn btn-secondary" id="btn-sync-catalog" title="Sync live catalog" style="height: 38px; color: #004d66; font-weight: 600;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span>Sync</span>
            </button>

            <!-- Quick Add Category -->
            <button type="button" class="btn btn-secondary" id="btn-quick-cat" style="height: 38px; color: #004d66; font-weight: 600;">
              <span>+ Category</span>
            </button>

            <!-- FastonMed Add New Button -->
            <button type="button" class="btn btn-primary" id="btn-open-fastonmed-modal" style="height: 38px; background-color: #004d66; font-weight: 600; white-space: nowrap;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add New</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Results Summary Bar -->
      <div class="catalog-results-bar">
        <div class="summary-text">
          Showing <strong>${paginated.length}</strong> of <strong>${filtered.length}</strong> products
          ${(filterCategory !== 'All' || filterBrand !== 'All' || currentSearch) ? `
            · <button type="button" id="btn-reset-catalog-filters" style="color: #004d66; background: none; border: none; font-size: 12px; font-weight: 700; text-decoration: underline; cursor: pointer;">Reset filters</button>
          ` : ''}
        </div>
        <div class="summary-stats-pills">
          <span class="stock-pill">
            <span class="dot-green"></span>
            <strong>${totalInStock}</strong> Units in Stock
          </span>
          <span class="stock-pill" style="color: #0284c7;">
            🏢 <strong>${companies.length || 8}</strong> Partner Traders
          </span>
        </div>
      </div>

      <!-- Products Rendering (List or Grid) -->
      ${viewMode === 'list' ? renderFastonMedTable(paginated) : renderFastonMedGrid(paginated)}
    `;

    // Bind event listeners
    document.getElementById('catalog-search-input')?.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderProductsTab(container);
    });

    document.getElementById('entries-per-page-select')?.addEventListener('change', (e) => {
      entriesPerPage = Number(e.target.value);
      renderProductsTab(container);
    });

    document.getElementById('catalog-filter-category')?.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      renderProductsTab(container);
    });

    document.getElementById('catalog-filter-brand')?.addEventListener('change', (e) => {
      filterBrand = e.target.value;
      renderProductsTab(container);
    });

    document.getElementById('catalog-sort-select')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProductsTab(container);
    });

    document.getElementById('btn-view-grid')?.addEventListener('click', () => {
      viewMode = 'grid';
      renderProductsTab(container);
    });

    document.getElementById('btn-view-list')?.addEventListener('click', () => {
      viewMode = 'list';
      renderProductsTab(container);
    });

    document.getElementById('btn-reset-catalog-filters')?.addEventListener('click', () => {
      currentSearch = '';
      filterCategory = 'All';
      filterBrand = 'All';
      sortBy = 'default';
      renderProductsTab(container);
    });

    document.getElementById('btn-sync-catalog')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const svg = btn.querySelector('svg');
      if (svg) svg.classList.add('animate-spin');
      await store.init();
      showToast('FastonMed Product Catalog synchronized with live database');
      renderProductsTab(container);
    });

    document.getElementById('btn-quick-cat')?.addEventListener('click', () => {
      const newCat = prompt('Enter New Clinical Equipment Category:');
      if (newCat && newCat.trim()) {
        DEFAULT_CATEGORIES.push(newCat.trim());
        showToast(`Category "${newCat.trim()}" added to catalog`);
        renderProductsTab(container);
      }
    });

    // OPEN FASTONMED ADD PRODUCT MODAL
    document.getElementById('btn-open-fastonmed-modal')?.addEventListener('click', () => {
      openFastonMedAddProductModal();
    });

    // Bind row action dropdown triggers
    bindActionDropdowns(container);
  }

  // ─── FASTONMED LIST VIEW TABLE ───────────────────────────────────────────
  function renderFastonMedTable(products) {
    if (products.length === 0) {
      return `
        <div class="fastonmed-table-card" style="padding: 40px; text-align: center; color: #64748b;">
          <p style="font-size: 15px; font-weight: 600;">No medical equipment found matching your filters.</p>
          <button class="btn btn-primary" onclick="window.adminOpenAddModal()" style="margin-top: 12px; background: #004d66;">+ Add Medical Product</button>
        </div>
      `;
    }

    return `
      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th style="min-width: 320px;">Product</th>
                <th style="width: 140px;">Brand</th>
                <th style="width: 180px;">Price</th>
                <th style="width: 130px; text-align: center;">Listed Date</th>
                <th style="width: 110px; text-align: center; position: sticky; right: 0; background: #f8fafc; z-index: 2;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(p => {
                const title = p.title || p.name || 'Medical Equipment';
                const brand = p.brand || 'GYNAEQ Partner';
                const model = p.model || p.sku || 'Clinical Machine';
                const category = p.categoryName || p.category || 'Ultrasound';
                const price = Number(p.price !== undefined ? p.price : p.sellingPrice) || 0;
                const cost = Number(p.purchaseCost) || (price > 0 ? Math.round(price * 0.73) : 0);
                const marginPct = price > cost && price > 0 ? Math.round(((price - cost) / price) * 100) : null;
                const image = p.image || '/assets/ultrasound.jpg';
                const listedDate = formatDate(p.createdAt);

                return `
                  <tr data-prod-id="${p.id}">
                    <!-- Product Column -->
                    <td>
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="table-product-thumb">
                          <img src="${image}" alt="${title}" onerror="this.src='/assets/ultrasound.jpg'">
                        </div>
                        <div style="min-width: 0;">
                          <div style="font-weight: 700; font-size: 13.5px; color: #0f172a; line-height: 1.3;">${title}</div>
                          <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
                            <strong style="color: #004d66;">${brand}</strong> · ${model} · <span style="color: #0284c7;">${category}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Brand Column -->
                    <td style="white-space: nowrap;">
                      <span style="font-size: 12.5px; font-weight: 600; color: #0f172a; display: inline-flex; align-items: center; gap: 6px;">
                        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #0284c7; flex-shrink: 0;"></span>
                        ${brand}
                      </span>
                    </td>

                    <!-- Price Column + Margin -->
                    <td style="white-space: nowrap;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 800; color: #0f172a; font-size: 13.5px;">
                          ${formatAED(price)}
                        </span>
                        ${marginPct ? `
                          <span class="margin-pill">+${marginPct}%</span>
                        ` : ''}
                      </div>
                    </td>

                    <!-- Listed Date Column -->
                    <td style="text-align: center; white-space: nowrap;">
                      <span style="font-size: 12px; color: #64748b;">${listedDate}</span>
                    </td>

                    <!-- Action Dropdown Column -->
                    <td style="text-align: center; position: sticky; right: 0; background: #ffffff; z-index: 1;">
                      <div style="position: relative; display: inline-block;">
                        <button type="button" class="action-dropdown-btn" data-action-trigger="${p.id}">
                          <span>Action</span>
                          <span style="font-size: 9px;">▼</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── FASTONMED MODERN GRID VIEW ──────────────────────────────────────────
  function renderFastonMedGrid(products) {
    if (products.length === 0) {
      return `<div style="padding: 40px; text-align: center; color: #64748b;">No products found.</div>`;
    }

    return `
      <div class="product-modern-grid">
        ${products.map(p => {
          const title = p.title || p.name || 'Medical Equipment';
          const brand = p.brand || 'GYNAEQ Partner';
          const category = p.categoryName || p.category || 'Ultrasound';
          const price = Number(p.price !== undefined ? p.price : p.sellingPrice) || 0;
          const image = p.image || '/assets/ultrasound.jpg';
          const prodId = getProductIdFormatted(p);
          const inStock = p.inStock !== false;

          return `
            <div class="product-catalog-card" data-prod-id="${p.id}">
              <div class="product-image-stage" onclick="window.adminViewSpecs('${p.id}')">
                <span class="id-badge">${prodId}</span>
                <img src="${image}" alt="${title}" class="product-stage-img" onerror="this.src='/assets/ultrasound.jpg'">
              </div>
              <div style="padding: 12px; display: flex; flex-direction: column; gap: 6px; flex: 1;">
                <span style="font-size: 10.5px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${brand} · ${category}
                </span>
                <h4 style="margin: 0; font-size: 13px; font-weight: 700; line-height: 1.35; min-height: 36px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; cursor: pointer;" onclick="window.adminViewSpecs('${p.id}')">
                  ${title}
                </h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <strong style="font-size: 13.5px; color: #0f172a;">${formatAED(price)}</strong>
                  <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${inStock ? '#ecfdf5' : '#fef2f2'}; color: ${inStock ? '#059669' : '#ef4444'}; border: 1px solid ${inStock ? '#a7f3d0' : '#fecaca'};">
                    ${inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <!-- Card Actions Strip -->
                <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
                  <button type="button" title="View Specs" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #0284c7; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="window.adminViewSpecs('${p.id}')">
                    👁️
                  </button>
                  <button type="button" title="Edit Product" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="window.adminEditProduct('${p.id}')">
                    ✏️
                  </button>
                  <button type="button" title="Delete Product" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid #fecaca; background: #fef2f2; color: #ef4444; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="window.adminDeleteProduct('${p.id}')">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ─── ACTION DROPDOWN LOGIC ───────────────────────────────────────────────
  function bindActionDropdowns(container) {
    container.querySelectorAll('[data-action-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pId = btn.getAttribute('data-action-trigger');
        document.querySelectorAll('.action-popover-menu').forEach(el => el.remove());

        if (activeActionDropdownId === pId) {
          activeActionDropdownId = null;
          return;
        }

        activeActionDropdownId = pId;
        const menu = document.createElement('div');
        menu.className = 'action-popover-menu';
        menu.innerHTML = `
          <button type="button" class="action-popover-item" onclick="window.adminViewSpecs('${pId}')">
            <span style="color: #0284c7;">👁️</span>
            <span>View Specs</span>
          </button>
          <button type="button" class="action-popover-item" onclick="window.adminEditProduct('${pId}')">
            <span style="color: #475569;">✏️</span>
            <span>Edit Product</span>
          </button>
          <div style="height: 1px; background: #f1f5f9; margin: 2px 0;"></div>
          <button type="button" class="action-popover-item danger" onclick="window.adminDeleteProduct('${pId}')">
            <span style="color: #ef4444;">🗑️</span>
            <span>Delete Product</span>
          </button>
        `;

        btn.parentElement.appendChild(menu);
      });
    });
  }

  // ─── DITTO FASTONMED: "ADD MEDICAL PRODUCT & CONNECT TRADER" MODAL ──────
  window.openFastonMedAddProductModal = function(existingProduct = null) {
    const isEdit = Boolean(existingProduct);
    const companies = store.data.traderCompanies || [];
    const modalRoot = document.getElementById('modal-root') || document.body;

    // Existing fields or defaults
    const initialName = existingProduct?.title || existingProduct?.name || '';
    const initialCategory = existingProduct?.categoryName || existingProduct?.category || DEFAULT_CATEGORIES[0];
    const initialBrand = existingProduct?.brand || '';
    const initialModel = existingProduct?.model || existingProduct?.sku || '';
    const initialPurchaseCost = existingProduct?.purchaseCost || (existingProduct?.price ? Math.round(existingProduct.price * 0.75) : '');
    const initialSellingPrice = existingProduct?.price !== undefined ? existingProduct.price : (existingProduct?.sellingPrice || '');
    const initialTraderId = existingProduct?.traderCompanyId || (companies[0]?.id || 'trader-ge-healthcare');
    const initialLeadTime = existingProduct?.deliveryLeadTime || existingProduct?.leadTime || '3 - 5 Days (UAE Stock)';
    const initialWarranty = existingProduct?.warrantyPeriod || existingProduct?.warranty || '2 Years Warranty';
    const initialVatStatus = existingProduct?.vatStatus || '5% Standard Rate (UAE VAT)';
    const initialInStock = existingProduct?.inStockCount !== undefined ? existingProduct.inStockCount : 4;
    const initialDesc = existingProduct?.description || existingProduct?.shortDesc || '';
    let uploadedImage = existingProduct?.image || '/assets/ultrasound.jpg';

    // Calculate initial margin
    const initialCostNum = Number(initialPurchaseCost) || 0;
    const initialPriceNum = Number(initialSellingPrice) || 0;
    let currentMargin = initialPriceNum > initialCostNum && initialPriceNum > 0
      ? Math.round(((initialPriceNum - initialCostNum) / initialPriceNum) * 100)
      : 0;

    const modalEl = document.createElement('div');
    modalEl.className = 'fastonmed-modal-overlay';
    modalEl.innerHTML = `
      <div class="fastonmed-modal-card" id="fastonmed-modal-card">
        <!-- Header -->
        <div class="fastonmed-modal-header">
          <div class="modal-header-left">
            <div class="modal-icon-box">📦</div>
            <div>
              <h2>${isEdit ? 'Edit Medical Product & Connected Trader' : 'Add Medical Product & Connect Trader'}</h2>
              <p>Link product category with authorized trader company, supply speed & pricing</p>
            </div>
          </div>
          <button type="button" class="modal-close-btn" id="btn-close-modal">✕</button>
        </div>

        <!-- Form -->
        <form class="fastonmed-modal-form" id="fastonmed-product-form">
          <!-- Photo Upload Area -->
          <div class="photo-upload-box">
            <div class="photo-preview-square" id="modal-photo-preview">
              <img src="${uploadedImage}" alt="Equipment Preview" id="modal-preview-img" onerror="this.src='/assets/ultrasound.jpg'">
            </div>
            <div class="photo-upload-controls">
              <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="photo-btn-add" id="btn-trigger-photo-file">
                  📷 <span id="photo-btn-text">${uploadedImage ? 'Change Equipment Photo' : '+ Add Equipment Photo'}</span>
                </button>
                <button type="button" class="photo-btn-remove" id="btn-remove-photo" style="${uploadedImage ? '' : 'display: none;'}">
                  🗑️ Remove
                </button>
                <input type="file" id="modal-file-input" accept="image/*" style="display: none;">
              </div>
              <p style="margin: 5px 0 0 0; fontSize: 11.5px; color: #64748b;">
                PNG, JPG, or WebP up to 5MB · High-resolution medical machine photography
              </p>
            </div>
          </div>

          <!-- Product Name & Category -->
          <div class="form-grid-2">
            <div>
              <label class="form-label">Product / Equipment Name *</label>
              <input type="text" name="name" class="form-input" required value="${initialName}" placeholder="e.g. GE Voluson E10 Expert 4D/5D Ob-Gyn Ultrasound System">
            </div>
            <div>
              <label class="form-label">Equipment Category *</label>
              <select name="category" class="form-input" style="height: 38px;">
                ${DEFAULT_CATEGORIES.map(cat => `
                  <option value="${cat}" ${initialCategory === cat ? 'selected' : ''}>${cat}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Pricing & Commercial Terms (Cost, Price, VAT, Dynamic Margin) -->
          <div class="form-grid-4">
            <div>
              <label class="form-label">Our Purchase Cost (AED) *</label>
              <input type="number" step="500" name="purchaseCost" id="input-purchase-cost" class="form-input" required value="${initialPurchaseCost}" placeholder="e.g. 215000">
            </div>
            <div>
              <label class="form-label">Selling Price (AED) *</label>
              <input type="number" step="500" name="sellingPrice" id="input-selling-price" class="form-input" required value="${initialSellingPrice}" placeholder="e.g. 285000">
            </div>
            <div>
              <label class="form-label">VAT Status</label>
              <select name="vatStatus" class="form-input" style="height: 38px;">
                <option value="5% Standard Rate (UAE VAT)" ${initialVatStatus.includes('5%') ? 'selected' : ''}>5% Standard Rate (UAE VAT)</option>
                <option value="0% Zero-Rated" ${initialVatStatus.includes('0%') ? 'selected' : ''}>0% Zero-Rated</option>
                <option value="Exempt" ${initialVatStatus.includes('Exempt') ? 'selected' : ''}>Exempt</option>
              </select>
            </div>
            <div>
              <label class="form-label">Estimated Margin</label>
              <div class="margin-indicator-badge ${currentMargin > 0 ? 'positive' : 'empty'}" id="modal-margin-badge">
                ${currentMargin > 0 ? `${currentMargin}% Margin` : '—'}
              </div>
            </div>
          </div>

          <!-- Brand (with Autocomplete), Model, In Stock -->
          <div class="form-grid-3">
            <div style="position: relative;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="form-label" style="margin: 0;">Brand</label>
                <span style="font-size: 11px; color: #64748b;">Select or Type</span>
              </div>
              <div style="position: relative;">
                <input type="text" name="brand" id="input-brand-field" class="form-input" value="${initialBrand}" placeholder="e.g. GE HealthCare, Mindray" style="padding-right: 28px;">
                <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; font-size: 10px;">▼</span>
              </div>
              <!-- Brand Autocomplete Popup -->
              <div class="brand-autocomplete-popup" id="brand-autocomplete-popup" style="display: none;">
                ${DEFAULT_BRANDS.map(b => `
                  <div class="brand-autocomplete-item" data-brand-choice="${b}">${b}</div>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="form-label">Model Number</label>
              <input type="text" name="model" class="form-input" value="${initialModel}" placeholder="e.g. Voluson E10 Expert">
            </div>

            <div>
              <label class="form-label">Units in Stock (UAE)</label>
              <input type="number" min="0" name="inStock" class="form-input" value="${initialInStock}" placeholder="e.g. 4">
            </div>
          </div>

          <!-- Warranty Period -->
          <div>
            <label class="form-label">Warranty Period</label>
            <select name="warranty" class="form-input" style="height: 38px;">
              <option value="1 Year Standard Warranty" ${initialWarranty.includes('1 Year') ? 'selected' : ''}>1 Year Standard Warranty</option>
              <option value="2 Years Warranty" ${initialWarranty.includes('2 Years') ? 'selected' : ''}>2 Years Warranty</option>
              <option value="3 Years Comprehensive" ${initialWarranty.includes('3 Years') ? 'selected' : ''}>3 Years Comprehensive</option>
              <option value="5 Years Manufacturer Warranty" ${initialWarranty.includes('5 Years') ? 'selected' : ''}>5 Years Manufacturer Warranty</option>
            </select>
          </div>

          <!-- Connected Trader Company & Supply Agreement Section -->
          <div class="trader-agreement-box">
            <div class="trader-box-header">
              <span style="font-size: 16px;">🏢</span>
              <span class="tag">Connected Trader Company & Supply Agreement</span>
            </div>

            <div class="form-grid-2">
              <div>
                <label class="form-label">Select Providing Trader Company *</label>
                <select name="traderCompanyId" id="select-trader-company" class="form-input" style="height: 38px;">
                  ${companies.map(c => `
                    <option value="${c.id}" ${initialTraderId === c.id ? 'selected' : ''}>${c.name} (${c.uaeOffice ? c.uaeOffice.split(',')[0] : 'UAE'})</option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label class="form-label">Delivery Speed / Lead Time *</label>
                <select name="deliveryLeadTime" class="form-input" style="height: 38px;">
                  <option value="Immediate / Same Day (Dubai Warehouse)" ${initialLeadTime.includes('Immediate') ? 'selected' : ''}>Immediate / Same Day (Dubai Warehouse)</option>
                  <option value="24 - 48 Hours Express" ${initialLeadTime.includes('24 - 48') ? 'selected' : ''}>24 - 48 Hours Express</option>
                  <option value="3 - 5 Days (UAE Stock)" ${initialLeadTime.includes('3 - 5') ? 'selected' : ''}>3 - 5 Days (UAE Stock)</option>
                  <option value="7 - 10 Days (GCC Dispatch)" ${initialLeadTime.includes('7 - 10') ? 'selected' : ''}>7 - 10 Days (GCC Dispatch)</option>
                  <option value="2 - 3 Weeks (Factory Order)" ${initialLeadTime.includes('2 - 3') ? 'selected' : ''}>2 - 3 Weeks (Factory Order)</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div>
                <label class="form-label">Trader Cost Min (AED)</label>
                <input type="number" step="500" name="traderPriceMin" class="form-input" value="${existingProduct?.traderPriceMin || ''}" placeholder="e.g. 205000">
              </div>
              <div>
                <label class="form-label">Trader Cost Max (AED)</label>
                <input type="number" step="500" name="traderPriceMax" class="form-input" value="${existingProduct?.traderPriceMax || ''}" placeholder="e.g. 225000">
              </div>
            </div>
          </div>

          <!-- Product Notes / Description -->
          <div>
            <label class="form-label">Product Notes / Description</label>
            <textarea name="description" rows="2" class="form-input" style="resize: vertical;" placeholder="Key technical capabilities, hospital approvals (MoH/DoH), clinical applications...">${initialDesc}</textarea>
          </div>

          <!-- Buttons -->
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background-color: #004d66; padding: 9px 20px;">
              ${isEdit ? 'Save & Update Product' : 'Save & Link Product'}
            </button>
          </div>
        </form>
      </div>
    `;

    modalRoot.appendChild(modalEl);

    // Close handlers
    const closeModal = () => modalEl.remove();
    modalEl.querySelector('#btn-close-modal')?.addEventListener('click', closeModal);
    modalEl.querySelector('#btn-cancel-modal')?.addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    // Real-Time Dynamic Estimated Margin Calculation
    const costInput = modalEl.querySelector('#input-purchase-cost');
    const priceInput = modalEl.querySelector('#input-selling-price');
    const marginBadge = modalEl.querySelector('#modal-margin-badge');

    function updateMarginCalculation() {
      const c = Number(costInput.value) || 0;
      const p = Number(priceInput.value) || 0;
      if (p > c && p > 0) {
        const pct = Math.round(((p - c) / p) * 100);
        marginBadge.textContent = `${pct}% Margin`;
        marginBadge.className = 'margin-indicator-badge positive';
      } else {
        marginBadge.textContent = '—';
        marginBadge.className = 'margin-indicator-badge empty';
      }
    }
    costInput?.addEventListener('input', updateMarginCalculation);
    priceInput?.addEventListener('input', updateMarginCalculation);

    // Photo Upload Handler (Supports FileReader dataURL + fallback)
    const fileInput = modalEl.querySelector('#modal-file-input');
    const triggerPhotoBtn = modalEl.querySelector('#btn-trigger-photo-file');
    const previewImg = modalEl.querySelector('#modal-preview-img');
    const removePhotoBtn = modalEl.querySelector('#btn-remove-photo');
    const photoBtnText = modalEl.querySelector('#photo-btn-text');

    triggerPhotoBtn?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, WebP)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        uploadedImage = reader.result;
        previewImg.src = uploadedImage;
        removePhotoBtn.style.display = 'inline-flex';
        photoBtnText.textContent = 'Change Equipment Photo';
        showToast('Equipment photo uploaded');
      };
      reader.readAsDataURL(file);
    });

    removePhotoBtn?.addEventListener('click', () => {
      uploadedImage = '/assets/ultrasound.jpg';
      previewImg.src = uploadedImage;
      removePhotoBtn.style.display = 'none';
      photoBtnText.textContent = '+ Add Equipment Photo';
    });

    // Brand Autocomplete Popup
    const brandInput = modalEl.querySelector('#input-brand-field');
    const brandPopup = modalEl.querySelector('#brand-autocomplete-popup');

    brandInput?.addEventListener('focus', () => {
      brandPopup.style.display = 'block';
    });
    brandInput?.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      brandPopup.style.display = 'block';
      brandPopup.querySelectorAll('.brand-autocomplete-item').forEach(item => {
        const text = item.getAttribute('data-brand-choice').toLowerCase();
        if (!val || text.includes(val)) item.style.display = 'block';
        else item.style.display = 'none';
      });
    });

    brandPopup?.querySelectorAll('.brand-autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        brandInput.value = item.getAttribute('data-brand-choice');
        brandPopup.style.display = 'none';
      });
    });

    document.addEventListener('click', (e) => {
      if (!brandInput?.contains(e.target) && !brandPopup?.contains(e.target)) {
        if (brandPopup) brandPopup.style.display = 'none';
      }
    });

    // Form Submit
    const form = modalEl.querySelector('#fastonmed-product-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = formData.get('name')?.toString().trim();
      if (!name) {
        alert('Please enter the product / equipment name');
        return;
      }

      const costNum = Number(formData.get('purchaseCost')) || 0;
      const priceNum = Number(formData.get('sellingPrice')) || 0;
      const traderId = formData.get('traderCompanyId')?.toString();
      const selectedTrader = companies.find(c => c.id === traderId) || companies[0];

      const productPayload = {
        name: name,
        title: name,
        category: formData.get('category')?.toString(),
        categoryName: formData.get('category')?.toString(),
        brand: formData.get('brand')?.toString() || selectedTrader?.name || 'GYNAEQ Partner',
        model: formData.get('model')?.toString() || 'Model Pro',
        purchaseCost: costNum,
        sellingPrice: priceNum,
        price: priceNum,
        vatStatus: formData.get('vatStatus')?.toString(),
        inStock: Number(formData.get('inStock')) > 0,
        inStockCount: Number(formData.get('inStock')) || 0,
        warrantyPeriod: formData.get('warranty')?.toString(),
        warranty: formData.get('warranty')?.toString(),
        traderCompanyId: selectedTrader?.id || 'trader-ge-healthcare',
        traderCompanyName: selectedTrader?.name || 'GE Healthcare UAE',
        deliveryLeadTime: formData.get('deliveryLeadTime')?.toString(),
        leadTime: formData.get('deliveryLeadTime')?.toString(),
        traderPriceMin: Number(formData.get('traderPriceMin')) || costNum,
        traderPriceMax: Number(formData.get('traderPriceMax')) || priceNum,
        description: formData.get('description')?.toString() || '',
        shortDesc: formData.get('description')?.toString() || '',
        image: uploadedImage
      };

      if (isEdit) {
        await store.updateProduct(existingProduct.id, productPayload);
        showToast(`Product "${name}" updated in CRM!`);
      } else {
        await store.addProduct(productPayload);
        showToast(`Product "${name}" saved to CRM!`);
      }

      closeModal();
      // Re-render active tab
      const container = document.getElementById('admin-tab-content');
      if (container) renderProductsTab(container);
    });
  };

  // Expose helpers globally for inline onclick
  window.adminOpenAddModal = () => openFastonMedAddProductModal();
  window.adminEditProduct = (id) => {
    const prod = store.getProductById(id);
    if (prod) openFastonMedAddProductModal(prod);
  };
  window.adminDeleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product from the CRM catalog?')) {
      await store.deleteProduct(id);
      showToast('Product removed from catalog');
      const container = document.getElementById('admin-tab-content');
      if (container) renderProductsTab(container);
    }
  };
  window.adminViewSpecs = (id) => {
    const p = store.getProductById(id);
    if (!p) return;
    alert(`Equipment Specifications:\nModel: ${p.title || p.name}\nBrand: ${p.brand}\nSelling Price: AED ${Number(p.price || p.sellingPrice).toLocaleString()}\nLead Time: ${p.deliveryLeadTime || p.leadTime || '3 - 5 Days'}\nWarranty: ${p.warrantyPeriod || p.warranty || '2 Years'}`);
  };

  // ─── TAB: TRADER COMPANIES (FASTONMED PROCUREMENT) ────────────────────────
  function renderCompaniesTab(container) {
    const companies = store.data.traderCompanies || [];
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">UAE Trader Companies & Medical Suppliers (${companies.length})</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Authorized medical machinery distributors with UAE warehouses and supply agreements</p>
          </div>
          <button class="btn btn-primary" onclick="alert('Connected to official UAE healthcare trader registry.')" style="background: #004d66;">
            + Register Trader
          </button>
        </div>
      </div>

      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Trader Company</th>
                <th>UAE Office / Hub</th>
                <th>Partnership Status</th>
                <th>Equipment Lines</th>
                <th>Delivery Speed</th>
                <th>Contact Representative</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${companies.map(c => `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 20px;">${c.flag || '🏢'}</span>
                      <div>
                        <div style="font-weight: 700; color: #0f172a; font-size: 13.5px;">${c.name}</div>
                        <div style="font-size: 11px; color: #64748b;">Origin: ${c.origin}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-size: 12.5px; color: #475569;">${c.uaeOffice}</td>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">
                      ${c.partnership}
                    </span>
                  </td>
                  <td style="font-size: 12px; color: #334155; max-width: 220px;">${c.equipmentLine}</td>
                  <td style="font-size: 12px; font-weight: 600; color: #059669;">${c.deliveryLeadTime}</td>
                  <td>
                    <div style="font-size: 12.5px; font-weight: 600; color: #0f172a;">${c.contactPerson}</div>
                    <div style="font-size: 11px; color: #004d66;"><a href="tel:${c.phone}">${c.phone}</a></div>
                  </td>
                  <td style="text-align: center;">
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11.5px;" onclick="window.adminOpenAddModal()">+ Add Machine</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── TAB: ENQUIRIES (WEBSITE RFQS) ─────────────────────────────────────────
  function renderEnquiriesTab(container) {
    const enquiries = store.getEnquiries();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Website Enquiries & Hospital RFQs (${enquiries.length})</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Inquiries submitted by obstetricians, clinics and hospital procurement teams</p>
          </div>
          <button class="btn btn-primary" onclick="switchTab('quotations')" style="background: #004d66;">
            + Generate Formal Quotation
          </button>
        </div>
      </div>

      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref #</th>
                <th>Hospital / Institution</th>
                <th>Contact Doctor / Lead</th>
                <th>Equipment Inquired</th>
                <th>Est. Budget</th>
                <th>Status</th>
                <th>Assigned Lead</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${enquiries.map(e => `
                <tr>
                  <td style="font-size: 12px; color: #64748b;">${formatDate(e.createdAt)}</td>
                  <td><strong style="color: #004d66; font-family: monospace;">${e.ref}</strong></td>
                  <td>
                    <div style="font-weight: 700; color: #0f172a;">${e.facilityName}</div>
                    <div style="font-size: 11px; color: #64748b;">${e.city}, ${e.country}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600; color: #0f172a;">${e.contactName}</div>
                    <div style="font-size: 11px; color: #0284c7;"><a href="tel:${e.phone}">${e.phone}</a></div>
                  </td>
                  <td style="font-size: 12.5px; max-width: 220px; line-height: 1.3;">${e.productRequested}</td>
                  <td style="font-weight: 700; color: #0f172a;">${formatAED(e.estimatedBudget)}</td>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
                      ${e.status}
                    </span>
                  </td>
                  <td style="font-size: 12px; color: #475569;">${e.assignedTo || 'Fuhad'}</td>
                  <td>
                    <button class="btn btn-primary" style="padding: 4px 10px; font-size: 11.5px; background: #004d66;" onclick="window.adminConvertRFQ('${e.id}')">
                      Quote
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── TAB: QUOTATIONS ──────────────────────────────────────────────────────
  function renderQuotationsTab(container) {
    const quotes = store.getQuotations();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Official Medical Equipment Quotations (${quotes.length})</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Official formal price estimates & client proposals (with 5% UAE VAT)</p>
          </div>
          <button class="btn btn-primary" id="btn-create-new-quote" style="background: #004d66;">
            + New Formal Quotation
          </button>
        </div>
      </div>

      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Quote #</th>
                <th>Client Hospital / Facility</th>
                <th>Contact Person</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Items Count</th>
                <th>Total (AED)</th>
                <th>Status</th>
                <th>Prepared By</th>
                <th>Print / Export</th>
              </tr>
            </thead>
            <tbody>
              ${quotes.map(q => `
                <tr>
                  <td><strong style="color: #004d66; font-family: monospace;">${q.quoteNumber}</strong></td>
                  <td style="font-weight: 700; color: #0f172a;">${q.clientName}</td>
                  <td>${q.contactPerson}</td>
                  <td style="font-size: 12px; color: #64748b;">${q.date}</td>
                  <td style="font-size: 12px; color: #64748b;">${q.validUntil}</td>
                  <td style="text-align: center;">${(q.items || []).length} Products</td>
                  <td style="font-weight: 800; color: #0f172a; font-size: 13.5px;">${formatAED(q.total)}</td>
                  <td>
                    <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: #fdf2f8; color: #db2777; border: 1px solid #fbcfe8;">
                      ${q.status}
                    </span>
                  </td>
                  <td style="font-size: 12px; color: #475569;">${q.preparedBy || 'Fuhad'}</td>
                  <td>
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 11.5px;" onclick="window.adminPrintQuote('${q.id}')">
                      📄 View & Print PDF
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-create-new-quote')?.addEventListener('click', () => {
      openCreateQuoteModal();
    });
  }

  // ─── TAB: DASHBOARD ───────────────────────────────────────────────────────
  function renderDashboardTab(container) {
    const enquiries = store.getEnquiries();
    const products = store.getProducts();
    const quotes = store.getQuotations();
    const companies = store.data.traderCompanies || [];

    const totalPipeline = enquiries.reduce((acc, e) => acc + (e.estimatedBudget || 0), 0) + quotes.reduce((acc, q) => acc + (q.total || 0), 0);

    container.innerHTML = `
      <!-- FastonMed KPI Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px;">
        <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Total RFQs & Leads</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${enquiries.length}</div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">↑ +28% this month</div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            📑
          </div>
        </div>

        <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Hospital Pipeline</div>
            <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${formatAED(totalPipeline)}</div>
            <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">Active UAE Tenders</div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            💰
          </div>
        </div>

        <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Medical Machines</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${products.length}</div>
            <div style="font-size: 11px; color: #004d66; font-weight: 600; margin-top: 4px;">100% In Stock Dubai</div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            📦
          </div>
        </div>

        <div class="card" style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Partner Traders</div>
            <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">${companies.length || 8}</div>
            <div style="font-size: 11px; color: #6366f1; font-weight: 600; margin-top: 4px;">Authorized UAE Supply</div>
          </div>
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #ede9fe; color: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 20px;">
            🏢
          </div>
        </div>
      </div>

      <!-- Quick Action Row -->
      <div style="display: flex; gap: 10px; margin-bottom: 16px;">
        <button class="btn btn-primary" onclick="openFastonMedAddProductModal()" style="background: #004d66; padding: 10px 18px; font-size: 13.5px;">
          📦 Add Medical Product & Connect Trader
        </button>
        <button class="btn btn-secondary" onclick="switchTab('quotations')" style="padding: 10px 18px; font-size: 13.5px;">
          📄 Create Formal Quotation
        </button>
        <button class="btn btn-secondary" onclick="switchTab('enquiries')" style="padding: 10px 18px; font-size: 13.5px;">
          📋 Review Incoming RFQs
        </button>
      </div>

      <!-- Recent RFQs Table Preview -->
      <div class="fastonmed-table-card">
        <div style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">Recent Website Enquiries & RFQs</h3>
          <a href="#enquiries" onclick="switchTab('enquiries')" style="font-size: 12px; font-weight: 700; color: #004d66; text-decoration: none;">View All &rarr;</a>
        </div>
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref #</th>
                <th>Hospital Facility</th>
                <th>Equipment Requested</th>
                <th>Est. Budget</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${enquiries.slice(0, 5).map(e => `
                <tr>
                  <td style="font-size: 12px; color: #64748b;">${formatDate(e.createdAt)}</td>
                  <td><strong style="color: #004d66; font-family: monospace;">${e.ref}</strong></td>
                  <td style="font-weight: 600;">${e.facilityName}</td>
                  <td>${e.productRequested}</td>
                  <td><strong>${formatAED(e.estimatedBudget)}</strong></td>
                  <td><span style="font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 4px; background: #fee2e2; color: #dc2626;">${e.priority || 'High'}</span></td>
                  <td><span style="font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 9999px; background: #ecfdf5; color: #059669;">${e.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── SUPPORTING TABS (ORGANISATION, PEOPLE, TASKS, BRANDS, AMC) ───────────
  function renderClientsTab(container) {
    const orgs = store.getOrganisations();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">UAE Hospital & Clinic Directory (${orgs.length})</h2>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Specialty hospitals, maternal-fetal departments and day surgery centers</p>
          </div>
          <button class="btn btn-primary" style="background: #004d66;">+ Add Organisation</button>
        </div>
      </div>
      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Hospital / Facility</th>
                <th>Emirate</th>
                <th>Facility Type</th>
                <th>Specialty Department</th>
                <th>Contact Person</th>
                <th>Installed Units</th>
                <th>AMC SLA</th>
              </tr>
            </thead>
            <tbody>
              ${orgs.map(o => `
                <tr>
                  <td><strong style="color: #0f172a;">${o.name}</strong></td>
                  <td>${o.emirate || o.city}</td>
                  <td><span style="font-size: 11px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">${o.type}</span></td>
                  <td style="font-size: 12px; color: #475569;">${o.department}</td>
                  <td>${o.contactPerson}<br><small style="color: #004d66;">${o.phone}</small></td>
                  <td style="text-align: center; font-weight: 700;">${o.activeEquipment || 24}</td>
                  <td><span style="color: #059669; font-weight: 700; font-size: 11px;">● Active</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPeopleTab(container) {
    const orgs = store.getOrganisations();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Healthcare Decision Makers & Biomedical Engineers</h2>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Key contacts across UAE maternity departments</p>
      </div>
      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation / Role</th>
                <th>Organisation</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${orgs.map(o => `
                <tr>
                  <td><strong>${o.contactPerson}</strong></td>
                  <td>Head of Obstetrics / BioMed</td>
                  <td>${o.name}</td>
                  <td><a href="tel:${o.phone}" style="color: #004d66;">${o.phone}</a></td>
                  <td>${o.email}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderTasksTab(container) {
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Tasks & Workload Management</h2>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Demonstration bookings, delivery dispatches and technical commissioning</p>
      </div>
      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Related Client</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Assigned Engineer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Install & Commission GE Voluson E10 Expert</strong></td>
                <td>Medcare Women & Children Hospital</td>
                <td>18 Oct 2026</td>
                <td><span style="color: #dc2626; font-weight: 700;">Critical</span></td>
                <td>Fuhad (Super Admin)</td>
                <td><span style="color: #059669; font-weight: 700;">In Progress</span></td>
              </tr>
              <tr>
                <td><strong>Philips Avalon FM30 Telemetry Transducer Check</strong></td>
                <td>American Hospital Dubai</td>
                <td>20 Oct 2026</td>
                <td><span style="color: #d97706; font-weight: 700;">High</span></td>
                <td>Hashim</td>
                <td><span style="color: #0284c7; font-weight: 700;">Scheduled</span></td>
              </tr>
              <tr>
                <td><strong>MedGyn AL-106HD 4K Demo in Outpatient Clinic</strong></td>
                <td>Danat Al Emarat Hospital</td>
                <td>22 Oct 2026</td>
                <td><span style="color: #475569; font-weight: 700;">Medium</span></td>
                <td>Riyas</td>
                <td><span style="color: #475569; font-weight: 700;">Pending Confirmation</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderLeadsTab(container) {
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Sales Leads & Tenders Pipeline</h2>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Track medical tenders from discovery to won contracts</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
        <div class="card" style="padding: 14px; background: #f8fafc;">
          <h4 style="font-size: 13px; color: #0284c7; margin-bottom: 10px;">New RFQs (2)</h4>
          <div class="card" style="padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 700; font-size: 13px;">King's College Hospital</div>
            <div style="font-size: 12px; color: #64748b;">4K Digital Colposcope</div>
            <div style="font-weight: 700; color: #004d66; margin-top: 4px;">AED 48,500</div>
          </div>
          <div class="card" style="padding: 12px;">
            <div style="font-weight: 700; font-size: 13px;">Prime Maternity Center</div>
            <div style="font-size: 12px; color: #64748b;">4x BirthRight Delivery Beds</div>
            <div style="font-weight: 700; color: #004d66; margin-top: 4px;">AED 248,000</div>
          </div>
        </div>

        <div class="card" style="padding: 14px; background: #f8fafc;">
          <h4 style="font-size: 13px; color: #d97706; margin-bottom: 10px;">Clinical Demo (1)</h4>
          <div class="card" style="padding: 12px;">
            <div style="font-weight: 700; font-size: 13px;">American Hospital Dubai</div>
            <div style="font-size: 12px; color: #64748b;">Avalon FM30 CTG Station</div>
            <div style="font-weight: 700; color: #004d66; margin-top: 4px;">AED 324,000</div>
          </div>
        </div>

        <div class="card" style="padding: 14px; background: #f8fafc;">
          <h4 style="font-size: 13px; color: #6366f1; margin-bottom: 10px;">Quotation Sent (1)</h4>
          <div class="card" style="padding: 12px;">
            <div style="font-weight: 700; font-size: 13px;">Medcare Women & Children</div>
            <div style="font-size: 12px; color: #64748b;">2x Voluson E10 Workstations</div>
            <div style="font-weight: 700; color: #004d66; margin-top: 4px;">AED 676,305</div>
          </div>
        </div>

        <div class="card" style="padding: 14px; background: #f8fafc;">
          <h4 style="font-size: 13px; color: #059669; margin-bottom: 10px;">Won & LPO Received (3)</h4>
          <div class="card" style="padding: 12px;">
            <div style="font-weight: 700; font-size: 13px;">Cleveland Clinic Abu Dhabi</div>
            <div style="font-size: 12px; color: #64748b;">Annual Platinum AMC</div>
            <div style="font-weight: 700; color: #059669; margin-top: 4px;">AED 28,000 / yr</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderBrandsTab(container) {
    const brands = store.getBrands();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Authorized Medical Brands (${brands.length})</h2>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Global manufacturers represented by GYNAEQ across the United Arab Emirates</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;">
        ${brands.map(b => `
          <div class="card" style="padding: 16px;">
            <div style="font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase;">${b.origin}</div>
            <h3 style="font-size: 16px; font-weight: 800; color: #002735; margin: 4px 0 8px 0;">${b.name}</h3>
            <p style="font-size: 12px; color: #64748b; line-height: 1.4;">${b.category}</p>
            <div style="margin-top: 12px; font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; display: inline-block;">
              ${b.badge}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderAmcTab(container) {
    const amcs = store.getAmcContracts();
    container.innerHTML = `
      <div class="catalog-toolbar-card">
        <h2 style="font-size: 17px; font-weight: 800; color: #002735; margin: 0;">Service Track, Calibration & Maintenance Contracts</h2>
        <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Electrical safety tests, transducer checks, and preventive maintenance SLA</p>
      </div>
      <div class="fastonmed-table-card">
        <div class="table-container">
          <table class="fastonmed-table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Client Hospital</th>
                <th>Covered Medical Machine</th>
                <th>Contract SLA Type</th>
                <th>Last Inspection</th>
                <th>Next Calibration Due</th>
                <th>Assigned Engineer</th>
                <th>Annual Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${amcs.map(a => `
                <tr>
                  <td><strong style="color: #004d66; font-family: monospace;">${a.contractNumber}</strong></td>
                  <td style="font-weight: 700; color: #0f172a;">${a.clientName}</td>
                  <td style="font-size: 12.5px;">${a.equipment}</td>
                  <td><span style="font-size: 11px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px;">${a.type}</span></td>
                  <td style="font-size: 12px; color: #64748b;">${a.lastInspection}</td>
                  <td style="font-size: 12px; font-weight: 700; color: #dc2626;">${a.nextDue}</td>
                  <td>${a.assignedEngineer}</td>
                  <td><strong>${formatAED(a.annualFee)}</strong></td>
                  <td><span style="font-size: 11px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">${a.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ─── INITIAL LOAD ────────────────────────────────────────────────────────
  switchTab(activeTab);
});
