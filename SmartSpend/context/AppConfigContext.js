// context/AppConfigContext.js
// Fetches and caches global feature flags from the backend.
// Provides isFeatureEnabled(key), isTeaseModeEnabled(key), and maintenanceMode.
// Also triggers a user-data refresh on every successful poll so that
// plan/trial changes made in the Admin panel propagate to the app in real time.
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const AppConfigContext = createContext(null);

const POLL_INTERVAL_MS = 15 * 1000; // Poll every 15 seconds

// Default config — all features enabled, maintenance off
const DEFAULT_CONFIG = {
  maintenance_mode: false,
  feature_transactions: true,
  feature_cashbooks: true,
  feature_categories: true,
  feature_analytics: true,
  feature_reports: true,
  feature_notifications: true,
  feature_budget_management: true,
  feature_savings_goals: true,
  feature_multi_device_sync: true,
  feature_backup_restore: true,
  feature_export: true,
  feature_import: true,
  feature_user_registration: true,
  feature_profile_editing: true,
  feature_account_deletion: true,
  feature_app_updates: true,
  feature_beta: false,
  feature_whatsapp_active: false,
  feature_ocr_active: false,
  feature_gamification_active: false,
  feature_shared_cashbooks_active: false,
  feature_tax_export_active: true,
  feature_panic_button_active: true,
  feature_wealth_hub: true,
  feature_gallery: true,
  feature_chat: true,
  feature_ai_insights_mini: false,
  feature_upcoming_bills: true,
  feature_top_categories: true,
};

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [teaseModes, setTeaseModes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  // We hold a ref to the refreshUser function injected by AuthContext
  // so we can call it from within this context without circular dependency.
  const refreshUserRef = useRef(null);

  /** Called by AuthProvider to register its refreshUser function. */
  const registerRefreshUser = useCallback((fn) => {
    refreshUserRef.current = fn;
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/app-config/public');
      const raw = res.data;
      const payload = raw?.data?.data?.config ? raw.data.data : (raw?.data?.config ? raw.data : raw);
      const serverConfig = payload?.config;
      const serverTeaseModes = payload?.teaseModes ?? {};

      if (serverConfig && typeof serverConfig === 'object') {
        setConfig((prev) => ({ ...DEFAULT_CONFIG, ...prev, ...serverConfig }));
        setTeaseModes(serverTeaseModes);

        // Refresh user data in the background on every successful config poll.
        // This ensures plan changes / trial expiry from admin propagate in ≤15s.
        if (refreshUserRef.current) {
          refreshUserRef.current().catch(() => {}); // silently ignore errors
        }
      }
    } catch (e) {
      // Network error — keep using cached/default config (fail open)
      console.log('[AppConfig] Failed to fetch config, using defaults:', e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, []);

  // Poll periodically for real-time admin changes
  useEffect(() => {
    const interval = setInterval(fetchConfig, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchConfig]);

  /**
   * Check if a feature is globally enabled by the admin.
   * @param {string} key - Feature key
   * @returns {boolean}
   */
  const isFeatureEnabled = useCallback((key) => {
    const val = config[key];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true';
    return true; // Default to ALLOW if key not found
  }, [config]);

  const isTeaseModeEnabled = useCallback((key) => {
    return teaseModes[key] === true;
  }, [teaseModes]);

  return (
    <AppConfigContext.Provider value={{
      config,
      teaseModes,
      isLoading,
      fetchConfig,
      refreshConfig: fetchConfig, // alias used in App.js / MaintenanceScreen
      isFeatureEnabled,
      isTeaseModeEnabled,
      isMaintenanceMode: config.maintenance_mode === true,
      registerRefreshUser,
    }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return ctx;
}
