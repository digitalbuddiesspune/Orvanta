import React, { useEffect, useRef, useState } from 'react';

const HeroSlider = ({ slides = [], mobileSrc, mobileSlides = [] }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);
  const SWIPE_THRESHOLD = 40;
  const desktopLen = slides.length;
  const normalizedMobileSlides = mobileSlides.length
    ? mobileSlides
    : mobileSrc
      ? [{ src: mobileSrc, alt: 'Banner 1' }]
      : [];
  const mobileLen = normalizedMobileSlides.length;
  const len = Math.max(desktopLen, mobileLen);

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = () => {
    if (len <= 1) return;
    stop();
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, 4000);
  };

  useEffect(() => {
    start();
    return stop;
  }, [len]);

  const prev = () => setIndex((i) => (i - 1 + len) % len);
  const next = () => setIndex((i) => (i + 1) % len);
  const handleTouchStart = (e) => {
    const x = e.touches[0]?.clientX ?? 0;
    touchStartXRef.current = x;
    touchEndXRef.current = x;
    stop();
  };
  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0]?.clientX ?? touchEndXRef.current;
  };
  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) >= SWIPE_THRESHOLD) {
      if (diff > 0) next();
      else prev();
    }
    start();
  };

  if (!len) return null;

  return (
    <section className="w-full m-0 p-0">
      {/* Desktop slider */}
      <div className="hidden md:block relative overflow-hidden h-auto">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onMouseEnter={stop}
          onMouseLeave={start}
        >
          {slides.map((s, i) => (
            <img
              key={i}
              src={s.desktop}
              alt={s.alt || `Banner ${i + 1}`}
              className="w-full block shrink-0 grow-0 basis-full object-contain"
              loading="eager"
              onError={(e) => {
                e.currentTarget.src = s.fallback || s.desktop;
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-brown-800 rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-brown-800 rounded-full w-10 h-10 flex items-center justify-center shadow"
          aria-label="Next"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`${i === index ? 'w-8 bg-black/70' : 'w-4 bg-black/30'} h-1.5 rounded-full transition-all`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile slider */}
      <div
        className="md:hidden block"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {mobileLen > 0 ? (
          <img
            src={normalizedMobileSlides[index % mobileLen]?.src}
            alt={normalizedMobileSlides[index % mobileLen]?.alt || `Banner ${(index % mobileLen) + 1}`}
            className="w-full h-auto object-cover block"
            loading="lazy"
          />
        ) : (
          <img src={slides[0]?.desktop} alt="Banner" className="w-full h-auto object-cover block" loading="lazy" />
        )}
        {mobileLen > 1 && (
          <div className="py-2 flex items-center justify-center gap-2">
            {normalizedMobileSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`${i === index % mobileLen ? 'w-6 bg-black/70' : 'w-3 bg-black/30'} h-1.5 rounded-full transition-all`}
                aria-label={`Go to mobile slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;








