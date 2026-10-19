import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productAPI, cartAPI, wishlistAPI } from '../utils/api';
import { isAuthenticated } from '../utils/auth';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizes, setSizes] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [updatingWishlist, setUpdatingWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (imagePopupOpen) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e) => {
        if (e.key === 'Escape') setImagePopupOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [imagePopupOpen]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getProductBySlug(slug);
        if (response.success) {
          console.log('Product data:', response.data);
          console.log('Specifications:', response.data.specifications);
          setProduct(response.data);
          setSelectedImage(0);
          
          // Parse sizes from specifications
          if (response.data.specifications?.size) {
            const sizeStr = response.data.specifications.size;
            const parsedSizes = sizeStr.split(',').map(s => s.trim()).filter(s => s !== '');
            setSizes(parsedSizes);
          } else {
            setSizes([]);
          }

          // Set initial quantity based on minimumOrderableQuantity
          const minQty = response.data.minimumOrderableQuantity || 1;
          setQuantity(minQty);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product?.category) return;
      const categoryId = product.category._id || product.category;
      try {
        const response = await productAPI.getAllProducts({
          category: categoryId,
          subcategory: product.subcategory || undefined,
          limit: 9,
        });
        if (response.success) {
          const list = response.data?.products || [];
          const filtered = list.filter((p) => p._id !== product._id).slice(0, 8);
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error('Failed to fetch related products:', err);
      }
    };
    fetchRelated();
  }, [product]);

  useEffect(() => {
    const fetchCart = async () => {
      if (!product || !isAuthenticated()) return;
      try {
        const response = await cartAPI.getCart();
        if (response.success && response.data?.items) {
          setCartItems(response.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    };
    fetchCart();
  }, [product]);

  useEffect(() => {
    const handleCartUpdated = () => {
      if (product && isAuthenticated()) {
        cartAPI.getCart().then((response) => {
          if (response.success && response.data?.items) {
            setCartItems(response.data.items);
          }
        }).catch(() => {});
      }
    };
    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, [product]);

  const normSize = (s) => (s === '' || s === undefined || s === null) ? null : s;
  const isInCart = product && cartItems.some((item) => {
    const pid = item.product?._id || item.product;
    return pid?.toString() === product._id && normSize(item.size) === normSize(selectedSize);
  });

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!product || !isAuthenticated()) return;
      
      try {
        const response = await wishlistAPI.checkWishlist(product._id);
        if (response.success) {
          setIsInWishlist(response.isInWishlist);
        }
      } catch (err) {
        // Silently fail - user might not be authenticated
        console.error('Failed to check wishlist:', err);
      }
    };

    checkWishlist();
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    if (!product) return;

    // Check if size is required and selected
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size first');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartAPI.addToCart(product._id, quantity, selectedSize);
      if (response.success) {
        if (response.data?.items) setCartItems(response.data.items);
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
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    if (!product) return;

    setUpdatingWishlist(true);
    try {
      if (isInWishlist) {
        const response = await wishlistAPI.removeFromWishlist(product._id);
        if (response.success) {
          setIsInWishlist(false);
          window.dispatchEvent(new CustomEvent('wishlist-updated'));
        }
      } else {
        const response = await wishlistAPI.addToWishlist(product._id);
        if (response.success) {
          setIsInWishlist(true);
          window.dispatchEvent(new CustomEvent('wishlist-updated'));
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        alert(err.response?.data?.message || 'Failed to update wishlist. Please try again.');
      }
    } finally {
      setUpdatingWishlist(false);
    }
  };

  const handleQuantityChange = (change) => {
    if (!product) return;
    
    const incrementor = product.incrementor || 1;
    const minQty = product.minimumOrderableQuantity || 1;
    
    setQuantity((prev) => {
      // Calculate change based on incrementor
      const changeAmount = change * incrementor;
      let newQty = prev + changeAmount;
      
      // Ensure quantity is at least minimumOrderableQuantity
      if (newQty < minQty) {
        newQty = minQty;
      }
      
      // Ensure quantity is a multiple of incrementor (if incrementor > 1)
      if (incrementor > 1) {
        // Round to nearest multiple of incrementor
        newQty = Math.max(minQty, Math.round(newQty / incrementor) * incrementor);
      }
      
      return newQty;
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on Orvanta!`,
      url: url,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      // User cancelled or error occurred, try fallback
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          alert('Link copied to clipboard!');
        } catch (clipboardErr) {
          console.error('Failed to copy link:', clipboardErr);
        }
      }
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      navigate('/signin');
      return;
    }

    if (!product) return;

    // Check if size is required and selected
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size first');
      return;
    }

    setAddingToCart(true);
    try {
      const response = await cartAPI.addToCart(product._id, quantity, selectedSize);
      if (response.success) {
        navigate('/cart');
      } else {
        alert('Failed to process request. Please try again.');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/signin');
      } else {
        alert(err.response?.data?.message || 'Failed to process request. Please try again.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // Calculate minimum quantity and check if at minimum
  const minQuantity = product?.minimumOrderableQuantity || 1;
  const isMinQuantity = quantity <= minQuantity;
  const incrementor = product?.incrementor || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
          <p className="mt-4 text-brown-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-brown-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brown-900 mb-4">Product Not Found</h2>
          <p className="text-brown-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-brown-800 text-white rounded-lg hover:bg-brown-900"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Find the best bulk offer (highest minQty that user qualifies for)
  const bulkOffer = product.bulkOffers
    ?.filter((offer) => quantity >= offer.minQty)
    .sort((a, b) => b.minQty - a.minQty)[0];

  const calculateTotalPrice = () => {
    if (!product) return { basePrice: 0, total: 0 };
    
    let basePrice = 0;
    if (bulkOffer && quantity >= bulkOffer.minQty) {
      basePrice = bulkOffer.pricePerPiece * quantity;
    } else {
      basePrice = product.price * quantity;
    }
    
    return { basePrice, total: basePrice };
  };

  const priceDetails = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-brown-50">
      {/* Breadcrumb */}
      <div className="bg-brown-50 border-b border-brown-200 shadow-sm">
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-3 sm:py-4">
          <nav className="flex items-center flex-wrap gap-2 text-xs sm:text-sm">
            <Link to="/" className="text-brown-500 hover:text-brown-600 transition-colors font-medium">
              Home
            </Link>
            <svg className="w-4 h-4 text-brown-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {product.category && (
              <>
                <Link
                  to={`/category/${product.category.slug}`}
                  className="text-brown-500 hover:text-brown-600 transition-colors font-medium"
                >
                  {product.category.name}
                </Link>
                <svg className="w-4 h-4 text-brown-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-brown-900 font-bold truncate max-w-[200px] sm:max-w-none">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-lg shadow-md border border-brown-200">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 lg:gap-3 p-4 sm:p-6 lg:p-6">
            {/* Product Images - Sticky on desktop */}
            <div className="space-y-3 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2 lg:pb-4 max-w-full lg:max-w-sm mx-auto lg:mx-0">
              {/* Main Image */}
              <div className="relative w-full aspect-square bg-gradient-to-br from-brown-50 to-brown-100 rounded-lg overflow-hidden shadow-inner border border-brown-200 transition-all hover:shadow-md flex-shrink-0 group">
                {product.images && product.images.length > 0 ? (
                  <div
                    className="w-full h-full cursor-zoom-in flex items-center justify-center"
                    onClick={() => setImagePopupOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setImagePopupOpen(true)}
                    aria-label="View image larger"
                  >
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-brown-400">
                    <svg
                      className="w-24 h-24"
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
                
                {/* Wishlist and Share Icons */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-row gap-1.5 sm:gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                  {/* Wishlist Button */}
                  <button
                    onClick={handleWishlistToggle}
                    disabled={updatingWishlist}
                    className={`w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center transition-colors border border-brown-200 disabled:opacity-50 ${
                      isInWishlist ? 'bg-brown-50 border-brown-200' : 'hover:bg-brown-50'
                    }`}
                    aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <svg
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isInWishlist ? 'text-brown-600 fill-brown-600' : 'text-brown-700 hover:text-brown-600'
                      }`}
                      fill={isInWishlist ? 'currentColor' : 'none'}
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
                  
                  {/* Share Button */}
                  <button
                    onClick={handleShare}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-brown-50 transition-colors border border-brown-200"
                    aria-label="Share Product"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-brown-700 hover:text-brown-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 flex-shrink-0 max-w-full lg:max-w-md mx-auto lg:mx-0">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-full aspect-square rounded-md overflow-hidden border-2 bg-brown-50 flex items-center justify-center p-1 transition-all duration-200 ${
                        selectedImage === index
                          ? 'border-brown-800 ring-1 ring-brown-200 shadow-sm'
                          : 'border-brown-200 hover:border-brown-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-5">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brown-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                {product.category && (
                  <Link
                    to={`/category/${product.category.slug}`}
                    className="inline-flex items-center text-brown-600 hover:text-brown-700 text-xs font-medium transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {product.category.name}
                  </Link>
                )}
              </div>

              {/* Price */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-brown-900">
                    ₹{product.price}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xl text-brown-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold text-white bg-brown-800 rounded-full">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {/* All Bulk Offers */}
                {product.bulkOffers && product.bulkOffers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-brown-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Bulk Offers
                    </h4>
                    <div className="space-y-2">
                      {product.bulkOffers
                        .sort((a, b) => b.minQty - a.minQty)
                        .map((offer, index) => {
                          const isActive = quantity >= offer.minQty;
                          return (
                            <div
                              key={index}
                              className={`border rounded-lg p-2.5 transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                                  : 'bg-brown-50 border-brown-200'
                              }`}
                            >
                              <p className={`text-xs ${isActive ? 'text-green-900' : 'text-brown-700'}`}>
                                <span className="font-semibold">
                                  Buy {offer.minQty} Pieces or more
                                </span>
                                {' at '}
                                <span className="font-bold">₹{offer.pricePerPiece}/Piece</span>
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Description with Specifications */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-brown-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Description
                  </h3>
                  
                  {/* Product Description */}
                  {product.description && (
                    <div className="mb-4">
                      <p className="text-sm text-brown-700 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Specifications */}
                {product.specifications && (
                  <div>
                    <h3 className="text-lg font-bold text-brown-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Specifications
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {/* Standard Fields */}
                      {product.specifications.color && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Color:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.color}</span>
                        </div>
                      )}
                      {product.specifications.material && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Material:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.material}</span>
                        </div>
                      )}
                      {product.specifications.size && typeof product.specifications.size === 'string' && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Size:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.size}</span>
                        </div>
                      )}
                      {product.specifications.brand && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Brand:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.brand}</span>
                        </div>
                      )}
                      {product.specifications.fit && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Fit:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.fit}</span>
                        </div>
                      )}
                      {product.specifications.pattern && (
                        <div className="flex items-center gap-2">
                          <span className="text-brown-900 font-semibold text-xs">Pattern:</span>
                          <span className="text-brown-600 font-medium text-sm">{product.specifications.pattern}</span>
                        </div>
                      )}
                      {/* Custom / legacy fields */}
                      {Object.keys(product.specifications)
                        .filter(key => {
                          const value = product.specifications[key];
                          const standardFields = ['color', 'material', 'size', 'brand', 'fit', 'pattern'];
                          return !standardFields.includes(key) && value && typeof value !== 'object' && String(value).trim() !== '';
                        })
                        .map(key => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-brown-900 font-semibold text-xs capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="text-brown-600 font-medium text-sm">{product.specifications[key]}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Features */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-brown-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Key Features
                    </h3>
                    <div>
                      <ul className="space-y-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="text-sm text-brown-700 flex items-start gap-2">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4 pt-4 border-t border-brown-200">
                {/* Stock Status */}
                {(product.availableStock !== undefined || product.stockStatus !== undefined || product.quantity !== undefined) && (
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Determine stock status: check stockStatus first, then availableStock, then quantity
                      let isInStock = false;
                      let stockCount = 0;
                      
                      if (product.stockStatus === 'outofstock') {
                        isInStock = false;
                      } else if (product.stockStatus === 'instock') {
                        isInStock = true;
                        stockCount = product.availableStock !== undefined ? product.availableStock : (product.quantity || 0);
                      } else {
                        // If stockStatus is not set, check availableStock or quantity
                        stockCount = product.availableStock !== undefined ? product.availableStock : (product.quantity || 0);
                        isInStock = stockCount > 0;
                      }
                      
                      return isInStock ? (
                        <>
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-600 font-semibold text-sm">
                            In Stock
                          </span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-brown-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-brown-600 font-semibold text-sm">Out of Stock</span>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Size Selection */}
                {sizes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-brown-700">Select Size:</span>
                      {selectedSize && (
                        <span className="text-xs font-medium text-brown-500 bg-brown-100 px-2 py-0.5 rounded">
                          Selected: {selectedSize}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[3rem] h-10 px-3 rounded-md border-2 font-bold text-sm transition-all ${
                            selectedSize === size
                              ? 'border-brown-800 bg-brown-800 text-white shadow-md'
                              : 'border-brown-200 bg-white text-brown-700 hover:border-brown-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brown-700">Quantity:</span>
                  <div className="flex items-center gap-0 border-2 border-brown-300 rounded-lg overflow-hidden">
                    {!isMinQuantity && (
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        className="px-3 py-2 text-brown-700 hover:bg-brown-100 hover:text-brown-900 font-bold transition-colors active:bg-brown-200"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                        </svg>
                      </button>
                    )}
                    <span className={`px-4 py-2 text-brown-900 font-bold text-base min-w-[3rem] text-center bg-white ${!isMinQuantity ? 'border-x' : 'border-l'} border-brown-300`}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-2 text-brown-700 hover:bg-brown-100 hover:text-brown-900 font-bold transition-colors active:bg-brown-200"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Incrementor Info */}
                {incrementor > 1 && (
                  <p className="text-xs text-brown-500 italic">
                    * This product can only be ordered in multiples of {incrementor}
                  </p>
                )}

                {/* Total Price */}
                <div className="bg-gradient-to-r from-brown-50 to-brown-50 rounded-lg p-3 border border-brown-100">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-brown-900">Total Price:</span>
                      <span className="text-2xl font-bold text-brown-600">₹{priceDetails.total.toFixed(2)}</span>
                    </div>
                    {bulkOffer && quantity >= bulkOffer.minQty && (
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        ✓ Bulk offer applied: ₹{bulkOffer.pricePerPiece}/piece
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row gap-2 sm:gap-3">
                  {isInCart ? (
                    <div className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-brown-100 text-brown-700 rounded-lg font-bold text-xs sm:text-sm md:text-base flex items-center justify-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Already in cart
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-lg hover:from-brown-900 hover:to-brown-900 font-bold text-xs sm:text-sm md:text-base shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                    </button>
                  )}
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-2 border-brown-800 text-brown-600 rounded-lg hover:bg-brown-800 hover:text-white font-bold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Buy Now</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-7xl 2xl:max-w-[1840px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12 border-t border-brown-200">
          <h2 className="text-xl sm:text-2xl font-bold text-brown-900 mb-4 md:mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {relatedProducts.map((p) => {
              const discount = p.originalPrice && p.originalPrice > p.price
                ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                : 0;
              return (
                <Link
                  key={p._id}
                  to={`/product/${p.slug}`}
                  className="group bg-white border border-brown-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-brown-100">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brown-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-bold text-white bg-brown-800 rounded-full">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-brown-900 group-hover:text-brown-600 transition-colors line-clamp-2 leading-tight mb-1.5">
                      {p.name}
                    </h3>
                    {p.category && (
                      <p className="text-xs text-brown-500 mb-2 truncate">
                        {p.category.name || p.category}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-brown-900">₹{p.price}</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-brown-400 line-through">₹{p.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Image Popup / Lightbox */}
      {imagePopupOpen && product?.images?.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setImagePopupOpen(false)}
        >
          <button
            onClick={() => setImagePopupOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brown-800 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev === 0 ? product.images.length - 1 : prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brown-800 flex items-center justify-center transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev === product.images.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-brown-800 flex items-center justify-center transition-colors"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            />
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm">
              {selectedImage + 1} / {product.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

