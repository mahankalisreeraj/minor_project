const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const GoogleSheetsDB = require('./googleSheetsAPI');
const { mockProducts, mockOrders, mockReviews } = require('./mockData');
const MultilingualChatbot = require('./chatbotService');

const app = express();
const port = process.env.PORT || 3001;

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, file://)
    if (!origin) return callback(null, true);
    // Allow special 'null' origin used by file:// schemes
    if (origin === 'null') return callback(null, true);

    const allowedOrigins = new Set([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5500',
      'http://127.0.0.1:5500'
    ]);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // In development, allow other localhost origins
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }

    // Fallback: reject unknown non-local origins
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
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
const chatbot = new MultilingualChatbot();

// Configure multer for file uploads (for voice messages)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

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

// Placeholder image route
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const placeholderUrl = `https://via.placeholder.com/${width}x${height}.png?text=No+Image`;
  console.log(`🖼️ Redirecting to placeholder: ${placeholderUrl}`);
  res.redirect(placeholderUrl);
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
            id: p[0] || `product_${Date.now()}_${index}`,
            sellerId: p[1] || 'unknown',
            name: p[2] || 'Unknown Product',
            
            // ✅ MULTILINGUAL NAME FIELDS
            name_en: p[3] || '',
            name_te: p[4] || '',
            name_hi: p[5] || '',
            name_bn: p[6] || '',
            name_mr: p[7] || '',
            name_ta: p[8] || '',
            name_ur: p[9] || '',
            
            // Pricing and inventory
            price: parseFloat(p[10]) || 0,
            cost: parseFloat(p[11]) || 0,
            stock: parseInt(p[12]) || 0,
            sales: parseInt(p[13]) || 0,
            
            // Description fields
            description: p[14] || '',
            
            // ✅ MULTILINGUAL DESCRIPTION FIELDS
            description_en: p[15] || '',
            description_te: p[16] || '',
            description_hi: p[17] || '',
            description_bn: p[18] || '',
            description_mr: p[19] || '',
            description_ta: p[20] || '',
            description_ur: p[21] || '',
            
            // Media and metadata
            image: p[22] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            createdAt: p[23] || new Date().toISOString()
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
        
        // Compute Product Quality Index (PQI)
        const marginPct = product.price > 0 ? ((product.price - (product.cost || 0)) / product.price) * 100 : 0;
        const marginScore = Math.max(0, Math.min(100, marginPct));
        const salesScore = Math.max(0, Math.min(100, (product.sales || 0) / 500 * 100));
        const stockScore = Math.max(0, Math.min(100, (product.stock || 0) / 100 * 100));
        const contentFields = [product.name, product.description, product.image, product.name_en, product.description_en];
        const contentFilled = contentFields.filter(v => v && String(v).trim() !== '').length;
        const contentScore = (contentFilled / contentFields.length) * 100;
        const pqi = (0.4 * marginScore) + (0.3 * salesScore) + (0.1 * stockScore) + (0.2 * contentScore);
        product.pqi = Math.round(pqi * 10) / 10;
        
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

    // ✅ Compute PQI (1-5) from reviews
    const productsWithPQI = await Promise.all(filteredProducts.map(async (prod) => {
      try {
        if (typeof db.getAverageRatingForProduct === 'function') {
          const { average, count } = await db.getAverageRatingForProduct(prod.id);
          const pqi = count > 0 ? Math.max(1, Math.min(5, Number(average))) : 4;
          return { ...prod, pqi: Math.round(pqi * 10) / 10, reviewCount: count };
        }
      } catch (err) {
        // Fallback to mock reviews if Sheets fails
        const reviews = (mockReviews || []).filter(r => r.productId === prod.id);
        const count = reviews.length;
        const avg = count > 0 ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count : 4;
        const pqi = count > 0 ? Math.max(1, Math.min(5, avg)) : 4;
        return { ...prod, pqi: Math.round(pqi * 10) / 10, reviewCount: count };
      }
      // If no method available, attach zeros
      return { ...prod, pqi: 4, reviewCount: 0 };
    }));

    console.log('✅ Returning products with multilingual support:', productsWithPQI.length);
    
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

    res.json({ success: true, products: productsWithPQI });
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

// ===== REVIEW ROUTES =====
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    let rows = [];
    try {
      if (typeof db.getReviewsByProduct === 'function') {
        rows = await db.getReviewsByProduct(productId);
      }
    } catch (err) {
      rows = (mockReviews || []).filter(r => r.productId === productId);
    }

    const reviews = rows.map(r => ({
      id: r.get ? (r.get('id') || r.id) : r.id,
      productId: r.get ? (r.get('productId') || r.productId) : r.productId,
      buyerId: r.get ? (r.get('buyerId') || r.buyerId) : r.buyerId,
      rating: Number(r.get ? (r.get('rating') || r.rating) : r.rating) || 0,
      comment: r.get ? (r.get('comment') || r.comment) : r.comment || '',
      createdAt: r.get ? (r.get('createdAt') || r.createdAt) : r.createdAt || new Date().toISOString(),
    }));

    res.json({ success: true, reviews });
  } catch (error) {
    console.error('❌ Get reviews error:', error);
    res.status(500).json({ success: false, reviews: [], message: 'Failed to fetch reviews: ' + error.message });
  }
});

