'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { DashboardCards } from '@/components/users/DashboardCards';
import { UserFilters } from '@/components/users/UserFilters';
import { EnterpriseTable } from '@/components/users/EnterpriseTable';
import { EnterprisePagination } from '@/components/users/EnterprisePagination';
import { UserProfileDrawer } from '@/components/users/UserProfileDrawer';
import { Download, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    planId: '',
    isEmailVerified: '',
    dateRange: '',
    activity: '',
    sortField: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setDashboardStats(res.data.metrics);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, String(value));
        }
      });
      const res = await api.get(`/admin/users?${params}`);
      
      const payload = res.data?.data;
      if (payload && Array.isArray(payload.data)) {
        setUsers(payload.data);
        setMeta(payload.meta || { total: payload.data.length, page: 1, limit: 20, totalPages: 1 });
      } else if (Array.isArray(payload)) {
        setUsers(payload);
        setMeta({ total: payload.length, page: 1, limit: 20, totalPages: 1 });
      } else {
        setUsers([]);
        setMeta({ total: 0, page: 1, limit: 20, totalPages: 1 });
      }
      
    } catch (e) {
      console.error(e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('adminToken')) {
        window.location.href = '/admin/login';
        return;
      }
      setAuthChecked(true);
      fetchDashboard();
    }
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchUsers();
    }
  }, [fetchUsers, authChecked]);

  const handleCardClick = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', status: '', role: '', planId: '', isEmailVerified: '',
      dateRange: '', activity: '', sortField: 'createdAt', sortOrder: 'desc',
      page: 1, limit: 20
    });
  };

  const handleExport = () => {
    // Basic client side CSV export
    if (users.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined', 'Last Login'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => [
        u.id, 
        `"${u.fullName}"`, 
        u.email, 
        u.role, 
        u.status, 
        new Date(u.createdAt).toISOString(),
        u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().getTime()}.csv`;
    link.click();
  };

  if (!authChecked) return null;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>User Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage all {meta.total} registered users on the platform.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={handleExport} className="btn">
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>

          <DashboardCards metrics={dashboardStats} onCardClick={handleCardClick} />

          <UserFilters filters={filters} setFilters={setFilters} onClear={clearFilters} />

          {selectedIds.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-elevated)', borderLeft: '4px solid var(--accent-primary)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedIds.length} users selected</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={async () => {
                    if(!confirm('Suspend selected?')) return;
                    await api.post('/admin/users/bulk/status', { userIds: selectedIds, status: 'SUSPENDED' });
                    setSelectedIds([]);
                    fetchUsers();
                  }}
                  className="btn btn-secondary"
                >
                  Suspend
                </button>
                <button 
                  onClick={async () => {
                    if(!confirm('Delete selected?')) return;
                    await api.post('/admin/users/bulk/delete', { userIds: selectedIds });
                    setSelectedIds([]);
                    fetchUsers();
                  }}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          <EnterpriseTable 
            users={users}
            loading={loading}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onRowClick={setSelectedUser}
            onRefresh={fetchUsers}
            filters={filters}
            setFilters={setFilters}
          />

          <EnterprisePagination meta={meta} setFilters={setFilters} />

        </div>
      </main>

      {selectedUser && (
        <UserProfileDrawer 
          userId={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onUpdated={fetchUsers} 
        />
      )}
    </>
  );
}
