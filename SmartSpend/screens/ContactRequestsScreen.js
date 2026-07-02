// screens/ContactRequestsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../utils/api';
import { useChat } from '../context/ChatContext';

function Avatar({ name, size = 44 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

export default function ContactRequestsScreen() {
  const navigation = useNavigation();
  const { acceptContactRequest } = useChat();
  const [requests, setRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('requests'); // requests | contacts

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, conRes] = await Promise.all([
        api.get('/chat/contacts/requests'),
        api.get('/chat/contacts'),
      ]);
      setRequests(reqRes.data?.data || []);
      setContacts(conRes.data?.data || []);
    } catch (e) {
      console.error('Failed to load contacts', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(); }, [fetchData]);

  const handleAccept = async (req) => {
    try {
      await acceptContactRequest(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not accept request');
    }
  };

  const handleReject = async (req) => {
    try {
      await api.patch(`/chat/contacts/${req.id}/reject`);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch {}
  };

  const handleBlock = (contact) => {
    Alert.alert('Block User', `Block ${contact.contact?.fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          await api.patch(`/chat/contacts/${contact.contact?.id}/block`).catch(() => {});
          fetchData();
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contacts</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['requests', 'contacts'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'requests' ? `Requests${requests.length > 0 ? ` (${requests.length})` : ''}` : 'My Contacts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#1D4ED8" />
        </View>
      ) : tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.reqItem}>
              <Avatar name={item.fromUser?.fullName} />
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{item.fromUser?.fullName || 'Unknown'}</Text>
                <Text style={styles.reqEmail}>{item.fromUser?.email || ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item)}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item)}
              >
                <Feather name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🤝</Text>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyText}>
                When someone sends you a contact request, it will appear here.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.reqItem}>
              <Avatar name={item.contact?.fullName} />
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{item.contact?.fullName || 'Unknown'}</Text>
                <Text style={styles.reqEmail}>{item.contact?.email || ''}</Text>
              </View>
              <TouchableOpacity
                style={styles.blockBtn}
                onPress={() => handleBlock(item)}
              >
                <Feather name="slash" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
              <Text style={styles.emptyTitle}>No contacts yet</Text>
              <Text style={styles.emptyText}>
                Search for Cashtro users in the Messages tab and start a conversation!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },

  tabs: {
    flexDirection: 'row',
    margin: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#1D4ED8', fontWeight: '700' },

  reqItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F9FAFB',
    gap: 12,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: '#fff' },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  reqEmail: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },

  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1D4ED8', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  blockBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, marginTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
});
