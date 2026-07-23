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
    const token = (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    if (!token) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/communication/admin/notifications?limit=10&t=' + Date.now());
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
      setCampaigns(prev => prev.filter(c => c.id !== id));
      await api.delete(`/communication/admin/notifications/${id}`);
      loadData();
    } catch (e) {
      alert('Failed to delete');
      loadData();
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
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header animate-fade-in">
          <div className="page-header-left">
            <h1 className="page-title">Communication Center</h1>
            <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>Manage notifications, scheduled emails, and broadcasts</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/communication/notifications/new')}>
            <Plus size={14} aria-hidden="true" /> New Notification
          </button>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          {[
            { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Bell, variant: 'primary' as const },
            { label: 'Sent', value: stats.sentCount, icon: CheckCircle, variant: 'success' as const },
            { label: 'Scheduled', value: stats.scheduledCount, icon: Clock, variant: 'warning' as const },
            { label: 'Drafts', value: stats.draftCount, icon: AlertCircle, variant: 'info' as const },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
                <div style={{ background: `var(--${s.variant === 'primary' ? 'info' : s.variant}-bg)`, color: `var(--${s.variant === 'primary' ? 'info' : s.variant})`, padding: 'var(--sp-2)', borderRadius: 'var(--radius-badge)', flexShrink: 0 }}>
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                  <p className="label-text" style={{ marginBottom: 'var(--sp-1)' }}>{s.label}</p>
                  <p className="mono-text" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Access Tiles */}
        <div className="stats-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          {[
            { label: 'Notification Campaigns', desc: 'Create & manage admin broadcasts', icon: Bell, href: '/communication/notifications' },
            { label: 'In-App Chat Hub', desc: 'Monitor platform metrics & broadcasts', icon: MessageCircle, href: '/communication/chat-hub' },
            { label: 'New Notification', desc: 'Send to users immediately or schedule', icon: Send, href: '/communication/notifications/new' },
            { label: 'Delivery Logs', desc: 'View all delivery history and analytics', icon: BarChart3, href: '/communication/delivery-logs' },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <a
                key={tile.label}
                href={tile.href}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', textDecoration: 'none', cursor: 'pointer', transition: 'border-color var(--motion-fast)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-blue)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ background: 'var(--info-bg)', color: 'var(--brand-blue)', padding: 'var(--sp-2)', borderRadius: 'var(--radius-btn)', width: 'fit-content' }}>
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 'var(--type-card-title)', color: 'var(--text-primary)', marginBottom: 'var(--sp-1)' }}>{tile.label}</p>
                  <p className="caption-text">{tile.desc}</p>
                </div>
              </a>
            );
          })}
        </div>

        {/* Recent Campaigns */}
        <div className="table-shell">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--border)' }}>
            <h2 className="card-title">Recent Campaigns</h2>
            <a href="/communication/notifications" className="btn btn-ghost btn-sm">View All</a>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Type</th>
                  <th scope="col">Audience</th>
                  <th scope="col">Status</th>
                  <th scope="col">Sent</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[180, 80, 80, 70, 50, 80].map((w, j) => (
                        <td key={j}><div className="skeleton" style={{ height: '13px', width: `${w}px`, borderRadius: '3px' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className="state-empty">
                        <div className="state-empty-icon"><Bell size={32} aria-hidden="true" /></div>
                        <p className="state-empty-title">No campaigns yet</p>
                        <p className="state-empty-desc">Create your first notification campaign.</p>
                        <a href="/communication/notifications/new" className="btn btn-primary btn-sm">
                          <Plus size={14} aria-hidden="true" /> Create Campaign
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{TYPE_ICONS[c.notifType] || '📨'} {c.title}</div>
                      <div className="caption-text" style={{ marginTop: '2px' }}>{c.body?.slice(0, 60)}{c.body?.length > 60 ? '…' : ''}</div>
                    </td>
                    <td><span className="pill pill-gray">{c.notifType}</span></td>
                    <td><span className="pill pill-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Users size={11} aria-hidden="true" />{AUDIENCE_LABELS[c.audience] || c.audience}</span></td>
                    <td><span className={`pill ${c.status === 'SENT' ? 'pill-success' : c.status === 'SCHEDULED' ? 'pill-warning' : c.status === 'CANCELLED' ? 'pill-danger' : 'pill-gray'}`}>{c.status}</span></td>
                    <td className="tabular">{c.sentCount > 0 ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{c.sentCount}</span> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
                        {c.status !== 'SENT' && c.status !== 'CANCELLED' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => sendNow(c.id)} aria-label="Send now"><Send size={13} aria-hidden="true" /></button>
                        )}
                        {c.status === 'SENT' && (
                          <a href={`/communication/notifications/${c.id}/stats`} className="btn btn-ghost btn-sm" aria-label="View stats"><BarChart3 size={13} aria-hidden="true" /></a>
                        )}
                        <button className="btn btn-destructive btn-sm" onClick={() => deleteNotif(c.id)} aria-label="Delete campaign"><Trash2 size={13} aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
