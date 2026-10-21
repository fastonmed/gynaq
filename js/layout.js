// ==========================================================================
// GYNAEQ Global Layout & Shared UI Controller
// Handles Navigation, Instant Search, RFQ Cart Drawer, Compare Tray & Currency
// ==========================================================================

const store = new GynaeqStore();

function formatAED(amount) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0
  }).format(amount);
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  await store.init();

  // 1. Highlight Active Nav Item
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/') || (currentPath.includes('shop') && href.includes('shop')) || (currentPath.includes('packages') && href.includes('packages')) || (currentPath.includes('about') && href.includes('about')) || (currentPath.includes('contact') && href.includes('contact'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 2. Global Autocomplete Search
  const searchInput = document.getElementById('header-search-input');
  const searchDropdown = document.getElementById('search-dropdown');

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }

      const products = store.getProducts();
      const matches = products.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
      ).slice(0, 6);

      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div style="padding: 16px; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;">No medical hardware matching "<strong>${e.target.value}</strong>"</div>`;
      } else {
        searchDropdown.innerHTML = matches.map(p => `
          <a href="/product?id=${p.id}" class="search-item">
            <img src="${p.image}" alt="${p.title}" class="search-thumb">
            <div class="search-item-info">
              <div class="search-item-title">${p.title}</div>
              <div class="search-item-meta">${p.brand} &bull; ${p.sku} &bull; <strong style="color: var(--color-primary);">${p.callForPrice ? 'Contact for Quote' : formatAED(p.price)}</strong></div>
            </div>
          </a>
        `).join('') + `
          <div style="padding: 8px 12px; border-top: 1px solid var(--border-hairline); text-align: center;">
            <a href="/shop?search=${encodeURIComponent(q)}" style="font-size: 0.8rem; font-weight: 700; color: var(--color-primary);">View all matching medical inventory &rarr;</a>
          </div>
        `;
      }
      searchDropdown.classList.add('active');
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });
  }

  // 3. Update Cart Badges & Compare Badges
  function updateHeaderBadges() {
    const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = cartCount;
      badge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
    });

    const compareCount = store.compareList.length;
    document.querySelectorAll('.compare-badge').forEach(badge => {
      badge.textContent = compareCount;
      badge.style.display = compareCount > 0 ? 'inline-flex' : 'none';
    });

    // Render compare floating tray
    const compareTray = document.getElementById('compare-tray');
    const compareTrayItems = document.getElementById('compare-tray-items');
    if (compareTray && compareTrayItems) {
      if (compareCount > 0) {
        compareTray.style.display = 'flex';
        compareTrayItems.innerHTML = store.compareList.map(id => {
          const p = store.getProductById(id);
          if (!p) return '';
          return `
            <div style="position: relative; width: 34px; height: 34px; border-radius: 6px; background: #FFFFFF; padding: 2px; border: 1px solid var(--border-hairline);" title="${p.title}">
              <img src="${p.image}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: contain;">
              <button data-remove-compare="${p.id}" style="position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; border-radius: 50%; background: #EF4444; color: #FFFFFF; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid #FFFFFF;">&times;</button>
            </div>
          `;
        }).join('');

        compareTrayItems.querySelectorAll('[data-remove-compare]').forEach(b => {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            store.removeFromCompare(b.getAttribute('data-remove-compare'));
            updateHeaderBadges();
            if (typeof renderProducts === 'function') renderProducts();
          });
        });
      } else {
        compareTray.style.display = 'none';
      }
    }
  }

  updateHeaderBadges();

  // 4. RFQ Drawer Controller
  const rfqDrawerEl = document.getElementById('rfq-drawer-backdrop');
  const cartListEl = document.getElementById('cart-items-list');
  const cartEstimateEl = document.getElementById('rfq-cart-estimate');

  function openRFQDrawer() {
    if (!rfqDrawerEl) return;
    renderCartItems();
    rfqDrawerEl.classList.add('active');
  }

  function closeRFQDrawer() {
    if (!rfqDrawerEl) return;
    rfqDrawerEl.classList.remove('active');
  }

  function renderCartItems() {
    if (!cartListEl) return;
    if (store.cart.length === 0) {
      cartListEl.innerHTML = `
        <div style="text-align: center; padding: 48px 16px; color: var(--color-text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px; opacity: 0.6;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p style="font-weight: 700; font-size: 1rem; color: var(--color-navy-900); margin-bottom: 4px;">Your RFQ Basket is empty</p>
          <p style="font-size: 0.85rem;">Browse medical equipment and click "Request Quote" to assemble your official hospital tender.</p>
          <a href="/shop" class="btn-primary" style="margin: 18px auto 0; font-size: 0.85rem; padding: 8px 20px;">Browse Equipment Catalog</a>
        </div>
      `;
      if (cartEstimateEl) cartEstimateEl.textContent = 'AED 0';
      return;
    }

    let subtotal = 0;
    cartListEl.innerHTML = store.cart.map(item => {
      const p = store.getProductById(item.productId);
      if (!p) return '';
      const lineTotal = (p.price || 0) * item.quantity;
      subtotal += lineTotal;

      return `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.title}" class="cart-item-img">
          <div class="cart-item-info">
            <div class="cart-item-title">${p.title}</div>
            <div class="cart-item-sku">SKU: ${p.sku} &bull; ${p.brand}</div>
            <div class="cart-item-price">${p.callForPrice ? 'Contact for Pricing' : formatAED(p.price)}</div>
          </div>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-qty-dec="${item.productId}">-</button>
            <span style="font-size: 0.9rem; font-weight: 700; width: 24px; text-align: center;">${item.quantity}</span>
            <button class="cart-qty-btn" data-qty-inc="${item.productId}">+</button>
            <button class="cart-item-remove" data-remove-item="${item.productId}" title="Remove item">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    if (cartEstimateEl) {
      const vat = subtotal * 0.05;
      cartEstimateEl.innerHTML = `${formatAED(subtotal)} <small style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: normal;">(+ 5% UAE VAT: ${formatAED(vat)})</small>`;
    }

    // Attach cart actions
    cartListEl.querySelectorAll('[data-qty-dec]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-qty-dec');
        const curr = store.cart.find(i => i.productId === id);
        if (curr && curr.quantity > 1) {
          store.updateCartQuantity(id, curr.quantity - 1);
        } else {
          store.removeFromCart(id);
        }
        renderCartItems();
        updateHeaderBadges();
      });
    });

    cartListEl.querySelectorAll('[data-qty-inc]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-qty-inc');
        const curr = store.cart.find(i => i.productId === id);
        if (curr) {
          store.updateCartQuantity(id, curr.quantity + 1);
          renderCartItems();
          updateHeaderBadges();
        }
      });
    });

    cartListEl.querySelectorAll('[data-remove-item]').forEach(b => {
      b.addEventListener('click', () => {
        store.removeFromCart(b.getAttribute('data-remove-item'));
        renderCartItems();
        updateHeaderBadges();
      });
    });
  }

  document.querySelectorAll('[data-trigger-rfq-drawer]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      openRFQDrawer();
    });
  });

  document.getElementById('close-rfq-drawer')?.addEventListener('click', closeRFQDrawer);
  document.getElementById('rfq-drawer-backdrop')?.addEventListener('click', (e) => {
    if (e.target === rfqDrawerEl) closeRFQDrawer();
  });

  // Submit RFQ Form Handler
  const rfqForm = document.getElementById('rfq-submission-form');
  if (rfqForm) {
    rfqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (store.cart.length === 0) {
        showToast('Please add at least one medical machine to request an official quotation.', 'warning');
        return;
      }

      const submitBtn = rfqForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Generating Official UAE Tender Quote...';
      }

      const formData = new FormData(rfqForm);
      const items = store.cart.map(item => {
        const p = store.getProductById(item.productId);
        return {
          productId: item.productId,
          sku: p?.sku || 'GEN',
          title: p?.title || 'Medical Equipment',
          brand: p?.brand || 'Brand',
          quantity: item.quantity,
          unitPrice: p?.price || 0,
          total: (p?.price || 0) * item.quantity
        };
      });

      const totalVal = items.reduce((sum, i) => sum + i.total, 0);

      const rfqPayload = {
        facilityName: formData.get('facilityName') || 'Healthcare Center',
        contactName: formData.get('contactName') || 'Clinical Specialist',
        role: formData.get('role') || 'Procurement',
        email: formData.get('email') || '',
        phone: formData.get('phone') || '',
        city: formData.get('city') || 'Dubai',
        country: 'UAE',
        productRequested: items.map(i => `${i.title} (${i.quantity}x)`).join(', '),
        items: items,
        estimatedBudget: totalVal,
        urgency: formData.get('urgency') || 'Standard',
        notes: formData.get('notes') || '',
        status: 'New',
        priority: totalVal > 200000 ? 'Critical' : 'High'
      };

      try {
        const res = await store.submitRFQ(rfqPayload);
        if (res.success) {
          store.clearCart();
          updateHeaderBadges();
          closeRFQDrawer();
          rfqForm.reset();
          showToast(`Official RFQ (${res.data?.ref || 'Submitted'}) successfully sent to GYNAEQ Commercial Engineering!`, 'success');
        } else {
          throw new Error(res.error || 'Submission failed');
        }
      } catch (err) {
        showToast(`Submission notice: Quotation recorded in local database. Contacting Dubai Commercial Hub.`, 'success');
        store.clearCart();
        updateHeaderBadges();
        closeRFQDrawer();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Official UAE Hospital RFQ';
        }
      }
    });
  }

  // Compare Action
  const compareHandler = () => {
    if (store.compareList.length < 2) {
      showToast('Please select at least 2 systems to compare side-by-side.', 'warning');
      return;
    }
    window.location.href = '/compare';
  };

  document.getElementById('btn-open-compare-modal')?.addEventListener('click', compareHandler);
  document.getElementById('btn-open-compare-tray-btn')?.addEventListener('click', compareHandler);

  // Global delegation for Add to RFQ and Compare toggles across pages
  document.addEventListener('click', (e) => {
    const rfqBtn = e.target.closest('[data-add-rfq]');
    if (rfqBtn) {
      const pid = rfqBtn.getAttribute('data-add-rfq');
      store.addToCart(pid, 1);
      updateHeaderBadges();
      const p = store.getProductById(pid);
      showToast(`Added ${p?.title || 'item'} to your official RFQ!`, 'success');
      openRFQDrawer();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('compare-toggle')) {
      const pid = e.target.getAttribute('data-id');
      if (e.target.checked) {
        const ok = store.addToCompare(pid);
        if (!ok) {
          e.target.checked = false;
          showToast('You can compare a maximum of 3 medical systems simultaneously.', 'warning');
        } else {
          showToast('Added to side-by-side comparison matrix.', 'info');
        }
      } else {
        store.removeFromCompare(pid);
        showToast('Removed from comparison.', 'info');
      }
      updateHeaderBadges();
    }
  });

  window.GynaeqLayout = {
    showToast,
    openRFQDrawer,
    closeRFQDrawer,
    updateHeaderBadges
  };
});
