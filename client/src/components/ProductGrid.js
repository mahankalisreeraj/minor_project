// import React, { useState, useEffect } from 'react';
// import ApiService from '../services/api';

// const ProductGrid = ({ searchQuery = '', onAddToCart }) => {
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     loadProducts();
//   }, []);

//   useEffect(() => {
//     const filtered = products.filter(product =>
//       (product.name || '').toLowerCase().includes(searchQuery.toLowerCase())
//     );
//     setFilteredProducts(filtered);
//   }, [searchQuery, products]);

//   const loadProducts = async () => {
//     setLoading(true);
//     try {
//       const response = await ApiService.getAllProducts();

//       if (response.success && Array.isArray(response.products)) {
//         setProducts(response.products);
//       } else if (Array.isArray(response)) {
//         // fallback if the API returns plain array
//         setProducts(response);
//       } else {
//         setProducts([]);
//       }
//     } catch (error) {
//       console.error('Error loading products:', error);
//       setProducts([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return <div className="loading">Loading products...</div>;
//   }

//   return (
//     <div className="product-grid">
//       <h2>Featured Products</h2>
//       <div className="products-container">
//         {filteredProducts.length === 0 ? (
//           <div className="no-products">
//             <p>No products found matching your search.</p>
//           </div>
//         ) : (
//           filteredProducts.map(product => (
//             <div key={product.id} className="product-card">
//               <div className="product-image">
//                 <img
//                   src={product.image || '/api/placeholder/200/200'}
//                   alt={product.name || 'Product Image'}
//                   onError={(e) => {
//                     e.target.src = '/api/placeholder/200/200';
//                   }}
//                 />
//               </div>
//               <div className="product-info">
//                 <h3 className="product-name">{product.name}</h3>
//                 <div className="product-pricing">
//                   <span className="current-price">₹{product.price}</span>
//                   {product.originalPrice && (
//                     <span className="original-price">₹{product.originalPrice}</span>
//                   )}
//                 </div>
//                 <div className="product-details">
//                   <span className="stock-info">Stock: {product.stock}</span>
//                   <span className="sales-info">Sold: {product.sales}</span>
//                 </div>
//                 {product.description && (
//                   <p className="product-description">{product.description}</p>
//                 )}
//                 <button
//                   className="add-to-cart-btn"
//                   onClick={() => onAddToCart(product)}
//                   disabled={product.stock <= 0}
//                 >
//                   {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default ProductGrid;
import React, { useState, useEffect } from 'react';

import ApiService from '../services/api';
import './ProductManagement.css';

