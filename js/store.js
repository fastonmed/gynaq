// ==========================================================================
// GYNAEQ Reactive Store & Data Management Client
// Handles bi-directional sync between Storefront and Executive Admin CRM
// ==========================================================================

class GynaeqStore {
  constructor() {
    this.data = {
      company: {},
      categories: [],
      brands: [],
      products: [],
      organisations: [],
      enquiries: [],
      quotations: [],
      amcContracts: [],
      traderCompanies: []
    };
    
    // RFQ Quote Cart state (persists across pages)
    this.cart = this.loadLocalStorage('gynaeq_rfq_cart', []);
    
    // Side-by-side Comparison state (max 3 items)
    this.compareList = this.loadLocalStorage('gynaeq_compare', []);
    
    // Active filters
    this.filters = {
      category: 'all',
      brand: 'all',
      search: '',
      stockOnly: false,
      sort: 'featured'
    };

    this.listeners = new Map();
  }

  loadLocalStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }

  saveLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(payload));
    }
  }

  async init() {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        this.data = await res.json();
        this.saveLocalStorage('gynaeq_cached_db', this.data);
      } else {
        throw new Error('API offline');
      }
    } catch (e) {
      console.warn('Using local cached database or fallback seed data:', e);
      const cached = this.loadLocalStorage('gynaeq_cached_db', null);
      if (cached) {
        this.data = cached;
      }
    }
    this.emit('data:ready', this.data);
    return this.data;
  }

  // ─── QUERY HELPERS ────────────────────────────────────────────────────────

  getProducts() {
    return this.data.products || [];
  }

  getProductById(id) {
    return (this.data.products || []).find(p => p.id === id || p.sku === id);
  }

  getCategories() {
    return this.data.categories || [];
  }

  getBrands() {
    return this.data.brands || [];
  }

  getEnquiries() {
    return this.data.enquiries || [];
  }

  getQuotations() {
    return this.data.quotations || [];
  }

  getOrganisations() {
    return this.data.organisations || [];
  }

  getAmcContracts() {
    return this.data.amcContracts || [];
  }

  getCompany() {
    return this.data.company || {};
  }

  getFilteredProducts() {
    let list = [...(this.data.products || [])];

    // Filter by Category
    if (this.filters.category && this.filters.category !== 'all') {
      list = list.filter(p => p.categoryId === this.filters.category || p.categoryName === this.filters.category);
    }

    // Filter by Brand
    if (this.filters.brand && this.filters.brand !== 'all') {
      list = list.filter(p => p.brandId === this.filters.brand || p.brand === this.filters.brand);
    }

    // Filter by Stock
    if (this.filters.stockOnly) {
      list = list.filter(p => p.inStock);
    }

    // Search query
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (this.filters.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (this.filters.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (this.filters.sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (this.filters.sort === 'name-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }

  // ─── RFQ / CART ENGINE ───────────────────────────────────────────────────

  addToCart(productId, quantity = 1) {
    const product = this.getProductById(productId);
    if (!product) return;

    const existingIndex = this.cart.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        productId,
        quantity,
        product,
        addedAt: new Date().toISOString()
      });
    }

    this.saveLocalStorage('gynaeq_rfq_cart', this.cart);
    this.emit('cart:updated', this.cart);
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.saveLocalStorage('gynaeq_rfq_cart', this.cart);
    this.emit('cart:updated', this.cart);
  }

  updateCartQuantity(productId, quantity) {
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveLocalStorage('gynaeq_rfq_cart', this.cart);
      this.emit('cart:updated', this.cart);
    }
  }

  clearCart() {
    this.cart = [];
    this.saveLocalStorage('gynaeq_rfq_cart', this.cart);
    this.emit('cart:updated', this.cart);
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => {
      const p = this.getProductById(item.productId);
      return sum + (p && !p.callForPrice ? p.price * item.quantity : 0);
    }, 0);
  }

  // ─── COMPARISON ENGINE ───────────────────────────────────────────────────

  toggleCompare(productId) {
    const index = this.compareList.indexOf(productId);
    if (index > -1) {
      this.compareList.splice(index, 1);
    } else {
      if (this.compareList.length >= 3) {
        this.compareList.shift(); // keep max 3 items
      }
      this.compareList.push(productId);
    }
    this.saveLocalStorage('gynaeq_compare', this.compareList);
    this.emit('compare:updated', this.compareList);
  }

  removeFromCompare(productId) {
    this.compareList = this.compareList.filter(id => id !== productId);
    this.saveLocalStorage('gynaeq_compare', this.compareList);
    this.emit('compare:updated', this.compareList);
  }

  clearCompare() {
    this.compareList = [];
    this.saveLocalStorage('gynaeq_compare', this.compareList);
    this.emit('compare:updated', this.compareList);
  }

  // ─── MUTATIONS (SYNC TO SERVER & ADMIN) ───────────────────────────────────

  async submitRFQ(rfqData) {
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rfqData)
      });
      const data = await res.json();
      if (data.success && data.enquiry) {
        this.data.enquiries = [data.enquiry, ...(this.data.enquiries || [])];
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('enquiries:updated', this.data.enquiries);
        return data.enquiry;
      }
    } catch (e) {
      // Fallback local save
      const fallbackEnquiry = {
        id: `enq-${Date.now()}`,
        ref: `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        ...rfqData,
        status: 'New',
        priority: 'High',
        createdAt: new Date().toISOString()
      };
      this.data.enquiries = [fallbackEnquiry, ...(this.data.enquiries || [])];
      this.saveLocalStorage('gynaeq_cached_db', this.data);
      this.emit('enquiries:updated', this.data.enquiries);
      return fallbackEnquiry;
    }
  }

  async updateEnquiryStatus(id, status, assignedTo, notes) {
    try {
      const res = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, assignedTo, notes })
      });
      const data = await res.json();
      if (data.success && data.enquiry) {
        const idx = this.data.enquiries.findIndex(e => e.id === id);
        if (idx !== -1) this.data.enquiries[idx] = data.enquiry;
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('enquiries:updated', this.data.enquiries);
      }
    } catch (e) {
      const idx = this.data.enquiries.findIndex(e => e.id === id);
      if (idx !== -1) {
        if (status) this.data.enquiries[idx].status = status;
        if (assignedTo) this.data.enquiries[idx].assignedTo = assignedTo;
        if (notes) this.data.enquiries[idx].notes = notes;
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('enquiries:updated', this.data.enquiries);
      }
    }
  }

  async addProduct(productData) {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (data.success && data.product) {
        this.data.products = [data.product, ...(this.data.products || [])];
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('products:updated', this.data.products);
        return data.product;
      }
    } catch {
      const newP = { id: `gnq-${Date.now()}`, ...productData };
      this.data.products = [newP, ...(this.data.products || [])];
      this.saveLocalStorage('gynaeq_cached_db', this.data);
      this.emit('products:updated', this.data.products);
      return newP;
    }
  }

  async updateProduct(id, productData) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (data.success && data.product) {
        const idx = this.data.products.findIndex(p => p.id === id);
        if (idx !== -1) this.data.products[idx] = data.product;
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('products:updated', this.data.products);
      }
    } catch {
      const idx = this.data.products.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.data.products[idx] = { ...this.data.products[idx], ...productData };
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('products:updated', this.data.products);
      }
    }
  }

  async deleteProduct(id) {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Local delete:', e);
    }
    this.data.products = this.data.products.filter(p => p.id !== id);
    this.saveLocalStorage('gynaeq_cached_db', this.data);
    this.emit('products:updated', this.data.products);
  }

  async createQuotation(quoteData) {
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });
      const data = await res.json();
      if (data.success && data.quotation) {
        this.data.quotations = [data.quotation, ...(this.data.quotations || [])];
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('quotations:updated', this.data.quotations);
        return data.quotation;
      }
    } catch {
      const newQ = { id: `qt-${Date.now()}`, ...quoteData };
      this.data.quotations = [newQ, ...(this.data.quotations || [])];
      this.saveLocalStorage('gynaeq_cached_db', this.data);
      this.emit('quotations:updated', this.data.quotations);
      return newQ;
    }
  }

  async createAMC(amcData) {
    try {
      const res = await fetch('/api/amcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amcData)
      });
      const data = await res.json();
      if (data.success && data.contract) {
        this.data.amcContracts = [data.contract, ...(this.data.amcContracts || [])];
        this.saveLocalStorage('gynaeq_cached_db', this.data);
        this.emit('amc:updated', this.data.amcContracts);
        return data.contract;
      }
    } catch {
      const newA = { id: `amc-${Date.now()}`, ...amcData };
      this.data.amcContracts = [newA, ...(this.data.amcContracts || [])];
      this.saveLocalStorage('gynaeq_cached_db', this.data);
      this.emit('amc:updated', this.data.amcContracts);
      return newA;
    }
  }
}

// Global Store Instance
window.gynaeqStore = new GynaeqStore();
