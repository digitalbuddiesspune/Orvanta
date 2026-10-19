import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '../utils/api';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80';
const SCROLL_SPEED = 0.5;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const pausedRef = useRef(false);

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
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const animate = useCallback(() => {
    const el = scrollRef.current;
    if (el && !pausedRef.current) {
      const halfScroll = el.scrollWidth / 2;
      if (el.scrollLeft >= halfScroll) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += SCROLL_SPEED;
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const startAutoScroll = useCallback(() => {
    pausedRef.current = false;
  }, []);

  const stopAutoScroll = useCallback(() => {
    pausedRef.current = true;
  }, []);

  useEffect(() => {
    if (!loading && categories.length > 0) {
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading, categories, animate]);

  return (
    <section className="bg-brown-50 py-8 md:py-10 lg:py-12 pb-4 md:pb-5 lg:pb-6">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-[1840px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-sm uppercase tracking-wide text-brown-600 font-semibold mb-2">
              Shop by Category
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold font-poppins text-brown-900">
              Explore our categories
            </h2>
            <p className="mt-2 text-sm sm:text-base md:text-lg font-body text-brown-600 max-w-2xl">
              Browse our wide range of products across fashion, electronics, beauty, and more.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-brown-800"></div>
          </div>
        ) : categories.length > 0 ? (
          <div
            ref={scrollRef}
            onMouseEnter={stopAutoScroll}
            onMouseLeave={startAutoScroll}
            onTouchStart={stopAutoScroll}
            onTouchEnd={startAutoScroll}
            className="flex gap-4 sm:gap-5 md:gap-6 overflow-x-auto pb-4 category-scroll"
          >
            {[...categories, ...categories].map((category, idx) => (
              <Link
                key={`${category._id}-${idx}`}
                to={`/category/${category.slug}`}
                className="group bg-brown-50 border border-brown-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 w-44 sm:w-52 md:w-60"
              >
                <div className="h-48 sm:h-56 md:h-64 overflow-hidden bg-brown-100">
                  <img
                    src={category.image || PLACEHOLDER_IMAGE}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-sm sm:text-base font-heading font-semibold text-brown-900 group-hover:text-brown-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-brown-500 py-12">No categories available. Add categories from admin panel.</p>
        )}
      </div>
    </section>
  );
};

export default Categories;
