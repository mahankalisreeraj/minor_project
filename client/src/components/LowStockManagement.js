import React, { useState, useEffect, useMemo } from 'react';
import './LowStockManagement.css';
import { useTranslation } from 'react-i18next';

const LowStockManagement = ({ user, products, onProductUpdate, selectedLanguage = 'en' }) => {
  const { t } = useTranslation();
  const [stockThreshold, setStockThreshold] = useState(5); // Default low stock threshold
  const [restockQuantities, setRestockQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter products with low stock based on threshold
  const lowStockProducts = useMemo(() => {
    return products.filter(product => {
      const currentStock = parseInt(product.stock) || 0;
      return currentStock <= stockThreshold && currentStock >= 0;
    }).sort((a, b) => {
      // Sort by stock level (lowest first)
      const stockA = parseInt(a.stock) || 0;
      const stockB = parseInt(b.stock) || 0;
      return stockA - stockB;
    });
  }, [products, stockThreshold]);

  // Initialize restock quantities
  useEffect(() => {
    const initialQuantities = {};
    lowStockProducts.forEach(product => {
      initialQuantities[product.id] = '';
    });
    setRestockQuantities(initialQuantities);
  }, [lowStockProducts]);

  // Handle restock quantity change
  const handleQuantityChange = (productId, quantity) => {
    setRestockQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  // Handle individual product restock
  const handleRestock = async (product) => {
    const restockQty = parseInt(restockQuantities[product.id]);
    if (!restockQty || restockQty <= 0) {
      alert(t('Please enter a valid restock quantity'));
      return;
    }

    setLoading(true);
    try {
      const ApiService = (await import('../services/api')).default;
      const newStock = parseInt(product.stock) + restockQty;
      
      console.log('🔄 Restocking product:', {
        productId: product.id,
        currentStock: product.stock,
        restockQty: restockQty,
        newStock: newStock,
        productData: product
      });
      
      const response = await ApiService.updateProduct(product.id, {
        ...product,
        stock: newStock.toString() // Ensure stock is string format
      });

      console.log('📊 Restock response:', response);

      if (response && response.success) {
        setSuccessMessage(t('Successfully restocked {{productName}} with {{restockQty}} units!', { productName: getProductName(product), restockQty: restockQty }));
        setRestockQuantities(prev => ({
          ...prev,
          [product.id]: ''
        }));
        onProductUpdate(); // Refresh products data
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('❌ Restock failed:', response);
        alert(t('Failed to update stock: ') + (response?.message || t('Unknown error')));
      }
    } catch (error) {
      console.error('❌ Error restocking product:', error);
      alert(t('Failed to update stock. Please try again. Error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk restock for all low stock items
  const handleBulkRestock = async () => {
    const itemsToRestock = lowStockProducts.filter(product => {
      const qty = parseInt(restockQuantities[product.id]);
      return qty && qty > 0;
    });

    if (itemsToRestock.length === 0) {
      alert(t('Please enter restock quantities for at least one product'));
      return;
    }

    if (!window.confirm(t('Are you sure you want to restock {{count}} products?', { count: itemsToRestock.length }))) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failureCount = 0;

    try {
      const ApiService = (await import('../services/api')).default;
      
      for (const product of itemsToRestock) {
        try {
          const restockQty = parseInt(restockQuantities[product.id]);
          const newStock = parseInt(product.stock) + restockQty;
          
          console.log('🔄 Bulk restocking product:', product.id, 'from', product.stock, 'to', newStock);
          
          const response = await ApiService.updateProduct(product.id, {
            ...product,
            stock: newStock.toString() // Ensure stock is string format
          });

          if (response && response.success) {
            successCount++;
          } else {
            console.error('❌ Bulk restock failed for product:', product.id, response);
            failureCount++;
          }
        } catch (error) {
          console.error('❌ Bulk restock error for product:', product.id, error);
          failureCount++;
        }
      }

      setSuccessMessage(t('Bulk restock completed: {{successCount}} successful, {{failureCount}} failed', { successCount: successCount, failureCount: failureCount }));
      setRestockQuantities({});
      onProductUpdate(); // Refresh products data
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error in bulk restock:', error);
      alert(t('Bulk restock failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Get product name in selected language
  const getProductName = (product) => {
    return product[`name_${selectedLanguage}`] || product.name || t('Unknown Product');
  };

  // Get product description in selected language
  const getProductDescription = (product) => {
    return product[`description_${selectedLanguage}`] || product.description || '';
  };

  // Get stock status color based on level
  const getStockStatusColor = (stock) => {
    const stockLevel = parseInt(stock) || 0;
    if (stockLevel === 0) return '#ff4757'; // Red for out of stock
    if (stockLevel <= 3) return '#ff6b35'; // Orange-red for critical
    if (stockLevel <= stockThreshold) return '#ffa502'; // Orange for low
    return '#2ed573'; // Green for good stock
  };

  return (
    <div className="low-stock-management">
      <div className="low-stock-header">
        <div className="header-content">
          <h2>🚨 {t('Urgent Stock Alert')}</h2>
          <p>{t('Critical items requiring immediate restocking - These need your urgent attention!')}</p>
        </div>
        <div className="header-controls">
          <div className="threshold-control">
            <label>{t('Low Stock Threshold:')}</label>
            <input
              type="number"
              min="1"
              max="100"
              value={stockThreshold}
              onChange={(e) => setStockThreshold(parseInt(e.target.value) || 10)}
              className="threshold-input"
            />
            <span>{t('units')}</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          ✅ {successMessage}
        </div>
      )}

      <div className="stock-summary">
        <div className="summary-card critical">
          <h3>{lowStockProducts.filter(p => parseInt(p.stock) === 0).length}</h3>
          <p>{t('Out of Stock')}</p>
        </div>
        <div className="summary-card warning">
          <h3>{lowStockProducts.filter(p => parseInt(p.stock) > 0 && parseInt(p.stock) <= 3).length}</h3>
          <p>{t('Critical Stock')}</p>
        </div>
        <div className="summary-card low">
          <h3>{lowStockProducts.length}</h3>
          <p>{t('Total Low Stock')}</p>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="no-low-stock">
          <div className="no-stock-icon">✅</div>
          <h3>{t('Great! All products are well-stocked')}</h3>
          <p>{t('No products are below the threshold of {{stockThreshold}} units', { stockThreshold: stockThreshold })}</p>
        </div>
      ) : (
        <>
          <div className="bulk-actions">
            <button 
              className="bulk-restock-btn"
              onClick={handleBulkRestock}
              disabled={loading}
            >
              {loading ? t('Processing...') : t('📦 Bulk Restock All')}
            </button>
            <span className="bulk-info">
              {t('{{count}} items ready for restock', { count: Object.values(restockQuantities).filter(qty => qty && parseInt(qty) > 0).length })}
            </span>
          </div>

          <div className="low-stock-table">
            <div className="table-header">
              <span>{t('Product')}</span>
              <span>{t('Current Stock')}</span>
              <span>{t('Restock Quantity')}</span>
              <span>{t('New Stock')}</span>
              <span>{t('Actions')}</span>
            </div>

            {lowStockProducts.map(product => {
              const currentStock = parseInt(product.stock) || 0;
              const restockQty = parseInt(restockQuantities[product.id]) || 0;
              const newStock = currentStock + restockQty;

              return (
                <div key={product.id} className="table-row">
                  <div className="product-info">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=60'} 
                      alt={getProductName(product)}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=60';
                      }}
                    />
                    <div className="product-details">
                      <h4>{getProductName(product)}</h4>
                      <p>₹{product.price}</p>
                    </div>
                  </div>

                  <div className="stock-level">
                    <span 
                      className="stock-badge" 
                      style={{ backgroundColor: getStockStatusColor(currentStock) }}
                    >
                      {currentStock}
                    </span>
                    <span className="stock-label">
                      {currentStock === 0 ? t('Out of Stock') : t('{{currentStock}} units', { currentStock: currentStock })}
                    </span>
                  </div>

                  <div className="restock-input">
                    <input
                      type="number"
                      min="1"
                      placeholder={t('Qty')}
                      value={restockQuantities[product.id] || ''}
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      className="quantity-input"
                    />
                  </div>

                  <div className="new-stock">
                    <span className={`new-stock-value ${restockQty > 0 ? 'updated' : ''}`}>
                      {newStock}
                    </span>
                    {restockQty > 0 && (
                      <span className="increase-indicator">+{restockQty}</span>
                    )}
                  </div>

                  <div className="actions">
                    <button
                      className="restock-btn"
                      onClick={() => handleRestock(product)}
                      disabled={loading || !restockQuantities[product.id] || parseInt(restockQuantities[product.id]) <= 0}
                    >
                      {loading ? '⏳' : t('📦 Restock')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default LowStockManagement;