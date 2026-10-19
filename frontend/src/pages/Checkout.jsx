import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartAPI, orderAPI } from '../utils/api';
import { isAuthenticated, getUserInfo } from '../utils/auth';

const emptyAddress = (userInfo) => ({
  fullName: userInfo?.name || '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
});

const Checkout = () => {
  const navigate = useNavigate();
  const userInfo = getUserInfo();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [savedAddress, setSavedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(true);

  const [shippingAddress, setShippingAddress] = useState(() => emptyAddress(userInfo));
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchLastOrderAddress = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      if (response.success && response.data?.length > 0) {
        const lastOrder = response.data[0];
        const addr = lastOrder.shippingAddress;
        if (addr?.fullName && addr?.addressLine1 && addr?.city && addr?.state && addr?.pincode && addr?.phone) {
          setSavedAddress({
            fullName: addr.fullName || '',
            phone: addr.phone || '',
            addressLine1: addr.addressLine1 || '',
            addressLine2: addr.addressLine2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
          });
          setShippingAddress({
            fullName: addr.fullName || '',
            phone: addr.phone || '',
            addressLine1: addr.addressLine1 || '',
            addressLine2: addr.addressLine2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
          });
          setShowAddressForm(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch last order:', err);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      if (response.success) {
        if (!response.data?.items?.length) {
          navigate('/cart');
          return;
        }
        setCart(response.data);
        fetchLastOrderAddress();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        setError('Failed to load cart');
      }
    } finally {
      setLoading(false);
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
    return { basePrice, total: basePrice };
  };

  const calculateCartTotals = () => {
    if (!cart || !cart.items) return { subtotal: 0, total: 0 };
    let subtotal = 0;
    cart.items.forEach((item) => {
      if (item.product) {
        const priceDetails = calculateItemPrice(item.product, item.quantity);
        subtotal += priceDetails.basePrice;
      }
    });
    return { subtotal, total: subtotal };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleUseSavedAddress = () => {
    if (savedAddress) {
      setShippingAddress({ ...savedAddress });
      setShowAddressForm(false);
      setFormErrors({});
    }
  };

  const handleChangeAddress = () => {
    if (savedAddress) setShippingAddress({ ...savedAddress });
    setShowAddressForm(true);
    setFormErrors({});
  };

  const handleAddNewAddress = () => {
    setShippingAddress(emptyAddress(userInfo));
    setShowAddressForm(true);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!shippingAddress.fullName.trim()) errors.fullName = 'Full name is required';
    if (!shippingAddress.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(shippingAddress.phone.trim()))
      errors.phone = 'Enter a valid 10-digit phone number';
    if (!shippingAddress.addressLine1.trim()) errors.addressLine1 = 'Address is required';
    if (!shippingAddress.city.trim()) errors.city = 'City is required';
    if (!shippingAddress.state.trim()) errors.state = 'State is required';
    if (!shippingAddress.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(shippingAddress.pincode.trim()))
      errors.pincode = 'Enter a valid 6-digit pincode';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setPlacing(true);
    try {
      // 2.5 sec loading before placing order
      await new Promise((r) => setTimeout(r, 2500));

      const response = await orderAPI.placeOrder({
        shippingAddress,
        paymentMethod: 'COD',
      });

      if (response.success) {
        navigate(`/order-confirmation/${response.data._id}`);
      }
    } catch (err) {
      console.error('Place order error:', err);
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const cartTotals = calculateCartTotals();
  const items = cart?.items || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-brown-600 mb-4">{error}</p>
          <Link to="/cart" className="px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900">
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full px-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brown-500 transition-colors ${
      formErrors[field]
        ? 'border-red-400 bg-red-50'
        : 'border-brown-200 bg-white focus:border-brown-500'
    }`;

  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brown-500 mb-4">
          <Link to="/cart" className="hover:text-brown-800">Cart</Link>
          <span>/</span>
          <span className="text-brown-800 font-semibold">Checkout</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-brown-900 mb-4">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left: Shipping + Payment + Note */}
          <div className="lg:col-span-3 space-y-4">
            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-brown-200 p-4 sm:p-5">
              <h2 className="text-lg font-bold text-brown-900 mb-3">Shipping Address</h2>

              {savedAddress && !showAddressForm ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border-2 border-brown-200 bg-brown-50/50">
                    <p className="font-semibold text-brown-900">{shippingAddress.fullName}</p>
                    <p className="text-sm text-brown-600 mt-0.5">{shippingAddress.phone}</p>
                    <p className="text-sm text-brown-700 mt-1">
                      {shippingAddress.addressLine1}
                      {shippingAddress.addressLine2 && `, ${shippingAddress.addressLine2}`}
                    </p>
                    <p className="text-sm text-brown-700">
                      {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleChangeAddress}
                      className="px-4 py-2 text-sm font-semibold text-brown-800 bg-white border-2 border-brown-300 rounded-lg hover:bg-brown-50 transition-colors"
                    >
                      Change Address
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className="px-4 py-2 text-sm font-semibold text-brown-700 border border-brown-300 rounded-lg hover:bg-brown-50 transition-colors"
                    >
                      Add New Address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAddress && (
                    <button
                      type="button"
                      onClick={handleUseSavedAddress}
                      className="text-sm font-semibold text-brown-600 hover:text-brown-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Use saved address
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                    className={inputClass('fullName')}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && <p className="text-red-500 text-xs mt-0.5">{formErrors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                    className={inputClass('phone')}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-0.5">{formErrors.phone}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brown-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    className={inputClass('addressLine1')}
                    placeholder="House no., Building, Street"
                  />
                  {formErrors.addressLine1 && <p className="text-red-500 text-xs mt-0.5">{formErrors.addressLine1}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-brown-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border-2 border-brown-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-brown-500 transition-colors"
                    placeholder="Landmark, Area (optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleInputChange}
                    className={inputClass('city')}
                    placeholder="City"
                  />
                  {formErrors.city && <p className="text-red-500 text-xs mt-0.5">{formErrors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleInputChange}
                    className={inputClass('state')}
                    placeholder="State"
                  />
                  {formErrors.state && <p className="text-red-500 text-xs mt-0.5">{formErrors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brown-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingAddress.pincode}
                    onChange={handleInputChange}
                    className={inputClass('pincode')}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  {formErrors.pincode && <p className="text-red-500 text-xs mt-0.5">{formErrors.pincode}</p>}
                </div>
              </div>
                </div>
              )}
            </div>

            {/* Payment Method - COD only */}
            <div className="bg-white rounded-lg shadow-sm border border-brown-200 p-4 sm:p-5">
              <h2 className="text-lg font-bold text-brown-900 mb-3">Payment Method</h2>
              <div className="flex items-center gap-3 p-3 border-2 border-brown-600 bg-brown-50 rounded-lg">
                <svg className="w-5 h-5 text-brown-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-brown-900 text-sm">Cash on Delivery</p>
                  <p className="text-xs text-brown-500">Pay when you receive your order</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-brown-200 p-4 sm:p-5 sticky top-24">
              <h2 className="text-lg font-bold text-brown-900 mb-3">Order Summary</h2>

              <div className="space-y-2.5 mb-3 max-h-52 overflow-y-auto">
                {items.map((item) => {
                  if (!item.product) return null;
                  const priceDetails = calculateItemPrice(item.product, item.quantity);
                  return (
                    <div key={`${item.product._id}-${item.size}`} className="flex gap-2.5 pb-2.5 border-b border-brown-100 last:border-0">
                      <div className="w-12 h-12 flex-shrink-0 bg-brown-100 rounded-md overflow-hidden">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brown-400 text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brown-900 truncate">{item.product.name}</p>
                         <div className="flex justify-between items-center">
                          <p className="text-xs text-brown-500">
                            Qty: {item.quantity}{item.size ? ` | Size: ${item.size}` : ''}
                          </p>
                          <p className="text-sm font-bold text-brown-800">₹{priceDetails.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5 text-sm border-t border-brown-200 pt-3 mb-3">
                <div className="flex justify-between text-brown-700">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold">₹{cartTotals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brown-700">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-brown-700">
                  <span>Payment</span>
                  <span className="font-semibold">COD</span>
                </div>
              </div>

              <div className="border-t border-brown-200 pt-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-brown-900">Total</span>
                  <span className="text-xl font-bold text-brown-600">₹{cartTotals.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full px-4 py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Placing Order...
                  </span>
                ) : (
                  'Place Order (COD)'
                )}
              </button>

              <Link
                to="/cart"
                className="block w-full mt-2 text-center px-4 py-2 border-2 border-brown-300 text-brown-700 rounded-lg hover:bg-brown-50 font-semibold text-sm transition-colors"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
