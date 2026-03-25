import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import ProductManagement from './ProductManagement';
import Analytics from './Analytics';
import OrderManagement from './OrderManagement';
import LowStockManagement from './LowStockManagement';
import Chatbot from './Chatbot';
import './SellerDashboard.css'; // ✅ Make sure this file exists
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const SellerDashboard = ({ user, onLogout, darkMode, toggleDarkMode }) => {
  const { t } = useTranslation();
  console.log('🏦 SellerDashboard component initialized with user:', user);
  
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  });
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setSelectedLanguage(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);
  const [showFooter, setShowFooter] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      console.log('🔄 loadProducts called for user:', user.id);
      const ApiService = (await import('../services/api')).default;
      console.log('📡 Calling getProductsBySeller with user.id:', user.id);
      const response = await ApiService.getProductsBySeller(user.id);
      console.log('📊 getProductsBySeller response:', response);
      
      if (response.success) {
        console.log('✅ Products loaded successfully:', response.products?.length, 'products');
        setProducts(response.products);
        // Don't call updateStats here to avoid circular dependencies
      } else {
        console.error('❌ getProductsBySeller failed:', response);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
    }
  }, [user.id]); // Removed 'orders' dependency to prevent infinite loop

  const loadOrders = useCallback(async () => {
    try {
      console.log('🔄 loadOrders called for user:', user.id);
      const ApiService = (await import('../services/api')).default;
      console.log('📡 Calling getOrdersBySeller with user.id:', user.id);
      const response = await ApiService.getOrdersBySeller(user.id);
      console.log('📊 getOrdersBySeller response:', response);
      
      if (response.success) {
        console.log('✅ Orders loaded successfully:', response.orders?.length, 'orders');
        setOrders(response.orders);
        // Don't call updateStats here to avoid circular dependencies
      } else {
        console.error('❌ getOrdersBySeller failed:', response);
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
    }
  }, [user.id]); // Removed 'products' dependency to prevent infinite loop

  const loadSellerData = useCallback(async () => {
    try {
      console.log('🚀 loadSellerData started for user:', user.id);
      setLoading(true);
      
      console.log('🔄 Loading products and orders in parallel...');
      await Promise.all([
        loadProducts(),
        loadOrders()
      ]);
      console.log('✅ Both products and orders loading completed');
    } catch (error) {
      console.error('❌ Error loading seller data:', error);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  }, [loadProducts, loadOrders]); // Removed user.id from dependencies since it's included in loadProducts and loadOrders

  useEffect(() => {
    console.log('🔄 SellerDashboard useEffect triggered');
    console.log('👤 Current user:', user);
    loadSellerData();
  }, [loadSellerData]);

  // Separate useEffect to update stats when products or orders change
  useEffect(() => {
    console.log('📊 Updating stats - products:', products.length, 'orders:', orders.length);
    updateStats(products, orders);
  }, [products, orders]); // Only runs when products or orders arrays change

  // Scroll event listener for footer visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show footer when user scrolls to within 100px of the bottom
      const nearBottom = scrollTop + windowHeight >= documentHeight - 100;
      setShowFooter(nearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const updateStats = (productList, orderList) => {
    const totalProducts = productList.length;
    const totalOrders = orderList.length;
    const totalRevenue = orderList.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0);
    const lowStockProducts = productList.filter(product => parseInt(product.stock) <= 5).length;

    setStats({
      totalProducts,
      totalOrders,
      totalRevenue,
      lowStockProducts
    });
  };

  const handleProductUpdate = () => {
    loadProducts();
  };

  const handleOrderUpdate = () => {
    loadOrders();
  };

  console.log('🔍 Render check - loading:', loading, 'products:', products.length, 'orders:', orders.length);
  
  if (loading) {
    console.log('⏳ Showing loading screen');
    return (
      <div className="seller-dashboard">
        <Header userType="seller" user={user} onLogout={onLogout} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>{t('Loading your dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
  <Header userType="seller" user={user} onLogout={onLogout} selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="dashboard-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
            <p>{t('Total Revenue')}</p>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>{t('Total Orders')}</p>
          </div>
        </div>

        <div className="stat-card products">
          <div className="stat-icon">🛍</div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>{t('Products Listed')}</p>
          </div>
        </div>

        <div className="stat-card stock">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{stats.lowStockProducts}</h3>
            <p>{t('Urgent Stock Alerts')}</p>
          </div>
        </div>
      </div>

      <div className="seller-nav">
        <button 
          className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="tab-icon">🛍</span>
          {t('Products Management')}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="tab-icon">📦</span>
          {t('Orders')}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="tab-icon">📊</span>
          {t('Analytics')}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'lowstock' ? 'active' : ''}`}
          onClick={() => setActiveTab('lowstock')}
        >
          <span className="tab-icon">🚨</span>
          {t('Urgent Stock')}
        </button>
      </div>

      <div className="seller-content">
        {activeTab === 'products' && (
          <ProductManagement 
            user={user}
            products={products}
            onProductUpdate={handleProductUpdate}
            selectedLanguage={selectedLanguage}
          />
        )}

        {activeTab === 'orders' && (
          <OrderManagement 
            user={user}
            orders={orders}
            products={products}
            onOrderUpdate={handleOrderUpdate}
            selectedLanguage={selectedLanguage}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics 
            user={user}
            products={products}
            orders={orders}
            stats={stats}
            selectedLanguage={selectedLanguage}
          />
        )}

        {activeTab === 'lowstock' && (
          <LowStockManagement 
            user={user}
            products={products}
            onProductUpdate={handleProductUpdate}
            selectedLanguage={selectedLanguage}
          />
        )}
      </div>

      {showFooter && (
        <footer className="footer seller-footer">
          <p>{t('© 2025 EcommerceHub Seller Portal. All rights reserved.')}</p>
        </footer>
      )}
      
      {/* AI Business Assistant */}
      <Chatbot 
        user={user} 
        userType="seller" 
        products={products} 
        orders={orders} 
      />
    </div>
  );
};

export default SellerDashboard;