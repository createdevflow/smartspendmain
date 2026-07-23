// components/invoice/InvoiceCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { STATUS_META, useInvoice } from '../../context/InvoiceContext';
import { useAppTheme } from '../../context/ThemeContext';

function fmtAmt(n, sym = '₹') {
  return `${sym}${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export default function InvoiceCard({ invoice, onPress, onEdit, onDelete, onDuplicate }) {
  const { isDark } = useAppTheme();
  const invoiceCtx = useInvoice();
  if (!invoice) return null;

  const globalBiz = invoiceCtx?.bizProfile || {};
  const biz = { ...globalBiz, ...(invoice.bizProfile || {}) };
  const client = invoice.client || {};
  const clientName = client.name || client.businessName || 'Unnamed Client';
  const sym = biz.currency === 'INR' ? '₹' : (biz.currency || '₹');
  const isOverdue = invoice.status !== 'PAID' && invoice.dueDate && new Date(invoice.dueDate) < new Date();
  const effectiveStatus = isOverdue && invoice.status !== 'PAID' ? 'OVERDUE' : invoice.status;
  const meta = STATUS_META[effectiveStatus] || STATUS_META['DRAFT'];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.05)' },
        { borderLeftColor: meta.color }
      ]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <Text style={[styles.invNum, isDark && { color: '#60A5FA' }]}>{invoice.invoiceNumber}</Text>
          <Text style={[styles.clientName, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>{clientName}</Text>
        </View>
        <View style={styles.topRight}>
          <Text style={[styles.amount, isDark && { color: '#F8FAFC' }]}>{fmtAmt(invoice.grandTotal, sym)}</Text>
          <InvoiceStatusBadge status={effectiveStatus} size="sm" />
        </View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.bottomLeft}>
          <Feather name="calendar" size={12} color={isDark ? '#94A3B8' : '#9CA3AF'} />
          <Text style={[styles.dateText, isDark && { color: '#94A3B8' }]}>
            {fmtDate(invoice.invoiceDate)}
            {invoice.dueDate ? ` · Due ${fmtDate(invoice.dueDate)}` : ''}
          </Text>
          {isOverdue && (
            <View style={[styles.overdueChip, isDark && { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
              <Text style={[styles.overdueText, isDark && { color: '#F87171' }]}>Overdue</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={onDuplicate} style={[styles.iconBtn, isDark ? { backgroundColor: 'rgba(255,255,255,0.05)' } : { backgroundColor: '#F3F4F6' }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="copy" size={13} color={isDark ? '#CBD5E1' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={[styles.iconBtn, isDark ? { backgroundColor: 'rgba(255,255,255,0.05)' } : { backgroundColor: '#F3F4F6' }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="edit-2" size={13} color={isDark ? '#CBD5E1' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, isDark ? { backgroundColor: 'rgba(239,68,68,0.15)' } : { backgroundColor: '#FEE2E2' }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="trash-2" size={13} color={isDark ? '#F87171' : '#DC2626'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Partial payment progress bar */}
      {invoice.status === 'PARTIALLY_PAID' && invoice.grandTotal > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (invoice.paidAmount / invoice.grandTotal) * 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {fmtAmt(invoice.paidAmount, sym)} / {fmtAmt(invoice.grandTotal, sym)} paid
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    borderLeftWidth: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  topLeft: { flex: 1, marginRight: 12 },
  topRight: { alignItems: 'flex-end', gap: 6 },
  invNum: { fontSize: 13, fontWeight: '700', color: '#3D5AFC', marginBottom: 2 },
  clientName: { fontSize: 15, fontWeight: '700', color: '#12131A' },
  amount: { fontSize: 18, fontWeight: '800', color: '#12131A' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  dateText: { fontSize: 12, color: '#8A8D99' },
  overdueChip: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  overdueText: { fontSize: 10, fontWeight: '700', color: '#DC2626' },
  actions: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 8, borderRadius: 8 },
  progressWrap: { marginTop: 10, gap: 4 },
  progressTrack: { height: 4, backgroundColor: '#F3F4F6', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 2 },
  progressText: { fontSize: 11, color: '#8A8D99' },
});
