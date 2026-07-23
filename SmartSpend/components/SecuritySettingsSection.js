/**
 * SecuritySettingsSection.js
 *
 * Step 8 — Full "Security" section for SettingsScreen.
 * Covers: enable/disable, per-type toggles, launch/sensitive-action/report requirements,
 * auto-lock timing, device status, last auth time, privacy disclosure.
 * Matches existing SettingRow / SettingToggleRow / SectionCard design system.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, Alert,
  Modal, FlatList, Pressable, TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBiometric } from '../context/BiometricContext';
import { useAppTheme } from '../context/ThemeContext';
import { getTokens } from '../utils/api';

// ─── Sub-components matching existing design ─────────────────────────────────

function Row({ icon, label, sub, right, onPress, isLast, isDark }) {
  const effectiveIconColor = isDark ? '#F8FAFC' : '#111827';
  const Inner = (
    <View style={[styles.row, isLast && styles.rowLast, isDark && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
      <View style={{ width: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
        <Feather name={icon} size={22} color={effectiveIconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, isDark && { color: '#F8FAFC' }]}>{label}</Text>
        {sub ? <Text style={[styles.rowSub, isDark && { color: '#94A3B8' }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return Inner;
  return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{Inner}</TouchableOpacity>;
}

function ToggleRow({ icon, label, sub, value, onToggle, isLast, isDark, disabled }) {
  return (
    <Row
      icon={icon} label={label} sub={sub} isLast={isLast} isDark={isDark}
      onPress={disabled ? undefined : () => onToggle(!value)}
      right={
        <Switch
          value={value}
          onValueChange={disabled ? undefined : onToggle}
          trackColor={{ true: '#2D8CFF', false: '#E5E7EB' }}
          thumbColor="#fff"
          disabled={disabled}
        />
      }
    />
  );
}

function Divider({ isDark }) {
  return <View style={[styles.divider, isDark && { backgroundColor: 'rgba(255,255,255,0.08)' }]} />;
}

function SectionHeader({ label, isDark, rightElement }) {
  if (!rightElement) {
    return <Text style={[styles.secLabel, isDark && { color: '#94A3B8' }]}>{label}</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 24, marginTop: 20, marginBottom: 8 }}>
      <Text style={[styles.secLabel, isDark && { color: '#94A3B8' }, { marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>{label}</Text>
      {rightElement}
    </View>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function SecuritySettingsSection({ navigation }) {
  const { isDark } = useAppTheme();
  const {
    capability, prefs, setPrefs, methodLabel,
    enableBiometrics, disableBiometrics,
    requestBiometricAuth, AUTO_LOCK_OPTIONS,
    lastAuthTime,
  } = useBiometric();

  const [showLockPicker, setShowLockPicker] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [deviceStatusExpanded, setDeviceStatusExpanded] = useState(false);

  const isAvailable = capability?.isAvailable;

  // ── Toggle master biometric enable ─────────────────────────────────────────
  const handleToggleEnable = async (val) => {
    if (val) {
      if (!isAvailable) {
        Alert.alert(
          'Biometrics Not Available',
          capability?.hasHardware
            ? 'No biometrics enrolled. Please set up biometrics in your device Settings.'
            : 'This device does not support biometric authentication.',
        );
        return;
      }
      setEnabling(true);
      try {
        const { accessToken } = await getTokens();
        if (!accessToken) { Alert.alert('Error', 'Please log in again before enabling biometrics.'); return; }
        const ok = await enableBiometrics(accessToken);
        if (!ok) Alert.alert('Setup Failed', 'Biometric setup was cancelled or failed. Please try again.');
      } finally {
        setEnabling(false);
      }
    } else {
      Alert.alert(
        'Disable Biometrics',
        'This will remove the stored biometric credential. You will need to use your password to sign in.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: disableBiometrics },
        ],
      );
    }
  };

  // ── Format last auth time ──────────────────────────────────────────────────
  const lastAuthLabel = lastAuthTime
    ? lastAuthTime.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never';

  // ── Auto-lock option label ─────────────────────────────────────────────────
  const currentLockLabel = AUTO_LOCK_OPTIONS.find(o => o.seconds === prefs.autoLockSeconds)?.label || 'Immediately';

  return (
    <View>
      {/* ── Master Enable ── */}
      <SectionHeader 
        label="Biometric Authentication" 
        isDark={isDark} 
        rightElement={
          <TouchableOpacity onPress={() => setShowPrivacyInfo(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name="info" size={16} color={isDark ? '#94A3B8' : '#9CA3AF'} />
          </TouchableOpacity>
        }
      />
      <View style={[styles.card, isDark && { backgroundColor: '#1E293B' }]}>
        <ToggleRow
          icon="shield"
          label={`Enable ${methodLabel || 'Biometrics'}`}
          sub={
            !capability?.hasHardware ? 'Not supported on this device' :
            !capability?.isEnrolled ? 'No biometrics enrolled in device Settings' :
            enabling ? 'Setting up…' : (prefs.enabled ? 'Active — biometric unlock is on' : 'Tap to enable biometric unlock')
          }
          value={prefs.enabled}
          onToggle={handleToggleEnable}
          isDark={isDark}
          disabled={enabling || !isAvailable}
          isLast={!deviceStatusExpanded && !isAvailable} // If available, we might want it not last if we always show status, wait let's just make it not last.
        />
        <Divider isDark={isDark} />
        <Row
          icon="cpu"
          label="Device Status"
          sub="View biometric hardware details"
          isDark={isDark}
          isLast={!deviceStatusExpanded}
          onPress={() => setDeviceStatusExpanded(!deviceStatusExpanded)}
          right={<Feather name={deviceStatusExpanded ? "chevron-up" : "chevron-down"} size={18} color={isDark ? '#94A3B8' : '#9CA3AF'} />}
        />
        {deviceStatusExpanded && (
          <View style={{ backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderTopWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
            <Row 
              icon="check-circle" 
              label="Hardware Support" 
              sub={capability?.hasHardware ? 'Biometric hardware available' : 'Not supported'} 
              isDark={isDark} 
              right={<Text style={{ fontSize: 11, fontWeight: '700', color: capability?.hasHardware ? '#16A34A' : '#DC2626' }}>{capability?.hasHardware ? 'Supported' : 'N/A'}</Text>}
            />
            <Row 
              icon="user-check" 
              label="Enrolled" 
              sub={capability?.isEnrolled ? `Enrolled — ${methodLabel}` : 'No biometrics enrolled'} 
              isDark={isDark} 
              right={<Text style={{ fontSize: 11, fontWeight: '700', color: capability?.isEnrolled ? '#16A34A' : '#D97706' }}>{capability?.isEnrolled ? 'Yes' : 'No'}</Text>}
            />
            <Row 
              icon="clock" 
              label="Last Authenticated" 
              sub={lastAuthLabel} 
              isDark={isDark} 
              isLast 
            />
          </View>
        )}
      </View>

      {/* ── Biometric Method Toggles ── */}
      {prefs.enabled && (
        <>
          <SectionHeader label="Authentication Method" isDark={isDark} />
          <View style={[styles.card, isDark && { backgroundColor: '#1E293B' }]}>
            {capability?.hasFingerprint && (
              <>
                <Row
                  icon="shield"
                  label="Fingerprint"
                  sub="Use fingerprint sensor"
                  isDark={isDark}
                  right={<Feather name="check" size={18} color="#2D8CFF" />}
                />
                {capability?.hasFaceId && <Divider isDark={isDark} />}
              </>
            )}
            {capability?.hasFaceId && (
              <Row
                icon="eye"
                label="Face ID"
                sub="Use Face ID for authentication"
                isDark={isDark}
                isLast
                right={<Feather name="check" size={18} color="#2D8CFF" />}
              />
            )}
            {!capability?.hasFingerprint && !capability?.hasFaceId && (
              <Row
                icon="shield"
                label={methodLabel || 'Biometric'}
                sub="Platform biometric"
                isDark={isDark}
                isLast
                right={<Feather name="check" size={18} color="#2D8CFF" />}
              />
            )}
          </View>
        </>
      )}

      {/* ── Launch & Lock Settings ── */}
      {prefs.enabled && (
        <>
          <SectionHeader label="App Lock" isDark={isDark} />
          <View style={[styles.card, isDark && { backgroundColor: '#1E293B' }]}>
            <ToggleRow
              icon="log-in"
              label="Require on App Launch"
              sub="Prompt biometric every time you open Cashtro"
              value={prefs.requireOnLaunch}
              onToggle={v => setPrefs({ requireOnLaunch: v })}
              isDark={isDark}
            />
            <Divider isDark={isDark} />
            <Row
              icon="clock"
              label="Auto-Lock Timing"
              sub={`Lock after: ${currentLockLabel}`}
              isDark={isDark}
              isLast
              onPress={() => setShowLockPicker(true)}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D8CFF' }}>{currentLockLabel}</Text>
                  <Feather name="chevron-right" size={14} color={isDark ? '#64748B' : '#D1D5DB'} />
                </View>
              }
            />
          </View>
        </>
      )}

      {/* ── Sensitive Actions ── */}
      {prefs.enabled && (
        <>
          <SectionHeader label="Require for Sensitive Actions" isDark={isDark} />
          <View style={[styles.card, isDark && { backgroundColor: '#1E293B' }]}>
            {[
              { key: 'DeleteCashbook', icon: 'book-open', label: 'Delete Cashbooks', sub: 'Gate cashbook deletion' },
              { key: 'DeleteTransaction', icon: 'file-text', label: 'Delete Transactions', sub: 'Gate transaction deletion' },
              { key: 'DeleteNote', icon: 'edit-3', label: 'Delete Notes', sub: 'Gate note deletion' },
              { key: 'ViewReports', icon: 'bar-chart-2', label: 'View Financial Reports', sub: 'Require auth to open reports' },
              { key: 'ChangePassword', icon: 'lock', label: 'Change Password', sub: 'Require auth before changing password' },
              { key: 'ChangeSecurity', icon: 'shield', label: 'Change Security Settings', sub: 'Require auth to change these settings' },
              { key: 'ViewBusinessDetails', icon: 'briefcase', label: 'View Business / GST / PAN', sub: 'Gate access to sensitive business info' },
              { key: 'ExportData', icon: 'download', label: 'Export Data', sub: 'Require auth before exporting' },
              { key: 'DeleteAccount', icon: 'trash-2', label: 'Delete Account', sub: 'Require auth before account deletion' },
            ].map(({ key, icon, label, sub }, i, arr) => (
              <React.Fragment key={key}>
                <ToggleRow
                  icon={icon}
                  label={label}
                  sub={sub}
                  value={!!prefs[`gate${key}`]}
                  onToggle={v => setPrefs({ [`gate${key}`]: v })}
                  isDark={isDark}
                  isLast={i === arr.length - 1}
                />
                {i < arr.length - 1 && <Divider isDark={isDark} />}
              </React.Fragment>
            ))}
          </View>
        </>
      )}

      {/* ── Device Status ── */}


      {/* ── Privacy Info Modal ── */}
      <Modal visible={showPrivacyInfo} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setShowPrivacyInfo(false)}>
          <TouchableWithoutFeedback>
            <View style={[styles.pickerBox, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <Feather name="shield" size={32} color="#2D8CFF" style={{ marginBottom: 12 }} />
                <Text style={[styles.pickerTitle, isDark && { color: '#F8FAFC' }, { marginBottom: 0 }]}>
                  Privacy & Security
                </Text>
              </View>
              <Text style={[styles.privacyText, isDark && { color: '#94A3B8' }]}>
                • Cashtro never stores fingerprints or face scans.{'\n\n'}
                • Biometric information never leaves this device.{'\n\n'}
                • All matching is handled entirely by your device's OS (Android BiometricPrompt / iOS Face ID & Touch ID).{'\n\n'}
                • Only a secure cryptographic credential protected by your device's hardware is used to unlock the app.
              </Text>
              
              <TouchableOpacity 
                style={{ marginTop: 24, backgroundColor: '#EFF6FF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                onPress={() => setShowPrivacyInfo(false)}
              >
                <Text style={{ color: '#2D8CFF', fontWeight: '600', fontSize: 15 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>

      {/* ── Auto-lock Picker Modal ── */}
      <Modal visible={showLockPicker} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setShowLockPicker(false)}>
          <View style={[styles.pickerBox, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.pickerTitle, isDark && { color: '#F8FAFC' }]}>Auto-Lock After</Text>
            {AUTO_LOCK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.seconds}
                style={[styles.pickerOption, prefs.autoLockSeconds === opt.seconds && styles.pickerOptionActive]}
                onPress={() => { setPrefs({ autoLockSeconds: opt.seconds }); setShowLockPicker(false); }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  isDark && { color: '#F8FAFC' },
                  prefs.autoLockSeconds === opt.seconds && { color: '#2D8CFF', fontWeight: '700' },
                ]}>
                  {opt.label}
                </Text>
                {prefs.autoLockSeconds === opt.seconds && <Feather name="check" size={16} color="#2D8CFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
      
      {/* ── Section Divider to match SectionCard spacing ── */}
      <View style={[styles.sectionDivider, isDark && { backgroundColor: '#1E293B' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.2)',
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, marginLeft: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  rowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginLeft: 56,
  },
  secLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  privacyBox: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(45,140,255,0.2)',
    alignItems: 'flex-start',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: '#F3F4F6',
    marginTop: 12,
    marginBottom: 0,
  },
  pickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },
  pickerOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
});
