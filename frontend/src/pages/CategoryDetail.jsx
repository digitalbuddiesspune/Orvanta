import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { productAPI, categoryAPI, cartAPI, wishlistAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import CategorySidebar from '../components/CategorySidebar';

// Helper function to convert title to URL slug
const titleToSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const CategoryDetail = () => {
  const { categorySlug, subcategorySlug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [cartProductIds, setCartProductIds] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState({});
  const [togglingWishlist, setTogglingWishlist] = useState({});
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterPopoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  // Filter and sort products
  const filteredProducts = (() => {
    let list = [...products];
    const minP = priceRange.min ? Number(priceRange.min) : 0;
    const maxP = priceRange.max ? Number(priceRange.max) : Infinity;
    list = list.filter((p) => {
      const price = p.price || 0;
      if (price < minP || (maxP < Infinity && price > maxP)) return false;
      return true;
    });
    if (sortBy === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (sortBy === 'discount') list.sort((a, b) => {
      const dA = a.originalPrice && a.originalPrice > a.price ? ((a.originalPrice - a.price) / a.originalPrice) * 100 : 0;
      const dB = b.originalPrice && b.originalPrice > b.price ? ((b.originalPrice - b.price) / b.originalPrice) * 100 : 0;
      return dB - dA;
    });
    return list;
  })();

  const hasActiveFilters = priceRange.min || priceRange.max || sortBy !== 'default';

  // Fetch all categories for sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await categoryAPI.getAllCategories();
        if (response.success) {
          // Filter only active categories and sort by order
          const activeCategories = (response.data || [])
            .filter(cat => cat.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Find and set the current category by slug
  useEffect(() => {
    if (categories.length > 0 && categorySlug) {
      const foundCategory = categories.find(
        (cat) => cat.slug === categorySlug
      );
      
      if (foundCategory) {
        setCategory(foundCategory);
        
        // If subcategory slug exists, find and set it
        if (subcategorySlug && foundCategory.subcategories && foundCategory.subcategories.length > 0) {
          const foundSubcategory = foundCategory.subcategories.find(
            (sub) => titleToSlug(sub) === subcategorySlug
          );
          if (foundSubcategory) {
            setSelectedSubcategory(foundSubcategory);
          }
        } else {
          setSelectedSubcategory(null);
        }
      } else {
        setCategory(null);
      }
    }
  }, [categorySlug, subcategorySlug, categories]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categorySlug) return;
      
      try {
        setLoading(true);
        const params = { limit: 500 };
        if (selectedSubcategory) {
          params.subcategory = selectedSubcategory;
        }
        const response = await productAPI.getProductsByCategory(categorySlug, params);
        if (response.success) {
          setProducts(response.data.products || []);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categorySlug, selectedSubcategory]);

  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!isAuthenticated() || products.length === 0) return;
      try {
        const response = await wishlistAPI.getWishlist();
        if (response.success && response.data) {
          const wishlistMap = {};
          const productsList = response.data.products || response.data;
          const arr = Array.isArray(productsList) ? productsList : [];
          arr.forEach((item) => {
            const id = item?._id || item?.product?._id || item?.product;
            if (id) wishlistMap[id] = true;
          });
          setWishlistItems(wishlistMap);
        }
      } catch (err) {
        console.error('Failed to fetch wishlist:', err);
      }
    };
    fetchWishlistStatus();
  }, [products]);

  useEffect(() => {
    const fetchCartProducts = async () => {
      if (!isAuthenticated() || products.length === 0) return;
      try {
        const response = await cartAPI.getCart();
        if (response.success && response.data?.items) {
          const ids = new Set();
          response.data.items.forEach((item) => {
            const pid = item.product?._id || item.product;
            if (pid) ids.add(pid.toString());
          });
          setCartProductIds(ids);
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    };
    fetchCartProducts();
  }, [products]);

  useEffect(() => {
    const handleCartUpdated = () => {
      if (isAuthenticated() && products.length > 0) {
        cartAPI.getCart().then((response) => {
          if (response.success && response.data?.items) {
            const ids = new Set();
            response.data.items.forEach((item) => {
              const pid = item.product?._id || item.product;
              if (pid) ids.add(pid.toString());
            });
            setCartProductIds(ids);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, [products]);

  useEffect(() => {
    const handleWishlistUpdated = () => {
      if (isAuthenticated() && products.length > 0) {
        wishlistAPI.getWishlist().then((response) => {
          if (response.success && response.data) {
            const wishlistMap = {};
            const productsList = response.data.products || response.data;
            const arr = Array.isArray(productsList) ? productsList : [];
            arr.forEach((item) => {
              const id = item?._id || item?.product?._id || item?.product;
              if (id) wishlistMap[id] = true;
            });
            setWishlistItems(wishlistMap);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdated);
  }, [products]);

  const handleWishlistToggle = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
    setTogglingWishlist((prev) => ({ ...prev, [productId]: true }));
    try {
      if (wishlistItems[productId]) {
        const response = await wishlistAPI.removeFromWishlist(productId);
        if (response.success) {
          setWishlistItems((prev) => ({ ...prev, [productId]: false }));
          window.dispatchEvent(new CustomEvent('wishlist-updated'));
        }
      } else {
        const response = await wishlistAPI.addToWishlist(productId);
        if (response.success) {
          setWishlistItems((prev) => ({ ...prev, [productId]: true }));
          window.dispatchEvent(new CustomEvent('wishlist-updated'));
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setTogglingWishlist((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Show loading while fetching categories
  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading category...</p>
        </div>
      </div>
    );
  }

  // Show error if category not found after categories are loaded
  if (!categoriesLoading && !category) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brown-900 mb-4">Category Not Found</h2>
          <Link
            to="/"
            className="text-brown-600 hover:text-brown-700 font-semibold"
          >
            Go back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Don't render if category is still null
  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-brown-50">
      {/* Breadcrumb */}
      <div className="bg-brown-50 border-b border-brown-200 sticky top-0 z-40">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-brown-500 hover:text-brown-700 truncate">
              Home
            </Link>
            <span className="text-brown-400">/</span>
            <Link to="/" className="text-brown-500 hover:text-brown-700 truncate">
              Categories
            </Link>
            <span className="text-brown-400">/</span>
            <Link 
              to={`/category/${categorySlug}`} 
              className="text-brown-500 hover:text-brown-700 truncate max-w-[120px] sm:max-w-none"
            >
              {category.name}
            </Link>
            {selectedSubcategory && (
              <>
                <span className="text-brown-400">/</span>
                <span className="text-brown-900 font-semibold truncate max-w-[120px] sm:max-w-none">
                  {selectedSubcategory}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <CategorySidebar
            categories={categories}
            loading={categoriesLoading}
            activeSlug={categorySlug}
            showOnMobile={false}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {/* Subcategories and Products Section */}
            <section>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="mb-4 sm:mb-6 md:mb-8">
                  {/* Subcategories Grid */}
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    <Link
                      to={`/category/${categorySlug}`}
                      className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 rounded-sm sm:rounded-md border transition-all text-center cursor-pointer shadow-sm text-[10px] sm:text-xs ${
                        !selectedSubcategory
                          ? 'bg-brown-800 text-white border-brown-800 font-semibold'
                          : 'bg-white text-brown-900 border-brown-300 hover:border-brown-800 hover:bg-brown-50 font-semibold'
                      }`}
                    >
                      All
                    </Link>
                    {category.subcategories.map((subcategory) => {
                      const isActive = selectedSubcategory === subcategory;
                      return (
                        <Link
                          key={subcategory}
                          to={`/category/${categorySlug}/${titleToSlug(subcategory)}`}
                          className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1.5 rounded-sm sm:rounded-md border transition-all text-center cursor-pointer shadow-sm text-[10px] sm:text-xs ${
                            isActive
                              ? 'bg-brown-800 text-white border-brown-800 font-semibold'
                              : 'bg-white text-brown-900 border-brown-300 hover:border-brown-800 hover:bg-brown-50 font-semibold'
                          }`}
                        >
                          {subcategory}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Products Section Header with Filters button on right */}
              <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-brown-900 min-w-0">
                  {selectedSubcategory
                    ? `Products in ${selectedSubcategory}` 
                    : `Products in ${category.name}`
                  }
                  {hasActiveFilters && (
                    <span className="ml-2 text-base sm:text-lg font-normal text-brown-600">
                      ({filteredProducts.length} results)
                    </span>
                  )}
                </h2>
                {/* Filters button - always right side */}
                <div className="relative flex shrink-0 self-end sm:self-auto" ref={filterPopoverRef}>
                  <button
                    type="button"
                    onClick={() => setFilterOpen((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                      filterOpen || hasActiveFilters
                        ? 'bg-brown-800 text-white border-brown-800'
                        : 'bg-white text-brown-700 border-brown-200 hover:bg-brown-50 hover:border-brown-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-white/25 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {[priceRange.min, priceRange.max, sortBy !== 'default'].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                  {/* Popover filter box - fixed center on mobile, dropdown on desktop */}
                  {filterOpen && (
                    <>
                      <div className="fixed inset-0 bg-black/30 z-40 sm:hidden" onClick={() => setFilterOpen(false)} aria-hidden="true" />
                      <div className="fixed left-4 right-4 top-1/2 -translate-y-1/2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:translate-y-0 sm:w-80 max-h-[85vh] overflow-y-auto bg-white rounded-xl border border-brown-200 shadow-xl z-50 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-brown-900">Filters</span>
                        <button
                          type="button"
                          onClick={() => setFilterOpen(false)}
                          className="p-1.5 rounded-lg text-brown-500 hover:bg-brown-100 hover:text-brown-700 transition-colors"
                          aria-label="Close filters"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        {/* Price Range */}
                        <div>
                          <label className="block text-sm font-semibold text-brown-800 mb-2">Price Range (₹)</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              placeholder="Min"
                              min="0"
                              value={priceRange.min}
                              onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                              className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:ring-2 focus:ring-brown-800 focus:border-brown-800"
                            />
                            <span className="text-brown-400">-</span>
                            <input
                              type="number"
                              placeholder="Max"
                              min="0"
                              value={priceRange.max}
                              onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                              className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:ring-2 focus:ring-brown-800 focus:border-brown-800"
                            />
                          </div>
                        </div>
                        {/* Sort */}
                        <div>
                          <label className="block text-sm font-semibold text-brown-800 mb-2">Sort By</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-brown-200 rounded-lg text-sm focus:ring-2 focus:ring-brown-800 focus:border-brown-800 bg-white"
                          >
                            <option value="default">Default</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="discount">Best Discounts</option>
                            <option value="newest">Newest First</option>
                          </select>
                        </div>
                        {/* Clear Filters */}
                        <button
                          type="button"
                          onClick={() => {
                            setPriceRange({ min: '', max: '' });
                            setSortBy('default');
                          }}
                          className="w-full px-4 py-2 text-sm font-semibold text-brown-700 bg-brown-100 hover:bg-brown-200 rounded-lg transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Products Section */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
                    <p className="mt-4 text-brown-600">Loading products...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-brown-600 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-brown-600">No products found in this category</p>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-brown-600">No products match your filters</p>
                    <button
                      onClick={() => {
                        setPriceRange({ min: '', max: '' });
                        setSortBy('default');
                      }}
                      className="mt-3 px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900 text-sm font-semibold"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-5 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const discount = product.originalPrice && product.originalPrice > product.price 
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;
                    return (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug}`}
                      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-brown-200 overflow-hidden transform hover:-translate-y-1 flex flex-col h-full"
                    >
                      <div className="aspect-square bg-gradient-to-br from-brown-50 to-brown-100 overflow-hidden relative flex-shrink-0">
                        {discount > 0 && (
                          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 bg-brown-50 text-brown-600 border border-brown-200 text-[8px] sm:text-[10px] md:text-xs font-bold px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 rounded-full shadow-lg whitespace-nowrap">
                            {discount}% OFF
                          </div>
                        )}
                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, product._id)}
                          disabled={togglingWishlist[product._id]}
                          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-white rounded-full shadow-md flex items-center justify-center transition-colors border border-brown-200 disabled:opacity-50 ${
                            wishlistItems[product._id] ? 'bg-brown-50' : 'hover:bg-brown-50'
                          }`}
                          aria-label={wishlistItems[product._id] ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          <svg
                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-[18px] md:h-[18px] ${
                              wishlistItems[product._id] ? 'text-red-500 fill-red-500' : 'text-brown-600'
                            }`}
                            fill={wishlistItems[product._id] ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="h-full w-full flex items-center justify-center text-brown-400" style={{ display: product.images && product.images.length > 0 ? 'none' : 'flex' }}>
                          <svg
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-end bg-gradient-to-b from-brown-100 to-brown-50">
                        <h3 className="text-sm sm:text-base font-bold text-brown-900 mb-1.5 line-clamp-2 group-hover:text-brown-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg sm:text-xl font-bold text-brown-900">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <>
                                <span className="text-sm text-brown-400 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              </>
                            )}
                          </div>
                          {cartProductIds.has(product._id) ? (
                            <div className="w-full px-3 py-2 bg-brown-100 text-brown-700 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Already in cart
                            </div>
                          ) : (
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                if (!isAuthenticated()) {
                                  navigate('/signin');
                                  return;
                                }
                                setAddingToCart({ ...addingToCart, [product._id]: true });
                                try {
                                  const response = await cartAPI.addToCart(product._id, 1);
                                  if (response.success) {
                                    setCartProductIds((prev) => new Set(prev).add(product._id));
                                    window.dispatchEvent(new CustomEvent('cart-updated'));
                                    alert('Product added to cart!');
                                  } else {
                                    alert('Failed to add product to cart. Please try again.');
                                  }
                                } catch (err) {
                                  if (err.response?.status === 401) {
                                    navigate('/signin');
                                  } else {
                                    alert(err.response?.data?.message || 'Failed to add product to cart. Please try again.');
                                  }
                                } finally {
                                  setAddingToCart({ ...addingToCart, [product._id]: false });
                                }
                              }}
                              disabled={addingToCart[product._id]}
                              className="w-full px-3 py-2 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                            </button>
                          )}
                        </div>
                      </div>
                    </Link>
                  )})}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;

