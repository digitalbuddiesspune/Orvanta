const Contact = () => {
  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-3">Contact Us</h1>
          <p className="text-brown-700 leading-relaxed">
            Need help with orders, returns, shipping, or product details? Reach out and our team will assist you as quickly as possible.
          </p>

          <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-brown-50 border border-brown-200 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-brown-900 mb-3">Customer Support</h2>
              <div className="space-y-3 text-brown-800">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a className="text-brown-700 hover:text-brown-900 underline" href="mailto:orvantaprivatedlimited@gmail.com">
                    orvantaprivatedlimited@gmail.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  <a className="text-brown-700 hover:text-brown-900 underline" href="tel:+918356885200">
                    +91 8356885200
                  </a>
                </p>
                <p><span className="font-semibold">Website:</span> Orvanta</p>
                <p><span className="font-semibold">Company:</span> ORVANTA ENTERPRISES PRIVATE LIMITED</p>
                <p><span className="font-semibold">CIN:</span> U47711MH2026PTC476477</p>
                <p><span className="font-semibold">GSTIN:</span> 27AAFCO4075P1ZT</p>
              </div>
            </div>

            <div className="bg-brown-50 border border-brown-200 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-brown-900 mb-3">Office Address</h2>
              <p className="text-brown-800 leading-relaxed">
                70 Heera Panna Prem Soc, 1st Floor , MHADA Layout, Andheri, Mumbai, Mumbai, Maharashtra,
                India, 400053
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-brown-900 mb-3">Support Hours</h2>
            <ul className="list-disc pl-5 space-y-1 text-brown-800">
              <li>Monday to Saturday: 10:00 AM - 7:00 PM</li>
              <li>Sunday & public holidays: Response may be delayed</li>
              <li>For urgent delivery issues, include your order ID in message subject</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Contact;
