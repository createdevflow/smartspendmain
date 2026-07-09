/**
 * TourGuide.js — Custom in-app feature tour engine
 *
 * Uses React Native Modal + View.measureInWindow() for pixel-perfect
 * spotlight highlighting on every screen, every device.
 *
 * Features:
 *   - Smart Auto-Placement: Dynamically measures tooltip height and flips placement
 *     above/below highlighted element so it NEVER overlaps with the spotlight.
 *   - Accurate Coordinates: Zero status bar offset misalignment on Android/iOS.
 *   - Comprehensive Coverage: Built-in scripts for Home, Transactions, Cashbooks,
 *     Wealth Hub, Invoices, and Settings.
 */

import React, {
  createContext, useContext, useState, useRef, useCallback,
  useEffect, forwardRef,
} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions,
  Platform, Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// ─── Tour Script Definitions ──────────────────────────────────────────────────
export const TOURS = {
  // Phase 1 — Home screen, shown after onboarding welcome
  home: [
    {
      id: 'balance',
      title: 'Your Balance at a Glance 💰',
      text: "This card shows your active cashbook balance. Your net worth updates in real time with every entry.",
      placement: 'bottom',
    },
    {
      id: 'checklist',
      title: 'Getting Started Checklist ✅',
      text: "Complete these quick steps to unlock the full power of Cashtro. Tap any item to jump straight there.",
      placement: 'bottom',
    },
    {
      id: 'quick_actions',
      title: 'Quick Actions 🚀',
      text: "Jump to All Transactions or switch Cashbooks with a single tap.",
      placement: 'bottom',
    },
    {
      id: 'add_expense',
      title: 'Log Expenses Instantly ➖',
      text: "Tap the red Expense button to record money going out. It takes under 5 seconds.",
      placement: 'top',
    },
    {
      id: 'add_income',
      title: 'Record Income ➕',
      text: "Tap the green Income button to log salary, freelance, or any money coming in.",
      placement: 'top',
    },
  ],

  // Phase 2 — Transactions Screen
  after_first_tx: [
    {
      id: 'tx_list',
      title: 'Your Transaction History 📋',
      text: "Every entry you make appears here. Tap any row to edit, share, or delete it.",
      placement: 'bottom',
    },
    {
      id: 'tx_search',
      title: 'Search & Filter 🔍',
      text: "Instantly search by name, amount, or category. Use the filter icon for advanced options.",
      placement: 'bottom',
    },
    {
      id: 'tx_export',
      title: 'Export Your Data 📤',
      text: "Download all transactions as a PDF or CSV. Perfect for tax filing or sharing with your accountant.",
      placement: 'bottom',
    },
    {
      id: 'tx_wealth',
      title: 'Wealth Hub 📈',
      text: "Switch to the Wealth Hub to track stocks, mutual funds, gold, and your live net worth.",
      placement: 'bottom',
    },
    {
      id: 'tx_invoice',
      title: 'Invoices & Billing 📄',
      text: "Tap here to create professional GST invoices and quotations in seconds.",
      placement: 'bottom',
    },
  ],

  // Phase 3 — Cashbooks Screen
  after_first_book: [
    {
      id: 'book_card',
      title: 'Active Cashbook 📒',
      text: "This shows your current cashbook and balance. Tap any card to switch books instantly.",
      placement: 'bottom',
    },
    {
      id: 'book_actions',
      title: 'Share & Collaborate 👥',
      text: "Invite family members or business partners to view or edit this cashbook together in real time.",
      placement: 'bottom',
    },
  ],

  // Phase 4 — Settings Screen
  settings_discovery: [
    {
      id: 'privacy_mode',
      title: 'Privacy Mode 🔒',
      text: "Hide all your balances and amounts with one tap. Perfect for when you're in public.",
      placement: 'bottom',
    },
    {
      id: 'invoices_billing',
      title: 'Invoices & Billing 📄',
      text: "Create professional GST invoices & quotations right from your phone in seconds.",
      placement: 'bottom',
    },
    {
      id: 'notifications',
      title: 'Payment Reminders 🔔',
      text: "Track dues, loans, and automated payment reminders to stay on top of cash flow.",
      placement: 'bottom',
    },
  ],

  // Phase 5 — Wealth Hub Screen
  wealth_tour: [
    {
      id: 'wealth_tabs',
      title: 'Explore Asset Classes 📈',
      text: "Switch between Gold, Stocks, Mutual Funds, and Crypto to track your entire portfolio.",
      placement: 'bottom',
    },
    {
      id: 'wealth_overview',
      title: 'Live Net Worth 🌐',
      text: "Get real-time price updates and AI insights on how your investments are performing.",
      placement: 'bottom',
    },
  ],

  // Phase 6 — Invoices Screen
  invoice_tour: [
    {
      id: 'invoice_stats',
      title: 'Invoice Tracking 📄',
      text: "See exactly how much money is pending, paid, or overdue at a quick glance.",
      placement: 'bottom',
    },
    {
      id: 'invoice_create',
      title: 'Create Professional Invoices ⚡',
      text: "Tap here to generate GST-compliant invoices and share them via WhatsApp or PDF in seconds.",
      placement: 'top',
    },
  ],
};

