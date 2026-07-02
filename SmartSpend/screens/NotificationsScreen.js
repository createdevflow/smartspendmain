import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { useBooks } from '../context/BooksContext';

const CATEGORIES = [
  { key: 'ALL',         label: 'All',         icon: 'bell',           color: '#6B7280' },
  { key: 'BUDGET',      label: 'Budget',       icon: 'pie-chart',      color: '#1D4ED8' },
  { key: 'GOAL',        label: 'Goals',        icon: 'target',         color: '#059669' },
  { key: 'TRANSACTION', label: 'Transactions', icon: 'credit-card',    color: '#7C3AED' },
  { key: 'REPORT',      label: 'Reports',      icon: 'file-text',      color: '#D97706' },
  { key: 'SCHEDULER',   label: 'Scheduler',    icon: 'clock',          color: '#0891B2' },
  { key: 'SECURITY',    label: 'Security',     icon: 'shield',         color: '#DC2626' },
  { key: 'SYSTEM',      label: 'System',       icon: 'settings',       color: '#6B7280' },
  { key: 'ADMIN',       label: 'Updates',      icon: 'zap',            color: '#F59E0B' },
];

const CATEGORY_META = {
  BUDGET:      { icon: 'pie-chart',   color: '#1D4ED8', bg: '#EFF6FF' },
  GOAL:        { icon: 'target',      color: '#059669', bg: '#ECFDF5' },
  TRANSACTION: { icon: 'credit-card', color: '#7C3AED', bg: '#F5F3FF' },
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
      const { token } = notif.data || {};
      if (!token) throw new Error('Invalid invite token');
      await api.post(`/cashbooks/accept-invite/${token}`);
      Alert.alert('Success', 'You have joined the cashbook!');
      await markAsRead(notif.id);
      fetchBooks();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept invite');
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

    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread, item.isPinned && styles.cardPinned]}
        onPress={() => {
          if (!item.isRead) markAsRead(item.id);
        }}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.85}
      >
        {/* Left icon */}
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Feather name={meta.icon} size={18} color={meta.color} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {item.isPinned && (
            <View style={styles.pinnedTag}>
              <Feather name="pin" size={10} color="#F59E0B" />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
          <Text style={[styles.notifTitle, item.isRead && styles.notifTitleRead]}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>

          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
          )}

          {isInvite && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAcceptInvite(item)}>
              <Feather name="check-circle" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Accept Invite</Text>
            </TouchableOpacity>
          )}

          {!isInvite && item.actionButton && item.actionUrl && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: meta.color }]}>
              <Text style={styles.actionBtnText}>{item.actionButton}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.notifFooter}>
            <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const categoryUnread = (key) => {
    if (key === 'ALL') return unreadCount;
    return notifications.filter((n) => n.category === key && !n.isRead).length;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.key;
          const count = categoryUnread(cat.key);
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catPill, active && styles.catPillActive]}
              onPress={() => { setActiveCategory(cat.key); setLoading(true); loadNotifs(cat.key); }}
            >
              <Feather name={cat.icon} size={13} color={active ? '#fff' : cat.color} />
              <Text style={[styles.catPillText, active && styles.catPillTextActive]}>{cat.label}</Text>
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
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Feather name="bell-off" size={36} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>
            {activeCategory !== 'ALL' ? `No ${activeCategory.toLowerCase()} alerts yet.` : "You're all caught up!"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E3A8A" />}
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
  markAllText: { fontSize: 12, color: '#2563EB', fontWeight: '700' },

  categoryBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', maxHeight: 60, flexGrow: 0 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  catPillActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  catPillTextActive: { color: '#fff' },
  catBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  catBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  card: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 0,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#1E3A8A', backgroundColor: '#FAFBFF' },
  cardPinned: { borderTopWidth: 1, borderTopColor: '#F59E0B' },

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
    backgroundColor: '#1E3A8A', borderRadius: 8,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  notifTime: { fontSize: 11, color: '#9CA3AF' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E3A8A' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
});
