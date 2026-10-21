import React from 'react';
import { COMPANY_INFO } from '../config/companyInfo';
import { INVOICE_EXPORT_CSS } from '../utils/invoiceExportStyles';

const Invoice = ({
  order,
  user,
  onPrint,
  totals: totalsOverride,
  invoiceNumber: invoiceNumberOverride,
  forExport = false,
}) => {
  const brandLogo = '/70f4061b-c1e8-4815-95db-8e8906944dfc-removebg-preview.png';

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-brown-600">No order or invoice data available</p>
      </div>
    );
  }

  const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderNumber =
    invoiceNumberOverride ||
    order.orderNumber ||
    (order._id ? String(order._id).slice(-8).toUpperCase() : 'N/A');

  const lineSubtotal =
    order.items?.reduce((sum, item) => {
      const itemPrice = item.price || item.product?.price || 0;
      const quantity = item.quantity || 1;
      return sum + itemPrice * quantity;
    }, 0) || 0;

  const subtotal = totalsOverride?.subtotal ?? order.itemsTotal ?? lineSubtotal ?? order.totalAmount ?? 0;
  const gst = totalsOverride?.gst ?? order.gstAmount ?? 0;
  const shipping = totalsOverride?.shipping ?? order.shippingCost ?? 0;
  const total = totalsOverride?.total ?? order.totalAmount ?? (subtotal + gst + shipping);
  const gstRate = totalsOverride?.gstRate ?? order.gstRate ?? 18;
  const shippingAddress = order.shippingAddress || {};

  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const paymentLabel =
    order.paymentMethod === 'COD'
      ? 'Cash on Delivery (COD)'
      : order.paymentMethod === 'Online'
      ? 'Online Payment'
      : order.paymentMethod === 'Manual'
      ? 'Manual / Direct Billing'
      : order.paymentMethod || 'Paid';

  const getItemTitle = (item) => {
    return item.name || item.product?.name || item.product?.title || 'Product';
  };

  const getItemImage = (item) => {
    return (
      item.image ||
      item.product?.images?.[0] ||
      item.product?.image ||
      brandLogo
    );
  };

  // --- EXPORT VERSION (Optimized for PDF Canvas capture) ---
  if (forExport) {
    return (
      <div className="invoice-export">
        <style>{INVOICE_EXPORT_CSS}</style>

        <div className="invoice-export-header">
          <div className="invoice-export-brand">
            <img src={brandLogo} alt={COMPANY_INFO.brandName} className="invoice-export-logo" />
            <div>
              <h1 className="invoice-export-title">{COMPANY_INFO.brandName}</h1>
              <p className="invoice-export-subtitle">{COMPANY_INFO.legalName}</p>
              <p className="invoice-export-muted">{COMPANY_INFO.registeredAddress}</p>
              <p className="invoice-export-muted">
                GSTIN: {COMPANY_INFO.gstin} | CIN: {COMPANY_INFO.cin}
              </p>
            </div>
          </div>
        </div>

        <div className="invoice-export-grid">
          <div>
            <h3 className="invoice-export-section-title">Customer Information</h3>
            <div className="invoice-export-section-body">
              {(shippingAddress.fullName || user?.name) && (
                <p className="name">{shippingAddress.fullName || user?.name}</p>
              )}
              {(user?.email || order.user?.email) && (
                <p><strong>Email:</strong> {user?.email || order.user?.email}</p>
              )}
              {(shippingAddress.phone || user?.phone) && (
                <p><strong>Phone:</strong> {shippingAddress.phone || user?.phone}</p>
              )}
              {(shippingAddress.addressLine1 ||
                shippingAddress.addressLine2 ||
                shippingAddress.city ||
                shippingAddress.state ||
                shippingAddress.pincode) && (
                <div className="invoice-export-address">
                  {shippingAddress.addressLine1 && <p>{shippingAddress.addressLine1}</p>}
                  {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                  <p>
                    {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')}
                    {shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="invoice-export-section-title">Tax Invoice</h3>
            <div className="invoice-export-section-body">
              <p><strong>Invoice / Order #:</strong> {orderNumber}</p>
              <p><strong>Date:</strong> {formattedDate}</p>
              <p><strong>Payment:</strong> {paymentLabel}</p>
              <p><strong>Status:</strong> {order.status || 'Confirmed'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="invoice-export-items-title">Invoice Items</h3>
          <table className="invoice-export-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="center">Qty</th>
                <th className="right">Unit Price</th>
                <th className="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => {
                const itemPrice = item.price || item.product?.price || 0;
                const quantity = item.quantity || 1;
                const itemTotal = item.itemTotal || itemPrice * quantity;

                return (
                  <tr key={index}>
                    <td className="item-name">{getItemTitle(item)}</td>
                    <td className="center">{quantity}</td>
                    <td className="right">{formatINR(itemPrice)}</td>
                    <td className="right total-cell">{formatINR(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="invoice-export-totals">
          <div className="invoice-export-totals-box">
            <div className="invoice-export-totals-row">
              <span>Subtotal:</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            {gst > 0 && (
              <div className="invoice-export-totals-row">
                <span>GST ({gstRate}%):</span>
                <span>{formatINR(gst)}</span>
              </div>
            )}
            <div className="invoice-export-totals-row">
              <span>Shipping & Delivery:</span>
              <span>{shipping > 0 ? formatINR(shipping) : 'Free'}</span>
            </div>
            <div className="invoice-export-totals-grand">
              <span>Grand Total:</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-export-footer">
          <p>Thank you for shopping with <strong>{COMPANY_INFO.brandName}</strong>!</p>
          <p>
            For any assistance, contact us at {COMPANY_INFO.email} or {COMPANY_INFO.phone}
          </p>
        </div>
      </div>
    );
  }

  // --- SCREEN PREVIEW VERSION ---
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-brown-200">
      {/* Header */}
      <div className="border-b-2 border-brown-200 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <img
              src={brandLogo}
              alt={COMPANY_INFO.brandName}
              className="h-14 sm:h-16 w-auto max-w-[120px] object-contain shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-brown-950 mb-0.5">
                {COMPANY_INFO.brandName}
              </h1>
              <p className="text-brown-700 font-semibold text-xs sm:text-sm">
                {COMPANY_INFO.legalName}
              </p>
              <p className="text-xs text-brown-600 mt-1 max-w-sm leading-relaxed">
                {COMPANY_INFO.registeredAddress}
              </p>
              <p className="text-xs text-brown-600 mt-1 font-medium">
                GSTIN: {COMPANY_INFO.gstin} | CIN: {COMPANY_INFO.cin}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Customer & Tax Invoice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-brown-50/60 rounded-xl border border-brown-100">
          <h3 className="text-xs font-bold text-brown-900 mb-2 uppercase tracking-wider">
            Customer Information
          </h3>
          <div className="space-y-1 text-sm text-brown-700">
            {(shippingAddress.fullName || user?.name) && (
              <p className="font-bold text-brown-900">{shippingAddress.fullName || user?.name}</p>
            )}
            {(user?.email || order.user?.email) && (
              <p>
                <span className="font-semibold text-brown-800">Email:</span>{' '}
                {user?.email || order.user?.email}
              </p>
            )}
            {(shippingAddress.phone || user?.phone) && (
              <p>
                <span className="font-semibold text-brown-800">Phone:</span>{' '}
                {shippingAddress.phone || user?.phone}
              </p>
            )}
            {(shippingAddress.addressLine1 ||
              shippingAddress.addressLine2 ||
              shippingAddress.city ||
              shippingAddress.state ||
              shippingAddress.pincode) && (
              <div className="pt-2 mt-1 border-t border-brown-200 space-y-0.5">
                {shippingAddress.addressLine1 && <p>{shippingAddress.addressLine1}</p>}
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>
                  {[shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ')}
                  {shippingAddress.pincode ? ` - ${shippingAddress.pincode}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-brown-50/60 rounded-xl border border-brown-100">
          <h3 className="text-xs font-bold text-brown-900 mb-2 uppercase tracking-wider">
            Tax Invoice
          </h3>
          <div className="space-y-1 text-sm text-brown-700">
            <p>
              <span className="font-semibold text-brown-800">Invoice / Order #:</span> {orderNumber}
            </p>
            <p>
              <span className="font-semibold text-brown-800">Date:</span> {formattedDate}
            </p>
            <p>
              <span className="font-semibold text-brown-800">Payment:</span> {paymentLabel}
            </p>
            <p>
              <span className="font-semibold text-brown-800">Status:</span>{' '}
              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                {order.status || 'Confirmed'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-brown-900 mb-3 uppercase tracking-wider">
          Invoice Line Items
        </h3>
        <div className="overflow-x-auto border border-brown-200 rounded-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-brown-50 border-b border-brown-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-brown-900">Item</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-brown-900">Qty</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-brown-900">Unit Price</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-brown-900">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-100">
              {order.items?.map((item, index) => {
                const itemPrice = item.price || item.product?.price || 0;
                const quantity = item.quantity || 1;
                const itemTotal = item.itemTotal || itemPrice * quantity;

                return (
                  <tr key={index} className="hover:bg-brown-50/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getItemImage(item)}
                          alt={getItemTitle(item)}
                          className="w-12 h-12 object-cover rounded-lg border border-brown-200 shrink-0"
                          onError={(e) => {
                            e.target.src = brandLogo;
                          }}
                        />
                        <span className="font-medium text-sm text-brown-900">
                          {getItemTitle(item)}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-sm text-brown-700">{quantity}</td>
                    <td className="text-right py-3 px-4 text-sm text-brown-700">
                      {formatINR(itemPrice)}
                    </td>
                    <td className="text-right py-3 px-4 text-sm font-semibold text-brown-900">
                      {formatINR(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary */}
      <div className="border-t-2 border-brown-200 pt-4">
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-brown-700">
              <span>Subtotal:</span>
              <span className="font-semibold text-brown-900">{formatINR(subtotal)}</span>
            </div>
            {gst > 0 && (
              <div className="flex justify-between text-sm text-brown-700">
                <span>GST ({gstRate}%):</span>
                <span className="font-semibold text-brown-900">{formatINR(gst)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-brown-700">
              <span>Shipping & Delivery:</span>
              <span className="font-semibold text-brown-900">
                {shipping > 0 ? formatINR(shipping) : 'Free'}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t-2 border-brown-900 text-brown-950">
              <span>Grand Total:</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-brown-200 text-center text-xs text-brown-600 space-y-1">
        <p className="font-semibold text-brown-800">
          Thank you for choosing {COMPANY_INFO.brandName}!
        </p>
        <p>
          Need help? Reach out at {COMPANY_INFO.email} or call {COMPANY_INFO.phone}
        </p>
      </div>

      {onPrint && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onPrint}
            className="px-6 py-2.5 bg-gradient-to-r from-brown-800 to-brown-900 text-white rounded-xl hover:from-brown-700 hover:to-brown-800 font-semibold shadow-sm transition-all"
          >
            Print Invoice
          </button>
        </div>
      )}
    </div>
  );
};

export default Invoice;
