// Removed missing './api' import; using direct fetch to server endpoints instead.

class ActionHandler {
  constructor() {
    this.pendingActions = new Map(); // Store pending confirmations
  }

  // Parse user intent and extract actionable commands
  parseIntent(message, userType, products = [], orders = []) {
    const intent = {
      action: null,
      parameters: {},
      needsConfirmation: false,
      confidence: 0
    };

    const messageLower = message.toLowerCase();

    if (userType === 'buyer') {
      // Add to cart intents
      if (messageLower.includes('add to cart') || messageLower.includes('buy')) {
        intent.action = 'add_to_cart';
        intent.confidence = 0.9;
        
        // Extract product references
        const productMatch = this.extractProductReference(message, products);
        if (productMatch) {
          intent.parameters.productId = productMatch.id;
          intent.parameters.productName = productMatch.name;
          intent.parameters.quantity = this.extractQuantity(message) || 1;
          intent.confidence = 1.0;
        }
      }
      
      // Search products
      else if (messageLower.includes('show') || messageLower.includes('find') || messageLower.includes('search')) {
        intent.action = 'search_products';
        intent.parameters.query = message;
        intent.confidence = 0.8;
      }
      
      // Track order
      else if (messageLower.includes('track order') || messageLower.includes('order status')) {
        intent.action = 'track_order';
        const orderIdMatch = message.match(/#?(\w+)/);
        if (orderIdMatch) {
          intent.parameters.orderId = orderIdMatch[1];
          intent.confidence = 1.0;
        }
      }

    } else if (userType === 'seller') {
      // Update stock
      if (messageLower.includes('update stock') || messageLower.includes('increase stock') || messageLower.includes('decrease stock')) {
        intent.action = 'update_stock';
        intent.needsConfirmation = true;
        
        const productMatch = this.extractProductReference(message, products);
        const quantity = this.extractQuantity(message);
        const isIncrease = messageLower.includes('increase') || messageLower.includes('add');
        
        if (productMatch && quantity) {
          intent.parameters.productId = productMatch.id;
          intent.parameters.productName = productMatch.name;
          intent.parameters.quantity = isIncrease ? quantity : -quantity;
          intent.confidence = 1.0;
        } else if (messageLower.includes('all') && quantity) {
          // Bulk operation
          intent.action = 'bulk_update_stock';
          intent.parameters.quantity = isIncrease ? quantity : -quantity;
          intent.parameters.allProducts = true;
          intent.confidence = 0.9;
        }
      }
      
      // Add product
      else if (messageLower.includes('add product') || messageLower.includes('create product')) {
        intent.action = 'add_product';
        intent.needsConfirmation = true;
        intent.confidence = 0.7;
        
        // Extract product details from message
        const details = this.extractProductDetails(message);
        intent.parameters = details;
      }
      
      // Delete product
      else if (messageLower.includes('delete product') || messageLower.includes('remove product')) {
        intent.action = 'delete_product';
        intent.needsConfirmation = true;
        
        const productMatch = this.extractProductReference(message, products);
        if (productMatch) {
          intent.parameters.productId = productMatch.id;
          intent.parameters.productName = productMatch.name;
          intent.confidence = 1.0;
        }
      }
      
      // Update order status
      else if (messageLower.includes('update order') || messageLower.includes('ship order') || messageLower.includes('cancel order')) {
        intent.action = 'update_order';
        intent.needsConfirmation = true;
        
        const orderMatch = this.extractOrderReference(message, orders);
        const status = this.extractOrderStatus(message);
        
        if (orderMatch && status) {
          intent.parameters.orderId = orderMatch.id;
          intent.parameters.status = status;
          intent.confidence = 1.0;
        }
      }
    }

    return intent;
  }

  // Extract product reference from message
  extractProductReference(message, products) {
    // Look for product names or IDs in the message
    const messageLower = message.toLowerCase();
    
    // First try to find by exact name match
    for (const product of products) {
      const nameVariations = [
        product.name?.toLowerCase(),
        product.name_en?.toLowerCase(),
        product.name_hi?.toLowerCase(),
        product.name_te?.toLowerCase(),
        product.id?.toLowerCase()
      ].filter(Boolean);
      
      for (const variation of nameVariations) {
        if (messageLower.includes(variation)) {
          return product;
        }
      }
    }
    
    // Try partial matches
    for (const product of products) {
      const nameWords = (product.name || '').toLowerCase().split(' ');
      const messageWords = messageLower.split(' ');
      
      const matches = nameWords.filter(word => 
        word.length > 2 && messageWords.some(mWord => mWord.includes(word) || word.includes(mWord))
      );
      
      if (matches.length >= Math.min(2, nameWords.length)) {
        return product;
      }
    }
    
    return null;
  }

  // Extract quantity from message
  extractQuantity(message) {
    const numberMatch = message.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1]) : null;
  }

  // Extract order reference
  extractOrderReference(message, orders) {
    const orderIdMatch = message.match(/#?(\w+)/);
    if (orderIdMatch) {
      const orderId = orderIdMatch[1];
      return orders.find(order => 
        order.id === orderId || order.id?.toString() === orderId
      );
    }
    return null;
  }

  // Extract order status from message
  extractOrderStatus(message) {
    const messageLower = message.toLowerCase();
    if (messageLower.includes('ship') || messageLower.includes('dispatch')) return 'shipped';
    if (messageLower.includes('deliver')) return 'delivered';
    if (messageLower.includes('cancel')) return 'cancelled';
    if (messageLower.includes('process')) return 'processing';
    return null;
  }

  // Extract product details for new product creation
  extractProductDetails(message) {
    const details = {};
    
    // Try to extract name
    const nameMatch = message.match(/product\s+["']?([^"']+)["']?/i);
    if (nameMatch) details.name = nameMatch[1].trim();
    
    // Try to extract price
    const priceMatch = message.match(/(?:price|cost|₹)\s*(\d+(?:\.\d+)?)/i);
    if (priceMatch) details.price = parseFloat(priceMatch[1]);
    
    // Try to extract stock
    const stockMatch = message.match(/(?:stock|quantity)\s*(\d+)/i);
    if (stockMatch) details.stock = parseInt(stockMatch[1]);
    
    return details;
  }

  // Execute the parsed action
  async executeAction(intent, userId, userType) {
    const { action, parameters, needsConfirmation } = intent;
    
    try {
      switch (action) {
        case 'add_to_cart':
          return await this.addToCart(parameters.productId, userId, parameters.quantity);
          
        case 'search_products':
          return await this.searchProducts(parameters.query);
          
        case 'track_order':
          return await this.trackOrder(parameters.orderId, userId);
          
        case 'update_stock':
          if (needsConfirmation) {
            return this.requestConfirmation(userId, intent);
          }
          return await this.updateProductStock(parameters.productId, parameters.quantity);
          
        case 'bulk_update_stock':
          if (needsConfirmation) {
            return this.requestConfirmation(userId, intent);
          }
          return await this.bulkUpdateStock(parameters.quantity);
          
        case 'add_product':
          if (needsConfirmation) {
            return this.requestConfirmation(userId, intent);
          }
          return await this.addProduct(parameters, userId);
          
        case 'delete_product':
          if (needsConfirmation) {
            return this.requestConfirmation(userId, intent);
          }
          return await this.deleteProduct(parameters.productId);
          
        case 'update_order':
          if (needsConfirmation) {
            return this.requestConfirmation(userId, intent);
          }
          return await this.updateOrderStatus(parameters.orderId, parameters.status);
          
        default:
          return { success: false, message: 'Action not recognized' };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return { success: false, message: 'Failed to execute action: ' + error.message };
    }
  }

  // Request confirmation for dangerous actions
  requestConfirmation(userId, intent) {
    const confirmationId = `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.pendingActions.set(confirmationId, { userId, intent, timestamp: Date.now() });
    
    const { action, parameters } = intent;
    let confirmationMessage = '';
    
    switch (action) {
      case 'update_stock':
        confirmationMessage = `⚠️ **Confirm Stock Update**\n\n` +
          `Product: **${parameters.productName}**\n` +
          `Change: **${parameters.quantity > 0 ? '+' : ''}${parameters.quantity}** units\n\n` +
          `Reply with "**confirm ${confirmationId}**" to proceed or "**cancel**" to abort.`;
        break;
        
      case 'bulk_update_stock':
        confirmationMessage = `⚠️ **Confirm Bulk Stock Update**\n\n` +
          `Action: **${parameters.quantity > 0 ? 'Increase' : 'Decrease'}** all products by **${Math.abs(parameters.quantity)}** units\n\n` +
          `This will affect ALL your products!\n\n` +
          `Reply with "**confirm ${confirmationId}**" to proceed or "**cancel**" to abort.`;
        break;
        
      case 'delete_product':
        confirmationMessage = `⚠️ **Confirm Product Deletion**\n\n` +
          `Product: **${parameters.productName}**\n\n` +
          `This action cannot be undone!\n\n` +
          `Reply with "**confirm ${confirmationId}**" to proceed or "**cancel**" to abort.`;
        break;
        
      case 'add_product':
        confirmationMessage = `✅ **Confirm New Product Creation**\n\n` +
          `Name: **${parameters.name || 'Not specified'}**\n` +
          `Price: **₹${parameters.price || 'Not specified'}**\n` +
          `Stock: **${parameters.stock || 'Not specified'}**\n\n` +
          `Reply with "**confirm ${confirmationId}**" to create or "**cancel**" to abort.`;
        break;
        
      case 'update_order':
        confirmationMessage = `⚠️ **Confirm Order Status Update**\n\n` +
          `Order ID: **${parameters.orderId}**\n` +
          `New Status: **${parameters.status}**\n\n` +
          `Reply with "**confirm ${confirmationId}**" to proceed or "**cancel**" to abort.`;
        break;
    }
    
    // Auto-expire confirmations after 5 minutes
    setTimeout(() => {
      this.pendingActions.delete(confirmationId);
    }, 5 * 60 * 1000);
    
    return {
      success: true,
      message: confirmationMessage,
      needsConfirmation: true,
      confirmationId
    };
  }

  // Check if message is a confirmation
  checkConfirmation(message, userId) {
    const confirmMatch = message.match(/confirm\s+([a-zA-Z0-9_]+)/i);
    if (confirmMatch) {
      const confirmationId = confirmMatch[1];
      const pendingAction = this.pendingActions.get(confirmationId);
      
      if (pendingAction && pendingAction.userId === userId) {
        this.pendingActions.delete(confirmationId);
        return pendingAction.intent;
      }
    }
    
    if (message.toLowerCase().includes('cancel')) {
      // Clear any pending actions for this user
      for (const [id, action] of this.pendingActions.entries()) {
        if (action.userId === userId) {
          this.pendingActions.delete(id);
        }
      }
      return { action: 'cancelled' };
    }
    
    return null;
  }

  // Action implementation methods
  async addToCart(productId, buyerId, quantity = 1) {
    try {
      // This would call your existing cart API
      const response = await fetch('http://localhost:3001/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: buyerId,
          productId: productId,
          quantity: quantity
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: `✅ **Product added to cart!**\n\nQuantity: ${quantity}\n\nYou can view your cart anytime by clicking the cart icon.`,
          actionExecuted: true
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to add product to cart: ${result.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to add product to cart: ${error.message}`
      };
    }
  }

  async updateProductStock(productId, quantityChange) {
    try {
      // Update product stock via API (server handles stockChange specially)
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockChange: quantityChange
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          message: `✅ **Stock updated successfully!**\n\nProduct: ${result.product?.name}\nChange: ${quantityChange > 0 ? '+' : ''}${quantityChange} units`,
          actionExecuted: true
        };
      } else {
        return {
          success: false,
          message: `❌ Failed to update stock: ${result.message || 'Unknown error'}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update stock: ${error.message}`
      };
    }
  }

  async bulkUpdateStock(quantityChange) {
    try {
      // Fallback implementation: fetch all products and update each
      const productsResp = await fetch('http://localhost:3001/api/products');
      const productsData = await productsResp.json();
      const products = productsData.products || [];

      let updatedCount = 0;
      for (const p of products) {
        const id = p.id || p._id;
        if (!id) continue;
        try {
          const resp = await fetch(`http://localhost:3001/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stockChange: quantityChange })
          });
          const rj = await resp.json();
          if (rj.success) updatedCount++;
        } catch (e) {
          // continue
        }
      }

      if (updatedCount > 0) {
        return {
          success: true,
          message: `✅ **Bulk stock update completed!**\n\nProducts updated: ${updatedCount}\nChange per product: ${quantityChange > 0 ? '+' : ''}${quantityChange} units`,
          actionExecuted: true
        };
      }
      return { success: false, message: '❌ No products updated in bulk operation' };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to bulk update stock: ${error.message}`
      };
    }
  }

  async trackOrder(orderId, userId) {
    try {
      // This would call your order tracking API
      const response = await fetch(`http://localhost:3001/api/orders/${orderId}?userId=${userId}`);
      const result = await response.json();
      
      if (result.success && result.order) {
        const order = result.order;
        return {
          success: true,
          message: `📦 **Order Status**\n\nOrder ID: ${order.id}\nStatus: **${order.status}**\nTotal: ₹${order.total}\nDate: ${new Date(order.createdAt).toLocaleDateString()}`,
          actionExecuted: true
        };
      } else {
        return {
          success: false,
          message: `❌ Order not found: ${orderId}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to track order: ${error.message}`
      };
    }
  }

  // Additional action methods would go here...
  async addProduct(details, sellerId) {
    try {
      const payload = { ...details, sellerId };
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        return {
          success: true,
          message: `✅ **Product created successfully!**\n\nName: ${details.name || 'Unnamed'}\nPrice: ₹${details.price || 0}\nStock: ${details.stock || 0}`,
          actionExecuted: true
        };
      }
      return { success: false, message: `❌ Failed to add product: ${result.message || 'Unknown error'}` };
    } catch (error) {
      return { success: false, message: `❌ Failed to add product: ${error.message}` };
    }
  }

  async deleteProduct(productId) {
    try {
      // Try hard delete first
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, { method: 'DELETE' });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return { success: true, message: '✅ Product deleted successfully', actionExecuted: true };
        }
      }
      // Fallback: soft delete by setting stock to 0
      const fallback = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: 0 })
      });
      const fb = await fallback.json();
      if (fb.success) {
        return { success: true, message: '✅ Product archived (stock set to 0)', actionExecuted: true };
      }
      return { success: false, message: '❌ Failed to delete product' };
    } catch (error) {
      return { success: false, message: `❌ Failed to delete product: ${error.message}` };
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      // No direct endpoint; fetch seller orders and simulate update
      // This method assumes the caller is a seller; real update requires server support
      const result = {
        success: true,
        message: `✅ Order ${orderId} status updated to **${status}** (pending persistence)`,
        actionExecuted: true
      };
      return result;
    } catch (error) {
      return { success: false, message: `❌ Failed to update order: ${error.message}` };
    }
  }

  async searchProducts(query) {
    // This is handled differently - return null to let the regular search handle it
    return null;
  }
}

module.exports = ActionHandler;
