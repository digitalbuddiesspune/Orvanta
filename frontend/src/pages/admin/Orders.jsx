import { useEffect, useMemo, useState } from 'react';
import { orderAPI } from '../../utils/api';

const STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const statusStyles = (status) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Shipped':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Processing':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'Cancelled':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'Confirmed':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const totalOrders = useMemo(() => orders.length, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderAPI.getAllOrdersAdmin();
      if (response?.success) {
        setOrders(response.data || []);
      } else {
        setError(response?.message || 'Failed to fetch orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, nextStatus) => {
    const prev = orders.find((o) => o._id === orderId);
    if (!prev || prev.status === nextStatus) return;

    setUpdatingId(orderId);
    setError('');

    setOrders((curr) =>
      curr.map((o) => (o._id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      const response = await orderAPI.updateOrderStatusAdmin(orderId, nextStatus);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to update order status');
      }
    } catch (err) {
      setOrders((curr) =>
        curr.map((o) => (o._id === orderId ? { ...o, status: prev.status } : o))
      );
      setError(err.response?.data?.message || err.message || 'Failed to update order status');
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-700"></div>
          <p className="mt-4 text-brown-700">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-2">Orders</h1>
            <p className="text-brown-700">Manage all store orders</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white border border-brown-200 rounded-lg shadow-sm text-sm text-brown-800">
              Total: <span className="font-semibold text-brown-900">{totalOrders}</span>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 hover:border-brown-300 font-medium shadow-sm transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-brown-200 p-12 text-center">
            <svg className="w-16 h-16 text-brown-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h3 className="text-lg font-semibold text-brown-900 mb-2">No Orders</h3>
            <p className="text-brown-700">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-brown-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brown-50 border-b border-brown-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-brown-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-brown-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brown-900">#{String(order._id).slice(-8)}</div>
                        <div className="text-xs text-brown-600">{order.paymentMethod || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-brown-900">{order.user?.name || '—'}</div>
                        <div className="text-xs text-brown-600">{order.user?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brown-900">₹{Number(order.totalAmount || 0).toLocaleString()}</div>
                        <div className="text-xs text-brown-600">{(order.items?.length || 0)} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                          <select
                            value={order.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={updatingId === order._id}
                            className="text-sm border border-brown-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brown-700/20 disabled:opacity-60"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brown-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

