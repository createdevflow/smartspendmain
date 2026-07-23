'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { relativeTime } from '@/lib/utils';
import { Bell, CheckCheck, Pin, Archive, Trash2, BellOff, PieChart, Target, CreditCard, FileText, Clock, Shield, Settings, Zap, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL',         label: 'All',         icon: Bell,           color: '#6B7280' },
  { key: 'BUDGET',      label: 'Budget',       icon: PieChart,      color: '#2D8CFF' },
  { key: 'GOAL',        label: 'Goals',        icon: Target,         color: '#059669' },
  { key: 'TRANSACTION', label: 'Transactions', icon: CreditCard,    color: '#F26D21' },
  { key: 'REPORT',      label: 'Reports',      icon: FileText,      color: '#D97706' },
  { key: 'SCHEDULER',   label: 'Scheduler',    icon: Clock,          color: '#0891B2' },
  { key: 'SECURITY',    label: 'Security',     icon: Shield,         color: '#DC2626' },
  { key: 'SYSTEM',      label: 'System',       icon: Settings,       color: '#6B7280' },
  { key: 'ADMIN',       label: 'Updates',      icon: Zap,            color: '#F59E0B' },
];

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  isRead?: boolean;
  pinned?: boolean;
  isPinned?: boolean;
  createdAt: string;
  category?: string;
  imageUrl?: string;
  actionButton?: string;
  actionUrl?: string;
  data?: any;
}

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  TRANSACTION: { emoji: '💸', color: '#2D8CFF' },
  INVOICE:     { emoji: '🧾', color: '#7C3AED' },
  GOAL:        { emoji: '🎯', color: '#059669' },
  BUDGET:      { emoji: '📊', color: '#F59E0B' },
  SYSTEM:      { emoji: '⚙️', color: '#64748B' },
  AI:          { emoji: '🤖', color: '#0891B2' },
  SECURITY:    { emoji: '🔒', color: '#DC2626' },
};

export default function NotificationsPage() {
  const { user, refreshUser } = useApp();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('ALL');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = (cat = activeCat) => {
    setLoading(true);
    const url = cat === 'ALL' ? '/notifications?limit=50' : `/notifications?category=${cat}&limit=50`;
    api.get(url).then(r => {
      const d = r.data?.data || r.data;
      const list = Array.isArray(d?.items || d) ? (d?.items || d) : [];
      setNotifs(list);
      setUnreadCount(typeof d?.unreadCount === 'number' ? d.unreadCount : list.filter((n: any) => !n.isRead && !n.read).length);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(activeCat); }, [activeCat]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
    setUnreadCount(0);
    refreshUser();
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    refreshUser();
  };

  const deleteNotif = async (id: string) => {
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const archiveNotif = async (id: string) => {
    await api.patch(`/notifications/${id}/archive`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const pinNotif = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/notifications/${id}/pin`);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, pinned: !currentStatus, isPinned: !currentStatus } : n));
    } catch (e) {}
  };

  const handleAcceptInvite = async (n: Notification) => {
    try {
      let parsed = n.data || {};
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      if (!parsed.token) { alert('Invalid invite token'); return; }
      await api.post(`/cashbooks/accept-invite/${parsed.token}`);
      alert('You have joined the cashbook!');
      markRead(n.id);
      window.location.reload(); // Quick refresh
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to accept invite');
    }
  };

  const handleActionClick = (n: Notification) => {
    if (!n.read && !n.isRead) markRead(n.id);
    if (n.actionUrl) {
      window.open(n.actionUrl, '_blank');
    }
  };

  const unread = unreadCount;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Notifications"
          subtitle={unread > 0 ? `${unread} unread` : 'All caught up!'}
          action={
            unread > 0 ? (
              <button className="btn btn-secondary" onClick={markAllRead}><CheckCheck size={15} /> Mark all read</button>
            ) : undefined
          }
        />

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.75rem 1.5rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => {
            const active = activeCat === cat.key;
            const Icon = cat.icon;
            return (
              <button key={cat.key} onClick={() => setActiveCat(cat.key)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '20px', border: active ? 'none' : '1px solid var(--border)', background: active ? 'var(--accent-primary)' : 'var(--bg-primary)', color: active ? '#fff' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Icon size={14} />
                {cat.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', display: 'flex', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-hover)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '0.875rem', width: '50%', background: 'var(--bg-hover)', borderRadius: '4px', marginBottom: '0.5rem' }} />
                  <div style={{ height: '0.75rem', width: '75%', background: 'var(--bg-hover)', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <h3 style={{ marginBottom: '0.5rem' }}>All caught up!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>You have no notifications.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {notifs.map((n, i) => {
              const meta = TYPE_META[n.category || n.type] || TYPE_META['SYSTEM'];
              const isRead = n.read || n.isRead;
              const isPinned = n.pinned || n.isPinned;
              const isInvite = n.type === 'IN_APP' && n.title.includes('Invite');

              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem 1.5rem', borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none', background: isRead ? 'transparent' : 'rgba(45,140,255,0.03)', borderLeft: isRead ? '4px solid transparent' : '4px solid var(--accent-primary)', transition: 'background 0.15s', cursor: 'pointer' }}
                  onClick={() => !isRead && markRead(n.id)}>
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    {meta.emoji}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <p style={{ fontWeight: isRead ? 600 : 700, fontSize: 'var(--text-sm)', color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)', margin: 0 }}>
                        {isPinned && <Pin size={11} style={{ marginRight: '6px', color: 'var(--warning)' }} />}
                        {n.title}
                      </p>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', flexShrink: 0 }}>{relativeTime(n.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{n.body}</p>
                    
                    {n.imageUrl && (
                      <img src={n.imageUrl} alt="Notification Banner" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '10px', marginTop: '0.75rem' }} />
                    )}

                    {isInvite && (
                      <button onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n); }} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        <CheckCircle size={14} /> Accept Invite
                      </button>
                    )}

                    {!isInvite && n.actionButton && n.actionUrl && (
                      <button onClick={(e) => { e.stopPropagation(); handleActionClick(n); }} style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: meta.color, color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
                        {n.actionButton}
                      </button>
                    )}

                    {isPinned && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.5rem' }}>
                        <Pin size={12} color="var(--warning)" />
                        <span style={{ fontSize: '0.65rem', color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pinned</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.25rem', opacity: 0.6 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost" title="Pin" style={{ padding: '0.375rem' }} onClick={() => pinNotif(n.id, isPinned || false)}><Pin size={14} /></button>
                    <button className="btn btn-ghost" title="Archive" style={{ padding: '0.375rem' }} onClick={() => archiveNotif(n.id)}><Archive size={14} /></button>
                    <button className="btn btn-ghost" title="Delete" style={{ padding: '0.375rem', color: 'var(--danger)' }} onClick={() => deleteNotif(n.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
