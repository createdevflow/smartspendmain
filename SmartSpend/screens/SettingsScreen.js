// screens/SettingsScreen.js — Redesigned: clean section hierarchy
import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch,
  TouchableOpacity, Alert, Modal, FlatList, Pressable, TextInput, Platform, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { AuthContext } from '../context/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { api } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Image } from 'react-native';
import BusinessCategorySetupModal from '../components/BusinessCategorySetupModal';

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee',       symbol: '₹' },
  { code: 'USD', name: 'US Dollar',          symbol: '$' },
  { code: 'EUR', name: 'Euro',               symbol: '€' },
  { code: 'GBP', name: 'British Pound',      symbol: '£' },
  { code: 'AED', name: 'UAE Dirham',         symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar',   symbol: 'S$' },
  { code: 'AUD', name: 'Australian Dollar',  symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar',    symbol: 'CA$' },
  { code: 'JPY', name: 'Japanese Yen',       symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan',       symbol: '¥' },
];

// ─── Row components ────────────────────────────────────────────────────────────
function SettingRow({ icon, iconColor = '#1D4ED8', iconBg = '#DBEAFE', label, sub, onPress, right, isLast }) {
  const Inner = (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={16} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return Inner;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {Inner}
    </TouchableOpacity>
  );
}

function SettingToggleRow({ icon, iconColor, iconBg, label, sub, value, onToggle, isLast }) {
  return (
    <SettingRow
      icon={icon} iconColor={iconColor} iconBg={iconBg}
      label={label} sub={sub} isLast={isLast}
      onPress={() => onToggle(!value)}
      right={
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ true: '#1D4ED8', false: '#E5E7EB' }}
          thumbColor="#fff"
        />
      }
    />
  );
}

