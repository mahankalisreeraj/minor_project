const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('🔧 API Service initialized with base URL:', API_BASE_URL);

class ApiService {

  static async makeRequest(url, options = {}) {
    try {
      console.log('🌐 Making API request to:', url);
      console.log('🌐 Request method:', options.method || 'GET');
      console.log('🌐 Request body:', options.body);

      let body = options.body;
      if (body && typeof body === 'object') {
        body = JSON.stringify(body);
      }

      const requestOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
      };

      if (body) {
        requestOptions.body = body;
      }

      console.log('📤 Request options:', { ...requestOptions, body: body ? 'JSON data' : 'no body' });

      const response = await fetch(url, requestOptions);
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);
      return result;
    } catch (error) {
      console.error('❌ API Request Failed:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Connection failed. Please check if the server is running on http://localhost:3001');
      }
      throw error;
    }
  }

  // AUTH METHODS
  static async login(userData) {
    try {
      console.log('🔐 Login API call with data:', userData);
      return await this.makeRequest(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        body: userData,
      });
    } catch (error) {
      console.error('❌ Login API error:', error);
      throw error;
    }
  }

  static async signup(userData) {
    try {
      console.log('📝 Signup API call with data:', userData);
      return await this.makeRequest(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        body: userData,
      });
    } catch (error) {
      console.error('❌ Signup API error:', error);
      throw error;
    }
  }

  // ENHANCED PRODUCT METHODS - Updated for multilingual support
  static async getAllProducts() {
    try {
      console.log('🛍️ GetAllProducts API call - Fetching multilingual data');
      const result = await this.makeRequest(`${API_BASE_URL}/products`);
      if (result.success && result.products && result.products.length > 0) {
        console.log('📊 Products received:', result.products.length);
        // Log first product to verify multilingual fields
        console.log('🔍 Sample product structure:', {
          id: result.products[0]?.id,
          name: result.products[0]?.name,
          name_en: result.products[0]?.name_en,
          name_te: result.products[0]?.name_te,
          name_hi: result.products[0]?.name_hi,
          name_bn: result.products[0]?.name_bn,
          name_mr: result.products[0]?.name_mr,
          name_ta: result.products[0]?.name_ta,
          name_ur: result.products[0]?.name_ur,
          description: result.products[0]?.description,
          description_en: result.products[0]?.description_en,
          description_te: result.products[0]?.description_te,
          // ... other fields
          availableFields: Object.keys(result.products[0] || {})
        });

        // Verify multilingual fields exist
        const hasMultilingualFields = result.products.some(product =>
          product.name_en || product.name_te || product.name_hi ||
          product.description_en || product.description_te || product.description_hi
        );

        if (hasMultilingualFields) {
          console.log('✅ Multilingual fields detected in products');
        } else {
          console.log('⚠️ No multilingual fields found - check your Google Sheets columns');
        }
      }
      return result;
    } catch (error) {
      console.error('❌ GetAllProducts API error:', error);
      return { success: false, products: [] };
    }
  }

  // ✅ MISSING METHOD 1: Get products by seller ID
  static async getProductsBySeller(sellerId) {
    try {
      console.log('🏪 GetProductsBySeller API call for seller:', sellerId);
      
      if (!sellerId) {
        throw new Error('sellerId is required');
      }

      // Using the existing GET /api/products endpoint with seller filter
      const result = await this.makeRequest(`${API_BASE_URL}/products?sellerId=${sellerId}`);
      
      if (result.success && result.products) {
        console.log('📊 Seller products received:', result.products.length);
        return {
          success: true,
          products: result.products
        };
      }
      
      return {
        success: false,
        products: [],
        error: 'No products found for this seller'
      };
    } catch (error) {
      console.error('❌ GetProductsBySeller API error:', error);
      return {
        success: false,
        products: [],
        error: error.message
      };
    }
  }

  // ✅ MISSING METHOD 2: Create/Add a new product
  static async createProduct(productData) {
    try {
      console.log('➕ CreateProduct API call with data:', productData);
      
      if (!productData) {
        throw new Error('productData is required');
      }

      // Validate required fields
      const requiredFields = ['name', 'price', 'sellerId'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const result = await this.makeRequest(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: productData,
      });

      console.log('✅ Product created successfully:', result);
      return {
        success: true,
        product: result.product || result,
        message: result.message || 'Product created successfully'
      };
    } catch (error) {
      console.error('❌ CreateProduct API error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create product'
      };
    }
  }

  // ✅ MISSING METHOD 3: Get orders by seller ID
  static async getOrdersBySeller(sellerId) {
    try {
      console.log('📦 GetOrdersBySeller API call for seller:', sellerId);
      
      if (!sellerId) {
        throw new Error('sellerId is required');
      }

      const result = await this.makeRequest(`${API_BASE_URL}/orders/seller/${sellerId}`);
      
      if (result.success && result.orders) {
        console.log('📊 Seller orders received:', result.orders.length);
        return {
          success: true,
          orders: result.orders
        };
      }
      
      return {
        success: false,
        orders: [],
        error: 'No orders found for this seller'
      };
    } catch (error) {
      console.error('❌ GetOrdersBySeller API error:', error);
      return {
        success: false,
        orders: [],
        error: error.message
      };
    }
  }

  // ✅ ADDITIONAL METHOD: Update existing product
  static async updateProduct(productId, productData) {
    try {
      console.log('🔄 UpdateProduct API call:', { productId, productData });
      
      if (!productId) {
        throw new Error('productId is required');
      }

      const result = await this.makeRequest(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        body: productData,
      });

      return {
        success: true,
        product: result.product || result,
        message: result.message || 'Product updated successfully'
      };
    } catch (error) {
      console.error('❌ UpdateProduct API error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update product'
      };
    }
  }

  // ✅ ADDITIONAL METHOD: Delete product
  static async deleteProduct(productId) {
    try {
      console.log('🗑️ DeleteProduct API call:', productId);
      
      if (!productId) {
        throw new Error('productId is required');
      }

      const result = await this.makeRequest(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: result.message || 'Product deleted successfully'
      };
    } catch (error) {
      console.error('❌ DeleteProduct API error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete product'
      };
    }
  }

  // CART METHODS
  static async addToCart(buyerId, productId, quantity) {
    try {
      console.log('🛒 AddToCart API call started');
      console.log('🛒 Parameters:', { buyerId, productId, quantity });
      console.log('🛒 API Base URL:', API_BASE_URL);
      
      if (!buyerId) {
        throw new Error('buyerId is required and cannot be empty');
      }
      if (!productId) {
        throw new Error('productId is required and cannot be empty');
      }
      if (!quantity) {
        throw new Error('quantity is required and cannot be empty');
      }
      
      const requestData = {
        buyerId: buyerId.toString(),
        productId: productId.toString(),
        quantity: parseInt(quantity) || 1
      };
      
      console.log('🛒 Request data prepared:', requestData);
      console.log('🛒 Full URL:', `${API_BASE_URL}/cart`);
      
      const result = await this.makeRequest(`${API_BASE_URL}/cart`, {
        method: 'POST',
        body: requestData,
      });
      
      console.log('🛒 AddToCart completed successfully:', result);
      return result;
      
    } catch (error) {
      console.error('❌ AddToCart API error:', error);
      throw error;
    }
  }

  static async getCartItems(buyerId) {
    try {
      console.log('📦 GetCartItems API call for buyer:', buyerId);
      const result = await this.makeRequest(`${API_BASE_URL}/cart/${buyerId}`);
      console.log('📦 Cart items received:', result.items?.length);
      
      // Filter out any items without a valid product
      const validItems = (result.items || []).filter(item => {
        if (!item.product || typeof item.product.id === 'undefined') {
          console.warn('❌ Skipping cart item missing product.id:', item);
          return false;
        }
        return true;
      });

      console.log('📦 Valid cart items after filtering:', validItems.length);
      if (validItems.length > 0) {
        const sample = validItems[0];
        console.log('🔍 Sample valid cart item product:', sample.product.id, sample.product.name);
      }

      return { success: result.success, items: validItems };
    } catch (error) {
      console.error('❌ GetCartItems API error:', error);
      return { success: false, items: [] };
    }
  }

  static async updateCartItem(cartId, quantity) {
    try {
      console.log('🔄 UpdateCartItem API call:', { cartId, quantity });
      return await this.makeRequest(`${API_BASE_URL}/cart/${cartId}`, {
        method: 'PUT',
        body: { quantity },
      });
    } catch (error) {
      console.error('❌ UpdateCartItem API error:', error);
      throw error;
    }
  }

  static async removeFromCart(cartId) {
    try {
      console.log('🗑️ RemoveFromCart API call:', cartId);
      return await this.makeRequest(`${API_BASE_URL}/cart/${cartId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('❌ RemoveFromCart API error:', error);
      throw error;
    }
  }

  // ORDER METHODS
  static async createOrder(orderData) {
    try {
      console.log('📋 CreateOrder API call:', orderData);
      return await this.makeRequest(`${API_BASE_URL}/orders`, {
        method: 'POST',
        body: orderData,
      });
    } catch (error) {
      console.error('❌ CreateOrder API error:', error);
      throw error;
    }
  }

  static async updateOrderStatus(orderId, status) {
    try {
      console.log('🔄 UpdateOrderStatus API call:', { orderId, status });
      return await this.makeRequest(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status },
      });
    } catch (error) {
      console.error('❌ UpdateOrderStatus API error:', error);
      throw error;
    }
  }

  // ✅ ADDITIONAL METHOD: Get orders by buyer ID
  static async getOrdersByBuyer(buyerId) {
    try {
      console.log('📦 GetOrdersByBuyer API call for buyer:', buyerId);
      
      if (!buyerId) {
        throw new Error('buyerId is required');
      }

      const result = await this.makeRequest(`${API_BASE_URL}/orders/buyer/${buyerId}`);
      
      return {
        success: true,
        orders: result.orders || []
      };
    } catch (error) {
      console.error('❌ GetOrdersByBuyer API error:', error);
      return {
        success: false,
        orders: [],
        error: error.message
      };
    }
  }

  // REVIEW METHODS
  static async getProductReviews(productId) {
    try {
      if (!productId) throw new Error('productId is required');
      return await this.makeRequest(`${API_BASE_URL}/products/${productId}/reviews`);
    } catch (error) {
      console.error('❌ GetProductReviews API error:', error);
      return { success: false, reviews: [] };
    }
  }

  static async addProductReview(productId, { buyerId, rating, comment }) {
    try {
      if (!productId) throw new Error('productId is required');
      if (!buyerId) throw new Error('buyerId is required');
      if (!rating) throw new Error('rating is required');
      return await this.makeRequest(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        body: { buyerId, rating, comment }
      });
    } catch (error) {
      console.error('❌ AddProductReview API error:', error);
      return { success: false, message: error.message };
    }
  }

  // UTILITY METHODS for multilingual support
  static validateMultilingualData(products) {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return { valid: false, message: 'No products provided' };
    }

    const requiredLanguageFields = [
      'name_en', 'name_te', 'name_hi', 'name_bn', 'name_mr', 'name_ta', 'name_ur',
      'description_en', 'description_te', 'description_hi', 'description_bn', 'description_mr', 'description_ta', 'description_ur'
    ];

    const sampleProduct = products[0];
    const availableFields = Object.keys(sampleProduct);
    const missingFields = requiredLanguageFields.filter(field => !availableFields.includes(field));
    const presentFields = requiredLanguageFields.filter(field => availableFields.includes(field));

    console.log('🔍 Multilingual validation results:');
    console.log(' - Total products:', products.length);
    console.log(' - Available fields:', availableFields);
    console.log(' - Present language fields:', presentFields);
    console.log(' - Missing language fields:', missingFields);

    return {
      valid: presentFields.length > 0,
      totalProducts: products.length,
      availableFields,
      presentLanguageFields: presentFields,
      missingLanguageFields: missingFields,
      message: presentFields.length > 0
        ? `Found ${presentFields.length} language fields`
        : 'No language-specific fields found'
    };
  }
}

// Debug: Verify the class and methods are properly defined
console.log('🔍 ApiService class created:', ApiService);
console.log('🔍 Available methods:', Object.getOwnPropertyNames(ApiService));
console.log('🔍 addToCart method exists:', typeof ApiService.addToCart === 'function');
console.log('🔍 getProductsBySeller method exists:', typeof ApiService.getProductsBySeller === 'function');
console.log('🔍 createProduct method exists:', typeof ApiService.createProduct === 'function');
console.log('🔍 getOrdersBySeller method exists:', typeof ApiService.getOrdersBySeller === 'function');
console.log('🔍 Enhanced for multilingual support ✅');

export default ApiService;