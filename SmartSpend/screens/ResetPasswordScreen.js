import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, otp } = route.params;
  const { verifyOtp } = useContext(AuthContext); // Actually we should add a separate resetPassword method, or just use api directly here
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNum = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);

  const handleReset = async () => {
    if (!(hasLength && hasUpper && hasLower && hasNum && hasSpecial)) {
      Alert.alert('Error', 'Please ensure your new password meets all requirements.');
      return;
    }
    
    setLoading(true);
    try {
      // Import api from utils if needed, or update AuthContext.
      const { api } = require('../utils/api');
      await api.post('/auth/reset-password', { email, otp, newPassword });
      
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      Alert.alert('Reset Failed', msg);
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
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Enter your new password below</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.hintsContainer}>
              <View style={styles.hintRow}>
                <Feather name={hasLength ? 'check-circle' : 'circle'} size={14} color={hasLength ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.hintText, hasLength && styles.hintTextActive]}>8+ characters</Text>
              </View>
              <View style={styles.hintRow}>
                <Feather name={hasUpper ? 'check-circle' : 'circle'} size={14} color={hasUpper ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.hintText, hasUpper && styles.hintTextActive]}>Uppercase letter</Text>
              </View>
              <View style={styles.hintRow}>
                <Feather name={hasLower ? 'check-circle' : 'circle'} size={14} color={hasLower ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.hintText, hasLower && styles.hintTextActive]}>Lowercase letter</Text>
              </View>
              <View style={styles.hintRow}>
                <Feather name={hasNum ? 'check-circle' : 'circle'} size={14} color={hasNum ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.hintText, hasNum && styles.hintTextActive]}>Number</Text>
              </View>
              <View style={styles.hintRow}>
                <Feather name={hasSpecial ? 'check-circle' : 'circle'} size={14} color={hasSpecial ? '#10B981' : '#94A3B8'} />
                <Text style={[styles.hintText, hasSpecial && styles.hintTextActive]}>Special character (@$!%*?&)</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleReset} disabled={loading}>
              <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FB' },
  keyboardView: { flex: 1, padding: 24, justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: 24, left: 24, zIndex: 10,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.05)', borderRadius: 20,
  },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.25)',
    marginBottom: 16, height: 56,
  },
  inputIcon: { paddingHorizontal: 16 },
  input: { flex: 1, color: '#111827', fontSize: 16, height: '100%' },
  eyeIcon: { paddingHorizontal: 16, height: '100%', justifyContent: 'center' },
  hintsContainer: { marginBottom: 24, paddingHorizontal: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  hintText: { marginLeft: 8, fontSize: 12, color: '#94A3B8' },
  hintTextActive: { color: '#10B981' },
  submitBtn: { height: 56, borderRadius: 12, overflow: 'hidden' },
  submitGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
