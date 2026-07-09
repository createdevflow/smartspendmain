// components/invoice/PaymentRecordSheet.js
// Record partial or full payments, with optional cashbook income transaction creation
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BottomSheetModal, BottomSheetBackdrop,
  BottomSheetTextInput, BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInvoice } from '../../context/InvoiceContext';
import { useTransactions } from '../../context/TransactionsContext';
import { useBooks } from '../../context/BooksContext';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card', 'Debit Card', 'NEFT', 'RTGS', 'IMPS', 'Demand Draft', 'Other'];

export default function PaymentRecordSheet({ sheetRef, invoice, snapPoints = ['65%', '90%'] }) {
  const { recordPayment } = useInvoice();
  const { addTransaction } = useTransactions();
  const { books, activeBookId } = useBooks();
  const insets = useSafeAreaInsets();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [createTx, setCreateTx] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState(activeBookId);
  const [saving, setSaving] = useState(false);

  const balanceDue = invoice?.balanceDue ?? invoice?.grandTotal ?? 0;
  const sym = invoice?.bizProfile?.currency === 'INR' ? '₹' : (invoice?.bizProfile?.currency || '₹');
  const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const handleSetFull = useCallback(() => setAmount(String(balanceDue.toFixed(2))), [balanceDue]);

  const handleSave = useCallback(async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid Amount', 'Please enter a valid payment amount.'); return; }
    if (amt > balanceDue + 0.01) { Alert.alert('Exceeds Balance', `Maximum payable is ${sym}${fmt(balanceDue)}.`); return; }
    setSaving(true);
    try {
      const updatedInvoice = await recordPayment(invoice.id, { amount: amt, method, date, notes });
      // Create income transaction
      if (createTx && selectedBookId && updatedInvoice) {
        const client = invoice.client;
        await addTransaction({
          bookId: selectedBookId,
          type: 'in',
          amount: amt,
          date,
          category: 'Invoice Payment',
          note: `Payment received: ${invoice.invoiceNumber} from ${client?.name || client?.businessName || 'Client'}`,
          paymentMethod: method,
          currency: invoice.bizProfile?.currency || 'INR',
        });
      }
      sheetRef.current?.dismiss();
      setAmount('');
      setNotes('');
    } catch (e) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [amount, balanceDue, method, date, notes, createTx, selectedBookId, invoice, recordPayment, addTransaction, sheetRef, sym, fmt]);

  if (!invoice) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40 }}
      backgroundStyle={{ borderRadius: 24, backgroundColor: '#FFFFFF' }}
      enableDynamicSizing={false}
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'fillParent'}
      android_keyboardInputMode="adjustResize"
      keyboardBlurBehavior="none"
    >
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
        <Text style={styles.title}>💰 Record Payment</Text>

        {/* Balance summary */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.sumLabel}>Invoice</Text>
            <Text style={styles.sumInv}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.sumRight}>
            <Text style={styles.sumLabel}>Balance Due</Text>
            <Text style={styles.sumBalance}>{sym}{fmt(balanceDue)}</Text>
          </View>
        </View>

        <BottomSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Amount */}
          <Text style={styles.fieldLabel}>Amount Received *</Text>
          <View style={styles.amtRow}>
            <View style={styles.amtInputWrap}>
              <Text style={styles.amtSym}>{sym}</Text>
              <BottomSheetTextInput
                style={styles.amtInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity style={styles.fullBtn} onPress={handleSetFull}>
              <Text style={styles.fullBtnText}>Full</Text>
            </TouchableOpacity>
          </View>

          {/* Payment method */}
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodChip, method === m && styles.methodChipActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date */}
          <Text style={styles.fieldLabel}>Payment Date</Text>
          <BottomSheetTextInput
            style={styles.fieldInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes</Text>
          <BottomSheetTextInput
            style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Payment reference, cheque number, etc."
            placeholderTextColor="#9CA3AF"
            multiline
          />

          {/* Create transaction toggle */}
          <View style={styles.txToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txToggleTitle}>Add as Income Transaction</Text>
              <Text style={styles.txToggleSub}>Automatically record this payment in your cashbook</Text>
            </View>
            <Switch
              value={createTx}
              onValueChange={setCreateTx}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={createTx ? '#3D5AFC' : '#9CA3AF'}
            />
          </View>

          {/* Cashbook selector (if createTx) */}
          {createTx && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.fieldLabel}>Select Cashbook</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {books.map(b => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bookChip, selectedBookId === b.id && styles.bookChipActive, { backgroundColor: selectedBookId === b.id ? (b.color || '#3D5AFC') : '#F3F4F6' }]}
                    onPress={() => setSelectedBookId(b.id)}
                  >
                    <Text style={[styles.bookChipText, selectedBookId === b.id && { color: '#FFFFFF' }]}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Payment history */}
          {invoice.payments && invoice.payments.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Payment History</Text>
              {invoice.payments.map((p, i) => (
                <View key={i} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyAmt}>{sym}{parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} via {p.method}</Text>
                    <Text style={styles.historyDate}>{p.date} {p.notes ? `· ${p.notes}` : ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </BottomSheetScrollView>
        <View style={styles.footerNav}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
              <>
                <Feather name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Record Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#12131A', marginBottom: 16 },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#C7D2FE' },
  sumLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  sumInv: { fontSize: 14, fontWeight: '700', color: '#3D5AFC' },
  sumRight: { alignItems: 'flex-end' },
  sumBalance: { fontSize: 22, fontWeight: '900', color: '#12131A' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  amtRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  amtInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#3D5AFC', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FAFAFA' },
  amtSym: { fontSize: 20, fontWeight: '800', color: '#3D5AFC', marginRight: 6 },
  amtInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#12131A', paddingVertical: 12 },
  fullBtn: { backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  fullBtnText: { fontSize: 14, fontWeight: '800', color: '#3D5AFC' },
  methodChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  methodChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3D5AFC' },
  methodText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  methodTextActive: { color: '#3D5AFC', fontWeight: '800' },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#12131A', backgroundColor: '#FAFAFA', marginBottom: 16 },
  txToggleRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#F9FAFB', borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  txToggleTitle: { fontSize: 14, fontWeight: '700', color: '#12131A', marginBottom: 2 },
  txToggleSub: { fontSize: 12, color: '#6B7280' },
  bookChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  bookChipActive: {},
  bookChipText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  historySection: { marginBottom: 16 },
  historyTitle: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginTop: 4 },
  historyAmt: { fontSize: 13, fontWeight: '700', color: '#12131A' },
  historyDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  footerNav: { paddingTop: 12, paddingBottom: Platform.OS === 'android' ? 36 : 24, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#3D5AFC', borderRadius: 14, paddingVertical: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
