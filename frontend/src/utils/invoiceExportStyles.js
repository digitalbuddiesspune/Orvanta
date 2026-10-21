/** Hex-only CSS for PDF capture — no Tailwind / oklch dependency */
export const INVOICE_EXPORT_CSS = `
.invoice-export {
  width: 794px;
  max-width: 794px;
  margin: 0 auto;
  background: #ffffff;
  color: #111827;
  padding: 32px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
}
.invoice-export * { box-sizing: border-box; }
.invoice-export-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 24px;
  margin-bottom: 24px;
}
.invoice-export-brand {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}
.invoice-export-logo {
  height: 64px;
  width: auto;
  max-width: 120px;
  object-fit: contain;
  flex-shrink: 0;
}
.invoice-export-title {
  font-size: 24px;
  font-weight: 700;
  color: #3b2a1a;
  margin: 0 0 4px;
}
.invoice-export-subtitle {
  color: #4b5563;
  font-weight: 600;
  font-size: 13px;
  margin: 0;
}
.invoice-export-muted {
  color: #6b7280;
  font-size: 12px;
  margin: 3px 0 0;
}
.invoice-export-meta {
  text-align: right;
  font-size: 13px;
  color: #4b5563;
}
.invoice-export-meta h2 {
  font-size: 24px;
  font-weight: 800;
  color: #3b2a1a;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}
.invoice-export-meta p { margin: 4px 0; }
.invoice-export-meta strong { color: #111827; font-weight: 600; }
.invoice-export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 24px;
}
.invoice-export-section-title {
  font-size: 12px;
  font-weight: 700;
  color: #3b2a1a;
  text-transform: uppercase;
  margin: 0 0 8px;
  letter-spacing: 0.5px;
}
.invoice-export-section-body {
  font-size: 13px;
  color: #4b5563;
}
.invoice-export-section-body p { margin: 2px 0; }
.invoice-export-section-body .name {
  font-weight: 600;
  color: #111827;
}
.invoice-export-items-title {
  font-size: 12px;
  font-weight: 700;
  color: #3b2a1a;
  text-transform: uppercase;
  margin: 0 0 16px;
}
.invoice-export-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}
.invoice-export-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  background: #faf7f2;
  border-bottom: 2px solid #e5e7eb;
}
.invoice-export-table th.center { text-align: center; }
.invoice-export-table th.right { text-align: right; }
.invoice-export-table td {
  padding: 14px 16px;
  font-size: 13px;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}
.invoice-export-table td.center { text-align: center; }
.invoice-export-table td.right { text-align: right; }
.invoice-export-table td.item-name {
  font-weight: 500;
  color: #111827;
}
.invoice-export-table td.total-cell {
  font-weight: 600;
  color: #111827;
}
.invoice-export-totals {
  border-top: 2px solid #e5e7eb;
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.invoice-export-totals-box {
  width: 270px;
}
.invoice-export-totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}
.invoice-export-totals-row span:first-child { color: #4b5563; }
.invoice-export-totals-row span:last-child { color: #111827; }
.invoice-export-totals-grand {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 700;
  color: #3b2a1a;
  padding-top: 8px;
  border-top: 2px solid #3b2a1a;
  margin-top: 8px;
}
.invoice-export-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 13px;
  color: #4b5563;
}
.invoice-export-footer p { margin: 0 0 6px; }
`;
