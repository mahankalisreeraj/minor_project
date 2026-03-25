// import React from 'react';

// const Cart = ({ items, onRemoveItem, onUpdateQuantity, onCheckout }) => {
//   const totalAmount = items.reduce((sum, item) => {
//     const price = item.product ? item.product.price : 0;
//     const quantity = parseInt(item.quantity) || 0;
//     return sum + (price * quantity);
//   }, 0);

//   const totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

//   return (
//     <div className="cart">
//       <div className="cart-header">
//         <h3>Shopping Cart</h3>
//         {totalItems > 0 && (
//           <span className="cart-item-count">({totalItems} items)</span>
//         )}
//       </div>
      
//       {items.length === 0 ? (
//         <div className="empty-cart">
//           <div className="empty-cart-icon">🛒</div>
//           <p>Your cart is empty</p>
//           <small>Add some products to get started!</small>
//         </div>
//       ) : (
//         <>
//           <div className="cart-items">
//             {items.map(item => (
//               <div key={item.id} className="cart-item">
//                 <div className="item-image">
//                   <img 
//                     src={item.product?.image || '/api/placeholder/60/60'} 
//                     alt={item.product?.name || 'Product'}
//                     onError={(e) => {
//                       e.target.src = '/api/placeholder/60/60';
//                     }}
//                   />
//                 </div>
                
//                 <div className="item-details">
//                   <h4 className="item-name">
//                     {item.product?.name || 'Unknown Product'}
//                   </h4>
//                   <p className="item-price">₹{item.product?.price || 0}</p>
//                   {item.product?.stock && (
//                     <small className="stock-info">
//                       Stock: {item.product.stock}
//                     </small>
//                   )}
//                 </div>
                
//                 <div className="item-controls">
//                   <div className="quantity-controls">
//                     <button 
//                       onClick={() => onUpdateQuantity(item.id, parseInt(item.quantity) - 1)}
//                       className="quantity-btn minus"
//                       disabled={parseInt(item.quantity) <= 1}
//                     >
//                       -
//                     </button>
//                     <span className="quantity">{item.quantity}</span>
//                     <button 
//                       onClick={() => onUpdateQuantity(item.id, parseInt(item.quantity) + 1)}
//                       className="quantity-btn plus"
//                       disabled={item.product && parseInt(item.quantity) >= item.product.stock}
//                     >
//                       +
//                     </button>
//                   </div>
                  
//                   <div className="item-total">
//                     ₹{(item.product?.price || 0) * parseInt(item.quantity)}
//                   </div>
                  
//                   <button 
//                     onClick={() => onRemoveItem(item.id)}
//                     className="remove-btn"
//                     title="Remove from cart"
//                   >
//                     🗑
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           <div className="cart-summary">
//             <div className="summary-row">
//               <span>Subtotal ({totalItems} items):</span>
//               <span className="amount">₹{totalAmount}</span>
//             </div>
//             <div className="summary-row">
//               <span>Shipping:</span>
//               <span className="amount">
//                 {totalAmount > 500 ? 'FREE' : '₹50'}
//               </span>
//             </div>
//             <div className="summary-row total">
//               <span><strong>Total:</strong></span>
//               <span className="amount">
//                 <strong>₹{totalAmount > 500 ? totalAmount : totalAmount + 50}</strong>
//               </span>
//             </div>
            
//             {totalAmount <= 500 && (
//               <div className="shipping-notice">
//                 <small>Add ₹{500 - totalAmount} more for free shipping!</small>
//               </div>
//             )}
            
//             <button 
//               className="checkout-btn"
//               onClick={onCheckout}
//               disabled={items.length === 0}
//             >
//               <span className="checkout-icon">🛒</span>
//               Proceed to Checkout
//             </button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Cart;

import React from 'react';

const Cart = ({ items, onRemoveItem, onUpdateQuantity, onCheckout, onClose }) => {
  const totalAmount = items.reduce((sum, item) => {
    const price = item.product ? item.product.price : 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (price * quantity);
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

  return (
    <div className="cart">
      <div className="cart-header">
        <h3>Shopping Cart</h3>
        <button className="close-cart-btn" onClick={onClose}>✕</button>
        {totalItems > 0 && (
          <span className="cart-item-count">({totalItems} items)</span>
        )}
      </div>
      
      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>Your cart is empty</p>
          <small>Add some products to get started!</small>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img 
                    src={item.product?.image || '/api/placeholder/60/60'} 
                    alt={item.product?.name || 'Product'}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/60/60';
                    }}
                  />
                </div>
                
                <div className="item-details">
                  <h4 className="item-name">
                    {item.product?.name || 'Unknown Product'}
                  </h4>
                  <p className="item-price">₹{item.product?.price || 0}</p>
                  {item.product?.stock && (
                    <small className="stock-info">
                      Stock: {item.product.stock}
                    </small>
                  )}
                </div>
                
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, parseInt(item.quantity) - 1)}
                      className="quantity-btn minus"
                      disabled={parseInt(item.quantity) <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, parseInt(item.quantity) + 1)}
                      className="quantity-btn plus"
                      disabled={item.product && parseInt(item.quantity) >= item.product.stock}
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="item-total">
                    ₹{(item.product?.price || 0) * parseInt(item.quantity)}
                  </div>
                  
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    className="remove-btn"
                    title="Remove from cart"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal ({totalItems} items):</span>
              <span className="amount">₹{totalAmount}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className="amount">
                {totalAmount > 500 ? 'FREE' : '₹50'}
              </span>
            </div>
            <div className="summary-row total">
              <span><strong>Total:</strong></span>
              <span className="amount">
                <strong>₹{totalAmount > 500 ? totalAmount : totalAmount + 50}</strong>
              </span>
            </div>
            
            {totalAmount <= 500 && (
              <div className="shipping-notice">
                <small>Add ₹{500 - totalAmount} more for free shipping!</small>
              </div>
            )}
            
            <button 
              className="checkout-btn"
              onClick={onCheckout}
              disabled={items.length === 0}
            >
              <span className="checkout-icon">🛒</span>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
