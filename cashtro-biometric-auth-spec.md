# Cashtro Mobile — Biometric Authentication Spec

**Scope:** SmartSpend Mobile App (React Native/Expo) — integrated into the *existing* authentication, session, and settings architecture. Not a standalone auth flow.

**Objective:** Let users unlock Cashtro via Fingerprint, Face ID/Face Unlock, or any OS-supported device biometric — improving convenience without weakening security.

---

## 1. Platforms & APIs
- Android: `BiometricPrompt`, Android Keystore
- iOS: Face ID, Touch ID, `LocalAuthentication`, Secure Enclave
- Use official platform APIs only — no custom biometric storage or capture.

## 2. Security Principles
- Never collect, store, upload, or process fingerprints, face data, or biometric templates — these stay entirely within the OS.
- Cashtro stores only a secure authentication credential / cryptographic key protected by the device's secure hardware (Keystore / Secure Enclave).
- All biometric verification happens through the OS — Cashtro never implements its own matching logic.

## 3. Settings — New "Security" Section
**Biometric Authentication controls:**
- Enable / Disable Biometrics
- Use Fingerprint
- Use Face ID (when supported)
- Require Biometrics on App Launch
- Require Biometrics for Sensitive Actions
- Require Biometrics before Payments *(future)*
- Require Biometrics before Viewing Financial Reports *(optional)*
- Trusted Device Information

**Status display:**
- Device Support Status
- Enrolled Biometrics Status
- Last Authentication Time
- Authentication Method

## 4. Onboarding Flow
After successful login, if biometrics are available on-device, prompt:
> "Enable biometric authentication for faster and more secure access."

Options: **Enable / Later / Never Ask Again**

## 5. Login Flow
```
Password Login → Enable Biometrics → Future logins use biometrics
```
Fallback on biometric failure: **Password → OTP → Recovery**

## 6. App Lock
Optional auto-lock timing:
Immediately / 30s / 1 min / 5 min / 10 min / 30 min
→ Require biometric authentication on reopen.

## 7. Background Security
When enabled, re-authenticate after:
- App restart
- Background timeout
- Screen lock
- Long inactivity

All thresholds configurable in Settings.

## 8. Sensitive Actions (user-configurable, per action)
Optional biometric gate for:
- Deleting Cashbooks / Transactions / Notes
- Viewing Financial Reports
- Changing Security Settings
- Changing Password
- Viewing Saved Business Details, GST Details, PAN Details
- Exporting Data
- Deleting Account

## 9. Device Management
Show per current device: Device Name, Platform, Biometric Availability, Authentication Method, Last Successful Verification. Allow removing trusted devices.

## 10. Session Security
- Biometric auth unlocks the **existing** authenticated session only.
- Does NOT replace server authentication and does NOT bypass backend authorization.
- Server-side permissions remain unchanged — biometrics is a local unlock layer on top of the existing session, not a new trust boundary.

## 11. Error Handling (graceful, all cases)
- No Biometrics Enrolled
- Hardware Unsupported
- Permission Denied
- Authentication Cancelled
- Authentication Failed
- Sensor Temporarily Locked
- Too Many Attempts
→ Always fall back to password authentication.

## 12. Privacy Disclosure (shown in Settings)
- Cashtro never stores fingerprints or face scans.
- Biometric information never leaves the device.
- Authentication is handled entirely by the OS.
- Only a secure cryptographic credential protected by the device's secure hardware is used to unlock the app.

## 13. Admin Visibility
Admins must never receive: fingerprint data, face data, biometric templates, or authentication images.
Only device capability / security status may be surfaced for diagnostics — nothing biometric.

## 14. UI Requirements
Integrate seamlessly into existing Cashtro UI/UX — Light Mode, Dark Mode, animations, and accessibility support required, no new design language.

## 15. Testing Matrix
- Android Fingerprint
- Android Face Unlock (where supported)
- iPhone Face ID
- iPhone Touch ID
- Unsupported devices
- Multiple failed attempts / device lockout
- Session expiration
- Offline mode
- Reinstallation
- Device change
- Logout/Login cycle

## 16. Final Goal
Enterprise-grade biometric authentication that:
- Enhances security and UX without ever storing/processing biometric data directly.
- Relies entirely on secure platform APIs (Android Keystore / iOS Secure Enclave).
- Integrates cleanly with Cashtro's existing authentication, session management, security settings, and future financial authorization workflows (payments, sensitive-action gating).
