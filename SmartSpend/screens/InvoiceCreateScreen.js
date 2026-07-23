// screens/InvoiceCreateScreen.js
// Smart multi-step invoice creation wizard with auto-GST, client/product search, live preview
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useInvoice, computeInvoiceGst } from '../context/InvoiceContext';
import ClientSearchSheet from '../components/invoice/ClientSearchSheet';
import ProductSearchSheet from '../components/invoice/ProductSearchSheet';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';

const THEMES = [
  { key: 'modern', label: 'Modern', color: '#2D8CFF' },
  { key: 'classic', label: 'Classic', color: '#232333' },
  { key: 'minimal', label: 'Minimal', color: '#374151' },
  { key: 'corporate', label: 'Corporate', color: '#0F172A' },
  { key: 'creative', label: 'Creative', color: '#F26D21' },
];

const GST_RATES = [0, 5, 12, 18, 28];
const TODAY = new Date().toISOString().split('T')[0];
const DUE_DEFAULT = (() => {
  const d = new Date(); d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
})();

export default function InvoiceCreateScreen() {
  const { isDark } = useAppTheme();
  const styles = React.useMemo(() => getStyles(isDark), [isDark]);
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const {
    invoices, clients, bizProfile, settings, createInvoice, updateInvoice,
    getNextInvoiceNumber, touchClient, touchProduct,
  } = useInvoice();

  const editInvoiceId = route.params?.invoiceId;
  const editInvoice = editInvoiceId ? invoices.find(i => i.id === editInvoiceId) : null;

  const recentClients = useMemo(() => {
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
    return Array.from(map.values())
      .sort((a, b) => new Date(b.lastUsed || b.createdAt || 0) - new Date(a.lastUsed || a.createdAt || 0))
      .slice(0, 5);
  }, [clients, invoices]);

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0); // 0=Client, 1=Items, 2=Details, 3=Review

  // ── Form state ──────────────────────────────────────────────────────────────
  const [client, setClient]         = useState(editInvoice?.client || null);
  const [series, setSeries]         = useState(editInvoice?.series || settings?.defaultSeries || 'INV');
  const [items, setItems]           = useState(editInvoice?.items || []);
  const [invoiceDate, setInvoiceDate] = useState(editInvoice?.invoiceDate || TODAY);
  const [dueDate, setDueDate]       = useState(editInvoice?.dueDate || DUE_DEFAULT);
  const [invoiceNum, setInvoiceNum] = useState(editInvoice?.invoiceNumber || getNextInvoiceNumber(editInvoice?.series || settings?.defaultSeries || 'INV'));
  const [notes, setNotes]           = useState(editInvoice?.notes || bizProfile.defaultNotes || '');
  const [terms, setTerms]           = useState(editInvoice?.terms || bizProfile.defaultTerms || '');
  const [theme, setTheme]           = useState(editInvoice?.theme || settings.defaultTheme || 'modern');
  const [po, setPo]                 = useState(editInvoice?.po || '');
  const [saving, setSaving]         = useState(false);

  const clientSheetRef  = useRef(null);
  const productSheetRef = useRef(null);
  const scrollViewRef   = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    if (!editInvoiceId) {
      setInvoiceNum(getNextInvoiceNumber(series, invoiceDate));
    }
  }, [series, invoiceDate, getNextInvoiceNumber, editInvoiceId]);

  // ── GST computation (reactive) ───────────────────────────────────────────────
  const gstResult = useMemo(() =>
    computeInvoiceGst({
      sellerState: bizProfile.state,
      buyerState: client?.state,
      items,
    }),
  [bizProfile.state, client?.state, items]);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const addItem = useCallback((product) => {
    setItems(prev => [...prev, {
      id: `item_${Date.now()}`,
      name: product.name,
      description: product.description || '',
      hsnCode: product.hsnCode || '',
      unit: product.unit || 'Nos',
      quantity: parseFloat(product.quantity) || 1,
      rate: parseFloat(product.rate) || 0,
      gstRate: parseFloat(product.gstRate) || 18,
      discount: parseFloat(product.discount) || 0,
    }]);
    if (product.id) touchProduct(product.id);
  }, [touchProduct]);

  const updateItem = useCallback((id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const addManualItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: `item_${Date.now()}`,
      name: '', description: '', hsnCode: '', unit: 'Nos',
      quantity: 1, rate: 0, gstRate: 18, discount: 0,
    }]);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (status = 'DRAFT') => {
    if (!client) { Alert.alert('Client Required', 'Please select a client first.'); return; }
    if (items.length === 0) { Alert.alert('Items Required', 'Please add at least one item.'); return; }
    setSaving(true);
    try {
      const data = { client, series, items, invoiceDate, dueDate, notes, terms, theme, po, status, invoiceNumber: invoiceNum };
      if (editInvoiceId) {
        await updateInvoice(editInvoiceId, data);
      } else {
        await createInvoice(data);
        if (client.id) touchClient(client.id);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [client, items, invoiceDate, dueDate, notes, terms, theme, po, editInvoiceId, invoiceNum, createInvoice, updateInvoice, touchClient, navigation]);

  const sym = bizProfile.currency === 'INR' ? '₹' : (bizProfile.currency || '₹');
  const fmtAmt = (n) => `${sym}${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const steps = ['Client', 'Items', 'Details', 'Review'];

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#12131A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={styles.headerTitle}>{editInvoiceId ? 'Edit Invoice' : 'New Invoice'}</Text>
            <Text style={styles.headerSub}>{step + 1} of {steps.length} · {steps[step]}</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleSave('DRAFT')}
            style={styles.saveDraftBtn}
            disabled={saving}
          >
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => i < step + 1 && setStep(i)}
              >
                <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                  {i < step
                    ? <Feather name="check" size={12} color="#FFFFFF" />
                    : <Text style={[styles.stepNum, i === step && styles.stepNumActive]}>{i + 1}</Text>
                  }
                </View>
                <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
              </TouchableOpacity>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── STEP 0: Client ── */}
            {step === 0 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Who are you billing?</Text>
                <Text style={styles.stepDesc}>Select an existing client or add a new one</Text>

                {client ? (
                  <View style={styles.selectedClient}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>
                        {(client.name || client.businessName || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{client.name}</Text>
                      {!!client.businessName && <Text style={styles.clientBiz}>{client.businessName}</Text>}
                      <Text style={styles.clientDetail}>{[client.city, client.state].filter(Boolean).join(', ')}</Text>
                      {!!client.gstin && <Text style={styles.clientDetail}>GSTIN: {client.gstin}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => clientSheetRef.current?.present()} style={styles.changeBtn}>
                      <Text style={styles.changeBtnText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.selectClientBtn}
                      onPress={() => clientSheetRef.current?.present()}
                    >
                      <Feather name="user-plus" size={20} color="#2D8CFF" />
                      <Text style={styles.selectClientText}>Select / Add New Client</Text>
                      <Feather name="chevron-right" size={18} color="#2D8CFF" />
                    </TouchableOpacity>

                    {recentClients.length > 0 && (
                      <View style={styles.recentSection}>
                        <Text style={styles.recentTitle}>⚡ Saved Clients from Previous Invoices</Text>
                        <Text style={styles.recentSub}>Click any client below to autofill details instantly:</Text>
                        {recentClients.map(c => (
                          <TouchableOpacity
                            key={c.id || c.name || Math.random()}
                            style={styles.recentCard}
                            onPress={() => setClient(c)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.recentAvatar}>
                              <Text style={styles.recentAvatarText}>
                                {(c.name || c.businessName || '?').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.recentName}>{c.name || c.businessName}</Text>
                              {!!c.businessName && c.name !== c.businessName && (
                                <Text style={styles.recentBiz}>{c.businessName}</Text>
                              )}
                              <Text style={styles.recentDetail}>
                                {[c.city, c.state].filter(Boolean).join(', ') || (c.gstin ? `GSTIN: ${c.gstin}` : 'Saved Client')}
                              </Text>
                            </View>
                            <View style={styles.autofillBadge}>
                              <Feather name="check-circle" size={14} color="#16A34A" />
                              <Text style={styles.autofillText}>Autofill</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}

                {/* GST info */}
                {client?.state && bizProfile.state && (
                  <View style={[styles.gstInfoCard, gstResult.isIntraState ? styles.gstIntra : styles.gstInter]}>
                    <Feather name="percent" size={14} color={gstResult.isIntraState ? '#16A34A' : '#2D8CFF'} />
                    <Text style={[styles.gstInfoText, { color: gstResult.isIntraState ? '#166534' : '#1E40AF' }]}>
                      {gstResult.isIntraState
                        ? `Intra-state (${client.state}): CGST + SGST will be applied`
                        : `Inter-state (${bizProfile.state} → ${client.state}): IGST will be applied`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ── STEP 1: Items ── */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add Products / Services</Text>
                <Text style={styles.stepDesc}>Select from your library or add manually</Text>

                {items.map((item, idx) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdate={updateItem}
                    onRemove={() => removeItem(item.id)}
                    sym={sym}
                    gstResult={gstResult}
                  />
                ))}

                <View style={styles.addItemRow}>
                  <TouchableOpacity
                    style={styles.addFromLibBtn}
                    onPress={() => productSheetRef.current?.present()}
                  >
                    <Feather name="package" size={16} color="#2D8CFF" />
                    <Text style={styles.addFromLibText}>From Library</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.addManualBtn} onPress={addManualItem}>
                    <Feather name="plus" size={16} color="#747487" />
                    <Text style={styles.addManualText}>Add Manual</Text>
                  </TouchableOpacity>
                </View>

                {/* Totals summary */}
                {items.length > 0 && (
                  <View style={styles.totalsSummary}>
                    <View style={[styles.grandLine, { borderTopWidth: 0, marginTop: 0, paddingTop: 0 }]}>
                      <Text style={styles.grandLabel}>Total Amount</Text>
                      <Text style={[styles.grandValue, { flexShrink: 1, textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{fmtAmt(gstResult.grandTotal)}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── STEP 2: Details ── */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Invoice Details</Text>
                <Text style={styles.stepDesc}>These are pre-filled from your business profile</Text>

                <Text style={styles.fieldLabel}>Document Series</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {['INV', 'SALES', 'SERV', 'EST', 'PROFORMA'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.themeChip, series === s && styles.themeChipActive, series === s && { borderColor: '#2D8CFF' }]}
                      onPress={() => setSeries(s)}
                    >
                      <Text style={[styles.themeLabel, series === s && { color: '#2D8CFF', fontWeight: '800' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Field label="Invoice Number" value={invoiceNum} onChange={setInvoiceNum} placeholder="INV-26270001" />
                <View style={styles.dateRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Field label="Invoice Date" value={invoiceDate} onChange={setInvoiceDate} placeholder="YYYY-MM-DD" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Due Date" value={dueDate} onChange={setDueDate} placeholder="YYYY-MM-DD" />
                  </View>
                </View>
                <Field label="PO Number (optional)" value={po} onChange={setPo} placeholder="e.g. PO-2026-001" />
                <Field label="Notes" value={notes} onChange={setNotes} placeholder="Payment terms, thank you message..." multiline />
                <Field label="Terms & Conditions" value={terms} onChange={setTerms} placeholder="Your standard terms..." multiline />

                {/* Theme picker */}
                <Text style={styles.fieldLabel}>Invoice Theme</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {THEMES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.themeChip, theme === t.key && styles.themeChipActive, theme === t.key && { borderColor: t.color }]}
                      onPress={() => setTheme(t.key)}
                    >
                      <View style={[styles.themeColor, { backgroundColor: t.color }]} />
                      <Text style={[styles.themeLabel, theme === t.key && { color: t.color, fontWeight: '800' }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Review Invoice</Text>
                <Text style={styles.stepDesc}>Everything looks good? Send or save.</Text>

                {/* Summary card */}
                <View style={styles.reviewCard}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Invoice #</Text>
                    <Text style={styles.reviewValue}>{invoiceNum}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Client</Text>
                    <Text style={styles.reviewValue}>{client?.name || '—'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Items</Text>
                    <Text style={styles.reviewValue}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Due Date</Text>
                    <Text style={styles.reviewValue}>{dueDate || '—'}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>GST Type</Text>
                    <Text style={styles.reviewValue}>{gstResult.isIntraState ? 'CGST + SGST' : 'IGST'}</Text>
                  </View>
                  <View style={[styles.reviewRow, styles.reviewTotal]}>
                    <Text style={styles.reviewTotalLabel}>Grand Total</Text>
                    <Text style={[styles.reviewTotalValue, { flexShrink: 1, textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{fmtAmt(gstResult.grandTotal)}</Text>
                  </View>
                </View>

                {/* Action buttons */}
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => handleSave('SENT')}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                    <>
                      <Feather name="send" size={18} color="#FFFFFF" />
                      <Text style={styles.sendBtnText}>Save & Mark as Sent</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pendingBtn}
                  onPress={() => handleSave('PENDING')}
                  disabled={saving}
                >
                  <Feather name="clock" size={18} color="#2D8CFF" />
                  <Text style={styles.pendingBtnText}>Save as Pending</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.draftBtn}
                  onPress={() => handleSave('DRAFT')}
                  disabled={saving}
                >
                  <Text style={styles.draftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom nav */}
          <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 12 }]}>
            {step > 0 && (
              <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(s => s - 1)}>
                <Feather name="arrow-left" size={18} color="#374151" />
                <Text style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < steps.length - 1 && (
              <TouchableOpacity
                style={[styles.nextBtn, step === 0 && { flex: 1 }]}
                onPress={() => {
                  if (step === 0 && !client) { Alert.alert('Select Client', 'Please select a client to continue.'); return; }
                  if (step === 1 && items.length === 0) { Alert.alert('Add Items', 'Please add at least one item.'); return; }
                  setStep(s => s + 1);
                }}
              >
                <Text style={styles.nextBtnText}>Continue</Text>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Sheets */}
        <ClientSearchSheet
          sheetRef={clientSheetRef}
          onSelect={(c) => { setClient(c); if (c.id) touchClient(c.id); }}
        />
        <ProductSearchSheet
          sheetRef={productSheetRef}
          onSelect={addItem}
        />
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
}

// ── Helper: Item row component ──────────────────────────────────────────────
const GST_CHIPS = [0, 5, 12, 18, 28];

function ItemRow({ item, index, onUpdate, onRemove, sym, gstResult }) {
  const processed = gstResult.processedItems?.[index] || {};

  // Local edit state to prevent "0append" issue — show empty string while typing
  const [qtyText, setQtyText] = React.useState(String(item.quantity));
  const [rateText, setRateText] = React.useState(String(item.rate));
  const [discText, setDiscText] = React.useState(String(item.discount || 0));

  // Sync from parent when item changes (e.g. from library selection)
  React.useEffect(() => { setQtyText(String(item.quantity)); }, [item.quantity]);
  React.useEffect(() => { setRateText(String(item.rate)); }, [item.rate]);
  React.useEffect(() => { setDiscText(String(item.discount || 0)); }, [item.discount]);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <TextInput
          style={styles.itemName}
          value={item.name}
          onChangeText={v => onUpdate(item.id, 'name', v)}
          placeholder="Item name"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
          <Feather name="x" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.itemDesc}
        value={item.description}
        onChangeText={v => onUpdate(item.id, 'description', v)}
        placeholder="Description (optional)"
        placeholderTextColor="#9CA3AF"
      />
      <View style={styles.itemFields}>
        {/* Qty */}
        <View style={styles.itemField}>
          <Text style={styles.itemFieldLabel}>Qty</Text>
          <TextInput
            style={styles.itemFieldInput}
            value={qtyText}
            onFocus={() => setQtyText('')}
            onChangeText={v => setQtyText(v)}
            onBlur={() => {
              const n = parseFloat(qtyText);
              const val = isNaN(n) || n <= 0 ? item.quantity : n;
              setQtyText(String(val));
              onUpdate(item.id, 'quantity', val);
            }}
            keyboardType="decimal-pad"
            placeholder=""
          />
        </View>
        {/* Rate */}
        <View style={styles.itemField}>
          <Text style={styles.itemFieldLabel}>Rate ({sym})</Text>
          <TextInput
            style={styles.itemFieldInput}
            value={rateText}
            onFocus={() => setRateText('')}
            onChangeText={v => setRateText(v)}
            onBlur={() => {
              const n = parseFloat(rateText);
              const val = isNaN(n) ? item.rate : n;
              setRateText(String(val));
              onUpdate(item.id, 'rate', val);
            }}
            keyboardType="decimal-pad"
            placeholder=""
          />
        </View>
        {/* Disc */}
        <View style={styles.itemField}>
          <Text style={styles.itemFieldLabel}>Disc%</Text>
          <TextInput
            style={styles.itemFieldInput}
            value={discText}
            onFocus={() => setDiscText('')}
            onChangeText={v => setDiscText(v)}
            onBlur={() => {
              const n = parseFloat(discText);
              const val = isNaN(n) ? 0 : Math.min(n, 100);
              setDiscText(String(val));
              onUpdate(item.id, 'discount', val);
            }}
            keyboardType="decimal-pad"
            placeholder=""
          />
        </View>
      </View>

      {/* GST Rate selector — chips instead of free-text input */}
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.itemFieldLabel}>GST Rate</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {GST_CHIPS.map(rate => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.gstChip,
                item.gstRate === rate && styles.gstChipActive,
              ]}
              onPress={() => onUpdate(item.id, 'gstRate', rate)}
            >
              <Text style={[styles.gstChipText, item.gstRate === rate && styles.gstChipTextActive]}>
                {rate}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* GST Type Toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, backgroundColor: isDark ? '#0F172A' : '#F9FAFB', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' }}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#F8FAFC' : '#374151' }}>GST Calculation:</Text>
          {item.gstIncluded && (
            <Text style={{ fontSize: 10, color: '#2D8CFF', fontWeight: '600', marginTop: 1 }}>
              Base: {sym}{parseFloat(processed.baseRate || item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} + {item.gstRate}% GST
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={[
              { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
              !item.gstIncluded ? { backgroundColor: '#2D8CFF', borderColor: '#2D8CFF' } : { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
            ]}
            onPress={() => onUpdate(item.id, 'gstIncluded', false)}
          >
            <Text style={[{ fontSize: 11, fontWeight: '700' }, !item.gstIncluded ? { color: '#FFFFFF' } : { color: isDark ? '#94A3B8' : '#4B5563' }]}>
              Excl. GST
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
              item.gstIncluded ? { backgroundColor: '#2D8CFF', borderColor: '#2D8CFF' } : { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }
            ]}
            onPress={() => onUpdate(item.id, 'gstIncluded', true)}
          >
            <Text style={[{ fontSize: 11, fontWeight: '700' }, item.gstIncluded ? { color: '#FFFFFF' } : { color: isDark ? '#94A3B8' : '#4B5563' }]}>
              Incl. GST
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemTotals}>
        <Text style={styles.itemTaxable}>Taxable: {sym}{parseFloat(processed.taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | GST: {sym}{parseFloat(processed.totalGstAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.itemTotal}>Line Total: {sym}{parseFloat(processed.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );
}

function TotalLine({ label, value, muted }) {
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLineLabel, muted && { color: isDark ? '#64748B' : '#9CA3AF' }]}>{label}</Text>
      <Text style={[styles.totalLineValue, muted && { color: isDark ? '#64748B' : '#9CA3AF' }]}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, multiline }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
      />
    </View>
  );
}

const getStyles = (isDark) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: isDark ? '#0F172A' : '#F1F1F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F1F6' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: isDark ? '#F8FAFC' : '#12131A' },
  headerSub: { fontSize: 12, color: isDark ? '#94A3B8' : '#8A8D99', marginTop: 1 },
  saveDraftBtn: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  saveDraftText: { fontSize: 13, fontWeight: '700', color: isDark ? '#F8FAFC' : '#374151' },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F1F6' },
  stepItem: { alignItems: 'center', width: 50 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepDotActive: { backgroundColor: '#16A34A' },
  stepNum: { fontSize: 13, fontWeight: '700', color: isDark ? '#64748B' : '#9CA3AF' },
  stepNumActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: isDark ? '#64748B' : '#9CA3AF', textAlign: 'center' },
  stepLabelActive: { color: '#16A34A' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginTop: 14, marginHorizontal: -5 },
  stepLineDone: { backgroundColor: '#16A34A' },

  body: { flex: 1 },
  stepContent: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: isDark ? '#F8FAFC' : '#12131A', marginBottom: 6 },
  stepDesc: { fontSize: 14, color: isDark ? '#94A3B8' : '#8A8D99', marginBottom: 20 },

  // Client step
  selectedClient: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1.5, borderColor: '#2D8CFF' },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 20, fontWeight: '800', color: '#2D8CFF' },
  clientName: { fontSize: 15, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A' },
  clientBiz: { fontSize: 13, color: isDark ? '#94A3B8' : '#747487', marginTop: 2 },
  clientDetail: { fontSize: 12, color: isDark ? '#64748B' : '#9CA3AF', marginTop: 1 },
  changeBtn: { backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  changeBtnText: { fontSize: 13, fontWeight: '700', color: '#2D8CFF' },
  selectClientBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#BFDBFE', borderStyle: 'dashed' },
  selectClientText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2D8CFF' },
  recentSection: { marginTop: 24, gap: 10 },
  recentTitle: { fontSize: 14, fontWeight: '800', color: isDark ? '#F8FAFC' : '#12131A' },
  recentSub: { fontSize: 12, color: isDark ? '#94A3B8' : '#747487', marginBottom: 4 },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  recentAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  recentAvatarText: { fontSize: 17, fontWeight: '800', color: isDark ? '#F8FAFC' : '#374151' },
  recentName: { fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A' },
  recentBiz: { fontSize: 12, color: isDark ? '#94A3B8' : '#4B5563', marginTop: 1 },
  recentDetail: { fontSize: 11, color: isDark ? '#64748B' : '#9CA3AF', marginTop: 1 },
  autofillBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  autofillText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  gstInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 16, borderWidth: 1 },
  gstIntra: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  gstInter: { backgroundColor: isDark ? 'rgba(45,140,255,0.15)' : '#DBEAFE', borderColor: '#BFDBFE' },
  gstInfoText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Item card
  itemCard: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A' },
  itemDesc: { fontSize: 13, color: isDark ? '#94A3B8' : '#747487', marginBottom: 10 },
  itemFields: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  itemField: { flex: 1 },
  itemFieldLabel: { fontSize: 10, fontWeight: '600', color: isDark ? '#64748B' : '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' },
  itemFieldInput: { backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderRadius: 8, padding: 8, fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  itemTotals: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  itemTaxable: { fontSize: 12, color: isDark ? '#94A3B8' : '#747487' },
  itemTotal: { fontSize: 13, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A' },
  addItemRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addFromLibBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  addFromLibText: { fontSize: 14, fontWeight: '700', color: '#2D8CFF' },
  addManualBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderRadius: 12, paddingVertical: 14, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  addManualText: { fontSize: 14, fontWeight: '700', color: isDark ? '#F8FAFC' : '#374151' },
  totalsSummary: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', gap: 8 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLineLabel: { fontSize: 13, color: isDark ? '#F8FAFC' : '#374151' },
  totalLineValue: { fontSize: 13, fontWeight: '600', color: isDark ? '#F8FAFC' : '#12131A' },
  grandLine: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 },
  grandLabel: { fontSize: 15, fontWeight: '800', color: isDark ? '#F8FAFC' : '#12131A' },
  grandValue: { fontSize: 18, fontWeight: '900', color: '#2D8CFF' },

  gstChip: {
    flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
  },
  gstChipActive: {
    backgroundColor: '#EFF6FF', borderColor: '#2D8CFF',
  },
  gstChipText: { fontSize: 12, fontWeight: '700', color: isDark ? '#94A3B8' : '#747487' },
  gstChipTextActive: { color: '#2D8CFF' },

  // Details step
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: isDark ? '#F8FAFC' : '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: isDark ? '#F8FAFC' : '#12131A', borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  dateRow: { flexDirection: 'row' },
  themeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: isDark ? '#0F172A' : '#F9FAFB', borderRadius: 12, marginRight: 8, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB' },
  themeChipActive: { backgroundColor: '#FAFBFF', borderWidth: 2 },
  themeColor: { width: 14, height: 14, borderRadius: 7 },
  themeLabel: { fontSize: 13, fontWeight: '600', color: isDark ? '#F8FAFC' : '#374151' },

  // Review step
  reviewCard: { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', marginBottom: 20, gap: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLabel: { fontSize: 13, color: isDark ? '#94A3B8' : '#747487' },
  reviewValue: { fontSize: 13, fontWeight: '700', color: isDark ? '#F8FAFC' : '#12131A' },
  reviewTotal: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 },
  reviewTotalLabel: { fontSize: 15, fontWeight: '800', color: isDark ? '#F8FAFC' : '#12131A' },
  reviewTotalValue: { fontSize: 20, fontWeight: '900', color: '#2D8CFF' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2D8CFF', borderRadius: 14, paddingVertical: 16, marginBottom: 12 },
  sendBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  pendingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: '#BFDBFE' },
  pendingBtnText: { fontSize: 15, fontWeight: '700', color: '#2D8CFF' },
  draftBtn: { alignItems: 'center', paddingVertical: 12 },
  draftBtnText: { fontSize: 14, fontWeight: '600', color: isDark ? '#64748B' : '#9CA3AF' },

  // Bottom nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F1F6' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18 },
  prevBtnText: { fontSize: 15, fontWeight: '700', color: isDark ? '#F8FAFC' : '#374151' },
  nextBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D8CFF', borderRadius: 12, paddingVertical: 14 },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
