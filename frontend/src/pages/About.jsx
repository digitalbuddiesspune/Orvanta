const About = () => {
  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-3">About Orvanta</h1>
          <p className="text-brown-700 leading-relaxed">
            Orvanta by ORVANTA ENTERPRISES PRIVATE LIMITED is built to make online shopping simple, reliable,
            and enjoyable. We focus on curated products, fair pricing, smooth checkout, and dependable delivery
            across India.
          </p>

          <section className="mt-8 space-y-6 text-brown-800">
            <div>
              <h2 className="text-xl font-semibold text-brown-900 mb-2">What We Offer</h2>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Fashion-focused collections including footwear, watches, apparel, and accessories.</li>
                <li>Clean product details with clear pricing, stock status, and size information.</li>
                <li>Secure payments and transparent order updates from checkout to delivery.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-brown-900 mb-2">Our Approach</h2>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li><span className="font-semibold">Customer First:</span> We prioritize fast support and fair resolution.</li>
                <li><span className="font-semibold">Quality Focus:</span> We list products with care and improve based on feedback.</li>
                <li><span className="font-semibold">Trust & Security:</span> We work with secure payment and logistics partners.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-brown-900 mb-2">Why Customers Choose Us</h2>
              <p className="leading-relaxed">
                From discovery to delivery, our goal is to remove friction and save your time. Whether you are buying
                daily essentials or statement pieces, we aim to provide a smooth experience with consistent service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-brown-900 mb-2">Company Details</h2>
              <div className="space-y-1 leading-relaxed">
                <p className="font-semibold text-brown-900">ORVANTA ENTERPRISES PRIVATE LIMITED</p>
                <p><span className="font-semibold">Brand:</span> Orvanta</p>
                <p><span className="font-semibold">CIN:</span> U47711MH2026PTC476477</p>
                <p><span className="font-semibold">GSTIN:</span> 27AAFCO4075P1ZT</p>
                <p>
                  Email:{" "}
                  <a className="text-brown-700 hover:text-brown-900 underline" href="mailto:orvantaprivatedlimited@gmail.com">
                    orvantaprivatedlimited@gmail.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a className="text-brown-700 hover:text-brown-900 underline" href="tel:+918356885200">
                    +91 8356885200
                  </a>
                </p>
                <p>
                  Address: 70 Heera Panna Prem Soc, 1st Floor , MHADA Layout, Andheri, Mumbai, Mumbai, Maharashtra,
                  India, 400053
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