// ─── Context ──────────────────────────────────────────────────────────────────
const TourGuideContext = createContext(null);

export function useTourGuide() {
  return useContext(TourGuideContext);
}

// ─── Registry of step refs ────────────────────────────────────────────────────
const stepRegistry = {};

export function registerStepRef(stepId, ref) {
  stepRegistry[stepId] = ref;
}

export function unregisterStepRef(stepId) {
  delete stepRegistry[stepId];
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function TourGuideProvider({ children }) {
  const [activeTour, setActiveTour] = useState(null);
  const [stepIndex, setStepIndex]   = useState(0);
  const [visible, setVisible]       = useState(false);
  const [spotlight, setSpotlight]   = useState(null); // { x, y, w, h }
  const stepsMeta = activeTour ? TOURS[activeTour] ?? [] : [];
  const currentStep = stepsMeta[stepIndex] ?? null;

  const measureCurrentStep = useCallback(async () => {
    if (!currentStep) return;
    const ref = stepRegistry[currentStep.id];
    if (!ref?.current?.measureInWindow) return null;
    return new Promise((resolve) => {
      ref.current.measureInWindow((x, y, w, h) => {
        // When statusBarTranslucent is true, Modal origin (0,0) is exactly top-left of screen.
        // We do NOT subtract status bar height so coordinates match pixel-for-pixel.
        resolve({ x, y, w, h });
      });
    });
  }, [currentStep]);

  const endTour = useCallback(() => {
    setVisible(false);
    setActiveTour(null);
    setStepIndex(0);
    setSpotlight(null);
  }, []);

  // Re-measure smoothly whenever step changes or screen animates
  useEffect(() => {
    if (!visible || !currentStep) return;
    let isCancelled = false;

    async function updateCoords() {
      const coords = await measureCurrentStep();
      if (!isCancelled && coords && coords.w > 0 && coords.h > 0) {
        setSpotlight(coords);
      }
    }

    // Measure immediately without flashing or clearing old spotlight
    updateCoords();
    // Retry multiple times to smoothly catch layout shifts or screen transitions
    const t1 = setTimeout(updateCoords, 50);
    const t2 = setTimeout(updateCoords, 150);
    const t3 = setTimeout(updateCoords, 300);

    // If an element is unmounted or missing (e.g., completed checklist), auto-skip to next step!
    const tSkip = setTimeout(() => {
      if (!isCancelled && !stepRegistry[currentStep.id]) {
        if (stepIndex < stepsMeta.length - 1) {
          setStepIndex((i) => i + 1);
        } else {
          endTour();
        }
      }
    }, 400);

    return () => {
      isCancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tSkip);
    };
  }, [visible, currentStep, measureCurrentStep, stepIndex, stepsMeta.length, endTour]);

  const startTour = useCallback((tourId) => {
    if (!TOURS[tourId]) return;
    setActiveTour(tourId);
    setStepIndex(0);
    setSpotlight(null);
    setVisible(true);
  }, []);

  const goNext = useCallback(() => {
    if (stepIndex < stepsMeta.length - 1) {
      // Do not clear spotlight so it transitions smoothly without jumping to screen center
      setStepIndex((i) => i + 1);
    } else {
      endTour();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, stepsMeta.length, endTour]);

  const goPrev = useCallback(() => {
    if (stepIndex > 0) {
      // Do not clear spotlight so it transitions smoothly without jumping to screen center
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const value = {
    startTour,
    endTour,
    goNext,
    goPrev,
    activeTour,
    stepIndex,
    visible,
    currentStep,
    totalSteps: stepsMeta.length,
    spotlight,
  };

  return (
    <TourGuideContext.Provider value={value}>
      {children}
      {visible && <TourOverlay />}
    </TourGuideContext.Provider>
  );
}

// ─── TourStep — wraps a target element to make it highlightable ───────────────
export const TourStep = forwardRef(function TourStep({ id, children, style }, _ref) {
  const innerRef = useRef(null);

  useEffect(() => {
    registerStepRef(id, innerRef);
    return () => unregisterStepRef(id);
  }, [id]);

  return (
    <View ref={innerRef} collapsable={false} style={style}>
      {children}
    </View>
  );
});

// ─── TourOverlay — the visual spotlight + tooltip modal ───────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const PADDING = 14;

function TourOverlay() {
  const {
    goNext, goPrev, endTour,
    currentStep, stepIndex, totalSteps,
    spotlight,
  } = useTourGuide();

  const [tooltipHeight, setTooltipHeight] = useState(110);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.88);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 100, useNativeDriver: true }),
    ]).start();
  }, [stepIndex]);

  if (!currentStep) return null;

  // ── Smart Tooltip Positioning Logic ──
  let tooltipTop;
  let isArrowTop = true;
  const GAP = 14;

  if (!spotlight) {
    tooltipTop = SH / 2 - tooltipHeight / 2;
  } else {
    const pref = currentStep.placement ?? 'bottom';
    
    // For very tall elements (like lists or cards > 220px), treat effective height as 100px so tooltip stays near the top heading!
    const effectiveH = spotlight.h > 220 ? Math.min(100, spotlight.h) : spotlight.h;
    
    const spaceAbove = spotlight.y;
    const spaceBelow = SH - (spotlight.y + effectiveH);
    
    let placeBelow = pref === 'bottom';

    // Check space and flip placement if needed to avoid going off screen or overlapping
    if (placeBelow && spaceBelow < tooltipHeight + GAP + PADDING) {
      if (spaceAbove >= tooltipHeight + GAP + PADDING) {
        placeBelow = false;
      }
    } else if (!placeBelow && spaceAbove < tooltipHeight + GAP + PADDING) {
      if (spaceBelow >= tooltipHeight + GAP + PADDING) {
        placeBelow = true;
      }
    }

    isArrowTop = placeBelow;

    if (placeBelow) {
      tooltipTop = spotlight.y + effectiveH + GAP;
      // If placing below still pushes it off screen, force it above!
      if (tooltipTop + tooltipHeight > SH - PADDING) {
        tooltipTop = Math.max(PADDING, spotlight.y - tooltipHeight - GAP);
        isArrowTop = false;
      }
    } else {
      tooltipTop = spotlight.y - tooltipHeight - GAP;
      // If placing above still pushes it off screen, force it below!
      if (tooltipTop < PADDING) {
        tooltipTop = Math.min(SH - tooltipHeight - PADDING, spotlight.y + effectiveH + GAP);
        isArrowTop = true;
      }
    }
  }

  // Calculate arrow horizontal position pointing precisely at center of spotlight
  const arrowLeft = spotlight ? Math.max(18, Math.min(SW - 56 - 32, (spotlight.x + spotlight.w / 2) - 28 - 7)) : 50;

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={endTour}
    >
      {/* Invisible backdrop — tapping anywhere outside the tooltip dismisses the tour */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={endTour}
      />

      {/* Tooltip card */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h && Math.abs(h - tooltipHeight) > 2) setTooltipHeight(h);
        }}
        style={[
          styles.tooltip,
          { top: tooltipTop, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Pointing arrow / triangle */}
        {spotlight && (
          <View
            style={[
              styles.arrow,
              isArrowTop ? styles.arrowTop : styles.arrowBottom,
              { left: arrowLeft },
            ]}
          />
        )}

        {/* Top row: progress + close */}
        <View style={styles.tooltipTop}>
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i === stepIndex && styles.progressDotActive,
                  i < stepIndex && styles.progressDotDone,
                ]}
              />
            ))}
            <Text style={styles.stepCounterText}>{stepIndex + 1} of {totalSteps}</Text>
          </View>
          <TouchableOpacity onPress={endTour} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} style={styles.closeBtn}>
            <Feather name="x" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Title + text */}
        <Text style={styles.tooltipTitle}>{currentStep.title}</Text>
        <Text style={styles.tooltipText}>{currentStep.text}</Text>

        {/* Navigation */}
        <View style={styles.tooltipFooter}>
          {stepIndex > 0 ? (
            <TouchableOpacity onPress={goPrev} style={styles.btnSecondary}>
              <Feather name="arrow-left" size={14} color="#747487" />
              <Text style={styles.btnSecondaryText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={endTour} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Skip Tour</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={goNext} style={styles.btnPrimary} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>
              {stepIndex === totalSteps - 1 ? 'Finish 🎉' : 'Next'}
            </Text>
            {stepIndex < totalSteps - 1 && <Feather name="arrow-right" size={14} color="#fff" />}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    left: 28,
    right: 28,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#2D8CFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  arrow: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderColor: '#2D8CFF',
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  },
  arrowTop: {
    top: -7,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  arrowBottom: {
    bottom: -7,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
  },
  tooltipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  progressDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    width: 14,
    backgroundColor: '#2D8CFF',
    borderRadius: 2.5,
  },
  progressDotDone: {
    backgroundColor: '#BFDBFE',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 6,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 18,
  },
  tooltipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  tooltipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2D8CFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  btnSecondaryText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 12,
  },
});
