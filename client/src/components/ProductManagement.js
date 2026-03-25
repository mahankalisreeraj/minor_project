import ApiService from '../services/api';
import './ProductManagement.css';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const ProductRow = React.memo(function ProductRow({ product, selectedLanguage, onEdit, onDelete }) {
  const { t } = useTranslation();
  const profitMargin = ((product.price - product.cost) / product.price * 100).toFixed(1);
  const nameField = product[`name_${selectedLanguage}`] || product.name;
  const descField = product[`description_${selectedLanguage}`] || product.description;
  return (
    <tr key={product.id}>
      <td>
        <img 
          src={product.image || '/api/placeholder/50/50'} 
          alt={nameField}
          className="product-thumb"
          onError={(e) => {
            e.target.src = '/api/placeholder/50/50';
          }}
        />
      </td>
      <td>
        <div>{nameField}</div>
        {descField && <div style={{fontSize: '0.95em', color: '#6c7a89'}}>{descField}</div>}
      </td>
      <td>₹{product.price}</td>
      <td>₹{product.cost}</td>
      <td>{product.stock}</td>
      <td>{product.sales || 0}</td>
      <td>{profitMargin}%</td>
      <td>
        {(() => {
          const rating = Number(product.pqi || 0);
          if (!rating) return <span>No reviews yet</span>;
          const full = Math.floor(rating);
          const half = rating - full >= 0.5 ? 1 : 0;
          const empty = 5 - full - half;
          const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
          return (
            <span>
              <span className="stars">{stars}</span>
              <span style={{ marginLeft: 6 }}>({rating.toFixed(1)})</span>
            </span>
          );
        })()}
      </td>
      <td>
        <button 
          className="edit-btn"
          onClick={() => onEdit(product)}
        >
          {t('Edit')}
        </button>
        <button 
          className="delete-btn"
          onClick={() => onDelete(product.id)}
        >
          {t('Delete')}
        </button>
      </td>
    </tr>
  );
});


