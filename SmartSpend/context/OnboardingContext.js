import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { api } from '../utils/api';

export const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const { user } = useContext(AuthContext);

  // State
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // default true until loaded to prevent flash
  const [seenFeatures, setSeenFeatures] = useState({});
  const [seenTours, setSeenTours] = useState({});
  const [checklist, setChecklist] = useState({
    profile: false,
    firstCashbook: false,
    firstTransaction: false,
    firstInvoice: false,
    firstGoal: false,
  });
  const [loading, setLoading] = useState(true);

  const stateRef = useRef({ user, loading, hasSeenWelcome, seenFeatures, seenTours, checklist });
  useEffect(() => {
    stateRef.current = { user, loading, hasSeenWelcome, seenFeatures, seenTours, checklist };
  });

  // Load state on mount or user change
  useEffect(() => {
    async function loadState() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Load from local storage first
        const localStr = await AsyncStorage.getItem(`@onboarding_${user.id}`);
        let localData = localStr ? JSON.parse(localStr) : null;
        
        // Fetch from backend to sync (will implement API later)
        try {
          const res = await api.get('/users/me/onboarding');
          if (res.data && Object.keys(res.data).length > 0) {
            localData = {
              hasSeenWelcome: localData?.hasSeenWelcome || res.data.hasSeenWelcome || false,
              seenFeatures: { ...(localData?.seenFeatures || {}), ...(res.data.seenFeatures || {}) },
              seenTours: { ...(localData?.seenTours || {}), ...(res.data.seenTours || {}) },
              checklist: { ...(localData?.checklist || {}), ...(res.data.checklist || {}) },
            };
            await AsyncStorage.setItem(`@onboarding_${user.id}`, JSON.stringify(localData));
          }
        } catch (e) {
          // ignore API error, rely on local
        }

        if (localData) {
          setHasSeenWelcome(localData.hasSeenWelcome ?? false);
          setSeenFeatures(localData.seenFeatures || {});
          setSeenTours(localData.seenTours || {});
          setChecklist(localData.checklist || {
            profile: false, firstCashbook: false, firstTransaction: false, firstInvoice: false, firstGoal: false
          });
        } else {
          // completely new user
          setHasSeenWelcome(false);
        }
      } catch (err) {
        console.error('Failed to load onboarding state:', err);
      } finally {
        setLoading(false);
      }
    }
    loadState();
  }, [user?.id]);

  const saveState = useCallback(async (newState) => {
    const { user: currentUser, hasSeenWelcome: curWelcome, seenFeatures: curFeatures, seenTours: curTours, checklist: curChecklist } = stateRef.current;
    if (!currentUser) return;
    try {
      // Build updated object
      const updated = {
        hasSeenWelcome: newState.hasSeenWelcome !== undefined ? newState.hasSeenWelcome : curWelcome,
        seenFeatures: newState.seenFeatures || curFeatures,
        seenTours: newState.seenTours || curTours,
        checklist: newState.checklist || curChecklist,
      };

      // Update local state
      if (newState.hasSeenWelcome !== undefined) setHasSeenWelcome(newState.hasSeenWelcome);
      if (newState.seenFeatures) setSeenFeatures(newState.seenFeatures);
      if (newState.seenTours) setSeenTours(newState.seenTours);
      if (newState.checklist) setChecklist(newState.checklist);

      // Save local
      await AsyncStorage.setItem(`@onboarding_${currentUser.id}`, JSON.stringify(updated));

      // Sync remote
      api.patch('/users/me/onboarding', updated).catch(() => {});
    } catch (err) {
      console.error('Failed to save onboarding state:', err);
    }
  }, []);

  const markWelcomeSeen = useCallback(() => saveState({ hasSeenWelcome: true }), [saveState]);
  
  const markFeatureSeen = useCallback((featureId) => {
    if (stateRef.current.seenFeatures[featureId]) return;
    saveState({ seenFeatures: { ...stateRef.current.seenFeatures, [featureId]: true } });
  }, [saveState]);

  const markTourSeen = useCallback((tourId) => {
    if (stateRef.current.seenTours[tourId]) return;
    saveState({ seenTours: { ...stateRef.current.seenTours, [tourId]: true } });
  }, [saveState]);

  // Returns true if tour should auto-start (not yet seen)
  const shouldShowTour = useCallback((tourId) => {
    if (loading || !user) return false;
    return hasSeenWelcome && !seenTours[tourId];
  }, [loading, user, hasSeenWelcome, seenTours]);

  const updateChecklist = useCallback((key, value = true) => {
    if (stateRef.current.checklist[key] === value) return;
    saveState({ checklist: { ...stateRef.current.checklist, [key]: value } });
  }, [saveState]);

  useEffect(() => {
    if (user && (user.name || user.firstName || user.email)) {
      if (!checklist.profile) {
        updateChecklist('profile', true);
      }
    }
  }, [user?.id, checklist.profile, updateChecklist]);

  const resetOnboarding = useCallback(() => {
    saveState({
      hasSeenWelcome: false,
      seenFeatures: {},
      seenTours: {},
      checklist: { profile: false, firstCashbook: false, firstTransaction: false, firstInvoice: false, firstGoal: false }
    });
  }, [saveState]);

  return (
    <OnboardingContext.Provider
      value={{
        loading,
        hasSeenWelcome,
        seenFeatures,
        seenTours,
        checklist,
        markWelcomeSeen,
        markFeatureSeen,
        markTourSeen,
        shouldShowTour,
        updateChecklist,
        resetOnboarding,
        isChecklistComplete: ['profile', 'firstCashbook', 'firstTransaction', 'firstGoal'].every(key => checklist[key])
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
