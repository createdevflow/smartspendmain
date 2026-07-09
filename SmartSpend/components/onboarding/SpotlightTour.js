import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { walkthroughable, CopilotStep, CopilotProvider, useCopilot } from 'react-native-copilot';
import { Feather } from '@expo/vector-icons';

// Custom tooltip component for a premium feel
const TooltipComponent = () => {
  const {
    isFirstStep,
    isLastStep,
    goToNext: handleNext,
    goToPrev: handlePrev,
    stop: handleStop,
    currentStep,
  } = useCopilot();

  if (!currentStep) return null;

  return (
  <View style={styles.tooltipContainer}>
    <View style={styles.tooltipHeader}>
      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>Step {currentStep?.order} of 10</Text>
      </View>
      <TouchableOpacity onPress={handleStop}>
        <Feather name="x" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
    
    <Text style={styles.tooltipTitle}>{currentStep?.name}</Text>
    <Text style={styles.tooltipText}>{currentStep?.text}</Text>
    
    <View style={styles.tooltipFooter}>
      {!isFirstStep ? (
        <TouchableOpacity onPress={handlePrev} style={styles.btnSecondary}>
          <Text style={styles.btnSecondaryText}>Previous</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {!isLastStep ? (
          <TouchableOpacity onPress={handleNext} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Next</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStop} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Finish Tour</Text>
            <Feather name="check" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </View>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    width: SCREEN_WIDTH - 40,
    maxWidth: 340,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIndicator: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D8CFF',
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#232333',
    marginBottom: 6,
  },
  tooltipText: {
    fontSize: 13,
    color: '#747487',
    lineHeight: 18,
    marginBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnSecondaryText: {
    color: '#747487',
    fontWeight: '600',
    fontSize: 14,
  }
});

// Configure the copilot wrapper as a Provider
export const SpotlightTourProvider = ({ children }) => (
  <CopilotProvider
    overlay="view"
    animated={true}
    tooltipComponent={TooltipComponent}
    stepNumberComponent={() => null}
    backdropColor="rgba(15, 23, 42, 0.8)"
    tooltipStyle={{ backgroundColor: 'transparent', padding: 0 }}
    androidStatusBarVisible={true}
    margin={16} // extra padding around highlighted element
  >
    {children}
  </CopilotProvider>
);

// Helper exports
export const WalkthroughableView = walkthroughable(View);
export const WalkthroughableTouchableOpacity = walkthroughable(TouchableOpacity);
export { CopilotStep };
