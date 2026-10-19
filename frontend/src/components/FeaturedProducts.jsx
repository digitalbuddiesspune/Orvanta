import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../utils/api';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productAPI.getAllProducts({ limit: 100 });
        if (response.success) {
          setProducts(response.data?.products || response.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getDiscount = (product) => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  return (
    <section className="bg-brown-50 pt-4 md:pt-5 lg:pt-6 pb-8 md:pb-10 lg:pb-12">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1840px] mx-auto">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-brown-600 font-semibold mb-2">
              Handpicked for You
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-poppins text-brown-900">
              Featured Products
            </h2>
            <p className="mt-2 text-sm sm:text-base md:text-lg font-body text-brown-600 max-w-2xl">
              Discover our top picks and best sellers across all categories.
            </p>
          </div>
          <Link
            to="/all-products"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brown-700 hover:text-brown-900 transition-colors flex-shrink-0"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-brown-800"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {products.slice(0, 100).map((product) => {
                const discount = getDiscount(product);
                return (
                  <Link
                    key={product._id}
                    to={`/product/${product.slug}`}
                    className="group bg-brown-50 border border-brown-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden bg-brown-100">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
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
                        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-0.5 text-[8px] sm:text-[10px] md:text-xs font-bold text-white bg-brown-800 rounded-full whitespace-nowrap">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-semibold text-brown-900 group-hover:text-brown-600 transition-colors line-clamp-2 leading-tight mb-1.5">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="text-xs text-brown-500 mb-2 truncate">
                          {product.category.name || product.category}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-brown-900">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs sm:text-sm text-brown-400 line-through">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden mt-6 text-center">
              <Link
                to="/all-products"
                className="inline-flex items-center gap-1 px-5 py-2.5 bg-brown-800 text-white rounded-lg hover:bg-brown-900 font-semibold text-sm transition-colors"
              >
                View All Products
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-center text-brown-500 py-12">No products available yet.</p>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
