// screens/ChatListScreen.js — Financial Communication Hub Home
import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, StatusBar, Alert, ScrollView,
  Animated, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useChat } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { api } from '../utils/api';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isThisWeek = (now - d) < 7 * 24 * 60 * 60 * 1000;
  if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (isThisWeek) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatLastSeen(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function Avatar({ name, size = 50, online, isNotes, isGroup }) {
  if (isNotes) {
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#2D8CFF' }]}>
        <Text style={{ fontSize: size * 0.4 }}>📓</Text>
      </View>
    );
  }
  if (isGroup) {
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#0EA5E9' }]}>
        <Feather name="users" size={size * 0.44} color="#fff" />
      </View>
    );
  }
  const initial = (name || '?').charAt(0).toUpperCase();
  const colors = ['#2D8CFF', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#F26D21', '#EC4899'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
        <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
      </View>
      {online && <View style={[styles.onlineDot, { width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12 }]} />}
    </View>
  );
}

// Category tab pills
const TABS = ['All', 'Unread', 'Personal', 'Family', 'Business'];

function ConversationItem({ item, userId, onPress, onLongPress, isOnline, lastSeen }) {
  const isNotes = item.type === 'NOTES_SELF';
  const isGroup = item.type === 'GROUP' || item.type === 'CASHBOOK_GROUP';
  const other = item.members?.find((m) => m.userId !== userId);
  const name = isNotes ? 'My Notes' : (item.type === 'DIRECT' ? other?.user?.fullName : item.name);
  const unread = item.unreadCount || 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={styles.convItem}
        onPress={() => onPress(item, name)}
        onLongPress={() => onLongPress(item, name)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Avatar name={name} isNotes={isNotes} isGroup={isGroup} online={isOnline} />

        <View style={styles.convInfo}>
          <View style={styles.convRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
              {item.isPinned && <Feather name="bookmark" size={11} color="#2D8CFF" />}
              {item.isMuted && <Feather name="bell-off" size={11} color="#9CA3AF" />}
              {isNotes && <Feather name="book-open" size={11} color="#2D8CFF" />}
              <Text style={[styles.convName, unread > 0 && styles.convNameUnread]} numberOfLines={1}>
                {name || 'Unknown'}
              </Text>
            </View>
            <Text style={[styles.convTime, unread > 0 && styles.convTimeUnread]}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.convRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.convPreview, unread > 0 && styles.convPreviewUnread]} numberOfLines={1}>
                {isNotes ? '📓 Your personal notes' : (item.lastMessageText || 'No messages yet')}
              </Text>
              {!isOnline && lastSeen && !unread && (
                <Text style={styles.lastSeen}>last seen {formatLastSeen(lastSeen)}</Text>
              )}
            </View>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Pinned Avatars horizontal scroll (WhatsApp-style)
function PinnedBubbles({ pinned, userId, onPress, onLongPress, onlineUsers }) {
  if (!pinned.length) return null;
  return (
    <View style={styles.pinnedSection}>
      <Text style={styles.pinnedLabel}>📌 Pinned</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pinnedScroll}>
        {pinned.map((item) => {
          const other = item.members?.find((m) => m.userId !== userId);
          const name = item.type === 'DIRECT' ? other?.user?.fullName : item.name;
          const isOnline = item.members?.some((m) => m.userId !== userId && onlineUsers.has(m.userId));
          return (
            <TouchableOpacity key={item.id} style={styles.pinnedBubble} onPress={() => onPress(item, name)} onLongPress={() => onLongPress && onLongPress(item, name)}>
              <Avatar name={name} size={52} online={isOnline} isNotes={item.type === 'NOTES_SELF'} isGroup={item.type === 'GROUP'} />
              <Text style={styles.pinnedBubbleName} numberOfLines={1}>{name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { conversations, onlineUsers, fetchConversations, totalUnread } = useChat();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [notesConv, setNotesConv] = useState(null);

  useEffect(() => {
    fetchConversations();
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await api.get('/chat/notes');
      setNotesConv(res.data?.data || res.data);
    } catch { /* ignore */ }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const handleSearch = useCallback(async (q) => {
    setSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.get('/chat/contacts/search', { params: { q } });
      setSearchResults(res.data?.data || []);
    } catch { setSearchResults([]); }
  }, []);

  const openConversation = (item, name) => {
    navigation.navigate('ChatRoom', {
      conversationId: item.id, title: name,
      members: item.members, conversationType: item.type,
    });
  };

  const openNotes = () => {
    if (notesConv) {
      navigation.navigate('ChatRoom', {
        conversationId: notesConv.id, title: 'My Notes',
        members: notesConv.members, conversationType: 'NOTES_SELF',
      });
    }
  };

  const startChat = async (searchUser) => {
    try {
      const res = await api.post('/chat/conversations', { participantIds: [searchUser.id] });
      const conv = res.data?.data;
      await fetchConversations();
      setSearch('');
      setSearchResults([]);
      if (!conv) throw new Error('Failed to start chat');
      navigation.navigate('ChatRoom', { conversationId: conv.id, title: searchUser.fullName });
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not start conversation');
    }
  };

  const handleLongPress = (item, name) => {
    const isPinned = item.isPinned;
    const isMuted = item.isMuted;
    const isArchived = item.isArchived;

    Alert.alert(name || 'Conversation', 'Manage chat', [
      { text: isPinned ? 'Unpin' : 'Pin', onPress: async () => {
        try {
          await api.patch(`/chat/conversations/${item.id}/pin`, { isPinned: !isPinned });
          fetchConversations();
        } catch { Alert.alert('Error', 'Failed to update'); }
      }},
      { text: isMuted ? 'Unmute' : 'Mute', onPress: async () => {
        try {
          await api.patch(`/chat/conversations/${item.id}/mute`, { isMuted: !isMuted });
          fetchConversations();
        } catch { Alert.alert('Error', 'Failed to update'); }
      }},
      { text: isArchived ? 'Unarchive' : 'Archive', onPress: async () => {
        try {
          await api.patch(`/chat/conversations/${item.id}/archive`, { isArchived: !isArchived });
          fetchConversations();
        } catch { Alert.alert('Error', 'Failed to update'); }
      }},
      { text: 'Set Category', onPress: () => {
        Alert.alert('Category', 'Choose category', [
          { text: 'Personal', onPress: () => api.patch(`/chat/conversations/${item.id}/category`, { category: 'PERSONAL' }).then(() => fetchConversations()) },
          { text: 'Family', onPress: () => api.patch(`/chat/conversations/${item.id}/category`, { category: 'FAMILY' }).then(() => fetchConversations()) },
          { text: 'Business', onPress: () => api.patch(`/chat/conversations/${item.id}/category`, { category: 'BUSINESS' }).then(() => fetchConversations()) },
          { text: 'Cancel', style: 'cancel' },
        ], { cancelable: true });
      }},
      { text: 'Notification Preference', onPress: () => {
        Alert.alert('Notifications', 'Set notification level', [
          { text: 'Everything', onPress: () => api.patch(`/chat/conversations/${item.id}/notif-pref`, { notifPref: 'EVERYTHING' }) },
          { text: 'Mentions Only', onPress: () => api.patch(`/chat/conversations/${item.id}/notif-pref`, { notifPref: 'MENTION_ONLY' }) },
          { text: 'Mute', onPress: () => api.patch(`/chat/conversations/${item.id}/notif-pref`, { notifPref: 'MUTE' }) },
          { text: 'Cancel', style: 'cancel' },
        ], { cancelable: true });
      }},
      { text: 'Starred Messages', onPress: () => navigation.navigate('StarredMessages') },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  // Filter by tab
  const filterByTab = (convs) => {
    if (activeTab === 'Unread') return convs.filter(c => (c.unreadCount || 0) > 0);
    if (activeTab === 'Personal') return convs.filter(c => c.category === 'PERSONAL' || !c.category);
    if (activeTab === 'Family') return convs.filter(c => c.category === 'FAMILY');
    if (activeTab === 'Business') return convs.filter(c => c.category === 'BUSINESS');
    return convs;
  };

  const allConvs = search
    ? conversations.filter((c) => (c.name || '').toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const filtered = filterByTab(allConvs.filter(c => !c.isArchived));
  const pinned = filtered.filter((c) => c.isPinned);
  const regular = filtered.filter((c) => !c.isPinned);
  const archived = allConvs.filter(c => c.isArchived);

  const listData = [
    ...(regular.length > 0 ? [
      { type: 'header', key: 'recent-h', label: 'Recent' },
      ...regular.map(c => ({ ...c, _type: 'conv' }))
    ] : []),
    ...(archived.length > 0 ? [
      { type: 'archive_banner', key: 'archive-banner', count: archived.length }
    ] : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>
            {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up ✓'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('StarredMessages')}>
            <Feather name="star" size={18} color="#2D8CFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ContactRequests')}>
            <Feather name="user-plus" size={18} color="#2D8CFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search or start new chat..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setSearchResults([]); }}>
            <Feather name="x" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsBox}>
          <Text style={styles.searchResultsTitle}>People on Cashtro</Text>
          {searchResults.map((u) => (
            <TouchableOpacity key={u.id} style={styles.searchResult} onPress={() => startChat(u)}>
              <Avatar name={u.fullName} size={38} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.searchResultName}>{u.fullName}</Text>
                <Text style={styles.searchResultEmail}>{u.email}</Text>
              </View>
              <Feather name="message-circle" size={18} color="#2D8CFF" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Notes to Self card */}
      {!search && (
        <TouchableOpacity style={styles.notesCard} onPress={openNotes}>
          <View style={styles.notesIcon}>
            <Text style={{ fontSize: 22 }}>📓</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notesTitle}>My Notes</Text>
            <Text style={styles.notesSub}>Expenses, receipts, reminders & quick notes</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* Pinned Bubbles */}
      {!search && pinned.length > 0 && (
        <PinnedBubbles pinned={pinned} userId={user?.id} onPress={openConversation} onLongPress={handleLongPress} onlineUsers={onlineUsers} />
      )}

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key || item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D8CFF" />}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.listHeader}>{item.label}</Text>;
          }
          if (item.type === 'archive_banner') {
            return (
              <TouchableOpacity style={styles.archiveBanner} onPress={() => setActiveTab('Archived')}>
                <Feather name="archive" size={16} color="#6B7280" />
                <Text style={styles.archiveBannerText}>{item.count} archived conversation{item.count > 1 ? 's' : ''}</Text>
                <Feather name="chevron-right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            );
          }
          const isOnline = item.members?.some((m) => m.userId !== user?.id && onlineUsers.has(m.userId));
          const other = item.members?.find((m) => m.userId !== user?.id);
          return (
            <ConversationItem
              item={item}
              userId={user?.id}
              onPress={openConversation}
              onLongPress={handleLongPress}
              isOnline={isOnline}
              lastSeen={other?.lastSeenAt}
            />
          );
        }}
        ListEmptyComponent={
          !search && (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Search for people on Cashtro to start chatting and share finances!
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#232333', letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: '#747487', marginTop: 2 },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', margin: 12,
    borderRadius: 10, paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#232333', padding: 0 },

  tabsRow: { maxHeight: 44, marginBottom: 4 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  tabActive: { backgroundColor: '#2D8CFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#747487' },
  tabTextActive: { color: '#fff' },

  notesCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginTop: 8, marginBottom: 4,
    backgroundColor: '#EFF6FF', borderRadius: 16,
    padding: 14, gap: 12,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  notesIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  notesTitle: { fontSize: 15, fontWeight: '700', color: '#2D8CFF' },
  notesSub: { fontSize: 12, color: '#747487', marginTop: 2 },

  pinnedSection: { borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  pinnedLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
  },
  pinnedScroll: { paddingLeft: 16 },
  pinnedBubble: { alignItems: 'center', marginRight: 16, marginBottom: 4, width: 60 },
  pinnedBubbleName: { fontSize: 11, color: '#232333', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  searchResultsBox: {
    marginHorizontal: 12, backgroundColor: '#fff',
    borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
    padding: 12, marginBottom: 8,
  },
  searchResultsTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  searchResult: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  searchResultName: { fontSize: 15, fontWeight: '600', color: '#232333' },
  searchResultEmail: { fontSize: 12, color: '#9CA3AF' },

  listHeader: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },

  convItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: '#fff' },
  onlineDot: {
    backgroundColor: '#10B981', position: 'absolute', bottom: 0, right: 0,
    borderWidth: 2, borderColor: '#fff',
  },
  convInfo: { flex: 1 },
  convRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  convName: { fontSize: 16, fontWeight: '600', color: '#232333', flex: 1 },
  convNameUnread: { fontWeight: '800' },
  convPreview: { fontSize: 13, color: '#9CA3AF' },
  convPreviewUnread: { color: '#232333', fontWeight: '600' },
  lastSeen: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  convTime: { fontSize: 11, color: '#9CA3AF', marginLeft: 4 },
  convTimeUnread: { color: '#2D8CFF', fontWeight: '700' },
  badge: {
    backgroundColor: '#2D8CFF', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center', marginLeft: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  archiveBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 0.5, borderTopColor: '#F3F4F6',
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  archiveBannerText: { flex: 1, fontSize: 14, color: '#6B7280', fontWeight: '500' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
