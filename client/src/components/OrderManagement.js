import React, { useState } from 'react';
import ApiService from '../services/api';
import './OrderManagement.css';
import ConfirmationModal from './ConfirmationModal';
import { useTranslation } from 'react-i18next';

const OrderManagement = ({ user, orders, products, onOrderUpdate }) => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : t('Unknown Product');
  };

  const getProductImage = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.image || 'https://via.placeholder.com/50';
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await ApiService.updateOrderStatus(orderId, newStatus);
      onOrderUpdate();
      alert(t('Order status updated to {{newStatus}}', { newStatus: newStatus }));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(t('Failed to update order status'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setShowConfirmation(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      updateOrderStatus(orderToCancel.id, 'cancelled');
    }
    setShowConfirmation(false);
    setOrderToCancel(null);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'pending', text: t('Pending') },
      processing: { class: 'processing', text: t('Processing') },
      shipped: { class: 'shipped', text: t('Shipped') },
      delivered: { class: 'delivered', text: t('Delivered') },
      cancelled: { class: 'cancelled', text: t('Cancelled') }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div className="order-management">
      <ConfirmationModal
        show={showConfirmation}
        onHide={() => setShowConfirmation(false)}
        onConfirm={handleConfirmCancel}
        title={t('Confirm Cancellation')}
        body={t('Are you sure you want to cancel order #{{orderId}}?', { orderId: orderToCancel?.id })}
      />
      <div className="orders-header">
        <h2>{t('Order Management')} ({filteredOrders.length})</h2>
        <div className="order-filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">{t('All Orders')}</option>
            <option value="pending">{t('Pending')}</option>
            <option value="processing">{t('Processing')}</option>
            <option value="shipped">{t('Shipped')}</option>
            <option value="delivered">{t('Delivered')}</option>
            <option value="cancelled">{t('Cancelled')}</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <div className="empty-icon">📦</div>
          <p>{t('No orders found')}</p>
          <small>
            {filterStatus === 'all'
              ? t("You haven't received any orders yet.")
              : t('No {{filterStatus}} orders found.', { filterStatus: filterStatus })}
          </small>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h4>{t('Order #')}{order.id}</h4>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <span className="buyer-name">{order.buyer?.name}</span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="order-details">
                <div className="product-info">
                  <img
                    src={getProductImage(order.productId)}
                    alt={getProductName(order.productId)}
                    className="product-thumbnail"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/50' }}
                  />
                  <div className="product-details">
                    <h5>{getProductName(order.productId)}</h5>
                    <p>{t('Quantity:')} {order.quantity}</p>
                    <p className="order-amount">₹{order.totalAmount}</p>
                  </div>
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <>
                      <button
                        className="action-btn accept"
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                        disabled={loading}
                      >
                        {t('Accept Order')}
                      </button>
                      <button
                        className="action-btn cancel"
                        onClick={() => handleCancelClick(order)}
                        disabled={loading}
                      >
                        {t('Cancel')}
                      </button>
                    </>
                  )}

                  {order.status === 'processing' && (
                    <button
                      className="action-btn ship"
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      disabled={loading}
                    >
                      {t('Mark as Shipped')}
                    </button>
                  )}

                  {order.status === 'shipped' && (
                    <button
                      className="action-btn deliver"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      disabled={loading}
                    >
                      {t('Mark as Delivered')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;