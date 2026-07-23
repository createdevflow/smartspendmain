import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput,
  ScrollView, Linking,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import OptimizedImage from '../components/OptimizedImage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { useBooks } from '../context/BooksContext';
import { useAppTheme } from '../context/ThemeContext';

const CATEGORIES = [
  { key: 'ALL',         label: 'All',         icon: 'bell',           color: '#6B7280' },
  { key: 'BUDGET',      label: 'Budget',       icon: 'pie-chart',      color: '#2D8CFF' },
  { key: 'GOAL',        label: 'Goals',        icon: 'target',         color: '#059669' },
  { key: 'TRANSACTION', label: 'Transactions', icon: 'credit-card',    color: '#F26D21' },
  { key: 'REPORT',      label: 'Reports',      icon: 'file-text',      color: '#D97706' },
  { key: 'SCHEDULER',   label: 'Scheduler',    icon: 'clock',          color: '#0891B2' },
  { key: 'SECURITY',    label: 'Security',     icon: 'shield',         color: '#DC2626' },
  { key: 'SYSTEM',      label: 'System',       icon: 'settings',       color: '#6B7280' },
  { key: 'ADMIN',       label: 'Updates',      icon: 'zap',            color: '#F59E0B' },
];

const CATEGORY_META = {
  BUDGET:      { icon: 'pie-chart',   color: '#2D8CFF', bg: '#EFF6FF' },
  GOAL:        { icon: 'target',      color: '#059669', bg: '#ECFDF5' },
  TRANSACTION: { icon: 'credit-card', color: '#F26D21', bg: '#FFF7ED' },
  REPORT:      { icon: 'file-text',   color: '#D97706', bg: '#FFFBEB' },
  SCHEDULER:   { icon: 'clock',       color: '#0891B2', bg: '#ECFEFF' },
  SECURITY:    { icon: 'shield',      color: '#DC2626', bg: '#FEF2F2' },
  SYSTEM:      { icon: 'settings',    color: '#6B7280', bg: '#F9FAFB' },
  ADMIN:       { icon: 'zap',         color: '#F59E0B', bg: '#FFFBEB' },
  WEALTH:      { icon: 'trending-up', color: '#10B981', bg: '#ECFDF5' },
};

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsScreen({ navigation }) {
  const { isDark } = useAppTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [unreadCount, setUnreadCount] = useState(0);
  const { fetchBooks } = useBooks();

  const loadNotifs = async (cat = activeCategory) => {
    try {
      const params = cat === 'ALL' ? '/notifications?limit=50' : `/notifications?category=${cat}&limit=50`;
      const res = await api.get(params);
      const payload = res.data?.data || res.data;
      const raw = payload?.items || payload;
      const list = Array.isArray(raw) ? raw : [];
      setNotifications(list);
      setUnreadCount(typeof payload?.unreadCount === 'number' ? payload.unreadCount : list.filter(n => !n?.isRead).length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadNotifs(activeCategory);
    }, [activeCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifs(activeCategory);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const pinNotif = async (id, current) => {
    try {
      await api.patch(`/notifications/${id}/pin`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isPinned: !current } : n)));
    } catch (e) {}
  };

  const archiveNotif = async (id) => {
    try {
      await api.patch(`/notifications/${id}/archive`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleAcceptInvite = async (notif) => {
    try {
      let parsedData = notif.data || {};
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData); } catch (e) {}
      }
      const { token } = parsedData;
      if (!token) throw new Error('Invalid invite token');
      await api.post(`/cashbooks/accept-invite/${token}`);
      Alert.alert('Success', 'You have joined the cashbook!');
      await markAsRead(notif.id);
      fetchBooks();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to accept invite');
    }
  };

  const handleNotifActionPress = async (item) => {
    if (!item.isRead) await markAsRead(item.id);
    if (item.actionUrl) {
      try {
        await Linking.openURL(item.actionUrl);
      } catch {
        Alert.alert('Notice', 'Cannot open URL: ' + item.actionUrl);
      }
    }
  };

  const handleLongPress = (item) => {
    Alert.alert('Notification', item.title, [
      item.isPinned
        ? { text: 'Unpin', onPress: () => pinNotif(item.id, true) }
        : { text: 'Pin', onPress: () => pinNotif(item.id, false) },
      { text: 'Archive', onPress: () => archiveNotif(item.id) },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }) => {
    const isInvite = item.type === 'IN_APP' && item.title.includes('Invite');
    const meta = CATEGORY_META[item.category] || CATEGORY_META['SYSTEM'];

    const renderRightActions = () => (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, height: '100%', paddingVertical: 2 }}>
        <TouchableOpacity
          style={{ width: 60, height: '100%', backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginRight: 8 }}
          onPress={() => item.isPinned ? pinNotif(item.id, true) : pinNotif(item.id, false)}
        >
          <MaterialCommunityIcons name={item.isPinned ? "pin-off" : "pin"} size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 60, height: '100%', backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderRadius: 14 }}
          onPress={() => archiveNotif(item.id)}
        >
          <Feather name="archive" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    );

    const renderLeftActions = () => (
      <View style={{ width: 80, height: '100%', backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginRight: 10 }}>
        <Feather name="trash-2" size={24} color="#FFF" />
      </View>
    );

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        onSwipeableLeftOpen={() => handleDelete(item.id)}
        containerStyle={{ overflow: 'visible' }}
      >
        <TouchableOpacity
          style={[
            styles.card,
            isDark && { backgroundColor: '#1E293B', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1 },
            !item.isRead && (isDark ? { backgroundColor: 'rgba(45, 140, 255, 0.1)', borderLeftColor: '#2D8CFF' } : styles.cardUnread),
            item.isPinned && (isDark ? { backgroundColor: 'rgba(245, 158, 11, 0.1)' } : styles.cardPinned),
          ]}
          onPress={() => {
            if (!item.isRead) markAsRead(item.id);
          }}
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.85}
        >
          {/* Left icon */}
          <View style={[styles.iconWrap, { backgroundColor: isDark ? `${meta.color}25` : meta.bg }]}>
            <Feather name={meta.icon} size={18} color={meta.color} />
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitle, isDark && { color: '#F8FAFC' }, item.isRead && (isDark ? { color: '#94A3B8', fontWeight: '600' } : styles.notifTitleRead)]}>{item.title}</Text>
            <Text style={[styles.notifBody, isDark && { color: '#94A3B8' }]} numberOfLines={2}>{item.body}</Text>

            {item.imageUrl && (
              <OptimizedImage source={{ uri: item.imageUrl }} style={styles.bannerImage} contentFit="cover" size="medium" />
            )}

            {isInvite && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAcceptInvite(item)}>
                <Feather name="check-circle" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Accept Invite</Text>
              </TouchableOpacity>
            )}

            {!isInvite && item.actionButton && item.actionUrl && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: meta.color }]}
                onPress={() => handleNotifActionPress(item)}
              >
                <Text style={styles.actionBtnText}>{item.actionButton}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.notifFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.notifTime, isDark && { color: '#64748B' }]}>{timeAgo(item.createdAt)}</Text>
                {item.isPinned && (
                  <View style={[styles.pinnedTag, { marginBottom: 0 }]}>
                    <MaterialCommunityIcons name="pin" size={12} color="#F59E0B" />
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
              </View>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const categoryUnread = (key) => {
    if (key === 'ALL') return unreadCount;
    return notifications.filter((n) => n.category === key && !n.isRead).length;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: '#0F172A' }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: '#1E293B', borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Feather name="arrow-left" size={22} color={isDark ? '#F8FAFC' : '#232333'} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isDark && { color: '#F8FAFC' }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.headerSub, isDark && { color: '#94A3B8' }]}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={[styles.markAllBtn, isDark && { backgroundColor: 'rgba(45, 140, 255, 0.15)' }]}>
            <Text style={[styles.markAllText, isDark && { color: '#60A5FA' }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.categoryBar, isDark && { backgroundColor: '#1E293B', borderBottomColor: 'rgba(255,255,255,0.08)' }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          const count = categoryUnread(cat.key);
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catPill, active && styles.catPillActive, !active && isDark && { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.08)' }]}
              onPress={() => { setActiveCategory(cat.key); setLoading(true); loadNotifs(cat.key); }}
            >
              <Feather name={cat.icon} size={13} color={active ? '#fff' : (isDark ? '#94A3B8' : cat.color)} />
              <Text style={[styles.catPillText, active && styles.catPillTextActive, !active && isDark && { color: '#CBD5E1' }]}>{cat.label}</Text>
              {count > 0 && !active && (
                <View style={[styles.catBadge, { backgroundColor: cat.color }]}>
                  <Text style={styles.catBadgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D8CFF" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Feather name="bell-off" size={36} color={isDark ? '#64748B' : '#9CA3AF'} />
          </View>
          <Text style={[styles.emptyTitle, isDark && { color: '#F8FAFC' }]}>No notifications</Text>
          <Text style={[styles.emptySub, isDark && { color: '#94A3B8' }]}>
            {activeCategory !== 'ALL' ? `No ${activeCategory.toLowerCase()} alerts yet.` : "You're all caught up!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D8CFF" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  markAllBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#EFF6FF', borderRadius: 8 },
  markAllText: { fontSize: 12, color: '#2D8CFF', fontWeight: '700' },

  categoryBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 60, flexGrow: 0 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  catPillActive: { backgroundColor: '#2D8CFF', borderColor: '#2D8CFF' },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  catPillTextActive: { color: '#fff' },
  catBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  catBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  card: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  cardUnread: { borderLeftColor: '#2D8CFF', backgroundColor: '#FAFBFF' },
  cardPinned: { backgroundColor: '#FFFBEB' },

  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  pinnedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinnedText: { fontSize: 10, color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  notifTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  notifTitleRead: { fontWeight: '600', color: '#374151' },
  notifBody: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

  bannerImage: { width: '100%', height: 120, borderRadius: 10, marginTop: 10 },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: 10, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: '#2D8CFF', borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  notifTime: { fontSize: 11, color: '#9CA3AF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D8CFF' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
});
