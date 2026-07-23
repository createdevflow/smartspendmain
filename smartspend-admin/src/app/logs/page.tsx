'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
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
        <div className="page-header animate-fade-in">
          <div className="page-header-left">
            <h1 className="page-title">Logs &amp; Monitoring</h1>
            <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>Security audit trail, login events, and activity monitoring.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { fetchLogs(); fetchSummary(); }} aria-label="Refresh logs">
            <RefreshCw size={14} aria-hidden="true" /> Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--sp-6)' }}>
          <StatCard title="Failed Logins" value={summary.loginFailed} icon={AlertTriangle} variant="danger" accentBorder loading={loading} />
          <StatCard title="Total Logins" value={summary.totalLogins} icon={LogIn} variant="success" accentBorder loading={loading} />
          <StatCard title="Suspensions" value={summary.suspensions} icon={ShieldAlert} variant="warning" accentBorder loading={loading} />
          <StatCard title="Data Deletes" value={summary.dataDeletes} icon={AlertTriangle} variant="primary" accentBorder loading={loading} />
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ marginBottom: 'var(--sp-3)' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 'var(--sp-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              className="input-field"
              placeholder="Filter by email or IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 'calc(var(--sp-3) + 18px)', margin: 0 }}
              aria-label="Search logs"
            />
          </div>
          <select
            className="input-field"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            style={{ width: '180px', margin: 0 }}
            aria-label="Filter by action"
          >
            <option value="">All Actions</option>
            {AUDIT_ACTIONS.map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
          {(actionFilter || search) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setActionFilter(''); setSearch(''); setPage(1); }}>
              Clear
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div className="table-shell">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['Action', 'User', 'IP Address', 'User Agent', 'Date'].map(h => (
                    <th key={h} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}>
                          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: j === 0 ? '120px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="state-empty">
                        <div className="state-empty-icon"><ShieldAlert size={28} aria-hidden="true" /></div>
                        <p className="state-empty-title">No logs found</p>
                        <p className="state-empty-desc">Try clearing your filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.map(log => {
                  const actionMeta = ACTION_META[log.action] || { label: log.action, color: 'var(--text-secondary)', bg: 'var(--surface-raised)' };
                  return (
                    <tr key={log.id}>
                      <td>
                        <span className="pill" style={{ background: actionMeta.bg, color: actionMeta.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {actionMeta.icon}
                          {actionMeta.label || log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <p style={{ fontWeight: 600, margin: 0 }}>{log.user.fullName}</p>
                            <p className="caption-text" style={{ margin: 0 }}>{log.user.email}</p>
                          </div>
                        ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userAgent ? log.userAgent.substring(0, 50) + (log.userAgent.length > 50 ? '…' : '') : '—'}
                      </td>
                      <td>
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">{meta.total.toLocaleString()} total &bull; Page {page} of {meta.totalPages}</span>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} aria-label="Next page">›</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
