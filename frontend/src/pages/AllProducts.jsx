import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryAPI, productAPI, cartAPI, wishlistAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import CategorySidebar from '../components/CategorySidebar';

const AllProducts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [cartProductIds, setCartProductIds] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState({});
  const [togglingWishlist, setTogglingWishlist] = useState({});

  // Fetch categories for sidebar
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const search = (searchParams.get('search') || '').trim();
        const params = { limit: 500 };
        if (search) params.search = search;
        const response = await productAPI.getAllProducts(params);
        if (response.success) {
          setProducts(response.data.products);
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
  }, [searchParams]);

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

  const searchValue = (searchParams.get('search') || '').trim();

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
            <span className="text-brown-900 font-semibold truncate">All Products</span>
          </nav>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          <CategorySidebar
            categories={categories}
            loading={categoriesLoading}
            activeSlug={null}
            showOnMobile={true}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brown-900 mb-2">
                {searchValue ? `Search: "${searchValue}"` : 'All Products'}
              </h1>
              <p className="text-sm sm:text-base text-brown-600">
                {searchValue ? 'Showing matching products' : 'Browse all products from all categories'}
              </p>
              {searchValue && (
                <div className="mt-3">
                  <button
                    onClick={() => setSearchParams({})}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-brown-200 text-brown-700 hover:bg-brown-100 transition-colors text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* Products from All Categories */}
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
                  <p className="text-brown-600">No products found</p>
                  {searchValue && (
                    <button
                      onClick={() => setSearchParams({})}
                      className="mt-4 px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-5 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
                {products.map((product) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;

