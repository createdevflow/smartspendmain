// screens/StarredMessagesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function MessageTypeIcon({ type }) {
  const iconMap = {
    TEXT: 'message-square', IMAGE: 'image', DOCUMENT: 'file',
    VOICE: 'mic', TRANSACTION: 'trending-up', RECEIPT: 'file-text',
  };
  const colorMap = {
    TEXT: '#6B7280', IMAGE: '#8B5CF6', DOCUMENT: '#0EA5E9',
    VOICE: '#EF4444', TRANSACTION: '#059669', RECEIPT: '#F59E0B',
  };
  return (
    <Feather
      name={iconMap[type] || 'message-square'}
      size={14}
      color={colorMap[type] || '#6B7280'}
    />
  );
}

function StarredItem({ item, onNavigate, onUnstar }) {
  const convName = item.conversation?.name || 'Direct Chat';
  const isTransaction = item.type === 'TRANSACTION';

  const previewText = () => {
    if (item.type === 'IMAGE') return '📷 Photo';
    if (item.type === 'VOICE') return '🎙 Voice note';
    if (item.type === 'DOCUMENT') return '📄 Document';
    if (isTransaction) {
      const meta = item.metadata;
      if (meta) return `${meta.type === 'INCOME' ? '+' : '-'}₹${Number(meta.amount).toLocaleString('en-IN')} · ${meta.category || 'Transaction'}`;
    }
    return item.content || 'Message';
  };

  return (
    <View style={s.item}>
      <TouchableOpacity style={s.itemContent} onPress={() => onNavigate(item)} activeOpacity={0.7}>
        <View style={s.itemIcon}>
          <MessageTypeIcon type={item.type} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={s.convName}>{item.sender?.fullName || 'You'}</Text>
            <Text style={s.dateText}>{formatDate(item.starredAt)}</Text>
          </View>
          <Text style={s.preview} numberOfLines={2}>{previewText()}</Text>
          <Text style={s.convSub}>in {convName}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={s.unstarBtn} onPress={() => onUnstar(item.id)}>
        <Feather name="star" size={18} color="#F59E0B" />
      </TouchableOpacity>
    </View>
  );
}

export default function StarredMessagesScreen() {
  const navigation = useNavigation();
  const [starred, setStarred] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/chat/messages/starred');
      setStarred(res.data?.data || res.data || []);
    } catch {
      setStarred([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const handleNavigate = (item) => {
    if (item.conversationId) {
      navigation.navigate('ChatRoom', {
        conversationId: item.conversationId,
        title: item.conversation?.name || 'Chat',
      });
    }
  };

  const handleUnstar = async (messageId) => {
    Alert.alert('Remove Star', 'Remove this message from starred?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/chat/messages/${messageId}/unstar`);
            setStarred(prev => prev.filter(m => m.id !== messageId));
          } catch { Alert.alert('Error', 'Could not remove star'); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>⭐ Starred Messages</Text>
          <Text style={s.sub}>{starred.length} starred</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#1D4ED8" />
        </View>
      ) : (
        <FlatList
          data={starred}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D4ED8" />}
          renderItem={({ item }) => (
            <StarredItem item={item} onNavigate={handleNavigate} onUnstar={handleUnstar} />
          )}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>⭐</Text>
              <Text style={s.emptyTitle}>No starred messages</Text>
              <Text style={s.emptySub}>Long press any message and tap "Star" to save it here.</Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4,
  },
  itemContent: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  itemIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  convName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  preview: { fontSize: 14, color: '#374151', marginTop: 4, lineHeight: 20 },
  convSub: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  dateText: { fontSize: 11, color: '#9CA3AF' },
  unstarBtn: { padding: 16 },
  divider: { height: 0.5, backgroundColor: '#F3F4F6', marginLeft: 64 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
