import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../utils/api';
import Invoice from '../../components/Invoice';
import { downloadInvoicePdf, printInvoice } from '../../utils/downloadInvoicePdf';

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
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const invoiceModalRef = useRef(null);

  const totalOrders = useMemo(() => orders.length, [orders]);

  const handlePrintOrderInvoice = () => {
    printInvoice(invoiceModalRef.current, `Tax Invoice - ${selectedOrderForInvoice?.orderNumber || 'Order'}`);
  };

  const handleDownloadOrderInvoice = async () => {
    if (!invoiceModalRef.current || !selectedOrderForInvoice) return;
    try {
      setDownloadingInvoice(true);
      const invoiceNum =
        selectedOrderForInvoice.orderNumber ||
        (selectedOrderForInvoice._id ? String(selectedOrderForInvoice._id).slice(-8).toUpperCase() : 'INVOICE');
      await downloadInvoicePdf(invoiceModalRef.current, `Invoice-${invoiceNum}.pdf`);
    } catch (err) {
      console.error('Invoice PDF error:', err);
      alert(`Failed to download PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloadingInvoice(false);
    }
  };

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
            <p className="text-brown-700">Manage all store orders and generate customer invoices</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 bg-white border border-brown-200 rounded-lg shadow-sm text-sm text-brown-800">
              Total: <span className="font-semibold text-brown-900">{totalOrders}</span>
            </div>
            <Link
              to="/admin/invoice-generator"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-700 hover:to-brown-800 font-semibold shadow-sm transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create Bill / Invoice
            </Link>
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
                    <th className="px-6 py-4 text-right text-xs font-semibold text-brown-800 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForInvoice(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brown-300 bg-white hover:bg-brown-50 text-brown-900 font-medium text-xs shadow-sm transition-colors cursor-pointer"
                          title="Generate / Print / Download Tax Invoice"
                        >
                          <svg className="w-4 h-4 text-brown-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Order Invoice Preview Modal */}
        {selectedOrderForInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brown-100 bg-brown-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brown-900 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-brown-900">
                      Tax Invoice #{selectedOrderForInvoice.orderNumber || String(selectedOrderForInvoice._id).slice(-8).toUpperCase()}
                    </h2>
                    <p className="text-xs text-brown-600">
                      Customer: {selectedOrderForInvoice.user?.name || selectedOrderForInvoice.shippingAddress?.fullName || 'Customer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintOrderInvoice}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-brown-300 text-brown-800 hover:bg-brown-50 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOrderInvoice}
                    disabled={downloadingInvoice}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brown-900 text-white hover:bg-brown-800 disabled:opacity-50 text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {downloadingInvoice ? 'Downloading...' : 'Download PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForInvoice(null)}
                    className="p-1.5 text-brown-500 hover:text-brown-800 rounded-lg hover:bg-brown-100 cursor-pointer"
                    aria-label="Close"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body - Scrollable Invoice Preview */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-brown-50/50">
                <Invoice
                  order={selectedOrderForInvoice}
                  user={selectedOrderForInvoice.user}
                  onPrint={handlePrintOrderInvoice}
                />
              </div>
            </div>
          </div>
        )}

        {/* Off-screen invoice for clean PDF export without modals / UI buttons */}
        {selectedOrderForInvoice && (
          <div
            style={{
              position: 'fixed',
              left: '-9999px',
              top: 0,
              width: '800px',
              zIndex: -1,
              pointerEvents: 'none',
              backgroundColor: '#ffffff',
            }}
          >
            <div ref={invoiceModalRef}>
              <Invoice
                order={selectedOrderForInvoice}
                user={selectedOrderForInvoice.user}
                forExport={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;