app.post('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { buyerId, rating, comment } = req.body || {};

    if (!buyerId || !rating) {
      return res.status(400).json({ success: false, message: 'buyerId and rating are required' });
    }

    let saved;
    try {
      if (typeof db.addReview === 'function') {
        saved = await db.addReview({ productId, buyerId, rating: Number(rating), comment });
      }
    } catch (err) {
      // Fallback: echo back review (not persisted)
      saved = { id: Date.now().toString(), productId, buyerId, rating: Number(rating), comment, createdAt: new Date().toISOString() };
    }

    res.json({
      success: true,
      review: saved.get ? {
        id: saved.get('id') || saved.id,
        productId: saved.get('productId') || saved.productId,
        buyerId: saved.get('buyerId') || saved.buyerId,
        rating: Number(saved.get('rating') || saved.rating) || 0,
        comment: saved.get('comment') || saved.comment || '',
        createdAt: saved.get('createdAt') || saved.createdAt || new Date().toISOString()
      } : saved
    });
  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({ success: false, message: 'Failed to create review: ' + error.message });
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
    const productMap = new Map(dbProducts.map(p => [p.get('id') || p.id, p]));
    console.log('🛍️ Database products found:', dbProducts.length);
    
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
            ...order 
          }));
      } else {
        throw apiError;
      }
    }
    
    res.json({
      success: true,
      orders: orders.map(o => {
        const orderData = o.toObject ? o.toObject() : o;
        return {
          ...orderData,
          id: orderData.id || (o.get ? o.get('id') : null),
        };
      })
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

app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    console.log(`✅ Update order status request: ${orderId} to ${status}`);

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and status are required',
      });
    }

    const updatedOrder = await db.updateOrderStatus(orderId, status);

    if (updatedOrder) {
      res.json({
        success: true,
        order: { id: updatedOrder.get('id') || updatedOrder.id, ...updatedOrder._rawData },
      });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status: ' + error.message,
    });
  }
});

