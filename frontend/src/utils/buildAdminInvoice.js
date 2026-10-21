import { GST_RATE } from './invoiceConstants';

export { GST_RATE, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_CHARGE } from './invoiceConstants';

export function buildAdminInvoicePayload({
  selectedCustomer,
  lineItems,
  subtotal,
  gst,
  shipping,
  total,
  invoiceDate,
  paymentMethod = 'Manual',
}) {
  if (!selectedCustomer) {
    return { error: 'Please select or add a customer' };
  }
  if (!lineItems?.length) {
    return { error: 'Please add at least one product' };
  }

  const addr = selectedCustomer.address || {};
  const shippingAddress = {
    fullName: addr.fullName || selectedCustomer.name || 'Customer',
    phone: addr.phone || addr.mobileNumber || selectedCustomer.phone || '',
    addressLine1: addr.addressLine1 || addr.address || '',
    addressLine2: addr.addressLine2 || addr.locality || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.pincode || '',
  };

  const invoiceId = `INV${Date.now().toString().slice(-8)}`;
  const createdAt = invoiceDate
    ? new Date(`${invoiceDate}T12:00:00`).toISOString()
    : new Date().toISOString();

  const orderPayload = {
    _id: invoiceId,
    orderNumber: invoiceId,
    createdAt,
    paymentMethod,
    status: 'Confirmed',
    totalAmount: total,
    items: lineItems.map((item) => ({
      product: item.product,
      name: item.product?.name || item.name || 'Product',
      price: item.price,
      quantity: item.quantity,
      itemTotal: item.price * item.quantity,
      image: item.product?.images?.[0] || item.product?.image || '',
    })),
    shippingAddress,
  };

  return {
    payload: {
      order: orderPayload,
      user: {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
      },
      invoiceNumber: invoiceId,
      totals: {
        subtotal,
        gst,
        gstRate: GST_RATE,
        shipping,
        total,
      },
    },
  };
}
