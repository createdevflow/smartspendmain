// components/invoice/ClientSearchSheet.js
// Smart typeahead client selector bottom sheet
import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  BottomSheetModal, BottomSheetBackdrop,
  BottomSheetTextInput, BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInvoice } from '../../context/InvoiceContext';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry',
  'Chandigarh','Lakshadweep','Andaman & Nicobar Islands','Dadra & Nagar Haveli',
  'Daman & Diu',
];

export default function ClientSearchSheet({ sheetRef, onSelect, snapPoints = ['70%', '95%'] }) {
  const { clients, invoices, addClient, deleteClient } = useInvoice();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', businessName: '', gstin: '', pan: '',
    address: '', city: '', state: '', email: '', phone: '', notes: '',
  });

  const sorted = useMemo(() => {
    const map = new Map();
    (clients || []).forEach(c => {
      const key = (c.id || c.name || c.businessName || '').toLowerCase().trim();
      if (key) map.set(key, c);
    });
    (invoices || []).forEach(i => {
      if (i.client && (i.client.name || i.client.businessName)) {
        const key = (i.client.id || i.client.name || i.client.businessName || '').toLowerCase().trim();
        if (key && !map.has(key)) map.set(key, i.client);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.lastUsed || b.createdAt || 0) - new Date(a.lastUsed || a.createdAt || 0));
  }, [clients, invoices]);

  const filtered = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.businessName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.gstin || '').toLowerCase().includes(q)
    );
  }, [sorted, query]);

  const handleSelect = useCallback((client) => {
    setQuery('');
    setShowAddForm(false);
    sheetRef.current?.dismiss();
    onSelect(client);
  }, [onSelect, sheetRef]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Client name is required.');
      return;
    }
    setSaving(true);
    try {
      const client = await addClient(form);
      handleSelect(client);
      setForm({ name: '', businessName: '', gstin: '', pan: '', address: '', city: '', state: '', email: '', phone: '', notes: '' });
      setShowAddForm(false);
    } finally {
      setSaving(false);
    }
  }, [form, addClient, handleSelect]);

  const handleDelete = useCallback((id, name) => {
    Alert.alert(`Delete "${name}"?`, 'This will remove the client from your directory.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteClient(id) },
    ]);
  }, [deleteClient]);

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
        <Text style={styles.title}>{showAddForm ? '+ Add New Client' : '👤 Select Client'}</Text>

        {!showAddForm ? (
          <>
            {/* Search */}
            <View style={styles.searchRow}>
              <Feather name="search" size={16} color="#9CA3AF" />
              <BottomSheetTextInput
                style={styles.searchInput}
                placeholder="Search by name, email, GSTIN..."
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Feather name="x" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Add New Button */}
            <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowAddForm(true)}>
              <View style={styles.addNewIcon}><Feather name="plus" size={16} color="#3D5AFC" /></View>
              <Text style={styles.addNewText}>Add New Client</Text>
            </TouchableOpacity>

            {/* Client list */}
            <BottomSheetScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>👤</Text>
                  <Text style={styles.emptyText}>No clients found</Text>
                  <Text style={styles.emptySubText}>Add a new client to get started</Text>
                </View>
              ) : filtered.map(client => (
                <TouchableOpacity key={client.id} style={styles.clientRow} onPress={() => handleSelect(client)}>
                  <View style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>
                      {(client.name || client.businessName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name || '—'}</Text>
                    {!!client.businessName && <Text style={styles.clientBiz}>{client.businessName}</Text>}
                    {!!client.gstin && <Text style={styles.clientDetail}>GSTIN: {client.gstin}</Text>}
                    {!!client.state && <Text style={styles.clientDetail}>{client.city ? `${client.city}, ` : ''}{client.state}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(client.id, client.name)} style={styles.deleteBtn}>
                    <Feather name="trash-2" size={14} color="#DC2626" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </BottomSheetScrollView>
          </>
        ) : (
          /* Add New Client Form */
          <>
            <BottomSheetScrollView style={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
            <FormField label="Client Name *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Rajesh Kumar" />
            <FormField label="Business Name" value={form.businessName} onChange={v => setForm(p => ({ ...p, businessName: v }))} placeholder="e.g. Kumar Enterprises" />
            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FormField label="GSTIN" value={form.gstin} onChange={v => setForm(p => ({ ...p, gstin: v }))} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="PAN" value={form.pan} onChange={v => setForm(p => ({ ...p, pan: v }))} placeholder="AAAAA0000A" autoCapitalize="characters" />
              </View>
            </View>
            <FormField label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="Street, locality" multiline />
            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <FormField label="City" value={form.city} onChange={v => setForm(p => ({ ...p, city: v }))} placeholder="City" />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="State" value={form.state} onChange={v => setForm(p => ({ ...p, state: v }))} placeholder="State" />
              </View>
            </View>
            <FormField label="Email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="client@email.com" keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            <FormField label="Notes" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} placeholder="Any notes..." multiline />

            </BottomSheetScrollView>
            <View style={styles.footerNav}>
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddForm(false); setForm({ name: '', businessName: '', gstin: '', pan: '', address: '', city: '', state: '', email: '', phone: '', notes: '' }); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Save & Select</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}

function FormField({ label, value, onChange, placeholder, multiline, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <BottomSheetTextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'words'}
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
  addNewIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  addNewText: { fontSize: 14, fontWeight: '700', color: '#3D5AFC' },
  list: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#9CA3AF' },
  clientRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 8, gap: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 18, fontWeight: '800', color: '#3D5AFC' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 14, fontWeight: '700', color: '#12131A' },
  clientBiz: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  clientDetail: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  deleteBtn: { padding: 8 },
  formScroll: { flex: 1 },
  formRow: { flexDirection: 'row' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#12131A', backgroundColor: '#FAFAFA' },
  fieldInputMulti: { height: 80, textAlignVertical: 'top' },
  footerNav: { paddingTop: 12, paddingBottom: Platform.OS === 'android' ? 36 : 24, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF' },
  formBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  saveBtn: { flex: 2, padding: 14, backgroundColor: '#3D5AFC', borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
