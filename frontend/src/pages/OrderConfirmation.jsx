import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Processing: 'bg-indigo-100 text-indigo-700',
  Shipped: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const cancellableStatuses = ['Pending', 'Confirmed'];

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchOrder();
  }, [orderId, navigate]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getOrderById(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const response = await orderAPI.cancelOrder(orderId);
      if (response.success) {
        setOrder((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
      } else {
        alert(response.message || 'Failed to cancel order');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brown-600 mb-4">Order not found</p>
          <Link to="/orders" className="px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900">
            View Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header - Success or Cancelled */}
        <div className="text-center mb-8">
          {order.status === 'Cancelled' ? (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brown-900 mb-2">Order Cancelled</h1>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brown-900 mb-2">Order Placed Successfully!</h1>
            </>
          )}
          <p className="text-brown-600">
            {order.status === 'Cancelled' ? (
              <>Order <span className="font-bold text-brown-800">{order.orderNumber}</span> has been cancelled.</>
            ) : (
              <>Thank you for your order. Your order number is <span className="font-bold text-brown-800">{order.orderNumber}</span></>
            )}
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-md border border-brown-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-lg font-bold text-brown-900">Order Details</h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  statusColors[order.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {order.status}
              </span>
              {cancellableStatuses.includes(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-1.5 text-sm font-semibold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-brown-500">Order Number</p>
              <p className="font-semibold text-brown-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-brown-500">Order Date</p>
              <p className="font-semibold text-brown-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-brown-500">Payment Method</p>
              <p className="font-semibold text-brown-900">
                {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
              </p>
            </div>
            <div>
              <p className="text-brown-500">Total Amount</p>
              <p className="font-bold text-brown-800 text-lg">₹{order.totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Items */}
          <h3 className="text-sm font-bold text-brown-700 mb-3 uppercase tracking-wide">Items Ordered</h3>
          <div className="space-y-3 mb-6">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-3 pb-3 border-b border-brown-100 last:border-0">
                <div className="w-14 h-14 flex-shrink-0 bg-brown-100 rounded-lg overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brown-400 text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brown-900">{item.name}</p>
                  <p className="text-xs text-brown-500">
                    ₹{item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-brown-800">₹{item.itemTotal.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Shipping Address */}
          <h3 className="text-sm font-bold text-brown-700 mb-3 uppercase tracking-wide">
            Shipping Address
          </h3>
          <div className="bg-brown-50 rounded-lg p-4 text-sm text-brown-700">
            <p className="font-semibold text-brown-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.pincode}
            </p>
            <p>Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/orders"
            className="flex-1 text-center px-6 py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-bold shadow-md hover:shadow-lg transition-all"
          >
            View My Orders
          </Link>
          <Link
            to="/all-products"
            className="flex-1 text-center px-6 py-3 border-2 border-brown-300 text-brown-700 rounded-lg hover:bg-brown-50 font-semibold transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
