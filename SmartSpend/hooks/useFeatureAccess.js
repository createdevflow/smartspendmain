// hooks/useFeatureAccess.js
// Central feature gating hook.
//
// Priority (highest to lowest):
//   1. Global Admin Feature Toggle (OFF = hidden for ALL users, regardless of plan)
//   1.5. Free Trial — active trial users get full access to all globally-ON features
//   2. User's Plan Features (if toggle is ON, plan decides what they get)
//   3. Default ALLOW if feature is not explicitly listed in the plan
//      (assumes it's a basic feature available to all)
//
import { useContext } from 'react';
import { useAppConfig } from '../context/AppConfigContext';
import { AuthContext } from '../context/AuthContext';

// Map feature-toggle keys to plan feature keys when they differ
const KEY_ALIASES = {
  feature_wealth: 'feature_wealth_hub',
};

// Helper: is the user's free trial currently active?
export const isOnTrial = (user) =>
  !!(user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date());

export function useFeatureAccess() {
  const { isFeatureEnabled: isGloballyEnabled, isTeaseModeEnabled } = useAppConfig();
  const { user } = useContext(AuthContext);

  // ── Internal helpers ────────────────────────────────────────────────────────

  /** Does the user's plan explicitly grant this feature? */
  const planGrantsAccess = (resolvedKey, originalKey) => {
    if (!user?.plan?.features || user.plan.features.length === 0) return null; // unknown
    const planFeature = user.plan.features.find(
      (pf) => pf.feature?.key === resolvedKey || pf.feature?.key === originalKey
    );
    if (planFeature === undefined) {
      if (isTeaseModeEnabled(resolvedKey) || isTeaseModeEnabled(originalKey)) return false;
      return true; // not restricted in plan → allow
    }
    const val = planFeature.value ?? planFeature.limitValue;
    if (val === 'false' || val === '0') return false;
    if (val === 'true' || val === '-1') return true;
    if (!isNaN(Number(val))) return Number(val) > 0;
    return true;
  };

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Check if a feature is accessible to the current user.
   * @param {string} key - e.g. 'feature_wealth_hub', 'feature_chat'
   * @returns {boolean}
   */
  const hasAccess = (key) => {
    const resolvedKey = KEY_ALIASES[key] ?? key;

    // ── LAYER 1: Global Admin Toggle ──────────────────────────────────────
    if (!isGloballyEnabled(resolvedKey)) return false;

    // ── LAYER 1.5: Free Trial ─────────────────────────────────────────────
    if (isOnTrial(user)) return true;

    // ── LAYER 1.8: Freemium Tease Mode Override for Free Users ────────────
    // If admin enabled Tease Mode for this toggle, lock it for non-paying users
    const isFreeUser = !user?.plan || user.plan.name?.toLowerCase() === 'free' || user.plan.slug?.toLowerCase() === 'free' || user.plan.isDefault === true;
    if ((isTeaseModeEnabled(resolvedKey) || isTeaseModeEnabled(key)) && isFreeUser) {
      return false;
    }

    // ── LAYER 2: Plan Features ─────────────────────────────────────────────
    const planResult = planGrantsAccess(resolvedKey, key);
    if (planResult !== null) return planResult;

    // ── LAYER 3: Default Allow ─────────────────────────────────────────────
    return true;
  };

  const getFeatureTease = (key) => {
    const resolvedKey = KEY_ALIASES[key] ?? key;

    if (!isGloballyEnabled(resolvedKey)) return false;
    if (!isTeaseModeEnabled(resolvedKey) && !isTeaseModeEnabled(key)) return false;
    if (isOnTrial(user)) return false;

    const isFreeUser = !user?.plan || user.plan.name?.toLowerCase() === 'free' || user.plan.slug?.toLowerCase() === 'free' || user.plan.isDefault === true;
    if (isFreeUser) return true;

    const planResult = planGrantsAccess(resolvedKey, key);
    if (planResult === null || planResult === true) return false;

    return true;
  };

  /**
   * Get a numeric limit for a feature from the user's plan.
   * Trial users get Infinity.
   * @param {string} key - e.g. 'max_cashbooks'
   * @param {number} defaultLimit - fallback if not found
   * @returns {number} - returns Infinity if unlimited (-1) or on trial
   */
  const getPlanLimit = (key, defaultLimit = 0) => {
    if (isOnTrial(user)) return Infinity;
    if (!user?.plan?.features) return defaultLimit;
    const planFeature = user.plan.features.find((pf) => pf.feature?.key === key);
    if (!planFeature) return defaultLimit;
    const val = planFeature.value ?? planFeature.limitValue;
    if (val === '-1') return Infinity;
    const num = parseInt(val, 10);
    return isNaN(num) ? defaultLimit : num;
  };

  /**
   * Get the raw string value of a plan feature (for non-boolean features).
   * @param {string} key
   * @param {string} fallback
   * @returns {string}
   */
  const getPlanValue = (key, fallback = '') => {
    if (!user?.plan?.features) return fallback;
    const planFeature = user.plan.features.find((pf) => pf.feature?.key === key);
    return planFeature?.value ?? planFeature?.limitValue ?? fallback;
  };

  return { hasAccess, getPlanLimit, getPlanValue, getFeatureTease, isOnTrial: () => isOnTrial(user) };
}
