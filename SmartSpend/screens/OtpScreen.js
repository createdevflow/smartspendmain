import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function OtpScreen({ route, navigation }) {
  const { email, purpose } = route.params;
  const { verifyOtp } = useContext(AuthContext);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useEffect(() => {
    // Focus first input
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next
    if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }

    if (purpose === 'password_reset') {
      // Just navigate to ResetPassword, it will do the actual verify + update
      navigation.navigate('ResetPassword', { email, otp: code });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, code, purpose);
      Alert.alert('Success', 'Email verified successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      Alert.alert('Verification Failed', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Feather name="mail" size={32} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>We sent a 6-digit verification code to</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[styles.otpInput, digit && styles.otpInputActive]}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} disabled={loading}>
      <LinearGradient colors={['#2D8CFF', '#2D8CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyGradient}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyBtnText}>Verify Code</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Didn't receive the code? </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Resend</Text>
              </TouchableOpacity>
            </View>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  keyboardView: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 24,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.05)',
    borderRadius: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  emailText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderRadius: 12,
    color: '#111827',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: '#2D8CFF',
    backgroundColor: '#EFF6FF',
  },
  verifyBtn: {
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  verifyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#6B7280',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
