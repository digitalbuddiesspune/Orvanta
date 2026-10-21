import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { INVOICE_EXPORT_CSS } from './invoiceExportStyles';
import { COMPANY_INFO } from '../config/companyInfo';

/**
 * Wait for all <img> tags inside an element to fully load
 */
function waitForImages(element) {
  const images = element.querySelectorAll('img');
  return Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 3000);
        })
    )
  );
}

/**
 * Print Invoice via isolated hidden iframe.
 * Ensures 100% clean A4 print preview with ONLY the tax invoice (no admin sidebar, navbar, or forms).
 */
export function printInvoice(elementOrContainer, docTitle = `Tax Invoice - ${COMPANY_INFO.brandName}`) {
  if (!elementOrContainer) {
    window.print();
    return;
  }

  const exportElement =
    (elementOrContainer.querySelector && elementOrContainer.querySelector('.invoice-export')) ||
    elementOrContainer;

  const contentHtml = exportElement.outerHTML || '';
  if (!contentHtml) {
    window.print();
    return;
  }

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.style.zIndex = '-99999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${docTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          }
          ${INVOICE_EXPORT_CSS}
          .invoice-export {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          @media print {
            body {
              background: #ffffff !important;
            }
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `);
  doc.close();

  // Wait for images inside iframe to render
  const images = doc.querySelectorAll('img');
  const imagePromises = Array.from(images).map(
    (img) =>
      new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2500);
      })
  );

  Promise.all(imagePromises).then(() => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 200);
  });
}

/**
 * Download Invoice as A4 PDF using high-resolution html2canvas capture + jsPDF
 */
export async function downloadInvoicePdf(element, filename = 'Invoice.pdf') {
  if (!element) throw new Error('Invoice element not found');

  const captureSource =
    (element.querySelector && element.querySelector('.invoice-export')) || element;

  // Create an off-screen sandbox mounted directly to document.body
  // This bypasses any parent component transforms, overflow, or scroll offsets
  const sandbox = document.createElement('div');
  sandbox.id = 'invoice-pdf-sandbox';
  sandbox.style.cssText = [
    'position: fixed',
    'left: 0',
    'top: 0',
    'width: 794px',
    'background: #ffffff',
    'z-index: 999999',
    'opacity: 1',
    'visibility: visible',
    'pointer-events: none',
    'margin: 0',
    'padding: 0',
    'box-sizing: border-box',
    'overflow: visible',
  ].join(';');

  sandbox.innerHTML = `
    <style>
      ${INVOICE_EXPORT_CSS}
      .invoice-export {
        width: 794px !important;
        max-width: 794px !important;
        margin: 0 !important;
        padding: 32px !important;
        background: #ffffff !important;
        box-sizing: border-box !important;
      }
    </style>
    ${captureSource.outerHTML}
  `;

  document.body.appendChild(sandbox);

  try {
    await waitForImages(sandbox);
    await new Promise((r) => setTimeout(r, 200));

    const target = sandbox.querySelector('.invoice-export') || sandbox;
    const targetWidth = 794;
    const targetHeight = target.scrollHeight || target.offsetHeight || 1123;

    const canvas = await html2canvas(target, {
      scale: 2, // High resolution (retina crisp)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      windowHeight: targetHeight,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm
    const printableHeight = pageHeight - margin * 2; // 277mm

    const totalImgHeight = (canvas.height * contentWidth) / canvas.width;

    if (totalImgHeight <= printableHeight) {
      // Single Page Document: add canvas PNG directly
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, totalImgHeight);
    } else {
      // Multi-Page Document: slice canvas page-by-page cleanly without image bleeding
      const pageCanvasHeight = Math.floor((canvas.width * printableHeight) / contentWidth);
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;

        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const sliceImgData = sliceCanvas.toDataURL('image/png');
        const sliceImgHeight = (sliceHeight * contentWidth) / canvas.width;
        pdf.addImage(sliceImgData, 'PNG', margin, margin, contentWidth, sliceImgHeight);

        renderedHeight += sliceHeight;
        pageIndex++;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error('[downloadInvoicePdf Error]', err);
    // If client-side canvas capture is blocked by browser restrictions, fall back to print dialog
    if (window.confirm('Could not download direct PDF file. Would you like to open the Print / Save as PDF preview instead?')) {
      printInvoice(captureSource, filename.replace('.pdf', ''));
    } else {
      throw err;
    }
  } finally {
    sandbox.remove();
  }
}