const ProductGrid = ({ searchQuery, onAddToCart, selectedLanguage = 'en' }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForms, setReviewForms] = useState({}); // { [productId]: { open, buyerId, rating, comment } }

  // Sample featured products to display initially
  const sampleProducts = [
    {
      id: 'sample-1',
      name: 'Apple iPhone 15 Pro',
      price: 134900,
      cost: 120000,
      originalPrice: 149900,
      stock: 25,
      sales: 145,
      description: 'Latest iPhone with A17 Pro chip, 256GB storage, and advanced camera system',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-1'
    },
    {
      id: 'sample-2',
      name: 'Samsung Galaxy Book3 Laptop',
      price: 89999,
      cost: 75000,
      originalPrice: 99999,
      stock: 18,
      sales: 89,
      description: '15.6" FHD display, Intel i7, 16GB RAM, 512GB SSD, perfect for work and gaming',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-2'
    },
    {
      id: 'sample-3',
      name: 'Sony WH-1000XM5 Headphones',
      price: 29990,
      cost: 22000,
      originalPrice: 34990,
      stock: 42,
      sales: 256,
      description: 'Industry-leading noise canceling wireless headphones with 30-hour battery',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-3'
    },
    {
      id: 'sample-4',
      name: 'Nike Air Jordan 1 Retro',
      price: 12995,
      cost: 8500,
      originalPrice: 15995,
      stock: 35,
      sales: 178,
      description: 'Classic basketball sneakers in premium leather with iconic design',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-4'
    },
    {
      id: 'sample-5',
      name: 'Canon EOS R6 Camera',
      price: 189999,
      cost: 165000,
      originalPrice: 219999,
      stock: 12,
      sales: 45,
      description: 'Full-frame mirrorless camera with 20.1MP sensor and 4K video recording',
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-5'
    },
    {
      id: 'sample-6',
      name: 'Apple Watch Series 9',
      price: 41900,
      cost: 35000,
      originalPrice: 45900,
      stock: 28,
      sales: 312,
      description: 'Advanced smartwatch with health monitoring, GPS, and cellular connectivity',
      image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-6'
    },
    {
      id: 'sample-7',
      name: 'PlayStation 5 Console',
      price: 54990,
      cost: 45000,
      originalPrice: 59990,
      stock: 8,
      sales: 423,
      description: 'Next-gen gaming console with ultra-high speed SSD and ray tracing',
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-7'
    },
    {
      id: 'sample-8',
      name: 'MacBook Air M2',
      price: 119900,
      cost: 105000,
      originalPrice: 129900,
      stock: 15,
      sales: 167,
      description: '13.6" laptop with M2 chip, 8GB RAM, 256GB SSD, all-day battery life',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-8'
    },
    {
      id: 'sample-9',
      name: 'Samsung 55" 4K Smart TV',
      price: 74999,
      cost: 62000,
      originalPrice: 84999,
      stock: 22,
      sales: 134,
      description: 'Crystal UHD display with Tizen OS, HDR support, and voice control',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-9'
    },
    {
      id: 'sample-10',
      name: 'Dyson V15 Detect Vacuum',
      price: 59900,
      cost: 48000,
      originalPrice: 65900,
      stock: 19,
      sales: 78,
      description: 'Cordless vacuum with laser dust detection and powerful suction',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-10'
    },
    {
      id: 'sample-11',
      name: 'Adidas Ultraboost 22',
      price: 17999,
      cost: 12000,
      originalPrice: 19999,
      stock: 45,
      sales: 289,
      description: 'Premium running shoes with Boost midsole and Primeknit upper',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-11'
    },
    {
      id: 'sample-12',
      name: 'KitchenAid Stand Mixer',
      price: 42999,
      cost: 35000,
      originalPrice: 47999,
      stock: 14,
      sales: 56,
      description: 'Professional-grade stand mixer with 5-quart bowl and multiple attachments',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      sellerId: 'sample-seller-12'
    }
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Combine API products with sample products and filter
    // PQI should come from backend reviews; do not compute fallback here
    const allProducts = [...sampleProducts, ...products];
    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const response = await ApiService.getAllProducts();
      if (response.success) {
        // Convert API products to match our format
        const apiProducts = response.products.map(p => ({
          id: p.id,
          name: p.name || 'Unknown Product',
          price: parseFloat(p.price) || 0,
          cost: parseFloat(p.cost) || 0,
          originalPrice: parseFloat(p.originalPrice) || parseFloat(p.price) || 0,
          stock: parseInt(p.stock) || 0,
          sales: parseInt(p.sales) || 0,
          description: p.description || 'No description available',
          image: p.image || `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop`,
          sellerId: p.sellerId || 'unknown',
          pqi: typeof p.pqi !== 'undefined' ? Number(p.pqi) : 0,
          reviewCount: typeof p.reviewCount !== 'undefined' ? Number(p.reviewCount) : 0
        }));
        setProducts(apiProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // If API fails, we'll still show sample products
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewForm = (productId) => {
    setReviewForms(prev => ({
      ...prev,
      [productId]: {
        open: !prev[productId]?.open,
        buyerId: prev[productId]?.buyerId || '',
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
      alert('Buyer ID and rating are required');
      return;
    }
    try {
      await ApiService.addProductReview(productId, {
        buyerId: form.buyerId,
        rating: Number(form.rating),
        comment: form.comment || ''
      });
      await loadProducts();
      setReviewForms(prev => ({ ...prev, [productId]: { open: false, buyerId: '', rating: 5, comment: '' } }));
      alert('Thank you for your review!');
    } catch (e) {
      alert('Failed to submit review');
    }
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="product-grid">
      <h2>Featured Products</h2>
      <div className="products-container">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <p>No products found matching your search.</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            // Multilingual name/description fallback logic
            const nameField = product[`name_${selectedLanguage}`] || product.name;
            const descField = product[`description_${selectedLanguage}`] || product.description;
            return (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img 
                    src={product.image} 
                    alt={nameField}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop';
                    }}
                  />
                  {product.originalPrice > product.price && (
                    <div className="discount-badge">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </div>
                  )}
                  {product.stock < 10 && product.stock > 0 && (
                    <div className="low-stock-badge">
                      Only {product.stock} left!
                    </div>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{nameField}</h3>
                  <div className="product-pricing">
                    <span className="current-price">₹{product.price.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                      <span className="original-price">₹{product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="product-details">
                    <span className="stock-info">Stock: {product.stock}</span>
                    <span className="sales-info">Sold: {product.sales}</span>
                    {typeof product.pqi !== 'undefined' && (
                      <span className="pqi-info">PQI: {Number(product.pqi).toFixed(1)}</span>
                    )}
                  </div>
                  {descField && (
                    <p className="product-description">{descField}</p>
                  )}
                  <div className="product-actions">
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <div className="product-rating">
                      {product.reviewCount === 0 || Number(product.pqi) === 0 ? (
                        <span className="no-reviews">No reviews yet</span>
                      ) : (
                        (() => {
                          const rating = Number(product.pqi) || 0;
                          const full = Math.floor(rating);
                          const half = rating - full >= 0.5 ? 1 : 0;
                          const empty = 5 - full - half;
                          const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
                          return (
                            <>
                              <span className="stars">{stars}</span>
                              <span className="rating-count">({rating.toFixed(1)})</span>
                            </>
                          );
                        })()
                      )}
                    </div>
                    <button className="add-to-cart-btn" onClick={() => toggleReviewForm(product.id)}>Write a Review</button>
                  </div>
                  {reviewForms[product.id]?.open && (
                    <div className="review-form" style={{marginTop: '8px'}}>
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="Your Buyer ID"
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
                        placeholder="Write your comment (optional)"
                        rows="2"
                        value={reviewForms[product.id]?.comment || ''}
                        onChange={(e) => updateReviewField(product.id, 'comment', e.target.value)}
                      />
                      <div className="form-buttons">
                        <button onClick={() => submitReview(product.id)}>Submit Review</button>
                        <button type="button" onClick={() => toggleReviewForm(product.id)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
