import { Link } from 'react-router-dom';

const scrollToTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
};

const CategorySidebar = ({ categories = [], loading = false, activeSlug = null, showOnMobile = true }) => {
  const isAllProductsActive = activeSlug === null;

  return (
    <aside
      className={`${showOnMobile ? 'w-full' : 'hidden lg:block'} lg:w-64 xl:w-72 flex-shrink-0 order-2 lg:order-1`}
    >
      <div className="bg-white rounded-xl shadow-sm border border-brown-200/80 overflow-hidden lg:sticky lg:top-[120px] lg:max-h-[calc(100vh-120px)] lg:flex lg:flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-brown-100 flex-shrink-0">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-brown-500">
            Browse by Category
          </h3>
          <h2 className="text-lg font-bold text-brown-900 mt-0.5">All Categories</h2>
        </div>

        {/* Scrollable Categories List - custom scrollbar */}
        <div className="p-3 overflow-y-auto flex-1 max-h-[400px] lg:max-h-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-brown-50/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brown-200 hover:[&::-webkit-scrollbar-thumb]:bg-brown-300">
          <nav className="space-y-1">
            {/* All Products Link */}
            <Link
              to="/all-products"
              onClick={scrollToTop}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isAllProductsActive
                  ? 'bg-brown-100/80 text-brown-900 font-semibold border-l-4 border-brown-600 shadow-sm'
                  : 'text-brown-600 hover:bg-brown-50 hover:text-brown-900 hover:translate-x-0.5 group'
              }`}
            >
              <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-brown-600 to-brown-800 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <span className="text-sm flex-1">All Products</span>
              {!isAllProductsActive && (
                <svg className="w-4 h-4 text-brown-300 group-hover:text-brown-500 group-hover:translate-x-0.5 flex-shrink-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </Link>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-brown-200 border-t-brown-600"></div>
              </div>
            ) : (
              categories.map((cat) => {
                const isActive = cat.slug === activeSlug;
                return (
                  <Link
                    key={cat._id}
                    to={`/category/${cat.slug}`}
                    onClick={scrollToTop}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-brown-100/80 text-brown-900 font-semibold border-l-4 border-brown-600 shadow-sm'
                        : 'text-brown-600 hover:bg-brown-50 hover:text-brown-900 hover:translate-x-0.5 group'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-brown-100 ${
                        isActive
                          ? 'ring-1 ring-brown-200 shadow-inner'
                          : 'ring-1 ring-brown-100 group-hover:ring-brown-200 transition-shadow'
                      }`}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brown-100 text-brown-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-sm flex-1 line-clamp-2 ${
                        !isActive ? 'font-medium group-hover:font-semibold transition-all' : 'font-semibold'
                      }`}
                    >
                      {cat.name}
                    </span>
                    {!isActive && (
                      <svg
                        className="w-4 h-4 text-brown-300 group-hover:text-brown-500 group-hover:translate-x-0.5 flex-shrink-0 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default CategorySidebar;
