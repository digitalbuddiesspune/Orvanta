import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI, categoryAPI, orderAPI } from '../../utils/api';

const RECENT_ORDERS_LIMIT = 8;

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

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    activeProducts: 0,
    totalOrders: 0,
    loading: true
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [allProductsRes, activeProductsRes, categoriesRes, ordersRes] = await Promise.allSettled([
          productAPI.getAllProducts({ limit: 1, all: 'true' }),
          productAPI.getAllProducts({ limit: 1 }),
          categoryAPI.getAllCategories(),
          orderAPI.getAllOrdersAdmin(),
        ]);

        const allProducts = allProductsRes.status === 'fulfilled' ? allProductsRes.value : null;
        const activeProducts = activeProductsRes.status === 'fulfilled' ? activeProductsRes.value : null;
        const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value : null;
        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : null;
        const orderList = Array.isArray(orders?.data) ? orders.data : [];

        setRecentOrders(orderList.slice(0, RECENT_ORDERS_LIMIT));
        setStats({
          totalProducts: allProducts?.data?.pagination?.total || 0,
          totalCategories: Array.isArray(categories?.data) ? categories.data.length : 0,
          activeProducts: activeProducts?.data?.pagination?.total || 0,
          totalOrders: orderList.length,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradient: 'from-brown-600 to-brown-700',
      bgGradient: 'from-brown-50 to-brown-100',
      link: '/admin/products'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-brown-500 to-brown-600',
      bgGradient: 'from-brown-50 to-brown-100',
      link: '/admin/products'
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      gradient: 'from-brown-500 to-brown-600',
      bgGradient: 'from-brown-50 to-brown-100',
      link: '/admin/categories'
    },
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      gradient: 'from-brown-500 to-brown-600',
      bgGradient: 'from-brown-50 to-brown-100',
      link: '/admin/orders'
    }
  ];

  if (stats.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-2">Admin Dashboard</h1>
          <p className="text-brown-700">Welcome back! Here's an overview of your store</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity" 
                   style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))`, 
                            '--tw-gradient-from': card.gradient.split(' ')[1], 
                            '--tw-gradient-to': card.gradient.split(' ')[3] }}></div>
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-brown-700 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-brown-900">{card.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${card.bgGradient} rounded-xl p-3 text-brown-700`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-brown-200 overflow-hidden mb-8">
          <div className="flex items-center justify-between px-6 py-5 border-b border-brown-100">
            <div>
              <h2 className="text-xl font-semibold text-brown-900">Recent Orders</h2>
              <p className="text-sm text-brown-600 mt-0.5">Latest orders placed in your store</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-sm font-semibold text-brown-800 hover:text-brown-900 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 text-brown-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-sm font-medium text-brown-800">No orders yet</p>
              <p className="text-sm text-brown-600 mt-1">New orders will show up here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brown-50 border-b border-brown-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-brown-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brown-900">
                          #{order.orderNumber || String(order._id).slice(-8).toUpperCase()}
                        </div>
                        <div className="text-xs text-brown-600">{order.paymentMethod || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-brown-900">
                          {order.user?.name || order.shippingAddress?.fullName || '—'}
                        </div>
                        <div className="text-xs text-brown-600">{order.user?.email || order.shippingAddress?.phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brown-900">
                          ₹{Number(order.totalAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-brown-600">{order.items?.length || 0} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles(order.status)}`}>
                          {order.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-brown-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-brown-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-brown-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/admin/products/new"
              className="group flex items-center gap-4 p-5 border-2 border-brown-200 rounded-xl hover:border-brown-300 hover:bg-brown-50 transition-all duration-200"
            >
              <div className="bg-brown-800 rounded-lg p-3 text-white group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900 group-hover:text-brown-800">Add New Product</p>
                <p className="text-sm text-brown-700">Create a new product</p>
              </div>
            </Link>
            <Link
              to="/admin/categories/new"
              className="group flex items-center gap-4 p-5 border-2 border-brown-200 rounded-xl hover:border-brown-300 hover:bg-brown-50 transition-all duration-200"
            >
              <div className="bg-brown-700 rounded-lg p-3 text-white group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900 group-hover:text-brown-800">Add New Category</p>
                <p className="text-sm text-brown-700">Create a new category</p>
              </div>
            </Link>
            <Link
              to="/admin/products"
              className="group flex items-center gap-4 p-5 border-2 border-brown-200 rounded-xl hover:border-brown-300 hover:bg-brown-50 transition-all duration-200"
            >
              <div className="bg-brown-600 rounded-lg p-3 text-white group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-brown-900 group-hover:text-brown-800">Manage Products</p>
                <p className="text-sm text-brown-700">View and edit products</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






