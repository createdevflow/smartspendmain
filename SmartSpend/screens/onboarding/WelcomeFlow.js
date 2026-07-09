import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useOnboarding } from '../../context/OnboardingContext';
import * as Notifications from 'expo-notifications';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

const FEATURE_CARDS = [
  { id: '1', icon: 'file-text', title: 'Track Transactions', desc: 'Record every expense and income securely.', color: '#2D8CFF' },
  { id: '2', icon: 'book-open', title: 'Smart Cashbooks', desc: 'Separate personal, family, or business finances.', color: '#10B981' },
  { id: '3', icon: 'pie-chart', title: 'Analytics & Reports', desc: 'Understand exactly where your money goes.', color: '#F59E0B' },
  { id: '4', icon: 'file', title: 'Professional Invoices', desc: 'Create GST-compliant invoices in seconds.', color: '#8B5CF6' },
  { id: '5', icon: 'message-circle', title: 'Secure Messaging', desc: 'Share reports and receipts with your team.', color: '#EC4899' },
];

export default function WelcomeFlow() {
  const { markWelcomeSeen } = useOnboarding();
  const [step, setStep] = useState(0); // 0: Welcome, 1: Features, 2: Ready

  const handleNext = () => setStep(prev => prev + 1);

  const requestPermissionsAndFinish = async () => {
    // Request push notification permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    markWelcomeSeen();
  };

  const renderWelcome = () => (
    <Animated.View style={styles.stepContainer} entering={FadeIn} exiting={FadeOut}>
      <Animated.View entering={FadeInDown.delay(300)} style={styles.iconWrapper}>
        <Text style={{ fontSize: 60 }}>👋</Text>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(400)} style={styles.title}>
        Welcome to Cashtro
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(500)} style={styles.subtitle}>
        Your personal financial command center. Manage your cashbooks, track wealth, and generate professional invoices all in one place.
      </Animated.Text>
      <Animated.View entering={FadeInDown.delay(600)} style={styles.btnWrapper}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Get Started</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={markWelcomeSeen}>
          <Text style={styles.skipBtnText}>Skip Tour</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderFeatures = () => (
    <Animated.View style={styles.stepContainer} entering={FadeIn} exiting={FadeOut}>
      <Animated.Text entering={FadeInDown.delay(100)} style={styles.titleSmall}>
        Everything you need
      </Animated.Text>
      
      <View style={styles.featuresList}>
        {FEATURE_CARDS.map((f, i) => (
          <Animated.View key={f.id} entering={FadeInDown.delay(200 + (i * 100))} style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
              <Feather name={f.icon} size={24} color={f.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(800)} style={styles.btnWrapperBottom}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  const renderReady = () => (
    <Animated.View style={styles.stepContainer} entering={FadeIn} exiting={FadeOut}>
      <Animated.View entering={FadeInDown.delay(100)} style={styles.iconWrapper}>
        <Feather name="bell" size={48} color="#2D8CFF" />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
        Stay in the loop
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
        Enable notifications to get alerts for important reminders, scheduled reports, and new messages.
      </Animated.Text>
      
      <Animated.View entering={FadeInDown.delay(500)} style={styles.btnWrapper}>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermissionsAndFinish}>
          <Text style={styles.primaryBtnText}>Enable Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={markWelcomeSeen}>
          <Text style={styles.skipBtnText}>Not Now</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {step === 0 && renderWelcome()}
        {step === 1 && renderFeatures()}
        {step === 2 && renderReady()}
      </View>
      
      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map((s) => (
          <View key={s} style={[styles.progressDot, step === s && styles.progressDotActive]} />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 100, height: 100,
    backgroundColor: '#EFF6FF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#232333',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  titleSmall: {
    fontSize: 24,
    fontWeight: '800',
    color: '#232333',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#747487',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  btnWrapper: {
    width: '100%',
    gap: 16,
  },
  btnWrapperBottom: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
  },
  primaryBtn: {
    backgroundColor: '#2D8CFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#2D8CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipBtnText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '600',
  },
  featuresList: {
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    width: 48, height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#747487',
    lineHeight: 18,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 0 : 24,
  },
  progressDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  progressDotActive: {
    width: 24,
    backgroundColor: '#2D8CFF',
  }
});
