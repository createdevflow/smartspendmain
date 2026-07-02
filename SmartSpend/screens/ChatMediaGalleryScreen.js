// screens/ChatMediaGalleryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../utils/api';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - 4) / 3;

const TABS = [
  { key: 'images', label: 'Photos', icon: 'image' },
  { key: 'documents', label: 'Files', icon: 'file' },
  { key: 'receipts', label: 'Receipts', icon: 'file-text' },
  { key: 'transactions', label: 'Transactions', icon: 'trending-up' },
  { key: 'voice', label: 'Voice', icon: 'mic' },
];

function ImageGrid({ items }) {
  return (
    <FlatList
      data={items}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ width: IMG_SIZE, height: IMG_SIZE, margin: 1 }}>
          <Image source={{ uri: item.mediaUrl || item.content }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      )}
    />
  );
}

function FileList({ items }) {
  const fmt = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={s.fileItem}>
          <View style={s.fileIcon}>
            <Feather name="file" size={22} color="#0EA5E9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fileName} numberOfLines={1}>{item.content || 'File'}</Text>
            <Text style={s.fileSub}>{item.sender?.fullName} · {fmt(item.createdAt)}</Text>
          </View>
          <Feather name="download" size={18} color="#9CA3AF" />
        </View>
      )}
    />
  );
}

function TransactionList({ items }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const meta = item.metadata || {};
        const isIncome = meta.type === 'INCOME';
        return (
          <View style={s.txItem}>
            <View style={[s.txDot, { backgroundColor: isIncome ? '#10B981' : '#EF4444' }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.txLabel}>{meta.category || 'Transaction'}</Text>
              <Text style={s.txSub}>{item.sender?.fullName} · {meta.date ? new Date(meta.date).toLocaleDateString('en-IN') : ''}</Text>
            </View>
            <Text style={[s.txAmount, { color: isIncome ? '#059669' : '#DC2626' }]}>
              {isIncome ? '+' : '-'}₹{Number(meta.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        );
      }}
    />
  );
}

export default function ChatMediaGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, title } = route.params || {};
  const [activeTab, setActiveTab] = useState('images');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (tab = activeTab) => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/media`, { params: { type: tab } });
      setItems(res.data?.data || res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, activeTab]);

  useEffect(() => { load(); }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderContent = () => {
    if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1D4ED8" /></View>;
    if (!items.length) return (
      <View style={s.empty}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>
          {activeTab === 'images' ? '🖼️' : activeTab === 'transactions' ? '💰' : '📄'}
        </Text>
        <Text style={s.emptyTitle}>Nothing here yet</Text>
      </View>
    );
    if (activeTab === 'images' || activeTab === 'receipts') return <ImageGrid items={items} />;
    if (activeTab === 'transactions') return <TransactionList items={items} />;
    return <FileList items={items} />;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Media</Text>
          <Text style={s.sub}>{title}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather name={tab.icon} size={15} color={activeTab === tab.key ? '#1D4ED8' : '#9CA3AF'} />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
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
  sub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 3 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#1D4ED8' },
  tabText: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1D4ED8' },

  fileItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  fileIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#E0F2FE',
    alignItems: 'center', justifyContent: 'center',
  },
  fileName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  fileSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
  },
  txDot: { width: 10, height: 10, borderRadius: 5 },
  txLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 8 },
});
