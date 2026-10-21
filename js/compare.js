// ==========================================================================
// GYNAEQ Side-by-Side Comparison Matrix Controller
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  await store.init();

  const container = document.getElementById('compare-matrix-container');
  const btnClearAll = document.getElementById('btn-clear-all-compare');

  // If empty or only 1 item, suggest default top 2 systems
  if (store.compareList.length < 2) {
    const products = store.getProducts();
    if (products.length >= 2) {
      if (!store.compareList.includes(products[0].id)) store.compareList.push(products[0].id);
      if (!store.compareList.includes(products[1].id)) store.compareList.push(products[1].id);
      store.saveLocalStorage('gynaeq_compare', store.compareList);
      if (window.GynaeqLayout) window.GynaeqLayout.updateHeaderBadges();
    }
  }

  function renderMatrix() {
    if (!container) return;
    const products = store.compareList.map(id => store.getProductById(id)).filter(Boolean);

    if (products.length === 0) {
      container.innerHTML = `
        <div style="padding: 64px 24px; text-align: center;">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; color: var(--color-navy-900); margin-bottom: 8px;">No systems selected for comparison</h3>
          <p style="color: var(--color-text-muted); font-size: 0.95rem; margin-bottom: 20px;">Browse the medical hardware catalog and select "Compare" on up to 3 machines.</p>
          <a href="/shop" class="btn-primary" style="margin: 0 auto;">Open Equipment Catalog &rarr;</a>
        </div>
      `;
      return;
    }

    // Collect all spec keys
    const allKeys = new Set();
    products.forEach(p => {
      Object.keys(p.specifications || {}).forEach(k => allKeys.add(k));
    });

    const keyList = Array.from(allKeys);

    let html = `
      <table class="compare-table">
        <thead>
          <tr>
            <th style="width: 220px; background: #F8FAFC; text-align: left; font-family: var(--font-heading); font-weight: 800; color: var(--color-navy-900); font-size: 1rem;">
              Medical Parameter
            </th>
            ${products.map(p => `
              <th class="compare-col-header" style="width: 320px;">
                <div style="position: relative; padding: 12px;">
                  <button data-remove-compare="${p.id}" style="position: absolute; top: 0; right: 0; background: #EF4444; color: #FFFFFF; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="Remove system from matrix">&times;</button>
                  <img src="${p.image}" alt="${p.title}" class="compare-thumb-img">
                  <div style="font-family: var(--font-heading); font-size: 0.75rem; font-weight: 800; color: var(--color-primary); text-transform: uppercase;">${p.brand}</div>
                  <h3 style="font-family: var(--font-heading); font-size: 1.05rem; font-weight: 800; color: var(--color-navy-900); margin: 6px 0 10px; line-height: 1.3;">
                    <a href="/product?id=${p.id}" style="color: inherit;">${p.title}</a>
                  </h3>
                  <div style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 800; color: var(--color-navy-900); margin-bottom: 12px;">
                    ${p.callForPrice ? 'Contact for Quote' : formatAED(p.price)}
                  </div>
                  <button class="btn-primary" data-add-rfq="${p.id}" style="width: 100%; justify-content: center; font-size: 0.85rem; padding: 8px 14px;">
                    Request Quote
                  </button>
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 700; background: #F8FAFC;">Catalog SKU</td>
            ${products.map(p => `<td style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700;">${p.sku}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; background: #F8FAFC;">Clinical Category</td>
            ${products.map(p => `<td style="font-size: 0.85rem;">${p.categoryName}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; background: #F8FAFC;">Dubai Stock Availability</td>
            ${products.map(p => `<td style="font-size: 0.85rem; color: #059669; font-weight: 700;">● In Stock (24-48h Delivery)</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; background: #F8FAFC;">Warranty & Biomedical SLA</td>
            ${products.map(p => `<td style="font-size: 0.85rem;">${p.warranty || '2 Years Official Warranty'}</td>`).join('')}
          </tr>
          <tr>
            <td style="font-weight: 700; background: #F8FAFC;">Certifications</td>
            ${products.map(p => `<td style="font-size: 0.85rem;">${(p.certifications || []).join(' &bull; ')}</td>`).join('')}
          </tr>
          ${keyList.map(key => `
            <tr>
              <td style="font-weight: 700; background: #F8FAFC;">${key}</td>
              ${products.map(p => `<td style="font-size: 0.85rem; line-height: 1.5;">${p.specifications?.[key] || '&mdash;'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;

    container.querySelectorAll('[data-remove-compare]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-remove-compare');
        store.removeFromCompare(id);
        if (window.GynaeqLayout) window.GynaeqLayout.updateHeaderBadges();
        renderMatrix();
      });
    });
  }

  btnClearAll?.addEventListener('click', () => {
    store.compareList = [];
    store.saveLocalStorage('gynaeq_compare', []);
    if (window.GynaeqLayout) window.GynaeqLayout.updateHeaderBadges();
    renderMatrix();
  });

  renderMatrix();
});
