// components/invoice/ProductSearchSheet.js
// Smart product/service search bottom sheet — recently used first, inline add new
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BottomSheetModal, BottomSheetBackdrop,
  BottomSheetTextInput, BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInvoice } from '../../context/InvoiceContext';

const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 9, 12, 14, 14.5, 18, 28];
const UNITS = ['Nos', 'Kg', 'Litre', 'Meter', 'Sq Ft', 'Box', 'Pack', 'Set', 'Dozen', 'Hour', 'Day', 'Month', 'Year', 'Service'];

export default function ProductSearchSheet({ sheetRef, onSelect, snapPoints = ['75%', '95%'] }) {
  const { products, addProduct, deleteProduct } = useInvoice();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', hsnCode: '', unit: 'Nos',
    quantity: '1', rate: '', gstRate: 18, discount: '0', category: '', gstIncluded: false,
  });

  const sorted = useMemo(() =>
    [...products].sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0)),
  [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.hsnCode || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const handleSelect = useCallback((product) => {
    setQuery('');
    setShowAdd(false);
    sheetRef.current?.dismiss();
    onSelect({
      ...product,
      quantity: form.quantity || product.quantity || '1',
    });
  }, [onSelect, sheetRef, form.quantity]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Product name is required.'); return; }
    if (!form.rate) { Alert.alert('Required', 'Rate is required.'); return; }
    setSaving(true);
    try {
      const product = await addProduct(form);
      handleSelect(product);
      setForm({ name: '', description: '', hsnCode: '', unit: 'Nos', quantity: '1', rate: '', gstRate: 18, discount: '0', category: '', gstIncluded: false });
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }, [form, addProduct, handleSelect]);

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
        <Text style={styles.title}>{showAdd ? '+ Add Product / Service' : '📦 Select Product / Service'}</Text>

        {!showAdd ? (
          <>
            <View style={styles.searchRow}>
              <Feather name="search" size={16} color="#9CA3AF" />
              <BottomSheetTextInput
                style={styles.searchInput}
                placeholder="Search by name, HSN, category..."
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
              />
              {!!query && <TouchableOpacity onPress={() => setQuery('')}><Feather name="x" size={16} color="#9CA3AF" /></TouchableOpacity>}
            </View>

            <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowAdd(true)}>
              <View style={styles.addIcon}><Feather name="plus" size={16} color="#3D5AFC" /></View>
              <Text style={styles.addNewText}>Add New Product / Service</Text>
            </TouchableOpacity>

            <BottomSheetScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={styles.emptyText}>No products found</Text>
                  <Text style={styles.emptySubText}>Save products to quickly add them to invoices</Text>
                </View>
              ) : filtered.map(prod => (
                <TouchableOpacity key={prod.id} style={styles.prodRow} onPress={() => handleSelect(prod)}>
                  <View style={styles.prodIcon}>
                    <Feather name="package" size={18} color="#3D5AFC" />
                  </View>
                  <View style={styles.prodInfo}>
                    <Text style={styles.prodName}>{prod.name}</Text>
                    {!!prod.description && <Text style={styles.prodDesc} numberOfLines={1}>{prod.description}</Text>}
                    <View style={styles.prodMeta}>
                      {!!prod.hsnCode && <Text style={styles.metaChip}>HSN: {prod.hsnCode}</Text>}
                      <Text style={styles.metaChip}>GST: {prod.gstRate}%</Text>
                      {!!prod.unit && <Text style={styles.metaChip}>{prod.unit}</Text>}
                    </View>
                  </View>
                  <Text style={styles.prodRate}>₹{parseFloat(prod.rate || 0).toLocaleString('en-IN')}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Delete?', `Delete "${prod.name}"?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(prod.id) },
                  ])} style={{ padding: 6 }}>
                    <Feather name="trash-2" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </BottomSheetScrollView>
          </>
        ) : (
          <>
            <BottomSheetScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
            <PField label="Product / Service Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Web Design Services" />
            <PField label="Description" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Brief description..." multiline />
            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <PField label="HSN / SAC Code" value={form.hsnCode} onChange={v => setForm(p => ({ ...p, hsnCode: v }))} placeholder="998314" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <PField label="Category" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} placeholder="e.g. Services" />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <PField label="Default Rate (₹) *" value={form.rate} onChange={v => setForm(p => ({ ...p, rate: v }))} placeholder="0.00" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <PField label="Default Qty" value={form.quantity} onChange={v => setForm(p => ({ ...p, quantity: v }))} placeholder="1" keyboardType="decimal-pad" />
              </View>
            </View>

            {/* GST Calculation Mode */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#12131A' }}>Rate Type (GST Mode)</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  {form.gstIncluded ? `Includes ${form.gstRate}% GST (Base: ₹${(parseFloat(form.rate || 0) * 100 / (100 + (parseFloat(form.gstRate) || 0))).toFixed(2)})` : 'Excludes GST (Normal)'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.rateChip, !form.gstIncluded && styles.rateChipActive, { marginBottom: 0 }]}
                  onPress={() => setForm(p => ({ ...p, gstIncluded: false }))}
                >
                  <Text style={[styles.rateChipText, !form.gstIncluded && styles.rateChipTextActive]}>Excl. GST</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rateChip, form.gstIncluded && styles.rateChipActive, { marginBottom: 0 }]}
                  onPress={() => setForm(p => ({ ...p, gstIncluded: true }))}
                >
                  <Text style={[styles.rateChipText, form.gstIncluded && styles.rateChipTextActive]}>Incl. GST</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* GST Rate selector */}
            <Text style={styles.fieldLabel}>GST Rate</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {GST_RATES.map(rate => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.rateChip, form.gstRate === rate && styles.rateChipActive]}
                  onPress={() => setForm(p => ({ ...p, gstRate: rate }))}
                >
                  <Text style={[styles.rateChipText, form.gstRate === rate && styles.rateChipTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Unit selector */}
            <Text style={styles.fieldLabel}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.rateChip, form.unit === u && styles.rateChipActive]}
                  onPress={() => setForm(p => ({ ...p, unit: u }))}
                >
                  <Text style={[styles.rateChipText, form.unit === u && styles.rateChipTextActive]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            </BottomSheetScrollView>
            <View style={styles.footerNav}>
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdd(false); setForm({ name: '', description: '', hsnCode: '', unit: 'Nos', quantity: '1', rate: '', gstRate: 18, discount: '0', category: '' }); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save & Add</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}

function PField({ label, value, onChange, placeholder, multiline, keyboardType }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <BottomSheetTextInput
        style={[styles.fieldInput, multiline && { height: 70, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="sentences"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#12131A', marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#12131A' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#EFF6FF', borderRadius: 12, marginBottom: 12 },
  addIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  addNewText: { fontSize: 14, fontWeight: '700', color: '#3D5AFC' },
  list: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  prodRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 8, gap: 10 },
  prodIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  prodInfo: { flex: 1 },
  prodName: { fontSize: 14, fontWeight: '700', color: '#12131A' },
  prodDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  prodMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaChip: { fontSize: 10, color: '#6B7280', backgroundColor: '#E5E7EB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  prodRate: { fontSize: 15, fontWeight: '800', color: '#12131A' },
  formScroll: { flex: 1 },
  row2: { flexDirection: 'row' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#12131A', backgroundColor: '#FAFAFA' },
  rateChip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  rateChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3D5AFC' },
  rateChipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  rateChipTextActive: { color: '#3D5AFC', fontWeight: '800' },
  footerNav: { paddingTop: 12, paddingBottom: Platform.OS === 'android' ? 36 : 24, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  saveBtn: { flex: 2, padding: 14, backgroundColor: '#3D5AFC', borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
