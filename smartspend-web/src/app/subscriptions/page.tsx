'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { Repeat, Calendar, DollarSign, AlertCircle, Plus, Pause, Play, Trash2 } from 'lucide-react';

export default function SubscriptionsPage() {
  const { user, isFeatureEnabled } = useApp();
  const currency = user?.currency || 'INR';
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const cbsRes = await api.get('/cashbooks');
      const cbs = cbsRes.data?.data || [];
      if (cbs.length > 0) {
        // Just fetch all scheduled txs across all cashbooks for now if backend supports, else from first
        const res = await api.get(`/transactions/scheduled/${cbs[0].id}`);
        setSubs(res.data?.data || res.data || []);
      }
    } catch { setSubs([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isFeatureEnabled('subscriptions')) { setLoading(false); return; }
    fetchSubs();
  }, [isFeatureEnabled]);

  const handleToggleStatus = async (sub: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = sub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await api.patch(`/transactions/scheduled/${sub.id}`, { status: newStatus });
      fetchSubs();
    } catch {
      alert('Failed to update status');
    }
  };

  const totalMonthly = subs.reduce((a, s) => a + Number(s.amount || 0), 0);
  const active = subs.filter(s => s.status === 'ACTIVE').length;
  const upcoming = subs.filter(s => {
    if (!s.nextDate) return false;
    const next = new Date(s.nextDate);
    const now = new Date();
    return next.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  if (!isFeatureEnabled('subscriptions')) {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <TopBar title="Subscriptions" />
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Subscriptions Disabled</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>This feature has been disabled by the administrator.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Subscriptions"
          subtitle="Recurring bills and scheduled payments"
          action={
            <button className="btn btn-primary" onClick={() => { setSelectedSub(null); setModalOpen(true); }}>
              <Plus size={15} /> Add Subscription
            </button>
          }
        />

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Monthly Total" value={fmt(totalMonthly, currency)} icon={DollarSign} loading={loading} />
          <StatCard title="Active" value={String(active)} icon={Repeat} iconBg="#ECFDF5" iconColor="var(--success)" loading={loading} />
          <StatCard title="Due This Week" value={String(upcoming)} icon={AlertCircle} iconBg={upcoming > 0 ? '#FFFBEB' : '#ECFDF5'} iconColor={upcoming > 0 ? 'var(--warning)' : 'var(--success)'} loading={loading} />
          <StatCard title="Total Tracked" value={String(subs.length)} icon={Calendar} loading={loading} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="card" style={{ height: '160px', background: 'var(--bg-hover)' }} />)}
          </div>
        ) : subs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No recurring bills</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Add recurring expenses to track subscriptions and bills.</p>
            <button className="btn btn-primary" onClick={() => { setSelectedSub(null); setModalOpen(true); }}><Plus size={14} /> Add Subscription</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {subs.map((sub: any, i: number) => {
              const isDueSoon = sub.nextDate && (new Date(sub.nextDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000);
              return (
                <div key={sub.id || i} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedSub(sub); setModalOpen(true); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)', flexShrink: 0 }}>
                        {(sub.merchant || sub.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>{sub.merchant || sub.name}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{sub.category || 'Recurring'}</p>
                      </div>
                    </div>
                    <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>{sub.status || 'ACTIVE'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.625rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(Number(sub.amount), currency)}</h2>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>/ {sub.cycle?.toLowerCase() || 'month'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'var(--text-xs)', color: isDueSoon ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      <Calendar size={13} />
                      Next: {sub.nextDate ? fmtDate(sub.nextDate) : '—'}
                      {isDueSoon && ' · Due soon!'}
                    </div>
                    <button className="btn btn-ghost" style={{ padding: '0.375rem' }} onClick={(e) => handleToggleStatus(sub, e)}>
                      {sub.status === 'ACTIVE' ? <Pause size={15} /> : <Play size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SubscriptionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} subscription={selectedSub} onSuccess={fetchSubs} />
      </main>
    </>
  );
}
