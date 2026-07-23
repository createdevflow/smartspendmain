'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/Sidebar";
import {
  TrendingUp, Users, Activity, BookOpen, UserCheck,
  UserPlus, Shield, Target, RefreshCw, AlertTriangle,
  ArrowUpRight, Settings,
} from "lucide-react";
import { api } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_ACTION_VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'gray'> = {
  LOGIN: 'success',
  LOGOUT: 'gray',
  LOGIN_FAILED: 'danger',
  REGISTER: 'info',
  EMAIL_VERIFIED: 'success',
  PASSWORD_RESET: 'warning',
  ACCOUNT_SUSPENDED: 'danger',
};

const EVENT_ACTION_LABEL: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Login Failed',
  REGISTER: 'Register',
  EMAIL_VERIFIED: 'Email Verified',
  PASSWORD_RESET: 'Password Reset',
  ACCOUNT_SUSPENDED: 'Suspended',
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
  const [authChecked, setAuthChecked] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, configRes] = await Promise.all([
        api.get('/admin/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/admin/app-config').catch(() => ({ data: { data: {} } })),
      ]);
      if (dashRes.data?.data?.metrics) setMetrics(dashRes.data.data.metrics);
      if (dashRes.data?.data?.monthlyTrend) setMonthlyTrend(dashRes.data.data.monthlyTrend);
      if (dashRes.data?.data?.recentEvents) setRecentEvents(dashRes.data.data.recentEvents);
      if (configRes.data?.data?.maintenance_mode !== undefined) {
        const val = configRes.data.data.maintenance_mode;
        setMaintenanceMode(val === true || val === 'true' || val === 1);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!(localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'))) {
        window.location.href = '/login';
        return;
      }
      setAuthChecked(true);
      fetchData();
    }
  }, []);

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Users',     value: metrics.totalUsers,         icon: Users,     variant: 'primary' as const },
    { label: 'Active Sessions', value: metrics.activeSessions,     icon: Activity,  variant: 'success' as const },
    { label: 'Transactions',    value: metrics.totalTransactions,  icon: TrendingUp,variant: 'info'    as const },
    { label: 'Cashbooks',       value: metrics.activeSubscriptions,icon: BookOpen,  variant: 'warning' as const },
    { label: 'New This Month',  value: metrics.newUsersThisMonth,  icon: UserPlus,  variant: 'primary' as const },
    { label: 'Verified Users',  value: metrics.verifiedUsers,      icon: UserCheck, variant: 'success' as const },
    { label: 'Active Goals',    value: metrics.totalGoals,         icon: Target,    variant: 'info'    as const },
    { label: 'Failed Logins',   value: metrics.recentFailedLogins, icon: Shield,    variant: 'danger'  as const },
  ];

  const maxTrend = Math.max(...monthlyTrend.map((m: any) => m.users), 1);

  return (
    <>
      <Sidebar />

      <main className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          {/* Page header */}
          <div className="page-header animate-fade-in">
            <div className="page-header-left">
              <h1 className="page-title">Dashboard</h1>
              <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>
                Real-time platform metrics and live telemetry.
              </p>
            </div>
          <div className="page-header-right">
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchData}
              disabled={loading}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Sync Data
            </button>
          </div>
        </div>

        {/* Maintenance alert */}
        {maintenanceMode && (
          <div
            role="alert"
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-btn)',
              padding: 'var(--sp-3) var(--sp-4)',
              marginBottom: 'var(--sp-6)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
            }}
          >
            <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} aria-hidden="true" />
            <div>
              <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 'var(--type-body)' }}>
                Maintenance Mode is Active
              </p>
              <p style={{ color: 'var(--danger)', fontSize: 'var(--type-caption)', marginTop: '2px' }}>
                Client access is currently blocked.{' '}
                <a href="/settings" style={{ color: 'var(--danger)', textDecoration: 'underline' }}>
                  Configure in Settings
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Metric cards */}
        <div className="stats-grid">
          {metricCards.map((card, i) => (
            <StatCard
              key={card.label}
              title={card.label}
              value={card.value}
              icon={card.icon}
              variant={card.variant}
              loading={loading}
              accentBorder
            />
          ))}
        </div>

        {/* Charts + audit row */}
        <div className="responsive-grid-2" style={{ marginBottom: 'var(--sp-6)' }}>
          {/* Monthly acquisition chart */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--sp-5)',
              }}
            >
              <div>
                <h3 className="card-title">Acquisition Trend</h3>
                <p className="caption-text" style={{ marginTop: 'var(--sp-1)' }}>
                  New registrations — last 6 months
                </p>
              </div>
              <TrendingUp size={16} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-btn)' }} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 'var(--sp-3)',
                  height: '140px',
                }}
                role="img"
                aria-label="Bar chart: new user registrations over the last 6 months"
              >
                {monthlyTrend.map((m: any, i) => {
                  const h = maxTrend > 0 ? Math.max(8, Math.round((m.users / maxTrend) * 120)) : 8;
                  const isLatest = i === monthlyTrend.length - 1;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--sp-2)',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <span
                        className="mono-text"
                        style={{
                          fontSize: '11px',
                          color: isLatest ? 'var(--brand-blue)' : 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {m.users}
                      </span>
                      <div
                        title={`${m.month}: ${m.users} new users`}
                        style={{
                          width: '100%',
                          height: `${h}px`,
                          borderRadius: '4px 4px 0 0',
                          background: isLatest
                            ? 'var(--brand-blue)'
                            : 'rgba(37, 99, 235, 0.18)',
                          transition: 'height var(--motion-base)',
                        }}
                      />
                      <span className="caption-text">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit feed */}
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--sp-4)',
              }}
            >
              <div>
                <h3 className="card-title">Live Audit Trail</h3>
                <p className="caption-text" style={{ marginTop: 'var(--sp-1)' }}>
                  Security &amp; access events
                </p>
              </div>
              <a
                href="/logs"
                className="btn btn-secondary btn-sm"
                aria-label="View full audit log"
              >
                Full Log
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: '40px', borderRadius: 'var(--radius-btn)' }}
                  />
                ))}
              </div>
            ) : recentEvents.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '140px',
                  gap: 'var(--sp-2)',
                }}
              >
                <Shield size={24} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                <p className="caption-text">No recent security events</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {recentEvents.slice(0, 6).map((event: any) => {
                  const variant = EVENT_ACTION_VARIANT[event.action] || 'gray';
                  const label = EVENT_ACTION_LABEL[event.action] || event.action.replace(/_/g, ' ');
                  return (
                    <div
                      key={event.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-3)',
                        padding: 'var(--sp-2) var(--sp-3)',
                        borderRadius: 'var(--radius-btn)',
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* Badge with text — never color alone */}
                      <Badge variant={variant} shape="pill">
                        {label}
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="caption-text"
                          style={{
                            color: 'var(--text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {event.user ? event.user.email : event.ipAddress}
                        </p>
                      </div>
                      <span
                        className="mono-text caption-text"
                        style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                      >
                        {formatDate(event.createdAt).split(',')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3
            className="section-heading"
            style={{ marginBottom: 'var(--sp-4)' }}
          >
            Quick Actions
          </h3>
          <div className="stats-grid">
            {[
              { href: '/users',        label: 'Manage Accounts',      desc: 'Search and moderate users',      icon: Users    },
              { href: '/transactions', label: 'Global Transactions',  desc: 'Platform-wide cashflow',         icon: Activity },
              { href: '/settings',     label: 'System Configuration', desc: 'Feature flags & maintenance',    icon: Settings },
              { href: '/logs',         label: 'Security & Audits',    desc: 'Monitor access logs',            icon: Shield   },
            ].map(({ href, label, desc, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="card"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--sp-3)',
                  transition: 'border-color var(--motion-fast)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-blue)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-btn)',
                    background: 'var(--info-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-blue)',
                  }}
                >
                  <Icon size={18} aria-hidden="true" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 'var(--type-card-title)',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--sp-1)',
                    }}
                  >
                    {label}
                  </p>
                  <p className="caption-text">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
        </div>
      </main>
    </>
  );
}
