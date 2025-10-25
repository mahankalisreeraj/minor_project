class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get comprehensive seller analytics
  async getSellerAnalytics(products = [], orders = [], sellerId) {
    const cacheKey = `analytics_${sellerId}_${Date.now() - (Date.now() % this.cacheTimeout)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Filter data for specific seller
      const sellerProducts = products.filter(p => p.sellerId === sellerId);
      const sellerOrders = orders.filter(o => o.sellerId === sellerId);

      const analytics = {
        // Product Analytics
        totalProducts: sellerProducts.length,
        productsInStock: sellerProducts.filter(p => p.stock > 0).length,
        productsOutOfStock: sellerProducts.filter(p => p.stock === 0).length,
        lowStockProducts: sellerProducts.filter(p => p.stock > 0 && p.stock < 10).length,
        
        // Stock Analysis
        totalStockValue: sellerProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
        averageStockPerProduct: sellerProducts.length > 0 ? 
          sellerProducts.reduce((sum, p) => sum + p.stock, 0) / sellerProducts.length : 0,
        
        // Sales Analytics
        totalOrders: sellerOrders.length,
        totalRevenue: sellerOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        averageOrderValue: sellerOrders.length > 0 ? 
          sellerOrders.reduce((sum, o) => sum + (o.total || 0), 0) / sellerOrders.length : 0,
        
        // Order Status Analysis
        ordersByStatus: {
          pending: sellerOrders.filter(o => o.status === 'pending').length,
          processing: sellerOrders.filter(o => o.status === 'processing').length,
          shipped: sellerOrders.filter(o => o.status === 'shipped').length,
          delivered: sellerOrders.filter(o => o.status === 'delivered').length,
          cancelled: sellerOrders.filter(o => o.status === 'cancelled').length
        },

        // Top Products
        topSellingProducts: this.getTopSellingProducts(sellerProducts, 5),
        lowStockAlert: this.getLowStockAlert(sellerProducts),
        
        // Profit Analysis
        estimatedProfit: this.calculateEstimatedProfit(sellerProducts, sellerOrders),
        profitMargin: this.calculateProfitMargin(sellerProducts, sellerOrders),
        
        // Time-based Analytics
        recentOrders: sellerOrders.slice(-10), // Last 10 orders
        
        // Recommendations
        recommendations: this.generateSellerRecommendations(sellerProducts, sellerOrders)
      };

      this.cache.set(cacheKey, analytics);
      return analytics;

    } catch (error) {
      console.error('Error generating analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  // Get top selling products
  getTopSellingProducts(products, limit = 5) {
    return products
      .filter(p => p.sales && p.sales > 0)
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, limit)
      .map(p => ({
        id: p.id,
        name: p.name,
        sales: p.sales || 0,
        revenue: (p.sales || 0) * p.price,
        stock: p.stock
      }));
  }

  // Get low stock alert products
  getLowStockAlert(products) {
    return products
      .filter(p => p.stock > 0 && p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: p.price,
        urgency: p.stock < 3 ? 'critical' : p.stock < 6 ? 'high' : 'medium'
      }));
  }

  // Calculate estimated profit
  calculateEstimatedProfit(products, orders) {
    let totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    let totalCost = 0;
    
    // Estimate cost based on products sold
    orders.forEach(order => {
      // This is a simplified calculation
      // In real implementation, you'd have detailed order items
      const avgCostRatio = this.getAverageCostRatio(products);
      totalCost += (order.total || 0) * avgCostRatio;
    });

    return {
      revenue: totalRevenue,
      estimatedCost: totalCost,
      estimatedProfit: totalRevenue - totalCost,
      profitPercentage: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
    };
  }

  // Calculate profit margin
  calculateProfitMargin(products, orders) {
    if (products.length === 0) return 0;
    
    const avgMargin = products.reduce((sum, p) => {
      const cost = p.cost || (p.price * 0.6); // Assume 60% of price if no cost provided
      const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
      return sum + margin;
    }, 0) / products.length;

    return avgMargin;
  }

  // Get average cost ratio
  getAverageCostRatio(products) {
    if (products.length === 0) return 0.6; // Default 60%
    
    const productsWithCost = products.filter(p => p.cost && p.price);
    if (productsWithCost.length === 0) return 0.6;

    const avgRatio = productsWithCost.reduce((sum, p) => {
      return sum + (p.cost / p.price);
    }, 0) / productsWithCost.length;

    return avgRatio;
  }

  // Generate recommendations for sellers
  generateSellerRecommendations(products, orders) {
    const recommendations = [];

    // Low stock recommendations
    const lowStock = products.filter(p => p.stock < 5 && p.stock > 0);
    if (lowStock.length > 0) {
      recommendations.push({
        type: 'inventory',
        priority: 'high',
        title: 'Restock Low Inventory Items',
        description: `${lowStock.length} products have low stock. Consider restocking soon.`,
        products: lowStock.slice(0, 3).map(p => ({ id: p.id, name: p.name, stock: p.stock }))
      });
    }

    // Out of stock recommendations
    const outOfStock = products.filter(p => p.stock === 0);
    if (outOfStock.length > 0) {
      recommendations.push({
        type: 'inventory',
        priority: 'critical',
        title: 'Out of Stock Products',
        description: `${outOfStock.length} products are out of stock and not generating sales.`,
        products: outOfStock.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
      });
    }

    // Pricing recommendations
    const lowProfitProducts = products.filter(p => {
      const cost = p.cost || (p.price * 0.6);
      const margin = p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0;
      return margin < 20;
    });

    if (lowProfitProducts.length > 0) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Review Product Pricing',
        description: `${lowProfitProducts.length} products have low profit margins. Consider adjusting prices.`,
        products: lowProfitProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price }))
      });
    }

    // Sales performance recommendations
    const noSalesProducts = products.filter(p => !p.sales || p.sales === 0);
    if (noSalesProducts.length > 0) {
      recommendations.push({
        type: 'marketing',
        priority: 'medium',
        title: 'Boost Product Visibility',
        description: `${noSalesProducts.length} products haven't made any sales. Consider improving descriptions or marketing.`,
        products: noSalesProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name }))
      });
    }

    return recommendations;
  }

  // Format analytics for chatbot response
  formatAnalyticsForChatbot(analytics, language = 'en') {
    const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;
    const formatNumber = (num) => num.toLocaleString();

    const summaryText = `📊 **Your Business Analytics**\n\n` +
      `📦 **Products:** ${analytics.totalProducts} total | ${analytics.productsInStock} in stock | ${analytics.productsOutOfStock} out of stock\n` +
      `🚨 **Low Stock:** ${analytics.lowStockProducts} products need restocking\n` +
      `💰 **Revenue:** ${formatCurrency(analytics.totalRevenue)} from ${analytics.totalOrders} orders\n` +
      `📈 **Avg Order Value:** ${formatCurrency(analytics.averageOrderValue)}\n` +
      `💹 **Estimated Profit:** ${formatCurrency(analytics.estimatedProfit.estimatedProfit)} (${analytics.estimatedProfit.profitPercentage.toFixed(1)}%)\n\n`;

    let topProductsText = '';
    if (analytics.topSellingProducts.length > 0) {
      topProductsText = `🏆 **Top Selling Products:**\n` +
        analytics.topSellingProducts.map(p => 
          `• ${p.name}: ${p.sales} sold (${formatCurrency(p.revenue)} revenue)`
        ).join('\n') + '\n\n';
    }

    let lowStockText = '';
    if (analytics.lowStockAlert.length > 0) {
      lowStockText = `⚠️ **Low Stock Alert:**\n` +
        analytics.lowStockAlert.slice(0, 5).map(p => 
          `• ${p.name}: ${p.stock} remaining ${p.urgency === 'critical' ? '🔴' : p.urgency === 'high' ? '🟡' : '🟢'}`
        ).join('\n') + '\n\n';
    }

    let recommendationsText = '';
    if (analytics.recommendations.length > 0) {
      recommendationsText = `💡 **Recommendations:**\n` +
        analytics.recommendations.slice(0, 3).map(r => 
          `• ${r.title}: ${r.description}`
        ).join('\n');
    }

    return summaryText + topProductsText + lowStockText + recommendationsText;
  }

  // Get default analytics when there's an error
  getDefaultAnalytics() {
    return {
      totalProducts: 0,
      productsInStock: 0,
      productsOutOfStock: 0,
      lowStockProducts: 0,
      totalStockValue: 0,
      averageStockPerProduct: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersByStatus: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      },
      topSellingProducts: [],
      lowStockAlert: [],
      estimatedProfit: {
        revenue: 0,
        estimatedCost: 0,
        estimatedProfit: 0,
        profitPercentage: 0
      },
      profitMargin: 0,
      recentOrders: [],
      recommendations: []
    };
  }

  // Bulk operations helper
  generateBulkOperationSuggestions(products, operation, value) {
    const suggestions = [];
    
    switch (operation.toLowerCase()) {
      case 'stock':
      case 'inventory':
        // Suggest stock updates
        const lowStock = products.filter(p => p.stock < 10);
        suggestions.push({
          operation: 'increase_stock',
          description: `Increase stock for ${lowStock.length} low-stock products by ${value || 10} units`,
          products: lowStock.map(p => ({ id: p.id, name: p.name, currentStock: p.stock })),
          impact: `Will help prevent stockouts for popular products`
        });
        break;
        
      case 'price':
      case 'pricing':
        // Suggest price updates
        const candidates = products.filter(p => p.stock > 0);
        suggestions.push({
          operation: 'adjust_prices',
          description: `Adjust prices for ${candidates.length} products by ${value || 5}%`,
          products: candidates.slice(0, 10).map(p => ({ 
            id: p.id, 
            name: p.name, 
            currentPrice: p.price,
            suggestedPrice: p.price * (1 + ((value || 5) / 100))
          })),
          impact: `Potential revenue impact: ${((candidates.reduce((sum, p) => sum + p.price, 0) * (value || 5)) / 100).toFixed(2)}`
        });
        break;
        
      default:
        suggestions.push({
          operation: 'general',
          description: 'Available bulk operations: stock updates, price adjustments, product status changes',
          products: [],
          impact: 'Choose a specific operation for detailed suggestions'
        });
    }

    return suggestions;
  }
}

module.exports = AnalyticsService;
