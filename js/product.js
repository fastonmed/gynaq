// ==========================================================================
// GYNAEQ Single Product Page Controller (Fastonmed Medical Architecture)
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

  // Default to electric-gynaecology-examination-chair or first product in catalog
  if (!productId) {
    productId = store.getProductById('electric-gynaecology-examination-chair')?.id || store.getProducts()[0]?.id;
  }

  const p = store.getProductById(productId);
  if (!p) {
    document.getElementById('product-detail-main').innerHTML = `
      <div style="text-align: center; padding: 80px 24px;">
        <h2>Medical system not found</h2>
        <p style="color: var(--beco-text-muted); margin: 12px 0 24px;">The requested equipment model may have been relocated or updated in our catalog.</p>
        <a href="/shop" class="beco-btn beco-btn-primary" style="background: var(--beco-primary); color: #fff; padding: 12px 24px; border-radius: 6px; font-weight: 700;">Browse All Medical Equipment</a>
      </div>
    `;
    return;
  }

  // 2. Set Page Meta Title & Breadcrumb
  document.title = `${p.title} (${p.sku}) | Official UAE Price & Specs | GYNAEQ`;
  const metaDesc = document.getElementById('page-meta-desc');
  if (metaDesc) {
    metaDesc.content = `${p.title} official UAE specifications, distributor warranty, DHA/MoHAP registration and hospital tender pricing. In stock Dubai.`;
  }

  const bcCat = document.getElementById('bc-category-name');
  if (bcCat) {
    bcCat.innerHTML = `<a href="/category?id=${p.categoryId}">${p.categoryName || 'Medical Equipment'}</a>`;
  }
  const bcTitle = document.getElementById('bc-product-title');
  if (bcTitle) bcTitle.textContent = p.title;

  // 3. Populate Left Column: Images & Badges

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
      p.image,
      '/assets/hero_suite.jpg'
    ];
    thumbContainer.innerHTML = thumbnails.map((img, idx) => `
      <div class="faston-thumb ${idx === 0 ? 'active' : ''}" data-src="${img}">
        <img src="${img}" alt="${p.title} view ${idx + 1}">
      </div>
    `).join('');

    thumbContainer.querySelectorAll('.faston-thumb').forEach(th => {
      th.addEventListener('click', () => {
        thumbContainer.querySelectorAll('.faston-thumb').forEach(t => t.classList.remove('active'));
        th.classList.add('active');
        if (mainImgEl) mainImgEl.src = th.getAttribute('data-src');
      });
    });
  }

  // 4. Populate Right Column: Eyebrow, Title, SKU, Brand, Price
  const catEyebrowEl = document.getElementById('prod-cat-eyebrow');
  if (catEyebrowEl) {
    catEyebrowEl.textContent = (p.categoryName || 'HOSPITAL MEDICAL SYSTEM').toUpperCase();
  }

  const titleEl = document.getElementById('prod-title');
  if (titleEl) titleEl.textContent = p.title;

  const skuEl = document.getElementById('prod-sku');
  if (skuEl) skuEl.textContent = `SKU: ${p.sku}`;

  const brandEl = document.getElementById('prod-brand');
  if (brandEl) brandEl.textContent = `Brand: ${p.brand}`;

  const certTagEl = document.getElementById('prod-cert-tag');
  if (certTagEl) {
    certTagEl.textContent = p.certifications && p.certifications[0] 
      ? `✓ ${p.certifications[0]} & UAE MoHAP Approved`
      : '✓ UAE MoHAP Approved & DHA Compliant';
  }

  const stockTextEl = document.getElementById('prod-stock-text');
  if (stockTextEl) {
    stockTextEl.textContent = p.inStock ? 'In stock · Delivery in 24–48 hours' : 'Available to order · 7–14 days';
  }

  const reviewsEl = document.getElementById('prod-reviews');
  if (reviewsEl) {
    reviewsEl.textContent = `${p.rating || '5.0'} (${p.reviewsCount || 18} verified UAE hospital installations)`;
  }

  const priceEl = document.getElementById('prod-price');
  if (priceEl) {
    priceEl.textContent = p.callForPrice ? 'Contact For Official Quote' : formatAED(p.price);
  }

  const descEl = document.getElementById('prod-desc');
  if (descEl) {
    descEl.textContent = p.shortDesc || p.description?.substring(0, 220) + '...' || '';
  }

  // Highlights list
  const highlightsEl = document.getElementById('prod-highlights');
  if (highlightsEl) {
    const highlights = p.features && p.features.length > 0 
      ? p.features 
      : Object.entries(p.specifications || {}).map(([k, v]) => `${k}: ${v}`).slice(0, 5);

    highlightsEl.innerHTML = highlights.map(f => `
      <li class="faston-highlight-item">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // Fastonmed WhatsApp Inquire Button
  const waBtn = document.getElementById('btn-prod-whatsapp');
  if (waBtn) {
    const pageUrl = window.location.href;
    const msg = `Hello GYNAEQ Sales Team,\nI would like to inquire about purchasing:\n*${p.title}*\nSKU: ${p.sku}\nPrice: ${p.callForPrice ? 'Contact for Quote' : formatAED(p.price)}\nLink: ${pageUrl}`;
    waBtn.href = `https://wa.me/971508893589?text=${encodeURIComponent(msg)}`;
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
      window.GynaeqLayout.showToast(`Added ${qty}x ${p.title} to your official RFQ basket!`, 'success');
      window.GynaeqLayout.openRFQDrawer();
    }
  });

  // 6. Fastonmed Detailed Specs Table
  const specsTableEl = document.getElementById('prod-specs-table');
  if (specsTableEl) {
    const baseSpecs = p.specifications ? Object.entries(p.specifications) : [];
    // Ensure all critical Fastonmed medical spec keys are represented
    const defaultSpecs = [
      ['Product Model', p.model || p.title],
      ['Brand Manufacturer', p.brand || 'GYNAEQ Medical'],
      ['Catalog SKU', p.sku],
      ['Warehouse Dispatch', p.leadTime || '24 - 48 Hours Express Delivery (Dubai)'],
      ['Warranty Coverage', p.warranty || '2 Years Comprehensive Biomedical Warranty'],
      ['Regulatory Approval', (p.certifications || ['CE Mark', 'MoHAP Registered']).join(', ')]
    ];

    const merged = [...defaultSpecs, ...baseSpecs.filter(([k]) => !defaultSpecs.some(([dk]) => dk.toLowerCase() === k.toLowerCase()))];

    specsTableEl.innerHTML = merged.map(([k, v]) => `
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
      <div style="display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; background: #F8FAFC; border-radius: 8px; border: 1px solid var(--beco-border-subtle);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--beco-primary); flex-shrink: 0; margin-top: 2px;"><polyline points="20 6 9 17 4 12"/></svg>
        <span style="font-size: 0.875rem; color: var(--beco-text-dark); font-weight: 500;">${item}</span>
      </div>
    `).join('');
  }

  // 8. Regulatory Compliance Tab
  const certListEl = document.getElementById('prod-cert-list');
  if (certListEl) {
    const certs = p.certifications || ['CE Mark 0197 (Medical Class II/III)', 'UAE Ministry of Health & Prevention (MoHAP) Registered', 'ISO 13485:2016 Biomedical Quality Standard'];
    certListEl.innerHTML = certs.map(c => `
      <li style="display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 0.9rem; color: var(--beco-text-dark);">
        <span style="width: 22px; height: 22px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">✓</span>
        <span>${c}</span>
      </li>
    `).join('');
  }

  // 9. Tab Switching
  document.querySelectorAll('.faston-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.faston-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.faston-tab-pane').forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.getAttribute('data-tab')}`;
      document.getElementById(targetId)?.classList.add('active');
    });
  });

  // 10. Related Products Carousel matching Ecomus / BeCosmetics Cards
  const relatedGridEl = document.getElementById('related-product-grid');
  if (relatedGridEl) {
    const related = store.getProducts()
      .filter(item => item.id !== p.id && (item.categoryId === p.categoryId || item.brandId === p.brandId))
      .slice(0, 4);

    const displayItems = [...related, ...store.getProducts().filter(i => i.id !== p.id && !related.some(r => r.id === i.id))].slice(0, 4);

    relatedGridEl.innerHTML = displayItems.map(item => {
      const waMsg = `Hello GYNAEQ Sales Team,\nI would like to inquire about: *${item.title}* (SKU: ${item.sku}, Price: ${item.callForPrice ? 'Quote' : formatAED(item.price)}).\nLink: https://www.gynaeq.com/product?id=${item.id}`;
      const waLink = `https://wa.me/971508893589?text=${encodeURIComponent(waMsg)}`;

      return `
        <div class="ecomus-card" data-id="${item.id}">
          <div class="ecomus-card-stage">
            <div class="ecomus-card-badges">
              <span class="ecomus-badge-chip ecomus-badge-green">In Stock</span>
            </div>
            <a href="/product?id=${item.id}" style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center;">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
            </a>
            <div class="ecomus-hover-actions">
              <button class="ecomus-action-btn" data-add-rfq="${item.id}" title="Add to RFQ Basket">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Add Quote</span>
              </button>
              <a href="${waLink}" target="_blank" class="ecomus-action-btn btn-wa" title="WhatsApp Enquiry">
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div class="ecomus-card-body">
            <div class="ecomus-card-brand">${item.brand}</div>
            <h3 class="ecomus-card-title">
              <a href="/product?id=${item.id}">${item.title}</a>
            </h3>
            <div class="ecomus-card-specs">
              ${item.shortDesc || 'Advanced medical system authorized for UAE healthcare facilities.'}
            </div>
            <div class="ecomus-card-price-row">
              <div class="ecomus-card-price">${item.callForPrice ? 'Contact For Quote' : formatAED(item.price)}</div>
              <div class="ecomus-card-stock">
                <span class="ecomus-card-stock-dot"></span>
                <span>In Stock (Dubai)</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Keep actual browsing history and the enquiry action available below the gallery.
  const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try {
    const saved = JSON.parse(localStorage.getItem('gynaeq_recent_products') || '[]');
    const previous = (Array.isArray(saved) ? saved : []).filter(id => id !== p.id);
    const recent = previous.map(id => store.getProductById(id)).filter(Boolean).slice(0, 4);
    if (recent.length) {
      document.getElementById('product-recent-section').hidden = false;
      document.getElementById('product-recent-grid').innerHTML = recent.map(item => `<a class="product-recent-card" href="/product?id=${encodeURIComponent(item.id)}"><div><img src="${escapeText(item.image)}" alt="${escapeText(item.title)}" loading="lazy"></div><h3>${escapeText(item.title)}</h3><strong>${item.callForPrice ? 'Price on request' : formatAED(item.price)}</strong></a>`).join('');
    }
    localStorage.setItem('gynaeq_recent_products', JSON.stringify([p.id, ...previous].slice(0, 12)));
  } catch {}
  const stickyBar = document.getElementById('product-sticky-bar');
  document.getElementById('sticky-product-image').src = p.image;
  document.getElementById('sticky-product-name').textContent = p.title;
  document.getElementById('sticky-product-price').textContent = p.callForPrice ? 'Price on request' : formatAED(p.price);
  document.getElementById('sticky-product-rfq').onclick = () => document.getElementById('btn-add-to-rfq').click();
  const actions = document.querySelector('.faston-actions-bar');
  if (actions) new IntersectionObserver(entries => {
    const entry = entries[0];
    stickyBar.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
  }).observe(actions);
});