// ===== CHATBOT ROUTES =====
// 🤖 Main chatbot endpoint
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { userId, message, userType = 'buyer', language = 'en', dbContext = {}, sellerId } = req.body;
    
    console.log('🤖 Chatbot message received:', { userId, userType, message: message?.substring(0, 100) });
    
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID and message are required'
      });
    }

    // Use provided dbContext from client or prepare database context
    let finalDbContext = dbContext;
    
    // If no context provided, fetch from database
    if (!dbContext.products && !dbContext.orders) {
      try {
        if (userType === 'seller') {
          // Get seller-specific data
          const products = await db.getAllProducts();
          const orders = await db.getOrdersBySeller(sellerId || userId);
          
          finalDbContext = {
            products: products.map(p => ({
              id: p.get ? p.get('id') : p.id,
              name: p.get ? p.get('name') : p.name,
              price: parseFloat(p.get ? p.get('price') : p.price || 0),
              stock: parseInt(p.get ? p.get('stock') : p.stock || 0),
              sales: parseInt(p.get ? p.get('sales') : p.sales || 0),
              cost: parseFloat(p.get ? p.get('cost') : p.cost || 0),
              description: p.get ? p.get('description') : p.description,
              sellerId: p.get ? p.get('sellerId') : p.sellerId
            })),
            orders: orders.map(o => ({
              id: o.get ? o.get('id') : o.id,
              status: o.get ? o.get('status') : o.status,
              total: parseFloat(o.get ? o.get('total') : o.total || 0),
              buyerId: o.get ? o.get('buyerId') : o.buyerId,
              sellerId: o.get ? o.get('sellerId') : o.sellerId,
              createdAt: o.get ? o.get('createdAt') : o.createdAt
            }))
          };
        } else {
          // Get buyer-specific data
          const products = await db.getAllProducts();
          
          finalDbContext = {
            products: products.map(p => {
              // Handle both array and object formats
              const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
              
              if (hasNumericKeys) {
                return {
                  id: p[0] || `product_${Date.now()}_${Math.random()}`,
                  sellerId: p[1] || 'unknown',
                  name: p[2] || 'Unknown Product',
                  name_en: p[3] || '',
                  name_te: p[4] || '',
                  name_hi: p[5] || '',
                  name_bn: p[6] || '',
                  name_mr: p[7] || '',
                  name_ta: p[8] || '',
                  name_ur: p[9] || '',
                  price: parseFloat(p[10]) || 0,
                  cost: parseFloat(p[11]) || 0,
                  stock: parseInt(p[12]) || 0,
                  sales: parseInt(p[13]) || 0,
                  description: p[14] || '',
                  description_en: p[15] || '',
                  description_te: p[16] || '',
                  description_hi: p[17] || '',
                  description_bn: p[18] || '',
                  description_mr: p[19] || '',
                  description_ta: p[20] || '',
                  description_ur: p[21] || '',
                  image: p[22] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
                  createdAt: p[23] || new Date().toISOString()
                };
              } else {
                return {
                  id: p.get('id') || p.id,
                  name: p.get('name') || p.name,
                  name_en: p.get('name_en') || p.name_en || '',
                  name_te: p.get('name_te') || p.name_te || '',
                  name_hi: p.get('name_hi') || p.name_hi || '',
                  name_bn: p.get('name_bn') || p.name_bn || '',
                  name_mr: p.get('name_mr') || p.name_mr || '',
                  name_ta: p.get('name_ta') || p.name_ta || '',
                  name_ur: p.get('name_ur') || p.name_ur || '',
                  price: parseFloat(p.get('price') || p.price || 0),
                  cost: parseFloat(p.get('cost') || p.cost || 0),
                  stock: parseInt(p.get('stock') || p.stock || 0),
                  sales: parseInt(p.get('sales') || p.sales || 0),
                  description: p.get('description') || p.description || '',
                  description_en: p.get('description_en') || p.description_en || '',
                  description_te: p.get('description_te') || p.description_te || '',
                  description_hi: p.get('description_hi') || p.description_hi || '',
                  description_bn: p.get('description_bn') || p.description_bn || '',
                  description_mr: p.get('description_mr') || p.description_mr || '',
                  description_ta: p.get('description_ta') || p.description_ta || '',
                  description_ur: p.get('description_ur') || p.description_ur || '',
                  image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
                  sellerId: p.get('sellerId') || p.sellerId,
                  createdAt: p.get('createdAt') || p.createdAt || new Date().toISOString()
                };
              }
            }).filter(p => p.name && p.name !== 'Unknown Product' && p.price > 0)
          };
        }
      } catch (dbError) {
        console.error('Error fetching database context:', dbError);
        // Use empty context if database fails
        finalDbContext = { products: [], orders: [] };
      }
    }

    // Process the message through the chatbot
    const result = await chatbot.processMessage(userId, message, userType, finalDbContext);
    
    console.log('🤖 Chatbot response generated:', { success: result.success, responseLength: result.response?.length });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      response: "I'm experiencing technical difficulties. Please try again in a moment.",
      error: error.message
    });
  }
});

// 🗣️ Voice message processing endpoint
app.post('/api/chatbot/voice', upload.single('audio'), async (req, res) => {
  try {
    const { userId, userType = 'buyer', language = 'en', dbContext, sellerId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    console.log('🗣️ Voice message received:', { userId, userType, audioSize: req.file.size, language });

    // Parse dbContext if it's a string
    let parsedDbContext = {};
    try {
      parsedDbContext = typeof dbContext === 'string' ? JSON.parse(dbContext) : (dbContext || {});
    } catch (parseError) {
      console.error('Error parsing dbContext:', parseError);
      parsedDbContext = {};
    }

    // For now, return a placeholder response
    // In a real implementation, you would:
    // 1. Convert audio to text using speech-to-text API (Google Cloud Speech-to-Text, Azure Speech, etc.)
    // 2. Process the transcribed text through the chatbot
    // 3. Convert response back to speech (optional)
    
    const placeholderTranscription = "[Voice message received but transcription not implemented]";
    const placeholderResponse = "Voice message processing is not yet fully implemented. Please send a text message instead.";
    
    res.json({
      success: true,
      response: placeholderResponse,
      transcribedText: placeholderTranscription,
      language: language || 'en',
      actionExecuted: null,
      needsConfirmation: null
    });
  } catch (error) {
    console.error('❌ Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice message: ' + error.message
    });
  }
});

// 📜 Get conversation history
app.get('/api/chatbot/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const history = chatbot.getConversationHistory(userId);
    
    res.json({
      success: true,
      history,
      conversationCount: history.length
    });
  } catch (error) {
    console.error('❌ Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation history: ' + error.message,
      history: []
    });
  }
});

// 🗑️ Clear conversation history
app.delete('/api/chatbot/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const cleared = chatbot.clearConversation(userId);
    
    res.json({
      success: true,
      cleared,
      message: cleared ? 'Conversation history cleared' : 'No conversation found'
    });
  } catch (error) {
    console.error('❌ Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history: ' + error.message
    });
  }
});

