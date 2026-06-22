'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import {
  TrendingUp, Users, CreditCard, Activity, BookOpen, UserCheck,
  UserPlus, Database, Shield, Target, RefreshCw, AlertTriangle,
  ArrowUpRight, TrendingDown,
} from "lucide-react";
import { api } from '@/lib/api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_COLORS: Record<string, string> = {
  LOGIN: '#059669',
  LOGOUT: '#9CA3AF',
  LOGIN_FAILED: '#DC2626',
  REGISTER: '#2563EB',
  EMAIL_VERIFIED: '#059669',
  PASSWORD_RESET: '#D97706',
  ACCOUNT_SUSPENDED: '#DC2626',
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0, activeSessions: 0, totalTransactions: 0,
    activeSubscriptions: 0, newUsersThisMonth: 0, verifiedUsers: 0,
    suspendedUsers: 0, totalGoals: 0, totalBudgets: 0, recentFailedLogins: 0,
  });
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, configRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/app-config'),
      ]);
      if (dashRes.data?.data?.metrics) setMetrics(dashRes.data.data.metrics);
      if (dashRes.data?.data?.monthlyTrend) setMonthlyTrend(dashRes.data.data.monthlyTrend);
      if (dashRes.data?.data?.recentEvents) setRecentEvents(dashRes.data.data.recentEvents);
      if (configRes.data?.data?.maintenance_mode !== undefined) {
        setMaintenanceMode(String(configRes.data.data.maintenance_mode) === 'true');
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('adminToken')) {
      window.location.href = '/login';
      return;
    }
    fetchData();
  }, []);

  const metricCards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: <Users />, color: 'var(--accent-primary)', bg: 'rgba(59,130,246,0.1)', badge: 'All Time' },
    { label: 'Active Sessions', value: metrics.activeSessions, icon: <Activity />, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)', badge: '🟢 Live' },
    { label: 'Transactions', value: metrics.totalTransactions, icon: <TrendingUp />, color: 'var(--warning)', bg: 'rgba(245,158,11,0.1)', badge: 'All Time' },
    { label: 'Cashbooks', value: metrics.activeSubscriptions, icon: <BookOpen />, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)', badge: 'Total' },
    { label: 'New This Month', value: metrics.newUsersThisMonth, icon: <UserPlus />, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', badge: 'Monthly' },
    { label: 'Verified Users', value: metrics.verifiedUsers, icon: <UserCheck />, color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)', badge: 'Email' },
    { label: 'Active Goals', value: metrics.totalGoals, icon: <Target />, color: '#10B981', bg: 'rgba(16,185,129,0.1)', badge: 'Savings' },
    { label: 'Failed Logins', value: metrics.recentFailedLogins, icon: <Shield />, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', badge: 'This Month' },
  ];

  // Chart normalization
  const maxTrend = Math.max(...monthlyTrend.map((m: any) => m.users), 1);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Dashboard Overview</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Real-time metrics and activity for your Cashtro platform.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={fetchData} style={{ gap: '0.5rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        {/* Maintenance Mode Alert */}
        {maintenanceMode && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div>
              <p style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.875rem' }}>⚠️ Maintenance Mode Active</p>
              <p style={{ color: 'var(--danger)', fontSize: '0.8rem', opacity: 0.85 }}>All users are seeing the maintenance screen. <a href="/settings" style={{ color: 'var(--danger)', textDecoration: 'underline' }}>Go to Settings → Feature Toggles</a> to disable it.</p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
          {metricCards.map(card => (
            <div key={card.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                  {card.icon}
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid var(--border)' }}>
                  {card.badge}
                </span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: '32px', width: '80px', borderRadius: '4px', marginBottom: '0.5rem' }} />
              ) : (
                <p style={{ fontSize: '2rem', fontWeight: 800, color: card.color, lineHeight: 1.1, marginBottom: '0.375rem' }}>
                  {card.value.toLocaleString()}
                </p>
              )}
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{card.label}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Monthly Users Chart */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>New Users (Last 6 Months)</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>Monthly registration trend</p>
              </div>
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
            </div>
            {loading ? (
              <div className="skeleton" style={{ height: '140px', borderRadius: '8px' }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.625rem', height: '140px', padding: '0 0.25rem' }}>
                {monthlyTrend.map((m: any, i) => {
                  const h = maxTrend > 0 ? Math.max(8, Math.round((m.users / maxTrend) * 120)) : 8;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.users}</span>
                      <div title={`${m.month}: ${m.users} users`} style={{
                        width: '100%', height: `${h}px`, borderRadius: '6px 6px 0 0',
                        background: `linear-gradient(180deg, #2563EB, #7C3AED)`,
                        opacity: i === monthlyTrend.length - 1 ? 1 : 0.6,
                        transition: 'all 0.3s ease',
                        cursor: 'default',
                      }} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Audit Events */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Recent Activity</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>Latest audit events</p>
              </div>
              <a href="/logs" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                View all <ArrowUpRight size={12} />
              </a>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '6px' }} />)}
              </div>
            ) : recentEvents.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>No recent events</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {recentEvents.slice(0, 8).map((event: any) => (
                  <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-elevated)' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: EVENT_COLORS[event.action] || '#6B7280',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {event.action.replace(/_/g, ' ')}
                        {event.user ? ` — ${event.user.email}` : ''}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {event.ipAddress} · {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.25rem' }}>
          {[
            { href: '/users', label: 'Manage Users', desc: 'Search, suspend, or delete accounts', icon: '👥', color: '#2563EB' },
            { href: '/transactions', label: 'Transactions', desc: 'View all transactions across all users', icon: '💳', color: '#059669' },
            { href: '/logs', label: 'Audit Logs', desc: 'Monitor security events and logins', icon: '🔒', color: '#DC2626' },
            { href: '/settings', label: 'Feature Toggles', desc: 'Enable or disable app features', icon: '⚙️', color: '#7C3AED' },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="card"
              style={{ padding: '1.25rem', textDecoration: 'none', display: 'block', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>{link.icon}</span>
              <p style={{ fontWeight: 600, color: link.color, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{link.label}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{link.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </>
  );
}
