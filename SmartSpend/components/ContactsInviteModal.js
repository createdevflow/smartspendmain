// components/ContactsInviteModal.js — Standard Modal implementation for flawless bottom-sheet stacking & in-app user invites
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, TextInput, Platform, KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { api } from '../utils/api';

export default function ContactsInviteModal({ visible, onClose, cashbook, fetchMembers, inviteRole: initialRole = 'VIEWER' }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState({}); // phone -> user object
  const [globalResults, setGlobalResults] = useState([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole);

  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      setContacts([]);
      setRegisteredUsers({});
      setGlobalResults([]);
      setSearch('');
    }
  }, [visible]);

  useEffect(() => {
    if (!search.trim() || search.trim().length < 2) {
      setGlobalResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingGlobal(true);
      try {
        const res = await api.get('/chat/contacts/search', { params: { q: search.trim() } });
        setGlobalResults(res.data?.data || res.data || []);
      } catch {
        setGlobalResults([]);
      } finally {
        setSearchingGlobal(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
      });

      if (data.length > 0) {
        const validContacts = data
          .filter((c) => c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c) => ({
            id: c.id,
            name: c.name || 'Unknown Contact',
            phone: c.phoneNumbers[0].number,
            normalized: c.phoneNumbers[0].number.replace(/[\s\-\(\)]/g, ''),
          }));
        
        const uniqueContacts = [];
        const seen = new Set();
        for (const c of validContacts) {
          if (!seen.has(c.normalized)) {
            seen.add(c.normalized);
            uniqueContacts.push(c);
          }
        }
        uniqueContacts.sort((a, b) => a.name.localeCompare(b.name));
        setContacts(uniqueContacts);
        await syncWithBackend(uniqueContacts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const syncWithBackend = async (uniqueContacts) => {
    try {
      const phoneNumbers = uniqueContacts.map(c => c.phone);
      const res = await api.post('/users/contacts/sync', { phoneNumbers });
      const users = res.data?.data || res.data || [];
      const map = {};
      users.forEach(u => {
        if (u.phone) {
          const norm = u.phone.replace(/[\s\-\(\)]/g, '');
          map[norm] = u;
        }
      });
      setRegisteredUsers(map);
    } catch (e) {
      console.error('Sync error:', e);
    }
  };

  const handleAddMember = async (user) => {
    if (!cashbook) return;
    try {
      await api.post(`/cashbooks/${cashbook.id}/members`, { userId: user.id, email: user.email, role: selectedRole });
      Alert.alert('Invitation Sent', `Invited ${user.fullName || user.name || user.email || user.phone || 'user'} as ${selectedRole}`);
      if (fetchMembers) fetchMembers(cashbook.id);
      onClose();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleSendSMS = (contact) => {
    if (!cashbook) return;
    const msg = `Hey ${contact.name}, join my cashbook "${cashbook.name}" on Cashtro to track our expenses!`;
    const url = Platform.OS === 'ios' ? `sms:${contact.phone}&body=${encodeURIComponent(msg)}` : `sms:${contact.phone}?body=${encodeURIComponent(msg)}`;
    Linking.openURL(url);
  };

  const renderContact = ({ item }) => {
    const registeredUser = registeredUsers[item.normalized];
    return (
      <View style={styles.contactRow}>
        <View style={styles.contactAvatar}>
          <Text style={styles.contactInitials}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
        {registeredUser ? (
          <TouchableOpacity style={styles.addButton} onPress={() => handleAddMember(registeredUser)}>
            <Feather name="user-plus" size={15} color="#fff" />
            <Text style={styles.addButtonText}>Invite</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.smsButton} onPress={() => handleSendSMS(item)}>
            <Feather name="message-circle" size={15} color="#1D4ED8" />
            <Text style={styles.smsButtonText}>SMS</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderGlobalUser = (u) => (
    <View key={u.id} style={styles.contactRow}>
      <View style={[styles.contactAvatar, { backgroundColor: '#DBEAFE' }]}>
        <Text style={[styles.contactInitials, { color: '#1D4ED8' }]}>{u.fullName?.charAt(0).toUpperCase() || 'U'}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{u.fullName}</Text>
        <Text style={styles.contactPhone}>{u.email || u.phone}</Text>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddMember(u)}>
        <Feather name="user-plus" size={15} color="#fff" />
        <Text style={styles.addButtonText}>Invite</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Invite to Cashbook</Text>
              {cashbook && <Text style={styles.sub}>{cashbook.name}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.rolePicker}>
            <Text style={styles.roleLabel}>Access Type:</Text>
            <View style={styles.roleBtns}>
              {['VIEWER', 'EDITOR'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, selectedRole === role && styles.roleBtnActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.roleBtnText, selectedRole === role && styles.roleBtnTextActive]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, email, or phone number..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#2D8CFF" />
              <Text style={styles.loadingText}>Syncing contacts...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={renderContact}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={15}
              ListHeaderComponent={
                globalResults.length > 0 || searchingGlobal ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionHeader}>Cashtro Registered Users</Text>
                    {searchingGlobal && <ActivityIndicator size="small" color="#2D8CFF" style={{ marginVertical: 8 }} />}
                    {globalResults.map(renderGlobalUser)}
                    {filteredContacts.length > 0 && <Text style={[styles.sectionHeader, { marginTop: 16 }]}>Phone Contacts</Text>}
                  </View>
                ) : (searchingGlobal ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#2D8CFF" />
                    <Text style={styles.loadingText}>Searching Cashtro network...</Text>
                  </View>
                ) : null)
              }
              ListEmptyComponent={
                globalResults.length === 0 && !searchingGlobal ? (
                  <View style={styles.center}>
                    <Feather name="users" size={44} color="#E5E7EB" style={{ marginBottom: 12 }} />
                    <Text style={styles.loadingText}>No contacts found</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouch: { flex: 1 },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '88%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  closeBtn: { padding: 4 },
  
  rolePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6',
  },
  roleLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  roleBtns: { flexDirection: 'row', gap: 6 },
  roleBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  roleBtnActive: { backgroundColor: '#2D8CFF' },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  roleBtnTextActive: { color: '#fff' },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#111827', padding: 0 },
  
  listContent: { paddingBottom: 24 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  loadingText: { color: '#6B7280', marginTop: 8, fontSize: 14 },
  
  contactRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  contactAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#E0E7FF',
    alignItems: 'center', justifyContent: 'center',
  },
  contactInitials: { fontSize: 15, fontWeight: '700', color: '#2D8CFF' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  contactPhone: { fontSize: 13, color: '#6B7280' },
  
  addButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2D8CFF',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, gap: 5,
  },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  smsButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, gap: 5,
  },
  smsButtonText: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
  sectionHeader: {
    fontSize: 11, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 6,
  },
});
