'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { Search, MessageSquare, CheckCircle, Clock, Paperclip, AlertCircle, HelpCircle } from "lucide-react";
import { api } from '@/lib/api';

type TicketReply = {
  message: string;
  isAdmin: boolean;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  type: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  replies: TicketReply[];
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tickets');
      if (res.data?.data) {
        const payload = res.data.data;
        setTickets(Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []));
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('adminToken')) {
      const t = setTimeout(fetchTickets, 300);
      return () => clearTimeout(t);
    } else {
      window.location.href = '/login';
    }
  }, [fetchTickets]);

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setReplyLoading(true);
    try {
      await api.patch(`/admin/tickets/${selectedTicket.id}/reply`, { message: replyMessage });
      setReplyMessage('');
      fetchTickets(); // Refetch to get new replies and updated status
    } catch (e) {
      alert('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'badge-warning';
      case 'ANSWERED': return 'badge-success';
      case 'CLOSED': return '';
      default: return '';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'bug_report') return <AlertCircle size={14} />;
    return <HelpCircle size={14} />;
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="animate-fade-in">Support Tickets</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage user issues and inquiries.</p>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 2fr' : '1fr', gap: '1.5rem' }}>
          
          {/* Ticket List */}
          <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', marginBottom: '1rem' }}>
                <Search size={18} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${statusFilter === '' ? 'badge-primary' : ''}`} style={statusFilter === '' ? {} : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setStatusFilter('')}>All</span>
                <span className={`badge ${statusFilter === 'OPEN' ? 'badge-warning' : ''}`} style={statusFilter === 'OPEN' ? {} : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setStatusFilter('OPEN')}>Open</span>
                <span className={`badge ${statusFilter === 'ANSWERED' ? 'badge-success' : ''}`} style={statusFilter === 'ANSWERED' ? {} : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setStatusFilter('ANSWERED')}>Answered</span>
                <span className={`badge ${statusFilter === 'CLOSED' ? 'badge-secondary' : ''}`} style={statusFilter === 'CLOSED' ? {} : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setStatusFilter('CLOSED')}>Closed</span>
              </div>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>}
              {!loading && filteredTickets.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No tickets found.</div>}
              {filteredTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderBottom: '1px solid var(--border)', 
                    cursor: 'pointer', 
                    background: selectedTicket?.id === ticket.id ? 'rgba(255,255,255,0.05)' : 'transparent', 
                    borderLeft: selectedTicket?.id === ticket.id ? '3px solid var(--accent-primary)' : '3px solid transparent' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getTypeIcon(ticket.type)} {ticket.subject}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(ticket.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ticket.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                        {ticket.user.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{ticket.user.fullName}</span>
                    </div>
                    <span className={`badge ${getStatusColor(ticket.status)}`} style={{ fontSize: '0.65rem' }}>{ticket.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Detail / Reply */}
          {selectedTicket && (
            <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', padding: 0 }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getTypeIcon(selectedTicket.type)} {selectedTicket.subject} 
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(#{selectedTicket.id.substring(0,6)})</span>
                  </h2>
                  <button onClick={() => setSelectedTicket(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> Created {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  <span>User: {selectedTicket.user.email}</span>
                </div>
              </div>

              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* User Original Message */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {selectedTicket.user.fullName?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', borderTopLeftRadius: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>{selectedTicket.user.fullName}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{selectedTicket.message}</p>
                    {selectedTicket.attachmentUrl && (
                      <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Paperclip size={12}/> Attachment</p>
                        <img src={selectedTicket.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((reply, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', flexDirection: reply.isAdmin ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: reply.isAdmin ? 'var(--accent-primary)' : 'var(--bg-elevated)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                      {reply.isAdmin ? 'A' : selectedTicket.user.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                    <div style={{ 
                      background: reply.isAdmin ? 'var(--accent-glow)' : 'var(--bg-elevated)', 
                      border: reply.isAdmin ? '1px solid rgba(59,130,246,0.3)' : 'none', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)', 
                      borderTopRightRadius: reply.isAdmin ? 0 : 'var(--radius-md)', 
                      borderTopLeftRadius: reply.isAdmin ? 'var(--radius-md)' : 0, 
                      flex: 1 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: reply.isAdmin ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {reply.isAdmin ? 'You (Admin)' : selectedTicket.user.fullName}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{reply.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <textarea 
                  className="input-field" 
                  placeholder="Type your reply here..." 
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical', marginBottom: '1rem', background: 'var(--bg-surface)' }}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn btn-primary" onClick={handleReply} disabled={replyLoading || !replyMessage.trim()}>
                    {replyLoading ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