// 🌍 Set user language preference
app.put('/api/chatbot/language/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required'
      });
    }

    const updated = chatbot.setLanguage(userId, language);
    
    res.json({
      success: updated,
      language,
      message: updated ? 'Language preference updated' : 'Invalid language or user not found'
    });
  } catch (error) {
    console.error('❌ Set language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set language: ' + error.message
    });
  }
});

// ℹ️ Get session information
app.get('/api/chatbot/session/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const sessionInfo = chatbot.getSessionInfo(userId);
    
    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      session: sessionInfo
    });
  } catch (error) {
    console.error('❌ Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session info: ' + error.message
    });
  }
});

// 🔍 Product search through chatbot
app.post('/api/chatbot/search', async (req, res) => {
  try {
    const { query, language = 'en', userType = 'buyer' } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Get products from database
    const products = await db.getAllProducts();
    const formattedProducts = products.map(p => {
      const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
      
      if (hasNumericKeys) {
        return {
          id: p[0] || `product_${Date.now()}_${Math.random()}`,
          name: p[2] || 'Unknown Product',
          name_en: p[3] || '',
          name_te: p[4] || '',
          name_hi: p[5] || '',
          price: parseFloat(p[10]) || 0,
          stock: parseInt(p[12]) || 0,
          description: p[14] || '',
          image: p[22] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop'
        };
      } else {
        return {
          id: p.get('id') || p.id,
          name: p.get('name') || p.name,
          name_en: p.get('name_en') || p.name_en || '',
          name_te: p.get('name_te') || p.name_te || '',
          name_hi: p.get('name_hi') || p.name_hi || '',
          price: parseFloat(p.get('price') || p.price || 0),
          stock: parseInt(p.get('stock') || p.stock || 0),
          description: p.get('description') || p.description || '',
          image: p.get('image') || p.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop'
        };
      }
    }).filter(p => p.name && p.name !== 'Unknown Product' && p.price > 0);

    // Use chatbot's search functionality
    const searchResults = await chatbot.searchProducts(query, formattedProducts, language);
    
    res.json({
      success: true,
      query,
      language,
      results: searchResults.slice(0, 10), // Limit to 10 results
      totalFound: searchResults.length
    });
  } catch (error) {
    console.error('❌ Chatbot search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products: ' + error.message,
      results: []
    });
  }
});

// 🎯 Get product recommendations
app.post('/api/chatbot/recommendations', async (req, res) => {
  try {
    const { productId, userId, limit = 5 } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Get products from database
    const products = await db.getAllProducts();
    const formattedProducts = products.map(p => {
      const hasNumericKeys = Object.keys(p).every(key => !isNaN(key)) || Array.isArray(p);
      
      if (hasNumericKeys) {
        return {
          id: p[0],
          name: p[2],
          price: parseFloat(p[10]) || 0,
          stock: parseInt(p[12]) || 0
        };
      } else {
        return {
          id: p.get('id') || p.id,
          name: p.get('name') || p.name,
          price: parseFloat(p.get('price') || p.price || 0),
          stock: parseInt(p.get('stock') || p.stock || 0)
        };
      }
    }).filter(p => p.name && p.price > 0 && p.stock > 0);

    // Find the target product
    const targetProduct = formattedProducts.find(p => p.id === productId);
    
    if (!targetProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Generate recommendations
    const recommendations = chatbot.generateRecommendations(targetProduct, formattedProducts, limit);
    
    res.json({
      success: true,
      productId,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('❌ Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations: ' + error.message,
      recommendations: []
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
  console.log(`✅ 🤖 MULTILINGUAL GEMINI CHATBOT + E-COMMERCE API 🌍🛒`);
  console.log(`✅ 🎆 CHATBOT READY! Look for the 🤖 button in your dashboard`);
  console.log(`✅ 🗣️ Supports: English, Hindi, Telugu, Bengali, Marathi, Tamil, Urdu`);
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
  console.log(`
🤖 CHATBOT API ROUTES:`);
  console.log(`   POST /api/chatbot/message - Main chatbot interaction`);
  console.log(`   POST /api/chatbot/voice - Voice message processing`);
  console.log(`   GET  /api/chatbot/history/:userId - Get conversation history`);
  console.log(`   DELETE /api/chatbot/history/:userId - Clear conversation`);
  console.log(`   PUT  /api/chatbot/language/:userId - Set language preference`);
  console.log(`   GET  /api/chatbot/session/:userId - Get session info`);
  console.log(`   POST /api/chatbot/search - Intelligent product search`);
  console.log(`   POST /api/chatbot/recommendations - Product recommendations`);
});

process.on('SIGTERM', () => {
  console.log('👋 Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Server shutting down gracefully');
  process.exit(0);
});