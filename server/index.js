// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const GoogleSheetsDB = require('./googleSheetsAPI');

// const app = express();
// const port = process.env.PORT || 3001;

// app.use(cors());
// app.use(express.json());

// const db = new GoogleSheetsDB();

// // Initialize Google Sheets connection
// db.initialize().then(() => {
//   console.log('✅ Google Sheets API initialized');
// }).catch(error => {
//   console.error('❌ Failed to initialize Google Sheets API:', error);
// });

// // Basic test route
// app.get('/', (req, res) => res.send('API is working!'));

// // Test route for debugging
// app.get('/api/test', (req, res) => {
//   res.json({ success: true, message: 'Server is running!' });
// });

// // AUTH ROUTES
// app.post('/api/auth/signup', async (req, res) => {
//   try {
//     console.log('Signup request received:', req.body);
    
//     const existingUser = await db.findUserByEmail(req.body.email);
//     if (existingUser) {
//       return res.json({ success: false, message: 'Email already registered' });
//     }

//     const user = await db.createUser(req.body);
//     res.json({ success: true, user: { id: user.id, ...req.body } });
//   } catch (error) {
//     console.error('Signup error:', error);
//     res.json({ success: false, message: 'Signup failed' });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     console.log('Login request received:', req.body);
    
//     const { email, password, userType } = req.body;
//     const user = await db.findUserByEmail(email);
    
//     if (!user || user.password !== password || user.userType !== userType) {
//       return res.json({ success: false, message: 'Invalid credentials' });
//     }

//     res.json({ 
//       success: true, 
//       user: { 
//         id: user.id, 
//         firstName: user.firstName, 
//         lastName: user.lastName, 
//         email: user.email, 
//         userType: user.userType 
//       } 
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.json({ success: false, message: 'Login failed' });
//   }
// });

// // PRODUCT ROUTES
// app.get('/api/products', async (req, res) => {
//   try {
//     const products = await db.getAllProducts();
//     res.json({ success: true, products: products.map(p => ({ id: p.id, ...p._rawData })) });
//   } catch (error) {
//     console.error('Get products error:', error);
//     res.json({ success: false, message: 'Failed to fetch products' });
//   }
// });

// app.get('/api/products/seller/:sellerId', async (req, res) => {
//   try {
//     const products = await db.getProductsBySeller(req.params.sellerId);
//     res.json({ success: true, products: products.map(p => ({ id: p.id, ...p._rawData })) });
//   } catch (error) {
//     console.error('Get seller products error:', error);
//     res.json({ success: false, message: 'Failed to fetch products' });
//   }
// });

// app.post('/api/products', async (req, res) => {
//   try {
//     console.log('Create product request:', req.body);
//     const product = await db.createProduct(req.body);
//     res.json({ success: true, product: { id: product.id, ...req.body } });
//   } catch (error) {
//     console.error('Create product error:', error);
//     res.json({ success: false, message: 'Failed to create product' });
//   }
// });

// app.put('/api/products/:id', async (req, res) => {
//   try {
//     const product = await db.updateProduct(req.params.id, req.body);
//     if (product) {
//       res.json({ success: true, product: { id: product.id, ...product._rawData } });
//     } else {
//       res.json({ success: false, message: 'Product not found' });
//     }
//   } catch (error) {
//     console.error('Update product error:', error);
//     res.json({ success: false, message: 'Failed to update product' });
//   }
// });

// app.delete('/api/products/:id', async (req, res) => {
//   try {
//     const success = await db.deleteProduct(req.params.id);
//     res.json({ success, message: success ? 'Product deleted' : 'Product not found' });
//   } catch (error) {
//     console.error('Delete product error:', error);
//     res.json({ success: false, message: 'Failed to delete product' });
//   }
// });

// // CART ROUTES
// app.post('/api/cart', async (req, res) => {
//   try {
//     const { buyerId, productId, quantity } = req.body;
//     console.log('Add to cart request:', req.body);
//     const item = await db.addToCart(buyerId, productId, quantity);
//     res.json({ success: true, item: { id: item.id, ...item._rawData } });
//   } catch (error) {
//     console.error('Add to cart error:', error);
//     res.json({ success: false, message: 'Failed to add to cart' });
//   }
// });

