'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Search, ChevronLeft, ChevronRight, RefreshCw, Download,
  UserX, RotateCcw, ChevronDown, Shield, CheckCircle, AlertTriangle,
  Users, UserCheck, UserMinus, Activity, Trash2, Key, LogIn,
} from 'lucide-react';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  SUSPENDED: { label: 'Suspended', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  BANNED: { label: 'Banned', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  PENDING: { label: 'Pending', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  PENDING_VERIFICATION: { label: 'Unverified', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ActionType = 'status' | 'delete' | 'hard-delete' | 'reset' | 'password' | 'impersonate';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionUser, setActionUser] = useState<{ user: any; action: ActionType } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [statusValue, setStatusValue] = useState('ACTIVE');
  const [passwordValue, setPasswordValue] = useState('');
  const [impersonateResult, setImpersonateResult] = useState<{ accessToken: string; user: any } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/admin/users?${params}`);
      const d = res.data?.data;
      setUsers(d?.data || []);
      setMeta(d?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const closeModal = () => {
    setActionUser(null);
    setActionError('');
    setPasswordValue('');
    setImpersonateResult(null);
  };

  const handleAction = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (actionUser.action === 'status') {
        await api.patch(`/admin/users/${actionUser.user.id}/status`, { status: statusValue });
        closeModal();
        fetchUsers();
      } else if (actionUser.action === 'delete') {
        await api.delete(`/admin/users/${actionUser.user.id}`);
        closeModal();
        fetchUsers();
      } else if (actionUser.action === 'hard-delete') {
        await api.delete(`/admin/users/${actionUser.user.id}/hard`);
        closeModal();
        fetchUsers();
      } else if (actionUser.action === 'reset') {
        await api.post(`/admin/users/${actionUser.user.id}/reset`);
        closeModal();
        fetchUsers();
      } else if (actionUser.action === 'password') {
        if (!passwordValue || passwordValue.length < 8) {
          setActionError('Password must be at least 8 characters');
          return;
        }
        await api.patch(`/admin/users/${actionUser.user.id}/password`, { password: passwordValue });
        closeModal();
      } else if (actionUser.action === 'impersonate') {
        const res = await api.post(`/admin/users/${actionUser.user.id}/impersonate`);
        setImpersonateResult(res.data?.data || res.data);
      }
    } catch (e: any) {
      setActionError(e.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Role', 'Plan', 'Verified', 'Joined', 'Last Login'];
    const rows = users.map(u => [
      u.fullName, u.email, u.phone || '',
      u.status, u.role, u.plan?.name || 'No Plan',
      u.isEmailVerified ? 'Yes' : 'No',
      formatDate(u.createdAt), u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashtro_users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">User Management</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{meta.total.toLocaleString()} total users</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={fetchUsers} style={{ gap: '0.5rem' }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn btn-secondary" onClick={exportCSV} style={{ gap: '0.5rem' }}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </header>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users', value: meta.total, icon: <Users size={20} style={{ color: '#2563EB' }} />, color: '#2563EB' },
            { label: 'Active', value: users.filter(u => u.status === 'ACTIVE').length, icon: <UserCheck size={20} style={{ color: '#059669' }} />, color: '#059669' },
            { label: 'Suspended', value: users.filter(u => u.status === 'SUSPENDED').length, icon: <UserMinus size={20} style={{ color: '#D97706' }} />, color: '#D97706' },
            { label: 'Banned', value: users.filter(u => u.status === 'BANNED').length, icon: <UserX size={20} style={{ color: '#DC2626' }} />, color: '#DC2626' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid ${card.color}` }}>
              {card.icon}
              <div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{card.label}</p>
              </div>
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
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: '2.25rem', margin: 0 }}
              />
            </div>
            <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: '140px', margin: 0 }}>
              <option value="">All Status</option>
              <option>ACTIVE</option>
              <option>SUSPENDED</option>
              <option>BANNED</option>
              <option>PENDING</option>
            </select>
            <select className="input-field" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ width: '130px', margin: 0 }}>
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {(search || statusFilter || roleFilter) && (
              <button className="btn btn-secondary" onClick={() => { setSearch(''); setStatusFilter(''); setRoleFilter(''); setPage(1); }} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Status', 'Role', 'Plan', 'Activity', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} style={{ padding: '0.875rem 1rem' }}>
                          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: j === 0 ? '160px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No users found
                    </td>
                  </tr>
                ) : users.map(user => {
                  const statusMeta = STATUS_META[user.status] || STATUS_META.PENDING;
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, color: 'white', fontWeight: 700, fontSize: '0.875rem',
                          }}>
                            {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{user.fullName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user.email}</p>
                            {!user.isEmailVerified && (
                              <span style={{ fontSize: '0.65rem', color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '1px 6px', borderRadius: '999px' }}>
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '999px', background: statusMeta.bg, color: statusMeta.color }}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {user.role === 'SUPER_ADMIN' ? '👑 ' : user.role === 'ADMIN' ? '🛡 ' : ''}{user.role}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {user.plan ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '999px', background: `${user.plan.color || '#2563EB'}20`, color: user.plan.color || '#2563EB' }}>
                            {user.plan.name}
                          </span>
                        ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>None</span>}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          <span title="Transactions">{user._count?.transactions ?? 0} tx</span>
                          <span>·</span>
                          <span title="Cashbooks">{user._count?.cashbooks ?? 0} books</span>
                        </div>
                        {user.lastLoginAt && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                            Last: {formatDate(user.lastLoginAt)}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(user.createdAt)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <button title="Change Status" className="btn btn-secondary"
                            onClick={() => { setStatusValue(user.status); setActionUser({ user, action: 'status' }); }}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            <Shield size={13} />
                          </button>
                          <button title="Change Password" className="btn btn-secondary"
                            onClick={() => setActionUser({ user, action: 'password' })}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            <Key size={13} />
                          </button>
                          <button title="Login As User" className="btn btn-secondary"
                            onClick={() => setActionUser({ user, action: 'impersonate' })}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#7C3AED', borderColor: '#7C3AED' }}>
                            <LogIn size={13} />
                          </button>
                          <button title="Reset Account Data" className="btn btn-secondary"
                            onClick={() => setActionUser({ user, action: 'reset' })}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            <RotateCcw size={13} />
                          </button>
                          <button title="Soft Delete" className="btn btn-secondary"
                            onClick={() => setActionUser({ user, action: 'delete' })}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#D97706', borderColor: '#D97706' }}>
                            <UserX size={13} />
                          </button>
                          <button title="Permanent Delete (irreversible)" className="btn btn-secondary"
                            onClick={() => setActionUser({ user, action: 'hard-delete' })}
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                Showing {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total.toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.4rem 0.75rem' }}>
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                  return (
                    <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)} style={{ padding: '0.4rem 0.75rem', minWidth: '36px' }}>
                      {p}
                    </button>
                  );
                })}
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} style={{ padding: '0.4rem 0.75rem' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Action Modal ─── */}
      {actionUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="card" style={{ width: '440px', padding: '1.75rem', boxShadow: 'var(--shadow-xl)' }}>

            {/* Status Change */}
            {actionUser.action === 'status' && (
              <>
                <h3 style={{ marginBottom: '0.5rem' }}>Change User Status</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Update status for <strong>{actionUser.user.fullName}</strong>.
                </p>
                <div className="input-group">
                  <label className="input-label">New Status</label>
                  <select className="input-field" value={statusValue} onChange={e => setStatusValue(e.target.value)}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BANNED">Banned</option>
                  </select>
                </div>
              </>
            )}

            {/* Change Password */}
            {actionUser.action === 'password' && (
              <>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Key size={18} /> Change Password
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                  Set a new password for <strong>{actionUser.user.fullName}</strong>. All active sessions will be revoked.
                </p>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Min 8 characters"
                    value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                    autoFocus
                  />
                </div>
              </>
            )}

            {/* Impersonate / Login As */}
            {actionUser.action === 'impersonate' && !impersonateResult && (
              <>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LogIn size={18} style={{ color: '#7C3AED' }} /> Login As User
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Generate a 15-minute access token for <strong>{actionUser.user.fullName}</strong> ({actionUser.user.email}).
                </p>
                <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: '#7C3AED', fontSize: '0.8125rem' }}>⚠️ This token expires in 15 minutes. Use it to debug or verify the user's experience.</p>
                </div>
              </>
            )}

            {/* Impersonate Result */}
            {actionUser.action === 'impersonate' && impersonateResult && (
              <>
                <h3 style={{ marginBottom: '0.5rem', color: '#059669' }}>✅ Token Generated</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  15-minute access token for <strong>{impersonateResult.user?.fullName}</strong>:
                </p>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1rem', wordBreak: 'break-all', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {impersonateResult.accessToken}
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }}
                  onClick={() => { navigator.clipboard.writeText(impersonateResult.accessToken); }}>
                  Copy Token to Clipboard
                </button>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>
                  Use this token as Bearer auth in API calls or inject it into the app's secure storage.
                </p>
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }} onClick={closeModal}>Close</button>
                return null;
              </>
            )}

            {/* Soft Delete */}
            {actionUser.action === 'delete' && (
              <>
                <h3 style={{ marginBottom: '0.5rem', color: '#D97706' }}>Soft Delete Account</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Soft-delete <strong>{actionUser.user.fullName}</strong>'s account. Frees email & phone for re-registration. Data stays in database.
                </p>
                <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: '#D97706', fontSize: '0.8125rem' }}>⚠️ Recoverable from database directly. All sessions will be invalidated.</p>
                </div>
              </>
            )}

            {/* Hard Delete */}
            {actionUser.action === 'hard-delete' && (
              <>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trash2 size={18} /> Permanent Delete
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Permanently erase <strong>{actionUser.user.fullName}</strong>'s account and ALL associated data from the database.
                </p>
                <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: 'var(--danger)', fontSize: '0.8125rem' }}>🚨 THIS IS IRREVERSIBLE. Transactions, cashbooks, sessions, OTPs — everything will be permanently deleted from the database.</p>
                </div>
              </>
            )}

            {/* Reset Data */}
            {actionUser.action === 'reset' && (
              <>
                <h3 style={{ marginBottom: '0.5rem', color: 'var(--warning)' }}>Reset Account Data</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Delete all transactions, cashbooks, budgets, and goals for <strong>{actionUser.user.fullName}</strong>. Account login remains active.
                </p>
                <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '1.25rem' }}>
                  <p style={{ color: 'var(--warning)', fontSize: '0.8125rem' }}>⚠️ All financial data will be removed. This is a soft delete and can be recovered from the database directly.</p>
                </div>
              </>
            )}

            {actionError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{actionError}</p>
            )}

            {/* Show action buttons only when not showing impersonate result */}
            {!(actionUser.action === 'impersonate' && impersonateResult) && (
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAction}
                  disabled={actionLoading}
                  style={{
                    background: actionUser.action === 'hard-delete' ? 'var(--danger)'
                      : actionUser.action === 'delete' ? '#D97706'
                      : actionUser.action === 'reset' ? 'var(--warning)'
                      : actionUser.action === 'impersonate' ? '#7C3AED'
                      : undefined,
                    borderColor: actionUser.action === 'hard-delete' ? 'var(--danger)'
                      : actionUser.action === 'delete' ? '#D97706'
                      : actionUser.action === 'reset' ? 'var(--warning)'
                      : actionUser.action === 'impersonate' ? '#7C3AED'
                      : undefined,
                  }}
                >
                  {actionLoading ? 'Processing...'
                    : actionUser.action === 'hard-delete' ? '🚨 Permanently Delete'
                    : actionUser.action === 'delete' ? 'Soft Delete'
                    : actionUser.action === 'reset' ? 'Reset Data'
                    : actionUser.action === 'password' ? 'Change Password'
                    : actionUser.action === 'impersonate' ? 'Generate Token'
                    : 'Update Status'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
