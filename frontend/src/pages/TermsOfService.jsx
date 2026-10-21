const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-2">Terms & Conditions</h1>
          <p className="text-sm text-brown-600 mb-8">Last updated: 21 October 2026</p>

          <section className="space-y-6 text-brown-800">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">1. Introduction</h2>
              <p className="leading-relaxed">
                These Terms & Conditions ("Terms") govern your use of the website and services offered by
                Orvanta by ORVANTA ENTERPRISES PRIVATE LIMITED by accessing or purchasing from our website,
                you agree to be bound by these Terms. If you do not agree, please do not use our website.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">2. Products, Availability & Pricing</h2>
              <p className="leading-relaxed">
                We sell premium products including footwear, watches, and accessories. Product images are for
                reference; slight colour or texture variations may occur.
              </p>
              <p className="leading-relaxed mt-2">
                Prices are listed in Indian Rupees (INR) and are subject to change at any time without prior notice.
              </p>
              <p className="leading-relaxed mt-2">
                Acceptance of your order is subject to product availability and successful payment confirmation.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">3. Orders & Payments</h2>
              <p className="leading-relaxed">
                When you place an order, you agree that all information provided is accurate and complete.
              </p>
              <p className="leading-relaxed mt-2">
                We reserve the right to cancel any order in case of pricing errors, suspected fraud or other
                legitimate reasons. Any amount charged will be refunded in such cases.
              </p>
              <p className="leading-relaxed mt-2">
                Payments must be made via the methods listed at checkout (UPI/cards/net banking/wallets etc.).
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">4. Shipping & Delivery</h2>
              <p className="leading-relaxed">
                Shipping timelines, charges and delivery conditions are governed by our Shipping Policy. By placing
                an order, you agree to those terms as well.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">5. Returns, Refunds & Cancellations</h2>
              <p className="leading-relaxed">
                All requests for returns, exchanges, refunds or cancellations are handled in accordance with our
                Refund & Cancellation Policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">6. User Responsibilities</h2>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Do not use the website for any unlawful or fraudulent purpose.</li>
                <li>Do not attempt to gain unauthorised access to our systems.</li>
                <li>Do not post or transmit any defamatory, abusive, obscene or harmful content.</li>
                <li>Do not resell our products commercially without written permission.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">7. Intellectual Property</h2>
              <p className="leading-relaxed">
                All content on the website including logos, product photos, designs, text, graphics and layout is the
                property of Orvanta or its licensors and is protected by applicable copyright and trademark laws.
                Unauthorised use, reproduction or distribution is strictly prohibited.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">8. Limitation of Liability</h2>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special
                or consequential damages arising out of your use of the website or purchase of products, including
                but not limited to loss due to courier delays, minor colour variations, improper washing or misuse of
                products.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">9. Fraud Prevention</h2>
              <p className="leading-relaxed">
                We reserve the right to cancel orders, block accounts or refuse service in cases of suspected fraud,
                repeated COD refusals or policy abuse.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">10. Contact Us</h2>
              <p className="leading-relaxed">For any queries regarding these Terms, contact:</p>
              <div className="mt-2 text-brown-800 space-y-1">
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

export default TermsOfService;
