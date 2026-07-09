// components/SchedulerModal.js — Reusable Invoice/Receipt/Message Scheduler
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert, KeyboardAvoidingView, Pressable, Switch
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../utils/api';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';

const REPEAT_OPTIONS = [
  { key: 'ONE_TIME', label: 'One Time', icon: 'send' },
  { key: 'DAILY',    label: 'Daily',    icon: 'repeat' },
  { key: 'WEEKLY',   label: 'Weekly',   icon: 'calendar' },
  { key: 'MONTHLY',  label: 'Monthly',  icon: 'calendar' },
];

/**
 * SchedulerModal — schedule an invoice/receipt as email or chat message.
 *
 * Props:
 *  visible       - boolean
 *  onClose       - () => void
 *  transaction   - transaction object (for receipt context)
 *  conversations - array of { id, name } for chat scheduling
 *  defaultType   - 'email' | 'message'  (optional)
 */
export default function SchedulerModal({ visible, onClose, transaction, defaultType = 'email' }) {
  const { activeBook } = useBooks();
  const { refreshTransactions } = useTransactions();
  const [fetchedConversations, setFetchedConversations] = useState([]);
  const [type, setType] = useState(defaultType); // 'email' or 'message'
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedConvId, setSelectedConvId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('ONE_TIME');
  const [loading, setLoading] = useState(false);

  // Reset to +1 hour when modal becomes visible
  useEffect(() => {
    if (visible) {
      const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
      setScheduledDate(d);
    }
  }, [visible]);

  // Auto-fill subject/body when transaction changes
  useEffect(() => {
    if (!transaction) return;
    const amount = parseFloat(transaction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const sym = activeBook?.currency === 'INR' ? '₹' : '';
    const txType = transaction.type === 'INCOME' ? 'Receipt' : 'Invoice';
    const note = transaction.note || transaction.merchant || transaction.category?.name || 'Transaction';
    setSubject(`Cashtro ${txType}: ${note}`);
    setBody(
      `Hi,\n\nPlease find the ${txType.toLowerCase()} details below:\n\n` +
      `Amount: ${sym}${amount}\n` +
      `Type: ${transaction.type === 'INCOME' ? 'Income' : 'Expense'}\n` +
      `Note: ${note}\n` +
      `Date: ${new Date(transaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
      (transaction.cashbookName ? `Cashbook: ${transaction.cashbookName}\n` : '') +
      `\nSent via Cashtro — Your Smart Finance Manager`
    );
  }, [transaction, activeBook]);

  // Fetch conversations when modal opens
  useEffect(() => {
    if (visible) {
      api.get('/chat/conversations')
        .then(res => {
          const payload = res.data?.data || res.data;
          const list = payload?.items || payload || [];
          setFetchedConversations(Array.isArray(list) ? list : []);
        })
        .catch(() => {/* silently ignore if conversations unavailable */});

    }
  }, [visible]);

  const resetState = () => {
    setRecipients('');
    setSelectedConvId('');
    setRepeat('ONE_TIME');
    setLoading(false);
    const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0);
    setScheduledDate(d);
  };

  const handleClose = () => { resetState(); onClose(); };

  const handleSchedule = async () => {
    if (type === 'email') {
      const emailList = recipients.split(',').map(e => e.trim()).filter(Boolean);
      if (!emailList.length) return Alert.alert('Error', 'Please enter at least one recipient email.');
      if (!subject.trim()) return Alert.alert('Error', 'Please enter a subject.');
      setLoading(true);
      try {
        await api.post('/communication/emails/schedule', {
          recipients: emailList,
          subject: subject.trim(),
          body: body.trim(),
          emailType: 'invoice',
          scheduledAt: scheduledDate.toISOString(),
          repeat,
          metadata: transaction ? { transactionId: transaction.id } : undefined,
        });
        Alert.alert('Scheduled!', `Email scheduled for ${scheduledDate.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
        refreshTransactions?.();
        handleClose();
      } catch (e) {
        Alert.alert('Error', e.response?.data?.message || 'Failed to schedule email.');
      } finally {
        setLoading(false);
      }
    } else {
      // Message
      if (!selectedConvId) return Alert.alert('Error', 'Please select a conversation.');
      if (!body.trim()) return Alert.alert('Error', 'Please enter a message.');
      setLoading(true);
      try {
        await api.post('/communication/messages/schedule', {
          conversationId: selectedConvId,
          content: body.trim(),
          messageType: transaction ? 'TRANSACTION' : 'TEXT',
          scheduledAt: scheduledDate.toISOString(),
          repeat,
          attachmentData: transaction ? {
            transactionId: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            currency: transaction.currency || 'INR',
            category: transaction.category || '',
            date: transaction.date,
            notes: transaction.notes || transaction.encNotes || '',
            cashbookName: activeBook?.name || ''
          } : undefined,
        });
        Alert.alert('Scheduled!', 'Message scheduled successfully.');
        refreshTransactions?.();
        handleClose();
      } catch (e) {
        Alert.alert('Error', e.response?.data?.message || 'Failed to schedule message.');
      } finally {
        setLoading(false);
      }
    }
  };

  const onDateChange = (event, selected) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const next = new Date(scheduledDate);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setScheduledDate(next);
  };

  const onTimeChange = (event, selected) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !selected) return;
    const next = new Date(scheduledDate);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setScheduledDate(next);
  };

  const formatDateTime = (d) =>
    d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.drag} />
            <View style={styles.headerRow}>
              <View style={styles.headerIcon}>
                <Feather name="clock" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Schedule Invoice</Text>
                <Text style={styles.headerSub}>Send receipt or invoice later</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Type Toggle */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'email' && styles.typeBtnActive]}
                onPress={() => setType('email')}
              >
                <Feather name="mail" size={16} color={type === 'email' ? '#2563EB' : '#6B7280'} />
                <Text style={[styles.typeBtnText, type === 'email' && styles.typeBtnTextActive]}>Via Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'message' && styles.typeBtnActive]}
                onPress={() => setType('message')}
                disabled={fetchedConversations.length === 0}
              >
                <Feather name="message-circle" size={16} color={type === 'message' ? '#2563EB' : fetchedConversations.length === 0 ? '#D1D5DB' : '#6B7280'} />
                <Text style={[styles.typeBtnText, type === 'message' && styles.typeBtnTextActive, fetchedConversations.length === 0 && styles.typeBtnTextDisabled]}>
                  Via Chat{fetchedConversations.length === 0 ? ' (No chats)' : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email fields */}
            {type === 'email' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Recipients</Text>
                  <TextInput
                    style={styles.input}
                    value={recipients}
                    onChangeText={setRecipients}
                    placeholder="email@example.com, email2@example.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={styles.hint}>Separate multiple emails with commas</Text>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Email subject"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </>
            )}

            {/* Chat fields */}
            {type === 'message' && fetchedConversations.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Select Conversation</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {fetchedConversations.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.convChip, selectedConvId === c.id && styles.convChipActive]}
                      onPress={() => setSelectedConvId(c.id)}
                    >
                      <Text style={[styles.convChipText, selectedConvId === c.id && styles.convChipTextActive]}>
                        {c.name || c.title || 'Chat'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Message / Body */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{type === 'email' ? 'Message Body' : 'Message'}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={body}
                onChangeText={setBody}
                placeholder="Enter your message..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            {/* Schedule Date/Time */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Schedule Date & Time</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                  <Feather name="calendar" size={15} color="#2563EB" />
                  <Text style={styles.dateBtnText}>
                    {scheduledDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
                  <Feather name="clock" size={15} color="#2563EB" />
                  <Text style={styles.dateBtnText}>
                    {scheduledDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DatePickers — inline on iOS */}
            {showDatePicker && Platform.OS === 'ios' && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="inline"
                onChange={onDateChange}
                minimumDate={new Date()}
                style={{ marginBottom: 8 }}
              />
            )}
            {showTimePicker && Platform.OS === 'ios' && (
              <DateTimePicker
                value={scheduledDate}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                style={{ marginBottom: 8 }}
              />
            )}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker value={scheduledDate} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
            )}
            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker value={scheduledDate} mode="time" display="default" onChange={onTimeChange} />
            )}

            {/* Repeat */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Repeat</Text>
              <View style={styles.repeatRow}>
                {REPEAT_OPTIONS.map(r => (
                  <TouchableOpacity
                    key={r.key}
                    style={[styles.repeatChip, repeat === r.key && styles.repeatChipActive]}
                    onPress={() => setRepeat(r.key)}
                  >
                    <Text style={[styles.repeatChipText, repeat === r.key && styles.repeatChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Summary */}
            <View style={styles.summary}>
              <Feather name="info" size={14} color="#2563EB" />
              <Text style={styles.summaryText}>
                {repeat === 'ONE_TIME' ? 'Will be sent once on ' : `Will repeat ${repeat.toLowerCase()} starting `}
                {formatDateTime(scheduledDate)}
              </Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* CTA */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scheduleBtn, loading && { opacity: 0.6 }]}
              onPress={handleSchedule}
              disabled={loading}
            >
              <Feather name="clock" size={16} color="#fff" />
              <Text style={styles.scheduleBtnText}>{loading ? 'Scheduling...' : 'Schedule'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drag: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  typeRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  typeBtnActive: {
    backgroundColor: '#EFF6FF', borderColor: '#2563EB',
  },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: '#2563EB' },
  typeBtnTextDisabled: { color: '#D1D5DB' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB',
  },
  textArea: { height: 120 },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  dateTimeRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#DBEAFE', borderRadius: 10,
    padding: 12, backgroundColor: '#EFF6FF',
  },
  dateBtnText: { fontSize: 13, fontWeight: '600', color: '#1D4ED8' },
  repeatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  repeatChipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  repeatChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  repeatChipTextActive: { color: '#1D4ED8' },
  summary: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12,
  },
  summaryText: { flex: 1, fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
  convChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB', marginRight: 8,
  },
  convChipActive: { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
  convChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  convChipTextActive: { color: '#1D4ED8' },
  footer: {
    flexDirection: 'row', gap: 12, padding: 20,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
  scheduleBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, backgroundColor: '#2563EB',
  },
  scheduleBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
