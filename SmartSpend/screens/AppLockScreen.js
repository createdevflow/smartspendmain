/**
 * AppLockScreen.js
 *
 * Shown when isLocked=true. Prompts biometric unlock with full fallback chain:
 * Biometric → Password (via navigation to Login with unlock mode).
 *
 * Design: matches existing Cashtro dark/light design system.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBiometric } from '../context/BiometricContext';
import { useAppTheme } from '../context/ThemeContext';
import { BiometricResult, getBiometricErrorMessage } from '../services/BiometricService';

export default function AppLockScreen({ onUnlocked, onFallbackToPassword }) {
  const { requestBiometricAuth, capability, methodLabel, prefs } = useBiometric();
  const { isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const triggerBiometric = useCallback(async () => {
    if (!prefs.enabled || !capability?.isAvailable) {
      onFallbackToPassword?.();
      return;
    }
    setLoading(true);
    setError(null);
    const { success, result, error: errMsg } = await requestBiometricAuth('Unlock Cashtro');
    setLoading(false);

    if (success) {
      onUnlocked?.();
    } else if (result === BiometricResult.FALLBACK || result === BiometricResult.CANCELLED) {
      // User chose password or dismissed
      if (result === BiometricResult.FALLBACK) {
        onFallbackToPassword?.();
      }
    } else {
      setError(errMsg || 'Authentication failed. Please try again.');
    }
  }, [requestBiometricAuth, capability, prefs, onUnlocked, onFallbackToPassword]);

  // Auto-trigger on mount
  useEffect(() => {
    const timer = setTimeout(() => triggerBiometric(), 400);
    return () => clearTimeout(timer);
  }, []);

  const biometricIcon = capability?.hasFaceId ? 'eye' : 'shield';

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0F172A' }]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Image
            source={require('../assets/images/icon-new.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, isDark && { color: '#F8FAFC' }]}>Cashtro is Locked</Text>
          <Text style={[styles.subtitle, isDark && { color: '#94A3B8' }]}>
            Authenticate to continue
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.biometricBtn, isDark && { backgroundColor: 'rgba(45,140,255,0.12)', borderColor: 'rgba(45,140,255,0.3)' }]}
            onPress={triggerBiometric}
            disabled={loading}
            activeOpacity={0.75}
          >
            {loading ? (
              <ActivityIndicator color="#2D8CFF" />
            ) : (
              <>
                <Feather name={biometricIcon} size={32} color="#2D8CFF" />
                <Text style={[styles.biometricLabel, isDark && { color: '#F8FAFC' }]}>
                  {methodLabel}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fallbackBtn}
            onPress={onFallbackToPassword}
            activeOpacity={0.7}
          >
            <Feather name="lock" size={14} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={[styles.fallbackText, isDark && { color: '#94A3B8' }]}>Use Password Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    maxWidth: 300,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    lineHeight: 18,
  },
  biometricBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    shadowColor: '#2D8CFF',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  biometricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
