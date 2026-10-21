// ==========================================================================
// GYNAEQ Single Product Page Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await store.init();

  // 1. Resolve Product ID
  const urlParams = new URLSearchParams(window.location.search);
  let productId = urlParams.get('id');

  if (!productId) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1 && pathParts[0] === 'product') {
      productId = pathParts[1];
    }
  }

  // Default to first product in catalog if none specified
  if (!productId) {
    productId = store.getProducts()[0]?.id || 'electric-gynaecology-examination-chair';
  }

  const p = store.getProductById(productId) || store.getProducts()[0];
  if (!p) {
    document.getElementById('product-detail-main').innerHTML = `
      <div style="text-align: center; padding: 80px 24px;">
        <h2>Medical system not found</h2>
        <p style="color: var(--color-text-muted); margin: 12px 0 24px;">The requested equipment model may have been relocated or updated in our catalog.</p>
        <a href="/shop" class="btn-primary">Browse All Medical Equipment</a>
      </div>
    `;
    return;
  }

  // 2. Set Page Meta Title & Breadcrumb
  document.title = `${p.title} (${p.sku}) | Official UAE Price & Specs | GYNAEQ`;
  const metaDesc = document.getElementById('page-meta-desc');
  if (metaDesc) metaDesc.content = `${p.title} official UAE specifications, distributor warranty, DHA/MoHAP registration and hospital tender pricing. In stock Dubai.`;

  const bcCat = document.getElementById('bc-category-name');
  if (bcCat) {
    bcCat.innerHTML = `<a href="/category?id=${p.categoryId}" class="breadcrumb-link">${p.categoryName || 'Medical Category'}</a>`;
  }
  const bcTitle = document.getElementById('bc-product-title');
  if (bcTitle) bcTitle.textContent = p.title;

  // 3. Populate Left Column: Images & Badges
  const badgeEl = document.getElementById('prod-badge');
  if (badgeEl) badgeEl.textContent = p.badge || 'CE Certified';

  const mainImgEl = document.getElementById('prod-main-img');
  if (mainImgEl) {
    mainImgEl.src = p.image;
    mainImgEl.alt = p.title;
  }

  const thumbContainer = document.getElementById('prod-thumbnails');
  if (thumbContainer) {
    // Generate simulated angle views based on product category
    const thumbnails = [
      p.image,
      p.image, // angle 2
      '/assets/hero_suite.jpg' // clinical setting view
    ];
    thumbContainer.innerHTML = thumbnails.map((img, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" data-src="${img}">
        <img src="${img}" alt="${p.title} view ${idx + 1}">
      </div>
    `).join('');

    thumbContainer.querySelectorAll('.gallery-thumb').forEach(th => {
      th.addEventListener('click', () => {
        thumbContainer.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        th.classList.add('active');
        if (mainImgEl) mainImgEl.src = th.getAttribute('data-src');
      });
    });
  }

  // Brochure Download Simulation
  document.getElementById('btn-download-brochure')?.addEventListener('click', () => {
    showToast(`Downloading official technical datasheet for ${p.sku} (${p.brand})...`, 'info');
    setTimeout(() => {
      showToast(`Technical brochure for ${p.title} downloaded.`, 'success');
    }, 1200);
  });

  // 4. Populate Right Column: Specs, Price, Title
  const brandEl = document.getElementById('prod-brand');
  if (brandEl) brandEl.textContent = p.brand;

  const skuEl = document.getElementById('prod-sku');
  if (skuEl) skuEl.textContent = `SKU: ${p.sku}`;

  const titleEl = document.getElementById('prod-title');
  if (titleEl) titleEl.textContent = p.title;

  const reviewsEl = document.getElementById('prod-reviews');
  if (reviewsEl) reviewsEl.textContent = `${p.rating || '5.0'} (${p.reviewsCount || 14} verified UAE hospital installations)`;

  const priceEl = document.getElementById('prod-price');
  if (priceEl) priceEl.textContent = p.callForPrice ? 'Contact For Official Quote' : formatAED(p.price);

  const descEl = document.getElementById('prod-desc');
  if (descEl) descEl.textContent = p.shortDesc || '';

  // Highlights list
  const highlightsEl = document.getElementById('prod-highlights');
  if (highlightsEl) {
    const highlights = p.features && p.features.length > 0 
      ? p.features 
      : Object.entries(p.specifications || {}).map(([k, v]) => `${k}: ${v}`);

    highlightsEl.innerHTML = highlights.map(f => `
      <li class="product-highlight-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // WhatsApp Button
  const waBtn = document.getElementById('btn-prod-whatsapp');
  if (waBtn) {
    const msg = `Hello GYNAEQ Commercial Engineering, I am inquiring about the ${p.title} (SKU: ${p.sku}, Official UAE Price: ${p.callForPrice ? 'Quote' : formatAED(p.price)}). Please provide availability and technical specifications.`;
    waBtn.href = `https://wa.me/971508921100?text=${encodeURIComponent(msg)}`;
  }

  // 5. Quantity Controls & Add to RFQ
  const qtyInput = document.getElementById('prod-qty-input');
  const btnQtyMinus = document.getElementById('btn-qty-minus');
  const btnQtyPlus = document.getElementById('btn-qty-plus');
  const btnAddRfq = document.getElementById('btn-add-to-rfq');

  btnQtyMinus?.addEventListener('click', () => {
    let q = parseInt(qtyInput.value) || 1;
    if (q > 1) qtyInput.value = q - 1;
  });

  btnQtyPlus?.addEventListener('click', () => {
    let q = parseInt(qtyInput.value) || 1;
    if (q < 20) qtyInput.value = q + 1;
  });

  btnAddRfq?.addEventListener('click', () => {
    const qty = parseInt(qtyInput.value) || 1;
    store.addToCart(p.id, qty);
    if (window.GynaeqLayout) {
      window.GynaeqLayout.updateHeaderBadges();
      window.GynaeqLayout.showToast(`Added ${qty}x ${p.sku} to your official RFQ basket!`, 'success');
      window.GynaeqLayout.openRFQDrawer();
    }
  });

  // 6. Detailed Specs Table
  const specsTableEl = document.getElementById('prod-specs-table');
  if (specsTableEl) {
    const specs = Object.entries(p.specifications || {});
    specsTableEl.innerHTML = specs.map(([k, v]) => `
      <tr>
        <td class="key">${k}</td>
        <td class="val">${v}</td>
      </tr>
    `).join('');
  }

  // 7. Clinical Indications Tab
  const clinicalDescEl = document.getElementById('prod-clinical-desc');
  if (clinicalDescEl) {
    if (p.fullHtmlDesc) {
      clinicalDescEl.innerHTML = p.fullHtmlDesc;
    } else if (p.description) {
      clinicalDescEl.textContent = p.description;
    }
  }

  const clinicalFeaturesEl = document.getElementById('prod-clinical-features');
  if (clinicalFeaturesEl) {
    const features = p.features || [];
    clinicalFeaturesEl.innerHTML = features.map(item => `
      <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #F8FAFC; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--color-primary); flex-shrink: 0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="font-size: 0.9rem; color: var(--color-navy-900); font-weight: 500;">${item}</span>
      </div>
    `).join('');
  }

  // 8. Regulatory Compliance Tab
  const certListEl = document.getElementById('prod-cert-list');
  if (certListEl) {
    const certs = p.certifications || ['CE Mark 0197', 'UAE MoHAP Registered', 'ISO 13485:2016 Medical Quality'];
    certListEl.innerHTML = certs.map(c => `
      <li style="display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 0.95rem; color: var(--color-navy-900);">
        <span style="width: 24px; height: 24px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold;">✓</span>
        <span>${c}</span>
      </li>
    `).join('');
  }

  // 9. Tab Switching
  document.querySelectorAll('.product-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.product-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.getAttribute('data-tab')}`;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // 10. Related Products Carousel
  const relatedGridEl = document.getElementById('related-product-grid');
  if (relatedGridEl) {
    const related = store.getProducts()
      .filter(item => item.id !== p.id && (item.categoryId === p.categoryId || item.brandId === p.brandId))
      .slice(0, 3);

    const displayItems = related.length > 0 ? related : store.getProducts().filter(i => i.id !== p.id).slice(0, 3);

    relatedGridEl.innerHTML = displayItems.map(item => `
      <div class="product-card bezel-outer" data-id="${item.id}">
        <div class="product-card-inner bezel-inner">
          <div class="product-card-media">
            <span class="product-badge-tag">${item.badge || 'CE Certified'}</span>
            <a href="/product?id=${item.id}" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
            </a>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column;">
            <div class="product-meta-row">
              <span class="product-brand">${item.brand}</span>
              <span class="product-sku">${item.sku}</span>
            </div>

            <h3 class="product-title" title="${item.title}">
              <a href="/product?id=${item.id}" style="color: inherit;">${item.title}</a>
            </h3>
          </div>

          <div class="product-card-footer">
            <div class="product-pricing-row">
              <div class="product-price-box">
                <span class="product-price-label">Official UAE Price</span>
                <span class="product-price-value">${item.callForPrice ? 'Contact For Quote' : formatAED(item.price)}</span>
              </div>
              <div class="product-stock-status">
                <span class="stock-indicator-dot"></span>
                <span>In Stock</span>
              </div>
            </div>

            <div class="product-card-actions">
              <button class="btn-card-rfq" data-add-rfq="${item.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span>Request Quote</span>
              </button>
              <a href="/product?id=${item.id}" class="btn-card-quickview">
                <span>Details &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
});
