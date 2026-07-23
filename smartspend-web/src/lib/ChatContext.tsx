'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApp } from './AppContext';
import { api } from './api';

interface ChatContextValue {
  isConnected: boolean;
  conversations: any[];
  onlineUsers: Set<string>;
  typingUsers: Record<string, Set<string>>;
  unreadCounts: Record<string, number>;
  totalUnread: number;
  fetchConversations: () => Promise<void>;
  getMessages: (conversationId: string, cursor?: string) => Promise<any[]>;
  sendMessage: (payload: any) => Promise<any>;
  editMessage: (messageId: string, content: string, conversationId: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string, conversationId: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  markRead: (conversationId: string) => void;
  sendContactRequest: (toUserId: string) => Promise<any>;
  acceptContactRequest: (requestId: string) => Promise<any>;
  startConversation: (userId: string) => Promise<any>;
  analyzeNoteMessage: (messageId: string) => Promise<any>;
  executeNoteAction: (messageId: string, action: any) => Promise<any>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

const getSocketHost = () => {
  const baseURL = api.defaults.baseURL || 'http://localhost:3000/api';
  return baseURL.split('/api')[0];
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const fetchConversations = useCallback(async () => {
    try {
      const [res, notesRes] = await Promise.allSettled([
        api.get('/chat/conversations'),
        api.get('/chat/notes')
      ]);
      let convs = res.status === 'fulfilled' ? (res.value.data?.data || []) : [];
      if (notesRes.status === 'fulfilled' && notesRes.value.data?.data) {
        // Prepend notes conversation to the list so it's easily accessible
        const noteConv = notesRes.value.data.data;
        if (!convs.find((c: any) => c.id === noteConv.id)) {
          convs = [noteConv, ...convs];
        }
      }
      setConversations(convs);
    } catch (e) {
      console.error('[Chat] fetchConversations error', e);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const connect = async () => {
      const accessToken = localStorage.getItem('accessToken');
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
        setIsConnected(true);
        fetchConversations();
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      const seenEventMsgIds = new Set<string>();
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
          const preview = isText ? message.content : `📎 ${message.type?.toLowerCase() || 'media'}`;
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

      socket.on('user.presence', ({ userId, isOnline }) => {
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
    };

    connect();

    return () => {
      socketRef.current?.disconnect();
      setIsConnected(false);
    };
  }, [user?.id, fetchConversations]);

  const getMessages = useCallback(async (conversationId: string, cursor?: string) => {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { cursor, limit: 30 },
    });
    return res.data?.data || [];
  }, []);

  const sendMessage = useCallback(async (payload: any) => {
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
        socketRef.current?.emit('message.send', payload, (response: any) => {
          if (response?.success) resolve(response.message);
          else reject(new Error(response?.error || 'Failed to send'));
        });
      });
    }
    
    // Fallback REST
    const res = await api.post('/chat/messages', payload);
    return res.data?.data || res.data;
  }, []);

  const editMessage = useCallback((messageId: string, content: string, conversationId: string) => {
    socketRef.current?.emit('message.edit', { messageId, content, conversationId });
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit('message.delete', { messageId });
  }, []);

  const reactToMessage = useCallback((messageId: string, emoji: string, conversationId: string) => {
    socketRef.current?.emit('message.react', { messageId, emoji, conversationId });
  }, []);

  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    socketRef.current?.emit('user.typing', { conversationId, isTyping });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message.read', { conversationId });
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
  }, []);

  const sendContactRequest = useCallback((toUserId: string) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('contact.request', { toUserId }, (response: any) => {
        if (response?.success) resolve(response);
        else reject(new Error(response?.error));
      });
    });
  }, []);

  const acceptContactRequest = useCallback((requestId: string) => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('contact.accept', { requestId }, (response: any) => {
        if (response?.success) {
          fetchConversations();
          resolve(response);
        } else reject(new Error(response?.error));
      });
    });
  }, [fetchConversations]);

  const startConversation = useCallback(async (userId: string) => {
    const res = await api.post('/chat/conversations', { participantIds: [userId] });
    await fetchConversations();
    return res.data?.data;
  }, [fetchConversations]);

  const analyzeNoteMessage = useCallback(async (messageId: string) => {
    const res = await api.post(`/chat/messages/${messageId}/analyze`);
    return Object.assign(res.data?.data || {}, { aiReply: res.data?.aiReply });
  }, []);

  const executeNoteAction = useCallback(async (messageId: string, action: any) => {
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
      executeNoteAction
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
