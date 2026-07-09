import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBooks } from '../context/BooksContext';
import { api } from '../utils/api';
import { getCurrencySymbol } from '../utils/planFeatures';

export default function SubscriptionsScreen() {
  const navigation = useNavigation();
  const { activeBook: active } = useBooks();
  
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const bottomSheetModalRef = useRef(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly'); // 'weekly', 'monthly', 'yearly'
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sym = getCurrencySymbol(active?.currency);

  const fetchBills = useCallback(async () => {
    if (!active?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/transactions/upcoming-bills/${active.id}`);
      const dataArray = res.data?.data || res.data || [];
      setBills(Array.isArray(dataArray) ? dataArray : []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [active?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [fetchBills])
  );

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setAmount('');
    setFrequency('monthly');
    setStartDate(new Date());
    bottomSheetModalRef.current?.present();
  };

  const openEditModal = (bill) => {
    setEditId(bill.id);
    setName(bill.merchant || '');
    setAmount(bill.amount?.toString() || '');
    setFrequency(bill.frequency || 'monthly');
    setStartDate(bill.nextDueDate ? new Date(bill.nextDueDate) : new Date());
    bottomSheetModalRef.current?.present();
  };

  const handleSaveSubscription = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editId) {
        await api.put(`/transactions/recurring/${editId}`, {
          name,
          amount: parseFloat(amount),
          frequency,
          startDate: startDate.toISOString(),
        });
      } else {
        await api.post(`/transactions/recurring/${active.id}`, {
          name,
          amount: parseFloat(amount),
          frequency,
          startDate: startDate.toISOString(),
        });
      }
      bottomSheetModalRef.current?.dismiss();
      fetchBills();
    } catch (error) {
      console.error('Save subscription error:', error);
      Alert.alert('Error', 'Could not save subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Subscription', 'Are you sure you want to delete this manual subscription?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/transactions/recurring/${id}`);
          fetchBills();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete subscription');
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Subscriptions & Bills</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2D8CFF" style={{ marginTop: 40 }} />
        ) : bills.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No upcoming bills found.</Text>
            <Text style={styles.emptySubText}>Add a manual subscription or let the app predict them automatically!</Text>
          </View>
        ) : (
          bills.map((bill, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.iconContainer, { backgroundColor: bill.isManual ? '#EFF6FF' : '#FEF2F2' }]}>
                    <Feather name={bill.isManual ? 'repeat' : 'cpu'} size={20} color={bill.isManual ? '#2D8CFF' : '#DC2626'} />
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{bill.merchant}</Text>
                    <Text style={styles.cardSubtitle}>
                      {bill.isManual ? 'Manual Subscription' : 'Auto-Predicted'} • {bill.frequency}
                    </Text>
                  </View>
                </View>
                {bill.isManual && (
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => openEditModal(bill)}>
                      <Feather name="edit-2" size={18} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(bill.id)}>
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.cardDivider} />
              
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>Next Due</Text>
                  <Text style={styles.footerValue}>{new Date(bill.nextDueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.footerLabel}>Amount</Text>
                  <Text style={styles.footerAmount}>{sym}{bill.amount.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Add Subscription Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'fillParent'}
        keyboardBlurBehavior="none"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: '#fff' }}
      >
        <View style={{ flex: 1, paddingBottom: Math.max(insets.bottom, 24) }}>
          <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Subscription' : 'Add Subscription'}</Text>
              <TouchableOpacity onPress={() => bottomSheetModalRef.current?.dismiss()}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subscription Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Netflix, Rent"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqTabs}>
                {['weekly', 'monthly', 'yearly'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqTab, frequency === f && styles.freqTabActive]}
                    onPress={() => setFrequency(f)}
                  >
                    <Text style={[styles.freqTabText, frequency === f && styles.freqTabTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Next Due Date</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Feather name="calendar" size={18} color="#6B7280" />
                <Text style={styles.dateSelectorText}>{startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selectedDate) setStartDate(selectedDate);
                  }}
                />
              )}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveSubscription} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Subscription</Text>
              )}
            </TouchableOpacity>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { padding: 16, paddingBottom: 100 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#374151', marginTop: 16 },
  emptySubText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  // Card
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  cardSubtitle: { fontSize: 13, color: '#6B7280' },
  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  footerValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  footerAmount: { fontSize: 18, fontWeight: '800', color: '#DC2626' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2D8CFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2D8CFF', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5
  },

  // Bottom Sheet
  sheetContent: { padding: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, 
    borderColor: 'rgba(148, 163, 184, 0.25)', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    paddingVertical: Platform.OS === 'android' ? 14 : 16, 
    fontSize: 16, 
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  freqTabs: { flexDirection: 'row', gap: 8 },
  freqTab: { 
    flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 14, 
    borderWidth: 1.5, borderColor: 'rgba(148, 163, 184, 0.25)', backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  freqTabActive: { backgroundColor: '#EFF6FF', borderColor: '#2D8CFF' },
  freqTabText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  freqTabTextActive: { color: '#2D8CFF' },
  dateSelector: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', 
    borderWidth: 1.5, borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: 14, 
    paddingHorizontal: 16, paddingVertical: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1
  },
  dateSelectorText: { fontSize: 16, color: '#111827' },
  submitBtn: { backgroundColor: '#2D8CFF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
