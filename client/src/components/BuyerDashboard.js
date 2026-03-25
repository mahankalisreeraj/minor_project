import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import ApiService from '../services/api';
import Chatbot from './Chatbot';
import Banner from './Banner'; // Import the new Banner component
import './BuyerDashboard.css';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n'; // Import the i18n instance

const BuyerDashboard = ({ user, onLogout, darkMode, toggleDarkMode }) => {
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [reviewForms, setReviewForms] = useState({}); // { [productId]: { open, buyerId, rating, comment } }
  
  // Voice-related states (simplified)
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []); // Initialize with global i18n language
  const [showFooter, setShowFooter] = useState(false);

  // Voice language options
    const voiceLanguages = React.useMemo(() => [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
      { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
      { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
      { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
      { code: 'ur', name: 'اردو', flag: '🇮🇳' }
    ], []);

  // Initialize voice features (simplified - only voice search)
  useEffect(() => {
    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
      
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      // Set proper language codes for speech recognition
      const speechLanguageMap = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'te': 'te-IN',
        'bn': 'bn-IN',
        'mr': 'mr-IN',
        'ta': 'ta-IN',
        'ur': 'ur-IN'
      };
      recognition.lang = speechLanguageMap[currentLanguage] || 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        if (event.results.isFinal) {
          const finalTranscript = transcript.trim();
          console.log('🎤 Voice search transcript:', finalTranscript);
          
          // Set the search query for UI display
          setSearchQuery(finalTranscript);
          
          // Immediately search products with voice input
          performVoiceProductSearch(finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
      };
      
      setRecognition(recognition);
    }
  }, [currentLanguage]);

  // Use useCallback to memoize the function and prevent infinite re-renders
  const loadCartItems = useCallback(async () => {
    try {
      const userId = user.id || user._id || user.userId || user.email;
      
      if (!userId) {
        console.error('No user ID found in:', user);
        setLoading(false);
        return;
      }

      console.log('Loading cart items for user:', userId);
      const response = await ApiService.getCartItems(userId);
      if (response.success) {
        console.log('Cart items loaded:', response.items);
        setCartItems(response.items);
      } else {
        console.error('Failed to load cart items:', response.message);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadProducts = useCallback(async () => {
    try {
      console.log('🛍️ Loading products from Google Sheets...');
      const response = await ApiService.getAllProducts();
      console.log('🔍 Raw API Response:', response);
      
      if (response.success && response.products && response.products.length > 0) {
        console.log('✅ Products loaded from sheets:', response.products.length);
        console.log('🔍 First product sample:', response.products[0]);
        
        // Format products from sheets with proper pricing
        const formattedProducts = response.products.map((product, index) => {
          console.log(`🔍 Processing product ${index}:`, {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock
          });
          
          const price = parseFloat(product.price) || 0;
          const cost = parseFloat(product.cost) || 0;
          const sales = parseInt(product.sales) || 0;
          
          // Calculate original price (add 20-30% markup for display)
          const originalPrice = price > cost ? price + (price * 0.25) : price * 1.3;
          
          const formattedProduct = {
            id: product.id || `product_${index}_${Date.now()}`,
            name: product.name || t('Unknown Product'),
            // Include all language-specific names
            name_en: product.name_en || product.name || '',
            name_te: product.name_te || '',
            name_hi: product.name_hi || '',
            name_bn: product.name_bn || '',
            name_mr: product.name_mr || '',
            name_ta: product.name_ta || '',
            name_ur: product.name_ur || '',
            price: price,
            originalPrice: Math.round(originalPrice),
            cost: cost,
            sales: sales,
            stock: parseInt(product.stock) || 0,
            description: product.description || t('No description available'),
            // Include all language-specific descriptions
            description_en: product.description_en || product.description || '',
            description_te: product.description_te || '',
            description_hi: product.description_hi || '',
            description_bn: product.description_bn || '',
            description_mr: product.description_mr || '',
            description_ta: product.description_ta || '',
            description_ur: product.description_ur || '',
            image: product.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
            sellerId: product.sellerId || 'unknown',
            // Use review-based PQI and review count from backend
            pqi: typeof product.pqi !== 'undefined' ? Number(product.pqi) : 0,
            reviewCount: typeof product.reviewCount !== 'undefined' ? Number(product.reviewCount) : 0,
            createdAt: product.createdAt || new Date().toISOString()
          };
          
          console.log(`✅ Formatted product ${index}:`, formattedProduct.name, formattedProduct.price, formattedProduct.stock);
          return formattedProduct;
        });
        
        console.log('📦 Total formatted products:', formattedProducts.length);
        
        // Remove duplicates and invalid products - with better logging
        const validProducts = formattedProducts.filter((product, index) => {
          const isValid = product.name && 
            product.name !== t('Unknown Product') && 
            product.name.trim() !== '' &&
            product.price > 0 &&
            product.stock >= 0;
          
          if (!isValid) {
            console.log(`❌ Product ${index} filtered out:`, {
              name: product.name,
              price: product.price,
              stock: product.stock
            });
          }
          
          return isValid;
        });
        
        console.log('✅ Valid products after filtering:', validProducts.length);
        console.log('🔍 Valid products sample:', validProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, price: p.price })));
        
        setProducts(validProducts);
        setFilteredProducts(validProducts);
      } else {
        console.error('❌ No products found or API call failed:', {
          success: response.success,
          productsLength: response.products ? response.products.length : 'products is null/undefined',
          response: response
        });
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('❌ Error loading products from sheets:', error);
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [t]);

  // Enhanced orderNow handler with better functionality
  const orderNow = useCallback(async () => {
    try {
      if (cartItems.length === 0) {
        alert(t('Your cart is empty! Add some products first.'));
        return;
      }

      const userId = user.id || user._id || user.userId || user.email;
      if (!userId) {
        alert(t('Please log in to place an order.'));
        return;
      }

      // Calculate total amount
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0
      );
      const finalTotal = totalAmount * 1.07; // Including taxes and fees

      // Confirm order with user
      const orderConfirmed = window.confirm(
        t('🛍️ Confirm Your Order\n\nItems: {{itemCount}}\nTotal Amount: ₹{{totalAmount}}\n\nClick OK to place your order, or Cancel to continue shopping.', { itemCount: cartItems.length, totalAmount: finalTotal.toLocaleString() })
      );

      if (!orderConfirmed) {
        return;
      }

      // Show loading state
      const orderBtn = document.querySelector('.order-now-btn');
      if (orderBtn) {
        orderBtn.disabled = true;
        orderBtn.innerHTML = '<span class="order-icon">⏳</span>' + t('Processing Order...');
      }

      // Create orders for each item
      const orderPromises = cartItems.map(async (item) => {
        try {
          return await ApiService.createOrder({
            buyerId: userId,
            sellerId: item.product?.sellerId || 'unknown',
            productId: item.productId,
            quantity: item.quantity,
            totalAmount: (item.product?.price || 0) * item.quantity
          });
        } catch (error) {
          console.error('Error creating order for item:', item.id, error);
          return { success: false, error: error.message };
        }
      });

      // Wait for all orders to complete
      const orderResults = await Promise.all(orderPromises);
      
      // Check if all orders were successful
      const failedOrders = orderResults.filter(result => !result.success);
      
      if (failedOrders.length > 0) {
        alert(t('⚠️ Some orders failed to process. Please try again or contact support.'));
        return;
      }

      // Clear cart after successful orders
      const clearPromises = cartItems.map(item => 
        ApiService.removeFromCart(item.id).catch(err => 
          console.error('Error clearing cart item:', err)
        )
      );
      await Promise.all(clearPromises);
      
      // Reload cart and close
      await loadCartItems();
      setShowCart(false);
      
      // Success message with order details
      alert(
        t('🎉 Order Placed Successfully!\n\n📦 {{itemCount}} item(s) ordered\n💰 Total: ₹{{totalAmount}}\n📧 Order confirmation will be sent to your email\n\nThank you for shopping with us!', { itemCount: cartItems.length, totalAmount: finalTotal.toLocaleString() })
      );
      
    } catch (error) {
      console.error('Error placing order:', error);
      alert(t('❌ Failed to place order. Please try again or contact support.'));
    } finally {
      // Reset button state
      const orderBtn = document.querySelector('.order-now-btn');
      if (orderBtn) {
        orderBtn.disabled = false;
        orderBtn.innerHTML = '<span class="order-icon">🛍️</span>' + t('orderNow');
      }
    }
  }, [cartItems, user, loadCartItems, t]);

  useEffect(() => {
    console.log('🔍 BuyerDashboard mounted');
    console.log('🔍 User object:', user);
    
    loadCartItems();
    loadProducts();
  }, [user, loadCartItems, loadProducts]);

  useEffect(() => {
    // Filter products based on search query with multilingual support
    let filtered = products;
    
    // Filter by search query
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        // Search in default name and description
        if ((product.name && product.name.toLowerCase().includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))) {
          return true;
        }
        
        // Search in language-specific fields
        const langSpecificName = product[`name_${currentLanguage}`];
        if (langSpecificName && langSpecificName.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        const langSpecificDesc = product[`description_${currentLanguage}`];
        if (langSpecificDesc && langSpecificDesc.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        return false;
      });
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, products, currentLanguage]);

  // Better badge logic
  const getBadges = useCallback((product, allProducts) => {
    // NEW badge - products added in last 7 days
    const createdDate = new Date(product.createdAt);
    const daysSinceCreated = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    const isNew = daysSinceCreated <= 7;
    
    // BESTSELLER badge - top 20% of products by sales
    const sortedBySales = [...allProducts].sort((a, b) => (b.sales || 0) - (a.sales || 0));
    const topSellerThreshold = Math.ceil(allProducts.length * 0.2);
    const isBestseller = sortedBySales.slice(0, topSellerThreshold).some(p => p.id === product.id);
    
    // HOT badge - high sales (top 30% by sales and sales > 50)
    const topHotThreshold = Math.ceil(allProducts.length * 0.3);
    const isHot = sortedBySales.slice(0, topHotThreshold).some(p => p.id === product.id) && (product.sales || 0) > 50;
    
    // LIMITED badge - stock between 1-5
    const isLimited = product.stock > 0 && product.stock <= 5;
    
    return { isNew, isBestseller, isHot, isLimited };
  }, []);

  // Start voice search
  const startVoiceSearch = () => {
    if (recognition && voiceSupported) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Voice recognition error:', error);
        alert(t('Voice search is not supported on this device.'));
      }
    } else {
      alert(t('Voice search is not supported on this device.'));
    }
  };

  // Stop voice search
  const stopVoiceSearch = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Perform voice product search with multilingual support
  const performVoiceProductSearch = (transcript) => {
    if (!transcript || transcript.length === 0) return; 
    
    console.log('🔍 Voice searching for:', transcript, 'in language:', currentLanguage);
    
    // Search products with multilingual support
    const searchTerm = transcript.toLowerCase();
    const filtered = products.filter(product => {
      // Search in default name
      if (product.name && product.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in description
      if (product.description && product.description.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in language-specific fields
      const langSpecificName = product[`name_${currentLanguage}`];
      if (langSpecificName && langSpecificName.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      const langSpecificDesc = product[`description_${currentLanguage}`];
      if (langSpecificDesc && langSpecificDesc.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      return false;
    });
    
    console.log('🔍 Voice search results:', filtered.length, 'products found');
    setFilteredProducts(filtered);
    
    // Show search feedback
    if (filtered.length === 0) {
      // Could show a "no results found" message
      console.log('No products found for voice search:', transcript);
    }
  };

  const addToCart = async (product) => {
    console.log('🛒 ===== ADD TO CART FUNCTION CALLED =====');
    console.log('🛒 Product:', product);
    
    try {
      if (!product || !product.id) {
        console.error('❌ Invalid product data:', product);
        alert(t('Invalid product data - missing product ID'));
        return;
      }

      if (product.stock <= 0) {
        alert(t('Sorry, this product is out of stock!'));
        return;
      }

      const userId = user.id || user._id || user.userId || user.email;
      
      if (!userId) {
        console.error('❌ No user ID found. User object:', user);
        alert(t('Please log in to add items to cart.'));
        return;
      }

      console.log('🛒 Making API call with params:', {
        userId,
        productId: product.id,
        quantity: 1
      });

      // Show loading state
      const addButton = document.querySelector(`[data-product-id="${product.id}"]`);
      if (addButton) {
        addButton.disabled = true;
        addButton.textContent = t('Adding...');
      }

      // Make API call
      const response = await ApiService.addToCart(userId, product.id, 1);
      console.log('🛒 API response:', response);
      
      if (response && response.success) {
        console.log('✅ Successfully added to cart, reloading cart items...');
        await loadCartItems();
        alert(t('✅ {{productName}} added to cart successfully!', { productName: product.name }));
      } else {
        console.error('❌ API returned failure:', response);
        alert(t('❌ Failed to add product to cart: {{message}}', { message: response?.message || t('Unknown error') }));
      }
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      alert(t('Failed to add item to cart: {{message}}', { message: error.message }));
    } finally {
      // Reset button state
      const addButton = document.querySelector(`[data-product-id="${product.id}"]`);
      if (addButton && product.stock > 0) {
        addButton.disabled = false;
        addButton.textContent = t('Add to Cart');
      }
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      const response = await ApiService.removeFromCart(cartId);
      if (response.success) {
        await loadCartItems();
        alert(t('Item removed from cart'));
      } else {
        alert(t('Failed to remove item from cart'));
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      alert(t('Failed to remove item from cart'));
    }
  };

  const updateQuantity = async (cartId, quantity) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(cartId);
        return;
      }
      const response = await ApiService.updateCartItem(cartId, quantity);
      if (response.success) {
        await loadCartItems();
      } else {
        alert(t('Failed to update quantity'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(t('Failed to update quantity'));
    }
  };

  const checkout = async () => {
    try {
      if (cartItems.length === 0) {
        alert(t('Your cart is empty'));
        return;
      }

      const userId = user.id || user._id || user.userId || user.email;
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0
      );

      // Create orders for each item
      for (const item of cartItems) {
        await ApiService.createOrder({
          buyerId: userId,
          sellerId: item.product?.sellerId || 'unknown',
          productId: item.productId,
          quantity: item.quantity,
          totalAmount: (item.product?.price || 0) * item.quantity
        });
      }
      
      // Clear cart after successful order
      for (const item of cartItems) {
        await ApiService.removeFromCart(item.id);
      }
      
      await loadCartItems();
      setShowCart(false);
      alert(t('🎉 Order placed successfully! Total: ₹{{totalAmount}}', { totalAmount: totalAmount.toLocaleString() }));
    } catch (error) {
      console.error('Error during checkout:', error);
      alert(t('Failed to place order. Please try again.'));
    }
  };

  const toggleCart = () => {
    console.log('Cart toggled. Current state:', showCart, 'New state:', !showCart);
    setShowCart(!showCart);
  };

  const calculateDiscount = (originalPrice, currentPrice) => {
    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: t('Out of Stock'), class: 'out-of-stock' };
    if (stock < 5) return { text: t('Limited Stock'), class: 'limited-stock' };
    if (stock < 10) return { text: t('Low Stock'), class: 'low-stock' };
    return { text: t('In Stock'), class: 'in-stock' };
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '½'}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  // Review form helpers
  const toggleReviewForm = (productId) => {
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        open: !prev[productId]?.open,
        buyerId: prev[productId]?.buyerId || (user?.id || ''),
        rating: prev[productId]?.rating || 5,
        comment: prev[productId]?.comment || ''
      }
    }));
  };

  const updateReviewField = (productId, field, value) => {
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const submitReview = async (productId) => {
    const form = reviewForms[productId] || {};
    if (!form.buyerId || !form.rating) {
      alert(t('Buyer ID and rating are required'));
      return;
    }
    try {
      await ApiService.addProductReview(productId, {
        buyerId: form.buyerId,
        rating: Number(form.rating),
        comment: form.comment || ''
      });
      await loadProducts();
      setReviewForms(prev => ({ ...prev, [productId]: { open: false, buyerId: user?.id || '', rating: 5, comment: '' } }));
      alert(t('Thank you for your review!'));
    } catch (e) {
      alert(t('Failed to submit review'));
    }
  };

  const handleFooterLinkClick = (e, linkType) => {
    e.preventDefault();
    console.log(`${linkType} link clicked`);
    alert(`${linkType} ${t('page coming soon!')}`);
  };

  const handleLanguageChange = (langCode) => {
    console.log('🌍 Language changing from', currentLanguage, 'to', langCode);
    setCurrentLanguage(langCode);
    localStorage.setItem('selectedLanguage', langCode);
    i18n.changeLanguage(langCode); // Update global i18n instance
    
    // Update recognition language if it exists
    if (recognition) {
      recognition.lang = langCode;
    }
  };

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      const validLanguages = ['en', 'te', 'hi', 'bn', 'mr', 'ta', 'ur'];
      if (validLanguages.includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage); // Set global i18n instance
      }
    }
  }, []); // Only run on mount

  // Handle scroll to show footer only when at bottom
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Show footer when user is within 100px of the bottom
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      setShowFooter(isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial position
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="buyer-dashboard">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>{t('Loading your dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="buyer-dashboard">
      <Header 
        userType="buyer" 
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartItemsCount={cartItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)}
        onLogout={onLogout}
        onCartClick={toggleCart}
        selectedLanguage={currentLanguage}
        setSelectedLanguage={handleLanguageChange}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Enhanced Banner Section */}
      <Banner />

      {/* Products Section */}
      <div className="main-content">
        <div className="product-grid">
          <h2>
            🛍️ {t('Our Top Picks')} ({filteredProducts.length})
            {searchQuery && <small> - {t('Search results for')} "{searchQuery}"</small>}
          </h2>
          
          <div className="products-container">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                {loading ? (
                  <div>
                    <div className="spinner"></div>
                    <p>{t('Loading products...')}</p>
                  </div>
                ) : (
                  <div>
                    <p>📊 {t('No products found')}</p>
                    <small>{t('Try adjusting your search terms')}</small>
                  </div>
                )}
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const discount = calculateDiscount(product.originalPrice, product.price);
                const stockStatus = getStockStatus(product.stock);
                const badges = getBadges(product, products);
                
                return (
                  <div key={product.id} className="clean-product-card">
                    {/* Product Image */}
                    <div className="product-image-wrapper">
                      <img 
                        src={product.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop'}
                        alt={product.name || t('Product')}
                        className="product-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop';
                        }}
                      />
                      
                      {/* Badges */}
                      {discount > 0 && (
                        <div className="discount-tag">
                          -{discount}% {t('OFF')}
                        </div>
                      )}
                      
                      {badges.isNew && <div className="new-tag">{t('NEW')}</div>}
                      {badges.isBestseller && <div className="bestseller-tag">{t('BESTSELLER')}</div>}
                      {badges.isHot && <div className="hot-tag">{t('HOT')}</div>}
                      {badges.isLimited && <div className="limited-tag">{t('LIMITED')}</div>}
                      
                      {/* Stock Status */}
                      <div className={`stock-badge ${stockStatus.class}`}>
                        {stockStatus.text}
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="product-content">
                      <h3 className="product-name">
                        {product[`name_${currentLanguage}`] || product.name || t('Unnamed Product')}
                      </h3>
                      
                      <div className="product-rating">
                        {product.reviewCount === 0 ? (
                          <>
                            <span className="stars">{renderStars(Number(product.pqi) || 4)}</span>
                            <span className="rating-count">({(Number(product.pqi) || 4).toFixed(1)} · {t('default')})</span>
                          </>
                        ) : (
                          <>
                            <span className="stars">{renderStars(Number(product.pqi) || 0)}</span>
                            <span className="rating-count">({(Number(product.pqi) || 0).toFixed(1)})</span>
                          </>
                        )}
                      </div>
                      
                      {/* Product Description */}
                      <p className="product-description">
                        {(product[`description_${currentLanguage}`] || product.description || t('No description available')).substring(0, 120)}
                        {(product[`description_${currentLanguage}`] || product.description || '').length > 120 && '...'}
                      </p>
                      
                      <div className="product-price">
                        <span className="price-current">₹{(product.price || 0).toLocaleString()}</span>
                        {discount > 0 && (
                          <span className="price-original">₹{(product.originalPrice || 0).toLocaleString()}</span>
                        )}
                      </div>
                      
                      {product.price >= 500 && (
                        <div className="free-shipping">
                          🚚 {t('Free Delivery')}
                        </div>
                      )}
                      
                      <button 
                        className={`add-cart-button ${ 
                          product.stock <= 0 ? 'disabled' : 
                          cartItems.some(item => item.productId === product.id) ? 'added' : ''
                        }`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (product.stock > 0) {
                            addToCart(product);
                          }
                        }}
                        disabled={product.stock <= 0}
                        data-product-id={product.id}
                      >
                        {product.stock <= 0 ? (
                          t('Out of Stock')
                        ) : cartItems.some(item => item.productId === product.id) ? (
                          t('✓ Added to Cart')
                        ) : (
                          '🛜 ' + t('Add to Cart')
                        )}
                      </button>

                      {/* Review form button */}
                      <div style={{ marginTop: 8 }}>
                        <button className="add-cart-button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleReviewForm(product.id); }}>
                          {t('Write a Review')}
                        </button>
                      </div>

                      {/* Inline Review Form */}
                      {reviewForms[product.id]?.open && (
                        <div className="review-form" style={{marginTop: '8px'}}>
                          <div className="form-row">
                            <input
                              type="text"
                              placeholder={t('Your Buyer ID')}
                              value={reviewForms[product.id]?.buyerId || ''}
                              onChange={(e) => updateReviewField(product.id, 'buyerId', e.target.value)}
                              required
                            />
                            <select
                              value={reviewForms[product.id]?.rating || 5}
                              onChange={(e) => updateReviewField(product.id, 'rating', e.target.value)}
                            >
                              <option value={5}>5</option>
                              <option value={4}>4</option>
                              <option value={3}>3</option>
                              <option value={2}>2</option>
                              <option value={1}>1</option>
                            </select>
                          </div>
                          <textarea
                            placeholder={t('Write your comment (optional)')}
                            rows="2"
                            value={reviewForms[product.id]?.comment || ''}
                            onChange={(e) => updateReviewField(product.id, 'comment', e.target.value)}
                          />
                          <div className="form-buttons">
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); submitReview(product.id); }}>{t('Submit Review')}</button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleReviewForm(product.id); }}>{t('Cancel')}</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Cart Dropdown */}
      {showCart && (
        <>
          <div className="cart-backdrop" onClick={() => setShowCart(false)}></div>
          <div className="cart-dropdown">
            <div className="cart">
              <div className="cart-header">
                <h3>
                  <span className="cart-icon-header">🛒</span>
                  {t('Shopping Cart')}
                </h3>
                <button className="close-cart-btn" onClick={() => setShowCart(false)}>✕</button>
                {cartItems.length > 0 && (
                  <span className="cart-item-count">
                    {cartItems.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0)} {t('items')}
                  </span>
                )}
              </div>
              
              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <h4>{t('Your cart is empty')}</h4>
                  <p>{t('Add some amazing products to get started!')}</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {cartItems.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="item-image">
                          <img 
                            src={item.product?.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=60&h=60&fit=crop'}
                            alt={item.product?.name || t('Product')}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=60&h=60&fit=crop';
                            }}
                          />
                        </div>
                        
                        <div className="item-details">
                          <h4 className="item-name">
                            {item.product?.[`name_${currentLanguage}`] || item.product?.name || t('Product')}
                          </h4>
                          <p className="item-price">₹{(item.product?.price || 0).toLocaleString()}</p>
                          <p className="item-total">
                            {t('Total:')} ₹{((item.product?.price || 0) * parseInt(item.quantity || 0)).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="item-controls">
                          <div className="quantity-controls">
                            <button 
                              onClick={() => updateQuantity(item.id, parseInt(item.quantity) - 1)}
                              className="quantity-btn"
                              disabled={parseInt(item.quantity) <= 1}
                            >
                              −
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, parseInt(item.quantity) + 1)}
                              className="quantity-btn"
                            >
                              +
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="remove-btn"
                            title={t('Remove from cart')}
                          >
                            <span>🗑️</span>
                            {t('Remove')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="cart-summary">
                    <div className="summary-row subtotal">
                      <span>{t('Subtotal')} ({cartItems.length} {t('items')}):</span>
                      <span className="amount">
                        ₹{cartItems.reduce((sum, item) => 
                          sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0
                        ).toLocaleString()}
                      </span>
                    </div>
                    {/* Tax and Platform Fees */}
                    <div className="summary-row tax">
                      <span>{t('Tax (5%):')}</span>
                      <span className="amount">
                        ₹{ (
                          cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0) * 0.05
                        ).toLocaleString(undefined, {maximumFractionDigits:2})}
                      </span>
                    </div>
                    <div className="summary-row fee">
                      <span>{t('Platform Fee (2%):')}</span>
                      <span className="amount">
                        ₹{ (
                          cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0) * 0.02
                        ).toLocaleString(undefined, {maximumFractionDigits:2})}
                      </span>
                    </div>
                    <div className="shipping-notice">
                      <small>🚚 {t('Free shipping on orders above ₹500')}</small>
                    </div>
                    <div className="summary-row total">
                      <span><strong>{t('Total Amount')}:</strong></span>
                      <span className="amount">
                        <strong>
                          ₹{ (
                            cartItems.reduce((sum, item) => sum + ((item.product?.price || 0) * parseInt(item.quantity || 0)), 0)
                            * 1.07
                          ).toLocaleString(undefined, {maximumFractionDigits:2})}
                        </strong>
                      </span>
                    </div>
                    <button 
                      className="order-now-btn"
                      onClick={orderNow}
                      disabled={cartItems.length === 0}
                    >
                      <span className="order-icon">🛍️</span>
                      {t('Order Now')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showFooter && (
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2025 {t('Smart Seller Dashboard - Your Premium Shopping Destination')}</p>
            <div className="footer-links">
              <button 
                className="footer-link"
                onClick={(e) => handleFooterLinkClick(e, t('About Us'))}
              >
                {t('About Us')}
              </button>
              <button 
                className="footer-link"
                onClick={(e) => handleFooterLinkClick(e, t('Contact'))}
              >
                {t('Contact')}
              </button>
              <button 
                className="footer-link"
                onClick={(e) => handleFooterLinkClick(e, t('Privacy Policy'))}
              >
                {t('Privacy Policy')}
              </button>
              <button 
                className="footer-link"
                onClick={(e) => handleFooterLinkClick(e, t('Terms of Service'))}
              >
                {t('Terms of Service')}
              </button>
            </div>
          </div>
        </footer>
      )}
      
      {/* AI Shopping Assistant */}
      <Chatbot 
        user={user} 
        userType="buyer" 
        products={products} 
        orders={[]} 
      />
    </div>
  );
};

export default BuyerDashboard;