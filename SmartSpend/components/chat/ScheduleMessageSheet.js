// components/chat/ScheduleMessageSheet.js
// Schedule message bottom sheet — fully responsive with sticky CTA
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, Platform, Alert, KeyboardAvoidingView, Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const REPEAT_OPTIONS = [
  { label: 'Once', value: 'ONCE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
];

const QUICK_OPTIONS = [
  { label: 'In 30 Minutes', icon: 'clock', offsetMs: 30 * 60000 },
  { label: 'In 1 Hour', icon: 'clock', offsetMs: 60 * 60000 },
  { label: 'In 3 Hours', icon: 'clock', offsetMs: 3 * 60 * 60000 },
  { label: 'Tonight at 8 PM', icon: 'moon', getDate: () => { const d = new Date(); d.setHours(20, 0, 0, 0); if (d <= new Date()) d.setDate(d.getDate() + 1); return d; } },
  { label: 'Tomorrow Morning', icon: 'sunrise', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
  { label: 'Next Week', icon: 'calendar', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d; } },
];

function formatDate(d) {
  if (!d) return '';
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function ScheduleMessageSheet({
  visible,
  onClose,
  onSchedule,
  messageText,
}) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'custom'
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] = useState('ONCE');

  const confirmAndSchedule = useCallback((scheduledAt, repeatType = 'ONCE', label = '') => {
    Alert.alert(
      '⏰ Schedule Message',
      `Send "${(messageText || '').slice(0, 60)}${(messageText || '').length > 60 ? '…' : ''}" on\n${formatDate(scheduledAt)}?\nRepeat: ${repeatType}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Schedule ✓', onPress: () => {
            onSchedule({ scheduledAt, repeatType });
            onClose();
          },
        },
      ],
    );
  }, [messageText, onSchedule, onClose]);

  const handleQuickPick = useCallback((opt) => {
    const scheduledAt = opt.offsetMs
      ? new Date(Date.now() + opt.offsetMs)
      : opt.getDate();
    confirmAndSchedule(scheduledAt, 'ONCE', opt.label);
  }, [confirmAndSchedule]);

  const handleCustomSchedule = useCallback(() => {
    if (date <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future date and time.');
      return;
    }
    confirmAndSchedule(date, repeat);
  }, [date, repeat, confirmAndSchedule]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={sq.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={sq.sheet}>
          {/* Handle */}
          <View style={sq.handle} />

          {/* Header */}
          <View style={sq.header}>
            <Text style={sq.title}>⏰ Schedule Message</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Message Preview */}
          {!!messageText && (
            <View style={sq.preview}>
              <Text style={sq.previewLabel}>MESSAGE</Text>
              <Text style={sq.previewText} numberOfLines={2}>{messageText}</Text>
            </View>
          )}

          {/* Mode Toggle */}
          <View style={sq.toggle}>
            <TouchableOpacity
              style={[sq.toggleBtn, mode === 'quick' && sq.toggleActive]}
              onPress={() => setMode('quick')}
            >
              <Feather name="zap" size={14} color={mode === 'quick' ? '#1D4ED8' : '#6B7280'} />
              <Text style={[sq.toggleText, mode === 'quick' && sq.toggleTextActive]}>Quick</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sq.toggleBtn, mode === 'custom' && sq.toggleActive]}
              onPress={() => setMode('custom')}
            >
              <Feather name="sliders" size={14} color={mode === 'custom' ? '#1D4ED8' : '#6B7280'} />
              <Text style={[sq.toggleText, mode === 'custom' && sq.toggleTextActive]}>Custom</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={sq.scroll}
            contentContainerStyle={sq.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === 'quick' ? (
              <View>
                {QUICK_OPTIONS.map((opt) => {
                  const previewDate = opt.offsetMs
                    ? new Date(Date.now() + opt.offsetMs)
                    : opt.getDate();
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      style={sq.quickItem}
                      onPress={() => handleQuickPick(opt)}
                      activeOpacity={0.7}
                    >
                      <View style={sq.quickIcon}>
                        <Feather name={opt.icon} size={18} color="#1D4ED8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={sq.quickLabel}>{opt.label}</Text>
                        <Text style={sq.quickSub}>{formatDate(previewDate)}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#D1D5DB" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={sq.customWrap}>
                {/* Date Row */}
                <Text style={sq.fieldLabel}>Date</Text>
                <TouchableOpacity
                  style={sq.field}
                  onPress={() => { setShowDatePicker(true); setShowTimePicker(false); }}
                >
                  <Feather name="calendar" size={18} color="#6B7280" />
                  <Text style={sq.fieldText}>
                    {date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {/* Time Row */}
                <Text style={[sq.fieldLabel, { marginTop: 12 }]}>Time</Text>
                <TouchableOpacity
                  style={sq.field}
                  onPress={() => { setShowTimePicker(true); setShowDatePicker(false); }}
                >
                  <Feather name="clock" size={18} color="#6B7280" />
                  <Text style={sq.fieldText}>
                    {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Text>
                </TouchableOpacity>

                {/* Date Picker */}
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    minimumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selected) => {
                      if (Platform.OS !== 'ios') setShowDatePicker(false);
                      if (selected) {
                        const merged = new Date(selected);
                        merged.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setDate(merged);
                      }
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <TouchableOpacity style={sq.doneBtn} onPress={() => setShowDatePicker(false)}>
                    <Text style={sq.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                )}

                {/* Time Picker */}
                {showTimePicker && (
                  <DateTimePicker
                    value={date}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selected) => {
                      if (Platform.OS !== 'ios') setShowTimePicker(false);
                      if (selected) {
                        const merged = new Date(date);
                        merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                        setDate(merged);
                      }
                    }}
                  />
                )}
                {Platform.OS === 'ios' && showTimePicker && (
                  <TouchableOpacity style={sq.doneBtn} onPress={() => setShowTimePicker(false)}>
                    <Text style={sq.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                )}

                {/* Preview */}
                <View style={sq.datePreview}>
                  <Feather name="calendar" size={14} color="#1D4ED8" />
                  <Text style={sq.datePreviewText}>{formatDate(date)}</Text>
                </View>

                {/* Repeat */}
                <Text style={[sq.fieldLabel, { marginTop: 16 }]}>Repeat</Text>
                <View style={sq.chipRow}>
                  {REPEAT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[sq.chip, repeat === opt.value && sq.chipActive]}
                      onPress={() => setRepeat(opt.value)}
                    >
                      <Text style={[sq.chipText, repeat === opt.value && sq.chipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Sticky Schedule Button (only in custom mode) */}
          {mode === 'custom' && (
            <View style={sq.stickyBottom}>
              <TouchableOpacity style={sq.scheduleBtn} onPress={handleCustomSchedule} activeOpacity={0.85}>
                <Feather name="send" size={18} color="#fff" />
                <Text style={sq.scheduleBtnText}>Schedule Message</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sq = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '92%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#D1D5DB',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },

  preview: {
    backgroundColor: '#EFF6FF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#1D4ED8',
  },
  previewLabel: { fontSize: 10, fontWeight: '800', color: '#1D4ED8', letterSpacing: 0.8, marginBottom: 4 },
  previewText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  toggle: {
    flexDirection: 'row', marginHorizontal: 16, marginVertical: 12,
    backgroundColor: '#F3F4F6', borderRadius: 12, padding: 3, gap: 3,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  toggleActive: {
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#1D4ED8' },

  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },

  // Quick options
  quickItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, gap: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F9FAFB',
  },
  quickIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  quickSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Custom fields
  customWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  fieldText: { fontSize: 15, color: '#111827', fontWeight: '500', flex: 1 },

  doneBtn: {
    alignSelf: 'flex-end', marginTop: 6,
    backgroundColor: '#EEF2FF', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  doneBtnText: { color: '#1D4ED8', fontWeight: '700', fontSize: 14 },

  datePreview: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', borderRadius: 10,
    padding: 10, marginTop: 12,
  },
  datePreviewText: { color: '#1D4ED8', fontSize: 13, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: '#1D4ED8' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#1D4ED8' },

  // Sticky bottom
  stickyBottom: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 0.5, borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16,
  },
  scheduleBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
