const express = require('express');
const cors = require('cors');
require('dotenv').config();
const GoogleSheetsDB = require('./googleSheetsAPI');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new GoogleSheetsDB();

// Initialize Google Sheets connection
db.initialize().then(() => {
  console.log('✅ Google Sheets API initialized');
}).catch(error => {
  console.error('❌ Failed to initialize Google Sheets API:', error);
});

// Basic test route
app.get('/', (req, res) => res.send('API is working!'));

// Test route for debugging
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    
    const existingUser = await db.findUserByEmail(req.body.email);
    if (existingUser) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    const user = await db.createUser(req.body);
    res.json({ success: true, user: { id: user.id, ...req.body } });
  } catch (error) {
    console.error('Signup error:', error);
    res.json({ success: false, message: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { email, password, userType } = req.body;
    const user = await db.findUserByEmail(email);
    
    if (!user || user.password !== password || user.userType !== userType) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        userType: user.userType 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.json({ success: false, message: 'Login failed' });
  }
});

// PRODUCT ROUTES
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json({ success: true, products: products.map(p => ({ id: p.id, ...p._rawData })) });
  } catch (error) {
    console.error('Get products error:', error);
    res.json({ success: false, message: 'Failed to fetch products' });
  }
});

app.get('/api/products/seller/:sellerId', async (req, res) => {
  try {
    const products = await db.getProductsBySeller(req.params.sellerId);
    res.json({ success: true, products: products.map(p => ({ id: p.id, ...p._rawData })) });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.json({ success: false, message: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('Create product request:', req.body);
    const product = await db.createProduct(req.body);
    res.json({ success: true, product: { id: product.id, ...req.body } });
  } catch (error) {
    console.error('Create product error:', error);
    res.json({ success: false, message: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await db.updateProduct(req.params.id, req.body);
    if (product) {
      res.json({ success: true, product: { id: product.id, ...product._rawData } });
    } else {
      res.json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.json({ success: false, message: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    res.json({ success, message: success ? 'Product deleted' : 'Product not found' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.json({ success: false, message: 'Failed to delete product' });
  }
});

// CART ROUTES
app.post('/api/cart', async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body;
    console.log('Add to cart request:', req.body);
    const item = await db.addToCart(buyerId, productId, quantity);
    res.json({ success: true, item: { id: item.id, ...item._rawData } });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.json({ success: false, message: 'Failed to add to cart' });
  }
});

app.get('/api/cart/:buyerId', async (req, res) => {
  try {
    const items = await db.getCartItems(req.params.buyerId);
    const cartWithProducts = [];
    
    for (const item of items) {
      const products = await db.getAllProducts();
      const product = products.find(p => p.id === item.productId);
      if (product) {
        cartWithProducts.push({
          id: item.id,
          ...item._rawData,
          product: { id: product.id, ...product._rawData }
        });
      }
    }
    
    res.json({ success: true, items: cartWithProducts });
  } catch (error) {
    console.error('Get cart error:', error);
    res.json({ success: false, message: 'Failed to fetch cart' });
  }
});

app.put('/api/cart/:id', async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await db.updateCartItem(req.params.id, quantity);
    res.json({ success: true, item: item ? { id: item.id, ...item._rawData } : null });
  } catch (error) {
    console.error('Update cart error:', error);
    res.json({ success: false, message: 'Failed to update cart' });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const success = await db.removeFromCart(req.params.id);
    res.json({ success, message: success ? 'Item removed' : 'Item not found' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.json({ success: false, message: 'Failed to remove item' });
  }
});

// ORDER ROUTES
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Create order request:', req.body);
    const order = await db.createOrder(req.body);
    res.json({ success: true, order: { id: order.id, ...req.body } });
  } catch (error) {
    console.error('Create order error:', error);
    res.json({ success: false, message: 'Failed to create order' });
  }
});

app.get('/api/orders/buyer/:buyerId', async (req, res) => {
  try {
    const orders = await db.getOrdersByBuyer(req.params.buyerId);
    res.json({ success: true, orders: orders.map(o => ({ id: o.id, ...o._rawData })) });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/seller/:sellerId', async (req, res) => {
  try {
    const orders = await db.getOrdersBySeller(req.params.sellerId);
    res.json({ success: true, orders: orders.map(o => ({ id: o.id, ...o._rawData })) });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});