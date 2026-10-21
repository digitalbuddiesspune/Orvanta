const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-brown-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-6 sm:p-8 md:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-2">Shipping Policy</h1>
          <p className="text-sm text-brown-600 mb-8">Last updated: 21 October 2026</p>

          <section className="space-y-6 text-brown-800">
            <p className="leading-relaxed">
              This Shipping Policy explains how Orvanta by ORVANTA ENTERPRISES PRIVATE LIMITED handles shipping and
              delivery of orders placed for products through our website.
            </p>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">1. Serviceable Locations</h2>
              <p className="leading-relaxed">
                We currently ship orders across most locations in India through our trusted courier partners, subject to
                serviceability of your PIN code.
              </p>
              <p className="leading-relaxed mt-2">
                If your PIN code is not serviceable, we will contact you to discuss alternatives or process a refund.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">2. Order Processing Time</h2>
              <p className="leading-relaxed">
                After your order and payment are successfully confirmed, we typically take 1-3 business days to process and dispatch your order.
              </p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed mt-2">
                <li>Orders are processed Monday to Saturday (excluding holidays).</li>
                <li>Orders placed on Sundays or public holidays are processed on the next working day.</li>
                <li>During sale periods or festive seasons, processing times may be slightly longer.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">3. Estimated Delivery Timelines</h2>
              <p className="leading-relaxed mb-2">After dispatch, estimated delivery times are:</p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Near Customers: 3-5 business days.</li>
                <li>Long Metro City: 5-7 business days.</li>
                <li>Remote / Out-of-delivery Areas: 7-10 business days (subject to courier coverage).</li>
              </ul>
              <p className="leading-relaxed mt-2">
                Actual delivery may vary due to courier delays, weather, strikes, festivals or other events beyond our control.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">4. Shipping Address & Contact Details</h2>
              <p className="leading-relaxed">
                Please ensure your address, PIN code and contact number are correct at the time of placing the order.
              </p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed mt-2">
                <li>We are not responsible for delays or non-delivery caused by incorrect or incomplete details.</li>
                <li>Address changes after dispatch may not be possible. For changes before dispatch, please contact us at the earliest.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">5. Undelivered or Returned Shipments</h2>
              <p className="leading-relaxed mb-2">Orders may be returned to us by the courier due to:</p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Incorrect or incomplete address.</li>
                <li>Customer unavailable during multiple delivery attempts.</li>
                <li>Customer not reachable on phone.</li>
                <li>Refusal to accept delivery.</li>
              </ul>
              <p className="leading-relaxed mt-2">Once we receive the returned shipment, we will contact you to either:</p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed mt-2">
                <li>Re-ship the order (additional shipping charges may apply), or</li>
                <li>Process a refund/store credit as per our Refund & Cancellation Policy.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">6. Delays Beyond Our Control</h2>
              <p className="leading-relaxed">
                While we aim for timely delivery, certain events such as natural disasters, strikes, lockdowns, or issues at the courier's end may cause delays. We will coordinate with the courier to expedite delivery wherever possible and request your understanding in such cases.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">7. International Shipping</h2>
              <p className="leading-relaxed">
                Currently, we do not offer international shipping. If we start shipping outside India in future, this section will be updated with applicable terms, duties and taxes.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">8. Damaged, Opened or Tampered Packages</h2>
              <p className="leading-relaxed mb-2">
                If you receive a package that appears damaged, tampered or opened:
              </p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>Kindly mention this to the delivery person immediately.</li>
                <li>Take clear photos/videos of the package and product and share them with us within 24-48 hours.</li>
              </ul>
              <p className="leading-relaxed mt-2">
                We will review the case as per our Refund & Cancellation Policy and provide a suitable resolution.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">9. Cash on Delivery (COD)</h2>
              <p className="leading-relaxed mb-2">Cash on Delivery (COD) service is available. If offered:</p>
              <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                <li>COD eligibility and charges will be shown at checkout.</li>
                <li>Repeated refusal of COD orders may lead to restrictions on future COD availability.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">10. Changes to This Shipping Policy</h2>
              <p className="leading-relaxed">
                We may revise this Shipping Policy from time to time. Any updates will be posted on this page with an updated "Last updated" date.
              </p>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-brown-900 mb-2">11. Contact Us</h2>
              <p className="leading-relaxed">For questions about shipping or delivery, contact:</p>
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

export default ShippingPolicy;
