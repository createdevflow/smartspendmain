// components/BusinessCategorySetupModal.js
// Fully rewritten: uses BottomSheetModal for keyboard support + saves to backend API
import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { useTransactions } from '../context/TransactionsContext';
import { useAppTheme } from '../context/ThemeContext';

const EMOJI_OPTIONS = ['📁', '🏷️', '💡', '🎯', '🔧', '📦', '🏢', '💼', '🧾', '🎪', '🌿', '⚙️'];
const COLOR_OPTIONS = ['#2563EB', '#059669', '#DC2626', '#D97706', '#F26D21', '#DB2777', '#0891B2', '#374151'];

const BusinessCategorySetupModal = forwardRef(({ onClose, autoShow = true }, ref) => {
  const insets = useSafeAreaInsets();
  const internalRef = useRef(null);
  const bottomSheetRef = ref || internalRef;
  const snapPoints = useMemo(() => ['60%', '92%'], []);
  const { useCustomCategories, setUseCustomCategories, refreshCategories } = useTransactions();
  const { isDark } = useAppTheme();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New category form state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📁');
  const [newColor, setNewColor] = useState('#2563EB');
  const [newType, setNewType] = useState('expense');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (autoShow) {
      import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
        AsyncStorage.getItem('hasSeenBusinessSetup').then(hasSeen => {
          if (!hasSeen) bottomSheetRef.current?.present();
        });
      });
    }
  }, [autoShow, bottomSheetRef]);

  const handleSheetChanges = useCallback((index) => {
    if (index >= 0) {
      loadCategories();
    } else if (index === -1) {
      onClose?.();
      setNewName('');
      setShowEmojiPicker(false);
    }
  }, [onClose]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data?.success) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.warn('Load categories error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim() || saving) return;
    try {
      setSaving(true);
      const res = await api.post('/categories', {
        name: newName.trim(),
        emoji: newEmoji,
        color: newColor,
        type: newType,
      });
      if (res.data?.success) {
        setNewName('');
        setShowEmojiPicker(false);
        await loadCategories();
        if (refreshCategories) refreshCategories();
      }
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not add category';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (cat) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Transactions using this category won't be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/categories/${cat.id}`);
              if (res.data?.success) {
                setCategories(prev => prev.filter(c => c.id !== cat.id));
                if (refreshCategories) refreshCategories();
              }
            } catch (e) {
              Alert.alert('Error', e.response?.data?.error || 'Could not delete category');
            }
          },
        },
      ]
    );
  };

  const handleDone = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      )}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#475569' : '#D1D5DB', width: 40, height: 4 }}
      backgroundStyle={{ borderRadius: 24, backgroundColor: isDark ? '#1E293B' : '#fff' }}
    >
      <BottomSheetView style={[s.container, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={[s.iconBox, isDark && { backgroundColor: 'rgba(29, 78, 216, 0.25)' }]}>
            <Feather name="grid" size={22} color={isDark ? '#60A5FA' : '#1D4ED8'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, isDark && { color: '#F8FAFC' }]}>Custom Categories</Text>
            <Text style={[s.subtitle, isDark && { color: '#94A3B8' }]}>Add your own expense & income tags</Text>
          </View>
          <TouchableOpacity onPress={handleDone} style={s.doneBtn}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Global Toggle */}
        <View style={[s.toggleCard, isDark && { backgroundColor: 'rgba(37, 99, 235, 0.15)', borderColor: 'rgba(37, 99, 235, 0.3)' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.toggleTitle, isDark && { color: '#60A5FA' }]}>Use Custom Categories</Text>
            <Text style={[s.toggleSubtitle, isDark && { color: '#93C5FD' }]}>Override defaults with your own lists</Text>
          </View>
          <TouchableOpacity
            style={[s.switchBase, useCustomCategories && s.switchActive]}
            onPress={() => setUseCustomCategories(!useCustomCategories)}
          >
            <View style={[s.switchThumb, useCustomCategories && s.switchThumbActive]} />
          </TouchableOpacity>
        </View>

        {!useCustomCategories ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
            <Feather name="layers" size={48} color={isDark ? '#64748B' : '#94A3B8'} style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#E2E8F0' : '#475569' }}>Predefined Categories Active</Text>
            <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
              Turn on custom categories above to build your own personal income and expense categories.
            </Text>
          </View>
        ) : (
          <>
            {/* Add Category Form */}
            <View style={[s.formCard, isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[s.formLabel, isDark && { color: '#94A3B8' }]}>Add New Category</Text>

              {/* Type toggle */}
              <View style={s.typeRow}>
                {['expense', 'income', 'both'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.typeBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }, newType === t && s.typeBtnActive]}
                    onPress={() => setNewType(t)}
                  >
                    <Text style={[s.typeBtnText, isDark && { color: '#CBD5E1' }, newType === t && s.typeBtnTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Name input row */}
              <View style={s.inputRow}>
                {/* Emoji picker trigger */}
                <TouchableOpacity
                  style={[s.emojiBtn, { backgroundColor: newColor + '20', borderColor: newColor }]}
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Text style={{ fontSize: 22 }}>{newEmoji}</Text>
                </TouchableOpacity>

                {/* Name input — BottomSheetTextInput for keyboard avoidance */}
                <BottomSheetTextInput
                  style={[s.nameInput, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.15)', color: '#F8FAFC' }]}
                  placeholder="Category name..."
                  placeholderTextColor="#9CA3AF"
                  value={newName}
                  onChangeText={setNewName}
                  onSubmitEditing={handleAdd}
                  returnKeyType="done"
                  maxLength={50}
                />

                <TouchableOpacity
                  style={[s.addBtn, { backgroundColor: newColor }, (!newName.trim() || saving) && s.addBtnDisabled]}
                  onPress={handleAdd}
                  disabled={!newName.trim() || saving}
                >
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="plus" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>

              {/* Emoji picker */}
              {showEmojiPicker && (
                <View style={s.emojiGrid}>
                  {EMOJI_OPTIONS.map(e => (
                    <TouchableOpacity
                      key={e}
                      style={[s.emojiOption, isDark && { backgroundColor: '#1E293B' }, newEmoji === e && s.emojiOptionSelected]}
                      onPress={() => { setNewEmoji(e); setShowEmojiPicker(false); }}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Color picker */}
              <View style={s.colorRow}>
                <Text style={[s.colorLabel, isDark && { color: '#CBD5E1' }]}>Color:</Text>
                {COLOR_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[s.colorDot, { backgroundColor: c }, newColor === c && [s.colorDotSelected, isDark && { borderColor: '#F8FAFC' }]]}
                    onPress={() => setNewColor(c)}
                  />
                ))}
              </View>
            </View>

            {/* Category list */}
            {loading ? (
              <View style={s.center}>
                <ActivityIndicator color="#2D8CFF" />
                <Text style={[s.loadingText, isDark && { color: '#94A3B8' }]}>Loading your categories...</Text>
              </View>
            ) : (
              <BottomSheetScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {categories.length === 0 ? (
                  <View style={s.center}>
                    <Feather name="tag" size={40} color={isDark ? '#334155' : '#E5E7EB'} style={{ marginBottom: 12 }} />
                    <Text style={[s.emptyText, isDark && { color: '#CBD5E1' }]}>No custom categories yet</Text>
                    <Text style={[s.emptySubText, isDark && { color: '#64748B' }]}>Add your first one above</Text>
                  </View>
                ) : (
                  <>
                    <Text style={[s.listLabel, isDark && { color: '#94A3B8' }]}>Your Categories ({categories.length})</Text>
                    {categories.map(cat => (
                      <View key={cat.id} style={[s.catRow, isDark && { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
                        <View style={[s.catEmoji, { backgroundColor: (cat.color || '#2D8CFF') + '20' }]}>
                          <Text style={{ fontSize: 18 }}>{cat.emoji || '📁'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.catName, isDark && { color: '#F8FAFC' }]}>{cat.name}</Text>
                          <Text style={[s.catType, isDark && { color: '#94A3B8' }]}>{cat.type}</Text>
                        </View>
                        <View style={[s.catColorDot, { backgroundColor: cat.color || '#2D8CFF' }]} />
                        <TouchableOpacity onPress={() => handleRemove(cat)} style={s.removeBtn}>
                          <Feather name="trash-2" size={15} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
                <View style={{ height: 32 }} />
              </BottomSheetScrollView>
            )}
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 2,
  },
  switchBase: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    padding: 2,
  },
  switchActive: {
    backgroundColor: '#2563EB',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  doneBtn: {
    backgroundColor: '#1D4ED8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  formCard: {
    backgroundColor: '#F9FAFB', borderRadius: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
    padding: 16, marginBottom: 16,
  },
  formLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  typeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  typeBtnActive: { borderColor: '#1D4ED8', backgroundColor: '#EFF6FF' },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  typeBtnTextActive: { color: '#1D4ED8' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12,
  },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  nameInput: {
    flex: 1, height: 48, borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: '#111827',
    backgroundColor: '#fff',
  },
  addBtn: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },

  emojiGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
  },
  emojiOption: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  emojiOptionSelected: { backgroundColor: '#DBEAFE', borderWidth: 2, borderColor: '#1D4ED8' },

  colorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  colorLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 3, borderColor: '#111827' },

  listLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 4,
  },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  catEmoji: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  catName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  catType: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  catColorDot: { width: 10, height: 10, borderRadius: 5 },
  removeBtn: { padding: 8 },

  center: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { color: '#6B7280', marginTop: 12, fontSize: 14 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubText: { fontSize: 14, color: '#9CA3AF' },
});

export default BusinessCategorySetupModal;
