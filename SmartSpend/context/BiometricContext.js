/**
 * BiometricContext.js
 *
 * Global state for biometric preferences, app-lock logic, and sensitive-action gating.
 * Persists settings via AsyncStorage. All biometric operations route through BiometricService.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBiometricCapability,
  getBiometricMethodLabel,
  authenticate,
  BiometricResult,
  storeBiometricCredential,
  clearBiometricCredential,
  hasBiometricCredential,
  setBiometricEnrolledFlag,
  retrieveBiometricCredential,
  getBiometricErrorMessage,
} from '../services/BiometricService';

// ─── Constants ───────────────────────────────────────────────────────────────

const PREFS_KEY = '@cashtro_biometric_prefs';
const LAST_AUTH_KEY = '@cashtro_biometric_last_auth';

const DEFAULT_PREFS = {
  enabled: false,
  requireOnLaunch: true,
  requireForSensitiveActions: false,
  requireForReports: false,
  autoLockSeconds: 0,  // 0 = Immediately, -1 = Never
  neverAsk: false,
  onboardingShown: false,
  // Per-action gates
  gateDeleteCashbook: false,
  gateDeleteTransaction: false,
  gateDeleteNote: false,
  gateViewReports: false,
  gateChangePassword: false,
  gateChangeSecurity: false,
  gateViewBusinessDetails: false,
  gateExportData: false,
  gateDeleteAccount: false,
};

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', seconds: 0 },
  { label: '30 seconds', seconds: 30 },
  { label: '1 minute', seconds: 60 },
  { label: '5 minutes', seconds: 300 },
  { label: '10 minutes', seconds: 600 },
  { label: '30 minutes', seconds: 1800 },
  { label: 'Never', seconds: -1 },
];

// ─── Context ─────────────────────────────────────────────────────────────────

const BiometricContext = createContext(null);

export function BiometricProvider({ children }) {
  const [capability, setCapability] = useState(null);
  const [prefs, setPrefsState] = useState(DEFAULT_PREFS);
  const [isLocked, setIsLocked] = useState(false);
  const [lastAuthTime, setLastAuthTime] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  // ── Load prefs + detect capability ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const cap = await getBiometricCapability();
      setCapability(cap);

      const stored = await AsyncStorage.getItem(PREFS_KEY);
      if (stored) {
        setPrefsState(prev => ({ ...prev, ...JSON.parse(stored) }));
      }

      const lastAuth = await AsyncStorage.getItem(LAST_AUTH_KEY);
      if (lastAuth) setLastAuthTime(new Date(lastAuth));

      setIsReady(true);
    })();
  }, []);

  // ── Persist prefs helper ────────────────────────────────────────────────────
  const setPrefs = useCallback(async (updater) => {
    setPrefsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Record last successful auth ─────────────────────────────────────────────
  const recordAuth = useCallback(async () => {
    const now = new Date();
    setLastAuthTime(now);
    await AsyncStorage.setItem(LAST_AUTH_KEY, now.toISOString());
  }, []);

  // ── Check if within auto-lock grace period ─────────────────────────────────
  const isWithinGracePeriod = useCallback(() => {
    if (prefs.autoLockSeconds < 0) return true; // Never
    if (!lastAuthTime) return false;
    const elapsed = (Date.now() - lastAuthTime.getTime()) / 1000;
    return elapsed < prefs.autoLockSeconds;
  }, [prefs.autoLockSeconds, lastAuthTime]);

  // ── App State (background / foreground) monitoring ─────────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.requireOnLaunch) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimeRef.current = Date.now();
      }

      if (nextState === 'active' && (prev === 'background' || prev === 'inactive')) {
        const bgDuration = backgroundTimeRef.current
          ? (Date.now() - backgroundTimeRef.current) / 1000
          : 9999;

        // Lock if grace period exceeded or autoLock = immediately
        if (prefs.autoLockSeconds === 0 || bgDuration > prefs.autoLockSeconds) {
          if (!isWithinGracePeriod()) {
            setIsLocked(true);
          }
        }
      }
    });

    return () => sub.remove();
  }, [prefs.enabled, prefs.requireOnLaunch, prefs.autoLockSeconds, isWithinGracePeriod]);

  // ── Core authenticate helper ────────────────────────────────────────────────
  /**
   * Trigger biometric prompt and return { success, result, error }.
   * On success, records auth time and unlocks.
   */
  const requestBiometricAuth = useCallback(async (message) => {
    const result = await authenticate({ promptMessage: message || 'Authenticate to access Cashtro' });
    if (result === BiometricResult.SUCCESS) {
      await recordAuth();
      setIsLocked(false);
      return { success: true, result };
    }
    const methodLabel = getBiometricMethodLabel(capability);
    const error = getBiometricErrorMessage(result, methodLabel);
    return { success: false, result, error };
  }, [capability, recordAuth]);

  // ── Enable biometrics (store credential) ───────────────────────────────────
  const enableBiometrics = useCallback(async (accessToken) => {
    if (!capability?.isAvailable) return false;
    // First, verify biometric works
    const authResult = await authenticate({ promptMessage: 'Confirm your biometric to enable' });
    if (authResult !== BiometricResult.SUCCESS) return false;
    await storeBiometricCredential(accessToken);
    await setBiometricEnrolledFlag(true);
    await setPrefs({ enabled: true, requireOnLaunch: true });
    await recordAuth();
    return true;
  }, [capability, setPrefs, recordAuth]);

  // ── Disable biometrics ─────────────────────────────────────────────────────
  const disableBiometrics = useCallback(async () => {
    await clearBiometricCredential();
    await setBiometricEnrolledFlag(false);
    await setPrefs({ enabled: false });
    setIsLocked(false);
  }, [setPrefs]);

  // ── Biometric login (retrieve existing token) ───────────────────────────────
  /**
   * Used in LoginScreen to attempt biometric session unlock.
   * Returns the stored access token on success, null on failure.
   * Does NOT call backend — unlocks existing session only.
   */
  const biometricLogin = useCallback(async () => {
    const token = await retrieveBiometricCredential('Sign in to Cashtro with biometrics');
    if (token) {
      await recordAuth();
      setIsLocked(false);
      return token;
    }
    return null;
  }, [recordAuth]);

  // ── Sensitive action gate ───────────────────────────────────────────────────
  /**
   * Call before a sensitive action. Returns true if allowed to proceed.
   * Returns false if biometric is required and failed (caller should abort action).
   */
  const requireBiometricForAction = useCallback(async (actionKey, message) => {
    const gateKey = `gate${actionKey}`;
    if (!prefs.enabled || !prefs[gateKey]) return true;
    const { success } = await requestBiometricAuth(message || 'Authenticate to continue');
    return success;
  }, [prefs, requestBiometricAuth]);

  // ── Refresh capability (call after settings change) ────────────────────────
  const refreshCapability = useCallback(async () => {
    const cap = await getBiometricCapability();
    setCapability(cap);
    return cap;
  }, []);

  const methodLabel = getBiometricMethodLabel(capability);

  const value = {
    // State
    capability,
    prefs,
    isLocked,
    lastAuthTime,
    isReady,
    methodLabel,
    // Constants
    AUTO_LOCK_OPTIONS,
    // Actions
    setPrefs,
    enableBiometrics,
    disableBiometrics,
    biometricLogin,
    requestBiometricAuth,
    requireBiometricForAction,
    refreshCapability,
    setIsLocked,
  };

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
}

export function useBiometric() {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric must be used within BiometricProvider');
  return ctx;
}
