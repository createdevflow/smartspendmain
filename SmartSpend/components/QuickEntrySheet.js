// components/QuickEntrySheet.js
import React, { useState, useRef, useEffect, useContext, useCallback, useMemo, forwardRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ScrollView, FlatList, Animated, Dimensions,
  KeyboardAvoidingView, Platform, Pressable, Image, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { getCurrencySymbol } from '../utils/planFeatures';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTransactions } from '../context/TransactionsContext';
import { useAuth } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system';
import api from '../utils/api';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatList as GHFlatList } from 'react-native-gesture-handler';

const { height: SCREEN_H } = Dimensions.get('window');

const INCOME_CATS = [
  { label: 'Salary',      emoji: '💼', color: '#16A34A', bg: '#DCFCE7' },
  { label: 'Bonus',       emoji: '🏆', color: '#CA8A04', bg: '#FEF9C3' },
  { label: 'Gift',        emoji: '🎁', color: '#7C3AED', bg: '#F3E8FF' },
  { label: 'Refund',      emoji: '↩️', color: '#2563EB', bg: '#DBEAFE' },
  { label: 'Investment',  emoji: '📈', color: '#0F766E', bg: '#CCFBF1' },
  { label: 'Freelance',   emoji: '💻', color: '#0369A1', bg: '#E0F2FE' },
  { label: 'Other',       emoji: '💰', color: '#4B5563', bg: '#F3F4F6' },
];

