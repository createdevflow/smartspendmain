'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { MessageCircle, Shield, Users, BarChart2, Send, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ChatHubAdmin() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');

  useEffect(() => {
    const token = (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    if (!token) {
      router.push('/login');
      return;
    }
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/chat/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load chat analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return;
    if (!confirm('Send this broadcast message to all users?')) return;

    setBroadcasting(true);
    try {
      const res = await api.post('/admin/chat/broadcast', {
        title: broadcastTitle,
        content: broadcastContent,
      });
      alert(res.data?.message || 'Broadcast message sent successfully!');
      setBroadcastTitle('');
      setBroadcastContent('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.push('/communication')}
            style={{
              background: '#F3F4F6',
              border: 'none',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageCircle size={24} color="#2563EB" /> In-App Chat Hub Management
            </h1>
            <p className="page-subtitle">Monitor aggregated chat platform usage and send broadcast messages</p>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <Shield size={24} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1E3A8A' }}>
              Privacy-First Design Guarantee
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#1E40AF', lineHeight: '1.4' }}>
              {analytics?.privacyNote ||
                'By default and by design, administrators cannot view or read private user messages or financial cards shared between users. Only aggregated system-level counts and metrics are accessible.'}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading analytics...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left Column: Analytics Stats */}
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827' }}>
                Platform Activity Overview
              </h2>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '24px' }}>
                <div className="stat-card">
                  <p className="stat-label">Total Conversations</p>
                  <p className="stat-value">{analytics?.totalConversations || 0}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Active Chat Users</p>
                  <p className="stat-value">{analytics?.activeChatUsers || 0}</p>
                </div>
                <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                  <p className="stat-label">Total Messages Exchanged</p>
                  <p className="stat-value">{analytics?.totalMessages || 0}</p>
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
                  Messages by Attachment Type
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analytics?.messagesByType || {}).map(([type, count]: any) => (
                    <div
                      key={type}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#4B5563',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#2563EB',
                          }}
                        />
                        {type}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#111827',
                          background: '#F3F4F6',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  ))}
                  {Object.keys(analytics?.messagesByType || {}).length === 0 && (
                    <p style={{ color: '#9CA3AF', fontSize: '13px', margin: 0 }}>No messages recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Broadcast Tool */}
            <div>
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB' }}>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Send size={18} color="#2563EB" /> Send Broadcast Announcement
                </h2>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
                  Deliver a system message to all active users across Cashtro.
                </p>

                <form onSubmit={handleSendBroadcast}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                      Announcement Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Scheduled Maintenance Notice"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#374151' }}>
                      Message Content
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Write your broadcast message here..."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={broadcasting}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                  >
                    {broadcasting ? 'Sending Broadcast...' : 'Broadcast to All Users'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
