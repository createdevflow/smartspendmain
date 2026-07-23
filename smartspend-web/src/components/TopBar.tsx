'use client';
import { Search, Bell, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

interface TopBarProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, subtitle, action }: TopBarProps) {
  const { user } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/transactions?q=${encodeURIComponent(search)}`);
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: subtitle ? '0.25rem' : 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {action}
        <form onSubmit={handleSearch} style={{ position: 'relative' }} className="topbar-search">
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search transactions, invoices..."
            className="input-field"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', width: '220px', margin: 0, height: '38px', fontSize: 'var(--text-sm)' }}
          />
        </form>
        <Link href="/notifications" style={{ position: 'relative', display: 'inline-flex' }}>
          <button className="btn btn-ghost" style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            <Bell size={19} />
            {(user?.unreadNotifications ?? 0) > 0 && (
              <span style={{ position: 'absolute', top: '4px', right: '4px', minWidth: '16px', height: '16px', background: 'var(--danger)', borderRadius: '8px', fontSize: '0.625rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                {(user?.unreadNotifications ?? 0) > 9 ? '9+' : user?.unreadNotifications}
              </span>
            )}
          </button>
        </Link>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
          >
            {user?.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
          </div>

          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px', minWidth: '180px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', zIndex: 50, animation: 'fadeIn 0.15s ease-out' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
                
                <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)' }} className="hover-bg">
                  <Settings size={16} /> Edit Profile
                </Link>
                
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    router.push('/login');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'var(--danger)', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)' }} className="hover-bg-danger"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @media(max-width:600px){.topbar-search{display:none;}}
        .hover-bg:hover { background-color: var(--bg-elevated); }
        .hover-bg-danger:hover { background-color: #FEF2F2; }
      `}</style>
    </header>
  );
}
