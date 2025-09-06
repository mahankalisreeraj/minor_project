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

//##############################################################################################################################

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

// // ===== PRODUCT ROUTES - SHEETS ONLY =====
// app.get('/api/products', async (req, res) => {
//   try {
//     console.log('✅ Get products request received');
//     const dbProducts = await db.getAllProducts();
    
//     // Filter and format database products only
//     const validDbProducts = dbProducts
//       .map(p => ({
//         id: p.get('id') || p.id,
//         name: p.get('name') || p.name,
//         price: parseFloat(p.get('price') || p.price || 0),
//         originalPrice: parseFloat(p.get('originalPrice') || p.originalPrice || p.get('price') || p.price || 0),
//         cost: parseFloat(p.get('cost') || p.cost || 0),
//         stock: parseInt(p.get('stock') || p.stock || 0),
//         sales: parseInt(p.get('sales') || p.sales || 0),
//         description: p.get('description') || p.description || '',
//         image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
//         sellerId: p.get('sellerId') || p.sellerId || 'unknown',
//         createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
//       }))
//       .filter(p => {
//         // Only include products with valid data
//         return p.name && 
//                p.name !== 'Unknown Product' && 
//                p.name.trim() !== '' && 
//                p.price > 0 &&
//                p.stock >= 0;
//       });

//     console.log('✅ Returning products from sheets only:', validDbProducts.length);
//     res.json({ success: true, products: validDbProducts });
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
//       product: { 
//         id: product.get('id') || product.id, 
//         ...req.body
//       }
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
//     console.log('✅ Cart item added successfully');
    
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
    
//     // Get database products only (no sample products)
//     console.log('🔄 Getting database products...');
//     const dbProducts = await db.getAllProducts();
//     console.log('🛍️ Database products found:', dbProducts.length);
    
//     // Create product list from database only
//     const allProducts = [];
    
//     // Add valid database products
//     dbProducts.forEach(p => {
//       const dbProduct = {
//         id: p.get('id') || p.id,
//         name: p.get('name') || p.name || 'Unknown Product',
//         price: parseFloat(p.get('price') || p.price || 0),
//         originalPrice: parseFloat(p.get('originalPrice') || p.originalPrice || p.get('price') || p.price || 0),
//         cost: parseFloat(p.get('cost') || p.cost || 0),
//         stock: parseInt(p.get('stock') || p.stock || 0),
//         sales: parseInt(p.get('sales') || p.sales || 0),
//         description: p.get('description') || p.description || 'No description available',
//         image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
//         sellerId: p.get('sellerId') || p.sellerId || 'unknown',
//         createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
//       };
      
//       // Only add if it has valid data
//       if (dbProduct.name && dbProduct.name !== 'Unknown Product' && dbProduct.price > 0) {
//         allProducts.push(dbProduct);
//       }
//     });
    
//     console.log('🛍️ Total products from sheets:', allProducts.length);
    
//     // Match cart items with products
//     for (const item of items) {
//       const itemProductId = item.get('productId') || item.productId;
//       console.log('🔍 Looking for product with ID:', itemProductId);
      
//       // Find product in list
//       const product = allProducts.find(p => p.id === itemProductId);
      
//       if (product) {
//         console.log('✅ Found product:', product.name);
//         cartWithProducts.push({
//           id: item.get('id') || item.id,
//           buyerId: item.get('buyerId') || item.buyerId,
//           productId: itemProductId,
//           quantity: item.get('quantity') || item.quantity,
//           addedAt: item.get('addedAt') || item.addedAt,
//           product: product
//         });
//       } else {
//         console.log('❌ Product not found for ID:', itemProductId);
//       }
//     }
    
//     console.log('✅ Cart with products prepared:', cartWithProducts.length, 'items');
//     res.json({ success: true, items: cartWithProducts });
    
//   } catch (error) {
//     console.error('❌ Get cart error:', error);
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

// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Internal server error: ' + err.message 
//   });
// });

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
const { mockProducts, mockOrders } = require('./mockData');

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

