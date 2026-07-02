// utils/reporting.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

function escapeCSV(val) {
  if (val == null) return "";
  let s = String(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function clean(str) {
  if (!str) return "";
  return String(str).replace(/[\r\n,]+/g, " ").trim();
}

function formatDateForCsv(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

import { Asset } from 'expo-asset';

// Shared PDF header HTML with logo
function pdfHeader(title, subtitle, logoSrc) {
  return `
    <div class="pdf-header">
      <div class="pdf-brand">
        ${logoSrc ? `<img src="${logoSrc}" style="width:auto;height:40px;margin-right:6px;object-fit:contain;" />` : `<span class="pdf-brand-name">Cashtro</span>`}
      </div>
      <div class="pdf-title-block">
        <h1>${title}</h1>
        ${subtitle ? `<p class="pdf-subtitle">${subtitle}</p>` : ''}
      </div>
      <p class="pdf-generated">Generated on ${new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    </div>`;
}

// NOTE: @import url() does NOT work inside expo-print (no network in the renderer).
// We use system-ui / -apple-system stack which renders perfectly on all platforms.
const PDF_STYLES = `
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    color: #111827;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.4;
  }
  .pdf-header {
    border-bottom: 2px solid #1E3A8A;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .pdf-brand {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 14px;
  }
  .pdf-brand-name {
    font-size: 22px;
    font-weight: 800;
    color: #1E3A8A;
    letter-spacing: -0.5px;
  }
  .pdf-brand-tag {
    font-size: 11px;
    font-weight: 500;
    color: #64748B;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .pdf-title-block h1 {
    font-size: 18px;
    font-weight: 700;
    color: #0F172A;
    margin-bottom: 4px;
  }
  .pdf-subtitle {
    font-size: 13px;
    color: #64748B;
  }
  .pdf-generated {
    font-size: 11px;
    color: #94A3B8;
    margin-top: 8px;
  }
  .summary-grid {
    display: flex;
    gap: 12px;
    margin-bottom: 28px;
  }
  .summary-card {
    flex: 1;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 14px 16px;
  }
  .summary-card__label {
    font-size: 10px;
    font-weight: 600;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .summary-card__value {
    font-size: 18px;
    font-weight: 700;
    color: #0F172A;
  }
  .summary-card__value.in  { color: #16A34A; }
  .summary-card__value.out { color: #DC2626; }
  .summary-card__value.bal { color: #1E3A8A; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }
  thead th {
    background: #1E3A8A;
    color: #ffffff;
    font-weight: 700;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 6px 8px;
    text-align: left;
  }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tbody tr { page-break-inside: auto; page-break-after: auto; }
  tbody tr:nth-child(even) { background: #F8FAFC; }
  td {
    padding: 6px 8px;
    border-bottom: 1px solid #E2E8F0;
    color: #374151;
    font-size: 10px;
  }
  td.amount-in  { color: #16A34A; font-weight: 600; text-align: right; }
  td.amount-out { color: #DC2626; font-weight: 600; text-align: right; }
  td.amount     { text-align: right; }
  .type-in  {
    display: inline-block;
    font-size: 9px; font-weight: 700;
    padding: 2px 5px; border-radius: 999px;
    background: #DCFCE7; color: #16A34A;
    text-transform: uppercase; letter-spacing: 0.3px;
  }
  .type-out {
    display: inline-block;
    font-size: 9px; font-weight: 700;
    padding: 2px 5px; border-radius: 999px;
    background: #FEE2E2; color: #DC2626;
    text-transform: uppercase; letter-spacing: 0.3px;
  }
  .note-cell {
    color: #6B7280;
    font-size: 9px;
    font-style: italic;
  }
  .pdf-footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #94A3B8;
  }
  .pdf-footer strong { color: #1E3A8A; }
  .empty-row {
    text-align: center;
    color: #94A3B8;
    padding: 24px;
    font-size: 13px;
  }
`;

/* ---------- CSV EXPORT (Transactions) ---------- */

export async function exportTransactionsCSV(transactions = []) {
  try {
    const headers = [
      "Date", "Type", "Category", "Amount",
      "Payment Method", "GST Applied", "GST Rate",
      "CGST", "SGST", "IGST", "Note",
    ];

    const rows = transactions.map((t) => [
      formatDateForCsv(t.date),
      t.type,
      clean(t.category?.name || t.category),
      parseFloat(t.amount || 0),
      clean(t.paymentMethod),
      t.isGstApplied ? "Yes" : "No",
      parseFloat(t.gstRate || 0),
      parseFloat(t.cgst || 0),
      parseFloat(t.sgst || 0),
      parseFloat(t.igst || 0),
      clean(t.note),
    ]);

    const csv =
      headers.map(escapeCSV).join(",") +
      "\n" +
      rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

    const filename = `cashtro_transactions_${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: 'utf8',
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Share Cashtro transactions CSV",
      });
    }
  } catch (err) {
    console.warn("Error exporting CSV:", err);
  }
}

/* ---------- INVOICE PDF (Single or filtered transactions) ---------- */

export async function generateInvoicePdf(book, transactions = []) {
  try {
    const bookName = book?.name || "Cashbook";
    
    // Load logo as base64 for PDF
    let logoSrc = '';
    try {
      const iconAsset = Asset.fromModule(require('../assets/images/cashtro-logo.png'));
      await iconAsset.downloadAsync();
      const b64 = await FileSystem.readAsStringAsync(iconAsset.localUri || iconAsset.uri, { encoding: 'base64' });
      logoSrc = `data:image/png;base64,${b64}`;
    } catch (e) {
      console.log("Could not load logo for PDF:", e);
    }
    let totalIn = 0, totalOut = 0, gstTotal = 0;

    transactions.forEach((t) => {
      const amt = parseFloat(t.amount || 0);
      if (t.type === "in" || t.type === "INCOME")  totalIn  += amt;
      if (t.type === "out" || t.type === "EXPENSE") totalOut += amt;
      if (t.isGstApplied) {
        gstTotal += parseFloat(t.cgst || 0) + parseFloat(t.sgst || 0) + parseFloat(t.igst || 0);
      }
    });

    const balance = totalIn - totalOut;
    const currency = book?.currency === 'USD' ? '$' : '₹';

    const rowsHtml = transactions.map((t) => {
      const isIn = t.type === "in" || t.type === "INCOME";
      const amt = parseFloat(t.amount || 0).toFixed(2);
      const noteText = clean(t.note || t.notes || '');
      return `
        <tr>
          <td>${formatDateForCsv(t.date)}</td>
          <td><span class="${isIn ? 'type-in' : 'type-out'}">${isIn ? 'Income' : 'Expense'}</span></td>
          <td>${clean(t.category?.name || t.category) || '—'}</td>
          <td class="${isIn ? 'amount-in' : 'amount-out'}">${isIn ? '+' : '−'}${currency}${amt}</td>
          <td>${clean(t.paymentMethod) || '—'}</td>
          <td>${t.isGstApplied ? `GST ${parseFloat(t.gstRate || 0)}%` : '—'}</td>
          <td class="note-cell">${noteText || '—'}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${PDF_STYLES}</style>
</head>
<body>
  ${pdfHeader(`Invoice — ${bookName}`, `Cashbook: <strong style="color:#0F172A">${bookName}</strong>`, logoSrc)}

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-card__label">Total Income</div>
      <div class="summary-card__value in">${currency}${totalIn.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card__label">Total Expenses</div>
      <div class="summary-card__value out">${currency}${totalOut.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card__label">Net Balance</div>
      <div class="summary-card__value bal">${currency}${balance.toFixed(2)}</div>
    </div>
  </div>

  ${gstTotal > 0 ? `<p style="margin-bottom:16px;font-size:12px;color:#6B7280;">Total GST collected: <strong style="color:#0F172A">${currency}${gstTotal.toFixed(2)}</strong></p>` : ''}

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Category</th>
        <th style="text-align:right">Amount</th>
        <th>Method</th>
        <th>GST</th>
        <th>Note / Remark</th>
      </tr>
    </thead>
    <tfoot>
      <tr><td colspan="7" style="height:35px; border:none; background:transparent;"></td></tr>
    </tfoot>
    <tbody>
      ${rowsHtml || `<tr><td colspan="7" class="empty-row">No transactions in this selection.</td></tr>`}
    </tbody>
  </table>

  <div class="pdf-footer">
    <span>© ${new Date().getFullYear()} <strong>Cashtro</strong> · cashtro.in</span>
    <span>${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}</span>
  </div>
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ 
      html,
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Cashtro invoice PDF",
      });
    }
  } catch (err) {
    console.warn("Error generating invoice PDF:", err);
  }
}

/* ---------- PASSBOOK PDF (All transactions for a book) ---------- */

export async function exportPassbookPdf(book, transactions = []) {
  try {
    const bookName = book?.name || "Cashbook";
    const createdAt = book?.createdAt || "";
    let totalIn = 0, totalOut = 0;
    const currency = book?.currency === 'USD' ? '$' : '₹';

    transactions.forEach((t) => {
      const amt = parseFloat(t.amount || 0);
      if (t.type === "in" || t.type === "INCOME")  totalIn  += amt;
      if (t.type === "out" || t.type === "EXPENSE") totalOut += amt;
    });

    const balance = totalIn - totalOut;

    const rowsHtml = transactions.map((t) => {
      const isIn = t.type === "in" || t.type === "INCOME";
      const amt = parseFloat(t.amount || 0).toFixed(2);
      const noteText = clean(t.note || t.notes || '');
      return `
        <tr>
          <td>${formatDateForCsv(t.date)}</td>
          <td><span class="${isIn ? 'type-in' : 'type-out'}">${isIn ? 'In' : 'Out'}</span></td>
          <td>${clean(t.category?.name || t.category) || '—'}</td>
          <td class="${isIn ? 'amount-in' : 'amount-out'}">${isIn ? '+' : '−'}${currency}${amt}</td>
          <td class="note-cell">${noteText || '—'}</td>
        </tr>`;
    }).join("");

    const subtitleParts = [`Cashbook: <strong style="color:#0F172A">${bookName}</strong>`];
    if (createdAt) subtitleParts.push(`Started: ${formatDateForCsv(createdAt)}`);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${PDF_STYLES}</style>
</head>
<body>
  ${pdfHeader(`Passbook — ${bookName}`, subtitleParts.join('&nbsp;&nbsp;·&nbsp;&nbsp;'))}

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-card__label">Total Income</div>
      <div class="summary-card__value in">${currency}${totalIn.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card__label">Total Expenses</div>
      <div class="summary-card__value out">${currency}${totalOut.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card__label">Closing Balance</div>
      <div class="summary-card__value bal">${currency}${balance.toFixed(2)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Category</th>
        <th style="text-align:right">Amount</th>
        <th>Note / Remark</th>
      </tr>
    </thead>
    <tfoot>
      <tr><td colspan="5" style="height:35px; border:none; background:transparent;"></td></tr>
    </tfoot>
    <tbody>
      ${rowsHtml || `<tr><td colspan="5" class="empty-row">No transactions recorded yet.</td></tr>`}
    </tbody>
  </table>

  <div class="pdf-footer">
    <span>© ${new Date().getFullYear()} <strong>Cashtro</strong> · cashtro.in</span>
    <span>${transactions.length} entr${transactions.length !== 1 ? 'ies' : 'y'}</span>
  </div>
</body>
</html>`;

    const { uri } = await Print.printToFileAsync({ 
      html,
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Cashtro passbook PDF",
      });
    }
  } catch (err) {
    console.warn("Error exporting passbook PDF:", err);
  }
}