// app.get('/api/cart/:buyerId', async (req, res) => {
//   try {
//     const items = await db.getCartItems(req.params.buyerId);
//     const cartWithProducts = [];
    
//     for (const item of items) {
//       const products = await db.getAllProducts();
//       const product = products.find(p => p.id === item.productId);
//       if (product) {
//         cartWithProducts.push({
//           id: item.id,
//           ...item._rawData,
//           product: { id: product.id, ...product._rawData }
//         });
//       }
//     }
    
//     res.json({ success: true, items: cartWithProducts });
//   } catch (error) {
//     console.error('Get cart error:', error);
//     res.json({ success: false, message: 'Failed to fetch cart' });
//   }
// });

// app.put('/api/cart/:id', async (req, res) => {
//   try {
//     const { quantity } = req.body;
//     const item = await db.updateCartItem(req.params.id, quantity);
//     res.json({ success: true, item: item ? { id: item.id, ...item._rawData } : null });
//   } catch (error) {
//     console.error('Update cart error:', error);
//     res.json({ success: false, message: 'Failed to update cart' });
//   }
// });

// app.delete('/api/cart/:id', async (req, res) => {
//   try {
//     const success = await db.removeFromCart(req.params.id);
//     res.json({ success, message: success ? 'Item removed' : 'Item not found' });
//   } catch (error) {
//     console.error('Remove from cart error:', error);
//     res.json({ success: false, message: 'Failed to remove item' });
//   }
// });

// // ORDER ROUTES
// app.post('/api/orders', async (req, res) => {
//   try {
//     console.log('Create order request:', req.body);
//     const order = await db.createOrder(req.body);
//     res.json({ success: true, order: { id: order.id, ...req.body } });
//   } catch (error) {
//     console.error('Create order error:', error);
//     res.json({ success: false, message: 'Failed to create order' });
//   }
// });

// app.get('/api/orders/buyer/:buyerId', async (req, res) => {
//   try {
//     const orders = await db.getOrdersByBuyer(req.params.buyerId);
//     res.json({ success: true, orders: orders.map(o => ({ id: o.id, ...o._rawData })) });
//   } catch (error) {
//     console.error('Get buyer orders error:', error);
//     res.json({ success: false, message: 'Failed to fetch orders' });
//   }
// });

// app.get('/api/orders/seller/:sellerId', async (req, res) => {
//   try {
//     const orders = await db.getOrdersBySeller(req.params.sellerId);
//     res.json({ success: true, orders: orders.map(o => ({ id: o.id, ...o._rawData })) });
//   } catch (error) {
//     console.error('Get seller orders error:', error);
//     res.json({ success: false, message: 'Failed to fetch orders' });
//   }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ success: false, message: 'Something went wrong!' });
// });

// // Handle 404 routes
// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, message: 'API route not found' });
// });

// app.listen(port, () => {
//   console.log(`✅ Server running at http://localhost:${port}`);
// });

//#################################################################################################################################
// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const GoogleSheetsDB = require('./googleSheetsAPI');

// const app = express();
// const port = process.env.PORT || 3001;

// // Enhanced CORS configuration
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Enhanced JSON parsing with error handling
// app.use(express.json({
//   limit: '10mb',
//   verify: (req, res, buf, encoding) => {
//     try {
//       if (buf && buf.length) {
//         const body = buf.toString(encoding || 'utf8');
//         console.log('📥 Raw request body:', body);
//         JSON.parse(body); // Test if it's valid JSON
//       }
//     } catch (error) {
//       console.error('❌ Invalid JSON received:', error.message);
//       console.error('📥 Raw body that caused error:', buf.toString());
//       const err = new Error('Invalid JSON format');
//       err.status = 400;
//       throw err;
//     }
//   }
// }));

// // Add request logging middleware
// app.use((req, res, next) => {
//   console.log(`📝 ${req.method} ${req.path}`, req.body);
//   next();
// });

// const db = new GoogleSheetsDB();