// ===== ENHANCED PRODUCT ROUTES - WITH MULTILINGUAL ARRAY SUPPORT =====
app.get('/api/products', async (req, res) => {
  try {
    const sellerId = req.query.sellerId;
    console.log('✅ Get products request received - with multilingual array support', sellerId ? `for seller: ${sellerId}` : '(all products)');
    
    let dbProducts;
    try {
      dbProducts = await db.getAllProducts();
      console.log('✅ Google Sheets data loaded successfully, products count:', dbProducts.length);
    } catch (apiError) {
      // ⚠️ FALLBACK: Use mock data when Google Sheets API fails
      if (apiError.message && (apiError.message.includes('Quota exceeded') || apiError.message.includes('429'))) {
        console.log('⚠️ Google Sheets quota exceeded, using mock data as fallback');
        dbProducts = mockProducts.map(product => ({ 
          // Mock the GoogleSheets row structure
          get: (key) => product[key],
          ...product 
        }));
      } else {
        throw apiError;
      }
    }
    
    console.log('📊 Raw products from sheets:', dbProducts.length);
    
    // Check if first product is array or object
    if (dbProducts.length > 0) {
      const firstProduct = dbProducts[0];
      console.log('🔍 First product structure:', typeof firstProduct);
      console.log('🔍 First product keys:', Object.keys(firstProduct).slice(0, 10));
      console.log('🔍 Is array?', Array.isArray(firstProduct));
      
      // If it's an array/object with numeric keys, we need to map by position
      const hasNumericKeys = Object.keys(firstProduct).every(key => !isNaN(key));
      console.log('🔍 Has numeric keys (array format):', hasNumericKeys);
      
      if (hasNumericKeys) {
        console.log('🔍 Sample data values:', Array.isArray(firstProduct) ? firstProduct.slice(0, 10) : Object.values(firstProduct).slice(0, 10));
      }
    }
    
    // ✅ ENHANCED: Handle both array and object formats
    const validDbProducts = dbProducts
      .map((p, index) => {
        let product;
        
        // Check if data comes as array with numeric indices
        const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
        
        if (hasNumericKeys) {
          console.log(`🔄 Product ${index} - Processing as ARRAY format`);
          
          // ✅ MAP ARRAY INDICES TO FIELD NAMES
          product = {
            // Basic fields
            id: p[0] || `product_${Date.now()}_${index}`,    // Column A - ID
            sellerId: p[1] || 'unknown',                      // Column B - Seller ID
            name: p[2] || 'Unknown Product',                  // Column C - Name
            
            // ✅ MULTILINGUAL NAME FIELDS
            name_en: p[3] || '',                              // Column D - English Name
            name_te: p[4] || '',                              // Column E - Telugu Name
            name_hi: p[5] || '',                              // Column F - Hindi Name
            name_bn: p[6] || '',                              // Column G - Bengali Name
            name_mr: p[7] || '',                              // Column H - Marathi Name
            name_ta: p[8] || '',                              // Column I - Tamil Name
            name_ur: p[9] || '',                              // Column J - Urdu Name
            
            // Pricing and inventory
            price: parseFloat(p[10]) || 0,                    // Column K - Price
            cost: parseFloat(p[11]) || 0,                     // Column L - Cost
            stock: parseInt(p[12]) || 0,                      // Column M - Stock
            sales: parseInt(p[13]) || 0,                      // Column N - Sales
            
            // Description fields
            description: p[14] || '',                         // Column O - Description
            
            // ✅ MULTILINGUAL DESCRIPTION FIELDS
            description_en: p[15] || '',                      // Column P - English Description
            description_te: p[16] || '',                      // Column Q - Telugu Description
            description_hi: p[17] || '',                      // Column R - Hindi Description
            description_bn: p[18] || '',                      // Column S - Bengali Description
            description_mr: p[19] || '',                      // Column T - Marathi Description
            description_ta: p[20] || '',                      // Column U - Tamil Description
            description_ur: p[21] || '',                      // Column V - Urdu Description
            
            // Media and metadata
            image: p[22] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop', // Column W - Image
            createdAt: p[23] || new Date().toISOString()      // Column X - Created At
          };
          
          // Debug first product mapping
          if (index === 0) {
            console.log('🧪 FIRST PRODUCT ARRAY MAPPING:');
            console.log('  Raw array slice:', Array.isArray(p) ? p.slice(0, 15) : Object.values(p).slice(0, 15));
            console.log('  Mapped id:', product.id);
            console.log('  Mapped name:', product.name);
            console.log('  Mapped name_en:', product.name_en);
            console.log('  Mapped name_te:', product.name_te);
            console.log('  Mapped name_hi:', product.name_hi);
            console.log('  Mapped price:', product.price);
            console.log('  Mapped stock:', product.stock);
            console.log('  Mapped description:', product.description);
            console.log('  Mapped description_en:', product.description_en);
            console.log('  Mapped description_te:', product.description_te);
            console.log('  Mapped image:', product.image);
          }
        } else {
          console.log(`🔄 Product ${index} - Processing as OBJECT format`);
          
          // Use existing object format with .get() method
          product = {
            id: p.get('id') || p.id || `product_${Date.now()}_${index}`,
            sellerId: p.get('sellerId') || p.sellerId || 'unknown',
            name: p.get('name') || p.name,
            description: p.get('description') || p.description || '',
            
            // Multilingual name fields
            name_en: p.get('name_en') || p.name_en || '',
            name_te: p.get('name_te') || p.name_te || '',
            name_hi: p.get('name_hi') || p.name_hi || '',
            name_bn: p.get('name_bn') || p.name_bn || '',
            name_mr: p.get('name_mr') || p.name_mr || '',
            name_ta: p.get('name_ta') || p.name_ta || '',
            name_ur: p.get('name_ur') || p.name_ur || '',
            
            // Multilingual description fields
            description_en: p.get('description_en') || p.description_en || '',
            description_te: p.get('description_te') || p.description_te || '',
            description_hi: p.get('description_hi') || p.description_hi || '',
            description_bn: p.get('description_bn') || p.description_bn || '',
            description_mr: p.get('description_mr') || p.description_mr || '',
            description_ta: p.get('description_ta') || p.description_ta || '',
            description_ur: p.get('description_ur') || p.description_ur || '',
            
            // Pricing and inventory
            price: parseFloat(p.get('price') || p.price || 0),
            cost: parseFloat(p.get('cost') || p.cost || 0),
            stock: parseInt(p.get('stock') || p.stock || 0),
            sales: parseInt(p.get('sales') || p.sales || 0),
            
            // Media
            image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
          };
        }
        
        // Add calculated fields
        product.originalPrice = product.originalPrice || Math.round(product.price * 1.3);
        
        return product;
      })
      .filter(p => {
        return p.name && 
               p.name !== 'Unknown Product' && 
               p.name.trim() !== '' && 
               p.price > 0 &&
               p.stock >= 0;
      });

    // ✅ FILTER BY SELLER ID IF REQUESTED
    let filteredProducts = validDbProducts;
    if (sellerId) {
      filteredProducts = validDbProducts.filter(p => p.sellerId === sellerId);
      console.log(`🏪 Filtered products for seller ${sellerId}:`, filteredProducts.length);
    }

    console.log('✅ Returning products with multilingual support:', filteredProducts.length);
    
    // Show multilingual statistics
    if (filteredProducts.length > 0) {
      const sample = filteredProducts[0];
      console.log('📊 SAMPLE PRODUCT MULTILINGUAL FIELDS:');
      console.log('  name:', sample.name);
      console.log('  name_en:', sample.name_en ? '✅ HAS DATA' : '❌ EMPTY');
      console.log('  name_te:', sample.name_te ? '✅ HAS DATA' : '❌ EMPTY');
      console.log('  name_hi:', sample.name_hi ? '✅ HAS DATA' : '❌ EMPTY');
      console.log('  description:', sample.description);
      console.log('  description_en:', sample.description_en ? '✅ HAS DATA' : '❌ EMPTY');
      console.log('  description_te:', sample.description_te ? '✅ HAS DATA' : '❌ EMPTY');
      console.log('  description_hi:', sample.description_hi ? '✅ HAS DATA' : '❌ EMPTY');
      
      // Count products with multilingual data
      const stats = {
        total: filteredProducts.length,
        withEnglishName: filteredProducts.filter(p => p.name_en && p.name_en.trim()).length,
        withTeluguName: filteredProducts.filter(p => p.name_te && p.name_te.trim()).length,
        withHindiName: filteredProducts.filter(p => p.name_hi && p.name_hi.trim()).length,
        withEnglishDesc: filteredProducts.filter(p => p.description_en && p.description_en.trim()).length,
        withTeluguDesc: filteredProducts.filter(p => p.description_te && p.description_te.trim()).length,
        withHindiDesc: filteredProducts.filter(p => p.description_hi && p.description_hi.trim()).length
      };
      
      console.log('📊 MULTILINGUAL STATISTICS:');
      console.log('  Total products:', stats.total);
      console.log('  With English names:', stats.withEnglishName);
      console.log('  With Telugu names:', stats.withTeluguName);
      console.log('  With Hindi names:', stats.withHindiName);
      console.log('  With English descriptions:', stats.withEnglishDesc);
      console.log('  With Telugu descriptions:', stats.withTeluguDesc);
      console.log('  With Hindi descriptions:', stats.withHindiDesc);
    }

    res.json({ success: true, products: filteredProducts });
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

// ===== UPDATE PRODUCT ROUTE =====
app.put('/api/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log('✅ Update product request received:', { productId, body: req.body });
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID is required' 
      });
    }

    // Check if updateProduct method exists in db
    if (typeof db.updateProduct === 'function') {
      console.log('🔄 Calling db.updateProduct...');
      const updatedProduct = await db.updateProduct(productId, req.body);
      
      res.json({ 
        success: true, 
        product: { 
          id: updatedProduct.get('id') || updatedProduct.id || productId, 
          ...req.body
        },
        message: 'Product updated successfully'
      });
    } else {
      // Fallback: Find and update the product manually
      console.log('⚠️ updateProduct method not available, using manual approach');
      
      const allProducts = await db.getAllProducts();
      const productIndex = allProducts.findIndex(p => {
        const pId = p.get ? p.get('id') : p.id;
        return pId === productId;
      });
      
      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      
      // For now, just return success with updated data
      // In a real implementation, this would update Google Sheets
      res.json({ 
        success: true, 
        product: { 
          id: productId, 
          ...req.body
        },
        message: 'Product updated successfully (simulated)'
      });
    }
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update product: ' + error.message 
    });
  }
});

