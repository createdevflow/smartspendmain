// screens/PaymentReminderScreen.js
// Payment reminders — track amounts to receive or pay, with due dates and status tracking
import React, { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Modal, Keyboard,
} from 'react-native';
import {
  BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useBooks } from '../context/BooksContext';
import { AuthContext } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { getCurrencySymbol } from '../utils/planFeatures';
import { api } from '../utils/api';

// Base constant for fallback if needed, though we use dynamic key now
const BASE_STORAGE_KEY = '@cashtro_payment_reminders';

function generateId() {
  return `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(iso) {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  if (isNaN(d)) return 'No due date';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

const EMPTY_FORM = {
  type: 'receive', // 'receive' | 'pay'
  person: '',
  amount: '',
  note: '',
  dueDate: null,
};

export default function PaymentReminderScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { activeBook } = useBooks();
  const { user } = useContext(AuthContext);
  const sym = getCurrencySymbol(activeBook?.currency);

  const STORAGE_KEY = `@cashtro_payment_reminders_${user?.id || 'guest'}`;

  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState('receive'); // 'receive' | 'pay'
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['85%', '96%'], []);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setReminders([]);
      return;
    }
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setReminders(Array.isArray(parsed) ? parsed.filter(r => r.userId === user.id || !r.userId) : []);
        } else {
          setReminders([]);
        }
      })
      .catch(() => setReminders([]));
  }, [STORAGE_KEY, user?.id]);

  const saveToStorage = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [STORAGE_KEY]);

  const filteredReminders = useMemo(() =>
    reminders
      .filter(r => r.type === activeTab && (!r.userId || r.userId === user?.id))
      .sort((a, b) => {
        // Pending first, sorted by due date
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }),
    [reminders, activeTab]
  );

  const totals = useMemo(() => {
    const pending = reminders.filter(r => r.type === activeTab && r.status !== 'paid');
    const paid = reminders.filter(r => r.type === activeTab && r.status === 'paid');
    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0),
      paidCount: paid.length,
    };
  }, [reminders, activeTab]);

  const openAdd = useCallback((type) => {
    setForm({ ...EMPTY_FORM, type: type || activeTab });
    setEditingId(null);
    sheetRef.current?.present();
  }, [activeTab]);

  const openEdit = useCallback((reminder) => {
    setForm({
      type: reminder.type,
      person: reminder.person,
      amount: String(reminder.amount),
      note: reminder.note || '',
      dueDate: reminder.dueDate ? new Date(reminder.dueDate) : null,
    });
    setEditingId(reminder.id);
    sheetRef.current?.present();
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.person.trim()) {
      Alert.alert('Missing Info', 'Please enter a person name.');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      let updated;
      if (editingId) {
        updated = reminders.map(r =>
          r.id === editingId
            ? {
                ...r,
                person: form.person.trim(),
                amount: parseFloat(form.amount),
                note: form.note.trim(),
                dueDate: form.dueDate ? form.dueDate.toISOString() : null,
              }
            : r
        );
      } else {
        const newReminder = {
          id: generateId(),
          userId: user?.id,
          type: form.type,
          person: form.person.trim(),
          amount: parseFloat(form.amount),
          note: form.note.trim(),
          dueDate: form.dueDate ? form.dueDate.toISOString() : null,
          status: 'pending',
          createdAt: now,
        };
        updated = [...reminders, newReminder];
      }
      setReminders(updated);
      await saveToStorage(updated);
      sheetRef.current?.dismiss();
    } finally {
      setSaving(false);
    }
  }, [form, editingId, reminders, saveToStorage, user?.id]);

  const markPaid = useCallback(async (id) => {
    Alert.alert(
      'Mark as Paid?',
      'This will mark the reminder as settled.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid ✓',
          onPress: async () => {
            const reminder = reminders.find(r => r.id === id);
            const updated = reminders.map(r =>
              r.id === id ? { ...r, status: 'paid', paidAt: new Date().toISOString() } : r
            );
            setReminders(updated);
            await saveToStorage(updated);
            
            // Create Transaction
            if (reminder && activeBook) {
              try {
                await api.post('/transactions', {
                  cashbookId: activeBook.id,
                  amount: parseFloat(reminder.amount),
                  type: reminder.type === 'receive' ? 'IN' : 'OUT',
                  category: 'Other',
                  remark: `Payment ${reminder.type === 'receive' ? 'from' : 'to'} ${reminder.person}`,
                  paymentMethod: 'Cash',
                  date: new Date().toISOString(),
                });
              } catch (e) {
                console.error('Failed to create transaction for payment reminder', e);
              }
            }
          },
        },
      ]
    );
  }, [reminders, saveToStorage]);

  const deleteReminder = useCallback(async (id) => {
    Alert.alert(
      'Delete Reminder?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = reminders.filter(r => r.id !== id);
            setReminders(updated);
            await saveToStorage(updated);
          },
        },
      ]
    );
  }, [reminders, saveToStorage]);

  const renderItem = useCallback(({ item }) => {
    const overdue = isOverdue(item.dueDate) && item.status !== 'paid';
    const isPaid = item.status === 'paid';
    return (
      <TouchableOpacity
        style={[styles.card, isPaid && styles.cardPaid, isDark && { backgroundColor: isPaid ? '#1E293B' : '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}
        onPress={() => openEdit(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.cardAccent, { backgroundColor: isPaid ? '#10B981' : activeTab === 'receive' ? '#2D8CFF' : '#EF4444' }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.cardAvatar, isDark && { backgroundColor: 'rgba(45,140,255,0.15)' }]}>
              <Text style={styles.cardAvatarText}>
                {(item.person || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.cardPerson, isPaid && styles.textMuted, isDark && !isPaid && { color: '#F8FAFC' }]}>{item.person}</Text>
              {!!item.note && <Text style={[styles.cardNote, isDark && { color: '#94A3B8' }]} numberOfLines={1}>{item.note}</Text>}
              <View style={styles.cardDateRow}>
                <Feather name="calendar" size={11} color={overdue ? '#EF4444' : '#9CA3AF'} />
                <Text style={[styles.cardDate, overdue && styles.dateOverdue]}>{formatDate(item.dueDate)}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[styles.cardAmount, isPaid && styles.textMuted, !isPaid && (activeTab === 'receive' ? styles.amountReceive : styles.amountPay)]}>
                {sym}{(parseFloat(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              {isPaid ? (
                <View style={[styles.paidBadge, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Feather name="check-circle" size={12} color="#10B981" />
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.markPaidBtn, isDark && { backgroundColor: 'rgba(45,140,255,0.15)' }]} onPress={() => markPaid(item.id)}>
                  <Text style={styles.markPaidBtnText}>Mark Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteReminder(item.id)}>
          <Feather name="trash-2" size={14} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [activeTab, sym, markPaid, deleteReminder, openEdit, isDark]);

  return (
    <SafeAreaView style={[styles.safe, isDark && { backgroundColor: '#0F172A' }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: '#0F172A', borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isDark ? '#F8FAFC' : '#232333'} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, isDark && { color: '#F8FAFC' }]}>Payment Reminders</Text>
          <Text style={[styles.headerSub, isDark && { color: '#94A3B8' }]}>Track amounts to receive or pay</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, isDark && { backgroundColor: '#1E293B' }]} onPress={() => openAdd(activeTab)}>
          <Feather name="plus" size={20} color="#2D8CFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, isDark && { backgroundColor: '#0F172A', borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'receive' && styles.tabActive]}
          onPress={() => setActiveTab('receive')}
        >
          <Feather name="arrow-down-circle" size={16} color={activeTab === 'receive' ? '#2D8CFF' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'receive' && styles.tabTextActive]}>To Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pay' && styles.tabActivePay]}
          onPress={() => setActiveTab('pay')}
        >
          <Feather name="arrow-up-circle" size={16} color={activeTab === 'pay' ? '#EF4444' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'pay' && styles.tabTextActivePay]}>To Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {totals.pendingCount > 0 && (
        <View style={[styles.summaryCard, activeTab === 'pay' && styles.summaryCardPay, isDark && { backgroundColor: activeTab === 'pay' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(45, 140, 255, 0.15)', borderColor: activeTab === 'pay' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(45, 140, 255, 0.3)' }]}>
          <View>
            <Text style={[styles.summaryLabel, isDark && { color: '#94A3B8' }]}>Total Pending</Text>
            <Text style={[styles.summaryAmount, isDark && { color: '#F8FAFC' }]}>
              {sym}{totals.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryRight}>
            <Text style={[styles.summaryCount, isDark && { color: '#F8FAFC' }]}>{totals.pendingCount} reminder{totals.pendingCount !== 1 ? 's' : ''}</Text>
            {totals.paidCount > 0 && (
              <Text style={styles.summaryPaid}>{totals.paidCount} settled</Text>
            )}
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredReminders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{activeTab === 'receive' ? '💸' : '📤'}</Text>
            <Text style={[styles.emptyTitle, isDark && { color: '#F8FAFC' }]}>
              {activeTab === 'receive' ? 'No amounts to receive' : 'No payments due'}
            </Text>
            <Text style={[styles.emptyDesc, isDark && { color: '#94A3B8' }]}>
              {activeTab === 'receive'
                ? 'Track money others owe you — loans, dues, refunds'
                : 'Track what you need to pay — bills, dues, loans'}
            </Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openAdd(activeTab)}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.emptyAddBtnText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, activeTab === 'pay' && styles.fabPay, { bottom: insets.bottom + 20 }]}
        onPress={() => openAdd(activeTab)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Reminder Sheet */}
      <BottomSheetModal
        ref={sheetRef}
        index={1}
        enableDynamicSizing={false}
        keyboardBehavior={Platform.OS === 'ios' ? 'extend' : 'interactive'}
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
        )}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#475569' : '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}
      >
        <View style={{ flex: 1 }}>
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 160) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, isDark && { color: '#F8FAFC' }]}>{editingId ? 'Edit Reminder' : 'New Reminder'}</Text>
              <TouchableOpacity onPress={() => sheetRef.current?.dismiss()} style={[styles.modalCloseBtn, isDark && { backgroundColor: '#334155' }]}>
                <Feather name="x" size={20} color={isDark ? '#F8FAFC' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Type toggle */}
            {!editingId && (
              <View style={[styles.typeRow, isDark && { backgroundColor: '#0F172A' }]}>
                <TouchableOpacity
                  style={[styles.typeBtn, form.type === 'receive' && (isDark ? { backgroundColor: 'rgba(45,140,255,0.2)' } : styles.typeBtnReceive)]}
                  onPress={() => setForm(f => ({ ...f, type: 'receive' }))}
                >
                  <Feather name="arrow-down-circle" size={16} color={form.type === 'receive' ? '#2D8CFF' : '#9CA3AF'} />
                  <Text style={[styles.typeBtnText, form.type === 'receive' && styles.typeBtnTextReceive]}>To Receive</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, form.type === 'pay' && (isDark ? { backgroundColor: 'rgba(239,68,68,0.2)' } : styles.typeBtnPay)]}
                  onPress={() => setForm(f => ({ ...f, type: 'pay' }))}
                >
                  <Feather name="arrow-up-circle" size={16} color={form.type === 'pay' ? '#EF4444' : '#9CA3AF'} />
                  <Text style={[styles.typeBtnText, form.type === 'pay' && styles.typeBtnTextPay]}>To Pay</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isDark && { color: '#CBD5E1' }]}>Person / Contact</Text>
              <BottomSheetTextInput
                style={[styles.fieldInput, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.12)', color: '#F8FAFC' }]}
                placeholder="Name or @username"
                placeholderTextColor="#9CA3AF"
                value={form.person}
                onChangeText={v => setForm(f => ({ ...f, person: v }))}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isDark && { color: '#CBD5E1' }]}>Amount ({sym})</Text>
              <BottomSheetTextInput
                style={[styles.fieldInput, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.12)', color: '#F8FAFC' }]}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                value={form.amount}
                onChangeText={v => { if (/^\d*\.?\d{0,2}$/.test(v)) setForm(f => ({ ...f, amount: v })); }}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isDark && { color: '#CBD5E1' }]}>Note (optional)</Text>
              <BottomSheetTextInput
                style={[styles.fieldInput, { height: 72, textAlignVertical: 'top' }, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.12)', color: '#F8FAFC' }]}
                placeholder="What's this for?"
                placeholderTextColor="#9CA3AF"
                value={form.note}
                onChangeText={v => setForm(f => ({ ...f, note: v }))}
                multiline
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, isDark && { color: '#CBD5E1' }]}>Due Date & Time (optional)</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { flex: 1 }, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.12)' }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowDatePicker(true);
                  }}
                >
                  <Feather name="calendar" size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                  <Text style={[styles.datePickerText, form.dueDate && { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                    {form.dueDate
                      ? form.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Select Date'}
                  </Text>
                  {form.dueDate && (
                    <TouchableOpacity onPress={() => setForm(f => ({ ...f, dueDate: null }))}>
                      <Feather name="x" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePickerBtn, { flex: 1 }, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.12)' }]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowTimePicker(true);
                  }}
                >
                  <Feather name="clock" size={16} color={isDark ? '#94A3B8' : '#6B7280'} />
                  <Text style={[styles.datePickerText, form.dueDate && { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
                    {form.dueDate
                      ? form.dueDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                      : 'Add Time'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, form.type === 'pay' && styles.saveBtnPay, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{editingId ? 'Update Reminder' : 'Add Reminder'}</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>
        </View>
      </BottomSheetModal>

      {/* iOS Date & Time Picker Modal */}
      {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
          <View style={styles.pickerModalOverlay}>
            <View style={[styles.pickerModalBox, isDark && { backgroundColor: '#1E293B' }]}>
              <View style={[styles.pickerHeader, isDark && { borderBottomColor: '#334155' }]}>
                <Text style={[styles.pickerTitle, isDark && { color: '#F8FAFC' }]}>{showDatePicker ? 'Select Due Date' : 'Select Time'}</Text>
                <TouchableOpacity onPress={() => { setShowDatePicker(false); setShowTimePicker(false); }}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={form.dueDate || new Date()}
                mode={showDatePicker ? 'date' : 'time'}
                display={showDatePicker ? 'inline' : 'spinner'}
                minimumDate={showDatePicker ? new Date() : undefined}
                themeVariant={isDark ? "dark" : "light"}
                textColor={isDark ? "#F8FAFC" : "#232333"}
                accentColor="#2D8CFF"
                onChange={(e, val) => {
                  if (val) {
                    const current = form.dueDate ? new Date(form.dueDate) : new Date();
                    if (showDatePicker) {
                      val.setHours(current.getHours(), current.getMinutes(), 0, 0);
                    } else {
                      current.setHours(val.getHours(), val.getMinutes(), 0, 0);
                      val = current;
                    }
                    setForm(f => ({ ...f, dueDate: val }));
                  }
                }}
                style={{ width: '100%', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android Native Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={form.dueDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (e.type === 'set' && date) {
              const current = form.dueDate ? new Date(form.dueDate) : new Date();
              date.setHours(current.getHours(), current.getMinutes(), 0, 0);
              setForm(f => ({ ...f, dueDate: date }));
            }
          }}
        />
      )}

      {/* Android Native Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={form.dueDate || new Date()}
          mode="time"
          display="default"
          onChange={(e, time) => {
            setShowTimePicker(false);
            if (e.type === 'set' && time) {
              const current = form.dueDate ? new Date(form.dueDate) : new Date();
              current.setHours(time.getHours(), time.getMinutes(), 0, 0);
              setForm(f => ({ ...f, dueDate: current }));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F1F6',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#232333' },
  headerSub: { fontSize: 12, color: '#747487', marginTop: 1 },
  addBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 12 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F1F6', paddingHorizontal: 16,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2D8CFF' },
  tabActivePay: { borderBottomColor: '#EF4444' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#2D8CFF' },
  tabTextActivePay: { color: '#EF4444' },

  summaryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  summaryCardPay: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  summaryLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  summaryAmount: { fontSize: 22, fontWeight: '900', color: '#232333' },
  summaryRight: { alignItems: 'flex-end' },
  summaryCount: { fontSize: 13, fontWeight: '700', color: '#374151' },
  summaryPaid: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 4 },

  list: { padding: 16, gap: 12 },

  card: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardPaid: { opacity: 0.65, backgroundColor: '#F9FAFB' },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 16, fontWeight: '800', color: '#2D8CFF' },
  cardPerson: { fontSize: 15, fontWeight: '700', color: '#232333' },
  cardNote: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  dateOverdue: { color: '#EF4444', fontWeight: '700' },
  cardAmount: { fontSize: 16, fontWeight: '800', color: '#232333' },
  amountReceive: { color: '#2D8CFF' },
  amountPay: { color: '#EF4444' },
  textMuted: { color: '#9CA3AF' },
  paidBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  paidBadgeText: { fontSize: 11, fontWeight: '700', color: '#065F46' },
  markPaidBtn: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  markPaidBtnText: { fontSize: 11, fontWeight: '700', color: '#2D8CFF' },
  deleteBtn: { padding: 12, justifyContent: 'center' },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#232333', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2D8CFF', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyAddBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  fab: {
    position: 'absolute', right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2D8CFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2D8CFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  fabPay: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modalSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalDragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },

  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  pickerModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#232333' },
  pickerDoneText: { fontSize: 16, fontWeight: '700', color: '#2D8CFF' },

  modalTitle: { fontSize: 20, fontWeight: '800', color: '#232333' },

  typeRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 9,
  },
  typeBtnReceive: { backgroundColor: '#EFF6FF' },
  typeBtnPay: { backgroundColor: '#FEF2F2' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  typeBtnTextReceive: { color: '#2D8CFF' },
  typeBtnTextPay: { color: '#EF4444' },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },
  fieldInput: {
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 15, color: '#232333',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  datePickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  datePickerText: { flex: 1, fontSize: 15, color: '#9CA3AF' },

  saveBtn: {
    backgroundColor: '#2D8CFF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  saveBtnPay: { backgroundColor: '#EF4444' },
  saveBtnDisabled: { backgroundColor: '#D1D5DB' },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
