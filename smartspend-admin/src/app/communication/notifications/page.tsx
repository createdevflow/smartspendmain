'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Bell, Plus, Send, Trash2, BarChart3, Filter, RefreshCw } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/communication/admin/notifications?page=${page}&limit=${LIMIT}`);
      setItems(res.data?.items || res.data?.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendNow = async (id: string) => {
    if (!confirm('Send this notification now to all target users?')) return;
    try {
      const res = await api.post(`/communication/admin/notifications/${id}/send`);
      alert(`Notification sent to ${res.data?.sentCount || 0} users!`);
      load();
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to send'); }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this notification?')) return;
    try { await api.delete(`/communication/admin/notifications/${id}`); load(); }
    catch { alert('Failed to cancel'); }
  };

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    SENT: { bg: '#D1FAE5', color: '#059669' },
    SCHEDULED: { bg: '#FEF3C7', color: '#D97706' },
    DRAFT: { bg: '#F3F4F6', color: '#6B7280' },
    CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
  };
  const AUDIENCE_LABELS: Record<string, string> = {
    ALL: '🌍 All Users', FREE_USERS: '👤 Free', PREMIUM_USERS: '👑 Premium',
    SELECTED: '🎯 Selected', ANDROID: '🤖 Android', IOS: '🍎 iOS',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Notification Campaigns</h1>
            <p className="page-subtitle">Manage all admin notification broadcasts</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={load}><RefreshCw size={16} /></button>
            <button className="btn btn-primary" onClick={() => router.push('/communication/notifications/new')}>
              <Plus size={16} /> New Campaign
            </button>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No notification campaigns yet.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => router.push('/communication/notifications/new')}>
                <Plus size={16} /> Create Campaign
              </button>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Type</th>
                      <th>Audience</th>
                      <th>Channels</th>
                      <th>Status</th>
                      <th>Sent To</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const ss = STATUS_STYLES[item.status] || { bg: '#F3F4F6', color: '#6B7280' };
                      return (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 600, maxWidth: '220px' }}>{item.title}</div>
                            {item.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.subtitle}</div>}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.body?.slice(0, 50)}{item.body?.length > 50 ? '…' : ''}</div>
                          </td>
                          <td><span className="badge">{item.notifType}</span></td>
                          <td>{AUDIENCE_LABELS[item.audience] || item.audience}</td>
                          <td>
                            <div style={{ fontSize: '0.78rem' }}>
                              {item.channelInApp && <span className="badge" style={{ marginRight: '4px' }}>In-App</span>}
                              {item.channelPush && <span className="badge" style={{ background: '#F0FDF4', color: '#059669' }}>Push</span>}
                            </div>
                          </td>
                          <td><span className="badge" style={{ background: ss.bg, color: ss.color }}>{item.status}</span></td>
                          <td><span style={{ fontWeight: 600, color: item.sentCount > 0 ? '#059669' : 'var(--text-muted)' }}>{item.sentCount > 0 ? item.sentCount : '—'}</span></td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {item.status !== 'SENT' && item.status !== 'CANCELLED' && (
                                <button className="btn btn-sm btn-success" onClick={() => sendNow(item.id)} title="Send Now"><Send size={13} /></button>
                              )}
                              {item.status === 'SENT' && (
                                <button className="btn btn-sm btn-ghost" onClick={() => router.push(`/communication/notifications/${item.id}/stats`)} title="Stats"><BarChart3 size={13} /></button>
                              )}
                              {item.status !== 'SENT' && (
                                <button className="btn btn-sm btn-danger" onClick={() => cancel(item.id)} title="Cancel"><Trash2 size={13} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {total > LIMIT && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                  <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                  <span style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Page {page} of {Math.ceil(total / LIMIT)}</span>
                  <button className="btn btn-ghost" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