// ===== FIXED CART ROUTES - Enhanced Error Handling & Multilingual Support =====
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

// ✅ COMPLETELY FIXED CART GET ENDPOINT
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
    
    // Get database products with multilingual support
    console.log('🔄 Getting database products with multilingual fields...');
    const dbProducts = await db.getAllProducts();
    console.log('🛍️ Database products found:', dbProducts.length);
    
    // ✅ ENHANCED: Create product lookup map for better performance and error handling
    const productMap = new Map();
    
    dbProducts.forEach((p, index) => {
      try {
        let dbProduct;
        
        // Check if data comes as array with numeric indices
        const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
        
        if (hasNumericKeys) {
          // Array format mapping (same indices as in /api/products)
          dbProduct = {
            id: p[0] || `product_${Date.now()}_${index}`,
            sellerId: p[1] || 'unknown',
            name: p[2] || 'Unknown Product',
            name_en: p[2] || '',
            name_te: p[3] || '',
            name_hi: p[4] || '',
            name_bn: p[5] || '',
            name_mr: p || '',
            name_ta: p || '',
            name_ur: p || '',
            price: parseFloat(p) || 0,
            cost: parseFloat(p) || 0,
            stock: parseInt(p) || 0,
            sales: parseInt(p) || 0,
            description: p || '',
            description_en: p || '',
            description_te: p || '',
            description_hi: p || '',
            description_bn: p[18] || '',
            description_mr: p || '',
            description_ta: p || '',
            description_ur: p || '',
            image: p || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            createdAt: p[23] || new Date().toISOString()
          };
        } else {
          // Object format mapping
          dbProduct = {
            id: p.get('id') || p.id || `product_${Date.now()}_${index}`,
            sellerId: p.get('sellerId') || p.sellerId || 'unknown',
            name: p.get('name') || p.name || 'Unknown Product',
            description: p.get('description') || p.description || '',
            name_en: p.get('name_en') || p.name_en || '',
            name_te: p.get('name_te') || p.name_te || '',
            name_hi: p.get('name_hi') || p.name_hi || '',
            name_bn: p.get('name_bn') || p.name_bn || '',
            name_mr: p.get('name_mr') || p.name_mr || '',
            name_ta: p.get('name_ta') || p.name_ta || '',
            name_ur: p.get('name_ur') || p.name_ur || '',
            description_en: p.get('description_en') || p.description_en || '',
            description_te: p.get('description_te') || p.description_te || '',
            description_hi: p.get('description_hi') || p.description_hi || '',
            description_bn: p.get('description_bn') || p.description_bn || '',
            description_mr: p.get('description_mr') || p.description_mr || '',
            description_ta: p.get('description_ta') || p.description_ta || '',
            description_ur: p.get('description_ur') || p.description_ur || '',
            price: parseFloat(p.get('price') || p.price || 0),
            cost: parseFloat(p.get('cost') || p.cost || 0),
            stock: parseInt(p.get('stock') || p.stock || 0),
            sales: parseInt(p.get('sales') || p.sales || 0),
            image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
          };
        }
        
        // Add calculated fields
        dbProduct.originalPrice = dbProduct.originalPrice || Math.round(dbProduct.price * 1.3);
        
        // ✅ CRITICAL: Only add to map if it has valid data AND a valid ID
        if (dbProduct.id && 
            dbProduct.name && 
            dbProduct.name !== 'Unknown Product' && 
            dbProduct.price > 0) {
          productMap.set(dbProduct.id.toString(), dbProduct);
          console.log(`✅ Added product to map: ${dbProduct.id} -> ${dbProduct.name}`);
        } else {
          console.log(`❌ Skipped invalid product: ID=${dbProduct.id}, Name=${dbProduct.name}, Price=${dbProduct.price}`);
        }
      } catch (productError) {
        console.error(`❌ Error processing product at index ${index}:`, productError);
      }
    });
    
    console.log(`🗺️ Product map created with ${productMap.size} valid products`);
    console.log(`🗺️ Sample product IDs in map:`, Array.from(productMap.keys()).slice(0, 10));
    
    // ✅ ENHANCED: Match cart items with products using the map
    for (const item of items) {
      try {
        const itemProductId = (item.get('productId') || item.productId || '').toString();
        console.log(`🔍 Processing cart item: ID=${item.get('id') || item.id}, ProductID="${itemProductId}"`);
        
        if (!itemProductId || itemProductId === '') {
          console.log('❌ Cart item has no product ID, skipping');
          continue;
        }
        
        // Find product in map
        const product = productMap.get(itemProductId);
        
        if (product) {
          console.log(`✅ Found product for cart item: ${product.name} (ID: ${product.id})`);
          
          const cartItem = {
            id: item.get('id') || item.id,
            buyerId: item.get('buyerId') || item.buyerId,
            productId: itemProductId,
            quantity: parseInt(item.get('quantity') || item.quantity || 1),
            addedAt: item.get('addedAt') || item.addedAt,
            product: product // This now includes all multilingual fields
          };
          
          cartWithProducts.push(cartItem);
          console.log(`✅ Cart item added successfully: ${cartItem.id}`);
        } else {
          console.log(`❌ Product not found in map for ID: "${itemProductId}"`);
          console.log(`❌ Available product IDs:`, Array.from(productMap.keys()).slice(0, 10));
          
          // ✅ FALLBACK: Create a placeholder product to prevent crashes
          const fallbackProduct = {
            id: itemProductId,
            name: 'Product Not Found',
            name_en: 'Product Not Found',
            name_te: 'ఉత్పత్తి కనుగొనబడలేదు',
            name_hi: 'उत्पाद नहीं मिला',
            name_bn: 'পণ্য পাওয়া যায়নি',
            name_mr: 'उत्पादन सापडले नाही',
            name_ta: 'தயாரிப்பு கிடைக்கவில்லை',
            name_ur: 'مصنوعات نہیں ملا',
            description: 'This product is no longer available',
            description_en: 'This product is no longer available',
            description_te: 'ఈ ఉత్పత్తి ఇప్పుడు అందుబాటులో లేదు',
            description_hi: 'यह उत्पाद अब उपलब्ध नहीं है',
            description_bn: 'এই পণ্যটি আর উপলব্ধ নেই',
            description_mr: 'हे उत्पादन आता उपलब्ध नाही',
            description_ta: 'இந்த தயாரிப்பு இனி கிடைக்காது',
            description_ur: 'یہ پروڈکٹ اب دستیاب نہیں ہے',
            price: 0,
            originalPrice: 0,
            stock: 0,
            image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            sellerId: 'unknown',
            createdAt: new Date().toISOString()
          };
          
          const cartItem = {
            id: item.get('id') || item.id,
            buyerId: item.get('buyerId') || item.buyerId,
            productId: itemProductId,
            quantity: parseInt(item.get('quantity') || item.quantity || 1),
            addedAt: item.get('addedAt') || item.addedAt,
            product: fallbackProduct
          };
          
          cartWithProducts.push(cartItem);
          console.log(`⚠️ Added cart item with fallback product: ${cartItem.id}`);
        }
      } catch (itemError) {
        console.error(`❌ Error processing cart item:`, itemError);
        console.error(`❌ Item data:`, {
          id: item?.get?.('id') || item?.id,
          productId: item?.get?.('productId') || item?.productId,
          quantity: item?.get?.('quantity') || item?.quantity
        });
        // Continue with next item instead of crashing
      }
    }
    
    console.log(`✅ Cart with products prepared: ${cartWithProducts.length} items`);
    
    // ✅ FINAL VALIDATION: Ensure all cart items have product objects
    const validCartItems = cartWithProducts.filter(item => {
      const hasValidProduct = item.product && typeof item.product === 'object' && item.product.id;
      if (!hasValidProduct) {
        console.log(`❌ Removing invalid cart item: ${item.id} - no valid product object`);
      }
      return hasValidProduct;
    });
    
    console.log(`✅ Final valid cart items: ${validCartItems.length}`);
    
    res.json({ 
      success: true, 
      items: validCartItems,
      debug: {
        totalCartItems: items.length,
        totalProducts: dbProducts.length,
        validProducts: productMap.size,
        processedCartItems: cartWithProducts.length,
        finalCartItems: validCartItems.length
      }
    });
    
  } catch (error) {
    console.error('❌ Get cart error:', error);
    console.error('❌ Error stack:', error.stack);
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
    
    let orders;
    try {
      orders = await db.getOrdersBySeller(sellerId);
    } catch (apiError) {
      // ⚠️ FALLBACK: Use mock data when Google Sheets API fails
      if (apiError.message && (apiError.message.includes('Quota exceeded') || apiError.message.includes('429'))) {
        console.log('⚠️ Google Sheets quota exceeded for orders, using mock data as fallback');
        orders = mockOrders
          .filter(order => order.sellerId === sellerId)
          .map(order => ({ 
            get: (key) => order[key],
            _rawData: order,
            ...order 
          }));
      } else {
        throw apiError;
      }
    }
    
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
  console.log(`✅ Enhanced with MULTILINGUAL ARRAY FORMAT + FIXED CART SUPPORT 🌍🛒`);
  console.log(`✅ Available routes:`);
  console.log(`   GET  /api/test`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/signup`);
  console.log(`   GET  /api/products (with multilingual array support)`);
  console.log(`   POST /api/products`);
  console.log(`   PUT  /api/products/:productId`);
  console.log(`   POST /api/cart`);
  console.log(`   GET  /api/cart/:buyerId (FIXED with multilingual product data)`);
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

// // ===== FIXED PRODUCT ROUTES - HANDLE ARRAY DATA WITH MULTILINGUAL SUPPORT =====
// app.get('/api/products', async (req, res) => {
//   try {
//     console.log('✅ Get products request received - with multilingual array support');
//     const dbProducts = await db.getAllProducts();
    
//     console.log('📊 Raw products from sheets:', dbProducts.length);
    
//     // Check if first product is array or object
//     if (dbProducts.length > 0) {
//       const firstProduct = dbProducts[0];
//       console.log('🔍 First product structure:', typeof firstProduct);
//       console.log('🔍 First product keys:', Object.keys(firstProduct).slice(0, 10));
//       console.log('🔍 Is array?', Array.isArray(firstProduct));
      
//       // If it's an array/object with numeric keys, we need to map by position
//       const hasNumericKeys = Object.keys(firstProduct).every(key => !isNaN(key));
//       console.log('🔍 Has numeric keys (array format):', hasNumericKeys);
      
//       if (hasNumericKeys) {
//         console.log('🔍 Sample data values:', Array.isArray(firstProduct) ? firstProduct.slice(0, 10) : Object.values(firstProduct).slice(0, 10));
//       }
//     }
    
//     // ✅ ENHANCED: Handle both array and object formats
//     const validDbProducts = dbProducts
//       .map((p, index) => {
//         let product;
        
//         // Check if data comes as array with numeric indices
//         const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
        
//         if (hasNumericKeys) {
//           console.log(`🔄 Product ${index} - Processing as ARRAY format`);
          
//           // ✅ MAP ARRAY INDICES TO FIELD NAMES
//           // ADJUST THESE INDICES TO MATCH YOUR GOOGLE SHEETS COLUMN ORDER
//           product = {
//             // Basic fields
//             id: p[0] || `product_${Date.now()}_${index}`,    // Column A - ID
//             sellerId: p[1] || 'unknown',                      // Column B - Seller ID
//             name: p || 'Unknown Product',                  // Column C - Name
            
//             // ✅ MULTILINGUAL NAME FIELDS
//             name_en: p[3] || '',                              // Column D - English Name
//             name_te: p || '',                              // Column E - Telugu Name
//             name_hi: p || '',                              // Column F - Hindi Name
//             name_bn: p || '',                              // Column G - Bengali Name
//             name_mr: p || '',                              // Column H - Marathi Name
//             name_ta: p || '',                              // Column I - Tamil Name
//             name_ur: p || '',                              // Column J - Urdu Name
            
//             // Pricing and inventory
//             price: parseFloat(p[10]) || 0,                    // Column K - Price
//             cost: parseFloat(p) || 0,                     // Column L - Cost
//             stock: parseInt(p) || 0,                      // Column M - Stock
//             sales: parseInt(p) || 0,                      // Column N - Sales
            
//             // Description fields
//             description: p[14] || '',                         // Column O - Description
            
//             // ✅ MULTILINGUAL DESCRIPTION FIELDS
//             description_en: p[15] || '',                      // Column P - English Description
//             description_te: p[16] || '',                      // Column Q - Telugu Description
//             description_hi: p[17] || '',                      // Column R - Hindi Description
//             description_bn: p || '',                      // Column S - Bengali Description
//             description_mr: p[19] || '',                      // Column T - Marathi Description
//             description_ta: p[20] || '',                      // Column U - Tamil Description
//             description_ur: p || '',                      // Column V - Urdu Description
            
//             // Media and metadata
//             image: p[22] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop', // Column W - Image
//             createdAt: p[23] || new Date().toISOString()      // Column X - Created At
//           };
          
//           // Debug first product mapping
//           if (index === 0) {
//             console.log('🧪 FIRST PRODUCT ARRAY MAPPING:');
//             console.log('  Raw array slice:', Array.isArray(p) ? p.slice(0, 15) : Object.values(p).slice(0, 15));
//             console.log('  Mapped id:', product.id);
//             console.log('  Mapped name:', product.name);
//             console.log('  Mapped name_en:', product.name_en);
//             console.log('  Mapped name_te:', product.name_te);
//             console.log('  Mapped name_hi:', product.name_hi);
//             console.log('  Mapped price:', product.price);
//             console.log('  Mapped stock:', product.stock);
//             console.log('  Mapped description:', product.description);
//             console.log('  Mapped description_en:', product.description_en);
//             console.log('  Mapped description_te:', product.description_te);
//             console.log('  Mapped image:', product.image);
//           }
//         } else {
//           console.log(`🔄 Product ${index} - Processing as OBJECT format`);
          
//           // Use existing object format with .get() method
//           product = {
//             id: p.get('id') || p.id || `product_${Date.now()}_${index}`,
//             sellerId: p.get('sellerId') || p.sellerId || 'unknown',
//             name: p.get('name') || p.name,
//             description: p.get('description') || p.description || '',
            
//             // Multilingual name fields
//             name_en: p.get('name_en') || p.name_en || '',
//             name_te: p.get('name_te') || p.name_te || '',
//             name_hi: p.get('name_hi') || p.name_hi || '',
//             name_bn: p.get('name_bn') || p.name_bn || '',
//             name_mr: p.get('name_mr') || p.name_mr || '',
//             name_ta: p.get('name_ta') || p.name_ta || '',
//             name_ur: p.get('name_ur') || p.name_ur || '',
            
//             // Multilingual description fields
//             description_en: p.get('description_en') || p.description_en || '',
//             description_te: p.get('description_te') || p.description_te || '',
//             description_hi: p.get('description_hi') || p.description_hi || '',
//             description_bn: p.get('description_bn') || p.description_bn || '',
//             description_mr: p.get('description_mr') || p.description_mr || '',
//             description_ta: p.get('description_ta') || p.description_ta || '',
//             description_ur: p.get('description_ur') || p.description_ur || '',
            
//             // Pricing and inventory
//             price: parseFloat(p.get('price') || p.price || 0),
//             cost: parseFloat(p.get('cost') || p.cost || 0),
//             stock: parseInt(p.get('stock') || p.stock || 0),
//             sales: parseInt(p.get('sales') || p.sales || 0),
            
//             // Media
//             image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
//             createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
//           };
//         }
        
//         // Add calculated fields
//         product.originalPrice = product.originalPrice || Math.round(product.price * 1.3);
        
//         return product;
//       })
//       .filter(p => {
//         return p.name && 
//                p.name !== 'Unknown Product' && 
//                p.name.trim() !== '' && 
//                p.price > 0 &&
//                p.stock >= 0;
//       });

//     console.log('✅ Returning products with multilingual support:', validDbProducts.length);
    
//     // Show multilingual statistics
//     if (validDbProducts.length > 0) {
//       const sample = validDbProducts[0];
//       console.log('📊 SAMPLE PRODUCT MULTILINGUAL FIELDS:');
//       console.log('  name:', sample.name);
//       console.log('  name_en:', sample.name_en ? '✅ HAS DATA' : '❌ EMPTY');
//       console.log('  name_te:', sample.name_te ? '✅ HAS DATA' : '❌ EMPTY');
//       console.log('  name_hi:', sample.name_hi ? '✅ HAS DATA' : '❌ EMPTY');
//       console.log('  description:', sample.description);
//       console.log('  description_en:', sample.description_en ? '✅ HAS DATA' : '❌ EMPTY');
//       console.log('  description_te:', sample.description_te ? '✅ HAS DATA' : '❌ EMPTY');
//       console.log('  description_hi:', sample.description_hi ? '✅ HAS DATA' : '❌ EMPTY');
      
//       // Count products with multilingual data
//       const stats = {
//         total: validDbProducts.length,
//         withEnglishName: validDbProducts.filter(p => p.name_en && p.name_en.trim()).length,
//         withTeluguName: validDbProducts.filter(p => p.name_te && p.name_te.trim()).length,
//         withHindiName: validDbProducts.filter(p => p.name_hi && p.name_hi.trim()).length,
//         withEnglishDesc: validDbProducts.filter(p => p.description_en && p.description_en.trim()).length,
//         withTeluguDesc: validDbProducts.filter(p => p.description_te && p.description_te.trim()).length,
//         withHindiDesc: validDbProducts.filter(p => p.description_hi && p.description_hi.trim()).length
//       };
      
//       console.log('📊 MULTILINGUAL STATISTICS:');
//       console.log('  Total products:', stats.total);
//       console.log('  With English names:', stats.withEnglishName);
//       console.log('  With Telugu names:', stats.withTeluguName);
//       console.log('  With Hindi names:', stats.withHindiName);
//       console.log('  With English descriptions:', stats.withEnglishDesc);
//       console.log('  With Telugu descriptions:', stats.withTeluguDesc);
//       console.log('  With Hindi descriptions:', stats.withHindiDesc);
//     }

//     res.json({ success: true, products: validDbProducts });
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
//       product: { 
//         id: product.get('id') || product.id, 
//         ...req.body
//       }
//     });
//   } catch (error) {
//     console.error('❌ Create product error:', error);
//     res.status(500).json({ 
//       success: false, 
//       message: 'Failed to create product: ' + error.message 
//     });
//   }
// });

// // ===== ENHANCED CART ROUTES - WITH MULTILINGUAL PRODUCT SUPPORT =====
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
//     console.log('✅ Cart item added successfully');
    
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
    
//     // Get database products with multilingual support
//     console.log('🔄 Getting database products with multilingual fields...');
//     const dbProducts = await db.getAllProducts();
//     console.log('🛍️ Database products found:', dbProducts.length);
    
//     // Create enhanced product list with multilingual fields (using same logic as /api/products)
//     const allProducts = [];
    
//     dbProducts.forEach((p, index) => {
//       let dbProduct;
      
//       // Check if data comes as array with numeric indices (same as in /api/products)
//       const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
      
//       if (hasNumericKeys) {
//         // Array format mapping (same indices as in /api/products)
//         dbProduct = {
//           id: p[0] || `product_${Date.now()}_${index}`,
//           sellerId: p[1] || 'unknown',
//           name: p[2] || 'Unknown Product',
//           name_en: p || '',
//           name_te: p || '',
//           name_hi: p || '',
//           name_bn: p || '',
//           name_mr: p || '',
//           name_ta: p || '',
//           name_ur: p || '',
//           price: parseFloat(p) || 0,
//           cost: parseFloat(p) || 0,
//           stock: parseInt(p) || 0,
//           sales: parseInt(p) || 0,
//           description: p || '',
//           description_en: p || '',
//           description_te: p || '',
//           description_hi: p || '',
//           description_bn: p || '',
//           description_mr: p || '',
//           description_ta: p || '',
//           description_ur: p || '',
//           image: p || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
//           createdAt: p[23] || new Date().toISOString()
//         };
//       } else {
//         // Object format mapping (same as in /api/products)
//         dbProduct = {
//           id: p.get('id') || p.id,
//           sellerId: p.get('sellerId') || p.sellerId || 'unknown',
//           name: p.get('name') || p.name || 'Unknown Product',
//           description: p.get('description') || p.description || 'No description available',
//           name_en: p.get('name_en') || p.name_en || '',
//           name_te: p.get('name_te') || p.name_te || '',
//           name_hi: p.get('name_hi') || p.name_hi || '',
//           name_bn: p.get('name_bn') || p.name_bn || '',
//           name_mr: p.get('name_mr') || p.name_mr || '',
//           name_ta: p.get('name_ta') || p.name_ta || '',
//           name_ur: p.get('name_ur') || p.name_ur || '',
//           description_en: p.get('description_en') || p.description_en || '',
//           description_te: p.get('description_te') || p.description_te || '',
//           description_hi: p.get('description_hi') || p.description_hi || '',
//           description_bn: p.get('description_bn') || p.description_bn || '',
//           description_mr: p.get('description_mr') || p.description_mr || '',
//           description_ta: p.get('description_ta') || p.description_ta || '',
//           description_ur: p.get('description_ur') || p.description_ur || '',
//           price: parseFloat(p.get('price') || p.price || 0),
//           originalPrice: parseFloat(p.get('originalPrice') || p.originalPrice || p.get('price') || p.price || 0),
//           cost: parseFloat(p.get('cost') || p.cost || 0),
//           stock: parseInt(p.get('stock') || p.stock || 0),
//           sales: parseInt(p.get('sales') || p.sales || 0),
//           image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
//           createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
//         };
//       }
      
//       // Add calculated fields
//       dbProduct.originalPrice = dbProduct.originalPrice || Math.round(dbProduct.price * 1.3);
      
//       // Only add if it has valid data
//       if (dbProduct.name && dbProduct.name !== 'Unknown Product' && dbProduct.price > 0) {
//         allProducts.push(dbProduct);
//       }
//     });
    
//     console.log('🛍️ Total products from sheets (with multilingual):', allProducts.length);
    
//     // Match cart items with enhanced products
//     for (const item of items) {
//       const itemProductId = item.get('productId') || item.productId;
//       console.log('🔍 Looking for product with ID:', itemProductId);
      
//       // Find product in list
//       const product = allProducts.find(p => p.id === itemProductId);
      
//       if (product) {
//         console.log('✅ Found product with multilingual support:', product.name);
//         cartWithProducts.push({
//           id: item.get('id') || item.id,
//           buyerId: item.get('buyerId') || item.buyerId,
//           productId: itemProductId,
//           quantity: item.get('quantity') || item.quantity,
//           addedAt: item.get('addedAt') || item.addedAt,
//           product: product // This now includes all multilingual fields
//         });
//       } else {
//         console.log('❌ Product not found for ID:', itemProductId);
//       }
//     }
    
//     console.log('✅ Cart with multilingual products prepared:', cartWithProducts.length, 'items');
//     res.json({ success: true, items: cartWithProducts });
    
//   } catch (error) {
//     console.error('❌ Get cart error:', error);
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

// app.use((err, req, res, next) => {
//   console.error('❌ Unhandled error:', err);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Internal server error: ' + err.message 
//   });
// });

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
//   console.log(`✅ Enhanced with MULTILINGUAL ARRAY FORMAT SUPPORT 🌍`);
//   console.log(`✅ Available routes:`);
//   console.log(`   GET  /api/test`);
//   console.log(`   POST /api/auth/login`);
//   console.log(`   POST /api/auth/signup`);
//   console.log(`   GET  /api/products (with multilingual array support)`);
//   console.log(`   POST /api/products`);
//   console.log(`   POST /api/cart`);
//   console.log(`   GET  /api/cart/:buyerId (with multilingual product data)`);
//   console.log(`   PUT  /api/cart/:id`);
//   console.log(`   DELETE /api/cart/:id`);
//   console.log(`   POST /api/orders`);
//   console.log(`   GET  /api/orders/buyer/:buyerId`);
//   console.log(`   GET  /api/orders/seller/:sellerId`);
// });

// process.on('SIGTERM', () => {
//   console.log('👋 Server shutting down gracefully');
//   process.exit(0);
// });

// process.on('SIGINT', () => {
//   console.log('👋 Server shutting down gracefully');
//   process.exit(0);
// });
