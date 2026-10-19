import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { categoryAPI, productAPI } from '../../utils/api';

// In-memory cache so navigating between pages does not re-fetch all products
let cachedAdminProducts = null;
let cachedCategories = null;

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState(() => cachedAdminProducts || []);
  const [loading, setLoading] = useState(() => !cachedAdminProducts);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(() => cachedCategories || []);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Handle updated or created product passed back from ProductForm navigation
  useEffect(() => {
    if (location.state?.updatedProduct) {
      const updated = location.state.updatedProduct;
      setProducts((prev) => {
        const index = prev.findIndex((p) => p._id === updated._id);
        let next;
        if (index !== -1) {
          next = [...prev];
          next[index] = { ...next[index], ...updated };
        } else {
          next = [updated, ...prev];
        }
        cachedAdminProducts = next;
        return next;
      });
      setLoading(false);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    if (location.state?.createdProduct) {
      const created = location.state.createdProduct;
      setProducts((prev) => {
        const next = [created, ...prev.filter((p) => p._id !== created._id)];
        cachedAdminProducts = next;
        return next;
      });
      setLoading(false);
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
  }, [location.state, location.pathname, navigate]);

  // Initial fetch only if cache is empty
  useEffect(() => {
    fetchCategories();
    if (!cachedAdminProducts) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCategories = async () => {
    if (cachedCategories) {
      setCategories(cachedCategories);
      return;
    }
    try {
      const response = await categoryAPI.getAllCategories();
      if (response.success) {
        const cats = response.data || [];
        setCategories(cats);
        cachedCategories = cats;
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh && products.length > 0) {
        setRefreshing(true);
      } else if (products.length === 0) {
        setLoading(true);
      }
      setError(null);

      // Fetch all products (including inactive) for admin
      const response = await productAPI.getAllProducts({ limit: 1000, all: 'true' });
      if (response.success) {
        const productsList = response.data?.products || [];
        setProducts(productsList);
        cachedAdminProducts = productsList;
        if (productsList.length === 0) {
          setError('No products found in database. Please add products first.');
        }
      } else {
        setError(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch products. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Instant optimistic delete: removes row immediately without reloading all products
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const prevProducts = products;
    const updated = products.filter((p) => p._id !== id);
    setProducts(updated);
    cachedAdminProducts = updated;

    try {
      await productAPI.deleteProduct(id);
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
      // Revert if API call fails
      setProducts(prevProducts);
      cachedAdminProducts = prevProducts;
    }
  };

  // Instant optimistic active toggle: updates badge immediately without reloading all products
  const handleToggleActive = async (product) => {
    const newStatus = !product.isActive;
    const prevProducts = products;
    const updated = products.map((p) =>
      p._id === product._id ? { ...p, isActive: newStatus } : p
    );
    setProducts(updated);
    cachedAdminProducts = updated;

    try {
      await productAPI.updateProduct(product._id, {
        isActive: newStatus,
      });
    } catch (err) {
      alert('Failed to update product: ' + err.message);
      // Revert if API call fails
      setProducts(prevProducts);
      cachedAdminProducts = prevProducts;
    }
  };

  // Instant client-side filtering without re-querying all products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory) {
        const productCatId = product.category?._id || product.category;
        if (String(productCatId) !== String(selectedCategory)) {
          return false;
        }
      }
      if (selectedSubcategory) {
        if (product.subcategory !== selectedSubcategory) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, selectedSubcategory]);

  const selectedCategoryData = categories.find((cat) => cat._id === selectedCategory);
  const availableSubcategories = selectedCategoryData?.subcategories || [];

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-700"></div>
          <p className="mt-4 text-brown-700">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-2">Products</h1>
            <p className="text-brown-700">
              {loading
                ? 'Loading...'
                : `Manage all products (${filteredProducts.length}${
                    filteredProducts.length !== products.length ? ` of ${products.length}` : ' total'
                  })`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchProducts(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-brown-200 text-brown-800 rounded-lg hover:bg-brown-50 hover:border-brown-300 font-medium shadow-sm transition-all disabled:opacity-75"
            >
              <svg
                className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/admin/products/new"
              className="flex items-center gap-2 px-6 py-3 bg-brown-800 text-white rounded-lg hover:bg-brown-900 font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Product
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brown-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brown-800 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubcategory('');
                }}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg bg-white text-brown-900 focus:ring-2 focus:ring-brown-700 focus:border-brown-700"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brown-800 uppercase tracking-wider mb-2">
                Subcategory
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory}
                className="w-full px-3 py-2 border border-brown-200 rounded-lg bg-white text-brown-900 focus:ring-2 focus:ring-brown-700 focus:border-brown-700 disabled:bg-brown-50 disabled:text-brown-400"
              >
                <option value="">All Subcategories</option>
                {availableSubcategories.map((subcategory, idx) => (
                  <option key={`${subcategory}-${idx}`} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                disabled={!selectedCategory && !selectedSubcategory}
                className="w-full md:w-auto px-4 py-2 bg-brown-100 text-brown-800 border border-brown-200 rounded-lg hover:bg-brown-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-4 rounded-xl mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold mb-1">Error:</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => fetchProducts(true)}
                  className="mt-3 px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900 text-sm font-medium transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-brown-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brown-100">
              <thead className="bg-gradient-to-r from-brown-50 to-brown-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-brown-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-brown-100">
                {!loading && filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-brown-100 rounded-full p-4">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <p className="text-brown-700 text-lg font-medium">
                          {selectedCategory || selectedSubcategory
                            ? 'No products match the selected filters'
                            : 'No products found in database'}
                        </p>
                        {selectedCategory || selectedSubcategory ? (
                          <button
                            onClick={clearFilters}
                            className="px-6 py-2.5 bg-brown-100 text-brown-800 rounded-lg hover:bg-brown-200 font-medium transition-all"
                          >
                            Clear Filters
                          </button>
                        ) : (
                          <Link
                            to="/admin/products/new"
                            className="px-6 py-3 bg-brown-800 text-white rounded-lg hover:bg-brown-900 font-medium shadow-md hover:shadow-lg transition-all"
                          >
                            + Add Your First Product
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-brown-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-14 h-14 object-cover rounded-lg border border-brown-200"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-brown-50 rounded-lg border border-brown-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-semibold text-brown-900">{product.name}</div>
                            <div className="text-xs text-brown-600">{product.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-brown-900 font-medium">
                          {product.category?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-brown-900">₹{product.price}</div>
                        {product.originalPrice && (
                          <div className="text-xs text-brown-500 line-through">
                            ₹{product.originalPrice}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-brown-900 font-medium">{product.availableStock ?? product.quantity ?? 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            product.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-brown-100 text-brown-800 hover:bg-brown-200'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/admin/products/${product._id}/edit`}
                            className="text-brown-800 hover:text-brown-900 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
