const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

require('dotenv').config();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class GoogleSheetsDB {
  constructor() {
    this.doc = null;
    this.serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.productCache = null;
    this.lastProductCacheTime = 0;
    this.userCache = null;
    this.lastUserCacheTime = 0;
    this.orderCache = null;
    this.lastOrderCacheTime = 0;
    this.readRequestTimestamps = [];
    this.writeRequestTimestamps = [];
  }
  
  _recordReadRequest() {
    this.readRequestTimestamps.push(Date.now());
  }

  _recordWriteRequest() {
    this.writeRequestTimestamps.push(Date.now());
  }

  getUsageMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const readsInLastMinute = this.readRequestTimestamps.filter(ts => ts > oneMinuteAgo).length;
    const writesInLastMinute = this.writeRequestTimestamps.filter(ts => ts > oneMinuteAgo).length;

    // Clean up old timestamps
    this.readRequestTimestamps = this.readRequestTimestamps.filter(ts => ts > oneMinuteAgo);
    this.writeRequestTimestamps = this.writeRequestTimestamps.filter(ts => ts > oneMinuteAgo);

    return {
      readsPerMinute: readsInLastMinute,
      writesPerMinute: writesInLastMinute,
    };
  }

  async initialize() {
    try {
      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, this.serviceAccountAuth);
      this._recordReadRequest();
      await this.doc.loadInfo();
      console.log('✅ Google Sheets connected successfully');
      console.log('Document title:', this.doc.title);
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error);
      throw error;
    }
  }

  async _getProducts(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.productCache && (now - this.lastProductCacheTime < CACHE_TTL_MS)) {
      console.log('📦 Using cached product data.');
      return this.productCache;
    }

    console.log('🔄 Fetching fresh product data from Google Sheets...');
    const sheet = this.doc.sheetsByTitle['products'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    this.productCache = rows;
    this.lastProductCacheTime = now;
    console.log(`🛍️  Cached ${rows.length} products.`);
    return rows;
  }

  async _getUsers(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.userCache && (now - this.lastUserCacheTime < CACHE_TTL_MS)) {
      console.log('📦 Using cached user data.');
      return this.userCache;
    }

    console.log('🔄 Fetching fresh user data from Google Sheets...');
    const sheet = this.doc.sheetsByTitle['users'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    this.userCache = rows;
    this.lastUserCacheTime = now;
    console.log(`👥 Cached ${rows.length} users.`);
    return rows;
  }

  async _getOrders(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.orderCache && (now - this.lastOrderCacheTime < CACHE_TTL_MS)) {
      console.log('📦 Using cached order data.');
      return this.orderCache;
    }

    console.log('🔄 Fetching fresh order data from Google Sheets...');
    const sheet = this.doc.sheetsByTitle['orders'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    this.orderCache = rows;
    this.lastOrderCacheTime = now;
    console.log(`🧾 Cached ${rows.length} orders.`);
    return rows;
  }
  
    // User operations
  async createUser(userData) {
    const sheet = this.doc.sheetsByTitle['users'];
    this._recordWriteRequest();
    const row = await sheet.addRow({
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    });
    this.lastUserCacheTime = 0; // Invalidate cache
    return row;
  }

  async findUserByEmail(email) {
    const rows = await this._getUsers();
    return rows.find(row => (row.get('email') || row.email) === email);
  }

  async getAllUsers() {
    return await this._getUsers();
  }

  // Product operations
  async createProduct(productData) {
    const sheet = this.doc.sheetsByTitle['products'];
    this._recordWriteRequest();
    const row = await sheet.addRow({
      id: Date.now().toString(),
      ...productData,
      sales: 0,
      createdAt: new Date().toISOString()
    });
    this.lastProductCacheTime = 0; // Invalidate cache
    return row;
  }

  async getAllProducts() {
    return await this._getProducts();
  }

  async getProductsBySeller(sellerId) {
    const rows = await this._getProducts();
    return rows.filter(row => (row.get('sellerId') || row.sellerId) === sellerId);
  }

  async updateProduct(productId, updates) {
    const sheet = this.doc.sheetsByTitle['products'];
    const rows = await this._getProducts(true); // Force refresh to get latest version
    const product = rows.find(row => (row.get('id') || row.id) === productId);
    if (product) {
      Object.keys(updates).forEach(key => {
        product.set(key, updates[key]);
      });
      this._recordWriteRequest();
      await product.save();
      this.lastProductCacheTime = 0; // Invalidate cache
      return product;
    }
    return null;
  }

  async deleteProduct(productId) {
    const sheet = this.doc.sheetsByTitle['products'];
    const rows = await this._getProducts(true); // Force refresh to get latest version
    const product = rows.find(row => (row.get('id') || row.id) === productId);
    if (product) {
      this._recordWriteRequest();
      await product.delete();
      this.lastProductCacheTime = 0; // Invalidate cache
      return true;
    }
    return false;
  }
  
    // Cart operations
  async addToCart(buyerId, productId, quantity = 1) {
    const sheet = this.doc.sheetsByTitle['cart'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    const existingItem = rows.find(row => row.buyerId === buyerId && row.productId === productId);
    
    if (existingItem) {
      existingItem.quantity = (parseInt(existingItem.quantity) + quantity).toString();
      this._recordWriteRequest();
      await existingItem.save();
      return existingItem;
    } else {
        this._recordWriteRequest();
      return await sheet.addRow({
        id: Date.now().toString(),
        buyerId,
        productId,
        quantity: quantity.toString(),
        addedAt: new Date().toISOString()
      });
    }
  }

  async getCartItems(buyerId) {
    const sheet = this.doc.sheetsByTitle['cart'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    return rows.filter(row => row.buyerId === buyerId);
  }

  async updateCartItem(cartId, quantity) {
    const sheet = this.doc.sheetsByTitle['cart'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    const item = rows.find(row => row.id === cartId);
    if (item) {
      if (quantity <= 0) {
        this._recordWriteRequest();
        await item.delete();
        return null;
      } else {
        item.quantity = quantity.toString();
        this._recordWriteRequest();
        await item.save();
        return item;
      }
    }
    return null;
  }

  async removeFromCart(cartId) {
    const sheet = this.doc.sheetsByTitle['cart'];
    this._recordReadRequest();
    const rows = await sheet.getRows();
    const item = rows.find(row => row.id === cartId);
    if (item) {
      this._recordWriteRequest();
      await item.delete();
      return true;
    }
    return false;
  }

  // Order operations
  async createOrder(orderData) {
    const sheet = this.doc.sheetsByTitle['orders'];
    this._recordWriteRequest();
    const row = await sheet.addRow({
      id: Date.now().toString(),
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    this.lastOrderCacheTime = 0; // Invalidate cache
    return row;
  }

  async getOrdersByBuyer(buyerId) {
    const rows = await this._getOrders();
    return rows.filter(row => (row.get('buyerId') || row.buyerId) === buyerId);
  }

  async getOrdersBySeller(sellerId) {
    const rows = await this._getOrders();
    return rows.filter(row => (row.get('sellerId') || row.sellerId) === sellerId);
  }
}

module.exports = GoogleSheetsDB;