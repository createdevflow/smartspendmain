'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { useChat } from '@/lib/ChatContext';
import { Send, Bot, User, Paperclip, X, Image as ImageIcon, FileText, Search, Book, Sparkles, Phone, Video, Info, Pin, BellOff, Archive, MessageSquare, MoreVertical, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { fmt, fmtDate } from '@/lib/utils';

export default function MessagingPage() {
  const { user, isFeatureEnabled } = useApp();
  const { conversations, getMessages, sendMessage, markRead, onlineUsers, startConversation, analyzeNoteMessage, editMessage, deleteMessage } = useChat();

  const [activeTab, setActiveTab] = useState('All');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [attachment, setAttachment] = useState<{ type: 'IMAGE' | 'DOCUMENT', data: string, file: File } | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const isNotesSelf = activeConv?.type === 'NOTES_SELF';
  
  const getOtherMember = (conv: any) => conv.members?.find((m: any) => m.userId !== user?.id)?.user;
  const getConvName = (conv: any) => conv.type === 'NOTES_SELF' ? 'My Notes' : (conv.type === 'DIRECT' ? getOtherMember(conv)?.fullName : conv.name);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeConvId) {
      setLoadingMsgs(true);
      getMessages(activeConvId).then(msgs => {
        setMessages(msgs);
        setLoadingMsgs(false);
        markRead(activeConvId);
      });
    } else {
      setMessages([]);
    }
  }, [activeConvId, getMessages, markRead]);

  const handleSearchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get('/chat/contacts/search', { params: { q } });
      setSearchResults(res.data?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (targetUser: any) => {
    try {
      const conv = await startConversation(targetUser.id);
      if (conv) {
        setSearch('');
        setSearchResults([]);
        setActiveConvId(conv.id);
      }
    } catch (e) {
      alert('Failed to start chat');
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || input.trim();
    if ((!content && !attachment && !editingMsg) || sending || !activeConvId) return;
    
    setInput('');
    setSending(true);

    if (editingMsg) {
      try {
        await editMessage(editingMsg.id, content, activeConvId);
        setMessages(prev => prev.map(m => m.id === editingMsg.id ? { ...m, content, isEdited: true } : m));
        setEditingMsg(null);
      } catch (err) {
        alert('Failed to edit message');
      } finally {
        setSending(false);
      }
      return;
    }

    const msgPayload: any = { conversationId: activeConvId, content, type: 'TEXT' };
    if (attachment) {
      msgPayload.type = attachment.type;
      msgPayload.content = attachment.type === 'IMAGE' ? attachment.data : '';
      if (attachment.type === 'DOCUMENT') {
        msgPayload.metadata = { uri: attachment.data, filename: attachment.file.name };
      }
    }
    setAttachment(null);

    try {
      const msg = await sendMessage(msgPayload);
      setMessages(prev => [...prev, msg]);
      
      if (isNotesSelf) {
        setMessages(prev => [...prev, { id: 'thinking', role: 'assistant', content: '', isThinking: true }]);
        try {
          const resData = await analyzeNoteMessage(msg.id);
          if (resData?.aiReply) {
             setMessages(prev => prev.filter(m => m.id !== 'thinking').concat(resData.aiReply));
          } else {
             setMessages(prev => prev.filter(m => m.id !== 'thinking'));
          }
        } catch {
          setMessages(prev => prev.filter(m => m.id !== 'thinking'));
        }
      }
    } catch (err) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {
      alert('Failed to delete message');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File must be smaller than 5MB'); return; }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAttachment({
          type: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
          data: ev.target.result as string,
          file
        });
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (msgId: string) => {
    setMessages(prev => [...prev, { id: 'thinking', role: 'assistant', content: '', isThinking: true }]);
    try {
      const resData = await analyzeNoteMessage(msgId);
      if (resData?.aiReply) {
         setMessages(prev => prev.filter(m => m.id !== 'thinking').concat(resData.aiReply));
      } else {
         setMessages(prev => prev.filter(m => m.id !== 'thinking'));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== 'thinking'));
    }
  };

  if (!isFeatureEnabled('ai_chat')) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <TopBar title="Messaging" />
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
             <h3>Feature Disabled</h3>
          </div>
        </main>
      </>
    );
  }

  const filteredConvs = conversations.filter(c => {
    if (activeTab === 'Unread') return c.unreadCount > 0;
    if (activeTab === 'Personal') return c.category === 'PERSONAL' || c.type === 'NOTES_SELF';
    if (activeTab === 'Family') return c.category === 'FAMILY';
    if (activeTab === 'Business') return c.category === 'BUSINESS';
    return true;
  });

  const pinnedConvs = conversations.filter(c => c.isPinned);

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
           <div>
             <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Messaging</h1>
             <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>Connect with others and AI</p>
           </div>
        </div>
        
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Pane - Chat List */}
          <div style={{ width: '320px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
            <div style={{ padding: '1rem' }}>
              <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '0.5rem 0.75rem', border: '1px solid var(--border)' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={search} 
                  onChange={e => handleSearchUsers(e.target.value)} 
                  style={{ background: 'transparent', border: 'none', outline: 'none', marginLeft: '0.5rem', width: '100%', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }} 
                />
              </div>
            </div>

            {search.length >= 2 ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '0 1rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>SEARCH RESULTS</div>
                {isSearching ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>No users found</div>
                ) : (
                  searchResults.map(u => (
                    <div key={u.id} onClick={() => handleStartChat(u)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg">
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <User size={18} color="var(--accent-primary)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{u.fullName}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{u.email}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 0.75rem', overflowX: 'auto', borderBottom: '1px solid var(--border)' }} className="hide-scrollbar">
                  {['All', 'Unread', 'Personal', 'Family', 'Business'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setActiveTab(t)}
                      style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '16px', fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: activeTab === t ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                        color: activeTab === t ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {pinnedConvs.length > 0 && activeTab === 'All' && (
                  <div style={{ padding: '1rem 1rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.75rem', fontWeight: 600 }}>PINNED</div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }} className="hide-scrollbar">
                      {pinnedConvs.map(c => (
                        <div key={c.id} onClick={() => setActiveConvId(c.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          <div style={{ width: 50, height: 50, borderRadius: '50%', background: c.type === 'NOTES_SELF' ? '#2D8CFF' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.type === 'NOTES_SELF' ? <Book size={20} color="white" /> : <User size={20} color="var(--accent-primary)" />}
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getConvName(c)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filteredConvs.map(c => {
                     const isSelected = activeConvId === c.id;
                     return (
                       <div key={c.id} onClick={() => setActiveConvId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--bg-hover)' : 'transparent', transition: 'background 0.2s' }} className="hover-bg">
                         <div style={{ position: 'relative' }}>
                           <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.type === 'NOTES_SELF' ? '#2D8CFF' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {c.type === 'NOTES_SELF' ? <Book size={20} color="white" /> : <User size={20} color="var(--accent-primary)" />}
                           </div>
                           {onlineUsers.has(getOtherMember(c)?.id) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-surface)' }} />}
                         </div>
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                             <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getConvName(c)}</div>
                             <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>{c.lastMessageAt ? fmtDate(c.lastMessageAt) : ''}</div>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ fontSize: 'var(--text-xs)', color: c.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: c.unreadCount > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                               {c.lastMessageText || 'No messages yet'}
                             </div>
                             {c.unreadCount > 0 && (
                               <div style={{ background: 'var(--accent-primary)', color: 'white', borderRadius: '10px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 700 }}>{c.unreadCount}</div>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right Pane - Active Chat Room */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
             {activeConv ? (
               <>
                 {/* Header */}
                 <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ width: 40, height: 40, borderRadius: '50%', background: isNotesSelf ? '#2D8CFF' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isNotesSelf ? <Book size={18} color="white" /> : <User size={18} color="var(--accent-primary)" />}
                       </div>
                       <div>
                         <div style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{getConvName(activeConv)}</div>
                         <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
                            {isNotesSelf ? 'AI Agent Active' : (onlineUsers.has(getOtherMember(activeConv)?.id) ? 'Online' : 'Offline')}
                         </div>
                       </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                       <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => {
                          const action = prompt("Type 'pin' to Pin, 'mute' to Mute, or 'delete' to Delete Chat");
                          if(action === 'delete') {
                             alert("Delete chat not implemented in web UI yet, but will be.");
                          }
                       }}>
                         <MoreVertical size={18} color="var(--text-secondary)" />
                       </button>
                    </div>
                 </div>

                 {/* Messages */}
                 <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)' }}>
                   {loadingMsgs ? (
                     <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '2rem' }}>Loading messages...</div>
                   ) : messages.length === 0 ? (
                     <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '2rem' }}>
                       {isNotesSelf ? 'Start writing notes and I will analyze them.' : 'Say hi!'}
                     </div>
                   ) : (
                     messages.map(msg => {
                       const isMe = msg.role === 'user' || msg.senderId === user?.id;
                       const isAi = msg.role === 'assistant' || msg.senderType === 'SYSTEM';
                       return (
                         <div 
                           key={msg.id} 
                           style={{ display: 'flex', gap: '0.75rem', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}
                           onMouseEnter={() => setHoveredMsgId(msg.id)}
                           onMouseLeave={() => setHoveredMsgId(null)}
                         >
                           {!isMe && (
                             <div style={{ width: 28, height: 28, borderRadius: '50%', background: isAi ? '#2D8CFF' : 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                               {isAi ? <Bot size={14} color="white" /> : <User size={14} color="var(--accent-primary)" />}
                             </div>
                           )}

                           {isMe && hoveredMsgId === msg.id && !msg.isThinking && (
                             <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', alignSelf: 'center', background: 'var(--bg-elevated)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                               <button onClick={() => { setEditingMsg(msg); setInput(msg.content); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }} title="Edit">
                                 <Edit size={14} />
                               </button>
                               <button onClick={() => handleDeleteMessage(msg.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--danger)' }} title="Delete">
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           )}

                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                             <div style={{
                               maxWidth: '400px', padding: '0.75rem 1rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                               background: isMe ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                               color: isMe ? 'white' : 'var(--text-primary)',
                               fontSize: 'var(--text-sm)', lineHeight: 1.5,
                               border: !isMe ? '1px solid var(--border)' : 'none',
                               boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                             }}>
                               {msg.isThinking ? (
                                 <span style={{ display: 'flex', gap: '4px', alignItems: 'center', color: 'var(--text-tertiary)' }}>
                                   <span style={{ animation: 'bounce 0.8s infinite 0s' }}>●</span>
                                   <span style={{ animation: 'bounce 0.8s infinite 0.2s' }}>●</span>
                                   <span style={{ animation: 'bounce 0.8s infinite 0.4s' }}>●</span>
                                 </span>
                               ) : msg.type === 'IMAGE' || (msg.content && msg.content.startsWith('data:image')) || (msg.metadata?.uri?.startsWith('data:image')) ? (
                                 <div>
                                    <img src={msg.content || msg.metadata?.uri} alt="Attachment" style={{ width: '100%', maxWidth: '250px', borderRadius: '8px' }} />
                                    {msg.metadata?.caption && <div style={{ marginTop: '0.5rem' }}>{msg.metadata.caption}</div>}
                                 </div>
                               ) : msg.type === 'DOCUMENT' ? (
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={20} /> <span>{msg.metadata?.filename || 'Document'}</span>
                                 </div>
                               ) : (
                                 <span>{msg.content}</span>
                               )}
                             </div>
                             
                             {/* AI Analysis trigger for Notes */}
                             {isNotesSelf && isMe && !msg.isThinking && (
                               <button 
                                 onClick={() => handleAnalyze(msg.id)}
                                 style={{ marginTop: '0.25rem', background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                               >
                                 <Sparkles size={10} /> Analyze Note
                               </button>
                             )}
                           </div>
                         </div>
                       );
                     })
                   )}
                   <div ref={bottomRef} />
                 </div>

                 {/* Input Area */}
                 <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--bg-surface)' }}>
                   {editingMsg && (
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                       <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-primary)' }}>Editing Message...</span>
                       <button onClick={() => { setEditingMsg(null); setInput(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}>
                         <X size={16} color="var(--text-secondary)" />
                       </button>
                     </div>
                   )}
                   {attachment && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: '8px', alignSelf: 'flex-start', border: '1px solid var(--border)', marginBottom: '0.75rem', width: 'max-content' }}>
                       {attachment.type === 'IMAGE' ? <ImageIcon size={18} color="var(--accent-primary)" /> : <FileText size={18} color="var(--accent-primary)" />}
                       <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>{attachment.file.name}</span>
                       <button onClick={() => setAttachment(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '2px', marginLeft: '0.5rem' }}>
                         <X size={14} color="var(--text-tertiary)" />
                       </button>
                     </div>
                   )}

                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                     <input type="file" accept="image/*,.pdf,.csv,.xlsx" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                     <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()} style={{ padding: '0.5rem', color: 'var(--text-secondary)' }} disabled={sending}>
                       <Paperclip size={20} />
                     </button>
                     
                     <input
                       className="input-field"
                       style={{ flex: 1, margin: 0, height: '42px', borderRadius: '21px', paddingLeft: '1.25rem' }}
                       placeholder={isNotesSelf ? "Jot down a financial note..." : "Type a message..."}
                       value={input}
                       onChange={e => setInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                       disabled={sending}
                     />

                     <button 
                       className="btn btn-primary" 
                       style={{ width: '42px', height: '42px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                       onClick={() => handleSendMessage()} 
                       disabled={sending || (!input.trim() && !attachment)}
                     >
                       <Send size={18} />
                     </button>
                   </div>
                 </div>
               </>
             ) : (
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                 <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                 <h2 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Cashtro Messaging</h2>
                 <p style={{ fontSize: 'var(--text-sm)', maxWidth: '300px', textAlign: 'center' }}>Select a conversation or start a new one to begin messaging.</p>
               </div>
             )}
          </div>
          
        </div>
      </main>
    </>
  );
}
