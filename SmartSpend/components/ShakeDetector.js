// components/ShakeDetector.js
// Listens for phone shake events and toggles Private Mode
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { useTransactions } from '../context/TransactionsContext';

const SHAKE_THRESHOLD = 2.2; // G-force threshold
const SHAKE_INTERVAL = 400;  // ms between valid shakes
const SHAKE_COUNT_REQUIRED = 3; // number of shakes to trigger

export default function ShakeDetector() {
  const { hasAccess: isFeatureEnabled } = useFeatureAccess();
  const { privateMode, setPrivateMode } = useTransactions();
  const lastShake = useRef(0);
  const shakeCount = useRef(0);
  const shakeTimer = useRef(null);

  useEffect(() => {
    let enabled = false;

    const setup = async () => {
      if (!isFeatureEnabled('feature_panic_button_active')) return;
      const stored = await AsyncStorage.getItem('@shake_to_lock');
      enabled = stored === 'true';

      if (!enabled) return;

      Accelerometer.setUpdateInterval(100);
      const subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();

        if (magnitude > SHAKE_THRESHOLD && now - lastShake.current > SHAKE_INTERVAL) {
          lastShake.current = now;
          shakeCount.current += 1;

          // Reset shake count after 1.5s of inactivity
          clearTimeout(shakeTimer.current);
          shakeTimer.current = setTimeout(() => {
            shakeCount.current = 0;
          }, 1500);

          if (shakeCount.current >= SHAKE_COUNT_REQUIRED) {
            shakeCount.current = 0;
            setPrivateMode(prev => !prev);
          }
        }
      });

      return () => {
        subscription?.remove?.();
        clearTimeout(shakeTimer.current);
      };
    };

    let cleanup;
    setup().then(fn => { cleanup = fn; });

    return () => {
      if (cleanup) cleanup();
    };
  }, [setPrivateMode, isFeatureEnabled]);

  return null; // Renders nothing
}
