import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUser,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiShoppingCart,
  FiMapPin,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiDownload,
  FiCalendar,
  FiUserPlus,
  FiCheck,
  FiList,
  FiCreditCard,
  FiEye,
} from 'react-icons/fi';
import { productAPI, categoryAPI, userAPI, orderAPI } from '../../utils/api';
import Invoice from '../../components/Invoice';
import { downloadInvoicePdf } from '../../utils/downloadInvoicePdf';
import {
  buildAdminInvoicePayload,
  getCustomerShippingAddress,
  isCompleteShippingAddress,
  GST_RATE,
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_CHARGE,
} from '../../utils/buildAdminInvoice';

const parsePrice = (product) => {
  if (product?.price && Number(product.price) > 0) return Number(product.price);
  if (product?.originalPrice && Number(product.originalPrice) > 0) return Number(product.originalPrice);
  return 0;
};

const getProductTitle = (p) => p?.name || p?.title || 'Product';

const todayDateInputValue = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const initialNewCustomerForm = {
  name: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

const AdminInvoiceGenerator = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Customer Management
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'new'
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [manualCustomers, setManualCustomers] = useState([]);
  const [newCustomerForm, setNewCustomerForm] = useState(initialNewCustomerForm);
  const [newCustomerError, setNewCustomerError] = useState('');

  // Product Selection
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Invoice Configuration
  const [lineItems, setLineItems] = useState([]);
  const [shippingOverride, setShippingOverride] = useState(null);
  const [includeGst, setIncludeGst] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Manual');
  const [invoiceDate, setInvoiceDate] = useState(todayDateInputValue);
  const [showPreview, setShowPreview] = useState(false);

  // Export State
  const [invoiceData, setInvoiceData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [exportKey, setExportKey] = useState(0);
  const [exportAction, setExportAction] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [createSuccess, setCreateSuccess] = useState('');
  const invoiceRef = useRef(null);

  // Load Categories, Products, Users, and Past Orders
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [catRes, prodRes, usersRes, ordersRes] = await Promise.allSettled([
          categoryAPI.getAllCategories(),
          productAPI.getAllProducts({ limit: 200 }),
          userAPI.getAllUsers(),
          orderAPI.getAllOrdersAdmin(),
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.success) {
          setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : []);
        }
        if (prodRes.status === 'fulfilled') {
          const val = prodRes.value;
          const pList =
            val?.data?.products ||
            (Array.isArray(val?.data) ? val.data : null) ||
            val?.products ||
            (Array.isArray(val) ? val : []);
          setProducts(Array.isArray(pList) ? pList : []);
        }
        if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
          setUsers(Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
        }
        if (ordersRes.status === 'fulfilled' && ordersRes.value?.success) {
          setOrders(Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []);
        }
      } catch (e) {
        setError(e.message || 'Failed to load store data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Consolidate unique customers from users, orders, and manual entries
  const customers = useMemo(() => {
    const map = new Map();

    // 1. Manual customers first
    manualCustomers.forEach((c) => {
      map.set(c.id, c);
    });

    // 2. Customers with addresses from orders
    orders.forEach((ord) => {
      const u = ord.user;
      const addr = ord.shippingAddress;
      const key = ord.user?._id || ord.user?.email || ord.shippingAddress?.phone;
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          id: String(key),
          name: addr?.fullName || u?.name || 'Customer',
          email: u?.email || '',
          phone: addr?.phone || u?.phone || '',
          address: {
            fullName: addr?.fullName || u?.name || '',
            phone: addr?.phone || u?.phone || '',
            addressLine1: addr?.addressLine1 || '',
            addressLine2: addr?.addressLine2 || '',
            city: addr?.city || '',
            state: addr?.state || '',
            pincode: addr?.pincode || '',
          },
        });
      }
    });

    // 3. Registered users
    users.forEach((u) => {
      const key = String(u._id || u.id);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: u.name || 'User',
          email: u.email || '',
          phone: u.phone || '',
          address: {
            fullName: u.name || '',
            phone: u.phone || '',
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            pincode: '',
          },
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '')
    );
  }, [orders, users, manualCustomers]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q)
    );
  }, [customers, customerSearch]);

  // Handle adding a new customer manually
  const handleAddNewCustomer = (e) => {
    e?.preventDefault?.();
    setNewCustomerError('');

    const { name, phone, addressLine1, addressLine2, city, state, pincode, email } = newCustomerForm;

    if (!name.trim()) {
      setNewCustomerError('Customer / Business Name is required');
      return;
    }
    if (!phone.trim()) {
      setNewCustomerError('Phone number is required');
      return;
    }
    if (!addressLine1.trim()) {
      setNewCustomerError('Address is required');
      return;
    }
    if (!city.trim()) {
      setNewCustomerError('City is required');
      return;
    }
    if (!state.trim()) {
      setNewCustomerError('State is required');
      return;
    }
    if (!pincode.trim()) {
      setNewCustomerError('Pincode is required');
      return;
    }

    const newCustObj = {
      id: `manual_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: {
        fullName: name.trim(),
        phone: phone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      isManual: true,
    };

    setManualCustomers((prev) => [newCustObj, ...prev]);
    setSelectedCustomer(newCustObj);
    setCustomerMode('existing');
    setNewCustomerForm(initialNewCustomerForm);
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    if (selectedCategory) {
      list = list.filter((p) => {
        const catId = p.category?._id || p.category;
        const catName = p.category?.name || '';
        return (
          catId === selectedCategory ||
          catName.toLowerCase() === selectedCategory.toLowerCase()
        );
      });
    }

    const q = productSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => getProductTitle(p).toLowerCase().includes(q));
    }

    return list.slice(0, 50);
  }, [products, selectedCategory, productSearch]);

  // Financial calculations
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [lineItems]
  );

  const gst = includeGst ? Math.round(subtotal * (GST_RATE / 100)) : 0;
  const autoShipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_CHARGE;
  const shipping = shippingOverride !== null ? Number(shippingOverride) : autoShipping;
  const total = subtotal + gst + shipping;

  const addedProductIds = useMemo(
    () => new Set(lineItems.map((i) => String(i.productId))),
    [lineItems]
  );

  const addProduct = (product) => {
    if (addedProductIds.has(String(product._id))) return;

    const price = parsePrice(product);
    setLineItems((items) => [
      ...items,
      {
        productId: product._id,
        product,
        name: getProductTitle(product),
        quantity: 1,
        price,
      },
    ]);
  };

  const updateQuantity = (productId, quantity) => {
    const qty = Math.max(1, Number(quantity) || 1);
    setLineItems((items) =>
      items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const updatePrice = (productId, newPrice) => {
    const p = Math.max(0, Number(newPrice) || 0);
    setLineItems((items) =>
      items.map((i) => (i.productId === productId ? { ...i, price: p } : i))
    );
  };

  const removeLineItem = (productId) => {
    setLineItems((items) => items.filter((i) => i.productId !== productId));
  };

  const getInvoicePayload = () =>
    buildAdminInvoicePayload({
      selectedCustomer,
      lineItems,
      subtotal,
      gst,
      shipping,
      total,
      invoiceDate,
      paymentMethod,
      createdOrder,
    });

  const billFingerprint = useMemo(
    () =>
      JSON.stringify({
        customerId: selectedCustomer?.id || '',
        items: lineItems.map((i) => ({
          id: i.productId,
          qty: i.quantity,
          price: i.price,
        })),
        paymentMethod,
        includeGst,
        shipping,
        invoiceDate,
      }),
    [selectedCustomer?.id, lineItems, paymentMethod, includeGst, shipping, invoiceDate]
  );

  useEffect(() => {
    if (createdOrder && createdOrder._billFingerprint !== billFingerprint) {
      setCreatedOrder(null);
      setCreateSuccess('');
    }
  }, [billFingerprint, createdOrder]);

  const queueExport = (action, payload) => {
    setInvoiceData(payload);
    setExportAction(action);
    setExportKey((k) => k + 1);
  };

  const handleCreateOrder = async () => {
    if (!selectedCustomer) {
      alert('Please select or add a customer');
      return;
    }
    if (!lineItems.length) {
      alert('Please add at least one product');
      return;
    }

    const shippingAddress = getCustomerShippingAddress(selectedCustomer);
    if (!isCompleteShippingAddress(shippingAddress)) {
      alert(
        'Complete customer address is required (name, phone, address, city, state, pincode). Use + Add New if the selected customer is missing address details.'
      );
      return;
    }

    setCreatingOrder(true);
    setError('');
    setCreateSuccess('');

    try {
      const response = await orderAPI.createAdminOrder({
        userId: selectedCustomer.isManual ? undefined : selectedCustomer.id,
        customer: {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
        },
        shippingAddress,
        items: lineItems.map((item) => ({
          productId: item.productId,
          name: item.name || item.product?.name,
          image: item.product?.images?.[0] || item.product?.image || '',
          price: item.price,
          quantity: item.quantity,
        })),
        paymentMethod,
        shippingCost: shipping,
        gstAmount: gst,
        gstRate: GST_RATE,
        invoiceDate,
      });

      if (!response?.success || !response.data) {
        throw new Error(response?.message || 'Failed to create order');
      }

      const saved = { ...response.data, _billFingerprint: billFingerprint };
      setCreatedOrder(saved);
      setOrders((prev) => [response.data, ...prev]);
      setCreateSuccess(
        `Order ${response.data.orderNumber || ''} saved. It will now appear in Orders.`
      );
    } catch (err) {
      console.error('Create admin order error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleDownload = () => {
    if (!createdOrder) {
      alert('Create the order first, then download the PDF.');
      return;
    }
    const result = getInvoicePayload();
    if (result.error) {
      alert(result.error);
      return;
    }
    queueExport('download', result.payload);
  };

  useEffect(() => {
    if (!exportAction || !invoiceData || exportKey === 0) return;

    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 800));
      if (cancelled || !invoiceRef.current) return;

      if (exportAction === 'download') {
        setDownloading(true);
        try {
          await downloadInvoicePdf(
            invoiceRef.current,
            `Invoice-${invoiceData.invoiceNumber}.pdf`
          );
        } catch (err) {
          console.error('[Invoice PDF Error]', err);
          alert(`Failed to download PDF: ${err.message || 'Unknown error'}`);
        } finally {
          if (!cancelled) setDownloading(false);
        }
      }
    };

    run().finally(() => {
      if (!cancelled) setExportAction(null);
    });

    return () => {
      cancelled = true;
    };
  }, [exportKey, exportAction, invoiceData]);

  const canSubmit = selectedCustomer && lineItems.length > 0;

  const resetForm = () => {
    if (!window.confirm('Reset all fields and start a new invoice?')) return;
    setSelectedCustomer(null);
    setCustomerSearch('');
    setNewCustomerForm(initialNewCustomerForm);
    setCustomerMode('existing');
    setNewCustomerError('');
    setLineItems([]);
    setSelectedCategory('');
    setProductSearch('');
    setShippingOverride(null);
    setIncludeGst(true);
    setPaymentMethod('Manual');
    setInvoiceDate(todayDateInputValue());
    setInvoiceData(null);
    setShowPreview(false);
    setCreatedOrder(null);
    setCreateSuccess('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-brown-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brown-900 flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-brown-800 to-brown-900 text-white shadow-sm">
              <FiFileText className="w-6 h-6" />
            </span>
            Invoice / Bill Generator
          </h1>
          <p className="text-sm text-brown-600 mt-1">
            Create an order, then download the official tax invoice for Orvanta customers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brown-300 text-brown-700 hover:bg-brown-50 font-semibold text-sm transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            Reset Form
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Customer Selection & Product Search (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Customer Information */}
          <section className="bg-white border border-brown-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brown-800 to-brown-900 text-white flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <FiUser className="w-5 h-5 text-brown-200" />
                1. Customer Details
              </h3>
              <div className="flex items-center bg-white/10 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    customerMode === 'existing'
                      ? 'bg-white text-brown-900 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <FiList className="w-3.5 h-3.5" />
                  Select Existing
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    customerMode === 'new'
                      ? 'bg-white text-brown-900 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <FiUserPlus className="w-3.5 h-3.5" />
                  + Add New
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Existing Customers Mode */}
              {customerMode === 'existing' && (
                <div className="space-y-3">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                    <input
                      type="text"
                      placeholder="Search customer by name, email, or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-brown-200 rounded-xl focus:ring-2 focus:ring-brown-800/20 focus:border-brown-800 focus:outline-none text-sm text-brown-900"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto border border-brown-100 rounded-xl divide-y divide-brown-100">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <p className="text-sm text-brown-500">No customers found</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerMode('new');
                            if (customerSearch.trim()) {
                              setNewCustomerForm((prev) => ({
                                ...prev,
                                name: customerSearch.trim(),
                              }));
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brown-800 hover:text-brown-950 underline"
                        >
                          <FiUserPlus className="w-3.5 h-3.5" />
                          Create as new customer
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className={`w-full text-left p-3 hover:bg-brown-50/70 transition-colors flex items-center justify-between ${
                            selectedCustomer?.id === c.id
                              ? 'bg-brown-50 border-l-4 border-brown-800'
                              : ''
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-brown-900 text-sm flex items-center gap-2">
                              {c.name}
                              {c.isManual && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-brown-200 text-brown-900 font-bold rounded">
                                  Custom
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-brown-600">{c.email || 'No email'}</p>
                            <p className="text-xs text-brown-600">{c.phone || 'No phone'}</p>
                          </div>
                          {selectedCustomer?.id === c.id && (
                            <span className="text-brown-800 text-xs font-bold flex items-center gap-1">
                              <FiCheck className="w-4 h-4" /> Selected
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Add New Customer Mode */}
              {customerMode === 'new' && (
                <form
                  onSubmit={handleAddNewCustomer}
                  className="space-y-4 bg-brown-50/50 p-4 rounded-xl border border-brown-200"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-brown-200">
                    <h4 className="text-sm font-bold text-brown-900 flex items-center gap-2">
                      <FiUserPlus className="text-brown-800" />
                      Enter New Customer Details
                    </h4>
                    <span className="text-xs text-brown-500">* Required</span>
                  </div>

                  {newCustomerError && (
                    <div className="p-2.5 rounded-lg bg-red-100 border border-red-200 text-red-700 text-xs font-medium">
                      {newCustomerError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Customer / Business Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Priya Sharma / ABC Store"
                        value={newCustomerForm.name}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Phone / Mobile Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={newCustomerForm.phone}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. customer@example.com"
                        value={newCustomerForm.email}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Address Line 1 (Flat, House no., Street) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, Royal Palms, MG Road"
                        value={newCustomerForm.addressLine1}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, addressLine1: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Address Line 2 (Area, Landmark - Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Near City Mall"
                        value={newCustomerForm.addressLine2}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, addressLine2: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={newCustomerForm.city}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, city: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maharashtra"
                        value={newCustomerForm.state}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, state: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brown-800 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 400053"
                        value={newCustomerForm.pincode}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, pincode: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-brown-300 rounded-lg text-sm focus:border-brown-800 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-xl font-bold text-sm hover:from-brown-700 hover:to-brown-800 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <FiCheck className="w-4 h-4" />
                      Set Customer for Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerMode('existing')}
                      className="px-4 py-2.5 border border-brown-300 rounded-xl text-brown-700 font-semibold text-sm hover:bg-brown-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Selected Customer Card */}
              {selectedCustomer && (
                <div className="p-4 bg-brown-50 rounded-xl border border-brown-300 text-sm space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-brown-200">
                    <p className="font-bold text-brown-900 flex items-center gap-2">
                      <FiCheck className="text-green-600 w-4 h-4" />
                      Selected Customer
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="flex items-center gap-2 text-brown-900 font-semibold">
                    <FiUser className="w-4 h-4 text-brown-700 shrink-0" />
                    {selectedCustomer.name}
                  </p>
                  {selectedCustomer.email && (
                    <p className="flex items-center gap-2 text-brown-700">
                      <FiMail className="w-4 h-4 text-brown-700 shrink-0" />
                      {selectedCustomer.email}
                    </p>
                  )}
                  {selectedCustomer.phone && (
                    <p className="flex items-center gap-2 text-brown-700">
                      <FiPhone className="w-4 h-4 text-brown-700 shrink-0" />
                      {selectedCustomer.phone}
                    </p>
                  )}
                  {selectedCustomer.address && (
                    <div className="pt-2 border-t border-brown-200">
                      <p className="flex items-start gap-2 text-brown-700 text-xs">
                        <FiMapPin className="w-4 h-4 text-brown-700 shrink-0 mt-0.5" />
                        <span>
                          {[
                            selectedCustomer.address.addressLine1,
                            selectedCustomer.address.addressLine2,
                            selectedCustomer.address.city,
                            selectedCustomer.address.state,
                            selectedCustomer.address.pincode,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* STEP 2: Products Section */}
          <section className="bg-white border border-brown-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brown-800 to-brown-900 text-white">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <FiShoppingCart className="w-5 h-5 text-brown-200" />
                2. Select & Add Products
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-brown-200 rounded-xl text-sm focus:border-brown-800 focus:outline-none text-brown-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id || c.name} value={c._id || c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
                  <input
                    type="text"
                    placeholder="Search product..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-brown-200 rounded-xl focus:border-brown-800 focus:outline-none text-sm text-brown-900"
                  />
                </div>
              </div>

              {/* Product catalog list */}
              <div className="max-h-60 overflow-y-auto border border-brown-100 rounded-xl divide-y divide-brown-100">
                {filteredProducts.length === 0 ? (
                  <p className="p-4 text-sm text-brown-500 text-center">No products found</p>
                ) : (
                  filteredProducts.map((p) => {
                    const isAdded = addedProductIds.has(String(p._id));
                    const img = p.images?.[0] || p.image || '/70f4061b-c1e8-4815-95db-8e8906944dfc-removebg-preview.png';
                    const price = parsePrice(p);

                    return (
                      <div
                        key={p._id}
                        className="flex items-center justify-between gap-3 p-3 hover:bg-brown-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={img}
                            alt={getProductTitle(p)}
                            className="w-10 h-10 rounded-lg object-cover border border-brown-200 shrink-0"
                            onError={(e) => {
                              e.target.src = '/70f4061b-c1e8-4815-95db-8e8906944dfc-removebg-preview.png';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-brown-900 truncate">
                              {getProductTitle(p)}
                            </p>
                            <p className="text-xs text-brown-600">
                              ₹{price.toLocaleString('en-IN')}
                              {p.subcategory ? ` • ${p.subcategory}` : ''}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addProduct(p)}
                          disabled={isAdded}
                          className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isAdded
                              ? 'bg-brown-100 text-brown-400 cursor-not-allowed'
                              : 'bg-brown-800 text-white hover:bg-brown-900 shadow-sm'
                          }`}
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                          {isAdded ? 'Added' : 'Add to Bill'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Invoice Items & Bill Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-brown-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-brown-800 to-brown-900 text-white flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <FiFileText className="w-5 h-5 text-brown-200" />
                3. Invoice Summary
              </h3>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-semibold">
                {lineItems.length} {lineItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Line items list */}
              {lineItems.length === 0 ? (
                <div className="text-center py-8 text-brown-400 space-y-1">
                  <FiShoppingCart className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-sm font-medium">No items added to invoice</p>
                  <p className="text-xs">Select products from section 2 to build the bill</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {lineItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-brown-50/70 rounded-xl border border-brown-200/60 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-brown-900 leading-tight flex-1">
                          {getProductTitle(item.product)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.productId)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          title="Remove item"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-brown-600">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, e.target.value)}
                            className="w-14 px-1.5 py-1 border border-brown-300 rounded text-center text-xs font-semibold focus:outline-none focus:border-brown-800"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-brown-600">Rate: ₹</span>
                          <input
                            type="number"
                            min={0}
                            value={item.price}
                            onChange={(e) => updatePrice(item.productId, e.target.value)}
                            className="w-18 px-1.5 py-1 border border-brown-300 rounded text-right text-xs font-semibold focus:outline-none focus:border-brown-800"
                          />
                        </div>

                        <p className="font-bold text-brown-900 text-right min-w-[60px]">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bill Parameters */}
              <div className="pt-3 border-t border-brown-200 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-brown-700 flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5 text-brown-800" />
                    Invoice Date:
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="px-2.5 py-1 border border-brown-300 rounded-lg text-xs font-medium focus:border-brown-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-brown-700 flex items-center gap-1.5">
                    <FiCreditCard className="w-3.5 h-3.5 text-brown-800" />
                    Payment Method:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="px-2.5 py-1 border border-brown-300 rounded-lg text-xs font-medium focus:border-brown-800 focus:outline-none"
                  >
                    <option value="Manual">Manual / Direct Billing</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="Online">Online Payment</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-brown-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeGst}
                      onChange={(e) => setIncludeGst(e.target.checked)}
                      className="rounded border-brown-300 text-brown-800 focus:ring-brown-800"
                    />
                    Apply GST ({GST_RATE}%)
                  </label>
                  <span className="text-xs text-brown-500">
                    {includeGst ? `+₹${gst.toLocaleString('en-IN')}` : 'Excluded'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brown-700">Delivery / Shipping:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-brown-500">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={shippingOverride !== null ? shippingOverride : autoShipping}
                      onChange={(e) => setShippingOverride(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-brown-300 rounded-lg text-xs text-right font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Box */}
              <div className="bg-brown-900 text-brown-50 rounded-xl p-4 space-y-2 text-sm shadow-md">
                <div className="flex justify-between text-brown-300 text-xs">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {includeGst && (
                  <div className="flex justify-between text-brown-300 text-xs">
                    <span>GST ({GST_RATE}%)</span>
                    <span className="font-semibold text-white">₹{gst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-brown-300 text-xs">
                  <span>Shipping</span>
                  <span className="font-semibold text-white">
                    {shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-brown-700 text-base font-bold text-white">
                  <span>Grand Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                {!createdOrder ? (
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={!canSubmit || creatingOrder}
                    className="w-full py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-xl font-bold hover:from-brown-700 hover:to-brown-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md text-sm"
                  >
                    <FiCheck className="w-4 h-4" />
                    {creatingOrder ? 'Creating Order...' : 'Create this Order'}
                  </button>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-medium text-center space-y-1">
                      <p>{createSuccess || 'Order saved successfully.'}</p>
                      <Link
                        to="/admin/orders"
                        className="inline-block font-bold underline hover:text-green-950"
                      >
                        View in Orders
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="w-full py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-xl font-bold hover:from-brown-700 hover:to-brown-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md text-sm"
                    >
                      <FiDownload className="w-4 h-4" />
                      {downloading ? 'Creating PDF...' : 'Download PDF'}
                    </button>
                  </>
                )}
              </div>

              {canSubmit && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full py-2 text-xs font-semibold text-brown-800 hover:text-brown-950 flex items-center justify-center gap-1.5 underline"
                >
                  <FiEye className="w-3.5 h-3.5" />
                  {showPreview ? 'Hide On-Screen Preview' : 'Show On-Screen Invoice Preview'}
                </button>
              )}

              {!canSubmit && (
                <p className="text-[11px] text-center text-brown-500">
                  Select a customer and add at least one product to create this order
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* On-screen Preview Section */}
      {showPreview && canSubmit && (
        <section className="mt-8 bg-brown-100/50 p-6 rounded-2xl border border-brown-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold text-lg text-brown-900 flex items-center gap-2">
              <FiEye className="text-brown-800" />
              Live Invoice Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-xs font-bold text-brown-700 hover:text-brown-900 px-3 py-1 bg-white rounded-lg border border-brown-300"
            >
              Close Preview
            </button>
          </div>
          <Invoice
            order={getInvoicePayload().payload?.order}
            user={getInvoicePayload().payload?.user}
            totals={getInvoicePayload().payload?.totals}
            invoiceNumber={getInvoicePayload().payload?.invoiceNumber}
          />
        </section>
      )}

      {/* Off-screen invoice container for print & PDF download */}
      {invoiceData && (
        <div
          id="admin-invoice-print-area"
          ref={invoiceRef}
          className="admin-invoice-print-root"
          style={{ position: 'fixed', left: '-9999px', top: 0, width: '794px' }}
        >
          <Invoice
            order={invoiceData.order}
            user={invoiceData.user}
            totals={invoiceData.totals}
            invoiceNumber={invoiceData.invoiceNumber}
            forExport={true}
          />
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #admin-invoice-print-area,
          #admin-invoice-print-area * {
            visibility: visible !important;
          }
          #admin-invoice-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            opacity: 1 !important;
            z-index: 99999 !important;
            pointer-events: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminInvoiceGenerator;
