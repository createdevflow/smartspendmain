// screens/ChatScreen.js — Financial Communication Hub - Chat Room
import React, {
  useState, useEffect, useRef, useCallback, useContext, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, Keyboard, ActivityIndicator, Image, ImageBackground, ScrollView,
  Modal, Pressable, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';
import { useChat } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import { useTransactions } from '../context/TransactionsContext';
import { useBooks } from '../context/BooksContext';
import ScheduleMessageSheet from '../components/chat/ScheduleMessageSheet';
import { getCurrencySymbol } from '../utils/planFeatures';
import { api } from '../utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QuickEntrySheet from '../components/QuickEntrySheet';

const DATE_FORMAT = { day: '2-digit', month: 'short', year: 'numeric' };

function DateSeparator({ date }) {
  const label = (() => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <View style={styles.dateSepContainer}>
      <View style={styles.dateChip}>
        <Text style={styles.dateChipText}>{label}</Text>
      </View>
    </View>
  );
}

// ── Voice Recording Button + inline recording bar ─────────────────────────────
// Props: onVoiceSent(uri, durationSec), isRecording (state lifted to ChatScreen), setIsRecording
function VoiceRecordButton({ onVoiceSent, isRecording, setIsRecording }) {
  const [durationSec, setDurationSec] = useState(0);
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const dotAnim = useRef(new Animated.Value(1)).current;
  const dotLoop = useRef(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record voice messages.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
      setDurationSec(0);
      timerRef.current = setInterval(() => setDurationSec((s) => s + 1), 1000);
      dotLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      dotLoop.current.start();
    } catch {
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const cancelRecording = async () => {
    clearInterval(timerRef.current);
    dotLoop.current?.stop();
    dotAnim.setValue(1);
    setIsRecording(false);
    setDurationSec(0);
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
      recordingRef.current = null;
    }
  };

  const stopAndSend = async () => {
    if (!recordingRef.current) return;
    clearInterval(timerRef.current);
    dotLoop.current?.stop();
    dotAnim.setValue(1);
    setIsRecording(false);
    const dur = durationSec;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setDurationSec(0);
      if (uri && dur >= 1) onVoiceSent(uri, dur);
    } catch {
      recordingRef.current = null;
      Alert.alert('Error', 'Could not save voice message');
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isRecording) {
    // Full-width inline recording bar — rendered by the parent input bar
    return (
      <>
        {/* Cancel */}
        <TouchableOpacity onPress={cancelRecording} style={styles.recCancelBtn} activeOpacity={0.7}>
          <Feather name="x" size={20} color="#EF4444" />
        </TouchableOpacity>
        {/* Dot + timer */}
        <View style={styles.recBarInner}>
          <Animated.View style={[styles.recDot, { opacity: dotAnim }]} />
          <Text style={styles.recTimer}>{fmt(durationSec)}</Text>
          {/* Mini waveform bars */}
          <View style={styles.recWaveRow}>
            {Array.from({ length: 18 }).map((_, i) => (
              <View key={i} style={[styles.recWaveBar, { height: 6 + (i % 3) * 6 }]} />
            ))}
          </View>
        </View>
        {/* Send */}
        <TouchableOpacity onPress={stopAndSend} style={styles.recSendBtn} activeOpacity={0.8}>
          <Feather name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </>
    );
  }

  return (
    <TouchableOpacity onPress={startRecording} style={styles.micBtn} activeOpacity={0.75}>
      <Feather name="mic" size={22} color="#2D8CFF" />
    </TouchableOpacity>
  );
}

// ── Picker Modal (reusable) ───────────────────────────────────────────────────
function PickerModal({ visible, onClose, title, items, renderItem, keyExtractor, emptyText, onCreatePress, insets }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheetModal, { maxHeight: '80%', paddingBottom: Math.max(insets?.bottom || 0, 28) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderModal}>
            <Text style={styles.sheetTitleModal}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color="#374151" /></TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Feather name="inbox" size={36} color="#D1D5DB" />
                <Text style={{ color: '#9CA3AF', marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                  {emptyText || 'Nothing to share yet'}
                </Text>
                {onCreatePress && (
                  <TouchableOpacity
                    onPress={() => { onClose(); onCreatePress(); }}
                    style={{ marginTop: 16, backgroundColor: '#2D8CFF', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Create One Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, title, conversationType } = route.params || {};
  const isNotesSelf = title === 'My Notes' || conversationType === 'NOTES_SELF';

  const { user } = useContext(AuthContext);
  const { transactions, refreshTransactions } = useTransactions();
  const { refreshBooks } = useBooks();
  const {
    getMessages, sendMessage, editMessage, deleteMessage,
    reactToMessage, sendTyping, markRead, typingUsers,
    analyzeNoteMessage, executeNoteAction
  } = useChat();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showTxPicker, setShowTxPicker] = useState(false);
  const [txPickerMode, setTxPickerMode] = useState('TRANSACTION'); // 'TRANSACTION' | 'RECEIPT'
  const [showScheduleSheet, setShowScheduleSheet] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [budgetList, setBudgetList] = useState([]);
  const [goalList, setGoalList] = useState([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const flatRef = useRef(null);
  const typingTimer = useRef(null);
  const quickEntryRef = useRef(null);
  const [smartActionData, setSmartActionData] = useState(null);

  // ── Socket listener ────────────────────────────────────────────────────
  const { socket } = useChat();
  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (msg) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      markRead(conversationId);
    };
    const onEdited = ({ messageId, content, metadata }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === messageId ? { ...m, content, metadata: metadata || m.metadata, isEdited: true } : m
      ));
    };
    const onDeleted = ({ messageId }) => {
      setMessages((prev) => prev.map((m) =>
        m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: null } : m
      ));
    };
    const onReaction = ({ messageId, userId, emoji, removed }) => {
      setMessages((prev) => prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = removed
          ? (m.reactions || []).filter((r) => !(r.userId === userId && r.emoji === emoji))
          : [...(m.reactions || []), { userId, emoji }];
        return { ...m, reactions };
      }));
    };
    const onRead = ({ userId }) => {
      if (userId !== user?.id) {
        setMessages((prev) => prev.map((m) =>
          m.senderId === user?.id && m.status !== 'READ' ? { ...m, status: 'READ' } : m
        ));
      }
    };
    socket.on('message.new', onNewMessage);
    socket.on('message.edited', onEdited);
    socket.on('message.deleted', onDeleted);
    socket.on('message.reaction', onReaction);
    socket.on('message.read', onRead);
    return () => {
      socket.off('message.new', onNewMessage);
      socket.off('message.edited', onEdited);
      socket.off('message.deleted', onDeleted);
      socket.off('message.reaction', onReaction);
      socket.off('message.read', onRead);
    };
  }, [socket, conversationId]);

  // ── Load history ──────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setIsLoading(false);
      markRead(conversationId);
    }).catch(() => setIsLoading(false));
  }, [conversationId]);

  // ── Typing ────────────────────────────────────────────────────────────
  const handleInputChange = (text) => {
    setInput(text);
    sendTyping(conversationId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(conversationId, false), 2000);
  };

  // ── Send text ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text && !editingMsg) return;
    try {
      setIsSending(true);
      if (editingMsg) {
        editMessage(editingMsg.id, text, conversationId);
        setMessages((prev) => prev.map((m) =>
          m.id === editingMsg.id ? { ...m, content: text, isEdited: true } : m
        ));
        setEditingMsg(null);
      } else {
        const msg = await sendMessage({
          conversationId, content: text, type: 'TEXT',
          replyToId: replyTo?.id,
        });
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        setReplyTo(null);
        if (isNotesSelf) {
          analyzeNoteMessage(msg.id)
            .then((resData) => {
              if (resData?.aiReply) {
                setMessages((prev) => prev.some((m) => m.id === resData.aiReply.id) ? prev : [...prev, resData.aiReply]);
                setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
              }
              if (refreshTransactions) refreshTransactions();
              if (refreshBooks) refreshBooks();
            })
            .catch((e) => console.log('Auto-analyze failed', e));
        }
      }
      setInput('');
      sendTyping(conversationId, false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // ── Send any message helper ───────────────────────────────────────────
  const pushMessage = async (payload) => {
    try {
      const msg = await sendMessage({ conversationId, ...payload });
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send');
    }
  };

  // ── Image pick ────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.55, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const b64 = result.assets[0].base64;
      await pushMessage({ type: 'IMAGE', content: `data:image/jpeg;base64,${b64}` });
    }
  };

  // ── Document pick (real local file) ──────────────────────────────────
  const handlePickDocument = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const sizeMB = file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : '';
      const ext = file.name?.split('.').pop() || 'file';
      // Read as base64 for small files (≤ 5MB), otherwise just send URI reference
      let fileContent = file.uri;
      if (file.size && file.size <= 5 * 1024 * 1024) {
        try {
          fileContent = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          fileContent = `data:${file.mimeType || 'application/octet-stream'};base64,${fileContent}`;
        } catch {
          fileContent = file.uri;
        }
      }
      await pushMessage({
        type: 'DOCUMENT',
        content: '',
        metadata: {
          filename: file.name,
          title: file.name,
          size: sizeMB,
          mimeType: file.mimeType || 'application/octet-stream',
          uri: fileContent,
          localUri: file.uri,
        },
      });
    } catch (e) {
      Alert.alert('Error', 'Could not pick document');
    }
  };

  // ── Voice recorded ────────────────────────────────────────────────────
  const handleVoiceSent = useCallback(async (uri, durationSec) => {
    try {
      // Read voice as base64 to embed in message
      let voiceContent = uri;
      try {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        voiceContent = `data:audio/m4a;base64,${b64}`;
      } catch {
        voiceContent = uri;
      }
      await pushMessage({
        type: 'VOICE',
        content: '',
        metadata: {
          uri: voiceContent,
          localUri: uri,
          durationSec,
          title: 'Voice Message',
        },
      });
    } catch {
      Alert.alert('Error', 'Could not send voice message');
    }
  }, [conversationId]);

  // ── Share transaction / receipt ───────────────────────────────────────
  const handleShareTransaction = async (tx, asReceipt = false) => {
    setShowTxPicker(false);
    await pushMessage({
      type: asReceipt ? 'RECEIPT' : 'TRANSACTION',
      content: '',
      metadata: {
        transactionId: tx.id,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || 'INR',
        category: tx.category?.name || tx.category,
        date: tx.date,
        notes: tx.notes,
        cashbookName: tx.cashbookName,
      },
    });
  };

  // ── Share budget (real picker) ────────────────────────────────────────
  const openBudgetPicker = async () => {
    setShowAttachMenu(false);
    try {
      const res = await api.get('/budgets');
      const list = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      // Enrich with progress data for each budget
      const enriched = await Promise.all(list.map(async (b) => {
        try {
          const p = await api.get(`/budgets/${b.id}/progress`);
          const prog = p.data?.data || p.data || {};
          return { ...b, spent: Number(prog.spent || prog.spentAmount || b.spent || 0) };
        } catch { return b; }
      }));
      setBudgetList(enriched);
    } catch {
      setBudgetList([]);
    }
    setShowBudgetPicker(true);
  };

  const handleShareBudget = async (budget) => {
    setShowBudgetPicker(false);
    const limit = Number(budget.amount || budget.limitAmount || budget.limit || 1);
    const spent = Number(budget.spent || budget.spentAmount || 0);
    await pushMessage({
      type: 'BUDGET',
      content: '',
      metadata: {
        budgetId: budget.id,
        name: budget.category || budget.name || 'Budget',
        spent,
        limit,
        period: budget.period || 'Monthly',
        cashbookName: budget.cashbookName || '',
      },
    });
  };

  // ── Share goal (real picker) ──────────────────────────────────────────
  const openGoalPicker = async () => {
    setShowAttachMenu(false);
    try {
      const res = await api.get('/goals');
      const list = Array.isArray(res.data?.data) ? res.data.data
        : Array.isArray(res.data) ? res.data : [];
      setGoalList(list);
    } catch {
      setGoalList([]);
    }
    setShowGoalPicker(true);
  };

  const handleShareGoal = async (goal) => {
    setShowGoalPicker(false);
    await pushMessage({
      type: 'GOAL',
      content: '',
      metadata: {
        goalId: goal.id,
        name: goal.name || goal.title || 'Goal',
        emoji: goal.emoji || '🎯',
        current: Number(goal.currentAmount || 0),
        target: Number(goal.targetAmount || 1),
        deadline: goal.deadline || null,
        currency: goal.currency || 'INR',
      },
    });
  };

  // ── Share report (real analytics dashboard) ──────────────────────────
  const handleShareReport = async () => {
    setShowAttachMenu(false);
    try {
      const now = new Date();
      const month = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      // Use /analytics/dashboard which is the real endpoint
      const res = await api.get('/analytics/dashboard');
      const data = res.data?.data || res.data || {};
      const income = Number(data.totalIncome || data.income || data.monthlyIncome || 0);
      const expense = Number(data.totalExpense || data.expense || data.monthlyExpense || 0);
      await pushMessage({
        type: 'REPORT',
        content: '',
        metadata: {
          title: 'Monthly Financial Report',
          month,
          cashbookName: data.cashbookName || '',
          totalIncome: income,
          totalExpense: expense,
          net: income - expense,
        },
      });
    } catch (e) {
      Alert.alert('Error', 'Could not load report data. Make sure you have transactions this month.');
    }
  };

  // ── View pressed on a financial card ─────────────────────────────────
  const handleViewFinancial = useCallback(async (message) => {
    const msgType = (message.type || '').toUpperCase();
    const meta = message.metadata || {};

    if (msgType === 'TRANSACTION' || msgType === 'RECEIPT') {
      if (meta.transactionId) {
        navigation.navigate('MainTabs', { screen: 'Transactions', params: { highlightId: meta.transactionId } });
      }
    } else if (msgType === 'DOCUMENT') {
      const uri = meta.localUri || meta.uri || '';
      try {
        if (uri.startsWith('data:')) {
          // Write base64 to a temp file and open it
          const base64Data = uri.split(',')[1];
          const ext = (meta.filename || 'file').split('.').pop() || 'pdf';
          const tempPath = `${FileSystem.cacheDirectory}shared_doc_${Date.now()}.${ext}`;
          await FileSystem.writeAsStringAsync(tempPath, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(tempPath);
          } else {
            await Linking.openURL(tempPath);
          }
        } else if (uri) {
          if (uri.startsWith('file://') && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          } else {
            await Linking.openURL(uri);
          }
        } else {
          Alert.alert('Document', `${meta.filename || 'Document'}\n${meta.size || ''}`);
        }
      } catch (e) {
        Alert.alert('Cannot Open', `Your device cannot open this file type (.${(meta.filename || '').split('.').pop()}).\nFilename: ${meta.filename || 'Unknown'}`);
      }
    } else if (msgType === 'BUDGET') {
      navigation.navigate('MainTabs', { screen: 'Wealth' });
    } else if (msgType === 'GOAL') {
      navigation.navigate('MainTabs', { screen: 'Wealth' });
    }
  }, [navigation]);

  // ── Header options ────────────────────────────────────────────────────
  const handleHeaderOptions = () => {
    Alert.alert('Chat Options', '', [
      { text: 'Media & Files', onPress: () => navigation.navigate('ChatMediaGallery', { conversationId, title }) },
      {
        text: 'Pinned Messages', onPress: async () => {
          try {
            const res = await api.get(`/chat/conversations/${conversationId}/pinned`);
            const pins = res.data?.data || res.data || [];
            if (!pins.length) { Alert.alert('No Pinned Messages'); return; }
            Alert.alert('Pinned Messages', pins.map((p) => p.content || '(media)').join('\n'));
          } catch { Alert.alert('Error', 'Could not load pinned messages'); }
        },
      },
      { text: 'Starred Messages', onPress: () => navigation.navigate('StarredMessages') },
      {
        text: 'Mute Notifications', onPress: () => {
          api.patch(`/chat/conversations/${conversationId}/notif-pref`, { notifPref: 'MUTE' })
            .then(() => Alert.alert('Muted', 'Notifications muted for this chat.'))
            .catch(() => Alert.alert('Error', 'Failed to mute'));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ], { cancelable: true });
  };

  // ── Smart Action Handler (AI Notes) ──────────────────────────────────
  const handleSmartAction = useCallback(async (action) => {
    if (action.type === 'view_transactions') {
      if (refreshTransactions) await refreshTransactions();
      if (refreshBooks) await refreshBooks();
      navigation.navigate('MainTabs', { screen: 'Transactions' });
      return;
    }
    if (action.type === 'view_tasks') {
      navigation.navigate('PaymentReminders');
      return;
    }
    if (action.type === 'transaction') {
      setSmartActionData({
        type: action.data.type === 'INCOME' ? 'in' : 'out',
        amount: action.data.amount?.toString(),
        merchant: action.data.merchant,
        notes: action.data.merchant ? `Paid ${action.data.merchant}` : '',
      });
      setTimeout(() => {
        quickEntryRef.current?.present();
      }, 300);
    } else if (action.type === 'task') {
      Alert.alert('Task', `You selected to add task: ${action.data.task}`);
    }
  }, [navigation, refreshTransactions, refreshBooks]);

  // ── Message actions ───────────────────────────────────────────────────
  const handleReact = useCallback((msgId, emoji, convId) => {
    reactToMessage(msgId, emoji, convId || conversationId);
  }, [reactToMessage, conversationId]);

  const handleEdit = useCallback((msg) => {
    setEditingMsg(msg); setInput(msg.content || '');
  }, []);

  const handleDelete = useCallback((msgId) => {
    deleteMessage(msgId);
    setMessages((prev) => prev.map((m) =>
      m.id === msgId ? { ...m, deletedAt: new Date().toISOString(), content: null } : m
    ));
  }, [deleteMessage]);

  const handleCopy = useCallback((text) => Clipboard.setStringAsync(text), []);

  const handleStar = useCallback(async (msg) => {
    try {
      await api.post(`/chat/messages/${msg.id}/star`);
      Alert.alert('⭐ Starred', 'Message added to starred messages');
    } catch { Alert.alert('Error', 'Could not star message'); }
  }, []);

  const handlePin = useCallback(async (msg) => {
    try {
      if (msg.isPinned) {
        await api.post(`/chat/messages/${msg.id}/unpin`, { conversationId });
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isPinned: false } : m));
      } else {
        await api.post(`/chat/messages/${msg.id}/pin`, { conversationId });
        setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isPinned: true } : m));
      }
    } catch { Alert.alert('Error', 'Could not pin message'); }
  }, [conversationId]);

  const handleForward = useCallback((msg) => {
    Alert.alert('Forward Message', 'Forward to My Notes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Forward', onPress: async () => {
          try {
            const notes = await api.get('/chat/notes');
            const notesId = notes.data?.data?.id || notes.data?.id;
            if (notesId) {
              await api.post(`/chat/messages/${msg.id}/forward`, { conversationIds: [notesId] });
              Alert.alert('Forwarded ✓');
            }
          } catch { Alert.alert('Error', 'Could not forward message'); }
        },
      },
    ]);
  }, []);

  const handleRemind = useCallback((msg) => {
    Alert.alert('Remind Me', '', [
      {
        text: 'In 1 Hour', onPress: async () => {
          const remindAt = new Date(Date.now() + 60 * 60000);
          await api.post(`/chat/messages/${msg.id}/remind`, { remindAt: remindAt.toISOString() });
          Alert.alert('Reminder Set ✓', `Reminding you at ${remindAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`);
        },
      },
      {
        text: 'Tomorrow Morning', onPress: async () => {
          const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
          await api.post(`/chat/messages/${msg.id}/remind`, { remindAt: d.toISOString() });
          Alert.alert('Reminder Set ✓', 'Reminding you tomorrow morning');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  // ── Schedule message ──────────────────────────────────────────────────
  const handleScheduleMessage = useCallback(async ({ scheduledAt, repeatType }) => {
    const text = input.trim();
    if (!text) { Alert.alert('No Message', 'Type a message first to schedule it'); return; }
    try {
      await api.post('/communication/messages/schedule', {
        conversationId, type: 'TEXT', content: text,
        scheduledAt: scheduledAt.toISOString(), repeatType,
      });
      setInput('');
      Alert.alert('Scheduled ✓', `Your message will be sent at ${scheduledAt.toLocaleString('en-IN')}`);
    } catch { Alert.alert('Error', 'Could not schedule message'); }
  }, [input, conversationId]);

  // ── Build grouped message list (memoized — only recomputes when messages change) ─
  const groupedMessages = React.useMemo(() => {
    const result = [];
    const seenMsgIds = new Set();
    let lastDate = null;
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || (msg.id && seenMsgIds.has(msg.id))) continue;
      if (msg.id) seenMsgIds.add(msg.id);
      const msgDate = new Date(msg.createdAt || Date.now()).toDateString();
      if (msgDate !== lastDate) {
        result.push({ rowType: 'date', date: msg.createdAt, key: `date-${msg.createdAt || Date.now()}` });
        lastDate = msgDate;
      }
      result.push({ ...msg, rowType: 'message', key: msg.id ? `msg-${msg.id}` : `msg-temp-${i}` });
    }
    return result;
  }, [messages]);

  // Keep a stable ref to groupedMessages for use inside renderItem (avoids dep-churn)
  const groupedMessagesRef = useRef(groupedMessages);
  useEffect(() => { groupedMessagesRef.current = groupedMessages; }, [groupedMessages]);

  const otherTypingUsers = [...(typingUsers[conversationId] || [])].filter((uid) => uid !== user?.id && uid !== user?._id);
  const isOtherTyping = otherTypingUsers.length > 0;

  const quickSuggestions = useMemo(() => {
    const baseTopics = [
      '📊 What is my current daily burn rate and runway?',
      '☕ Coffee 150',
      '🍔 Lunch 250',
      '🔍 Analyze my top spending categories this month',
      '🛒 Groceries 1200',
      '📈 How can I boost my monthly savings ratio?',
      '🎯 Set a monthly budget goal of ₹25,000',
      '🚕 Cab 200',
      '💡 Give me tips to reduce discretionary shopping',
      '💵 Income: Salary or Freelance Project 25000'
    ];
    const recent = (transactions || []).slice(0, 5).map(t => {
      if (t.merchant && t.amount) return `${t.type === 'INCOME' ? '💵 Income:' : '💰 Expense:'} ${t.merchant} ${t.amount}`;
      return null;
    }).filter(Boolean);
    return Array.from(new Set([...baseTopics, ...recent]));
  }, [transactions]);

  const renderMessageItem = useCallback(({ item, index }) => {
    if (item.rowType === 'date') return <DateSeparator date={item.date} />;
    const gm = groupedMessagesRef.current;
    const prevItem = gm[index - 1];
    const nextItem = gm[index + 1];
    
    const isBotItem = (m) => Boolean(
      m?.metadata?.isAiBotResponse ||
      (typeof m?.content === 'string' && (
        m.content.includes('**AI Assistant Insight**') ||
        m.content.includes('**AI Agent Execution Insight**') ||
        m.content.includes('🤖 **AI') ||
        m.content.includes('✨ **AI Agent')
      )) ||
      m?.sender?.fullName === 'AI Agent' ||
      m?.sender?.fullName === 'AI Assistant' ||
      m?.senderId === 'AI_BOT'
    );
    const isBot = isBotItem(item);
    const prevBot = isBotItem(prevItem);
    const nextBot = isBotItem(nextItem);
    const isConsecutivePrev = prevItem?.rowType === 'message' && (isBot ? prevBot : (!prevBot && prevItem.senderId === item.senderId));
    const isConsecutiveNxt = nextItem?.rowType === 'message' && (isBot ? nextBot : (!nextBot && nextItem.senderId === item.senderId));

    return (
      <MessageBubble
        message={{
          ...item,
          sender: isBot ? { fullName: 'AI Assistant', avatar: null } : item.sender
        }}
        isOwn={!isBot && item.senderId === user?.id}
        isConsecutivePrevious={isConsecutivePrev}
        isConsecutiveNext={isConsecutiveNxt}
        onReply={setReplyTo}
        onReact={handleReact}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCopy={handleCopy}
        onStar={handleStar}
        onPin={handlePin}
        onForward={handleForward}
        onRemind={handleRemind}
        onSchedule={() => { setInput(item.content || ''); setShowScheduleSheet(true); }}
        onViewPress={handleViewFinancial}
        isNotesSelf={isNotesSelf}
        onAIAction={(action) => executeNoteAction(item.id, action).then((resData) => {
          if (resData?.aiReply) {
            setMessages((prev) => prev.some((m) => m.id === resData.aiReply.id) ? prev : [...prev, resData.aiReply]);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
          }
        })}
        onSmartAction={handleSmartAction}
      />
    );
  }, [user?.id, handleReact, handleEdit, handleDelete, handleCopy, handleStar, handlePin, handleForward, handleRemind, handleViewFinancial, isNotesSelf, executeNoteAction, handleSmartAction]);

  const hasText = input.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {otherTypingUsers.length > 0 ? (
            <Text style={styles.typingLabel}>typing...</Text>
          ) : (
            <Text style={styles.onlineLabel} />
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={styles.headerAction}
            onPress={() => navigation.navigate('ChatMediaGallery', { conversationId, title })}>
            <Feather name="image" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction} onPress={handleHeaderOptions}>
            <Feather name="more-vertical" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={{ flex: 1, padding: 16, gap: 24, justifyContent: 'flex-end' }}>
            <View style={{ width: '70%', height: 60, backgroundColor: '#F3F4F6', borderRadius: 20, alignSelf: 'flex-start' }} />
            <View style={{ width: '60%', height: 40, backgroundColor: '#E2E8F0', borderRadius: 20, alignSelf: 'flex-end' }} />
            <View style={{ width: '80%', height: 80, backgroundColor: '#F3F4F6', borderRadius: 20, alignSelf: 'flex-start' }} />
            <View style={{ width: '50%', height: 50, backgroundColor: '#E2E8F0', borderRadius: 20, alignSelf: 'flex-end' }} />
            <View style={{ width: '65%', height: 60, backgroundColor: '#F3F4F6', borderRadius: 20, alignSelf: 'flex-start' }} />
          </View>
        ) : (
          <ImageBackground source={require('../assets/images/chat_bg.png')} style={{ flex: 1 }} resizeMode="cover">
            <FlatList
              ref={flatRef}
              data={groupedMessages}
              keyExtractor={(item, index) => item.key || item.id || index.toString()}
              renderItem={renderMessageItem}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
              windowSize={7}
              removeClippedSubviews={true}
              contentContainerStyle={{ paddingVertical: 16, paddingBottom: 28, flexGrow: 1 }}
              ListEmptyComponent={
                <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ backgroundColor: '#EFF6FF', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Feather name="cpu" size={32} color="#2D8CFF" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E293B', textAlign: 'center', marginBottom: 6 }}>
                    {isNotesSelf ? 'Welcome to your AI Smart Note Book!' : 'Hello! I am your Financial AI Assistant'}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, maxWidth: 320, marginBottom: 24 }}>
                    {isNotesSelf
                      ? 'Log expenses, record income, or write notes naturally. I automatically register transactions and calculate instant run-rate insights.'
                      : 'Ask me anything about your spending velocity, runway safety, budget limits, or instant expense logging.'}
                  </Text>

                  <View style={{ width: '100%', maxWidth: 400 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                      💡 Predefined Questions & Action Starters:
                    </Text>
                    {[
                      { icon: 'trending-down', title: 'Check Burn Rate & Runway', text: 'What is my current daily burn rate and how safe is my runway?' },
                      { icon: 'plus-circle', title: 'Quick Expense Entry', text: 'Lunch 250 at Cafe' },
                      { icon: 'pie-chart', title: 'Top Spending Breakdown', text: 'Analyze my top 3 spending categories this month and where to cut costs.' },
                      { icon: 'target', title: 'Set Monthly Goal', text: 'Set a monthly expense budget limit of ₹25,000 and track run-rate.' },
                      { icon: 'award', title: 'Savings Optimization', text: 'How can I optimize my monthly cashflow to boost my savings ratio?' },
                      { icon: 'dollar-sign', title: 'Log Income', text: 'Income: Salary or Project Bonus 35000' }
                    ].map((topic, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: 14,
                          padding: 13,
                          marginBottom: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.04,
                          shadowRadius: 3,
                          elevation: 1
                        }}
                        activeOpacity={0.7}
                        onPress={() => {
                          setInput(topic.text);
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                          <Feather name={topic.icon} size={18} color="#2D8CFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }} adjustsFontSizeToFit numberOfLines={1}>{topic.title}</Text>
                          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }} numberOfLines={1}>{topic.text}</Text>
                        </View>
                        <Feather name="chevron-right" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              }
              ListFooterComponent={isOtherTyping ? <TypingIndicator /> : null}
            />
          </ImageBackground>
        )}

        {/* Quick Templates & Financial Questions Suggestion Bar */}
        <View style={{ backgroundColor: '#F8FAFC', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
            {quickSuggestions.map((tpl) => (
              <TouchableOpacity
                key={tpl}
                style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#BFDBFE' }}
                onPress={() => setInput(tpl)}
              >
                <Text style={{ fontSize: 12, color: '#2D8CFF', fontWeight: '600' }}>{tpl}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Reply / Editing Banner */}
        {(replyTo || editingMsg) && (
          <View style={styles.replyBanner}>
            <View style={styles.replyAccent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.replyBannerTitle}>
                {editingMsg ? '✏️ Editing message' : `↩ Replying to ${replyTo?.sender?.fullName || 'message'}`}
              </Text>
              <Text style={styles.replyBannerContent} numberOfLines={1}>
                {editingMsg ? editingMsg.content : replyTo?.content || '📎 Media'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { setReplyTo(null); setEditingMsg(null); setInput(''); }}>
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(8, insets.bottom) }]}>
          {!isRecordingVoice && (
            <>
              {/* Attach button */}
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => { setShowAttachMenu((v) => !v); setShowTxPicker(false); }}
              >
                <Feather name="plus" size={22} color="#2D8CFF" />
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Message..."
                placeholderTextColor="#9CA3AF"
                value={input}
                onChangeText={handleInputChange}
                multiline
                maxLength={2000}
              />
            </>
          )}

          {/* Voice OR Send button */}
          {!isRecordingVoice && hasText ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Schedule */}
              <TouchableOpacity style={styles.scheduleBtn} onPress={() => setShowScheduleSheet(true)}>
                <Feather name="clock" size={18} color="#6B7280" />
              </TouchableOpacity>
              {/* Send */}
              <TouchableOpacity
                style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <VoiceRecordButton
              onVoiceSent={handleVoiceSent}
              isRecording={isRecordingVoice}
              setIsRecording={setIsRecordingVoice}
            />
          )}
        </View>

        {/* ── Attachment Sheet Modal ─────────────────────────────────────── */}
        <Modal visible={showAttachMenu} animationType="slide" transparent onRequestClose={() => setShowAttachMenu(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowAttachMenu(false)} />
            <View style={styles.sheetModal}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeaderModal}>
                <Text style={styles.sheetTitleModal}>📎 Attach to Chat</Text>
                <TouchableOpacity onPress={() => setShowAttachMenu(false)}>
                  <Feather name="x" size={22} color="#374151" />
                </TouchableOpacity>
              </View>
              <View style={styles.sheetGridModal}>
                {/* Image */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={handlePickImage}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="image" size={24} color="#2D8CFF" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Image</Text>
                </TouchableOpacity>

                {/* Document (real file picker) */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={handlePickDocument}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="file" size={24} color="#2D8CFF" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Document</Text>
                </TouchableOpacity>

                {/* Transaction */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={() => { setShowAttachMenu(false); setTxPickerMode('TRANSACTION'); setShowTxPicker(true); }}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#D1FAE5' }]}>
                    <Feather name="trending-up" size={24} color="#059669" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Transaction</Text>
                </TouchableOpacity>

                {/* Receipt (transaction as receipt) */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={() => { setShowAttachMenu(false); setTxPickerMode('RECEIPT'); setShowTxPicker(true); }}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="file-text" size={24} color="#D97706" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Receipt</Text>
                </TouchableOpacity>

                {/* Budget */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={openBudgetPicker}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#FFF7ED' }]}>
                    <Feather name="bar-chart-2" size={24} color="#F26D21" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Budget</Text>
                </TouchableOpacity>

                {/* Goal */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={openGoalPicker}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#E0F2FE' }]}>
                    <Feather name="target" size={24} color="#0284C7" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Goal</Text>
                </TouchableOpacity>

                {/* Report */}
                <TouchableOpacity style={styles.sheetGridItemModal} onPress={handleShareReport}>
                  <View style={[styles.sheetGridIconModal, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="pie-chart" size={24} color="#D97706" />
                  </View>
                  <Text style={styles.sheetGridLabelModal}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── Transaction / Receipt Picker ──────────────────────────────── */}
        <PickerModal
          insets={insets}
          visible={showTxPicker}
          onClose={() => setShowTxPicker(false)}
          title={txPickerMode === 'RECEIPT' ? '🧾 Select Transaction as Receipt' : '💸 Select Transaction to Share'}
          items={(transactions || []).slice(0, 80)}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.txRowModal}
              onPress={() => handleShareTransaction(item, txPickerMode === 'RECEIPT')}
            >
              <View style={[styles.txDot, { backgroundColor: item.type === 'INCOME' ? '#10B981' : '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.txRowLabel}>{item.notes || item.category?.name || 'Transaction'}</Text>
                <Text style={styles.txRowSub}>
                  {item.category?.name || 'General'} · {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                </Text>
              </View>
              <Text style={[styles.txRowAmount, { color: item.type === 'INCOME' ? '#059669' : '#DC2626' }]}>
                {item.type === 'INCOME' ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN')}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* ── Budget Picker ─────────────────────────────────────────────── */}
        <PickerModal
          insets={insets}
          visible={showBudgetPicker}
          onClose={() => setShowBudgetPicker(false)}
          title="📊 Select Budget to Share"
          items={budgetList}
          keyExtractor={(b) => b.id}
          emptyText="You have no budgets yet. Create one from the home screen to share it here."
          onCreatePress={() => navigation.navigate('MainTabs', { screen: 'Wealth' })}
          renderItem={({ item }) => {
            const spent = Number(item.spent || item.spentAmount || 0);
            const limit = Number(item.amount || item.limitAmount || item.limit || 1);
            const pct = Math.min(Math.round((spent / limit) * 100), 100);
            const over = spent > limit;
            return (
              <TouchableOpacity style={styles.txRowModal} onPress={() => handleShareBudget(item)}>
                <View style={[styles.txDot, { backgroundColor: over ? '#EF4444' : '#2D8CFF', width: 10, height: 10, borderRadius: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.txRowLabel}>{item.category || item.name || 'Budget'}</Text>
                  <Text style={styles.txRowSub}>{item.period || 'Monthly'} · ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ backgroundColor: over ? '#FEE2E2' : '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: over ? '#DC2626' : '#2D8CFF' }}>{pct}%</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* ── Goal Picker ───────────────────────────────────────────────── */}
        <PickerModal
          insets={insets}
          visible={showGoalPicker}
          onClose={() => setShowGoalPicker(false)}
          title="🎯 Select Goal to Share"
          items={goalList}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => {
            const current = Number(item.currentAmount || 0);
            const target = Number(item.targetAmount || 1);
            const pct = Math.min(Math.round((current / target) * 100), 100);
            return (
              <TouchableOpacity style={styles.txRowModal} onPress={() => handleShareGoal(item)}>
                <Text style={{ fontSize: 22 }}>{item.emoji || '🎯'}</Text>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.txRowLabel}>{item.name || 'Goal'}</Text>
                  <Text style={styles.txRowSub}>₹{current.toLocaleString('en-IN')} / ₹{target.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ backgroundColor: pct >= 100 ? '#D1FAE5' : '#EFF6FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: pct >= 100 ? '#059669' : '#2D8CFF' }}>{pct}%</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {/* ── Schedule Message Sheet ────────────────────────────────────── */}
        <ScheduleMessageSheet
          visible={showScheduleSheet}
          onClose={() => setShowScheduleSheet(false)}
          onSchedule={handleScheduleMessage}
          messageText={input}
          conversationId={conversationId}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6',
    gap: 8, backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  typingLabel: { fontSize: 12, color: '#10B981', fontWeight: '500', marginTop: 1 },
  onlineLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  headerAction: { padding: 6, borderRadius: 8, backgroundColor: '#F9FAFB' },

  dateSepContainer: { alignItems: 'center', marginVertical: 10 },
  dateChip: { backgroundColor: 'rgba(241, 245, 249, 0.9)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 0.5, borderColor: '#E2E8F0' },
  dateChipText: { fontSize: 11, color: '#64748B', fontWeight: '600' },

  replyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F4FF', paddingHorizontal: 16, paddingVertical: 10,
    gap: 10, borderTopWidth: 0.5, borderTopColor: '#E5E7EB',
  },
  replyAccent: { width: 3, height: '100%', backgroundColor: '#2D8CFF', borderRadius: 2, minHeight: 36 },
  replyBannerTitle: { fontSize: 12, fontWeight: '700', color: '#2D8CFF' },
  replyBannerContent: { fontSize: 13, color: '#747487', marginTop: 2 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 0.5, borderTopColor: '#E5E7EB',
    backgroundColor: '#fff', gap: 6,
  },
  attachBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  textInput: {
    flex: 1, backgroundColor: '#F3F4F6',
    borderRadius: 20, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 10,
    fontSize: 15, color: '#232333', maxHeight: 120,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#2D8CFF', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#BFDBFE' },
  scheduleBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },

  // Recording bar — inline compact
  recCancelBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recBarInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9, marginHorizontal: 4,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  recTimer: { fontSize: 14, fontWeight: '700', color: '#DC2626', minWidth: 36 },
  recWaveRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  recWaveBar: { width: 3, borderRadius: 2, backgroundColor: '#EF4444', opacity: 0.6 },
  recSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Sheets
  sheetModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  sheetHeaderModal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sheetTitleModal: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sheetGridModal: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  sheetGridItemModal: { width: '22%', alignItems: 'center', marginBottom: 12 },
  sheetGridIconModal: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  sheetGridLabelModal: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },

  // Transaction row
  txRowModal: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#F3F4F6', gap: 12,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txRowLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txRowSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txRowAmount: { fontSize: 15, fontWeight: '700' },
});