// // Initialize Google Sheets connection
// db.initialize()
//   .then(() => {
//     console.log('✅ Google Sheets API initialized successfully');
//   })
//   .catch(error => {
//     console.error('❌ Failed to initialize Google Sheets API:', error);
//   });

// // Health check route
// app.get('/api/test', (req, res) => {
//   console.log('✅ Test endpoint called');
//   res.json({ success: true, message: 'Server is running!' });
// });

// app.get('/', (req, res) => {
//   res.send('EcommerceHub API Server is running!');
// });

// // ===== AUTH ROUTES =====
// app.post('/api/auth/signup', async (req, res) => {
//   try {
//     console.log('✅ Signup request received:', req.body);
    
//     const { firstName, lastName, email, password, userType, phone } = req.body;
    
//     if (!firstName || !lastName || !email || !password || !userType || !phone) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'All fields are required' 
//       });
//     }
    
//     const existingUser = await db.findUserByEmail(email);
//     if (existingUser) {
//       return res.json({ success: false, message: 'Email already registered' });
//     }

//     const user = await db.createUser(req.body);
    
//     const userResponse = {
//       id: user.get('id') || user.id || Date.now().toString(),
//       firstName: firstName,
//       lastName: lastName,
//       email: email,
//       userType: userType
//     };

//     console.log('✅ Signup successful:', userResponse);
//     res.json({ success: true, user: userResponse });
    
//   } catch (error) {
//     console.error('❌ Signup error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Signup failed: ' + error.message 
//     });
//   }
// });

// app.post('/api/auth/login', async (req, res) => {
//   try {
//     console.log('✅ Login request received:', req.body);
    
//     const { email, password, userType } = req.body;
    
//     if (!email || !password || !userType) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Email, password, and user type are required' 
//       });
//     }
    
//     const user = await db.findUserByEmail(email);
    
//     if (!user) {
//       console.log('❌ User not found for email:', email);
//       return res.json({ success: false, message: 'User not found' });
//     }

//     const userPassword = user.get('password') || user.password;
//     const userUserType = user.get('userType') || user.userType;
    
//     if (userPassword !== password) {
//       console.log('❌ Password mismatch');
//       return res.json({ success: false, message: 'Invalid password' });
//     }
    
//     if (userUserType !== userType) {
//       console.log('❌ User type mismatch');
//       return res.json({ success: false, message: 'Invalid user type' });
//     }

//     const userResponse = {
//       id: user.get('id') || user.id || Date.now().toString(),
//       firstName: user.get('firstName') || user.firstName,
//       lastName: user.get('lastName') || user.lastName,
//       email: user.get('email') || user.email,
//       userType: userUserType
//     };

//     console.log('✅ Login successful:', userResponse);
//     res.json({ success: true, user: userResponse });
    
//   } catch (error) {
//     console.error('❌ Login error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Login failed: ' + error.message 
//     });
//   }
// });

// // ===== PRODUCT ROUTES =====
// app.get('/api/products', async (req, res) => {
//   try {
//     console.log('✅ Get products request received');
//     const products = await db.getAllProducts();
//     const productList = products.map(p => ({ 
//       id: p.get('id') || p.id, 
//       ...p._rawData 
//     }));
//     console.log('✅ Returning products:', productList.length);
//     res.json({ success: true, products: productList });
//   } catch (error) {
//     console.error('❌ Get products error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch products: ' + error.message,
//       products: [] 
//     });
//   }
// });

// app.post('/api/products', async (req, res) => {
//   try {
//     console.log('✅ Create product request received:', req.body);
//     const product = await db.createProduct(req.body);
//     res.json({ 
//       success: true, 
//       product: { id: product.get('id') || product.id, ...product._rawData }
//     });
//   } catch (error) {
//     console.error('❌ Create product error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to create product: ' + error.message 
//     });
//   }
// });

// // ===== CART ROUTES =====
// app.post('/api/cart', async (req, res) => {
//   try {
//     const { buyerId, productId, quantity } = req.body;
//     console.log('✅ Cart POST request received:', { buyerId, productId, quantity });
    
