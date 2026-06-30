'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Mail, MessageCircle, Bell, Send, Clock, CheckCircle, AlertCircle,
  Plus, Eye, Play, Trash2, Users, BarChart3, Zap,
} from 'lucide-react';

export default function CommunicationCenter() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCampaigns: 0, sentCount: 0, scheduledCount: 0, draftCount: 0 });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communication/admin/notifications?limit=10');
      const items = res.data?.items || res.data?.data?.items || [];
      setCampaigns(items);
      setStats({
        totalCampaigns: res.data?.total || items.length,
        sentCount: items.filter((c: any) => c.status === 'SENT').length,
        scheduledCount: items.filter((c: any) => c.status === 'SCHEDULED').length,
        draftCount: items.filter((c: any) => c.status === 'DRAFT').length,
      });
    } catch (e) {
      console.error('Failed to load campaigns', e);
    } finally {
      setLoading(false);
    }
  };

  const sendNow = async (id: string) => {
    if (!confirm('Send this notification now?')) return;
    try {
      await api.post(`/communication/admin/notifications/${id}/send`);
      loadData();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to send notification');
    }
  };

  const deleteNotif = async (id: string) => {
    if (!confirm('Cancel/delete this notification?')) return;
    try {
      await api.delete(`/communication/admin/notifications/${id}`);
      loadData();
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const statCards = [
    { label: 'Total Campaigns', value: stats.totalCampaigns, icon: <Bell size={20} />, color: '#2563EB' },
    { label: 'Sent', value: stats.sentCount, icon: <CheckCircle size={20} />, color: '#059669' },
    { label: 'Scheduled', value: stats.scheduledCount, icon: <Clock size={20} />, color: '#D97706' },
    { label: 'Drafts', value: stats.draftCount, icon: <AlertCircle size={20} />, color: '#6B7280' },
  ];

  const STATUS_COLORS: Record<string, string> = {
    SENT: '#059669', SCHEDULED: '#D97706', DRAFT: '#6B7280', CANCELLED: '#DC2626',
  };
  const AUDIENCE_LABELS: Record<string, string> = {
    ALL: 'All Users', FREE_USERS: 'Free Users', PREMIUM_USERS: 'Premium', SELECTED: 'Selected', ANDROID: 'Android', IOS: 'iOS',
  };
  const TYPE_ICONS: Record<string, string> = {
    ANNOUNCEMENT: '📢', FEATURE_UPDATE: '✨', MAINTENANCE: '🔧', SECURITY: '🔒',
    OFFER: '🎁', PROMOTIONAL: '📣', REMINDER: '⏰', INFO: 'ℹ️',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Communication Center</h1>
            <p className="page-subtitle">Manage notifications, scheduled emails, and broadcasts to your users</p>
          </div>
          <button className="btn btn-primary" onClick={() => router.push('/communication/notifications/new')}>
            <Plus size={16} /> New Notification
          </button>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '1.5rem' }}>
          {statCards.map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="stat-label">{s.label}</p>
                  <p className="stat-value">{s.value}</p>
                </div>
                <div style={{ background: s.color + '20', color: s.color, padding: '10px', borderRadius: '10px' }}>
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Access Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Notification Campaigns', desc: 'Create & manage admin broadcasts', icon: <Bell size={24} />, href: '/communication/notifications', color: '#2563EB' },
            { label: 'New Notification', desc: 'Send to users immediately or schedule', icon: <Send size={24} />, href: '/communication/notifications/new', color: '#059669' },
            { label: 'Delivery Logs', desc: 'View all delivery history and analytics', icon: <BarChart3 size={24} />, href: '/communication/delivery-logs', color: '#7C3AED' },
          ].map((tile) => (
            <button key={tile.label} className="card" onClick={() => router.push(tile.href)}
              style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', padding: '1.25rem', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}>
              <div style={{ background: tile.color + '15', color: tile.color, padding: '10px', borderRadius: '10px', width: 'fit-content', marginBottom: '0.75rem' }}>
                {tile.icon}
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{tile.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tile.desc}</div>
            </button>
          ))}
        </div>

        {/* Recent Campaigns */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Campaigns</h2>
            <button className="btn btn-ghost" onClick={() => router.push('/communication/notifications')}>
              View All
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No notification campaigns yet.</p>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => router.push('/communication/notifications/new')}>
                <Plus size={16} /> Create First Campaign
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{TYPE_ICONS[c.notifType] || '📨'} {c.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.body?.slice(0, 60)}{c.body?.length > 60 ? '…' : ''}</div>
                      </td>
                      <td><span className="badge">{c.notifType}</span></td>
                      <td><span className="badge" style={{ background: '#EFF6FF', color: '#2563EB' }}><Users size={11} style={{ marginRight: '3px' }} />{AUDIENCE_LABELS[c.audience] || c.audience}</span></td>
                      <td><span className="badge" style={{ background: STATUS_COLORS[c.status] + '20', color: STATUS_COLORS[c.status] }}>{c.status}</span></td>
                      <td>{c.sentCount > 0 ? <span style={{ color: '#059669', fontWeight: 600 }}>{c.sentCount}</span> : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {c.status !== 'SENT' && c.status !== 'CANCELLED' && (
                            <button className="btn btn-sm btn-success" onClick={() => sendNow(c.id)} title="Send Now">
                              <Send size={14} />
                            </button>
                          )}
                          {c.status === 'SENT' && (
                            <button className="btn btn-sm btn-ghost" onClick={() => router.push(`/communication/notifications/${c.id}/stats`)} title="View Stats">
                              <BarChart3 size={14} />
                            </button>
                          )}
                          <button className="btn btn-sm btn-danger" onClick={() => deleteNotif(c.id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
