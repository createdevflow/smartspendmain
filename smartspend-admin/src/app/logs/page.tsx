'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, RefreshCw, ShieldAlert, LogIn, LogOut, AlertTriangle, UserCheck, Lock } from 'lucide-react';

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  LOGIN: { label: 'Login', icon: <LogIn size={12} />, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  LOGOUT: { label: 'Logout', icon: <LogOut size={12} />, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  LOGIN_FAILED: { label: 'Login Failed', icon: <AlertTriangle size={12} />, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  REGISTER: { label: 'Register', icon: <UserCheck size={12} />, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  EMAIL_VERIFIED: { label: 'Email Verified', icon: <UserCheck size={12} />, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  PASSWORD_CHANGED: { label: 'Password Changed', icon: <Lock size={12} />, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  PASSWORD_RESET: { label: 'Password Reset', icon: <Lock size={12} />, color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  DATA_EXPORT: { label: 'Data Export', icon: <ShieldAlert size={12} />, color: '#0284C7', bg: 'rgba(2,132,199,0.1)' },
  DATA_DELETE: { label: 'Data Delete', icon: <AlertTriangle size={12} />, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  ACCOUNT_SUSPENDED: { label: 'Suspended', icon: <ShieldAlert size={12} />, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  PROFILE_UPDATED: { label: 'Profile Updated', icon: <UserCheck size={12} />, color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  TRANSACTION_CREATED: { label: 'Tx Created', icon: <ShieldAlert size={12} />, color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  TRANSACTION_DELETED: { label: 'Tx Deleted', icon: <AlertTriangle size={12} />, color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const AUDIT_ACTIONS = [
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'REGISTER', 'EMAIL_VERIFIED',
  'PASSWORD_CHANGED', 'PASSWORD_RESET', 'PROFILE_UPDATED',
  'DATA_EXPORT', 'DATA_DELETE', 'ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED',
  'CASHBOOK_CREATED', 'CASHBOOK_DELETED',
  'TRANSACTION_CREATED', 'TRANSACTION_DELETED',
  'GOAL_CREATED', 'BUDGET_CREATED', 'PLAN_CHANGED',
];

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 30, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Summary stats
  const [summary, setSummary] = useState({
    loginFailed: 0,
    totalLogins: 0,
    suspensions: 0,
    dataDeletes: 0,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        ...(actionFilter ? { action: actionFilter } : {}),
      });
      const res = await api.get(`/admin/audit-logs?${params}`);
      const d = res.data?.data;
      setLogs(d?.data || []);
      setMeta(d?.meta || { total: 0, page: 1, limit: 30, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  const fetchSummary = async () => {
    try {
      const [failedRes, suspendedRes, deleteRes, loginRes] = await Promise.all([
        api.get('/admin/audit-logs?action=LOGIN_FAILED&limit=1'),
        api.get('/admin/audit-logs?action=ACCOUNT_SUSPENDED&limit=1'),
        api.get('/admin/audit-logs?action=DATA_DELETE&limit=1'),
        api.get('/admin/audit-logs?action=LOGIN&limit=1'),
      ]);
      setSummary({
        loginFailed: failedRes.data?.data?.meta?.total || 0,
        suspensions: suspendedRes.data?.data?.meta?.total || 0,
        dataDeletes: deleteRes.data?.data?.meta?.total || 0,
        totalLogins: loginRes.data?.data?.meta?.total || 0,
      });
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchSummary(); }, []);

  const filteredLogs = search
    ? logs.filter(l => l.user?.email?.toLowerCase().includes(search.toLowerCase()) || l.ipAddress?.includes(search))
    : logs;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Logs & Monitoring</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Security audit trail, login events, and activity monitoring.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => { fetchLogs(); fetchSummary(); }} style={{ gap: '0.5rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </header>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Failed Logins', value: summary.loginFailed, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: '🔴' },
            { label: 'Total Logins', value: summary.totalLogins, color: '#059669', bg: 'rgba(5,150,105,0.08)', icon: '🟢' },
            { label: 'Suspensions', value: summary.suspensions, color: '#D97706', bg: 'rgba(217,119,6,0.08)', icon: '🟡' },
            { label: 'Data Deletes', value: summary.dataDeletes, color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', icon: '🟣' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '1.125rem', borderLeft: `3px solid ${card.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{card.icon}</span>
              </div>
              <p style={{ fontSize: '1.625rem', fontWeight: 700, color: card.color }}>{card.value.toLocaleString()}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="input-field"
                placeholder="Filter by email or IP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem', margin: 0 }}
              />
            </div>
            <select
              className="input-field"
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              style={{ width: '180px', margin: 0 }}
            >
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.map(a => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
            {(actionFilter || search) && (
              <button className="btn btn-secondary" onClick={() => { setActionFilter(''); setSearch(''); setPage(1); }} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="card glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['Action', 'User', 'IP Address', 'User Agent', 'Date'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} style={{ padding: '0.875rem 1rem' }}>
                          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: j === 0 ? '120px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No logs found
                    </td>
                  </tr>
                ) : filteredLogs.map(log => {
                  const actionMeta = ACTION_META[log.action] || { label: log.action, color: '#6B7280', bg: 'rgba(107,114,128,0.1)' };
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '999px',
                          background: actionMeta.bg, color: actionMeta.color,
                        }}>
                          {actionMeta.icon}
                          {actionMeta.label || log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {log.user ? (
                          <div>
                            <p style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{log.user.fullName}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{log.user.email}</p>
                          </div>
                        ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent ? log.userAgent.substring(0, 50) + (log.userAgent.length > 50 ? '…' : '') : '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {meta.total.toLocaleString()} total logs
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.4rem 0.75rem' }}>
                  <ChevronLeft size={15} />
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
                  Page {page} of {meta.totalPages}
                </span>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} style={{ padding: '0.4rem 0.75rem' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
