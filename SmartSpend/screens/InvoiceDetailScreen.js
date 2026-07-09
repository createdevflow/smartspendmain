// screens/InvoiceDetailScreen.js
// View, share, export, and manage a single invoice
import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Share, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { useInvoice } from '../context/InvoiceContext';
import InvoicePreview from '../components/invoice/InvoicePreview';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import PaymentRecordSheet from '../components/invoice/PaymentRecordSheet';

export default function InvoiceDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { invoices, markStatus, deleteInvoice, duplicateInvoice, settings, bizProfile } = useInvoice();

  const invoiceId = route.params?.invoiceId;
  const invoice = invoices.find(i => i.id === invoiceId);

  const globalBiz = bizProfile || {};
  const invBiz = invoice?.bizProfile || {};
  const biz = { ...globalBiz, ...invBiz };
  const sym = biz.currency === 'INR' ? '₹' : (biz.currency || '₹');

  const viewRef = useRef(null);
  const paymentSheetRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    Alert.alert('Delete Invoice', `Are you sure you want to delete ${invoice?.invoiceNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteInvoice(invoice.id);
          navigation.goBack();
        }
      },
    ]);
  }, [invoice, deleteInvoice, navigation]);

  const handleDuplicate = useCallback(async () => {
    const newInv = await duplicateInvoice(invoice.id);
    if (newInv) {
      navigation.replace('InvoiceCreate', { invoiceId: newInv.id });
    }
  }, [invoice, duplicateInvoice, navigation]);

  const handleStatusChange = useCallback((newStatus) => {
    markStatus(invoice.id, newStatus);
  }, [invoice, markStatus]);

  // ── Export (PDF / Image) ───────────────────────────────────────────────────
  const exportPdf = useCallback(async () => {
    if (!invoice) return;
    setExporting('pdf');
    try {
      const html = generatePdfHtml(invoice, settings, globalBiz);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Export Complete', `Saved to: ${uri}`);
      }
      if (invoice.status === 'DRAFT' || invoice.status === 'PENDING') {
        markStatus(invoice.id, 'SENT');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Failed to generate PDF.');
    } finally {
      setExporting(false);
    }
  }, [invoice, settings, markStatus]);

  const exportImage = useCallback(async () => {
    if (!viewRef.current) return;
    setExporting('image');
    try {
      const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
      if (invoice.status === 'DRAFT' || invoice.status === 'PENDING') {
        markStatus(invoice.id, 'SENT');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Failed to generate image.');
    } finally {
      setExporting(false);
    }
  }, [invoice, markStatus]);

  const shareText = useCallback(async () => {
    const client = invoice.client;
    const clientName = client?.name || client?.businessName || 'Client';
    const sym = invoice.bizProfile?.currency === 'INR' ? '₹' : (invoice.bizProfile?.currency || '₹');
    const amt = parseFloat(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const msg = `Hi ${clientName},\n\nPlease find attached the invoice ${invoice.invoiceNumber} for ${sym}${amt}.\n\nThank you for your business!\n${invoice.bizProfile?.businessName || ''}`;

    try {
      await Share.share({ message: msg });
      if (invoice.status === 'DRAFT' || invoice.status === 'PENDING') {
        markStatus(invoice.id, 'SENT');
      }
    } catch {
      // Share failed silently — user can try again
    }

  }, [invoice, markStatus]);

  if (!invoice) return null;

  const isOverdue = invoice.status !== 'PAID' && invoice.dueDate && new Date(invoice.dueDate) < new Date();
  const effectiveStatus = isOverdue && invoice.status !== 'PAID' ? 'OVERDUE' : invoice.status;

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#12131A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>{invoice.invoiceNumber}</Text>
            <InvoiceStatusBadge status={effectiveStatus} size="sm" />
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('InvoiceCreate', { invoiceId: invoice.id })}
          >
            <Feather name="edit-2" size={18} color="#2D8CFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Action Bar */}
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => paymentSheetRef.current?.present()}>
              <View style={styles.currIconBadge}>
                <Text style={styles.currIconText}>{sym}</Text>
              </View>
              <Text style={styles.actionBtnPrimaryText}>Record Payment</Text>
            </TouchableOpacity>

            <View style={styles.exportGrid}>
              <TouchableOpacity style={styles.exportCard} onPress={exportPdf} disabled={exporting === 'pdf'}>
                {exporting === 'pdf' ? <ActivityIndicator size="small" color="#2D8CFF" /> : <Feather name="file-text" size={16} color="#2D8CFF" />}
                <Text style={styles.exportCardText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportCard} onPress={exportImage} disabled={exporting === 'image'}>
                {exporting === 'image' ? <ActivityIndicator size="small" color="#2D8CFF" /> : <Feather name="image" size={16} color="#2D8CFF" />}
                <Text style={styles.exportCardText}>Export Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportCard} onPress={shareText}>
                <Feather name="share-2" size={16} color="#2D8CFF" />
                <Text style={styles.exportCardText}>Share Summary</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick status change */}
          {invoice.status !== 'PAID' && invoice.status !== 'PARTIALLY_PAID' && (
            <View style={styles.statusChangeRow}>
              <Text style={styles.statusChangeLabel}>Mark as:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['SENT', 'VIEWED', 'CANCELLED', 'VOID'].filter(s => s !== invoice.status).map(s => (
                  <TouchableOpacity key={s} style={styles.statusChip} onPress={() => handleStatusChange(s)}>
                    <Text style={styles.statusChipText}>{s.charAt(0) + s.slice(1).toLowerCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Rendered Preview */}
          <View style={styles.previewContainer}>
            {/* View container that we can capture as image */}
            <View collapsable={false} ref={viewRef}>
              <InvoicePreview invoice={invoice} showBranding={!settings.whiteLabelEnabled} width={Platform.OS === 'ios' ? 360 : 380} />
            </View>
          </View>

          {/* Danger zone */}
          <View style={styles.dangerZone}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDuplicate}>
              <Feather name="copy" size={16} color="#4B5563" />
              <Text style={styles.secondaryBtnText}>Duplicate Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete}>
              <Feather name="trash-2" size={16} color="#DC2626" />
              <Text style={styles.dangerBtnText}>Delete Invoice</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <PaymentRecordSheet sheetRef={paymentSheetRef} invoice={invoice} />
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
}

// ── Super simple HTML generator for expo-print (PDF) ─────────────────────────
function generatePdfHtml(invoice, settings) {
  const biz = invoice.bizProfile;
  const client = invoice.client;
  const sym = biz.currency === 'INR' ? '₹' : (biz.currency || '₹');
  const fmt = n => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const theme = invoice.theme || 'modern';
  const showBranding = !settings.whiteLabelEnabled;

  const color = theme === 'modern' ? '#2D8CFF' : theme === 'classic' ? '#232333' : theme === 'minimal' ? '#374151' : theme === 'corporate' ? '#0F172A' : '#F26D21';

  let itemsHtml = invoice.items.map((i, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">
        <div style="font-weight: bold;">${i.name}</div>
        ${i.description ? `<div style="font-size: 11px; color: #6B7280;">${i.description}</div>` : ''}
        ${i.hsnCode ? `<div style="font-size: 10px; color: #6B7280;">HSN: ${i.hsnCode}</div>` : ''}
        ${i.gstIncluded ? `<div style="font-size: 10px; color: ${color}; font-style: italic;">*Incl. ${i.gstRate}% GST (MRP: ${sym}${fmt(i.rate)})</div>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center; white-space: nowrap;">${i.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; white-space: nowrap;">${fmt(i.baseRate || i.rate)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: center; white-space: nowrap;">${i.discount}%</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; white-space: nowrap;">${sym}${fmt(i.totalGstAmt !== undefined ? i.totalGstAmt : (((i.taxable || ((i.quantity||0)*(i.baseRate||i.rate||0)*(1-(i.discount||0)/100))) * (i.gstRate||0)) / 100))}</td>
      <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: bold; white-space: nowrap;">${sym}${fmt(i.lineTotal || i.taxable)}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px; color: #111827; }
          .header { background-color: ${color}; color: white; padding: 30px; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo-placeholder { width: 60px; height: 60px; border: 2px solid white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .logo { max-width: 150px; max-height: 80px; margin-bottom: 10px; }
          .meta { display: flex; padding: 20px 30px; background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB; }
          .meta-col { flex: 1; }
          .meta-label { font-size: 10px; text-transform: uppercase; color: #6B7280; font-weight: bold; margin-bottom: 5px; }
          .meta-value { font-weight: bold; font-size: 14px; }
          .addresses { display: flex; padding: 30px; border-bottom: 1px solid #E5E7EB; }
          .addr-col { flex: 1; padding-right: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #F9FAFB; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6B7280; }
          .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
          .totals-table { width: 420px; max-width: 100%; }
          .totals-table td { padding: 8px 10px; text-align: right; }
          .grand { font-size: 18px; font-weight: bold; background-color: ${color}; color: white; border-radius: 8px; }
          .footer { margin-top: 50px; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="flex: 1; margin-right: 20px;">
            ${biz.logoUri ? `<img src="${biz.logoUri}" class="logo" />` : `<div class="logo-placeholder">${(biz.businessName || 'B').charAt(0).toUpperCase()}</div>`}
            <div style="font-size: 20px; font-weight: bold; word-break: break-word;">${biz.businessName || 'Your Business Name'}</div>
            ${biz.gstin ? `<div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">GSTIN: ${biz.gstin}</div>` : ''}
          </div>
          <div style="text-align: right; max-width: 48%; flex-shrink: 1;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 2px;">INVOICE</div>
            <div style="font-size: 15px; margin-top: 10px; font-weight: bold; background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 6px; display: inline-block; word-break: break-all;"># ${invoice.invoiceNumber}</div>
          </div>
        </div>

        <div class="meta">
          <div class="meta-col">
            <div class="meta-label">Invoice Date</div>
            <div class="meta-value">${invoice.invoiceDate || '-'}</div>
          </div>
          <div class="meta-col">
            <div class="meta-label">Due Date</div>
            <div class="meta-value">${invoice.dueDate || '-'}</div>
          </div>
        </div>

        <div class="addresses">
          <div class="addr-col">
            <div class="meta-label">BILLED TO</div>
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${client?.name || client?.businessName}</div>
            <div style="font-size: 13px; color: #4B5563; line-height: 1.5;">
              ${client?.address ? `${client.address}<br/>` : ''}
              ${[client?.city, client?.state].filter(Boolean).join(', ')}<br/>
              ${client?.gstin ? `GSTIN: ${client.gstin}<br/>` : ''}
            </div>
          </div>
          <div class="addr-col">
            <div class="meta-label">FROM</div>
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${biz.businessName}</div>
            <div style="font-size: 13px; color: #4B5563; line-height: 1.5;">
              ${biz.address ? `${biz.address}<br/>` : ''}
              ${[biz.city, biz.state].filter(Boolean).join(', ')}<br/>
              ${biz.gstin ? `GSTIN: ${biz.gstin}<br/>` : ''}
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">Description</th>
              <th style="width: 8%; text-align: center;">Qty</th>
              <th style="width: 13%; text-align: right;">Rate</th>
              <th style="width: 7%; text-align: center;">Disc</th>
              <th style="width: 12%; text-align: right;">GST</th>
              <th style="width: 20%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <table class="totals-table">
            <tr><td colspan="2" style="padding: 15px 0;"><div class="grand"><table style="width:100%; color:white;"><tr><td style="text-align:left; padding:15px; font-weight:bold;">Total Amount</td><td style="text-align:right; padding:15px; font-size: 19px; font-weight:bold; word-break: break-all; white-space: nowrap;">${sym}${fmt(invoice.grandTotal)}</td></tr></table></div></td></tr>
            ${invoice.paidAmount > 0 ? `<tr><td style="color:#16A34A; font-weight:bold;">Amount Paid:</td><td style="color:#16A34A; font-weight:bold; white-space: nowrap;">${sym}${fmt(invoice.paidAmount)}</td></tr>` : ''}
            ${invoice.paidAmount > 0 ? `<tr><td style="font-weight:bold;">Balance Due:</td><td style="font-weight:bold; white-space: nowrap;">${sym}${fmt(invoice.balanceDue)}</td></tr>` : ''}
          </table>
        </div>

        <div style="margin-top: 40px;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${color}; margin-bottom: 5px;">Amount in Words</div>
          <div style="font-size: 13px; font-style: italic; background: #F9FAFB; padding: 15px; border-radius: 8px;">${invoice.amountInWords}</div>
        </div>

        ${biz.bankName || biz.upiId ? `
        <div style="margin-top: 40px; display: flex; gap: 40px; background: #F9FAFB; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB;">
          ${biz.bankName ? `
          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${color}; margin-bottom: 10px;">Bank Details</div>
            <table style="font-size: 12px;">
              <tr><td style="color:#6B7280; padding-right: 15px; padding-bottom: 5px;">Bank:</td><td style="font-weight:bold;">${biz.bankName}</td></tr>
              ${biz.accountNumber ? `<tr><td style="color:#6B7280; padding-right: 15px; padding-bottom: 5px;">A/C No:</td><td style="font-weight:bold;">${biz.accountNumber}</td></tr>` : ''}
              ${biz.ifscCode ? `<tr><td style="color:#6B7280; padding-right: 15px; padding-bottom: 5px;">IFSC:</td><td style="font-weight:bold;">${biz.ifscCode}</td></tr>` : ''}
            </table>
          </div>
          ` : ''}
          ${biz.upiId ? `
          <div>
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${color}; margin-bottom: 10px;">UPI Payment</div>
            <div style="font-weight:bold; font-size: 14px;">${biz.upiId}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${biz.signatureUri ? `
        <div style="margin-top: 60px; text-align: right;">
          <img src="${biz.signatureUri}" style="max-height: 80px; max-width: 200px; margin-bottom: 10px;" />
          <div style="border-top: 1px solid #000; width: 250px; margin-left: auto; padding-top: 5px; font-weight: bold;">${biz.proprietorName || biz.businessName}</div>
          <div style="font-size: 12px; color: #6B7280;">Authorized Signatory</div>
        </div>
        ` : ''}

        ${showBranding ? `
        <div class="footer">
          Generated by <b style="color: ${color}">Cashtro</b> &middot; The Smart Finance App
        </div>
        ` : ''}
      </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F1F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F1F6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#12131A', marginBottom: 2 },
  editBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 10 },
  body: { flex: 1 },
  actionContainer: { padding: 16, gap: 12 },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D8CFF', borderRadius: 14, paddingVertical: 15, shadowColor: '#2D8CFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  currIconBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  currIconText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  actionBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  exportGrid: { flexDirection: 'row', gap: 10 },
  exportCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  exportCardText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  statusChangeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  statusChangeLabel: { fontSize: 12, fontWeight: '600', color: '#747487' },
  statusChip: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  statusChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  previewContainer: { paddingHorizontal: 16, paddingBottom: 24, alignItems: 'center' },
  dangerZone: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#4B5563' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#FCA5A5' },
  dangerBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
});
