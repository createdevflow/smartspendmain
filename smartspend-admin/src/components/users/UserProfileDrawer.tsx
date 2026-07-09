import { useState, useEffect } from 'react';
import { X, User, Activity, Smartphone, FileText, Loader2, CheckCircle2, Phone, Mail, Shield, CreditCard, AlertCircle, Trash2, ShieldAlert, Key, LogOut, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';

export function UserProfileDrawer({ userId, onClose, onUpdated }: any) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const [editingCredits, setEditingCredits] = useState(false);
  const [creditInput, setCreditInput] = useState<any>('');

  const updateCredits = async () => {
    try {
      const res = await api.patch(`/admin/users/${userId}/ai-credits`, { balance: Number(creditInput) });
      setUser({ ...user, aiCredit: { ...(user.aiCredit || {}), balance: res.data?.balance ?? Number(creditInput) } });
      setEditingCredits(false);
      if (onUpdated) onUpdated();
    } catch (e) {
      alert('Failed to update AI credits');
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/admin/users/${userId}/profile`);
        const payload = res.data?.data || res.data;
        setUser(payload);
        setNotes(payload.userNotes || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const updateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await api.post('/admin/users/bulk/status', { userIds: [userId], status });
      setUser({ ...user, status });
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setNoteLoading(true);
    try {
      const res = await api.post(`/admin/users/${userId}/notes`, { content: newNote });
      setNotes([res.data, ...notes]);
      setNewNote('');
    } catch (e) {
      console.error(e);
    } finally {
      setNoteLoading(false);
    }
  };

  const impersonateUser = async () => {
    try {
      const res = await api.post(`/admin/users/${userId}/impersonate`);
      window.open(`/login?token=${res.data.token}`, '_blank');
    } catch (e) {
      console.error(e);
      alert('Failed to impersonate user');
    }
  };

  const forceLogout = async () => {
    if (!confirm('Force logout all sessions for this user?')) return;
    try {
      await api.post(`/admin/users/${userId}/logout-all`);
      alert('User logged out from all devices');
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const resetPassword = async () => {
    const newPass = prompt('Enter new password for this user:');
    if (!newPass) return;
    try {
      await api.patch(`/admin/users/${userId}/password`, { password: newPass });
      alert('Password updated successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to update password');
    }
  };
  
  const resetAccount = async () => {
    if (!confirm('WARNING: This will wipe all cashbooks and transactions for this user. Continue?')) return;
    try {
      await api.post(`/admin/users/${userId}/reset`);
      alert('Account data reset successfully');
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
    }
  };
  
  const hardDelete = async () => {
    const confirmText = prompt('Type DELETE to permanently erase this user and all their data.');
    if (confirmText !== 'DELETE') return;
    try {
      await api.delete(`/admin/users/${userId}/hard`);
      alert('User permanently deleted');
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'notes', label: 'Internal Notes', icon: FileText },
  ];

  if (!userId) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }} 
        onClick={onClose} 
      />
      <div 
        className="card"
        style={{ 
          position: 'fixed', top: 0, right: 0, height: '100%', width: '100%', maxWidth: '30rem', 
          zIndex: 50, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          borderRadius: 0, borderLeft: '1px solid var(--border)'
        }}
      >
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-elevated)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? <Loader2 size={16} className="animate-spin" color="var(--accent-primary)" /> : <User size={16} color="var(--accent-primary)" />}
            User Profile
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {loading && !user ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={40} className="animate-spin" color="var(--accent-primary)" />
          </div>
        ) : user ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* User Meta Summary */}
            <div style={{ padding: '1.25rem 1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '50%', 
                background: user.plan?.color || 'var(--accent-primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '1.5rem', fontWeight: 'bold', color: 'white'
              }}>
                {user.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : user.fullName.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.fullName}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.email}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge badge-gray">{user.role}</span>
                  <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : user.status === 'SUSPENDED' ? 'badge-warning' : 'badge-danger'}`}>{user.status}</span>
                  <span className={`badge ${user.plan?.slug !== 'free' ? 'badge-info' : 'badge-gray'}`}>{user.plan?.name || 'Free'}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginTop: '1.25rem', padding: '0 1rem', gap: '1.25rem', overflowX: 'auto' }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.375rem', paddingBottom: '0.5rem', 
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 600 : 500,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: 'var(--bg-base)' }}>
              
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Joined</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{new Date(user.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Last Login</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Timezone</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{user.timezone}</p>
                    </div>
                    <div className="card" style={{ padding: '1rem' }}>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Phone</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{user.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* AI Credits Management */}
                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ⚡ AI Credits Balance
                      </h4>
                      {!editingCredits ? (
                        <button onClick={() => { setCreditInput(user?.aiCredit?.balance ?? 0); setEditingCredits(true); }} className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', minHeight: 'auto' }}>Edit Balance</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input type="number" className="input-field" style={{ width: '80px', padding: '0.2rem 0.5rem', fontSize: '0.8rem', minHeight: 'auto' }} value={creditInput} onChange={e => setCreditInput(e.target.value)} />
                          <button onClick={updateCredits} className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto' }}>Save</button>
                          <button onClick={() => setEditingCredits(false)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', minHeight: 'auto' }}>Cancel</button>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{user?.aiCredit?.balance ?? 0}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '0.5rem' }}>available credits</span>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div>Used this month: <strong style={{ color: 'var(--text-primary)' }}>{user?.aiCredit?.monthlyUsage ?? 0}</strong></div>
                        <div>Lifetime total: <strong style={{ color: 'var(--text-primary)' }}>{user?.aiCredit?.lifetimeUsage ?? 0}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Usage Summary</h4>
                    </div>
                    <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user._count?.cashbooks || 0}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Cashbooks</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user._count?.transactions || 0}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Transactions</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user._count?.devices || 0}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Devices</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user._count?.sessions || 0}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Sessions</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {activeTab === 'notes' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note about this user..."
                      className="input-field"
                      style={{ flex: 1, marginBottom: 0 }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    />
                    <button 
                      onClick={handleAddNote} 
                      disabled={noteLoading || !newNote.trim()}
                      className="btn btn-primary"
                    >
                      {noteLoading ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                    {notes.map(note => (
                      <div key={note.id} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{note.admin?.fullName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{note.content}</p>
                      </div>
                    ))}
                    {notes.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        No internal notes for this user yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'devices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {user.devices?.map((d: any) => (
                    <div key={d.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{d.brand} {d.model}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.osName} • {d.appVersion || 'Unknown app version'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last active</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{new Date(d.lastActive).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!user.devices || user.devices.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No devices recorded.</div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Recent Audit Logs</h4>
                  {user.auditLogs?.map((log: any) => (
                    <div key={log.id} className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{log.ipAddress} • {log.userAgent}</p>
                    </div>
                  ))}
                  {(!user.auditLogs || user.auditLogs.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No recent activity.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