//     // Validate required fields
//     if (!buyerId || !productId || !quantity) {
//       console.log('❌ Missing required fields:', { 
//         buyerId: !!buyerId, 
//         productId: !!productId, 
//         quantity: !!quantity 
//       });
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Missing required fields: buyerId, productId, or quantity' 
//       });
//     }

//     // Validate data types
//     if (typeof buyerId !== 'string' || typeof productId !== 'string') {
//       console.log('❌ Invalid data types');
//       return res.status(400).json({ 
//         success: false, 
//         message: 'buyerId and productId must be strings' 
//       });
//     }

//     console.log('🔄 Calling db.addToCart...');
//     const item = await db.addToCart(buyerId, productId, parseInt(quantity));
//     console.log('✅ Cart item added successfully:', item._rawData);
    
//     res.json({ 
//       success: true, 
//       item: { 
//         id: item.get('id') || item.id, 
//         buyerId: item.get('buyerId') || item.buyerId,
//         productId: item.get('productId') || item.productId,
//         quantity: item.get('quantity') || item.quantity,
//         addedAt: item.get('addedAt') || item.addedAt
//       },
//       message: 'Item added to cart successfully'
//     });
//   } catch (error) {
//     console.error('❌ Add to cart error:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to add to cart: ' + error.message 
//     });
//   }
// });

// app.get('/api/cart/:buyerId', async (req, res) => {
//   try {
//     const buyerId = req.params.buyerId;
//     console.log('✅ Get cart request for buyer:', buyerId);
    
//     if (!buyerId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Buyer ID is required' 
//       });
//     }

//     console.log('🔄 Getting cart items...');
//     const items = await db.getCartItems(buyerId);
//     console.log('📦 Raw cart items found:', items.length);
    
//     const cartWithProducts = [];
    
//     // Get all products first
//     console.log('🔄 Getting all products...');
//     const products = await db.getAllProducts();
//     console.log('🛍️ Total products available:', products.length);
    
//     for (const item of items) {
//       const itemProductId = item.get('productId') || item.productId;
//       console.log('🔍 Looking for product with ID:', itemProductId);
      
//       // Find product in database
//       const product = products.find(p => {
//         const pId = p.get('id') || p.id;
//         return pId === itemProductId;
//       });
      
//       if (product) {
//         console.log('✅ Found product:', product.get('name') || product.name);
//         cartWithProducts.push({
//           id: item.get('id') || item.id,
//           buyerId: item.get('buyerId') || item.buyerId,
//           productId: itemProductId,
//           quantity: item.get('quantity') || item.quantity,
//           addedAt: item.get('addedAt') || item.addedAt,
//           product: {
//             id: product.get('id') || product.id,
//             name: product.get('name') || product.name,
//             price: parseFloat(product.get('price') || product.price || 0),
//             image: product.get('image') || product.image,
//             stock: parseInt(product.get('stock') || product.stock || 0),
//             sellerId: product.get('sellerId') || product.sellerId
//           }
//         });
//       } else {
//         console.log('❌ Product not found for ID:', itemProductId);
//         // Still include cart item but with placeholder product
//         cartWithProducts.push({
//           id: item.get('id') || item.id,
//           buyerId: item.get('buyerId') || item.buyerId,
//           productId: itemProductId,
//           quantity: item.get('quantity') || item.quantity,
//           addedAt: item.get('addedAt') || item.addedAt,
//           product: {
//             id: itemProductId,
//             name: 'Product Not Found',
//             price: 0,
//             image: '',
//             stock: 0,
//             sellerId: 'unknown'
//           }
//         });
//       }
//     }
    
//     console.log('✅ Cart with products prepared:', cartWithProducts.length, 'items');
//     res.json({ success: true, items: cartWithProducts });
    
//   } catch (error) {
//     console.error('❌ Get cart error:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch cart: ' + error.message,
//       items: []
//     });
//   }
// });

// app.put('/api/cart/:id', async (req, res) => {
//   try {
//     const cartId = req.params.id;
//     const { quantity } = req.body;
    
//     console.log('✅ Update cart item request:', { cartId, quantity });
    
