// screens/BooksScreen.js — Fully colored cards, enhanced side peeks, stacked badges below title
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, TextInput, Modal, Alert, Dimensions, Platform,
  KeyboardAvoidingView, Pressable, ActivityIndicator, Share, RefreshControl, Animated
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useBooks } from '../context/BooksContext';
import { useTransactions, maskCurrency } from '../context/TransactionsContext';
import { getCurrencySymbol } from '../utils/planFeatures';
import { api } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import ContactsInviteModal from '../components/ContactsInviteModal';
import QuickEntrySheet from '../components/QuickEntrySheet';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput, BottomSheetView } from '@gorhom/bottom-sheet';
import { TourStep, useTourGuide } from '../components/onboarding/TourGuide';
import { useOnboarding } from '../context/OnboardingContext';
import { useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
// 68% card width ensures significant peeking (~50px) on both left and right sides
const CARD_WIDTH = Math.round(SCREEN_W * 0.72);
const SPACING = 14;
const SNAP_INTERVAL = CARD_WIDTH + SPACING;
// Center the active card: half of the remaining screen width on each side
const SIDE_PADDING = Math.round((SCREEN_W - CARD_WIDTH) / 2);

const BOOK_COLORS = ['#2D8CFF', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#F26D21', '#EF4444'];

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Generate dual-series SVG graph data
function generateGraphData(bookTxs) {
  if (!bookTxs || bookTxs.length === 0) {
    return {
      inPath: "M 0 45 L 300 45",
      outPath: "M 0 45 L 300 45",
      inPoints: [],
      outPoints: [],
    };
  }

  const sorted = [...bookTxs].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-12);
  const n = sorted.length;
  const width = 300;
  const baseLine = 46;

  if (n === 1) {
    const t = sorted[0];
    const isIncome = t.type === 'INCOME' || t.type === 'in';
    const val = Number(t.amount) || 0;
    const h = Math.min(36, Math.max(8, (val / 1000) * 30));
    return {
      inPath: isIncome ? `M 0 ${baseLine} L 150 ${baseLine - h} L 300 ${baseLine}` : `M 0 ${baseLine} L 300 ${baseLine}`,
      outPath: !isIncome ? `M 0 ${baseLine} L 150 ${baseLine - h} L 300 ${baseLine}` : `M 0 ${baseLine} L 300 ${baseLine}`,
      inPoints: isIncome ? [{ x: 150, y: baseLine - h }] : [],
      outPoints: !isIncome ? [{ x: 150, y: baseLine - h }] : [],
    };
  }

  let maxVal = 1;
  sorted.forEach(t => {
    const val = Number(t.amount) || 0;
    if (val > maxVal) maxVal = val;
  });

  let inPts = [];
  let outPts = [];

  sorted.forEach((t, i) => {
    const x = Math.round((i / (n - 1)) * width);
    const val = Number(t.amount) || 0;
    const y = baseLine - Math.round((val / maxVal) * 38);
    const isIncome = t.type === 'INCOME' || t.type === 'in';

    if (isIncome) {
      inPts.push({ x, y });
      outPts.push({ x, y: baseLine });
    } else {
      outPts.push({ x, y });
      inPts.push({ x, y: baseLine });
    }
  });

  const toSmoothPath = (pts) => {
    if (pts.length === 0) return `M 0 ${baseLine} L ${width} ${baseLine}`;
    if (pts.length === 1) return `M 0 ${baseLine} L ${pts[0].x} ${pts[0].y} L ${width} ${baseLine}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const c1x = curr.x + (next.x - curr.x) / 2;
      const c2x = curr.x + (next.x - curr.x) / 2;
      d += ` C ${c1x} ${curr.y}, ${c2x} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  return {
    inPath: toSmoothPath(inPts),
    outPath: toSmoothPath(outPts),
    inPoints: inPts.filter(p => p.y < baseLine - 2),
    outPoints: outPts.filter(p => p.y < baseLine - 2),
  };
}

// ─── Book Card (Entire card colored, high contrast white elements) ──────────
function BookCard({ book, bal, bookTxs, isActive, onPress, onDelete, onMembers, onEdit, privateMode, sym, showShared, isFirst }) {
  const totalFlow = (bal.inTotal || 0) + (bal.outTotal || 0) || 1;
  const inRatio = Math.min(100, Math.max(8, ((bal.inTotal || 0) / totalFlow) * 100));
  const outRatio = Math.min(100, Math.max(8, ((bal.outTotal || 0) / totalFlow) * 100));

  const graphData = useMemo(() => generateGraphData(bookTxs), [bookTxs]);
  const cardBgColor = book.color || '#2D8CFF';

  const getGradientColors = (hex) => {
    if (hex === '#10B981') return ['#064E3B', '#059669', '#10B981']; // Green
    if (hex === '#F59E0B') return ['#78350F', '#D97706', '#F59E0B']; // Amber
    if (hex === '#EC4899') return ['#831843', '#DB2777', '#EC4899']; // Pink
    if (hex === '#F26D21') return ['#7C2D12', '#EA580C', '#F97316']; // Orange
    if (hex === '#EF4444') return ['#7F1D1D', '#DC2626', '#EF4444']; // Red
    return ['#1E3A8A', '#2563EB', '#3B82F6']; // Default Blue
  };

  return (
    <TourStep id={isFirst ? "book_card" : undefined}>
    <TouchableOpacity
      style={[
        styles.bookCard,
        isActive ? styles.bookCardActive : styles.bookCardInactive
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={getGradientColors(cardBgColor)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Top Header Section */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 10 }}>
          {/* Cashbook Name */}
          <Text style={styles.cardName} numberOfLines={1}>{book.name}</Text>
          
          {/* Small Badges below Title */}
          <View style={styles.badgesRow}>
            {isActive && (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
            {showShared && book.isShared && (
              <View style={styles.sharedBadge}>
                <Text style={styles.sharedBadgeText}>SHARED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Icons (White translucent buttons on colored bg) */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.iconBtnWhite} onPress={onEdit}>
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TourStep id={isFirst ? "book_actions" : undefined} style={styles.iconBtnWhite}>
            <TouchableOpacity style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }} onPress={onMembers}>
              <Feather name="users" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </TourStep>
          {book.memberRole === 'OWNER' && (
            <TouchableOpacity style={styles.iconBtnWhite} onPress={onDelete}>
              <Feather name="trash-2" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Available Balance in Pure White */}
      <View style={styles.balanceSection}>
        <Text style={styles.cardBalLabel}>Available balance</Text>
        <Text style={styles.cardBalance}>
          {privateMode ? maskCurrency(bal.balance || 0, sym) : `${sym}${Math.abs(bal.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </Text>
      </View>

      {/* Real Cash In (Bright Green #4ADE80) & Cash Out (Coral Red #F87171) Graph */}
      <View style={styles.chartContainer}>
        <Svg height={52} width="100%" viewBox="0 0 300 52" preserveAspectRatio="none">
          {/* Cash In */}
          <Path d={`${graphData.inPath} L 300 50 L 0 50 Z`} fill="rgba(74, 222, 128, 0.25)" />
          <Path d={graphData.inPath} stroke="#4ADE80" strokeWidth="2.2" fill="none" />
          {graphData.inPoints.map((p, idx) => (
            <Circle key={`in-${idx}`} cx={p.x} cy={p.y} r="2.8" fill="#FFFFFF" stroke="#4ADE80" strokeWidth="1.5" />
          ))}

          {/* Cash Out */}
          <Path d={`${graphData.outPath} L 300 50 L 0 50 Z`} fill="rgba(248, 113, 113, 0.25)" />
          <Path d={graphData.outPath} stroke="#F87171" strokeWidth="2.2" fill="none" />
          {graphData.outPoints.map((p, idx) => (
            <Circle key={`out-${idx}`} cx={p.x} cy={p.y} r="2.8" fill="#FFFFFF" stroke="#F87171" strokeWidth="1.5" />
          ))}
        </Svg>
      </View>

      {/* Solid White Tiles inside Colored Card for Maximum Readability */}
      <View style={styles.tilesRow}>
        {/* Cash In Tile */}
        <View style={styles.tileIn}>
          <Text style={styles.tileInLabel}>CASH IN</Text>
          <Text style={styles.tileInAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {privateMode ? maskCurrency(bal.inTotal || 0, sym, '+') : `+${sym}${(bal.inTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
          <View style={styles.progressTrackIn}>
            <View style={[styles.progressFillIn, { width: `${inRatio}%` }]} />
          </View>
        </View>

        {/* Cash Out Tile */}
        <View style={styles.tileOut}>
          <Text style={styles.tileOutLabel}>CASH OUT</Text>
          <Text style={styles.tileOutAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
            {privateMode ? maskCurrency(bal.outTotal || 0, sym, '−') : `−${sym}${(bal.outTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </Text>
          <View style={styles.progressTrackOut}>
            <View style={[styles.progressFillOut, { width: `${outRatio}%` }]} />
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.cardFooter}>
        Created {formatDate(book.createdAt)}
      </Text>
    </TouchableOpacity>
    </TourStep>
  );
}

// SproutCoin illustration component with gentle swaying leaf
function SproutCoin({ sym }) {
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(swayAnim, { toValue: -1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [swayAnim]);

  const rotate = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
  });

  return (
    <View style={styles.sproutCoinContainer}>
      {/* Coin Circle */}
      <View style={styles.coinCircle}>
        <Text style={styles.coinSymbol}>{sym || '₹'}</Text>
      </View>
      {/* Swaying Sprout SVG sitting on top edge of coin */}
      <Animated.View style={[styles.sproutWrapper, { transform: [{ rotate }] }]}>
        <Svg width={26} height={18} viewBox="0 0 26 18">
          {/* Center Leaf (#2FAE60) */}
          <Path d="M 13 16 C 10 7, 13 0, 13 0 C 13 0, 16 7, 13 16 Z" fill="#2FAE60" />
          {/* Left Leaf (#5FC98A) */}
          <Path d="M 13 16 C 7 12, 2 11, 2 11 C 2 11, 7 6, 13 16 Z" fill="#5FC98A" />
          {/* Right Leaf (#2FAE60) */}
          <Path d="M 13 16 C 19 12, 24 11, 24 11 C 24 11, 19 6, 13 16 Z" fill="#2FAE60" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default function BooksScreen() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    books,
    activeBookId,
    activeBook,
    setActiveBook,
    addBook,
    updateBook,
    deleteBook,
    shareBook,
    loadBooks,
    refreshBooks,
    loading: booksLoading,
  } = useBooks();
  const { getBookBalance, transactions, privateMode, refreshTransactions } = useTransactions();
  const { hasAccess, getFeatureTease } = useFeatureAccess();
  const isFeatureEnabled = hasAccess;

  const createModalRef = useRef(null);
  const membersModalRef = useRef(null);
  const flatListRef = useRef(null);
  const snapPoints = useMemo(() => ['50%', '92%'], []);

  // Modal states
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCurrency, setNewCurrency] = useState('INR');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#2D8CFF');
  const [editingBook, setEditingBook] = useState(null);
  const [bookName, setBookName] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookColor, setBookColor] = useState(BOOK_COLORS[0]);
  const [editBook, setEditBook] = useState(null);
  const [contactsVisible, setContactsVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Invite & Members Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerBook, setDrawerBook] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerSearchList, setDrawerSearchList] = useState([]);
  const [drawerSearchLoading, setDrawerSearchLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Tour
  const { startTour, activeTour, endTour } = useTourGuide();
  const isFocused = useIsFocused();
  const { shouldShowTour, markTourSeen } = useOnboarding();
  useEffect(() => {
    if (isFocused && shouldShowTour('after_first_book')) {
      const t = setTimeout(() => { startTour('after_first_book'); markTourSeen('after_first_book'); }, 800);
      return () => clearTimeout(t);
    }
  }, [isFocused, shouldShowTour, startTour, markTourSeen]);

  useEffect(() => {
    if (!isFocused && activeTour === 'after_first_book') endTour();
  }, [isFocused, activeTour, endTour]);

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

  const handleShareLink = async (bookToShare) => {
    const targetBook = bookToShare || selectedBook;
    if (!targetBook) return;
    setInviteLoading(true);
    try {
      const res = await api.post(`/cashbooks/${targetBook.id}/members/link`);
      const link = res.data?.data?.link || res.data?.link;
      await Share.share({
        message: Platform.OS === 'android' 
          ? `I'd like you to join my cashbook "${targetBook.name}" on Cashtro!\n\nClick to join: ${link}`
          : `I'd like you to join my cashbook "${targetBook.name}" on Cashtro!`,
        url: link,
        title: `Join "${targetBook.name}" on Cashtro`,
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

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return sortedBooks;
    const q = searchQuery.toLowerCase();
    return sortedBooks.filter(b => b.name.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q)));
  }, [sortedBooks, searchQuery]);

  const currentInsightBook = filteredBooks[activeSlideIndex] || filteredBooks[0] || books[0];
  const currentInsightBal = currentInsightBook ? getBookBalance(currentInsightBook.id) : null;
  const currentInsightSym = currentInsightBook ? getCurrencySymbol(currentInsightBook.currency) : '₹';

  const insight = useMemo(() => {
    if (!currentInsightBook || !currentInsightBal) {
      return { title: 'Get started', subtitle: 'Record entries to track financial flow' };
    }
    const inTot = Number(currentInsightBal.inTotal) || 0;
    const outTot = Number(currentInsightBal.outTotal) || 0;

    if (inTot === 0 && outTot === 0) {
      return { title: 'Fresh cashbook', subtitle: 'No cash entries recorded yet' };
    }
    if (inTot >= outTot) {
      if (outTot === 0) {
        return { title: 'Growing steady', subtitle: `Cash in is up 100.0x cash out (no outflows)` };
      }
      const mult = (inTot / outTot).toFixed(1);
      return { title: 'Growing steady', subtitle: `Cash in is up ${mult}x cash out this period` };
    } else {
      if (inTot === 0) {
        return { title: 'Spending more', subtitle: `Cash out is up 100.0x cash in (no inflows)` };
      }
      const mult = (outTot / inTot).toFixed(1);
      return { title: 'Spending more', subtitle: `Cash out is up ${mult}x cash in this period` };
    }
  }, [currentInsightBook, currentInsightBal, currentInsightSym]);

  // Auto-activate centered cashbook when scroll settles
  const handleMomentumScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / SNAP_INTERVAL);
    if (filteredBooks[idx]) {
      setActiveSlideIndex(idx);
      if (filteredBooks[idx].id !== activeBookId) {
        setActiveBook(filteredBooks[idx].id);
      }
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (idx !== null && idx !== undefined) {
        setActiveSlideIndex(idx);
      }
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Auto-scroll to the active book on initial load so it's visually selected
  useEffect(() => {
    if (!flatListRef.current || filteredBooks.length === 0) return;
    const activeIdx = filteredBooks.findIndex(b => b.id === activeBookId);
    const targetIdx = activeIdx >= 0 ? activeIdx : 0;
    // Small delay to ensure FlatList has measured items
    const timer = setTimeout(() => {
      try {
        flatListRef.current?.scrollToOffset({
          offset: targetIdx * SNAP_INTERVAL,
          animated: false,
        });
        setActiveSlideIndex(targetIdx);
      } catch (e) {
        flatListRef.current?.scrollToOffset({ offset: targetIdx * SNAP_INTERVAL, animated: false });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [activeBookId, filteredBooks.length]);

  const getItemLayout = (data, index) => ({
    length: SNAP_INTERVAL,
    offset: SNAP_INTERVAL * index,
    index,
  });

  const handleEditBook = (book) => {
    setEditBook(book);
    setBookName(book.name || '');
    setBookDesc(book.description || '');
    setBookColor(book.color || BOOK_COLORS[0]);
    createModalRef.current?.present();
  };

  const handleSaveBook = async () => {
    if (!bookName.trim()) return;
    if (editBook) {
      try {
        await api.patch(`/cashbooks/${editBook.id}`, {
          name: bookName.trim(),
          description: bookDesc.trim(),
          color: bookColor,
        });
        await loadBooks();
        createModalRef.current?.dismiss();
        setEditBook(null);
        setBookName('');
        setBookDesc('');
        setBookColor(BOOK_COLORS[0]);
      } catch (e) {
        Alert.alert('Error', 'Failed to update cashbook');
      }
    } else {
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
    <SafeAreaView style={[styles.safe, isDark && { backgroundColor: '#0F172A' }]} edges={['top']}>
      <ScrollView
        style={[styles.scroll, isDark && { backgroundColor: '#0F172A' }]}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D8CFF" />}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, isDark && { color: '#F8FAFC' }]}>Cashbooks</Text>
            <Text style={[styles.subtitle, isDark && { color: '#94A3B8' }]}>{books.length} {books.length === 1 ? 'book' : 'books'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.headerAddBtn, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => {
              setEditBook(null);
              setBookName('');
              setBookDesc('');
              setBookColor(BOOK_COLORS[0]);
              createModalRef.current?.present();
            }}
          >
            <Feather name="plus" size={18} color="#2D8CFF" />
          </TouchableOpacity>
        </View>

        {/* Search Input Pill */}
        {books.length > 0 && (
          <View style={[styles.searchContainer, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Feather name="search" size={18} color="#8A8D99" style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, isDark && { color: '#F8FAFC' }]}
              placeholder="Search cashbooks by name"
              placeholderTextColor="#8A8D99"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={16} color="#8A8D99" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {books.length === 0 ? (
          <View style={[styles.emptyCard, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <View style={{ width: 64, height: 64, backgroundColor: isDark ? 'rgba(45,140,255,0.2)' : '#EFF6FF', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>📒</Text>
            </View>
            <Text style={[styles.emptyTitle, isDark && { color: '#F8FAFC' }]}>No cashbooks yet</Text>
            <Text style={[styles.emptyText, isDark && { color: '#94A3B8' }]}>Create your first cashbook to start recording cash-in and out entries.</Text>
            <TouchableOpacity
              style={[styles.createBtn, { paddingHorizontal: 32, alignSelf: 'center' }]}
              onPress={() => {
                setEditBook(null);
                setBookName('');
                setBookDesc('');
                setBookColor(BOOK_COLORS[0]);
                createModalRef.current?.present();
              }}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.createBtnText}>Create Cashbook</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Horizontal Carousel with Significant Peeking (~50px), Gaps & Height Scaling */}
            <Animated.FlatList
              ref={flatListRef}
              data={filteredBooks}
              keyExtractor={(b) => b.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              bounces={false}
              disableIntervalMomentum
              getItemLayout={getItemLayout}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              // paddingHorizontal centers first/last cards; contentInset mirrors this on iOS
              contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, paddingVertical: 12 }}
              contentInset={{ left: 0, right: 0 }}
              renderItem={({ item: book, index }) => {
                const bal = getBookBalance(book.id);
                const sym = getCurrencySymbol(book.currency);
                const bookTxs = (transactions || []).filter(t => (t.cashbookId === book.id || t.bookId === book.id));

                // scrollX=0 => first card is centered (item 0).
                // Each subsequent card is centered at scrollX = index * SNAP_INTERVAL.
                // The SIDE_PADDING does NOT shift scrollX — it only shifts content visually,
                // so inputRange stays index-based (no offset needed).
                const inputRange = [
                  (index - 1) * SNAP_INTERVAL,
                  index * SNAP_INTERVAL,
                  (index + 1) * SNAP_INTERVAL,
                ];
                const scale = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.86, 1, 0.86],
                  extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.75, 1, 0.75],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    style={{
                      width: CARD_WIDTH,
                      // The last card should not have SPACING to ensure it aligns perfectly with SIDE_PADDING
                      marginRight: index === filteredBooks.length - 1 ? 0 : SPACING,
                      transform: [{ scale }],
                      opacity,
                    }}

                  >
                    <BookCard
                      book={book}
                      isFirst={index === 0}
                      bal={bal}
                      bookTxs={bookTxs}
                      isActive={book.id === activeBookId}
                      onPress={() => {
                        setActiveBook(book.id);
                        // Scroll to exact offset so the card centers: offset = index * (CARD_WIDTH + SPACING)
                        flatListRef.current?.scrollToOffset({
                          offset: index * SNAP_INTERVAL,
                          animated: true,
                        });
                      }}
                      onDelete={() => handleDelete(book)}
                      onEdit={() => handleEditBook(book)}
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
                  </Animated.View>
                );
              }}
            />

            {/* Swipe Dots Indicator */}
            {filteredBooks.length > 1 && (
              <View style={styles.dotsContainer}>
                {filteredBooks.map((_, index) => {
                  const isActiveDot = index === activeSlideIndex;
                  return (
                    <View
                      key={index}
                      style={isActiveDot ? styles.dotActive : styles.dotInactive}
                    />
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Insight Row with Create Cashbook button */}
      <View style={[styles.bottomInsightRow, isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={styles.insightLeftSection}>
          <SproutCoin sym={currentInsightSym} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.insightTitle, isDark && { color: '#F8FAFC' }]} numberOfLines={1}>{insight.title}</Text>
            <Text style={[styles.insightSubtitle, isDark && { color: '#94A3B8' }]} numberOfLines={2}>{insight.subtitle}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.insightCreateBtn}
          onPress={() => {
            setEditBook(null);
            setBookName('');
            setBookDesc('');
            setBookColor(BOOK_COLORS[0]);
            createModalRef.current?.present();
          }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color="#FFFFFF" />
          <Text style={styles.insightCreateBtnText}>Create cashbook</Text>
        </TouchableOpacity>
      </View>

      {/* ── Members Modal ── */}
      <BottomSheetModal
        ref={membersModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#475569' : '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: isDark ? '#1E293B' : '#fff' }}
      >
        <BottomSheetView style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={[styles.modalTitle, isDark && { color: '#F8FAFC' }]}>👥 Members</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#747487', marginTop: 2 }}>{selectedBook?.name}</Text>
            </View>
          </View>

          {membersLoading ? (
            <ActivityIndicator color="#2D8CFF" style={{ marginVertical: 20 }} />
          ) : (
            <BottomSheetScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {members?.owner && (
                <View style={s2.memberRow}>
                  <View style={[s2.roleChip, { backgroundColor: isDark ? 'rgba(245,158,11,0.2)' : '#FEF3C7' }]}><Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#FBBF24' : '#B45309' }}>OWNER</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s2.memberName, isDark && { color: '#F8FAFC' }]}>{members.owner.fullName}</Text>
                    <Text style={[s2.memberEmail, isDark && { color: '#94A3B8' }]}>{members.owner.email}</Text>
                  </View>
                </View>
              )}
              {members?.members?.map((m) => (
                <View key={m.id} style={s2.memberRow}>
                  <TouchableOpacity 
                    onPress={() => handleToggleRole(m)}
                    disabled={selectedBook?.memberRole !== 'OWNER' || m.status !== 'accepted'}
                  >
                    <View style={[s2.roleChip, { backgroundColor: m.status === 'accepted' ? (isDark ? 'rgba(45,140,255,0.2)' : '#EFF6FF') : (isDark ? '#334155' : '#F3F4F6') }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: m.status === 'accepted' ? '#2D8CFF' : (isDark ? '#94A3B8' : '#9CA3AF') }}>
                        {m.status === 'accepted' ? m.role : 'PENDING'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[s2.memberName, isDark && { color: '#F8FAFC' }]}>{m.user?.fullName || m.email}</Text>
                    <Text style={[s2.memberEmail, isDark && { color: '#94A3B8' }]}>{m.email}</Text>
                  </View>
                  {selectedBook?.memberRole === 'OWNER' && (
                    <TouchableOpacity onPress={() => handleRemoveMember(m.id)} style={{ padding: 4 }}>
                      <Feather name="trash-2" size={16} color="#A31E1E" />
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
                  <TouchableOpacity onPress={() => handleShareLink(selectedBook)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Feather name="link" size={14} color="#2D8CFF" />
                    <Text style={{ fontSize: 13, color: '#2D8CFF', fontWeight: '600' }}>Share Link</Text>
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
                    <Text style={{ fontSize: 12, fontWeight: '700', color: inviteRole === r ? '#2D8CFF' : '#747487' }}>{r}</Text>
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
                    <ActivityIndicator size="small" color="#2D8CFF" style={{ padding: 12 }} />
                  ) : drawerSearchList.length === 0 ? (
                    <Text style={{ fontSize: 12, color: '#747487', textAlign: 'center', padding: 8 }}>No network users found. Hit send button to invite via email.</Text>
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
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#12131A' }}>{u.fullName || u.name || u.email}</Text>
                          <Text style={{ fontSize: 11, color: '#747487' }}>{u.email}</Text>
                        </View>
                        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D8CFF' }}>+ Add</Text>
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

      {/* ── Create / Edit Cashbook Modal ── */}
      <BottomSheetModal
        ref={createModalRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#475569' : '#D1D5DB', width: 40, height: 4 }}
        backgroundStyle={{ borderRadius: 24, backgroundColor: isDark ? '#1E293B' : '#fff' }}
      >
        <BottomSheetView style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={[styles.modalTitle, { marginBottom: 0 }, isDark && { color: '#F8FAFC' }]}>{editBook ? 'Edit Cashbook' : 'New Cashbook'}</Text>
          </View>

          <Text style={[styles.inputLabel, isDark && { color: '#94A3B8' }]}>Name</Text>
          <BottomSheetTextInput
            style={[styles.input, isDark && { backgroundColor: '#334155', borderColor: 'rgba(255,255,255,0.1)', color: '#F8FAFC' }]}
            value={bookName}
            onChangeText={setBookName}
            placeholder="e.g. Goa Trip, Home Expenses"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.inputLabel, isDark && { color: '#94A3B8' }]}>Color</Text>
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
            onPress={handleSaveBook}
            disabled={!bookName.trim()}
          >
            <Feather name={editBook ? "check" : "plus"} size={16} color="#fff" />
            <Text style={styles.createBtnText}>{editBook ? 'Save Changes' : 'Create Cashbook'}</Text>
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
  safe: { flex: 1, backgroundColor: '#F1F1F6' },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#12131A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#8A8D99', marginTop: 2 },
  headerAddBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E4E6FB', alignItems: 'center', justifyContent: 'center',
  },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4EC',
    borderRadius: 10, paddingHorizontal: 12, height: 40,
    marginHorizontal: 20, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#12131A', padding: 0 },

  emptyCard: {
    margin: 20, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#E4E4EC',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#12131A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#8A8D99', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  bookCard: {
    width: '100%',
    flex: 1,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 8,
  },
  bookCardActive: {
    borderWidth: 0,
  },
  bookCardInactive: {
    borderWidth: 0,
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardName: { fontSize: 21, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },

  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  sharedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  sharedBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },

  iconBtnWhite: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.22)', alignItems: 'center', justifyContent: 'center',
  },

  balanceSection: { marginBottom: 14 },
  cardBalLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 4 },
  cardBalance: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },

  chartContainer: { height: 52, marginBottom: 16, overflow: 'hidden' },

  tilesRow: { flexDirection: 'row', gap: 12 },
  tileIn: {
    flex: 1, backgroundColor: '#F6FBF7', borderWidth: 1, borderColor: '#DCF5E3',
    borderRadius: 16, padding: 12,
  },
  tileInLabel: { fontSize: 10, fontWeight: '700', color: '#5D9B72', marginBottom: 6, letterSpacing: 0.5 },
  tileInAmount: { fontSize: 15, fontWeight: '700', color: '#1E7A3E', marginBottom: 8 },
  progressTrackIn: { height: 4, borderRadius: 2, backgroundColor: '#DCF5E3', overflow: 'hidden' },
  progressFillIn: { height: '100%', backgroundColor: '#2FAE60', borderRadius: 2 },

  tileOut: {
    flex: 1, backgroundColor: '#FDF6F6', borderWidth: 1, borderColor: '#F8DADA',
    borderRadius: 16, padding: 12,
  },
  tileOutLabel: { fontSize: 10, fontWeight: '700', color: '#B97575', marginBottom: 6, letterSpacing: 0.5 },
  tileOutAmount: { fontSize: 15, fontWeight: '700', color: '#A31E1E', marginBottom: 8 },
  progressTrackOut: { height: 4, borderRadius: 2, backgroundColor: '#F8DADA', overflow: 'hidden' },
  progressFillOut: { height: '100%', backgroundColor: '#D9453D', borderRadius: 2 },

  cardFooter: { fontSize: 12, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'right', marginTop: 14 },

  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 20 },
  dotActive: { width: 22, height: 6, borderRadius: 3, backgroundColor: '#2D8CFF' },
  dotInactive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D5D7E0' },

  bottomInsightRow: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 10, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 14, elevation: 6,
    borderWidth: 1, borderColor: '#E4E4EC',
  },
  insightLeftSection: {
    flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12,
  },
  sproutCoinContainer: {
    width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  coinCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#DBEAFE', borderWidth: 1.5, borderColor: '#2D8CFF',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  coinSymbol: {
    fontSize: 15, fontWeight: '800', color: '#2D8CFF',
  },
  sproutWrapper: {
    position: 'absolute', top: 1,
  },
  insightTitle: {
    fontSize: 14, fontWeight: '800', color: '#12131A', letterSpacing: -0.2, marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 12, color: '#8A8D99', lineHeight: 16,
  },
  insightCreateBtn: {
    backgroundColor: '#2D8CFF', borderRadius: 17, height: 34,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  insightCreateBtnText: {
    color: '#FFFFFF', fontSize: 12, fontWeight: '700',
  },

  modalSheet: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#12131A', marginBottom: 24 },

  inputLabel: { fontSize: 12, fontWeight: '600', color: '#232333', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#12131A', marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },

  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotActive: { borderWidth: 3, borderColor: '#12131A' },

  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2D8CFF', borderRadius: 14, paddingVertical: 16,
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
  memberName: { fontSize: 14, fontWeight: '600', color: '#12131A' },
  memberEmail: { fontSize: 12, color: '#8A8D99' },
  roleBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  roleBtnActive: {
    borderColor: '#2D8CFF', backgroundColor: '#EFF6FF',
  },
});
