// screens/InvoiceSettingsScreen.js
// Business profile setup and invoice preferences
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator,
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useInvoice } from '../context/InvoiceContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

const TABS = ['Business Profile', 'Preferences'];

export default function InvoiceSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { bizProfile, settings, saveBusinessProfile, saveInvoiceSettings } = useInvoice();
  const { hasAccess } = useFeatureAccess();

  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── Form State ─────────────────────────────────────────────────────────────
  const [biz, setBiz] = useState({ ...bizProfile });
  const [pref, setPref] = useState({ ...settings });

  const hasWhiteLabelAccess = hasAccess('feature_invoice_whitelabel');

  // ── Image Pickers ──────────────────────────────────────────────────────────
  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!res.canceled) setBiz(p => ({ ...p, logoUri: res.assets[0].uri }));
  };

  const pickSignature = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [3, 1], quality: 0.7 });
    if (!res.canceled) setBiz(p => ({ ...p, signatureUri: res.assets[0].uri }));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (activeTab === 0) {
      if (!biz.businessName) { Alert.alert('Required', 'Business Name is required'); return; }
      if (!biz.state) { Alert.alert('Required', 'State is required for GST calculations'); return; }
    }

    setSaving(true);
    try {
      if (activeTab === 0) await saveBusinessProfile(biz);
      else await saveInvoiceSettings(pref);
      Alert.alert('Saved', 'Settings saved successfully');
      if (activeTab === 0 && !bizProfile.businessName) {
        // Was incomplete, now completed.
        navigation.goBack();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }, [activeTab, biz, pref, saveBusinessProfile, saveInvoiceSettings, navigation, bizProfile.businessName]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#12131A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Settings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom, paddingHorizontal: 20, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 0 ? (
          /* ── BUSINESS PROFILE ── */
          <View style={styles.section}>
            {/* Logo */}
            <View style={styles.imagePickerRow}>
              <TouchableOpacity style={styles.logoPicker} onPress={pickLogo}>
                {biz.logoUri ? (
                  <OptimizedImage source={{ uri: biz.logoUri }} style={styles.logoImg} size="medium" />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Feather name="image" size={24} color="#9CA3AF" />
                    <Text style={styles.logoText}>Add Logo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.imageHelpTitle}>Business Logo</Text>
                <Text style={styles.imageHelpText}>Appears on the top left of your invoice. Square image recommended.</Text>
                {!!biz.logoUri && (
                  <TouchableOpacity onPress={() => setBiz(p => ({ ...p, logoUri: null }))} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <SField label="Business Name *" value={biz.businessName} onChange={v => setBiz(p => ({ ...p, businessName: v }))} placeholder="e.g. Cashtro Technologies" />
            <SField label="Proprietor / Contact Name" value={biz.proprietorName} onChange={v => setBiz(p => ({ ...p, proprietorName: v }))} placeholder="Your name" />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}><SField label="GSTIN" value={biz.gstin} onChange={v => setBiz(p => ({ ...p, gstin: v }))} autoCapitalize="characters" maxLength={15} /></View>
              <View style={{ flex: 1 }}><SField label="PAN" value={biz.pan} onChange={v => setBiz(p => ({ ...p, pan: v }))} autoCapitalize="characters" maxLength={10} /></View>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Contact & Address</Text>
            <SField label="Mobile" value={biz.mobile} onChange={v => setBiz(p => ({ ...p, mobile: v }))} keyboardType="phone-pad" />
            <SField label="Email" value={biz.email} onChange={v => setBiz(p => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
            <SField label="Address" value={biz.address} onChange={v => setBiz(p => ({ ...p, address: v }))} multiline />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}><SField label="City" value={biz.city} onChange={v => setBiz(p => ({ ...p, city: v }))} /></View>
              <View style={{ flex: 1 }}><SField label="State *" value={biz.state} onChange={v => setBiz(p => ({ ...p, state: v }))} placeholder="e.g. Maharashtra" /></View>
            </View>
            <SField label="PIN Code" value={biz.pincode} onChange={v => setBiz(p => ({ ...p, pincode: v }))} keyboardType="number-pad" />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Payment Details (Optional)</Text>
            <SField label="UPI ID" value={biz.upiId} onChange={v => setBiz(p => ({ ...p, upiId: v }))} placeholder="e.g. you@upi" autoCapitalize="none" />
            <SField label="Bank Name" value={biz.bankName} onChange={v => setBiz(p => ({ ...p, bankName: v }))} />
            <SField label="Account Number" value={biz.accountNumber} onChange={v => setBiz(p => ({ ...p, accountNumber: v }))} keyboardType="number-pad" />
            <SField label="IFSC Code" value={biz.ifscCode} onChange={v => setBiz(p => ({ ...p, ifscCode: v }))} autoCapitalize="characters" />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Signature</Text>
            <View style={styles.signatureWrap}>
              <TouchableOpacity style={styles.sigPicker} onPress={pickSignature}>
                {biz.signatureUri ? (
                  <OptimizedImage source={{ uri: biz.signatureUri }} style={styles.sigImg} contentFit="contain" size="medium" />
                ) : (
                  <Text style={styles.sigPlaceholderText}>Tap to upload signature</Text>
                )}
              </TouchableOpacity>
              {!!biz.signatureUri && (
                <TouchableOpacity onPress={() => setBiz(p => ({ ...p, signatureUri: null }))} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600' }}>Remove Signature</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        ) : (
          /* ── PREFERENCES ── */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configurable Numbering Engine</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <SField label="Business Prefix (Optional)" value={pref.businessPrefix} onChange={v => setPref(p => ({ ...p, businessPrefix: v }))} placeholder="e.g. ANK, SHOP" autoCapitalize="characters" />
              </View>
              <View style={{ flex: 1 }}>
                <SField label="Default Series" value={pref.defaultSeries} onChange={v => setPref(p => ({ ...p, defaultSeries: v }))} placeholder="e.g. INV, SALES" autoCapitalize="characters" />
              </View>
            </View>
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>LIVE NUMBERING PREVIEW (FY AUTO-DETECTED)</Text>
              <Text style={styles.previewValue}>
                {(pref.businessPrefix ? `${pref.businessPrefix.trim()}-` : '') + (pref.defaultSeries || 'INV').toUpperCase().trim() + '-' + (new Date().getMonth() >= 3 ? `${String(new Date().getFullYear()).slice(2)}${String(new Date().getFullYear() + 1).slice(2)}` : `${String(new Date().getFullYear() - 1).slice(2)}${String(new Date().getFullYear()).slice(2)}`) + '0001'}
              </Text>
              <Text style={styles.previewNote}>💡 Counters reset automatically to 0001 for each new Financial Year and Document Series.</Text>
            </View>

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Standard Text</Text>
            <SField label="Default Terms & Conditions" value={biz.defaultTerms} onChange={v => setBiz(p => ({ ...p, defaultTerms: v }))} multiline placeholder="Standard T&C for all invoices..." />
            <SField label="Default Notes" value={biz.defaultNotes} onChange={v => setBiz(p => ({ ...p, defaultNotes: v }))} multiline placeholder="Thank you for your business!" />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Premium Features</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>White-label Invoices</Text>
                <Text style={styles.switchSub}>Remove "Generated by Cashtro" footer from PDFs</Text>
              </View>
              <Switch
                value={pref.whiteLabelEnabled}
                onValueChange={v => {
                  if (v && !hasWhiteLabelAccess) {
                    Alert.alert('Premium Feature', 'Please upgrade your plan to enable white-labeling.');
                    return;
                  }
                  setPref(p => ({ ...p, whiteLabelEnabled: v }));
                }}
                trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                thumbColor={pref.whiteLabelEnabled ? '#2D8CFF' : '#9CA3AF'}
              />
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.bottomSave, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <Text style={styles.saveBtnText}>Save {activeTab === 0 ? 'Profile' : 'Preferences'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SField({ label, value, onChange, placeholder, multiline, keyboardType, autoCapitalize, maxLength }) {
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
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'words'}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F1F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#12131A' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#2D8CFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#747487' },
  tabTextActive: { color: '#2D8CFF', fontWeight: '700' },
  body: { flex: 1 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#12131A', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20, marginHorizontal: -16 },
  row: { flexDirection: 'row' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: { backgroundColor: '#FAFAFA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#12131A', borderWidth: 1.5, borderColor: '#E5E7EB' },
  imagePickerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoPicker: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', overflow: 'hidden' },
  logoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '600' },
  logoImg: { width: '100%', height: '100%' },
  imageHelpTitle: { fontSize: 14, fontWeight: '700', color: '#12131A', marginBottom: 4 },
  imageHelpText: { fontSize: 12, color: '#747487', lineHeight: 18 },
  signatureWrap: { alignItems: 'flex-start' },
  sigPicker: { width: '100%', height: 100, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sigPlaceholderText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  sigImg: { width: '100%', height: '100%' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchTitle: { fontSize: 15, fontWeight: '700', color: '#12131A', marginBottom: 4 },
  switchSub: { fontSize: 12, color: '#747487' },
  previewBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginTop: 8, marginBottom: 16 },
  previewLabel: { fontSize: 11, fontWeight: '800', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  previewValue: { fontSize: 18, fontWeight: '800', color: '#232333', fontFamily: 'monospace', marginBottom: 8 },
  previewNote: { fontSize: 12, color: '#3B82F6', lineHeight: 16 },
  bottomSave: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  saveBtn: { backgroundColor: '#2D8CFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