function SectionCard({ label, children }) {
  return (
    <View style={styles.section}>
      {label && <Text style={styles.sectionLabel}>{label}</Text>}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }) {
  const { user, logout, updateProfileInContext } = useContext(AuthContext);
  const { books, activeBook, updateBook } = useBooks();
  const { gstEnabled, setGstEnabled, privateMode, setPrivateMode } = useTransactions();
  const { hasAccess: isFeatureEnabled, getFeatureTease } = useFeatureAccess();

  const categoryModalRef = useRef(null);
  const [notifPrefs, setNotifPrefs] = useState({ push: user?.pushNotifications ?? true, email: user?.emailReports ?? true });
  
  // Modals for support
  const [showContact, setShowContact] = useState(false);
  const [showBug, setShowBug] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportImage, setSupportImage] = useState(null);
  const [supportSending, setSupportSending] = useState(false);

  // Tax Export
  const [taxExportYear, setTaxExportYear] = useState(new Date().getFullYear());
  const [taxExporting, setTaxExporting] = useState(false);

  // Privacy / Shake to Lock
  const [shakeToLock, setShakeToLock] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@shake_to_lock').then(v => setShakeToLock(v === 'true'));
  }, []);

  useEffect(() => {
    if (user) {
      setNotifPrefs({
        push: user.pushNotifications ?? true,
        email: user.emailReports ?? true
      });
    }
  }, [user]);


  const toggleNotif = async (key) => {
    const newVal = !notifPrefs[key];
    const newPrefs = { ...notifPrefs, [key]: newVal };
    setNotifPrefs(newPrefs);
    if (user) {
      try {
        const payload = key === 'push' ? { pushNotifications: newVal } : { emailReports: newVal };
        const res = await api.patch('/users/profile', payload);
        if (updateProfileInContext) updateProfileInContext(res.data?.data || res.data);
      } catch (e) {
        console.log('Failed to update notifications on server', e);
      }
    }
  };

  const handleSupportSubmit = async (type) => {
    if (!supportMessage.trim()) return;
    setSupportSending(true);
    try {
      await api.post('/support/tickets', {
        subject: type === 'bug_report' ? 'Bug Report' : 'Contact Support',
        message: supportMessage,
        type: type,
        attachmentUrl: supportImage || null
      });
      Alert.alert('Success', 'Your message has been sent to our team.');
      setShowContact(false);
      setShowBug(false);
      setSupportMessage('');
      setSupportImage(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSupportSending(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setSupportImage(base64);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Logout All Devices',
      'This will sign you out from all devices and invalidate all active sessions. You will need to log in again on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All', style: 'destructive', onPress: async () => {
            try {
              await api.delete('/users/sessions/all/other');
            } catch (e) {
              // Proceed with local logout even if server call fails
              console.log('Logout-all server error:', e.message);
            }
            await logout();
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently schedule your account for deletion. All your data (cashbooks, transactions, goals) will be retained for 30 days, then permanently removed.\n\nYou can contact support to restore your account within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account', style: 'destructive', onPress: () => {
            // Second confirmation — iOS & Android compatible
            Alert.alert(
              'Are you absolutely sure?',
              'This will sign you out of all devices immediately. Your account will be scheduled for permanent deletion.',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete It', style: 'destructive', onPress: async () => {
                    try {
                      await api.delete('/users/account');
                      // Backend invalidates all sessions, so we logout locally too
                      Alert.alert(
                        'Account Scheduled for Deletion',
                        'Your account will be permanently deleted in 30 days. Contact support at support@cashtro.in to restore it.',
                        [{ text: 'OK', onPress: async () => { await logout(); } }]
                      );
                    } catch (e) {
                      Alert.alert('Error', e.response?.data?.message || 'Failed to delete account. Please contact support.');
                    }
                  }
                },
              ]
            );
          }
        },
      ]
    );
  };



  const handleTaxExport = async () => {
    setTaxExporting(true);
    try {
      const res = await api.get(`/export/tax-report/preview?year=${taxExportYear}`);
      const payload = res.data?.data || res.data || {};
      const { csv, summary } = payload;
      // Fallback: fetch CSV
      if (!csv) throw new Error('No data');
      if (Platform.OS === 'web') {
        // Web fallback
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cashtro_tax_${taxExportYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Native (iOS/Android)
        try {
          const path = `${FileSystem.documentDirectory}cashtro_tax_${taxExportYear}.csv`;
          await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: `Tax Report ${taxExportYear}` });
          } else {
            Alert.alert('Export Complete', 'File saved internally, but sharing is not available on this device.');
          }
        } catch (fsError) {
          Alert.alert('File System Error', fsError.message || 'Could not save or share the file locally.');
          return;
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.response?.data?.message || e.message || 'Failed to export tax report';
      Alert.alert('Tax Export Error', msg);
    } finally {
      setTaxExporting(false);
    }
  };

  const handleShakeToggle = async (val) => {
    setShakeToLock(val);
    await AsyncStorage.setItem('@shake_to_lock', val ? 'true' : 'false');
  };

  const getInitials = () => {
    const name = user?.fullName || user?.name || '';
    return name ? name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const isTrialActive = user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        {/* ── Free Trial Banner ── */}
        {showTrialBanner && isTrialActive && (
          <View style={{ backgroundColor: '#DBEAFE', padding: 12, borderRadius: 12, marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#BFDBFE' }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="zap" size={16} color="#2563EB" />
              <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '600' }}>
                Free Trial Active (ends {new Date(user.trialExpiresAt).toLocaleDateString()})
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowTrialBanner(false)} style={{ padding: 4 }}>
              <Feather name="x" size={16} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Profile ─── */}
        <SectionCard>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => navigation?.navigate?.('Profile')}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%', borderRadius: 26 }} />
              ) : (
                <Text style={styles.avatarText}>{getInitials()}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.fullName || user?.name || 'Your Account'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              {user?.plan?.name && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{user.plan.name.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Feather name="chevron-right" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        </SectionCard>

        {/* ─── Preferences ─── */}
        <SectionCard label="Preferences">
          {isFeatureEnabled('feature_categories') && (
            <>
              <SettingRow
                icon="grid" iconColor="#F59E0B" iconBg="#FEF3C7"
                label="Manage Categories"
                sub="Customize expense & income tags"
                onPress={() => categoryModalRef.current?.present()}
                right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
              />
              <View style={styles.rowDivider} />
            </>
          )}
          <SettingToggleRow
            icon="eye-off" iconColor="#7C3AED" iconBg="#F3E8FF"
            label="Private Mode"
            sub="Hide balances and amounts"
            value={privateMode} onToggle={setPrivateMode}
          />
          <View style={styles.rowDivider} />
          {isFeatureEnabled('transaction_splits') && (
            <>
              <SettingToggleRow
                icon="percent" iconColor="#0369A1" iconBg="#E0F2FE"
                label="GST Mode"
                sub="Apply GST on expense entries"
                value={gstEnabled} onToggle={setGstEnabled}
              />
              <View style={styles.rowDivider} />
            </>
          )}
          {isFeatureEnabled('scheduled_communications') && (
            <>
              <SettingRow
                icon="clock" iconColor="#0891B2" iconBg="#ECFEFF"
                label="Scheduled Communications"
                sub="Manage your automated emails & chat messages"
                onPress={() => navigation.navigate('Communication')}
                right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
              />
              <View style={styles.rowDivider} />
            </>
          )}
          {isFeatureEnabled('recurring_transactions') && (
            <SettingRow
              icon="calendar" iconColor="#E11D48" iconBg="#FFE4E6"
              label="Subscriptions & Bills"
              sub="Manage your recurring payments"
              onPress={() => navigation.navigate('Subscriptions')}
              right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
              isLast
            />
          )}
        </SectionCard>

        {/* ─── Account ─── */}
        <SectionCard label="Account">
          <SettingRow
            icon="credit-card" iconColor="#1D4ED8" iconBg="#DBEAFE"
            label="Plan & Billing"
            sub={user?.plan?.name ? `Current: ${user.plan.name}` : 'Free plan'}
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
            onPress={() => navigation.navigate('Plans')}
          />
          <View style={styles.rowDivider} />
          {isFeatureEnabled('feature_notifications') && (
            <>
              <SettingToggleRow
                icon="bell" iconColor="#F59E0B" iconBg="#FEF3C7"
                label="Push Notifications"
                value={notifPrefs.push} onToggle={() => toggleNotif('push')}
              />
              <View style={styles.rowDivider} />
            </>
          )}
          {isFeatureEnabled('feature_reports') && (
            <SettingToggleRow
              icon="mail" iconColor="#0EA5E9" iconBg="#E0F9FF"
              label="Email Reports"
              value={notifPrefs.email} onToggle={() => toggleNotif('email')}
              isLast
            />
          )}
        </SectionCard>

        {/* ─── Security ─── */}
        <SectionCard label="Security">
          <SettingRow
            icon="lock" iconColor="#374151" iconBg="#F3F4F6"
            label="Change Password"
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
            onPress={() => navigation.navigate('Profile')}
            isLast
          />
        </SectionCard>

        <SectionCard label="Support">
          <SettingRow
            icon="message-square" iconColor="#059669" iconBg="#DCFCE7"
            label="Contact Us"
            onPress={() => setShowContact(true)}
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="alert-circle" iconColor="#F59E0B" iconBg="#FEF3C7"
            label="Report a Bug"
            onPress={() => setShowBug(true)}
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
            isLast
          />
        </SectionCard>

        {/* ─── Tax Export ─── */}
        {isFeatureEnabled('feature_tax_export_active') ? (
          <SectionCard label="Tax & Finance">
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: '#DCFCE7' }]}>
                <Feather name="file-text" size={16} color="#059669" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>Export Tax Report</Text>
                <Text style={styles.rowSub}>Download your deductible expenses as CSV</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => setTaxExportYear(y => y - 1)}
              >
                <Feather name="chevron-left" size={16} color="#374151" />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' }}>{taxExportYear}</Text>
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => setTaxExportYear(y => Math.min(y + 1, new Date().getFullYear()))}
              >
                <Feather name="chevron-right" size={16} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                onPress={handleTaxExport}
                disabled={taxExporting}
              >
                <Feather name="download" size={15} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {taxExporting ? 'Exporting...' : 'Export'}
                </Text>
              </TouchableOpacity>
            </View>
          </SectionCard>
        ) : getFeatureTease('feature_tax_export_active') ? (
          <SectionCard label="Tax & Finance">
            <TouchableOpacity
              style={styles.row}
              onPress={() => Alert.alert('Pro Feature 📊', 'Tax Report Export is available on Pro plans.\n\nExport all your tax-deductible expenses as a CSV for easy filing!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Plans') }])}
            >
              <View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}>
                <Feather name="lock" size={16} color="#9CA3AF" />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: '#9CA3AF' }]}>Export Tax Report</Text>
                <Text style={styles.rowSub}>Upgrade to Pro to export deductibles</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          </SectionCard>
        ) : null}

        {/* ─── Privacy ─── */}
        {isFeatureEnabled('feature_panic_button_active') && (
          <SectionCard label="Privacy">
            <SettingToggleRow
              icon="smartphone" iconColor="#7C3AED" iconBg="#F3E8FF"
              label="Shake to Lock"
              sub="Shake your phone to toggle Private Mode"
              value={shakeToLock}
              onToggle={handleShakeToggle}
              isLast
            />
          </SectionCard>
        )}

        {/* ─── Legal ─── */}
        <SectionCard label="Legal & Subscriptions">
          <SettingRow
            icon="shield" iconColor="#047857" iconBg="#D1FAE5"
            label="Privacy Policy"
            right={<Feather name="external-link" size={16} color="#D1D5DB" />}
            onPress={() => Linking.openURL('https://cashtro.in/privacy')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="file-text" iconColor="#4338CA" iconBg="#E0E7FF"
            label="Terms of Service"
            right={<Feather name="external-link" size={16} color="#D1D5DB" />}
            onPress={() => Linking.openURL('https://cashtro.in/terms')}
          />
          <View style={styles.rowDivider} />
          <SettingRow
            icon="refresh-cw" iconColor="#D97706" iconBg="#FEF3C7"
            label="Restore Purchases"
            sub="Restore your Pro subscription"
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
            onPress={() => Alert.alert('Restore Purchases', 'Your purchases have been restored successfully.')}
            isLast
          />
        </SectionCard>

        {/* ─── Danger Zone ─── */}
        <SectionCard label="Danger Zone">
          <SettingRow
            icon="smartphone" iconColor="#374151" iconBg="#F3F4F6"
            label="Logout All Devices"
            sub="Sign out from all other active sessions"
            onPress={handleLogoutAllDevices}
            right={<Feather name="chevron-right" size={16} color="#D1D5DB" />}
            isLast={!isFeatureEnabled('feature_account_deletion')}
          />
          {isFeatureEnabled('feature_account_deletion') && (
            <>
              <View style={styles.rowDivider} />
              <SettingRow
                icon="trash-2" iconColor="#DC2626" iconBg="#FEE2E2"
                label="Delete Account"
                sub="Permanently remove your account and all data"
                onPress={handleDeleteAccount}
                right={<Feather name="chevron-right" size={16} color="#FCA5A5" />}
                isLast
              />
            </>
          )}
        </SectionCard>

        {/* ─── App info ─── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Cashtro v1.0.0</Text>
          <Text style={styles.appInfoSub}>Built with ❤️ for smart spenders</Text>
        </View>

        {/* ─── Sign Out ─── */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={18} color="#DC2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


      {/* Support Modals */}
      <Modal visible={showContact} transparent animationType="fade" onRequestClose={() => { setShowContact(false); setSupportMessage(''); }}>
        <View style={styles.modalBackdropCenter}>
          <View style={styles.supportModalBox}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>Contact Us</Text>
              <TouchableOpacity onPress={() => { setShowContact(false); setSupportMessage(''); }}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.supportDesc}>Have a question or need help? Send us a message.</Text>
            <TextInput
              style={styles.supportInput}
              placeholder="Type your message here..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={supportMessage}
              onChangeText={setSupportMessage}
            />
            <TouchableOpacity style={styles.supportSubmitBtn} onPress={() => handleSupportSubmit('contact_us')} disabled={supportSending || !supportMessage.trim()}>
              <Text style={styles.supportSubmitText}>{supportSending ? 'Sending...' : 'Send Message'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBug} transparent animationType="fade" onRequestClose={() => { setShowBug(false); setSupportMessage(''); setSupportImage(null); }}>
        <View style={styles.modalBackdropCenter}>
          <View style={styles.supportModalBox}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>Report a Bug</Text>
              <TouchableOpacity onPress={() => { setShowBug(false); setSupportMessage(''); setSupportImage(null); }}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.supportDesc}>Found an issue? Please describe it below and attach a screenshot if possible.</Text>
            <TextInput
              style={styles.supportInput}
              placeholder="Describe the bug..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={supportMessage}
              onChangeText={setSupportMessage}
            />
            
            <TouchableOpacity style={styles.attachBtn} onPress={handlePickImage}>
              <Feather name={supportImage ? "check-circle" : "image"} size={20} color={supportImage ? "#10B981" : "#1D4ED8"} />
              <Text style={[styles.attachText, supportImage && { color: "#10B981" }]}>
                {supportImage ? "Image Attached" : "Attach Screenshot"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.supportSubmitBtn} onPress={() => handleSupportSubmit('bug_report')} disabled={supportSending || !supportMessage.trim()}>
              <Text style={styles.supportSubmitText}>{supportSending ? 'Submitting...' : 'Submit Bug Report'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BusinessCategorySetupModal
        ref={categoryModalRef}
        autoShow={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  scroll: { flex: 1 },
  pageTitle: {
    fontSize: 28, fontWeight: '800', color: '#111827', letterSpacing: -0.5,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },

  // Section
  section: { marginHorizontal: 20, marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowLast: { borderBottomWidth: 0 },
  rowDivider: { height: 1, backgroundColor: '#F3F4F6' },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Profile
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  planBadge: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: '#EEF2FF', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  planBadgeText: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.5 },

  // App info
  appInfo: { alignItems: 'center', paddingVertical: 16 },
  appInfoText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  appInfoSub: { fontSize: 12, color: '#D1D5DB', marginTop: 4 },

  // Danger / Sign out
  dangerSection: { marginHorizontal: 20, marginBottom: 32 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: '#FEE2E2', borderRadius: 14,
    paddingVertical: 16, borderWidth: 1, borderColor: '#FECACA',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },

  // Currency picker
  modalBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: '60%',
    paddingHorizontal: 20, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 20,
  },
  pickerHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  pickerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  currencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  currencyRowSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  currencySymbolBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  currencyName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalBackdropCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  supportModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  supportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  supportDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  supportInput: {
    height: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    color: '#111827',
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  attachText: {
    color: '#1D4ED8',
    fontWeight: '600',
    marginLeft: 8,
  },
  supportSubmitBtn: {
    backgroundColor: '#1D4ED8',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
