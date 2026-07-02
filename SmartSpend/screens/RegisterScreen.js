import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  ScrollView, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const PasswordHint = ({ met, text }) => (
  <View style={styles.hintRow}>
    <Feather name={met ? 'check-circle' : 'circle'} size={13} color={met ? '#10B981' : '#CBD5E1'} />
    <Text style={[styles.hintText, met && styles.hintTextActive]}>{text}</Text>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);
  const allMet = hasLength && hasUpper && hasLower && hasNum && hasSpecial;

  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedPass = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPass || !trimmedPhone) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (!allMet) {
      Alert.alert('Weak Password', 'Please ensure your password meets all requirements.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await register(trimmedName, trimmedEmail, trimmedPhone, trimmedPass);
      navigation.navigate('Otp', { email: trimmedEmail, purpose: 'email_verify' });
    } catch (e) {
      let rawMsg = e.response?.data?.message || e.response?.data?.error;

      if (rawMsg && typeof rawMsg === 'object' && !Array.isArray(rawMsg)) {
        rawMsg = rawMsg.message || Object.values(rawMsg).join(', ');
      }

      if (!rawMsg && e.response?.status === 409) rawMsg = 'An account with this email or phone already exists.';
      if (!rawMsg && e.response?.status === 403) rawMsg = e.response?.data?.message || 'Registration is currently disabled.';
      if (!rawMsg && e.response?.status >= 400) rawMsg = 'Registration failed. Please check your details.';
      if (!rawMsg) rawMsg = 'Network error. Please try again.';

      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="arrow-left" size={22} color="#111827" />
              </TouchableOpacity>

              <View style={styles.header}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Start tracking your finances smartly</Text>
              </View>

              <View style={styles.form}>
                {/* Full Name */}
                <View style={styles.inputContainer}>
                  <Feather name="user" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    autoCorrect={false}
                    textContentType="name"
                    autoComplete="name"
                    returnKeyType="next"
                    value={fullName}
                    onChangeText={setFullName}
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputContainer}>
                  <Feather name="phone" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={phoneRef}
                    style={styles.input}
                    placeholder="Phone (e.g. +919876543210)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    returnKeyType="next"
                    value={phone}
                    onChangeText={setPhone}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="done"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Password hints */}
                {password.length > 0 && (
                  <View style={styles.hintsContainer}>
                    <PasswordHint met={hasLength} text="8+ characters" />
                    <PasswordHint met={hasUpper} text="Uppercase letter (A-Z)" />
                    <PasswordHint met={hasLower} text="Lowercase letter (a-z)" />
                    <PasswordHint met={hasNum} text="Number (0-9)" />
                    <PasswordHint met={hasSpecial} text="Special character (@$!%*?&)" />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.registerBtn, loading && styles.btnDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.registerGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={styles.registerBtnText}>Create Account</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.05)',
    borderRadius: 20,
    marginBottom: 28,
    marginTop: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 14,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    paddingVertical: Platform.OS === 'android' ? 14 : 0,
    paddingRight: 8,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  hintsContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(241,245,249,0.8)',
    borderRadius: 10,
    padding: 12,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  hintText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  hintTextActive: {
    color: '#10B981',
  },
  registerBtn: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 24,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  registerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 14,
  },
});
