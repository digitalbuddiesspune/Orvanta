import { useCallback, useEffect, useRef, useState } from 'react';
import Invoice from '../components/Invoice';
import { downloadInvoicePdf } from '../utils/downloadInvoicePdf';

export function useOrderBillDownload() {
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState('');
  const [exportKey, setExportKey] = useState(0);
  const invoiceRef = useRef(null);

  const downloadBill = useCallback((order) => {
    if (!order?._id) return;
    setDownloadingId(order._id);
    setInvoiceOrder(order);
    setExportKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!invoiceOrder || exportKey === 0) return;

    let cancelled = false;

    const run = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (cancelled || !invoiceRef.current) {
        if (!cancelled) setDownloadingId('');
        return;
      }

      const invoiceNum =
        invoiceOrder.orderNumber ||
        (invoiceOrder._id ? String(invoiceOrder._id).slice(-8).toUpperCase() : 'INVOICE');

      try {
        await downloadInvoicePdf(invoiceRef.current, `Invoice-${invoiceNum}.pdf`);
      } catch (err) {
        console.error('Invoice PDF error:', err);
        alert(`Failed to download bill: ${err.message || 'Unknown error'}`);
      } finally {
        if (!cancelled) setDownloadingId('');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [exportKey, invoiceOrder]);

  const invoiceHost = invoiceOrder ? (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '800px',
        zIndex: -1,
        pointerEvents: 'none',
        backgroundColor: '#ffffff',
      }}
    >
      <div ref={invoiceRef}>
        <Invoice order={invoiceOrder} user={invoiceOrder.user} forExport />
      </div>
    </div>
  ) : null;

  return { downloadBill, downloadingId, invoiceHost };
}

export default useOrderBillDownload;
