import React, { useState, useContext, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  Image, ScrollView, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  const handleLogin = async () => {
    const trimmedEmail = emailOrPhone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);
    } catch (e) {
      let rawMsg = e.response?.data?.message || e.response?.data?.error;

      if (rawMsg && typeof rawMsg === 'object' && !Array.isArray(rawMsg)) {
        rawMsg = rawMsg.message || Object.values(rawMsg).join(', ');
      }

      if (!rawMsg && e.response?.status === 401) rawMsg = 'Invalid email or password.';
      if (!rawMsg && e.response?.status === 403) rawMsg = e.response?.data?.message || 'Access denied.';
      if (!rawMsg && e.response?.status >= 400) rawMsg = 'Login failed. Please check your details.';
      if (!rawMsg) rawMsg = 'Network error. Please try again.';

      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : String(rawMsg);

      if (msg.includes('Email not verified')) {
        navigation.navigate('Otp', { email: trimmedEmail, purpose: 'email_verify' });
      } else {
        Alert.alert('Login Failed', msg);
      }
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
            keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/images/icon-new.png')}
                    style={{ width: 100, height: 100 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to manage your finances</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Feather name="mail" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email or Phone"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#2D8CFF', '#2D8CFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" />
                      : <Text style={styles.loginBtnText}>Sign In</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerLink}>Create one</Text>
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
    paddingTop: Platform.OS === 'android' ? 32 : 0,
    paddingBottom: 32,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  loginBtn: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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