const EXPENSE_CATS = [
  { label: 'Food',        emoji: '🍔', color: '#EA580C', bg: '#FFEDD5' },
  { label: 'Transport',   emoji: '🚇', color: '#0369A1', bg: '#E0F2FE' },
  { label: 'Shopping',    emoji: '🛍️', color: '#A21CAF', bg: '#FAE8FF' },
  { label: 'Bills',       emoji: '⚡', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Health',      emoji: '💊', color: '#BE123C', bg: '#FFE4E6' },
  { label: 'Rent',        emoji: '🏠', color: '#4F46E5', bg: '#E0E7FF' },
  { label: 'Groceries',   emoji: '🛒', color: '#15803D', bg: '#DCFCE7' },
  { label: 'Dining',      emoji: '🍽️', color: '#DB2777', bg: '#FCE7F3' },
  { label: 'Entertainment',emoji: '🎬', color: '#B45309', bg: '#FEF3C7' },
  { label: 'Education',   emoji: '📚', color: '#1D4ED8', bg: '#DBEAFE' },
  { label: 'Travel',      emoji: '✈️', color: '#0891B2', bg: '#CFFAFE' },
  { label: 'Other',       emoji: '📌', color: '#4B5563', bg: '#F3F4F6' },
];

const PAYMENT_METHODS = [
  { label: 'UPI',           icon: 'smartphone' },
  { label: 'Bank Transfer', icon: 'credit-card' },
  { label: 'Cash',          icon: 'dollar-sign' },
  { label: 'Card',          icon: 'credit-card' },
  { label: 'Wallet',        icon: 'archive' },
];

const QuickEntrySheet = forwardRef(({
  onClose,
  onSave,
  editData = null,
  defaultType = 'out',
}, ref) => {
  const { activeBook } = useBooks();
  const { gstEnabled, useCustomCategories, customCategories } = useTransactions();
  const currencySymbol = getCurrencySymbol(activeBook ? activeBook.currency : null);
  const { hasAccess: isFeatureEnabled, getFeatureTease } = useFeatureAccess();

  const [entryType, setEntryType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  
  // GST State
  const [isGstApplied, setIsGstApplied] = useState(false);
  const [gstSlab, setGstSlab] = useState(18);

  const [isScanning, setIsScanning] = useState(false);
  const [warrantyUntil, setWarrantyUntil] = useState(null);
  const [isTaxDeductible, setIsTaxDeductible] = useState(false);

  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['65%', '92%'], []);
  const amountRef = useRef(null);

  useEffect(() => {
    if (editData) {
      setEntryType(editData.type === 'INCOME' ? 'in' : 'out');
      setAmount(String(parseFloat(editData.amount || 0)));
      setSelectedCat(editData.merchant || editData.category?.name || null);
      setPaymentMethod(editData.paymentMethod || '');
      setNote(editData.notes || editData.encNotes || '');
      setTxDate(new Date(editData.date || new Date()));
      setIsGstApplied(editData.isGstApplied || false);
      if (editData.cgst) {
        const gstTotal = parseFloat(editData.cgst) * 2;
        const amt = parseFloat(editData.amount || 0);
        // Reverse calculate approximate slab
        if (amt > 0 && gstTotal > 0) {
          const slabApprox = (gstTotal / (amt - gstTotal)) * 100;
          const closest = [5, 12, 18, 28].reduce((prev, curr) => Math.abs(curr - slabApprox) < Math.abs(prev - slabApprox) ? curr : prev);
          setGstSlab(closest);
        }
      }
      setReceiptImage(editData.receiptKey ? { uri: editData.receiptKey } : null);
    } else {
      setEntryType(defaultType);
      setAmount('');
      setSelectedCat(null);
      setPaymentMethod('');
      setNote('');
      setTxDate(new Date());
      setIsGstApplied(false);
      setGstSlab(18);
      setReceiptImage(null);
      setWarrantyUntil(null);
    }
  }, [editData, defaultType]);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      if (!editData) {
        setAmount('');
        setSelectedCat(null);
        setNote('');
        setPaymentMethod('');
      }
      onClose();
    }
  }, [onClose, editData]);

  const defaultCats = entryType === 'in' ? INCOME_CATS : EXPENSE_CATS;
  const userCats = entryType === 'in' ? customCategories.in : customCategories.out;
  const cats = useCustomCategories && userCats.length > 0 ? userCats : defaultCats;
  
  const canSave = parseFloat(amount || '0') > 0 && selectedCat;

  const handleSave = () => {
    if (!canSave) return;
    const amt = parseFloat(amount || '0');
    onSave({
      type: entryType,
      amount: amt,
      category: selectedCat,
      paymentMethod,
      note,
      date: txDate.toISOString(),
      isGstApplied,
      gstAmount: isGstApplied ? (parseFloat(amount || '0') - parseFloat(amount || '0') / (1 + gstSlab / 100)) : 0,
      receiptImage: receiptImage?.uri || null,
      warrantyUntil: warrantyUntil || undefined,
      isTaxDeductible: entryType === 'out' && isTaxDeductible,
    });
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReceiptImage(result.assets[0]);
    }
  };

  const handleScanReceipt = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5, // lower quality for OCR
    });
    if (!result.canceled) {
      setIsScanning(true);
      try {
        const asset = result.assets[0];
        setReceiptImage(asset);
        // Convert to base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        
        const res = await api.post('/transactions/scan-receipt', { imageBase64: base64 });
        const { parsedData } = res.data.data;
        
        if (parsedData.amount) setAmount(String(parsedData.amount));
        if (parsedData.merchant) setNote(parsedData.merchant + (parsedData.notes ? ' - ' + parsedData.notes : ''));
        if (parsedData.warrantyUntil) setWarrantyUntil(parsedData.warrantyUntil);
        setEntryType('out');
      } catch (err) {
        alert('Failed to scan receipt. Ensure OCR is enabled in Admin settings.');
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enableDynamicSizing={false}
      keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'fillParent'}
      keyboardBlurBehavior="none"
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
      )}
      handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
      backgroundStyle={{ borderRadius: 24, backgroundColor: '#fff' }}
    >
      <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Entry Type Toggle */}
          <View style={s.typeRow}>
              <TouchableOpacity
                style={[s.typeBtn, entryType === 'in' && s.typeBtnInActive]}
                onPress={() => { setEntryType('in'); setSelectedCat(null); }}
              >
                <Text style={[s.typeBtnText, entryType === 'in' && s.typeBtnTextIn]}>
                  ↓ Cash In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.typeBtn, entryType === 'out' && s.typeBtnOutActive]}
                onPress={() => { setEntryType('out'); setSelectedCat(null); }}
              >
                <Text style={[s.typeBtnText, entryType === 'out' && s.typeBtnTextOut]}>
                  ↑ Cash Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={s.amountBox}>
              <Text style={[s.currencyGlyph, entryType === 'in' ? s.colorIn : s.colorOut]}>
                {currencySymbol}
              </Text>
              <TextInput
                ref={amountRef}
                style={[s.amountInput, entryType === 'in' ? s.colorIn : s.colorOut]}
                value={amount}
                onChangeText={(v) => {
                  if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#D1D5DB"
                maxLength={12}
              />
            </View>
            <Text style={s.bookLabel}>
              {activeBook?.name || 'Personal'}
            </Text>

            {/* Categories */}
            <Text style={s.sectionTitle}>Category</Text>
            <GHFlatList
              data={cats}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.label}
              renderItem={({ item }) => {
                const isSelected = selectedCat === item.label;
                return (
                  <TouchableOpacity
                    style={[
                      s.catChip,
                      { backgroundColor: isSelected ? item.bg : '#F9FAFB', borderColor: isSelected ? item.color : '#E5E7EB' },
                    ]}
                    onPress={() => setSelectedCat(item.label)}
                    activeOpacity={0.75}
                  >
                    <Text style={s.catEmoji}>{item.emoji}</Text>
                    <Text style={[s.catLabel, { color: isSelected ? item.color : '#374151' }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 16 }}
            />

            {/* Payment Method */}
            <Text style={s.sectionTitle}>Payment Method</Text>
            <GHFlatList
              data={PAYMENT_METHODS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.label}
              renderItem={({ item }) => {
                const isSelected = paymentMethod === item.label;
                return (
                  <TouchableOpacity
                    style={[s.pmChip, isSelected && s.pmChipSelected]}
                    onPress={() => setPaymentMethod(item.label)}
                  >
                    <Feather name={item.icon} size={16} color={isSelected ? '#1D4ED8' : '#6B7280'} />
                    <Text style={[s.pmLabel, isSelected && { color: '#1D4ED8' }]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 16 }}
            />

            {/* GST Options (Conditionally Rendered) */}
            {gstEnabled && isFeatureEnabled('transaction_splits') && (
              <View style={s.gstContainer}>
                <View style={s.gstToggleRow}>
                  <Text style={s.sectionTitleGst}>Includes GST?</Text>
                  <TouchableOpacity
                    style={[s.gstToggleBtn, isGstApplied && s.gstToggleBtnActive]}
                    onPress={() => setIsGstApplied(!isGstApplied)}
                  >
                    <Text style={[s.gstToggleText, isGstApplied && { color: '#fff' }]}>
                      {isGstApplied ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {isGstApplied && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {[5, 12, 18, 28].map(slab => (
                        <TouchableOpacity 
                          key={slab}
                          style={{
                            flex: 1, paddingVertical: 8, borderRadius: 8, 
                            borderWidth: 1, alignItems: 'center',
                            borderColor: gstSlab === slab ? '#1D4ED8' : '#E5E7EB',
                            backgroundColor: gstSlab === slab ? '#EFF6FF' : '#F9FAFB'
                          }}
                          onPress={() => setGstSlab(slab)}
                        >
                          <Text style={{ 
                            fontSize: 13, fontWeight: '600',
                            color: gstSlab === slab ? '#1D4ED8' : '#4B5563' 
                          }}>
                            {slab}%
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: '#4B5563', marginBottom: 4 }}>
                        Base Amount: {currencySymbol}{(parseFloat(amount || 0) / (1 + gstSlab / 100)).toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>
                        Calculated GST: {currencySymbol}{(parseFloat(amount || 0) - parseFloat(amount || 0) / (1 + gstSlab / 100)).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Date Picker Row */}
            <TouchableOpacity style={s.dateRow} onPress={() => setShowDatePicker(true)}>
              <Feather name="calendar" size={18} color="#6B7280" />
              <Text style={s.dateRowText}>
                {txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Feather name="chevron-right" size={16} color="#D1D5DB" />
            </TouchableOpacity>

            {/* Remark / Note */}
            <TextInput
              style={s.noteInput}
              placeholder="Add note or description (optional)"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              maxLength={120}
              multiline
            />

            {/* Tax Deductible toggle — EXPENSE only */}
            {entryType === 'out' && (
              <TouchableOpacity
                style={[
                  s.attachBtn,
                  { marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' },
                  isTaxDeductible && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                ]}
                onPress={() => setIsTaxDeductible(!isTaxDeductible)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Feather name="file-text" size={18} color={isTaxDeductible ? '#16A34A' : '#4B5563'} />
                  <Text style={[s.attachText, isTaxDeductible && { color: '#16A34A' }]}>Mark as Tax Deductible</Text>
                </View>
                <View style={[
                  { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
                  isTaxDeductible ? { backgroundColor: '#16A34A' } : { backgroundColor: '#D1D5DB' },
                ]}>
                  <View style={[
                    { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
                    isTaxDeductible ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                  ]} />
                </View>
              </TouchableOpacity>
            )}

            {/* Attach Image */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {isFeatureEnabled('feature_gallery') ? (
                <TouchableOpacity style={[s.attachBtn, { flex: 1, marginBottom: 0 }]} onPress={pickImage}>
                  <Feather name="image" size={18} color="#4B5563" />
                  <Text style={s.attachText}>Gallery</Text>
                </TouchableOpacity>
              ) : getFeatureTease('feature_gallery') ? (
                <TouchableOpacity 
                  style={[s.attachBtn, { flex: 1, marginBottom: 0, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]} 
                  onPress={() => Alert.alert('Pro Feature', 'Gallery Attachments let you save receipts and photos with your transactions. Upgrade to Pro to unlock this!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro' }])}
                >
                  <Feather name="lock" size={16} color="#9CA3AF" />
                  <Text style={[s.attachText, { color: '#6B7280' }]}>Gallery</Text>
                </TouchableOpacity>
              ) : null}
              {isFeatureEnabled('feature_ocr_active') ? (
                <TouchableOpacity style={[s.attachBtn, { flex: 1, marginBottom: 0, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]} onPress={handleScanReceipt}>
                  <Feather name="camera" size={18} color="#1D4ED8" />
                  <Text style={[s.attachText, { color: '#1D4ED8' }]}>
                    {isScanning ? 'Scanning...' : 'AI Scan'}
                  </Text>
                </TouchableOpacity>
              ) : getFeatureTease('feature_ocr_active') ? (
                <TouchableOpacity 
                  style={[s.attachBtn, { flex: 1, marginBottom: 0, backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]} 
                  onPress={() => Alert.alert('Premium Feature', 'AI Receipt Scanning is a Pro feature. Upgrade your plan to unlock instant receipt reading!', [{ text: 'Cancel', style: 'cancel' }, { text: 'Upgrade to Pro' }])}
                >
                  <Feather name="lock" size={16} color="#9CA3AF" />
                  <Text style={[s.attachText, { color: '#6B7280' }]}>AI Scan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            
            {warrantyUntil && (
              <View style={{ backgroundColor: '#FEF3C7', padding: 10, borderRadius: 8, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Feather name="shield" size={16} color="#B45309" />
                <Text style={{ color: '#B45309', fontSize: 13, fontWeight: '500' }}>
                  Warranty valid until: {new Date(warrantyUntil).toLocaleDateString()}
                </Text>
              </View>
            )}

            {receiptImage && (
              <View style={s.previewContainer}>
                <Image source={{ uri: receiptImage.uri }} style={s.previewImage} />
                <TouchableOpacity style={s.removeImageBtn} onPress={() => { setReceiptImage(null); setWarrantyUntil(null); }}>
                  <Feather name="x" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

        </BottomSheetScrollView>

        {/* Sticky Save Button (Flows naturally at bottom) */}
        <View style={s.footerNav}>
          <TouchableOpacity
            style={[s.saveBtn, entryType === 'in' ? s.saveBtnIn : s.saveBtnOut, !canSave && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={s.saveBtnText}>{editData ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={txDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(e, d) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (d) setTxDate(d);
          }}
        />
      )}
    </BottomSheetModal>
  );
});

export default QuickEntrySheet;

const s = StyleSheet.create({
  backdropWrapper: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    flex: 1,
    paddingTop: 8,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.9,
    flexShrink: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
  },
  handle: {
    width: 48, height: 5, backgroundColor: '#E5E7EB',
    borderRadius: 3, alignSelf: 'center', marginTop: 14, marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  typeRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4,
  },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center',
  },
  typeBtnInActive: { backgroundColor: '#DCFCE7' },
  typeBtnOutActive: { backgroundColor: '#FEE2E2' },
  typeBtnText: { fontWeight: '600', fontSize: 14, color: '#6B7280' },
  typeBtnTextIn: { color: '#16A34A' },
  typeBtnTextOut: { color: '#DC2626' },

  amountBox: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    marginVertical: 20,
  },
  currencyGlyph: { fontSize: 36, fontWeight: '700', marginTop: 6 },
  amountInput: {
    fontSize: 64, fontWeight: '800', letterSpacing: -2,
    minWidth: 120, textAlign: 'center', color: '#111827',
  },
  colorIn: { color: '#16A34A' },
  colorOut: { color: '#DC2626' },
  bookLabel: { textAlign: 'center', color: '#6B7280', fontSize: 14, marginBottom: 24, fontWeight: '500' },

  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#374151',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  catChip: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
    justifyContent: 'center', gap: 4, marginRight: 10, minWidth: 80,
  },
  catEmoji: { fontSize: 20 },
  catLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  pmChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', marginRight: 10,
  },
  pmChipSelected: {
    borderColor: '#1D4ED8', backgroundColor: '#EFF6FF',
  },
  pmLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  dateRowText: { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },

  noteInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, fontSize: 15, color: '#111827',
    minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
  },

  attachBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
    marginBottom: 16,
  },
  attachText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },

  previewContainer: {
    position: 'relative', width: 100, height: 100, marginBottom: 16,
  },
  previewImage: {
    width: '100%', height: '100%', borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444',
    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },

  gstContainer: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  gstToggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitleGst: {
    fontSize: 14, fontWeight: '600', color: '#374151',
  },
  gstToggleBtn: {
    backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  gstToggleBtnActive: {
    backgroundColor: '#1D4ED8',
  },
  gstToggleText: {
    fontSize: 13, fontWeight: '600', color: '#4B5563',
  },
  textInput: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginTop: 12,
  },

  footerNav: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, 
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    borderTopWidth: 1, borderColor: '#F3F4F6',
  },
  saveBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  saveBtnIn: { backgroundColor: '#10B981' },
  saveBtnOut: { backgroundColor: '#EF4444' },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 1 },
});
