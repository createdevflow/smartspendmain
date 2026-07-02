import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
  RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../utils/api';

const TABS = ['Scheduled Emails', 'Scheduled Messages'];
const STATUS_META = {
  PENDING:   { color: '#D97706', icon: 'clock',     bg: '#FEF3C7' },
  SENT:      { color: '#059669', icon: 'check-circle', bg: '#ECFDF5' },
  FAILED:    { color: '#DC2626', icon: 'x-circle',  bg: '#FEF2F2' },
  PAUSED:    { color: '#6B7280', icon: 'pause',     bg: '#F3F4F6' },
  CANCELLED: { color: '#9CA3AF', icon: 'slash',     bg: '#F9FAFB' },
};

const REPEAT_OPTIONS = ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const EMAIL_TYPES = ['custom', 'receipt', 'invoice', 'report', 'export', 'statement'];

function formatDt(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CommunicationScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [emails, setEmails] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Email form state
  const [eForm, setEForm] = useState({
    recipients: '',
    subject: '',
    body: '',
    emailType: 'custom',
    scheduledAt: new Date(Date.now() + 3600000),
    repeat: 'ONE_TIME',
    showDatePicker: false,
  });

  useEffect(() => { load(); }, [activeTab]);

  const load = async () => {
    try {
      if (activeTab === 0) {
        const res = await api.get('/communication/emails');
        setEmails(res.data?.items || res.data?.data?.items || []);
      } else {
        const res = await api.get('/communication/messages');
        setMessages(res.data?.data || res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  // Email actions
  const pauseEmail = async (id) => {
    try { await api.post(`/communication/emails/${id}/pause`); load(); }
    catch { Alert.alert('Error', 'Failed to pause'); }
  };
  const resumeEmail = async (id) => {
    try { await api.post(`/communication/emails/${id}/resume`); load(); }
    catch { Alert.alert('Error', 'Failed to resume'); }
  };
  const cancelEmail = async (id) => {
    Alert.alert('Cancel', 'Cancel this scheduled email?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: async () => {
        try { await api.delete(`/communication/emails/${id}`); load(); }
        catch { Alert.alert('Error', 'Failed to cancel'); }
      }},
    ]);
  };
  const duplicateEmail = async (id) => {
    try { await api.post(`/communication/emails/${id}/duplicate`); load(); Alert.alert('Success', 'Email duplicated!'); }
    catch { Alert.alert('Error', 'Failed to duplicate'); }
  };

  const cancelMsg = async (id) => {
    Alert.alert('Cancel', 'Cancel this scheduled message?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        try { await api.delete(`/communication/messages/${id}`); load(); }
        catch { Alert.alert('Error', 'Failed to cancel'); }
      }},
    ]);
  };

  const scheduleEmail = async () => {
    const recipients = eForm.recipients.split(',').map((s) => s.trim()).filter(Boolean);
    if (!recipients.length || !eForm.subject || !eForm.body) {
      Alert.alert('Error', 'Please fill in recipients, subject, and message body.');
      return;
    }
    try {
      await api.post('/communication/emails/schedule', {
        recipients,
        subject: eForm.subject,
        body: eForm.body,
        emailType: eForm.emailType,
        scheduledAt: eForm.scheduledAt.toISOString(),
        repeat: eForm.repeat,
      });
      setShowEmailModal(false);
      setEForm({ recipients: '', subject: '', body: '', emailType: 'custom', scheduledAt: new Date(Date.now() + 3600000), repeat: 'ONE_TIME', showDatePicker: false });
      load();
      Alert.alert('Success', 'Email scheduled successfully!');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to schedule email');
    }
  };

  const renderEmailItem = ({ item }) => {
    const meta = STATUS_META[item.status] || STATUS_META['PENDING'];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={11} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{item.status}</Text>
          </View>
          <View style={[styles.typeBadge]}>
            <Text style={styles.typeBadgeText}>{item.emailType?.toUpperCase() || 'CUSTOM'}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>✉️ {item.subject}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>To: {item.recipients?.join(', ')}</Text>
        <View style={styles.cardMeta}>
          <Feather name="clock" size={12} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>{item.nextRunAt ? formatDt(item.nextRunAt) : 'Sent'}</Text>
          {item.repeat !== 'ONE_TIME' && (
            <><Feather name="repeat" size={12} color="#9CA3AF" style={{ marginLeft: 8 }} />
            <Text style={styles.cardMetaText}>{item.repeat}</Text></>
          )}
          {item.sentCount > 0 && (
            <Text style={{ marginLeft: 8, fontSize: 11, color: '#059669', fontWeight: '600' }}>✓ {item.sentCount} sent</Text>
          )}
        </View>
        <View style={styles.cardActions}>
          {item.status === 'PENDING' && (
            <TouchableOpacity style={styles.actionChip} onPress={() => pauseEmail(item.id)}>
              <Feather name="pause" size={12} color="#6B7280" />
              <Text style={styles.actionChipText}>Pause</Text>
            </TouchableOpacity>
          )}
          {item.status === 'PAUSED' && (
            <TouchableOpacity style={[styles.actionChip, { backgroundColor: '#ECFDF5' }]} onPress={() => resumeEmail(item.id)}>
              <Feather name="play" size={12} color="#059669" />
              <Text style={[styles.actionChipText, { color: '#059669' }]}>Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionChip} onPress={() => duplicateEmail(item.id)}>
            <Feather name="copy" size={12} color="#2563EB" />
            <Text style={[styles.actionChipText, { color: '#2563EB' }]}>Duplicate</Text>
          </TouchableOpacity>
          {item.status !== 'SENT' && item.status !== 'CANCELLED' && (
            <TouchableOpacity style={[styles.actionChip, { backgroundColor: '#FEF2F2' }]} onPress={() => cancelEmail(item.id)}>
              <Feather name="x" size={12} color="#DC2626" />
              <Text style={[styles.actionChipText, { color: '#DC2626' }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderMessageItem = ({ item }) => {
    const meta = STATUS_META[item.status] || STATUS_META['PENDING'];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={11} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{item.status}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.messageType}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>💬 {item.content}</Text>
        <View style={styles.cardMeta}>
          <Feather name="clock" size={12} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>{item.nextRunAt ? formatDt(item.nextRunAt) : 'Sent'}</Text>
          {item.repeat !== 'ONE_TIME' && (
            <><Feather name="repeat" size={12} color="#9CA3AF" style={{ marginLeft: 8 }} />
            <Text style={styles.cardMetaText}>{item.repeat}</Text></>
          )}
        </View>
        {item.status !== 'SENT' && item.status !== 'CANCELLED' && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.actionChip, { backgroundColor: '#FEF2F2' }]} onPress={() => cancelMsg(item.id)}>
              <Feather name="x" size={12} color="#DC2626" />
              <Text style={[styles.actionChipText, { color: '#DC2626' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={22} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scheduled Items</Text>
        {activeTab === 0 && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowEmailModal(true)}>
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => { setActiveTab(i); setLoading(true); }}>
            <Feather name={i === 0 ? 'mail' : 'message-circle'} size={14} color={activeTab === i ? '#1E3A8A' : '#9CA3AF'} />
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#1E3A8A" /></View>
      ) : (
        <FlatList
          data={activeTab === 0 ? emails : messages}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 0 ? renderEmailItem : renderMessageItem}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A8A" />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name={activeTab === 0 ? 'mail' : 'message-circle'} size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No scheduled {activeTab === 0 ? 'emails' : 'messages'}</Text>
              {activeTab === 0 && (
                <TouchableOpacity style={[styles.addBtn, { marginTop: 12, width: 'auto', paddingHorizontal: 16, height: 36, borderRadius: 10 }]}
                  onPress={() => setShowEmailModal(true)}>
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 4 }}>Schedule Email</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Schedule Email Modal */}
      <Modal visible={showEmailModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEmailModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F0F4FF' }} edges={['top']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Email</Text>
            <TouchableOpacity onPress={() => setShowEmailModal(false)}>
              <Feather name="x" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {EMAIL_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeChip, eForm.emailType === t && styles.typeChipActive]}
                    onPress={() => setEForm((f) => ({ ...f, emailType: t }))}>
                    <Text style={[styles.typeChipText, eForm.emailType === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Recipients *</Text>
              <TextInput style={styles.input} value={eForm.recipients} onChangeText={(v) => setEForm((f) => ({ ...f, recipients: v }))} placeholder="email@example.com, another@email.com" keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.hint}>Separate multiple emails with commas</Text>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput style={styles.input} value={eForm.subject} onChangeText={(v) => setEForm((f) => ({ ...f, subject: v }))} placeholder="Your Email Subject" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message Body *</Text>
              <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={eForm.body} onChangeText={(v) => setEForm((f) => ({ ...f, body: v }))} placeholder="Write your email content here…" multiline />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Send Date & Time</Text>
              <TouchableOpacity style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setEForm((f) => ({ ...f, showDatePicker: !f.showDatePicker }))}>
                <Text>{eForm.scheduledAt.toLocaleString('en-IN')}</Text>
                <Feather name="calendar" size={16} color="#6B7280" />
              </TouchableOpacity>
              {eForm.showDatePicker && (
                <DateTimePicker value={eForm.scheduledAt} mode="datetime" display="default"
                  onChange={(_, d) => setEForm((f) => ({ ...f, scheduledAt: d || f.scheduledAt, showDatePicker: Platform.OS === 'ios' }))} />
              )}
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Repeat</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {REPEAT_OPTIONS.map((r) => (
                  <TouchableOpacity key={r} style={[styles.typeChip, eForm.repeat === r && styles.typeChipActive]}
                    onPress={() => setEForm((f) => ({ ...f, repeat: r }))}>
                    <Text style={[styles.typeChipText, eForm.repeat === r && { color: '#fff' }]}>{r.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.submitBtn} onPress={scheduleEmail}>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Schedule Email</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#111827' },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1E3A8A' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1E3A8A' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F3F4F6' },
  typeBadgeText: { fontSize: 10, fontWeight: '700', color: '#374151', textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardSub: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  cardMetaText: { fontSize: 12, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  actionChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  formGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#111827' },
  hint: { fontSize: 11, color: '#9CA3AF' },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  typeChipActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  typeChipText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1E3A8A', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
