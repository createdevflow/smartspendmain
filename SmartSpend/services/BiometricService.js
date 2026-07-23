/**
 * BiometricService.js
 *
 * Single cross-platform biometric capability layer.
 * - Android: LocalAuthentication → BiometricPrompt + Keystore (via expo-secure-store biometricStrong)
 * - iOS: LocalAuthentication → Face ID / Touch ID + Secure Enclave (via expo-secure-store)
 *
 * SECURITY CONTRACT:
 * - No biometric data (fingerprint/face templates) is ever read, stored, or transmitted.
 * - OS performs all biometric matching; Cashtro only receives pass/fail.
 * - The stored credential is the session access token, secured by the device's
 *   hardware-backed secure storage requiring biometric unlock.
 * - Biometric auth unlocks the EXISTING session only. Server auth is untouched.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Key used in SecureStore. Hardware-backed on both platforms.
const BIOMETRIC_TOKEN_KEY = 'cashtro_biometric_session_key';

// ─── Capability Detection ────────────────────────────────────────────────────

/**
 * Returns detailed device biometric capability info.
 * No biometric data is accessed — only device metadata.
 */
export async function getBiometricCapability() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
    const supportedTypes = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];

    const hasFaceId = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const hasFingerprint = supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const hasIris = supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS);

    return {
      hasHardware,
      isEnrolled,
      hasFaceId,
      hasFingerprint,
      hasIris,
      supportedTypes,
      isAvailable: hasHardware && isEnrolled,
    };
  } catch (e) {
    return {
      hasHardware: false,
      isEnrolled: false,
      hasFaceId: false,
      hasFingerprint: false,
      hasIris: false,
      supportedTypes: [],
      isAvailable: false,
    };
  }
}

/**
 * Returns a human-readable method name for display.
 */
export function getBiometricMethodLabel(capability) {
  if (!capability?.hasHardware) return 'Not Supported';
  if (!capability?.isEnrolled) return 'Not Enrolled';
  if (capability.hasFaceId) return 'Face ID';
  if (capability.hasFingerprint) return 'Fingerprint';
  if (capability.hasIris) return 'Iris';
  return 'Biometric';
}

// ─── Secure Credential Storage (Step 2) ─────────────────────────────────────

/**
 * Store the session token protected by biometric hardware.
 * On iOS → Secure Enclave, On Android → Android Keystore.
 * NEVER stores biometric data — only the app's own session token.
 */
export async function storeBiometricCredential(accessToken) {
  await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, accessToken, {
    requireAuthentication: true,   // iOS: biometric/device-passcode gated
    keychainService: 'cashtro.biometric',
  });
}

/**
 * Retrieve the session token by triggering a biometric prompt.
 * Returns null on failure — caller must fall back to password.
 */
export async function retrieveBiometricCredential(promptMessage = 'Authenticate to access Cashtro') {
  try {
    const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY, {
      requireAuthentication: true,
      authenticationPrompt: promptMessage,
      keychainService: 'cashtro.biometric',
    });
    return token;
  } catch (e) {
    return null;
  }
}

/**
 * Remove the stored biometric credential (on logout, disable, or reinstall).
 */
export async function clearBiometricCredential() {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY, {
      keychainService: 'cashtro.biometric',
    });
  } catch (_) {}
}

/**
 * Check if a biometric credential has been stored for this installation.
 */
export async function hasBiometricCredential() {
  try {
    // getItemAsync with requireAuthentication would prompt — use a separate
    // existence check via a non-biometric flag key.
    const flag = await SecureStore.getItemAsync('cashtro_biometric_enrolled_flag');
    return flag === 'true';
  } catch (_) {
    return false;
  }
}

export async function setBiometricEnrolledFlag(enrolled) {
  if (enrolled) {
    await SecureStore.setItemAsync('cashtro_biometric_enrolled_flag', 'true');
  } else {
    await SecureStore.deleteItemAsync('cashtro_biometric_enrolled_flag');
  }
}

// ─── Authentication Prompt ───────────────────────────────────────────────────

/**
 * Result codes for biometric authenticate().
 */
export const BiometricResult = {
  SUCCESS: 'SUCCESS',
  CANCELLED: 'CANCELLED',
  FALLBACK: 'FALLBACK',          // User tapped "Use Password"
  FAILED: 'FAILED',
  NOT_ENROLLED: 'NOT_ENROLLED',
  UNSUPPORTED: 'UNSUPPORTED',
  LOCKED_OUT: 'LOCKED_OUT',
  ERROR: 'ERROR',
};

/**
 * Show the OS biometric prompt. Returns a BiometricResult code.
 * NOTE: On Android SDK 28+, this triggers BiometricPrompt.
 * On iOS, this triggers LocalAuthentication (Face ID / Touch ID).
 * Cashtro never sees biometric data — only the pass/fail result.
 */
export async function authenticate(options = {}) {
  const capability = await getBiometricCapability();

  if (!capability.hasHardware) return BiometricResult.UNSUPPORTED;
  if (!capability.isEnrolled) return BiometricResult.NOT_ENROLLED;

  const {
    promptMessage = 'Authenticate to access Cashtro',
    fallbackLabel = 'Use Password',
    cancelLabel = 'Cancel',
    disableDeviceFallback = false,
  } = options;

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel,
      cancelLabel,
      disableDeviceFallback,
      requireConfirmation: false,
    });

    if (result.success) return BiometricResult.SUCCESS;

    switch (result.error) {
      case 'user_cancel':
      case 'system_cancel':
        return BiometricResult.CANCELLED;
      case 'user_fallback':
        return BiometricResult.FALLBACK;
      case 'not_enrolled':
        return BiometricResult.NOT_ENROLLED;
      case 'lockout':
      case 'lockout_permanent':
        return BiometricResult.LOCKED_OUT;
      default:
        return BiometricResult.FAILED;
    }
  } catch (e) {
    return BiometricResult.ERROR;
  }
}

/**
 * Returns a user-friendly message for a BiometricResult.
 */
export function getBiometricErrorMessage(result, methodLabel = 'Biometric') {
  switch (result) {
    case BiometricResult.CANCELLED:
      return 'Authentication was cancelled.';
    case BiometricResult.FALLBACK:
      return null; // caller handles password fallback silently
    case BiometricResult.NOT_ENROLLED:
      return `No ${methodLabel} enrolled. Please set up biometrics in device Settings.`;
    case BiometricResult.UNSUPPORTED:
      return `${methodLabel} is not supported on this device.`;
    case BiometricResult.LOCKED_OUT:
      return `Too many attempts. ${methodLabel} is temporarily locked. Please use your password.`;
    case BiometricResult.FAILED:
      return `${methodLabel} not recognized. Please try again or use your password.`;
    case BiometricResult.ERROR:
      return 'An error occurred. Please use your password.';
    default:
      return 'Authentication failed. Please use your password.';
  }
}
