import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { isAuthenticated, removeToken, getUserInfo } from "../utils/auth";
import { cartAPI, categoryAPI, wishlistAPI } from "../utils/api";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [wishlistItemCount, setWishlistItemCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const userInfo = getUserInfo();

  useEffect(() => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    if (authStatus) {
      fetchCartCount();
      fetchWishlistCount();
    }
  }, []);

  useEffect(() => {
    const handleWishlistUpdated = () => {
      fetchWishlistCount();
    };
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdated);
  }, []);

  useEffect(() => {
    const handleCartUpdated = () => {
      fetchCartCount();
    };
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAllCategories();
        if (response.success) {
          const activeCategories = (response.data || [])
            .filter(cat => cat.isActive !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchCartCount = async () => {
    try {
      const response = await cartAPI.getCart();
      if (response.success && response.data) {
        const count = response.data.items?.length || 0;
        setCartItemCount(count);
      }
    } catch (err) {
      // Silently fail - user might not have cart yet
      console.error('Failed to fetch cart count:', err);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await wishlistAPI.getWishlist();
      if (response.success && response.data) {
        const count = response.data?.products?.length || 0;
        setWishlistItemCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist count:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    removeToken();
    setAuthenticated(false);
    setProfileOpen(false);
    navigate('/');
    window.location.reload();
  };

  const submitSearch = (term) => {
    const q = (term || '').trim();
    setMobileOpen(false);
    setMobileSearchOpen(false);
    if (!q) {
      navigate('/all-products');
      return;
    }
    navigate(`/all-products?search=${encodeURIComponent(q)}`);
  };

  const linkClass = ({ isActive }) =>
    `font-inter text-base sm:text-lg text-brown-700 hover:text-brown-900 transition-colors ${
      isActive ? "font-semibold text-brown-900" : ""
    }`;

  return (
    <header className="bg-brown-50 shadow-md sticky top-0 z-50 border-b border-brown-200">
      <nav className="container max-w-7xl 2xl:max-w-[1840px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-1.5 group"
            onClick={() => {
              setMobileOpen(false);
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }}
          >
            <img
              src="/70f4061b-c1e8-4815-95db-8e8906944dfc-removebg-preview.png"
              alt="Orvanta Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-all duration-200"
            />
            <span className="font-heading font-bold text-xl sm:text-2xl tracking-tight text-brown-900">
              Orvanta
            </span>
          </NavLink>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 flex-1 justify-center px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(searchTerm);
              }}
              className="flex-1 max-w-md"
              role="search"
              aria-label="Product search"
            >
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-24 py-2 rounded-lg border border-brown-200 bg-white text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-800 focus:border-brown-800"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        navigate('/all-products');
                      }}
                      className="px-2 py-1 text-xs rounded-md border border-brown-200 text-brown-700 hover:bg-brown-100"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm rounded-md bg-brown-800 text-white hover:bg-brown-900"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Cart, Wishlist Icons + Sign In/Sign Up Button + Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            {/* Cart and Wishlist Icons - Desktop Only */}
            {authenticated && (
              <div className="hidden md:flex items-center space-x-3">
                {/* Orders Icon */}
                <NavLink
                  to="/orders"
                  className="relative p-2 text-brown-700 hover:text-brown-600 transition-colors"
                  aria-label="My Orders"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </NavLink>

                {/* Wishlist Icon */}
                <NavLink
                  to="/wishlist"
                  className="relative p-2 text-brown-700 hover:text-brown-600 transition-colors"
                  aria-label="Wishlist"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
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
                  {wishlistItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brown-800 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                      {wishlistItemCount > 9 ? '9+' : wishlistItemCount}
                    </span>
                  )}
                </NavLink>

                {/* Cart Icon */}
                <NavLink
                  to="/cart"
                  className="relative p-2 text-brown-700 hover:text-brown-600 transition-colors"
                  aria-label="Shopping Cart"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brown-800 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </NavLink>
              </div>
            )}

            {/* Mobile Search Toggle */}
            <button
              type="button"
              className="md:hidden relative h-9 w-9 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-lg border border-brown-200 text-brown-700 hover:bg-brown-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brown-800 focus:ring-offset-2"
              aria-label={mobileSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((v) => !v)}
            >
              {mobileSearchOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              )}
            </button>

            {authenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="hidden md:flex items-center justify-center w-9 h-9 rounded-full bg-brown-800 text-white text-sm font-bold hover:bg-brown-900 transition-colors"
                  aria-label="Profile menu"
                >
                  {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-brown-800 text-white text-xs font-bold hover:bg-brown-900 transition-colors"
                  aria-label="Profile menu"
                >
                  {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-brown-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-brown-100">
                      <p className="text-sm font-bold text-brown-900 truncate">{userInfo?.name || 'User'}</p>
                      <p className="text-xs text-brown-500 truncate">{userInfo?.email || ''}</p>
                    </div>
                    <NavLink
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-brown-700 hover:bg-brown-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </NavLink>
                    <NavLink
                      to="/orders"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-brown-700 hover:bg-brown-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      My Orders
                    </NavLink>
                    <NavLink
                      to="/wishlist"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-brown-700 hover:bg-brown-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Wishlist
                    </NavLink>
                    <div className="border-t border-brown-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <NavLink
                  to="/signin"
                  className="hidden sm:inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-brown-800 text-white text-sm sm:text-base font-inter font-medium rounded-lg hover:bg-brown-900 transition-colors"
                >
                  Sign In / Sign Up
                </NavLink>
                <NavLink
                  to="/signin"
                  className="sm:hidden px-3 py-1.5 bg-brown-800 text-white text-xs font-inter font-medium rounded-lg hover:bg-brown-900 transition-colors"
                >
                  Sign In
                </NavLink>
              </>
            )}

            <button
              type="button"
              className="md:hidden relative h-9 w-9 sm:h-10 sm:w-10 inline-flex flex-col items-center justify-center rounded-lg border border-brown-200 text-brown-700 hover:bg-brown-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brown-800 focus:ring-offset-2"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <span
                className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen
                    ? "rotate-45 top-1/2 -translate-y-1/2"
                    : "top-2"
                }`}
              />
              <span
                className={`absolute top-1/2 -translate-y-1/2 block w-5 h-0.5 bg-current transition-opacity duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute block w-5 h-0.5 bg-current transition-all duration-300 ${
                  mobileOpen
                    ? "-rotate-45 top-1/2 -translate-y-1/2"
                    : "bottom-2"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Search (toggle) */}
        {mobileSearchOpen && (
          <div className="md:hidden mt-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch(searchTerm);
              }}
              role="search"
              aria-label="Product search"
            >
              <div className="relative">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="w-full pl-10 pr-24 py-2 rounded-lg border border-brown-200 bg-white text-brown-900 placeholder:text-brown-400 focus:outline-none focus:ring-2 focus:ring-brown-800 focus:border-brown-800"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                  </svg>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        navigate('/all-products');
                        setMobileSearchOpen(false);
                      }}
                      className="px-2 py-1 text-xs rounded-md border border-brown-200 text-brown-700 hover:bg-brown-100"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm rounded-md bg-brown-800 text-white hover:bg-brown-900"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen
              ? "max-h-[calc(100vh-80px)] opacity-100 mt-3"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="pt-3 pb-2 border-t border-brown-200 flex flex-col">
            {/* Categories Section */}
            <div className="border-t border-brown-200 pt-4 mb-4">
              <h3 className="text-sm font-semibold text-brown-900 mb-3 px-2">
                Categories
              </h3>
              <div className="max-h-[60vh] overflow-y-auto space-y-1">
                {categories.map((category) => (
                  <NavLink
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2 px-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-brown-50 text-brown-600 font-semibold"
                          : "text-brown-700 hover:bg-brown-50"
                      }`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded-md overflow-hidden bg-brown-100">
                      <img
                        src={category.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&q=80'}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&q=80'; }}
                      />
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {category.name}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Sign In - Mobile (non-authenticated only) */}
            {!authenticated && (
              <NavLink
                to="/signin"
                className="sm:hidden mt-2 px-4 py-2 bg-brown-800 text-white text-sm font-inter font-medium rounded-lg hover:bg-brown-900 transition-colors text-center block"
                onClick={() => setMobileOpen(false)}
              >
                Sign In / Sign Up
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
