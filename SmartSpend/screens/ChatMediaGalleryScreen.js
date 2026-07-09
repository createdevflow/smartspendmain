// screens/ChatMediaGalleryScreen.js — Modern Chat Details & Media Gallery
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Dimensions, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../utils/api';
import OptimizedImage from '../components/OptimizedImage';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - 4) / 3;

const TABS = [
  { key: 'images', label: 'Photos', icon: 'image' },
  { key: 'documents', label: 'Files', icon: 'file' },
  { key: 'receipts', label: 'Receipts', icon: 'file-text' },
  { key: 'transactions', label: 'Finance', icon: 'trending-up' },
  { key: 'voice', label: 'Voice', icon: 'mic' },
  { key: 'settings', label: 'Options', icon: 'sliders' },
];

function ImageGrid({ items }) {
  return (
    <FlatList
      data={items}
      numColumns={3}
      keyExtractor={(item, index) => item.id || index.toString()}
      renderItem={({ item }) => (
        <View style={{ width: IMG_SIZE, height: IMG_SIZE, margin: 1, backgroundColor: '#F1F5F9' }}>
          <OptimizedImage source={{ uri: item.mediaUrl || item.content }} style={{ width: '100%', height: '100%' }} contentFit="cover" size="thumbnail" />
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
      keyExtractor={(item, index) => item.id || index.toString()}
      renderItem={({ item }) => (
        <View style={s.fileItem}>
          <View style={s.fileIcon}>
            <Feather name="file" size={20} color="#2D8CFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fileName} numberOfLines={1}>{item.content || item.metadata?.filename || 'Document'}</Text>
            <Text style={s.fileSub}>{item.sender?.fullName || 'User'} · {fmt(item.createdAt)}</Text>
          </View>
          <TouchableOpacity style={s.dlBtn}>
            <Feather name="download" size={16} color="#747487" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

function TransactionList({ items }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => item.id || index.toString()}
      renderItem={({ item }) => {
        const meta = item.metadata || {};
        const isIncome = meta.type === 'INCOME';
        return (
          <View style={s.txItem}>
            <View style={[s.txIconBox, { backgroundColor: isIncome ? '#D1FAE5' : '#FEE2E2' }]}>
              <Feather name={isIncome ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={isIncome ? '#10B981' : '#EF4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.txLabel} numberOfLines={1}>{meta.category || meta.notes || 'Transaction'}</Text>
              <Text style={s.txSub}>{item.sender?.fullName || 'User'} · {meta.date ? new Date(meta.date).toLocaleDateString('en-IN') : ''}</Text>
            </View>
            <Text style={[s.txAmount, { color: isIncome ? '#059669' : '#DC2626' }]}>
              {isIncome ? '+' : '-'}₹{Number(meta.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </Text>
          </View>
        );
      }}
    />
  );
}

function OptionsPanel({ title }) {
  const [muted, setMuted] = useState(false);
  const handleAction = (act) => Alert.alert(act, `${act} setting has been applied.`);

  return (
    <ScrollView style={s.optionsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Group / Chat Profile Header */}
      <View style={s.profileHeader}>
        <View style={s.profileAvatar}>
          <Text style={s.profileAvatarText}>{(title || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.profileName}>{title || 'Chat room'}</Text>
        <Text style={s.profileStatus}>Cashtro Encrypted Messaging</Text>
      </View>

      <Text style={s.sectionHeader}>SHARED ITEMS & ARCHIVES</Text>
      <View style={s.settingsGroup}>
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Starred Messages')}>
          <View style={[s.settingIcon, { backgroundColor: '#FEF3C7' }]}><Feather name="star" size={16} color="#D97706" /></View>
          <Text style={s.settingText}>Starred Messages</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={s.settingDiv} />
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Pinned Messages')}>
          <View style={[s.settingIcon, { backgroundColor: '#EFF6FF' }]}><Feather name="bookmark" size={16} color="#2D8CFF" /></View>
          <Text style={s.settingText}>Pinned Messages</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={s.settingDiv} />
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Scheduled Messages')}>
          <View style={[s.settingIcon, { backgroundColor: '#FFF7ED' }]}><Feather name="clock" size={16} color="#F26D21" /></View>
          <Text style={s.settingText}>Scheduled Messages</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionHeader}>PREFERENCES</Text>
      <View style={s.settingsGroup}>
        <TouchableOpacity style={s.settingRow} onPress={() => setMuted(!muted)}>
          <View style={[s.settingIcon, { backgroundColor: muted ? '#FEE2E2' : '#D1FAE5' }]}><Feather name={muted ? 'bell-off' : 'bell'} size={16} color={muted ? '#EF4444' : '#10B981'} /></View>
          <Text style={s.settingText}>Notifications</Text>
          <Text style={s.settingVal}>{muted ? 'Muted' : 'Active'}</Text>
        </TouchableOpacity>
        <View style={s.settingDiv} />
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Wallpaper & Themes')}>
          <View style={[s.settingIcon, { backgroundColor: '#E0F2FE' }]}><Feather name="image" size={16} color="#0284C7" /></View>
          <Text style={s.settingText}>Wallpaper & Pattern</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionHeader}>CHAT CONTROLS</Text>
      <View style={s.settingsGroup}>
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Export Chat')}>
          <View style={[s.settingIcon, { backgroundColor: '#F1F5F9' }]}><Feather name="download" size={16} color="#475569" /></View>
          <Text style={s.settingText}>Export Chat History</Text>
        </TouchableOpacity>
        <View style={s.settingDiv} />
        <TouchableOpacity style={s.settingRow} onPress={() => handleAction('Clear Chat')}>
          <View style={[s.settingIcon, { backgroundColor: '#FEE2E2' }]}><Feather name="trash-2" size={16} color="#EF4444" /></View>
          <Text style={[s.settingText, { color: '#EF4444' }]}>Clear Chat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function ChatMediaGalleryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, title } = route.params || {};
  const [activeTab, setActiveTab] = useState('images');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tab = activeTab) => {
    if (tab === 'settings') return;
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

  const renderContent = () => {
    if (activeTab === 'settings') return <OptionsPanel title={title} />;
    if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#2D8CFF" /></View>;
    if (!items.length) return (
      <View style={s.empty}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>
          {activeTab === 'images' ? '🖼️' : activeTab === 'transactions' ? '💰' : '📄'}
        </Text>
        <Text style={s.emptyTitle}>No shared {activeTab} yet</Text>
        <Text style={s.emptySub}>Media sent in this chat will appear here.</Text>
      </View>
    );
    if (activeTab === 'images') return <ImageGrid items={items} />;
    if (activeTab === 'transactions' || activeTab === 'receipts') return <TransactionList items={items} />;
    return <FileList items={items} />;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Chat Details & Media</Text>
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
            <Feather name={tab.icon} size={15} color={activeTab === tab.key ? '#2D8CFF' : '#747487'} />
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
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sub: { fontSize: 12, color: '#64748B', marginTop: 1 },

  tabBar: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 3 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2D8CFF' },
  tabText: { fontSize: 10, fontWeight: '600', color: '#747487' },
  tabTextActive: { color: '#2D8CFF', fontWeight: '700' },

  fileItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  fileIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  fileName: { fontSize: 13, fontWeight: '700', color: '#232333' },
  fileSub: { fontSize: 11, color: '#747487', marginTop: 2 },
  dlBtn: { padding: 6 },

  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  txIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txLabel: { fontSize: 13, fontWeight: '700', color: '#232333' },
  txSub: { fontSize: 11, color: '#747487', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#232333', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#747487', textAlign: 'center', marginTop: 4 },

  optionsContainer: { flex: 1, padding: 16 },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileAvatarText: { fontSize: 26, fontWeight: '800', color: '#2D8CFF' },
  profileName: { fontSize: 18, fontWeight: '800', color: '#232333' },
  profileStatus: { fontSize: 12, color: '#747487', marginTop: 2 },

  sectionHeader: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  settingsGroup: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#E2E8F0' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  settingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  settingText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  settingVal: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  settingDiv: { height: 0.5, backgroundColor: '#F1F5F9', marginLeft: 56 },
});
