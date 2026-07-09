// context/ChatContext.js
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { api, getTokens } from '../utils/api';

const ChatContext = createContext(null);

const getSocketHost = () => api.defaults.baseURL?.split('/api')[0] || 'http://localhost:3000';

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({}); // conversationId → Set of userIds
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── Connect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const connect = async () => {
      const { accessToken } = await getTokens();
      if (!accessToken) return;

      socketRef.current = io(`${getSocketHost()}/chat`, {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('[Chat] Socket connected');
        setIsConnected(true);
        fetchConversations();
      });

      socket.on('disconnect', () => {
        console.log('[Chat] Socket disconnected');
        setIsConnected(false);
      });

      // ── Incoming events ──────────────────────────────────────────────
      const seenEventMsgIds = new Set();
      socket.on('message.new', (message) => {
        if (!message || seenEventMsgIds.has(message.id)) return;
        seenEventMsgIds.add(message.id);

        setConversations((prev) => {
          const exists = prev.some((c) => c.id === message.conversationId);
          if (!exists) {
            fetchConversations();
            return prev;
          }
          const isText = !message.type || message.type.toUpperCase() === 'TEXT';
          const preview = isText
            ? message.content
            : `📎 ${message.type?.toLowerCase() || 'media'}`;
          return prev.map((conv) => {
            if (conv.id !== message.conversationId) return conv;
            return {
              ...conv,
              lastMessageText: preview,
              lastMessageAt: message.createdAt,
            };
          });
        });

        setUnreadCounts((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1,
        }));
      });

      socket.on('user.presence', ({ userId, isOnline, lastSeenAt }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (isOnline) next.add(userId);
          else next.delete(userId);
          return next;
        });
      });

      socket.on('user.typing', ({ conversationId, userId, isTyping }) => {
        setTypingUsers((prev) => {
          const convSet = new Set(prev[conversationId] || []);
          if (isTyping) convSet.add(userId);
          else convSet.delete(userId);
          return { ...prev, [conversationId]: convSet };
        });
      });

      socket.on('contact.request', (data) => {
        // Could show a push-style notification
        console.log('[Chat] Contact request from', data.fromUserId);
      });
    };

    connect();

    return () => {
      socketRef.current?.disconnect();
      setIsConnected(false);
    };
  }, [user?.id]);

  // ── API helpers ──────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data?.data || []);
    } catch (e) {
      console.error('[Chat] fetchConversations error', e);
    }
  }, []);

  const getMessages = useCallback(async (conversationId, cursor) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { cursor, limit: 30 },
    });
    return res.data?.data || [];
  }, []);

  // ── Socket emitters ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async (dto) => {
    let payload = { ...dto };
    try {
      if (payload.content && typeof payload.content === 'string' && (payload.content.startsWith('data:') || payload.content.length > 500)) {
        const uploadRes = await api.post('/media/upload-base64', { base64: payload.content, module: 'chat' });
        const url = uploadRes.data?.data?.url || uploadRes.data?.url;
        if (url) {
          payload.mediaUrl = url;
          payload.content = '';
          if (payload.metadata && typeof payload.metadata === 'object') {
            payload.metadata.uri = url;
            payload.metadata.size = uploadRes.data?.data?.size;
            payload.metadata.id = uploadRes.data?.data?.id;
          }
        }
      }
      if (payload.metadata?.uri && typeof payload.metadata.uri === 'string' && (payload.metadata.uri.startsWith('data:') || payload.metadata.uri.length > 500)) {
        const uploadRes = await api.post('/media/upload-base64', { base64: payload.metadata.uri, module: 'chat' });
        const url = uploadRes.data?.data?.url || uploadRes.data?.url;
        if (url) {
          payload.metadata.uri = url;
          payload.metadata.size = uploadRes.data?.data?.size;
          payload.metadata.id = uploadRes.data?.data?.id;
          if (!payload.mediaUrl) payload.mediaUrl = url;
        }
      }
    } catch (err) {
      console.warn('Proactive base64 media upload failed:', err);
    }

    if (socketRef.current?.connected) {
      return new Promise((resolve, reject) => {
        socketRef.current.emit('message.send', payload, (response) => {
          if (response?.success) resolve(response.message);
          else reject(new Error(response?.error || 'Failed to send'));
        });
      });
    }
    // Reliable REST fallback when socket disconnected
    const res = await api.post('/chat/messages', payload);
    return res.data?.data || res.data;
  }, []);

  const editMessage = useCallback((messageId, content, conversationId) => {
    socketRef.current?.emit('message.edit', { messageId, content, conversationId });
  }, []);

  const deleteMessage = useCallback((messageId) => {
    socketRef.current?.emit('message.delete', { messageId });
  }, []);

  const reactToMessage = useCallback((messageId, emoji, conversationId) => {
    socketRef.current?.emit('message.react', { messageId, emoji, conversationId });
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    socketRef.current?.emit('user.typing', { conversationId, isTyping });
  }, []);

  const markRead = useCallback((conversationId) => {
    socketRef.current?.emit('message.read', { conversationId });
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
  }, []);

  const sendContactRequest = useCallback((toUserId) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('contact.request', { toUserId }, (response) => {
        if (response?.success) resolve(response);
        else reject(new Error(response?.error));
      });
    });
  }, []);

  const acceptContactRequest = useCallback((requestId) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('contact.accept', { requestId }, (response) => {
        if (response?.success) {
          fetchConversations();
          resolve(response);
        } else reject(new Error(response?.error));
      });
    });
  }, [fetchConversations]);

  const startConversation = useCallback(async (userId) => {
    const res = await api.post('/chat/conversations', { participantIds: [userId] });
    await fetchConversations();
    return res.data?.data;
  }, [fetchConversations]);

  const analyzeNoteMessage = useCallback(async (messageId) => {
    const res = await api.post(`/chat/messages/${messageId}/analyze`);
    return Object.assign(res.data?.data || {}, { aiReply: res.data?.aiReply });
  }, []);

  const executeNoteAction = useCallback(async (messageId, action) => {
    const res = await api.post(`/chat/messages/${messageId}/action`, { action });
    return Object.assign(res.data?.data || {}, { aiReply: res.data?.aiReply });
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <ChatContext.Provider value={{
      isConnected,
      conversations,
      onlineUsers,
      typingUsers,
      unreadCounts,
      totalUnread,
      fetchConversations,
      getMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      reactToMessage,
      sendTyping,
      markRead,
      sendContactRequest,
      acceptContactRequest,
      startConversation,
      analyzeNoteMessage,
      executeNoteAction,
      socket: socketRef.current,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};
