// components/invoice/InvoicePreview.js
// Full professional invoice renderer — used for on-screen display, PDF export, and image capture.
// Supports 5 themes: modern, classic, minimal, corporate, creative.
// Rendered as a React Native View, captured via react-native-view-shot or printed via expo-print.

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useInvoice } from '../../context/InvoiceContext';

// ── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
  modern: {
    headerBg: '#3D5AFC',
    headerText: '#FFFFFF',
    headerSub: 'rgba(255,255,255,0.75)',
    accent: '#3D5AFC',
    accentLight: '#EFF6FF',
    tableBg: '#F8FAFC',
    tableHeader: '#EFF6FF',
    tableHeaderText: '#3D5AFC',
    borderColor: '#E5E7EB',
    cardBg: '#FFFFFF',
    textPrimary: '#12131A',
    textMuted: '#6B7280',
  },
  classic: {
    headerBg: '#1E3A8A',
    headerText: '#FFFFFF',
    headerSub: 'rgba(255,255,255,0.7)',
    accent: '#1E3A8A',
    accentLight: '#DBEAFE',
    tableBg: '#FFFFFF',
    tableHeader: '#1E3A8A',
    tableHeaderText: '#FFFFFF',
    borderColor: '#CBD5E1',
    cardBg: '#FFFFFF',
    textPrimary: '#1E293B',
    textMuted: '#64748B',
  },
  minimal: {
    headerBg: '#FFFFFF',
    headerText: '#12131A',
    headerSub: '#6B7280',
    accent: '#374151',
    accentLight: '#F9FAFB',
    tableBg: '#FFFFFF',
    tableHeader: '#F9FAFB',
    tableHeaderText: '#374151',
    borderColor: '#E5E7EB',
    cardBg: '#FFFFFF',
    textPrimary: '#111827',
    textMuted: '#9CA3AF',
  },
  corporate: {
    headerBg: '#0F172A',
    headerText: '#FFFFFF',
    headerSub: 'rgba(255,255,255,0.65)',
    accent: '#0F172A',
    accentLight: '#F1F5F9',
    tableBg: '#F8FAFC',
    tableHeader: '#0F172A',
    tableHeaderText: '#FFFFFF',
    borderColor: '#CBD5E1',
    cardBg: '#FFFFFF',
    textPrimary: '#0F172A',
    textMuted: '#64748B',
  },
  creative: {
    headerBg: '#F26D21',
    headerText: '#FFFFFF',
    headerSub: 'rgba(255,255,255,0.75)',
    accent: '#F26D21',
    accentLight: '#EDE9FE',
    tableBg: '#FFFFFF',
    tableHeader: '#F5F3FF',
    tableHeaderText: '#F26D21',
    borderColor: '#DDD6FE',
    cardBg: '#FFFFFF',
    textPrimary: '#1E1B4B',
    textMuted: '#6B7280',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n, decimals = 2) {
  return parseFloat(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Sub-components ───────────────────────────────────────────────────────────
function AddressBlock({ label, name, address, city, state, gstin, email, phone, t }) {
  return (
    <View style={styles.addressBlock}>
      <Text style={[styles.sectionLabel, { color: t.accent }]}>{label}</Text>
      {!!name && <Text style={[styles.addrName, { color: t.textPrimary }]}>{name}</Text>}
      {!!address && <Text style={[styles.addrLine, { color: t.textMuted }]}>{address}</Text>}
      {!!(city || state) && (
        <Text style={[styles.addrLine, { color: t.textMuted }]}>
          {[city, state].filter(Boolean).join(', ')}
        </Text>
      )}
      {!!gstin && <Text style={[styles.addrDetail, { color: t.textMuted }]}>GSTIN: {gstin}</Text>}
      {!!email && <Text style={[styles.addrDetail, { color: t.textMuted }]}>{email}</Text>}
      {!!phone && <Text style={[styles.addrDetail, { color: t.textMuted }]}>{phone}</Text>}
    </View>
  );
}

function Divider({ color }) {
  return <View style={[styles.divider, { borderColor: color }]} />;
}

// ── Main Component ───────────────────────────────────────────────────────────
const InvoicePreview = forwardRef(({ invoice, showBranding = true, width = 380 }, ref) => {
  const invoiceCtx = useInvoice();
  if (!invoice) return null;

  const screenW = Dimensions.get('window').width;
  const finalWidth = typeof width === 'number' ? Math.min(width, screenW - 32) : width;

  const globalBiz = invoiceCtx?.bizProfile || {};
  const invBiz = invoice.bizProfile || {};
  const biz = { ...globalBiz, ...invBiz };
  if (!biz.businessName && globalBiz.businessName) biz.businessName = globalBiz.businessName;
  if (!biz.address && globalBiz.address) biz.address = globalBiz.address;
  if (!biz.city && globalBiz.city) biz.city = globalBiz.city;
  if (!biz.state && globalBiz.state) biz.state = globalBiz.state;
  if (!biz.gstin && globalBiz.gstin) biz.gstin = globalBiz.gstin;
  if (!biz.logoUri && globalBiz.logoUri) biz.logoUri = globalBiz.logoUri;
  if (!biz.signatureUri && globalBiz.signatureUri) biz.signatureUri = globalBiz.signatureUri;

  const themeName = invoice.theme || 'modern';
  const t = THEMES[themeName] || THEMES.modern;
  const client = invoice.client || {};
  const items = invoice.items || [];

  const currSym = biz.currency === 'INR' ? '₹' : (biz.currency || '₹');

  return (
    <View ref={ref} style={[styles.root, { width: finalWidth, backgroundColor: t.cardBg }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: t.headerBg }]}>
        <View style={styles.headerTop}>
          {/* Logo + Biz name */}
          <View style={styles.headerLeft}>
            {biz.logoUri ? (
              <Image source={{ uri: biz.logoUri }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.logoPlaceholder, { borderColor: t.headerText }]}>
                <Text style={[styles.logoPlaceholderText, { color: t.headerText }]}>
                  {(biz.businessName || 'B').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.bizName, { color: t.headerText }]} numberOfLines={2}>
                {biz.businessName || 'Your Business Name'}
              </Text>
              {!!biz.gstin && (
                <Text style={[styles.bizDetail, { color: t.headerSub }]}>GSTIN: {biz.gstin}</Text>
              )}
              {!!biz.mobile && (
                <Text style={[styles.bizDetail, { color: t.headerSub }]}>{biz.mobile}</Text>
              )}
            </View>
          </View>

          {/* INVOICE title */}
          <View style={[styles.headerRight, { maxWidth: '46%', flexShrink: 1 }]}>
            <Text style={[styles.invoiceTitle, { color: t.headerText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>INVOICE</Text>
            <View style={[styles.invNumBadge, { borderColor: t.headerText, maxWidth: '100%' }]}>
              <Text style={[styles.invNum, { color: t.headerText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{invoice.invoiceNumber}</Text>
            </View>
          </View>
        </View>

        {/* Biz address row */}
        {!!(biz.address || biz.city) && (
          <Text style={[styles.bizAddressLine, { color: t.headerSub }]}>
            {[biz.address, biz.city, biz.state, biz.pincode, biz.country].filter(Boolean).join(', ')}
          </Text>
        )}
      </View>

      {/* ── DATE & META ROW ── */}
      <View style={[styles.metaRow, { backgroundColor: t.accentLight }]}>
        <View style={styles.metaCell}>
          <Text style={[styles.metaLabel, { color: t.textMuted }]}>Invoice Date</Text>
          <Text style={[styles.metaValue, { color: t.textPrimary }]}>{fmtDate(invoice.invoiceDate)}</Text>
        </View>
        <View style={styles.metaDividerV} />
        <View style={styles.metaCell}>
          <Text style={[styles.metaLabel, { color: t.textMuted }]}>Due Date</Text>
          <Text style={[styles.metaValue, { color: t.textPrimary }]}>{fmtDate(invoice.dueDate)}</Text>
        </View>
        {!!invoice.po && (
          <>
            <View style={styles.metaDividerV} />
            <View style={styles.metaCell}>
              <Text style={[styles.metaLabel, { color: t.textMuted }]}>PO #</Text>
              <Text style={[styles.metaValue, { color: t.textPrimary }]}>{invoice.po}</Text>
            </View>
          </>
        )}
      </View>

      {/* ── BILLED TO / FROM ── */}
      <View style={[styles.addressRow, { borderColor: t.borderColor }]}>
        <AddressBlock
          label="BILLED TO"
          name={client.name || client.businessName}
          address={client.address}
          city={client.city}
          state={client.state}
          gstin={client.gstin}
          email={client.email}
          phone={client.phone}
          t={t}
        />
        <View style={[styles.addressDivider, { backgroundColor: t.borderColor }]} />
        <AddressBlock
          label="FROM"
          name={biz.businessName}
          address={biz.address}
          city={biz.city}
          state={biz.state}
          gstin={biz.gstin}
          email={biz.email}
          phone={biz.mobile}
          t={t}
        />
      </View>

      {/* ── ITEMS TABLE ── */}
      <View style={styles.tableContainer}>
        {/* Table Header */}
        <View style={[styles.tableHeaderRow, { backgroundColor: t.tableHeader }]}>
          <Text style={[styles.thDesc, { color: t.tableHeaderText }]}>#  Description</Text>
          <Text style={[styles.thQty, { color: t.tableHeaderText }]}>Qty</Text>
          <Text style={[styles.thRate, { color: t.tableHeaderText }]}>Rate</Text>
          <Text style={[styles.thDisc, { color: t.tableHeaderText }]}>Disc%</Text>
          <Text style={[styles.thGst, { color: t.tableHeaderText }]}>GST</Text>
          <Text style={[styles.thAmt, { color: t.tableHeaderText }]}>Amount</Text>
        </View>

        {/* Table Rows */}
        {items.map((item, idx) => (
          <View
            key={idx}
            style={[
              styles.tableRow,
              { backgroundColor: idx % 2 === 0 ? t.tableBg : t.cardBg },
              { borderBottomColor: t.borderColor },
            ]}
          >
            <View style={styles.tdDesc}>
              <Text style={[styles.itemIdx, { color: t.accent }]}>{idx + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: t.textPrimary }]} numberOfLines={2}>
                  {item.name || item.description || '—'}
                </Text>
                {!!item.description && item.description !== item.name && (
                  <Text style={[styles.itemDesc, { color: t.textMuted }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {!!item.hsnCode && (
                  <Text style={[styles.hsnCode, { color: t.textMuted }]}>HSN: {item.hsnCode}</Text>
                )}
                {item.gstIncluded && (
                  <Text style={[{ fontSize: 10, color: t.accent, marginTop: 2, fontStyle: 'italic' }]}>
                    *Incl. {item.gstRate}% GST (MRP: {currSym}{fmt(item.rate)})
                  </Text>
                )}
              </View>
            </View>
            <Text style={[styles.tdQty, { color: t.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {fmt(item.quantity, 0)}{item.unit ? ` ${item.unit}` : ''}
            </Text>
            <Text style={[styles.tdRate, { color: t.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{fmt(item.baseRate || item.rate)}</Text>
            <Text style={[styles.tdDisc, { color: t.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{item.discount || 0}%</Text>
            <Text style={[styles.tdGst, { color: t.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
              {currSym}{fmt(item.totalGstAmt !== undefined ? item.totalGstAmt : (((item.taxable || ((item.quantity||0)*(item.baseRate||item.rate||0)*(1-(item.discount||0)/100))) * (item.gstRate||0)) / 100))}
            </Text>
            <Text style={[styles.tdAmt, { color: t.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{currSym}{fmt(item.lineTotal || item.taxable)}</Text>
          </View>
        ))}
      </View>

      {/* ── TOTALS SECTION ── */}
      <View style={[styles.totalsSection, { borderColor: t.borderColor }]}>
        <View style={styles.totalsLeft}>
          {/* Amount in words */}
          <View style={[styles.wordsBox, { backgroundColor: t.accentLight, borderColor: t.borderColor }]}>
            <Text style={[styles.wordsLabel, { color: t.accent }]}>Amount in Words</Text>
            <Text style={[styles.wordsValue, { color: t.textPrimary }]} numberOfLines={3}>
              {invoice.amountInWords || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.totalsRight}>
          <View style={[styles.grandRow, { backgroundColor: t.accent }]}>
            <Text style={[styles.grandLabel, { flexShrink: 1, marginRight: 6 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Total Amount</Text>
            <Text style={[styles.grandValue, { flexShrink: 1, textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{currSym}{fmt(invoice.grandTotal)}</Text>
          </View>
          {invoice.paidAmount > 0 && (
            <>
              <TotalRow label="Amount Paid" value={`${currSym}${fmt(invoice.paidAmount)}`} t={t} />
              <TotalRow label="Balance Due" value={`${currSym}${fmt(invoice.balanceDue)}`} t={t} />
            </>
          )}
        </View>
      </View>

      {/* ── PAYMENT DETAILS ── */}
      {!!(biz.bankName || biz.accountNumber || biz.upiId) && (
        <View style={[styles.paymentSection, { borderColor: t.borderColor, backgroundColor: t.accentLight }]}>
          <Text style={[styles.sectionLabel, { color: t.accent, marginBottom: 8 }]}>PAYMENT DETAILS</Text>
          <View style={styles.paymentRow}>
            {!!(biz.bankName || biz.accountNumber) && (
              <View style={styles.bankDetails}>
                {!!biz.bankName && <PayRow label="Bank" value={biz.bankName} t={t} />}
                {!!biz.accountNumber && <PayRow label="Account No." value={biz.accountNumber} t={t} />}
                {!!biz.ifscCode && <PayRow label="IFSC" value={biz.ifscCode} t={t} />}
                {!!biz.accountType && <PayRow label="Type" value={biz.accountType} t={t} />}
                {!!biz.branchName && <PayRow label="Branch" value={biz.branchName} t={t} />}
              </View>
            )}
            {!!biz.upiId && (
              <View style={[styles.upiBox, { borderColor: t.borderColor }]}>
                <Text style={[styles.upiLabel, { color: t.accent }]}>UPI</Text>
                <Text style={[styles.upiId, { color: t.textPrimary }]}>{biz.upiId}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── NOTES & TERMS ── */}
      {!!(invoice.notes || invoice.terms) && (
        <View style={[styles.notesSection, { borderColor: t.borderColor }]}>
          {!!invoice.notes && (
            <View style={styles.notesBlock}>
              <Text style={[styles.sectionLabel, { color: t.accent }]}>NOTES</Text>
              <Text style={[styles.notesText, { color: t.textMuted }]}>{invoice.notes}</Text>
            </View>
          )}
          {!!invoice.terms && (
            <View style={styles.notesBlock}>
              <Text style={[styles.sectionLabel, { color: t.accent }]}>TERMS & CONDITIONS</Text>
              <Text style={[styles.notesText, { color: t.textMuted }]}>{invoice.terms}</Text>
            </View>
          )}
        </View>
      )}

      {/* ── SIGNATURE ── */}
      {!!biz.signatureUri && (
        <View style={[styles.signatureSection, { borderColor: t.borderColor }]}>
          <Image source={{ uri: biz.signatureUri }} style={styles.signatureImg} resizeMode="contain" />
          <View style={[styles.signatureLine, { backgroundColor: t.borderColor }]} />
          <Text style={[styles.signatureLabel, { color: t.textMuted }]}>
            {biz.proprietorName || biz.businessName}
          </Text>
          <Text style={[styles.signatureSubLabel, { color: t.textMuted }]}>Authorized Signatory</Text>
        </View>
      )}

      {/* ── FOOTER / BRANDING ── */}
      {showBranding && (
        <View style={[styles.footer, { borderColor: t.borderColor, backgroundColor: t.accentLight }]}>
          <Text style={[styles.footerText, { color: t.textMuted }]}>
            Generated by{' '}
            <Text style={{ fontWeight: '800', color: t.accent }}>Cashtro</Text>
            {' · '}cashtro.in
          </Text>
        </View>
      )}

    </View>
  );
});

// ── Helper row components ────────────────────────────────────────────────────
function TotalRow({ label, value, t, muted, green, bold, accent }) {
  const valueColor = green ? '#16A34A' : (accent || t.textPrimary);
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, { color: t.textMuted, flexShrink: 1, marginRight: 6 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
      <Text style={[styles.totalValue, { color: valueColor, flexShrink: 1, textAlign: 'right' }, bold && { fontWeight: '800' }, muted && { color: t.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
        {value}
      </Text>
    </View>
  );
}

function PayRow({ label, value, t }) {
  return (
    <View style={styles.payRowInner}>
      <Text style={[styles.payLabel, { color: t.textMuted }]}>{label}:</Text>
      <Text style={[styles.payValue, { color: t.textPrimary }]}>{value}</Text>
    </View>
  );
}

InvoicePreview.displayName = 'InvoicePreview';
export default InvoicePreview;

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },

  // Header
  header: { padding: 20, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  headerRight: { alignItems: 'flex-end', maxWidth: '46%', flexShrink: 1 },
  logo: { width: 56, height: 56, borderRadius: 8 },
  logoPlaceholder: { width: 56, height: 56, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  logoPlaceholderText: { fontSize: 24, fontWeight: '900' },
  bizName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  bizDetail: { fontSize: 11, marginTop: 1 },
  bizAddressLine: { fontSize: 11, marginTop: 4 },
  invoiceTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  invNumBadge: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-end', maxWidth: '100%' },
  invNum: { fontSize: 12, fontWeight: '700' },

  // Meta row
  metaRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16 },
  metaCell: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '700' },
  metaDividerV: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },

  // Address
  addressRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1 },
  addressBlock: { flex: 1, padding: 14 },
  addressDivider: { width: 1 },
  sectionLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  addrName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  addrLine: { fontSize: 12, lineHeight: 18 },
  addrDetail: { fontSize: 11, marginTop: 2 },

  // Table
  tableContainer: { marginTop: 2 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center' },
  thDesc: { flex: 2.0, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  thQty:  { flex: 0.5, fontSize: 10, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  thRate: { flex: 0.9, fontSize: 10, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  thDisc: { flex: 0.5, fontSize: 10, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  thGst:  { flex: 0.9, fontSize: 10, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  thAmt:  { flex: 1.4, fontSize: 10, fontWeight: '700', textAlign: 'right', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, alignItems: 'flex-start' },
  tdDesc: { flex: 2.0, flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  tdQty:  { flex: 0.5, fontSize: 11, textAlign: 'center' },
  tdRate: { flex: 0.9, fontSize: 11, textAlign: 'right' },
  tdDisc: { flex: 0.5, fontSize: 11, textAlign: 'center' },
  tdGst:  { flex: 0.9, fontSize: 11, textAlign: 'right' },
  tdAmt:  { flex: 1.4, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  itemIdx: { fontSize: 11, fontWeight: '800', marginTop: 1, minWidth: 18 },
  itemName: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  itemDesc: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  hsnCode: { fontSize: 10, marginTop: 2 },

  // Totals
  totalsSection: { flexDirection: 'row', borderTopWidth: 1.5, paddingHorizontal: 12, paddingVertical: 14 },
  totalsLeft: { flex: 1.1, paddingRight: 10 },
  totalsRight: { flex: 1.3, gap: 6 },
  wordsBox: { padding: 10, borderRadius: 8, borderWidth: 1 },
  wordsLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  wordsValue: { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 12 },
  totalValue: { fontSize: 12, fontWeight: '600' },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 8, marginTop: 6 },
  grandLabel: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  grandValue: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  divider: { borderTopWidth: 1, marginHorizontal: 12, marginVertical: 4 },

  // Payment details
  paymentSection: { padding: 14, borderTopWidth: 1 },
  paymentRow: { flexDirection: 'row', gap: 16 },
  bankDetails: { flex: 1, gap: 4 },
  payRowInner: { flexDirection: 'row', gap: 4 },
  payLabel: { fontSize: 11, width: 90 },
  payValue: { fontSize: 11, fontWeight: '600', flex: 1 },
  upiBox: { padding: 10, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  upiLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4 },
  upiId: { fontSize: 12, fontWeight: '700' },

  // Notes & terms
  notesSection: { borderTopWidth: 1, padding: 14, gap: 12 },
  notesBlock: { gap: 4 },
  notesText: { fontSize: 11, lineHeight: 17 },

  // Signature
  signatureSection: { borderTopWidth: 1, padding: 14, alignItems: 'flex-end' },
  signatureImg: { width: 140, height: 50, marginBottom: 6 },
  signatureLine: { height: 1, width: 180, marginBottom: 4 },
  signatureLabel: { fontSize: 12, fontWeight: '700' },
  signatureSubLabel: { fontSize: 10 },

  // Footer
  footer: { padding: 14, borderTopWidth: 1, alignItems: 'center' },
  footerText: { fontSize: 11 },
});
