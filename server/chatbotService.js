const { GoogleGenerativeAI } = require('@google/generative-ai');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const AnalyticsService = require('./analyticsService');
const ActionHandler = require('./actionHandler');

class MultilingualChatbot {
  constructor() {
    // Initialize Gemini if API key is provided; otherwise run in fallback-only mode
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set; Gemini disabled. Using fallback responses only.');
      this.genAI = null;
      this.model = null;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const configuredModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const modelName = configuredModel.endsWith('-latest') 
          ? configuredModel.replace('-latest', '') 
          : configuredModel;
        this.currentModelName = modelName;
        this.fallbackModels = [
          'gemini-1.5-flash-8b',
          'gemini-1.0-pro'
        ];
        this.model = this.genAI.getGenerativeModel({ model: this.currentModelName });
        console.log('✅ Gemini AI initialized successfully with model:', this.currentModelName);
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error.message);
        this.genAI = null;
        this.model = null;
      }
    }
    
    // Cache for sessions and conversation history
    this.sessionCache = new NodeCache({ stdTTL: 3600 }); // 1 hour session timeout
    this.productCache = new NodeCache({ stdTTL: 300 }); // 5 minutes for product data
    
    // Initialize analytics service
    this.analytics = new AnalyticsService();
    
    // Initialize action handler for executable actions
    this.actionHandler = new ActionHandler();
    
    // Error tracking
    this.errorCount = 0;
    this.lastError = null;
    
    // Language mappings
    this.languages = {
      'en': 'English',
      'hi': 'Hindi',
      'te': 'Telugu',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'ur': 'Urdu',
      'auto': 'Auto-detect'
    };

    // Initialize system prompts
    this.initializeSystemPrompts();
  }

  // Attempt generateContent with automatic model fallbacks when v1beta 404 occurs
  async generateContentWithFallback(contents, contextTag = 'general') {
    if (!this.genAI) {
      throw new Error('Gemini not initialized');
    }

    // Build ordered list of models to try
    const modelsToTry = [this.currentModelName, ...this.fallbackModels];

    for (let i = 0; i < modelsToTry.length; i++) {
      const modelName = modelsToTry[i];
      try {
        // Switch model when trying fallbacks
        if (!this.model || this.currentModelName !== modelName) {
          this.model = this.genAI.getGenerativeModel({ model: modelName });
          this.currentModelName = modelName;
          console.log(`🔁 Using model '${modelName}' for ${contextTag}`);
        }

        const result = await this.model.generateContent({ contents });
        return result;
      } catch (error) {
        const message = String(error?.message || error);
        // Only fallback when explicit v1beta model unsupported/404 is detected
        if (message.includes('404 Not Found') && message.includes('is not found for API version v1beta')) {
          console.warn(`⚠️ Model '${modelName}' not supported for v1beta generateContent. Trying next fallback…`);
          continue; // try next model
        }
        // For other errors, rethrow to upper layer
        throw error;
      }
    }

    throw new Error('No supported Gemini model available after fallbacks');
  }

  initializeSystemPrompts() {
    this.systemPrompts = {
      seller: `You are a helpful AI assistant for an e-commerce seller dashboard. You help sellers manage their business efficiently.

FEATURES YOU CAN HELP WITH:
📦 Product Management:
- Add, update, delete products
- Check inventory levels and low-stock alerts
- Update product descriptions, prices, and stock quantities
- Bulk operations like "increase stock of all jackets by 10"

📊 Analytics & Reports:
- Sales reports and revenue trends
- Best-selling products analysis
- Customer insights and order patterns
- Profit margins and cost analysis

📃 Order Management:
- View pending, processing, shipped, delivered, and cancelled orders
- Update order statuses
- Process refunds and returns
- Customer communication

RESPONSE STYLE:
- Be clear, structured, and professional
- Use card-style formatting for product/order listings
- Always ask for confirmation before critical actions (delete, bulk updates)
- Provide quick action options like "✅ Update Stock | ❌ Delete Product"
- Show data in organized tables when appropriate

SAFETY RULES:
- Always confirm before deleting products or making bulk changes
- Validate data before updates
- Ask for missing information when needed
- Be supportive and efficient in communication`,

      buyer: `You are a friendly AI shopping assistant for an e-commerce platform. You help buyers find products, compare options, and make purchases.

FEATURES YOU CAN HELP WITH:
🛍️ Product Discovery:
- Search products by name, category, price range, or rating
- Show product details with images, prices, ratings, and availability
- Filter and sort product results
- Suggest related or recommended products

🔍 Product Comparison:
- Compare multiple products side-by-side
- Show price, rating, stock, and feature comparisons
- Highlight best deals and value options
- Recommend based on user preferences

🛒 Shopping Assistance:
- Add items to cart or wishlist
- Help with checkout process
- Calculate totals, shipping, and taxes
- Apply discounts and coupons

📦 Order Tracking:
- Track orders by order ID
- Show order status and delivery estimates
- Handle order modifications and cancellations

RESPONSE STYLE:
- Be warm, friendly, and enthusiastic
- Use card-style formatting: Name | Price | Rating | Stock/Image
- Provide quick actions: "🛒 Add to Cart | ❤️ Add to Wishlist | 🔍 Compare"
- Show product images and key details prominently
- Be multilingual - respond in user's preferred language

LANGUAGES SUPPORTED:
- English, Hindi, Telugu, Bengali, Marathi, Tamil, Urdu
- Auto-detect user's language from their message
- Maintain conversation context in chosen language`
    };

    this.quickActions = {
      seller: {
        'update_stock': '📦 Update Stock',
        'delete_product': '❌ Delete Product',
        'view_analytics': '📊 View Analytics',
        'check_orders': '📃 Check Orders',
        'add_product': '➕ Add Product',
        'bulk_update': '🔄 Bulk Update'
      },
      buyer: {
        'add_to_cart': '🛒 Add to Cart',
        'add_to_wishlist': '❤️ Add to Wishlist',
        'compare_products': '🔍 Compare',
        'view_details': '📋 View Details',
        'track_order': '📦 Track Order',
        'checkout': '💳 Checkout'
      }
    };
  }

  // Detect language from user input
  detectLanguage(text) {
    const patterns = {
      'hi': /[\u0900-\u097F]/,  // Devanagari script (Hindi)
      'te': /[\u0C00-\u0C7F]/,  // Telugu script
      'bn': /[\u0980-\u09FF]/,  // Bengali script
      'mr': /[\u0900-\u097F]/,  // Marathi (also Devanagari)
      'ta': /[\u0B80-\u0BFF]/,  // Tamil script
      'ur': /[\u0600-\u06FF]/   // Arabic script (Urdu)
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    return 'en'; // Default to English
  }

  // Create or get user session
  getSession(userId, userType = 'buyer') {
    let session = this.sessionCache.get(userId);
    if (!session) {
      session = {
        id: uuidv4(),
        userId,
        userType,
        language: 'en',
        conversationHistory: [],
        context: {
          currentProducts: [],
          cart: [],
          lastQuery: '',
          preferences: {}
        },
        createdAt: new Date()
      };
      this.sessionCache.set(userId, session);
    }
    return session;
  }

  // Format product for display
  formatProduct(product, language = 'en', userType = 'buyer') {
    const name = product[`name_${language}`] || product.name || 'Unknown Product';
    const description = product[`description_${language}`] || product.description || '';
    
    if (userType === 'seller') {
      return `📦 **${name}**\n` +
             `💰 Price: ₹${product.price} | Cost: ₹${product.cost || 0}\n` +
             `📊 Stock: ${product.stock} | Sales: ${product.sales || 0}\n` +
             `🆔 ID: ${product.id}\n` +
             `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n`;
    } else {
      const rating = product.rating || (4 + Math.random()).toFixed(1);
      return `🛍️ **${name}**\n` +
             `💰 ₹${product.price} ${product.originalPrice ? `~~₹${product.originalPrice}~~` : ''}\n` +
             `⭐ ${rating}/5 | 📦 Stock: ${product.stock > 0 ? '✅ Available' : '❌ Out of Stock'}\n` +
             `🆔 ${product.id}\n` +
             `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n`;
    }
  }

  // Format response with quick actions
  formatResponseWithActions(response, actions, userType) {
    const quickActions = this.quickActions[userType] || {};
    const actionButtons = actions.map(action => quickActions[action] || action).join(' | ');
    
    return response + (actions.length > 0 ? `\n\n**Quick Actions:** ${actionButtons}` : '');
  }

  // Search products with intelligent matching
  async searchProducts(query, products, language = 'en') {
    if (!query || !products) return [];

    const queryLower = query.toLowerCase();
    const searchResults = products.filter(product => {
      // Search in multiple fields and languages
      const searchFields = [
        product.name,
        product[`name_${language}`],
        product.description,
        product[`description_${language}`],
        product.id,
        product.sellerId
      ];

      return searchFields.some(field => 
        field && field.toLowerCase().includes(queryLower)
      );
    });

    // Sort by relevance (name matches first, then description)
    return searchResults.sort((a, b) => {
      const aName = (a[`name_${language}`] || a.name || '').toLowerCase();
      const bName = (b[`name_${language}`] || b.name || '').toLowerCase();
      
      const aNameMatch = aName.includes(queryLower);
      const bNameMatch = bName.includes(queryLower);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
  }

  // Generate product recommendations
  generateRecommendations(product, allProducts, limit = 3) {
    if (!product || !allProducts) return [];

    // Simple recommendation based on price range and category similarity
    const priceRange = product.price * 0.3; // 30% price tolerance
    const minPrice = product.price - priceRange;
    const maxPrice = product.price + priceRange;

    return allProducts
      .filter(p => 
        p.id !== product.id && 
        p.price >= minPrice && 
        p.price <= maxPrice &&
        p.stock > 0
      )
      .sort(() => 0.5 - Math.random()) // Random shuffle
      .slice(0, limit);
  }

  // Process seller queries with enhanced analytics
  async processSellQuery(message, session, dbContext) {
    const { products = [], orders = [] } = dbContext;
    
    try {
      // Check if the user is asking for analytics
      if (this.isAnalyticsQuery(message)) {
        return await this.processAnalyticsQuery(message, session, products, orders);
      }
      
      // Check if the user is asking about bulk operations
      if (this.isBulkOperationQuery(message)) {
        return await this.processBulkOperationQuery(message, products);
      }
      
      // Enhanced context for seller with analytics data
      const analytics = await this.analytics.getSellerAnalytics(products, orders, session.userId);
      
      const contextMessage = `Current seller context:
- Total products: ${products.length}
- Products in stock: ${analytics.productsInStock} | Out of stock: ${analytics.productsOutOfStock}
- Low stock alerts: ${analytics.lowStockProducts} products need attention
- Total orders: ${orders.length} | Pending: ${analytics.ordersByStatus.pending}
- Revenue: ₹${analytics.totalRevenue.toFixed(2)} | Avg order: ₹${analytics.averageOrderValue.toFixed(2)}
- Profit margin: ${analytics.profitMargin.toFixed(1)}%

User message: "${message}"

Provide a helpful, data-driven response for the seller. Use the analytics data when relevant.`;

      // If model is unavailable, return a structured fallback response
      if (!this.model) {
        return this.getFallbackSellerResponse(message, products, orders);
      }

      const sellContents = [
        {
          role: 'user',
          parts: [
            { text: `${this.systemPrompts.seller}\n\n${contextMessage}` }
          ]
        }
      ];
      const result = await this.generateContentWithFallback(sellContents, 'processSellQuery');

      const response = result.response.text();

      // Add relevant quick actions based on query content
      const actions = this.determineQuickActions(message, 'seller');
      
      // Add recommendations if relevant
      if (analytics.recommendations.length > 0 && this.shouldShowRecommendations(message)) {
        response += this.formatRecommendations(analytics.recommendations);
      }

      return this.formatResponseWithActions(response, actions, 'seller');
      
    } catch (error) {
      this.handleError(error, 'processSellQuery');
      return this.getFallbackSellerResponse(message, products, orders);
    }
  }

  // Process buyer queries
  async processBuyerQuery(message, session, dbContext) {
    const { products = [] } = dbContext;
    const language = session.language;

    // Check if user is searching for products
    if (message.toLowerCase().includes('search') || 
        message.toLowerCase().includes('find') ||
        message.toLowerCase().includes('show') ||
        message.includes('?')) {
      
      const searchResults = await this.searchProducts(message, products, language);
      
      if (searchResults.length > 0) {
        const formattedProducts = searchResults.slice(0, 5).map(product => 
          this.formatProduct(product, language, 'buyer')
        ).join('\n---\n');

        const recommendations = this.generateRecommendations(searchResults[0], products);
        const recText = recommendations.length > 0 ? 
          `\n\n**You might also like:**\n${recommendations.map(p => this.formatProduct(p, language, 'buyer')).join('\n')}` : '';

        return this.formatResponseWithActions(
          `Found ${searchResults.length} products:\n\n${formattedProducts}${recText}`,
          ['add_to_cart', 'compare_products', 'view_details'],
          'buyer'
        );
      }
    }

    // Enhanced context for buyer
    const contextMessage = `Available products context:
- Total products available: ${products.length}
- Products in stock: ${products.filter(p => p.stock > 0).length}
- Price range: ₹${Math.min(...products.map(p => p.price))} - ₹${Math.max(...products.map(p => p.price))}

User language preference: ${language}
User message: "${message}"

Provide a helpful, friendly response for the buyer. If they're looking for products, help them find what they need. Always be encouraging and supportive in your tone.`;

    try {
      // If model is unavailable, return a structured fallback response
      if (!this.model) {
        return this.getFallbackBuyerResponse(message, products);
      }

      const buyerContents = [
        {
          role: 'user',
          parts: [
            { text: `${this.systemPrompts.buyer}\n\n${contextMessage}` }
          ]
        }
      ];
      const result = await this.generateContentWithFallback(buyerContents, 'processBuyerQuery');

      const response = result.response.text();

      // Add relevant quick actions
      const actions = [];
      if (message.toLowerCase().includes('cart')) actions.push('add_to_cart');
      if (message.toLowerCase().includes('compare')) actions.push('compare_products');
      if (message.toLowerCase().includes('track') || message.toLowerCase().includes('order')) actions.push('track_order');
      if (message.toLowerCase().includes('buy') || message.toLowerCase().includes('purchase')) actions.push('checkout');

      return this.formatResponseWithActions(response, actions, 'buyer');
    } catch (error) {
      this.handleError(error, 'processBuyerQuery');
      return this.getFallbackBuyerResponse(message, products);
    }
  }

  // Main chat processing function
  async processMessage(userId, message, userType = 'buyer', dbContext = {}) {
    try {
      // Get or create session
      const session = this.getSession(userId, userType);
      
      // Detect language if not set
      if (session.language === 'en') {
        session.language = this.detectLanguage(message);
      }

      // Add message to conversation history
      session.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
        language: session.language
      });

      // 🚀 NEW: Check for confirmation messages first
      const confirmationResult = this.actionHandler.checkConfirmation(message, userId);
      if (confirmationResult) {
        if (confirmationResult.action === 'cancelled') {
          const response = '✅ Action cancelled. How else can I help you?';
          session.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            language: session.language
          });
          this.sessionCache.set(userId, session);
          return {
            success: true,
            response,
            sessionId: session.id,
            language: session.language,
            userType: session.userType,
            conversationId: session.conversationHistory.length
          };
        } else {
          // Execute the confirmed action
          const actionResult = await this.actionHandler.executeAction(confirmationResult, userId, userType);
          const response = actionResult.message || 'Action completed.';
          session.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            language: session.language
          });
          this.sessionCache.set(userId, session);
          return {
            success: true,
            response,
            sessionId: session.id,
            language: session.language,
            userType: session.userType,
            conversationId: session.conversationHistory.length,
            actionExecuted: actionResult.actionExecuted
          };
        }
      }

      // 🚀 NEW: Check for actionable commands
      const intent = this.actionHandler.parseIntent(message, userType, dbContext.products || [], dbContext.orders || []);
      
      if (intent.action && intent.confidence > 0.7) {
        console.log('🎯 Detected actionable intent:', intent);
        const actionResult = await this.actionHandler.executeAction(intent, userId, userType);
        
        if (actionResult.success) {
          const response = actionResult.message;
          session.conversationHistory.push({
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            language: session.language
          });
          this.sessionCache.set(userId, session);
          return {
            success: true,
            response,
            sessionId: session.id,
            language: session.language,
            userType: session.userType,
            conversationId: session.conversationHistory.length,
            actionExecuted: actionResult.actionExecuted,
            needsConfirmation: actionResult.needsConfirmation
          };
        }
      }

      // Process based on user type (existing conversational AI)
      let response;
      if (userType === 'seller') {
        response = await this.processSellQuery(message, session, dbContext);
      } else {
        response = await this.processBuyerQuery(message, session, dbContext);
      }

      // Add response to conversation history
      session.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        language: session.language
      });

      // Update session cache
      this.sessionCache.set(userId, session);
      return {
        success: true,
        response,
        sessionId: session.id,
        language: session.language,
        userType: session.userType,
        conversationId: session.conversationHistory.length
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        success: false,
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        error: error.message
      };
    }
  }

  // Get conversation history
  getConversationHistory(userId) {
    const session = this.sessionCache.get(userId);
    return session ? session.conversationHistory : [];
  }

  // Clear conversation history
  clearConversation(userId) {
    const session = this.sessionCache.get(userId);
    if (session) {
      session.conversationHistory = [];
      this.sessionCache.set(userId, session);
      return true;
    }
    return false;
  }

  // Set user language preference
  setLanguage(userId, language) {
    const session = this.sessionCache.get(userId);
    if (session && this.languages[language]) {
      session.language = language;
      this.sessionCache.set(userId, session);
      return true;
    }
    return false;
  }

  // Get session info
  getSessionInfo(userId) {
    const session = this.sessionCache.get(userId);
    if (!session) return null;

    return {
      sessionId: session.id,
      userId: session.userId,
      userType: session.userType,
      language: session.language,
      conversationCount: session.conversationHistory.length,
      createdAt: session.createdAt,
      lastActivity: session.conversationHistory.length > 0 ? 
        session.conversationHistory[session.conversationHistory.length - 1].timestamp : 
        session.createdAt
    };
  }

  // Helper methods for enhanced functionality
  
  // Check if query is asking for analytics
  isAnalyticsQuery(message) {
    const analyticsKeywords = [
      'analytics', 'report', 'sales', 'revenue', 'profit', 'performance', 
      'dashboard', 'insights', 'statistics', 'metrics', 'overview'
    ];
    return analyticsKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }
  
  // Check if query is about bulk operations
  isBulkOperationQuery(message) {
    const bulkKeywords = [
      'bulk', 'all products', 'increase stock', 'decrease stock', 
      'update all', 'change all', 'batch update'
    ];
    return bulkKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }
  
  // Process analytics-specific queries
  async processAnalyticsQuery(message, session, products, orders) {
    try {
      const analytics = await this.analytics.getSellerAnalytics(products, orders, session.userId);
      const formattedAnalytics = this.analytics.formatAnalyticsForChatbot(analytics, session.language);
      
      return this.formatResponseWithActions(
        formattedAnalytics,
        ['view_analytics', 'check_orders', 'update_stock'],
        'seller'
      );
    } catch (error) {
      this.handleError(error, 'processAnalyticsQuery');
      return 'I\'m having trouble generating your analytics report. Please try again in a moment.';
    }
  }
  
  // Process bulk operation queries
  async processBulkOperationQuery(message, products) {
    try {
      // Extract operation type and value from message
      let operation = 'general';
      let value = null;
      
      if (message.toLowerCase().includes('stock')) {
        operation = 'stock';
        const numberMatch = message.match(/\d+/);
        value = numberMatch ? parseInt(numberMatch[0]) : 10;
      } else if (message.toLowerCase().includes('price')) {
        operation = 'price';
        const numberMatch = message.match(/\d+/);
        value = numberMatch ? parseInt(numberMatch[0]) : 5;
      }
      
      const suggestions = this.analytics.generateBulkOperationSuggestions(products, operation, value);
      
      let response = `🔄 **Bulk Operation Suggestions:**\n\n`;
      
      suggestions.forEach(suggestion => {
        response += `**${suggestion.operation.replace('_', ' ').toUpperCase()}:**\n`;
        response += `${suggestion.description}\n`;
        response += `Impact: ${suggestion.impact}\n\n`;
        
        if (suggestion.products.length > 0) {
          response += `**Affected Products (first 3):**\n`;
          suggestion.products.slice(0, 3).forEach(p => {
            response += `• ${p.name} - Current: ${p.currentStock || p.currentPrice || 'N/A'}\n`;
          });
          response += '\n';
        }
      });
      
      response += '⚠️ **Please confirm before proceeding with bulk operations!**';
      
      return this.formatResponseWithActions(response, ['bulk_update'], 'seller');
    } catch (error) {
      this.handleError(error, 'processBulkOperationQuery');
      return 'I\'m having trouble processing your bulk operation request. Please try again.';
    }
  }
  
  // Determine appropriate quick actions based on message content
  determineQuickActions(message, userType) {
    const actions = [];
    const messageLower = message.toLowerCase();
    
    if (userType === 'seller') {
      if (messageLower.includes('stock')) actions.push('update_stock');
      if (messageLower.includes('delete')) actions.push('delete_product');
      if (messageLower.includes('analytic') || messageLower.includes('report')) actions.push('view_analytics');
      if (messageLower.includes('order')) actions.push('check_orders');
      if (messageLower.includes('add') && messageLower.includes('product')) actions.push('add_product');
      if (messageLower.includes('bulk')) actions.push('bulk_update');
    } else {
      if (messageLower.includes('cart')) actions.push('add_to_cart');
      if (messageLower.includes('compare')) actions.push('compare_products');
      if (messageLower.includes('track') || messageLower.includes('order')) actions.push('track_order');
      if (messageLower.includes('buy') || messageLower.includes('purchase')) actions.push('checkout');
      if (messageLower.includes('wishlist')) actions.push('add_to_wishlist');
    }
    
    return actions;
  }
  
  // Check if recommendations should be shown
  shouldShowRecommendations(message) {
    const recommendationTriggers = [
      'recommend', 'suggest', 'advice', 'what should', 'help me', 'improve'
    ];
    return recommendationTriggers.some(trigger => 
      message.toLowerCase().includes(trigger)
    );
  }
  
  // Format recommendations for display
  formatRecommendations(recommendations) {
    if (recommendations.length === 0) return '';
    
    let text = '\n\n💡 **Smart Recommendations:**\n';
    
    recommendations.slice(0, 3).forEach((rec, index) => {
      const priority = rec.priority === 'critical' ? '🔴' : 
                      rec.priority === 'high' ? '🟡' : '🟢';
      text += `${index + 1}. ${priority} **${rec.title}**\n`;
      text += `   ${rec.description}\n`;
    });
    
    return text;
  }
  
  // Error handling
  handleError(error, context = 'unknown') {
    this.errorCount++;
    this.lastError = { error: error.message, context, timestamp: new Date() };
    console.error(`❌ Chatbot error in ${context}:`, error.message);
    
    // Log to external service if needed
    if (this.errorCount > 10) {
      console.warn('⚠️ High error count detected in chatbot service');
    }
  }
  
  // Fallback responses when main processing fails
  getFallbackSellerResponse(message, products, orders) {
    const lowStock = products.filter(p => p.stock < 10);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    return `I\'m experiencing some technical difficulties, but here\'s what I can tell you:\n\n` +
           `📦 You have ${products.length} products total\n` +
           `⚠️ ${lowStock.length} products have low stock\n` +
           `📃 ${orders.length} total orders\n` +
           `💰 Total revenue: ₹${totalRevenue.toFixed(2)}\n\n` +
           `Please try your question again in a moment, or be more specific about what you need help with.`;
  }
  
  getFallbackBuyerResponse(message, products) {
    const inStockProducts = products.filter(p => p.stock > 0);
    
    return `I\'m having some technical difficulties, but I can help you!\n\n` +
           `🛍️ We have ${inStockProducts.length} products available\n` +
           `💰 Price range: ₹${Math.min(...products.map(p => p.price))} - ₹${Math.max(...products.map(p => p.price))}\n\n` +
           `Please try your question again, or let me know if you\'re looking for something specific!`;
  }
  
  // Health check method
  getHealthStatus() {
    return {
      status: 'healthy',
      activeSessions: this.sessionCache.keys().length,
      errorCount: this.errorCount,
      lastError: this.lastError,
      cacheSize: {
        sessions: this.sessionCache.keys().length,
        products: this.productCache.keys().length
      },
      uptime: process.uptime()
    };
  }
}

module.exports = MultilingualChatbot;