//     if (!cartId || quantity === undefined) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Cart ID and quantity are required' 
//       });
//     }

//     const item = await db.updateCartItem(cartId, parseInt(quantity));
    
//     if (item) {
//       res.json({ 
//         success: true, 
//         item: { 
//           id: item.get('id') || item.id, 
//           quantity: item.get('quantity') || item.quantity 
//         }
//       });
//     } else {
//       res.json({ success: true, item: null, message: 'Item removed' });
//     }
//   } catch (error) {
//     console.error('❌ Update cart error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to update cart: ' + error.message 
//     });
//   }
// });

// app.delete('/api/cart/:id', async (req, res) => {
//   try {
//     const cartId = req.params.id;
//     console.log('✅ Remove cart item request:', cartId);
    
//     if (!cartId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Cart ID is required' 
//       });
//     }

//     const success = await db.removeFromCart(cartId);
//     res.json({ 
//       success, 
//       message: success ? 'Item removed successfully' : 'Item not found' 
//     });
//   } catch (error) {
//     console.error('❌ Remove from cart error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to remove item: ' + error.message 
//     });
//   }
// });

// // ===== ORDER ROUTES =====
// app.post('/api/orders', async (req, res) => {
//   try {
//     console.log('✅ Create order request:', req.body);
//     const order = await db.createOrder(req.body);
//     res.json({ 
//       success: true, 
//       order: { 
//         id: order.get('id') || order.id, 
//         ...req.body 
//       }
//     });
//   } catch (error) {
//     console.error('❌ Create order error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to create order: ' + error.message 
//     });
//   }
// });

// app.get('/api/orders/buyer/:buyerId', async (req, res) => {
//   try {
//     const buyerId = req.params.buyerId;
//     console.log('✅ Get orders for buyer:', buyerId);
//     const orders = await db.getOrdersByBuyer(buyerId);
//     res.json({ 
//       success: true, 
//       orders: orders.map(o => ({ id: o.get('id') || o.id, ...o._rawData }))
//     });
//   } catch (error) {
//     console.error('❌ Get buyer orders error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch orders: ' + error.message,
//       orders: []
//     });
//   }
// });

// app.get('/api/orders/seller/:sellerId', async (req, res) => {
//   try {
//     const sellerId = req.params.sellerId;
//     console.log('✅ Get orders for seller:', sellerId);
//     const orders = await db.getOrdersBySeller(sellerId);
//     res.json({ 
//       success: true, 
//       orders: orders.map(o => ({ id: o.get('id') || o.id, ...o._rawData }))
//     });
//   } catch (error) {
//     console.error('❌ Get seller orders error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to fetch orders: ' + error.message,
//       orders: []
//     });
//   }
// });

// // ===== ERROR HANDLERS =====
// // JSON parsing error handler
// app.use((error, req, res, next) => {
//   if (error.status === 400 && error.message.includes('Invalid JSON')) {
//     console.error('❌ JSON parsing error');
//     return res.status(400).json({
//       success: false,
//       message: 'Invalid request format. Please check your data.'
//     });
//   }
//   next(error);
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Internal server error: ' + err.message 
//   });
// });

// // Handle 404 routes
// app.use('*', (req, res) => {
//   console.log('❌ 404 - Route not found:', req.originalUrl);
//   res.status(404).json({ 
//     success: false, 
//     message: 'API route not found: ' + req.originalUrl 
//   });
// });

// // Start server
// app.listen(port, () => {
//   console.log(`✅ Server running at http://localhost:${port}`);
//   console.log(`✅ Test the server at: http://localhost:${port}/api/test`);
//   console.log(`✅ Available routes:`);
//   console.log(`   GET  /api/test`);
//   console.log(`   POST /api/auth/login`);
//   console.log(`   POST /api/auth/signup`);
//   console.log(`   GET  /api/products`);
//   console.log(`   POST /api/products`);
//   console.log(`   POST /api/cart`);
//   console.log(`   GET  /api/cart/:buyerId`);
//   console.log(`   PUT  /api/cart/:id`);
//   console.log(`   DELETE /api/cart/:id`);
//   console.log(`   POST /api/orders`);
//   console.log(`   GET  /api/orders/buyer/:buyerId`);
//   console.log(`   GET  /api/orders/seller/:sellerId`);
// });

