'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trash2, RotateCcw, Search, ChevronLeft, ChevronRight, 
  AlertTriangle, User, Calendar, Clock, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';

export default function DeletedUsersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
    if (!token) { router.push('/login'); return; }
    setAuthChecked(true);
  }, [router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users/deleted', { params: { search, page, limit: 20 } });
      const payload = res.data?.data || res.data;
      setUsers(Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : []);
      if (payload?.meta) setMeta(payload.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (authChecked) fetchUsers();
  }, [authChecked, fetchUsers]);

  const handleRestore = async (userId: string, name: string) => {
    if (!confirm(`Restore account for ${name}? They will regain access immediately.`)) return;
    try {
      await api.patch(`/admin/users/${userId}/restore`);
      fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Restore failed');
    }
  };

  const handleHardDelete = async (userId: string, name: string) => {
    const confirm1 = prompt(`PERMANENTLY DELETE ${name} and ALL their data?\n\nThis CANNOT be undone. Type DELETE to confirm:`);
    if (confirm1 !== 'DELETE') return;
    try {
      await api.delete(`/admin/users/${userId}/hard`);
      fetchUsers();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Deletion failed');
    }
  };

  const handleBulkRestore = async () => {
    if (!confirm(`Restore ${selectedIds.length} users?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/admin/users/${id}/restore`)));
      setSelectedIds([]);
      fetchUsers();
    } catch (e) {
      alert('Bulk restore failed');
    }
  };

  const handleBulkHardDelete = async () => {
    const confirm1 = prompt(`PERMANENTLY DELETE ${selectedIds.length} users? Type DELETE:`);
    if (confirm1 !== 'DELETE') return;
    try {
      await api.post('/admin/users/bulk/delete', { userIds: selectedIds });
      setSelectedIds([]);
      fetchUsers();
    } catch (e) {
      alert('Bulk delete failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedIds(prev => prev.length === users.length ? [] : users.map(u => u.id));
  };

  if (!authChecked) return null;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => router.push('/users')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                <ArrowLeft size={16} /> Back to Users
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: 10, backgroundColor: 'var(--danger-bg)', display: 'flex' }}>
                  <Trash2 size={18} color="var(--danger)" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Soft Deleted Users</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                {meta.total} deleted accounts — restore them or permanently erase
              </p>
            </div>
            <button onClick={fetchUsers} className="btn" style={{ gap: '0.5rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Warning Banner */}
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--warning-bg)' }}>
            <AlertTriangle size={16} color="var(--warning)" />
            <p style={{ color: '#92400e', margin: 0, fontSize: '0.875rem' }}>
              Soft-deleted users cannot log in but their data is preserved. Hard delete is <strong>permanent and irreversible</strong>.
            </p>
          </div>

          {/* Search */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search deleted users by name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-primary)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedIds.length} users selected</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleBulkRestore} className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                  <RotateCcw size={14} /> Bulk Restore
                </button>
                <button onClick={handleBulkHardDelete} className="btn btn-danger" style={{ gap: '0.5rem' }}>
                  <Trash2 size={14} /> Bulk Hard Delete
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
                Loading deleted users...
              </div>
            ) : users.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <Trash2 size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No deleted users found</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Deleted users will appear here</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
                      </th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Plan</th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Calendar size={12} /> Deleted On
                        </div>
                      </th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={12} /> Joined
                        </div>
                      </th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} style={{ opacity: 0.85 }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(user.id)} 
                            onChange={() => toggleSelect(user.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: 'var(--border)', display: 'flex', alignItems: 'center', 
                              justifyContent: 'center', position: 'relative'
                            }}>
                              <User size={16} color="var(--text-tertiary)" />
                              <div style={{ 
                                position: 'absolute', bottom: -2, right: -2, width: 12, height: 12,
                                borderRadius: '50%', backgroundColor: 'var(--danger)', border: '2px solid white'
                              }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem', textDecoration: 'line-through', textDecorationColor: 'var(--text-tertiary)' }}>{user.fullName}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{user.role}</td>
                        <td>
                          <span className="badge badge-gray">{user.plan?.name || 'Free'}</span>
                        </td>
                        <td style={{ color: 'var(--danger)', fontSize: '0.8125rem', fontWeight: 500 }}>
                          {user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                          {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleRestore(user.id, user.fullName)}
                              className="btn btn-secondary"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', gap: '0.375rem' }}
                              title="Restore this user"
                            >
                              <RotateCcw size={13} /> Restore
                            </button>
                            <button
                              onClick={() => handleHardDelete(user.id, user.fullName)}
                              className="btn btn-danger"
                              style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', gap: '0.375rem' }}
                              title="Permanently delete"
                            >
                              <Trash2 size={13} /> Erase
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

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Page {meta.page} of {meta.totalPages} · {meta.total} total
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn"
                  style={{ padding: '0.5rem', opacity: page <= 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="btn"
                  style={{ padding: '0.5rem', opacity: page >= meta.totalPages ? 0.4 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
