'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, Shield, ShieldAlert, Key, LogOut, RefreshCcw,
  Trash2, Smartphone, CheckSquare, Square, Users, UserCheck, Eye
} from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  users: any[];
  loading: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  onRowClick: (id: string) => void;
  onRefresh: () => void;
  filters: any;
  setFilters: (f: any) => void;
}

export function EnterpriseTable({ 
  users, loading, selectedIds, setSelectedIds, 
  onRowClick, onRefresh, filters, setFilters 
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSort = (field: string) => {
    setFilters((prev: any) => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const executeAction = async (e: React.MouseEvent, action: string, user: any) => {
    e.stopPropagation();
    setActiveMenu(null);
    try {
      switch (action) {
        case 'suspend':
          if (!confirm(`Suspend ${user.fullName}? They will lose access immediately.`)) return;
          await api.patch(`/admin/users/${user.id}/status`, { status: 'SUSPENDED' });
          break;
        case 'activate':
          if (!confirm(`Restore access for ${user.fullName}?`)) return;
          await api.patch(`/admin/users/${user.id}/status`, { status: 'ACTIVE' });
          break;
        case 'ban':
          if (!confirm(`BAN ${user.fullName}? This is a severe action.`)) return;
          await api.patch(`/admin/users/${user.id}/status`, { status: 'BANNED' });
          break;
        case 'logout_all':
          if (!confirm(`Force logout ${user.fullName} from all devices?`)) return;
          await api.post(`/admin/users/${user.id}/logout-all`, {});
          alert('User has been logged out from all devices.');
          break;
        case 'reset_password': {
          const newPass = prompt(`Enter new password for ${user.fullName}:`);
          if (!newPass) return;
          await api.patch(`/admin/users/${user.id}/password`, { password: newPass });
          alert('Password updated successfully.');
          break;
        }
        case 'impersonate': {
          const res = await api.post(`/admin/users/${user.id}/impersonate`);
          window.open(`/?impersonate_token=${res.data?.data?.token || res.data?.token}`, '_blank');
          break;
        }
        case 'change_role': {
          const role = prompt(`Change role for ${user.fullName}.\nCurrent: ${user.role}\nEnter: USER, ADMIN, or SUPER_ADMIN`);
          if (!role) return;
          await api.patch(`/admin/users/${user.id}/role`, { role: role.toUpperCase() });
          break;
        }
        case 'wipe_data':
          if (!confirm(`⚠️ DANGER: Wipe ALL cashbooks and transactions for ${user.fullName}? This cannot be undone.`)) return;
          await api.post(`/admin/users/${user.id}/reset`);
          alert('Account data wiped successfully.');
          break;
        case 'soft_delete':
          if (!confirm(`Soft delete ${user.fullName}? They can be restored later.`)) return;
          await api.delete(`/admin/users/${user.id}`);
          break;
        case 'hard_delete': {
          const confirm1 = prompt(`PERMANENTLY DELETE ${user.fullName} and ALL their data?\n\nType DELETE to confirm:`);
          if (confirm1 !== 'DELETE') return;
          await api.delete(`/admin/users/${user.id}/hard`);
          alert('User permanently deleted.');
          break;
        }
      }
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ 
            width: 32, height: 32, border: '3px solid var(--border)', 
            borderTopColor: 'var(--accent-primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' 
          }} />
          Loading users...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-secondary)' }}>No users found matching your filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <button onClick={toggleSelectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {selectedIds.length === users.length && users.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('fullName')}>
                User {filters.sortField === 'fullName' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('plan')}>
                Plan {filters.sortField === 'plan' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('lastLoginAt')}>
                Last Login {filters.sortField === 'lastLoginAt' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => handleSort('createdAt')}>
                Joined {filters.sortField === 'createdAt' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr 
                key={user.id} 
                onClick={() => onRowClick(user.id)}
                style={{ cursor: 'pointer', backgroundColor: selectedIds.includes(user.id) ? 'var(--bg-elevated)' : 'transparent' }}
              >
                <td style={{ textAlign: 'center' }} onClick={e => toggleSelect(e, user.id)}>
                  {selectedIds.includes(user.id) ? <CheckSquare size={18} color="var(--accent-primary)" /> : <Square size={18} color="var(--text-tertiary)" />}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', 
                      background: user.plan?.color || 'var(--accent-primary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.75rem', fontWeight: 'bold', color: 'white', textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {user.avatar 
                        ? <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> 
                        : (user.fullName || '?').charAt(0)
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem' }}>{user.fullName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.plan?.slug !== 'free' ? 'badge-info' : 'badge-gray'}`}>
                    {user.plan?.name || 'Free'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{user.role}</td>
                <td>
                  <span className={`badge ${
                    user.status === 'ACTIVE' ? 'badge-success' :
                    user.status === 'SUSPENDED' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right', position: 'relative' }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === user.id ? null : user.id);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.5rem', borderRadius: 6 }}
                    title="Actions"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenu === user.id && (
                    <div 
                      ref={menuRef}
                      className="card"
                      style={{ 
                        position: 'absolute', right: '2.5rem', top: '0.25rem', width: '220px', 
                        padding: '0.375rem', zIndex: 50, boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {/* View Profile */}
                      <button 
                        onClick={e => { e.stopPropagation(); setActiveMenu(null); onRowClick(user.id); }}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}
                      >
                        <Eye size={14} /> View Profile
                      </button>

                      <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />

                      {/* Status Actions */}
                      {user.status !== 'ACTIVE' ? (
                        <button 
                          onClick={e => executeAction(e, 'activate', user)}
                          className="btn btn-ghost" 
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--success)' }}
                        >
                          <UserCheck size={14} /> Restore Access
                        </button>
                      ) : (
                        <button 
                          onClick={e => executeAction(e, 'suspend', user)}
                          className="btn btn-ghost" 
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--warning)' }}
                        >
                          <ShieldAlert size={14} /> Suspend
                        </button>
                      )}
                      <button 
                        onClick={e => executeAction(e, 'ban', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--danger)' }}
                      >
                        <Shield size={14} /> Ban User
                      </button>

                      <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />

                      {/* Session & Security */}
                      <button 
                        onClick={e => executeAction(e, 'impersonate', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}
                      >
                        <Eye size={14} /> Impersonate
                      </button>
                      <button 
                        onClick={e => executeAction(e, 'logout_all', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}
                      >
                        <LogOut size={14} /> Force Logout All
                      </button>
                      <button 
                        onClick={e => executeAction(e, 'reset_password', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}
                      >
                        <Key size={14} /> Reset Password
                      </button>
                      <button 
                        onClick={e => executeAction(e, 'change_role', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}
                      >
                        <Smartphone size={14} /> Change Role
                      </button>

                      <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />

                      {/* Destructive */}
                      <button 
                        onClick={e => executeAction(e, 'wipe_data', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--warning)' }}
                      >
                        <RefreshCcw size={14} /> Wipe Account Data
                      </button>
                      <button 
                        onClick={e => executeAction(e, 'soft_delete', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} /> Soft Delete
                      </button>
                      <button 
                        onClick={e => executeAction(e, 'hard_delete', user)}
                        className="btn btn-ghost" 
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem', color: 'var(--danger)', fontWeight: 600 }}
                      >
                        <Trash2 size={14} /> Hard Delete ⚠️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
