// screens/BooksScreen.js — Premium redesign: hero card + horizontal carousel
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, Modal, Alert, Dimensions, Platform,
  KeyboardAvoidingView, Pressable, ActivityIndicator, Share, RefreshControl
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useBooks } from '../context/BooksContext';
import { useTransactions } from '../context/TransactionsContext';
import { getCurrencySymbol } from '../utils/planFeatures';
import { api } from '../utils/api';
import ContactsInviteModal from '../components/ContactsInviteModal';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';

const { width: SCREEN_W } = Dimensions.get('window');

const BOOK_COLORS = ['#1D4ED8', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Book Card ───────────────────────────────────────────────────────────────
function BookCard({ book, bal, isActive, onPress, onDelete, onMembers, privateMode, sym, showShared }) {
  return (
    <TouchableOpacity
      style={[styles.bookCard, isActive && styles.bookCardActive, { borderTopColor: book.color || '#1D4ED8' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardColorDot, { backgroundColor: book.color || '#1D4ED8' }]} />
            <Text style={styles.cardName}>{book.name}</Text>
            {showShared && book.isShared && (
              <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 }}>
                <Text style={{ fontSize: 10, color: '#4F46E5', fontWeight: '700' }}>SHARED</Text>
              </View>
            )}
          </View>
          {book.description ? (
            <Text style={styles.cardDesc}>{book.description}</Text>
          ) : (
            <Text style={styles.cardDescMuted}>Created {formatDate(book.createdAt)}</Text>
          )}
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBalanceRow}>
        <View>
          <Text style={styles.cardBalLabel}>Available balance</Text>
          <Text style={styles.cardBalance}>
            {privateMode ? '••••' : `${sym}${Math.abs(bal.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {showShared && (
            <TouchableOpacity style={styles.memberBtn} onPress={onMembers}>
              <Feather name="users" size={15} color="#4F46E5" />
            </TouchableOpacity>
          )}
          {book.memberRole === 'OWNER' && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Feather name="trash-2" size={16} color="#DC2626" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.cardStats}>
        <View style={styles.cardStatItem}>
          <View style={[styles.cardStatDot, { backgroundColor: '#DCFCE7' }]}>
            <Feather name="arrow-down-left" size={14} color="#16A34A" />
          </View>
          <View>
            <Text style={styles.cardStatLabel}>Cash In</Text>
            <Text style={[styles.cardStatVal, { color: '#16A34A' }]}>
              {privateMode ? '••••' : `+${sym}${bal.inTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </Text>
          </View>
        </View>
        <View style={styles.cardStatItem}>
          <View style={[styles.cardStatDot, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="arrow-up-right" size={14} color="#DC2626" />
          </View>
          <View>
            <Text style={styles.cardStatLabel}>Cash Out</Text>
            <Text style={[styles.cardStatVal, { color: '#DC2626' }]}>
              {privateMode ? '••••' : `−${sym}${bal.outTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BooksScreen() {
  const insets = useSafeAreaInsets();
  const { books, activeBookId, activeBook, setActiveBook, addBook, deleteBook, loadBooks } = useBooks();
  const { getBookBalance, privateMode } = useTransactions();
  const { hasAccess: isFeatureEnabled, getFeatureTease } = useFeatureAccess();

  const createModalRef = React.useRef(null);
  const membersModalRef = React.useRef(null);
  const snapPoints = React.useMemo(() => ['50%', '92%'], []);
  const [bookName, setBookName] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookColor, setBookColor] = useState(BOOK_COLORS[0]);

  const [contactsVisible, setContactsVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [members, setMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerSearchList, setDrawerSearchList] = useState([]);
  const [drawerSearchLoading, setDrawerSearchLoading] = useState(false);

  const handleInviteTextChange = async (txt) => {
    setInviteEmail(txt);
    if (txt.trim().length >= 2) {
      setDrawerSearchLoading(true);
      try {
        const res = await api.get('/chat/contacts/search', { params: { q: txt.trim() } });
        setDrawerSearchList(res.data?.data || res.data || []);
      } catch {
        setDrawerSearchList([]);
      } finally {
        setDrawerSearchLoading(false);
      }
    } else {
      setDrawerSearchList([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  }, [loadBooks]);

  const fetchMembers = useCallback(async (bookId) => {
    setMembersLoading(true);
    try {
      const res = await api.get(`/cashbooks/${bookId}/members`);
      const payload = res.data?.data || res.data;
      setMembers(payload);
    } catch (e) {
      console.error('[fetchMembers Error]', e);
      Alert.alert('Error', 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleOpenMembers = (book) => {
    setSelectedBook(book);
    fetchMembers(book.id);
    membersModalRef.current?.present();
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedBook) return;
    setInviteLoading(true);
    try {
      await api.post(`/cashbooks/${selectedBook.id}/members`, { email: inviteEmail.trim(), role: inviteRole });
      Alert.alert('Invite sent! ✉️', `Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      fetchMembers(selectedBook.id);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!selectedBook) return;
    setInviteLoading(true);
    try {
      const res = await api.post(`/cashbooks/${selectedBook.id}/members/link`);
      const link = res.data?.data?.link || res.data?.link;
      await Share.share({
        message: Platform.OS === 'android' 
          ? `I'd like you to join my cashbook "${selectedBook.name}" on Cashtro!\n\nClick to join: ${link}`
          : `I'd like you to join my cashbook "${selectedBook.name}" on Cashtro!`,
        url: link, // iOS will display this nicely as a tappable link
        title: `Join "${selectedBook.name}" on Cashtro`,
      });
    } catch (e) {
      console.error('[handleShareLink Error]', e?.response?.data || e);
      Alert.alert('Error', 'Failed to generate link');
    } finally {
      setInviteLoading(false);
    }
  };


  const handleRemoveMember = (memberId) => {
    Alert.alert('Remove member?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/cashbooks/${selectedBook.id}/members/${memberId}`);
            fetchMembers(selectedBook.id);
          } catch (e) {
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
  };

  const handleToggleRole = (member) => {
    if (selectedBook?.memberRole !== 'OWNER' || member.status !== 'accepted') return;
    const newRole = member.role === 'EDITOR' ? 'VIEWER' : 'EDITOR';
    
    Alert.alert('Change Role?', `Change ${member.email}'s role to ${newRole}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: async () => {
          try {
            await api.patch(`/cashbooks/${selectedBook.id}/members/${member.id}`, { role: newRole });
            fetchMembers(selectedBook.id);
          } catch (e) {
            Alert.alert('Error', 'Failed to change role');
          }
        }
      }
    ]);
  };

  const sortedBooks = useMemo(
    () => [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [books]
  );

  const handleCreate = async () => {
    if (!bookName.trim()) return;
    const newBook = await addBook({ name: bookName.trim(), description: bookDesc.trim(), color: bookColor });
    if (newBook) {
      await loadBooks();
      createModalRef.current?.dismiss();
      setBookName('');
      setBookDesc('');
      setBookColor(BOOK_COLORS[0]);
    } else {
      Alert.alert('Limit reached', 'You may have reached your plan limit for cashbooks.');
    }
  };

  const handleDelete = (book) => {
    Alert.alert(
      `Delete "${book.name}"?`,
      'This will permanently delete the cashbook and all its transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBook(book.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cashbooks</Text>
            <Text style={styles.subtitle}>{books.length} {books.length === 1 ? 'book' : 'books'}</Text>
          </View>
        </View>
        {books.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📒</Text>
            <Text style={styles.emptyTitle}>No cashbooks yet</Text>
            <Text style={styles.emptyText}>Create your first cashbook to start recording cash-in and out entries.</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => createModalRef.current?.present()}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.createBtnText}>Create Cashbook</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sortedBooks}
            keyExtractor={(b) => b.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            renderItem={({ item: book }) => {
              const bal = getBookBalance(book.id);
              const sym = getCurrencySymbol(book.currency);
              return (
                <BookCard
                  book={book}
                  bal={bal}
                  isActive={book.id === activeBookId}
                  onPress={() => setActiveBook(book.id)}
                  onDelete={() => handleDelete(book)}
                  onMembers={() => {
                    if (isFeatureEnabled('feature_shared_cashbooks_active')) {
                      handleOpenMembers(book);
                    } else {
                      Alert.alert('Pro Feature', 'Shared Cashbooks let you invite others to collaborate on your cashbook in real time. Upgrade to Pro to unlock this!', [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Upgrade to Pro' }]);
                    }
                  }}
                  privateMode={privateMode}
                  sym={sym}
                  showShared={isFeatureEnabled('feature_shared_cashbooks_active') || getFeatureTease('feature_shared_cashbooks_active')}
                />
              );
            }}
          />
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => createModalRef.current?.present()} activeOpacity={0.85}>
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Members Modal ── */}
      <BottomSheetModal
        ref={membersModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: '#fff' }}
      >
        <BottomSheetView style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={styles.modalTitle}>👥 Members</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedBook?.name}</Text>
            </View>
          </View>

          {membersLoading ? (
            <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
          ) : (
            <BottomSheetScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {members?.owner && (
                <View style={s2.memberRow}>
                  <View style={[s2.roleChip, { backgroundColor: '#FEF3C7' }]}><Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>OWNER</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s2.memberName}>{members.owner.fullName}</Text>
                    <Text style={s2.memberEmail}>{members.owner.email}</Text>
                  </View>
                </View>
              )}
              {members?.members?.map((m) => (
                <View key={m.id} style={s2.memberRow}>
                  <TouchableOpacity 
                    onPress={() => handleToggleRole(m)}
                    disabled={selectedBook?.memberRole !== 'OWNER' || m.status !== 'accepted'}
                  >
                    <View style={[s2.roleChip, { backgroundColor: m.status === 'accepted' ? '#EEF2FF' : '#F3F4F6' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: m.status === 'accepted' ? '#4F46E5' : '#9CA3AF' }}>
                        {m.status === 'accepted' ? m.role : 'PENDING'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={s2.memberName}>{m.user?.fullName || m.email}</Text>
                    <Text style={s2.memberEmail}>{m.email}</Text>
                  </View>
                  {selectedBook?.memberRole === 'OWNER' && (
                    <TouchableOpacity onPress={() => handleRemoveMember(m.id)} style={{ padding: 4 }}>
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </BottomSheetScrollView>
          )}

          {selectedBook?.memberRole === 'OWNER' && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.inputLabel}>Invite someone</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity onPress={handleShareLink} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="link" size={14} color="#4F46E5" />
                    <Text style={{ fontSize: 13, color: '#4F46E5', fontWeight: '600' }}>Share Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                {['VIEWER', 'EDITOR'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[s2.roleBtn, inviteRole === r && s2.roleBtnActive]}
                    onPress={() => setInviteRole(r)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: inviteRole === r ? '#4F46E5' : '#6B7280' }}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <BottomSheetTextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={inviteEmail}
                  onChangeText={handleInviteTextChange}
                  placeholder="Search user or enter email..."
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.createBtn, { paddingHorizontal: 16, marginBottom: 0 }]}
                  onPress={handleInvite}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Feather name="send" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {inviteEmail.trim().length >= 2 && (
                <View style={{ marginTop: 8, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 8, maxHeight: 160, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  {drawerSearchLoading ? (
                    <ActivityIndicator size="small" color="#4F46E5" style={{ padding: 12 }} />
                  ) : drawerSearchList.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', padding: 8 }}>No network users found. Hit send button to invite via email.</Text>
                  ) : (
                    drawerSearchList.map(u => (
                      <TouchableOpacity
                        key={u.id}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
                        onPress={async () => {
                          setInviteLoading(true);
                          try {
                            await api.post(`/cashbooks/${selectedBook.id}/members`, { userId: u.id, email: u.email, role: inviteRole });
                            Alert.alert('Success', `Invited ${u.fullName || u.name || u.email || 'user'} (${inviteRole})`);
                            setInviteEmail('');
                            setDrawerSearchList([]);
                            fetchMembers(selectedBook.id);
                          } catch (e) {
                            Alert.alert('Error', e?.response?.data?.message || 'Failed to invite user');
                          } finally {
                            setInviteLoading(false);
                          }
                        }}
                      >
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{u.fullName || u.name || u.email}</Text>
                          <Text style={{ fontSize: 11, color: '#6B7280' }}>{u.email}</Text>
                        </View>
                        <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>+ Add</Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* ── Create Cashbook Modal ── */}
      <BottomSheetModal
        ref={createModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
        handleIndicatorStyle={{ backgroundColor: '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: '#fff' }}
      >
        <BottomSheetView style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.modalTitle, { marginBottom: 0 }]}>New Cashbook</Text>
          </View>

          <Text style={styles.inputLabel}>Name</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={bookName}
            onChangeText={setBookName}
            placeholder="e.g. Goa Trip, Home Expenses"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.colorRow}>
            {BOOK_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, bookColor === c && styles.colorDotActive]}
                onPress={() => setBookColor(c)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createBtn, !bookName.trim() && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!bookName.trim()}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.createBtnText}>Create Cashbook</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>

      <ContactsInviteModal
        visible={contactsVisible}
        onClose={() => setContactsVisible(false)}
        cashbook={selectedBook}
        fetchMembers={fetchMembers}
        inviteRole={inviteRole}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FC' },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyCard: {
    margin: 20, borderRadius: 20, backgroundColor: '#fff', padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  bookCard: {
    marginBottom: 16, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E7EB', borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    padding: 24,
  },
  bookCardActive: {
    borderColor: '#1D4ED8',
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardColorDot: { width: 10, height: 10, borderRadius: 5 },
  cardName: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
  cardDesc: { fontSize: 13, color: '#6B7280' },
  cardDescMuted: { fontSize: 12, color: '#9CA3AF' },

  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  cardBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  cardBalance: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -1 },
  cardBalLabel: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  memberBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
  },

  cardStats: { flexDirection: 'row', gap: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardStatItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardStatDot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardStatLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  cardStatVal: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#1D4ED8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },

  modalSheet: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 24 },

  inputLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },

  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotActive: { borderWidth: 3, borderColor: '#111827' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#1D4ED8', borderRadius: 14, paddingVertical: 16,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const s2 = StyleSheet.create({
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  roleChip: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  memberEmail: { fontSize: 12, color: '#6B7280' },
  roleBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  roleBtnActive: {
    borderColor: '#4F46E5', backgroundColor: '#EEF2FF',
  },
});