const ProductManagement = ({ user, selectedLanguage = 'en' }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    name_en: '',
    name_te: '',
    name_hi: '',
    name_bn: '',
    name_mr: '',
    name_ta: '',
    name_ur: '',
    price: '',
    cost: '',
    stock: '',
    sales: '',
    description: '',
    description_en: '',
    description_te: '',
    description_hi: '',
    description_bn: '',
    description_mr: '',
    description_ta: '',
    description_ur: '',
    image: ''
  });

  const loadProducts = useCallback(async () => {
    try {
      const response = await ApiService.getProductsBySeller(user.id);
      console.log('getProductsBySeller response:', response);
      if (response.success) {
        setProducts(response.products);
      } else {
        console.warn('No products loaded:', response);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadProducts();
  }, [user.id, loadProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        cost: parseFloat(newProduct.cost),
        stock: parseInt(newProduct.stock),
        sellerId: user.id
      };

      const response = editingProduct 
        ? await ApiService.updateProduct(editingProduct.id, productData)
        : await ApiService.createProduct(productData);

      if (response.success) {
        await loadProducts();
        resetForm();
        alert(editingProduct ? t('Product updated successfully!') : t('Product added successfully!'));
      } else {
        alert(response.message || t('Operation failed'));
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert(t('Failed to save product'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      name_en: product.name_en || '',
      name_te: product.name_te || '',
      name_hi: product.name_hi || '',
      name_bn: product.name_bn || '',
      name_mr: product.name_mr || '',
      name_ta: product.name_ta || '',
      name_ur: product.name_ur || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      stock: product.stock?.toString() || '',
      sales: product.sales?.toString() || '',
      description: product.description || '',
      description_en: product.description_en || '',
      description_te: product.description_te || '',
      description_hi: product.description_hi || '',
      description_bn: product.description_bn || '',
      description_mr: product.description_mr || '',
      description_ta: product.description_ta || '',
      description_ur: product.description_ur || '',
      image: product.image || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm(t('Are you sure you want to delete this product?'))) {
      try {
        const response = await ApiService.deleteProduct(productId);
        if (response.success) {
          await loadProducts();
          alert(t('Product deleted successfully!'));
        } else {
          alert(t('Failed to delete product'));
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(t('Failed to delete product'));
      }
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      name_en: '',
      name_te: '',
      name_hi: '',
      name_bn: '',
      name_mr: '',
      name_ta: '',
      name_ur: '',
      price: '',
      cost: '',
      stock: '',
      sales: '',
      description: '',
      description_en: '',
      description_te: '',
      description_hi: '',
      description_bn: '',
      description_mr: '',
      description_ta: '',
      description_ur: '',
      image: ''
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

  if (loading && products.length === 0) {
    return <div className="loading">{t('Loading products...')}</div>;
  }

  return (
    <div className="product-management">
      <div className="products-header">
        <h2>{t('Your Products')} ({products.length})</h2>
        <button 
          className="add-product-btn"
          onClick={() => setShowAddForm(true)}
        >
          {t('Add New Product')}
        </button>
      </div>

      {showAddForm && (
        <div className="add-product-form">
          <h3>{editingProduct ? t('Edit Product') : t('Add New Product')}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder={t('Product Name (Default)')}
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                required
              />
              <input
                type="url"
                placeholder={t('Image URL (optional)')}
                value={newProduct.image}
                onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
              />
            </div>
            <div className="form-row">
              <input type="text" placeholder={t('Name (English)')} value={newProduct.name_en} onChange={e => setNewProduct({...newProduct, name_en: e.target.value})} />
              <input type="text" placeholder={t('Name (Telugu)')} value={newProduct.name_te} onChange={e => setNewProduct({...newProduct, name_te: e.target.value})} />
              <input type="text" placeholder={t('Name (Hindi)')} value={newProduct.name_hi} onChange={e => setNewProduct({...newProduct, name_hi: e.target.value})} />
            </div>
            <div className="form-row">
              <input type="text" placeholder={t('Name (Bengali)')} value={newProduct.name_bn} onChange={e => setNewProduct({...newProduct, name_bn: e.target.value})} />
              <input type="text" placeholder={t('Name (Marathi)')} value={newProduct.name_mr} onChange={e => setNewProduct({...newProduct, name_mr: e.target.value})} />
              <input type="text" placeholder={t('Name (Tamil)')} value={newProduct.name_ta} onChange={e => setNewProduct({...newProduct, name_ta: e.target.value})} />
              <input type="text" placeholder={t('Name (Urdu)')} value={newProduct.name_ur} onChange={e => setNewProduct({...newProduct, name_ur: e.target.value})} />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder={t('Selling Price')}
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                required
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder={t('Cost Price')}
                value={newProduct.cost}
                onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                required
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder={t('Stock Quantity')}
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                required
                min="0"
              />
              <input
                type="number"
                placeholder={t('Sales (optional)')}
                value={newProduct.sales}
                onChange={(e) => setNewProduct({...newProduct, sales: e.target.value})}
                min="0"
              />
            </div>
            <textarea
              placeholder={t('Product Description (Default)')}
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              rows="2"
            ></textarea>
            <textarea placeholder={t('Description (English)')} value={newProduct.description_en} onChange={e => setNewProduct({...newProduct, description_en: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Telugu)')} value={newProduct.description_te} onChange={e => setNewProduct({...newProduct, description_te: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Hindi)')} value={newProduct.description_hi} onChange={e => setNewProduct({...newProduct, description_hi: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Bengali)')} value={newProduct.description_bn} onChange={e => setNewProduct({...newProduct, description_bn: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Marathi)')} value={newProduct.description_mr} onChange={e => setNewProduct({...newProduct, description_mr: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Tamil)')} value={newProduct.description_ta} onChange={e => setNewProduct({...newProduct, description_ta: e.target.value})} rows="2"></textarea>
            <textarea placeholder={t('Description (Urdu)')} value={newProduct.description_ur} onChange={e => setNewProduct({...newProduct, description_ur: e.target.value})} rows="2"></textarea>
            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? t('Saving...') : (editingProduct ? t('Update Product') : t('Add Product'))}
              </button>
              <button type="button" onClick={resetForm}>{t('Cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="products-table">
        {products.length === 0 ? (
          <div className="no-products">
            <p>{t('You haven\'t added any products yet.')}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('Image')}</th>
                <th>{t('Product Name')}</th>
                <th>{t('Price')}</th>
                <th>{t('Cost')}</th>
                <th>{t('Stock')}</th>
                <th>{t('Sales')}</th>
                <th>{t('Profit Margin')}</th>
                <th>{t('PQI')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selectedLanguage={selectedLanguage}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