// // Handle process termination
// process.on('SIGTERM', () => {
//   console.log('👋 Server shutting down gracefully');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('👋 Server shutting down gracefully');
//   process.exit(0);
// });


const express = require('express');
const cors = require('cors');
require('dotenv').config();
const GoogleSheetsDB = require('./googleSheetsAPI');

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Enhanced JSON parsing with error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      if (buf && buf.length) {
        const body = buf.toString(encoding || 'utf8');
        console.log('📥 Raw request body:', body);
        JSON.parse(body); // Test if it's valid JSON
      }
    } catch (error) {
      console.error('❌ Invalid JSON received:', error.message);
      console.error('📥 Raw body that caused error:', buf.toString());
      const err = new Error('Invalid JSON format');
      err.status = 400;
      throw err;
    }
  }
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`, req.body);
  next();
});

const db = new GoogleSheetsDB();

// Initialize Google Sheets connection
db.initialize()
  .then(() => {
    console.log('✅ Google Sheets API initialized successfully');
  })
  .catch(error => {
    console.error('❌ Failed to initialize Google Sheets API:', error);
  });

// Health check route
app.get('/api/test', (req, res) => {
  console.log('✅ Test endpoint called');
  res.json({ success: true, message: 'Server is running!' });
});

app.get('/', (req, res) => {
  res.send('EcommerceHub API Server is running!');
});

// ===== AUTH ROUTES =====
app.post('/api/auth/signup', async (req, res) => {
  try {
    console.log('✅ Signup request received:', req.body);
    
    const { firstName, lastName, email, password, userType, phone } = req.body;
    
    if (!firstName || !lastName || !email || !password || !userType || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    const user = await db.createUser(req.body);
    
    const userResponse = {
      id: user.get('id') || user.id || Date.now().toString(),
      firstName: firstName,
      lastName: lastName,
      email: email,
      userType: userType
    };

    console.log('✅ Signup successful:', userResponse);
    res.json({ success: true, user: userResponse });
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Signup failed: ' + error.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('✅ Login request received:', req.body);
    
    const { email, password, userType } = req.body;
    
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and user type are required' 
      });
    }
    
    const user = await db.findUserByEmail(email);
    
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.json({ success: false, message: 'User not found' });
    }

    const userPassword = user.get('password') || user.password;
    const userUserType = user.get('userType') || user.userType;
    
    if (userPassword !== password) {
      console.log('❌ Password mismatch');
      return res.json({ success: false, message: 'Invalid password' });
    }
    
    if (userUserType !== userType) {
      console.log('❌ User type mismatch');
      return res.json({ success: false, message: 'Invalid user type' });
    }

    const userResponse = {
      id: user.get('id') || user.id || Date.now().toString(),
      firstName: user.get('firstName') || user.firstName,
      lastName: user.get('lastName') || user.lastName,
      email: user.get('email') || user.email,
      userType: userUserType
    };

    console.log('✅ Login successful:', userResponse);
    res.json({ success: true, user: userResponse });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed: ' + error.message 
    });
  }
});

// ===== PRODUCT ROUTES - SHEETS ONLY =====
app.get('/api/products', async (req, res) => {
  try {
    console.log('✅ Get products request received');
    const dbProducts = await db.getAllProducts();
    
    // Filter and format database products only
    const validDbProducts = dbProducts
      .map(p => ({
        id: p.get('id') || p.id,
        name: p.get('name') || p.name,
        price: parseFloat(p.get('price') || p.price || 0),
        originalPrice: parseFloat(p.get('originalPrice') || p.originalPrice || p.get('price') || p.price || 0),
        cost: parseFloat(p.get('cost') || p.cost || 0),
        stock: parseInt(p.get('stock') || p.stock || 0),
        sales: parseInt(p.get('sales') || p.sales || 0),
        description: p.get('description') || p.description || '',
        image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
        sellerId: p.get('sellerId') || p.sellerId || 'unknown',
        createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
      }))
      .filter(p => {
        // Only include products with valid data
        return p.name && 
               p.name !== 'Unknown Product' && 
               p.name.trim() !== '' && 
               p.price > 0 &&
               p.stock >= 0;
      });

    console.log('✅ Returning products from sheets only:', validDbProducts.length);
    res.json({ success: true, products: validDbProducts });
  } catch (error) {
    console.error('❌ Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch products: ' + error.message,
      products: [] 
    });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('✅ Create product request received:', req.body);
    const product = await db.createProduct(req.body);
    res.json({ 
      success: true, 
      product: { 
        id: product.get('id') || product.id, 
        ...req.body
      }
    });
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create product: ' + error.message 
    });
  }
});

// ===== CART ROUTES =====
app.post('/api/cart', async (req, res) => {
  try {
    const { buyerId, productId, quantity } = req.body;
    console.log('✅ Cart POST request received:', { buyerId, productId, quantity });
    
    // Validate required fields
    if (!buyerId || !productId || !quantity) {
      console.log('❌ Missing required fields:', { 
        buyerId: !!buyerId, 
        productId: !!productId, 
        quantity: !!quantity 
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: buyerId, productId, or quantity' 
      });
    }

    // Validate data types
    if (typeof buyerId !== 'string' || typeof productId !== 'string') {
      console.log('❌ Invalid data types');
      return res.status(400).json({ 
        success: false, 
        message: 'buyerId and productId must be strings' 
      });
    }

    console.log('🔄 Calling db.addToCart...');
    const item = await db.addToCart(buyerId, productId, parseInt(quantity));
    console.log('✅ Cart item added successfully');
    
    res.json({ 
      success: true, 
      item: { 
        id: item.get('id') || item.id, 
        buyerId: item.get('buyerId') || item.buyerId,
        productId: item.get('productId') || item.productId,
        quantity: item.get('quantity') || item.quantity,
        addedAt: item.get('addedAt') || item.addedAt
      },
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add to cart: ' + error.message 
    });
  }
});

app.get('/api/cart/:buyerId', async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
    console.log('✅ Get cart request for buyer:', buyerId);
    
    if (!buyerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Buyer ID is required' 
      });
    }

    console.log('🔄 Getting cart items...');
    const items = await db.getCartItems(buyerId);
    console.log('📦 Raw cart items found:', items.length);
    
    const cartWithProducts = [];
    
    // Get database products only (no sample products)
    console.log('🔄 Getting database products...');
    const dbProducts = await db.getAllProducts();
    console.log('🛍️ Database products found:', dbProducts.length);
    
    // Create product list from database only
    const allProducts = [];
    
    // Add valid database products
    dbProducts.forEach(p => {
      const dbProduct = {
        id: p.get('id') || p.id,
        name: p.get('name') || p.name || 'Unknown Product',
        price: parseFloat(p.get('price') || p.price || 0),
        originalPrice: parseFloat(p.get('originalPrice') || p.originalPrice || p.get('price') || p.price || 0),
        cost: parseFloat(p.get('cost') || p.cost || 0),
        stock: parseInt(p.get('stock') || p.stock || 0),
        sales: parseInt(p.get('sales') || p.sales || 0),
        description: p.get('description') || p.description || 'No description available',
        image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
        sellerId: p.get('sellerId') || p.sellerId || 'unknown',
        createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
      };
      
      // Only add if it has valid data
      if (dbProduct.name && dbProduct.name !== 'Unknown Product' && dbProduct.price > 0) {
        allProducts.push(dbProduct);
      }
    });
    
    console.log('🛍️ Total products from sheets:', allProducts.length);
    
    // Match cart items with products
    for (const item of items) {
      const itemProductId = item.get('productId') || item.productId;
      console.log('🔍 Looking for product with ID:', itemProductId);
      
      // Find product in list
      const product = allProducts.find(p => p.id === itemProductId);
      
      if (product) {
        console.log('✅ Found product:', product.name);
        cartWithProducts.push({
          id: item.get('id') || item.id,
          buyerId: item.get('buyerId') || item.buyerId,
          productId: itemProductId,
          quantity: item.get('quantity') || item.quantity,
          addedAt: item.get('addedAt') || item.addedAt,
          product: product
        });
      } else {
        console.log('❌ Product not found for ID:', itemProductId);
      }
    }
    
    console.log('✅ Cart with products prepared:', cartWithProducts.length, 'items');
    res.json({ success: true, items: cartWithProducts });
    
  } catch (error) {
    console.error('❌ Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cart: ' + error.message,
      items: []
    });
  }
});

app.put('/api/cart/:id', async (req, res) => {
  try {
    const cartId = req.params.id;
    const { quantity } = req.body;
    
    console.log('✅ Update cart item request:', { cartId, quantity });
    
    if (!cartId || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart ID and quantity are required' 
      });
    }

    const item = await db.updateCartItem(cartId, parseInt(quantity));
    
    if (item) {
      res.json({ 
        success: true, 
        item: { 
          id: item.get('id') || item.id, 
          quantity: item.get('quantity') || item.quantity 
        }
      });
    } else {
      res.json({ success: true, item: null, message: 'Item removed' });
    }
  } catch (error) {
    console.error('❌ Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cart: ' + error.message 
    });
  }
});

app.delete('/api/cart/:id', async (req, res) => {
  try {
    const cartId = req.params.id;
    console.log('✅ Remove cart item request:', cartId);
    
    if (!cartId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cart ID is required' 
      });
    }

    const success = await db.removeFromCart(cartId);
    res.json({ 
      success, 
      message: success ? 'Item removed successfully' : 'Item not found' 
    });
  } catch (error) {
    console.error('❌ Remove from cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove item: ' + error.message 
    });
  }
});

// ===== ORDER ROUTES =====
app.post('/api/orders', async (req, res) => {
  try {
    console.log('✅ Create order request:', req.body);
    const order = await db.createOrder(req.body);
    res.json({ 
      success: true, 
      order: { 
        id: order.get('id') || order.id, 
        ...req.body 
      }
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create order: ' + error.message 
    });
  }
});

app.get('/api/orders/buyer/:buyerId', async (req, res) => {
  try {
    const buyerId = req.params.buyerId;
    console.log('✅ Get orders for buyer:', buyerId);
    const orders = await db.getOrdersByBuyer(buyerId);
    res.json({ 
      success: true, 
      orders: orders.map(o => ({ id: o.get('id') || o.id, ...o._rawData }))
    });
  } catch (error) {
    console.error('❌ Get buyer orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders: ' + error.message,
      orders: []
    });
  }
});

app.get('/api/orders/seller/:sellerId', async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    console.log('✅ Get orders for seller:', sellerId);
    const orders = await db.getOrdersBySeller(sellerId);
    res.json({ 
      success: true, 
      orders: orders.map(o => ({ id: o.get('id') || o.id, ...o._rawData }))
    });
  } catch (error) {
    console.error('❌ Get seller orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders: ' + error.message,
      orders: []
    });
  }
});

// ===== ERROR HANDLERS =====
app.use((error, req, res, next) => {
  if (error.status === 400 && error.message.includes('Invalid JSON')) {
    console.error('❌ JSON parsing error');
    return res.status(400).json({
      success: false,
      message: 'Invalid request format. Please check your data.'
    });
  }
  next(error);
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error: ' + err.message 
  });
});

app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    success: false, 
    message: 'API route not found: ' + req.originalUrl 
  });
});

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`✅ Test the server at: http://localhost:${port}/api/test`);
  console.log(`✅ Available routes:`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   GET  /api/products`);
  console.log(`   POST /api/products`);
  console.log(`   POST /api/cart`);
  console.log(`   GET  /api/cart/:buyerId`);
  console.log(`   PUT  /api/cart/:id`);
  console.log(`   DELETE /api/cart/:id`);
  console.log(`   POST /api/orders`);
  console.log(`   GET  /api/orders/buyer/:buyerId`);
  console.log(`   GET  /api/orders/seller/:sellerId`);
});

process.on('SIGTERM', () => {
  console.log('👋 Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Server shutting down gracefully');
  process.exit(0);
});
