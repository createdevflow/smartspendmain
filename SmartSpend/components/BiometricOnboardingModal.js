/**
 * BiometricOnboardingModal.js
 *
 * Step 3 — Post-login prompt shown once when biometrics are available.
 * Respects: Enable / Later / Never Ask Again.
 * Matches existing Cashtro modal/card design language.
 */

import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBiometric } from '../context/BiometricContext';
import { useAppTheme } from '../context/ThemeContext';

export default function BiometricOnboardingModal({ visible, onEnable, onLater, onNeverAsk }) {
  const { methodLabel, capability } = useBiometric();
  const { isDark } = useAppTheme();

  if (!capability?.isAvailable) return null;

  const icon = capability?.hasFaceId ? 'eye' : 'shield';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
          {/* Icon */}
          <View style={[styles.iconWrap, isDark && { backgroundColor: 'rgba(45,140,255,0.15)' }]}>
            <Feather name={icon} size={32} color="#2D8CFF" />
          </View>

          <Text style={[styles.title, isDark && { color: '#F8FAFC' }]}>
            Enable {methodLabel}
          </Text>
          <Text style={[styles.body, isDark && { color: '#94A3B8' }]}>
            Use biometric authentication for faster and more secure access to Cashtro.{'\n\n'}
            Your biometric data never leaves this device and is never shared with Cashtro.
          </Text>

          <TouchableOpacity style={styles.enableBtn} onPress={onEnable} activeOpacity={0.85}>
            <Feather name={icon} size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.enableText}>Enable {methodLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.laterBtn, isDark && { borderColor: 'rgba(255,255,255,0.15)' }]} onPress={onLater} activeOpacity={0.7}>
            <Text style={[styles.laterText, isDark && { color: '#CBD5E1' }]}>Not Now</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onNeverAsk} activeOpacity={0.6} style={styles.neverBtn}>
            <Text style={styles.neverText}>Don't ask again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  enableBtn: {
    width: '100%',
    backgroundColor: '#2D8CFF',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  enableText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  laterBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  laterText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  neverBtn: {
    paddingVertical: 8,
  },
  neverText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
