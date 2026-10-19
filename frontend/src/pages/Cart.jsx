import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        setCart(response.data);
      } else {
        setError('Failed to fetch cart');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        setError(err.message || 'Failed to fetch cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity, size = null) => {
    if (newQuantity < 1) return;
    
    const itemKey = `${productId}-${size}`;
    setUpdating({ ...updating, [itemKey]: true });
    try {
      const response = await cartAPI.updateCartItem(productId, newQuantity, size);
      if (response.success) {
        setCart(response.data);
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdating({ ...updating, [itemKey]: false });
    }
  };

  const handleRemoveItem = async (productId, size = null) => {
    if (!window.confirm('Are you sure you want to remove this item from cart?')) {
      return;
    }
    
    const itemKey = `${productId}-${size}`;
    setUpdating({ ...updating, [itemKey]: true });
    try {
      const response = await cartAPI.removeFromCart(productId, size);
      if (response.success) {
        setCart(response.data);
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert('Failed to remove item. Please try again.');
    } finally {
      setUpdating({ ...updating, [itemKey]: false });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }
    
    try {
      const response = await cartAPI.clearCart();
      if (response.success) {
        setCart(response.data);
        window.dispatchEvent(new CustomEvent('cart-updated'));
      }
    } catch (err) {
      console.error('Failed to clear cart:', err);
      alert('Failed to clear cart. Please try again.');
    }
  };

  const calculateItemPrice = (product, quantity) => {
    if (!product) return { basePrice: 0, total: 0 };
    
    const bulkOffer = product.bulkOffers
      ?.filter((offer) => quantity >= offer.minQty)
      .sort((a, b) => b.minQty - a.minQty)[0];
    
    let basePrice = 0;
    if (bulkOffer && quantity >= bulkOffer.minQty) {
      basePrice = bulkOffer.pricePerPiece * quantity;
    } else {
      basePrice = product.price * quantity;
    }
    
    return { basePrice, total: basePrice, bulkOffer };
  };

  const calculateCartTotals = () => {
    if (!cart || !cart.items) {
      return { subtotal: 0, total: 0 };
    }

    let subtotal = 0;

    cart.items.forEach((item) => {
      if (item.product) {
        const priceDetails = calculateItemPrice(item.product, item.quantity);
        subtotal += priceDetails.basePrice;
      }
    });

    return { subtotal, total: subtotal };
  };

  const cartTotals = calculateCartTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brown-600 mb-4">{error}</p>
          <button
            onClick={fetchCart}
            className="px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 md:py-8">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-brown-900 mb-4 sm:mb-6">
          Shopping Cart
        </h1>

        {isEmpty ? (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-12 text-center">
            <svg
              className="w-12 h-12 sm:w-20 sm:h-20 mx-auto text-brown-400 mb-3 sm:mb-4"
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
            <h2 className="text-lg sm:text-2xl font-bold text-brown-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-brown-600 mb-4 sm:mb-6 text-sm sm:text-base">
              Looks like you haven't added anything to your cart yet.
            </p>
            <Link
              to="/all-products"
              className="inline-block px-6 py-3 bg-brown-800 text-white rounded-lg hover:bg-brown-900 font-semibold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {items.map((item) => {
                if (!item.product) return null;
                const product = item.product;
                const priceDetails = calculateItemPrice(product, item.quantity);
                const discount = product.originalPrice && product.originalPrice > product.price
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={`${item.product._id}-${item.size}`}
                    className="bg-white rounded-lg shadow-md border border-brown-200 p-3 sm:p-6"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Product Image */}
                      <Link
                        to={`/product/${product.slug}`}
                        className="flex-shrink-0 w-20 h-20 sm:w-32 sm:h-32 bg-brown-100 rounded-lg overflow-hidden"
                      >
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain sm:object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brown-400">
                            <svg
                              className="w-12 h-12"
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
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/product/${product.slug}`}
                              className="text-sm sm:text-xl font-bold text-brown-900 hover:text-brown-600 line-clamp-2"
                            >
                              {product.name}
                            </Link>
                            {product.category && (
                              <Link
                                to={`/category/${product.category.slug}`}
                                className="text-xs sm:text-sm text-brown-500 hover:text-brown-600 block truncate"
                              >
                                {product.category.name}
                              </Link>
                            )}
                            {item.size && (
                              <span className="inline-block mt-0.5 text-[10px] sm:text-xs font-semibold text-brown-700 bg-brown-100 px-1.5 py-0.5 rounded">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(product._id, item.size)}
                            disabled={updating[`${product._id}-${item.size}`]}
                            className="flex-shrink-0 p-1 text-brown-400 hover:text-brown-600 transition-colors"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                          <span className="text-base sm:text-xl font-bold text-brown-900">₹{product.price}</span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className="text-xs sm:text-sm text-brown-400 line-through">₹{product.originalPrice}</span>
                              {discount > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-white bg-brown-800 rounded-full">
                                  {discount}% OFF
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Bulk Offer Info */}
                        {priceDetails.bulkOffer && item.quantity >= priceDetails.bulkOffer.minQty && (
                          <div className="mb-1 sm:mb-2">
                            <p className="text-[10px] sm:text-xs text-green-700 font-medium">
                              ✓ Bulk offer applied: ₹{priceDetails.bulkOffer.pricePerPiece}/{product.units || 'Piece'}
                            </p>
                          </div>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 sm:gap-4 mt-auto">
                          <span className="text-xs sm:text-sm font-semibold text-brown-700">Qty:</span>
                          <div className="flex items-center gap-0 border border-brown-300 sm:border-2 rounded-md sm:rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleUpdateQuantity(product._id, item.quantity - 1, item.size)}
                              disabled={updating[`${product._id}-${item.size}`] || item.quantity <= 1}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-brown-700 hover:bg-brown-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="px-2 sm:px-4 py-1 sm:py-1.5 text-brown-900 font-bold text-sm sm:text-base min-w-[2rem] sm:min-w-[3rem] text-center bg-white border-x border-brown-300">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(product._id, item.quantity + 1, item.size)}
                              disabled={updating[`${product._id}-${item.size}`]}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-brown-700 hover:bg-brown-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Cart Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearCart}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-brown-600 border border-brown-800 rounded-lg hover:bg-brown-50 font-semibold transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md border border-brown-200 p-4 sm:p-6 sticky top-24">
                <h2 className="text-lg sm:text-xl font-bold text-brown-900 mb-3 sm:mb-4">Order Summary</h2>
                
                <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <div className="flex justify-between text-sm sm:text-base text-brown-700">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'}):</span>
                    <span className="font-semibold">₹{cartTotals.subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-brown-200 pt-3 sm:pt-4 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base sm:text-lg font-bold text-brown-900">Total:</span>
                    <span className="text-xl sm:text-2xl font-bold text-brown-600">
                      ₹{cartTotals.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/all-products"
                  className="block w-full mt-2 sm:mt-3 text-center px-4 py-2 border-2 border-brown-300 text-brown-700 rounded-lg hover:bg-brown-50 font-semibold text-sm sm:text-base transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
