// utils/planFeatures.js
// Reads plan features from the user's plan object returned by the backend.
// Usage: featureEnabled(user, 'ai_insights')

export function featureEnabled(user, key) {
  if (user?.trialExpiresAt && new Date(user.trialExpiresAt) > new Date()) return true;
  if (!user?.plan?.features || user.plan.features.length === 0) return true; // No plan loaded = allow (avoid flash)
  const match = user.plan.features.find((pf) => {
    const featureKey = pf.feature?.key ?? pf.featureKey ?? '';
    return featureKey === key;
  });
  if (!match) return true; // Feature not in plan = allow (basic feature)
  // Boolean features: value 'false' or '0' = disabled, anything else = enabled
  const val = match.value ?? match.limitValue ?? 'true';
  return String(val) !== 'false' && String(val) !== '0';
}

export function getCurrencySymbol(currency) {
  const map = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
  return map[currency] || '₹';
}
