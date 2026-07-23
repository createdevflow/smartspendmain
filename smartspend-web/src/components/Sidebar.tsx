'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Activity, FileText, PieChart,
  Repeat, MessageSquare, Bell, Settings, LogOut,
  ChevronLeft, ChevronRight, Target, Briefcase, BarChart2, X, Menu,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';

const NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Cashbooks',
    href: '/cashbooks',
    icon: BookOpen,
  },
  {
    label: 'Transactions',
    icon: Activity,
    children: [
      { label: 'History', href: '/transactions' },
      { label: 'Reports', href: '/transactions/reports' },
    ],
  },
  {
    label: 'Invoices',
    icon: FileText,
    children: [
      { label: 'All Invoices', href: '/invoices' },
    ],
  },
  {
    label: 'Budgets & Goals',
    href: '/wealth',
    icon: PieChart,
  },
  { label: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  { label: 'Messaging', href: '/messaging', icon: MessageSquare },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

const BOTTOM_NAV = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Auto-expand active parent
  useEffect(() => {
    NAV.forEach(item => {
      if (item.children?.some(c => pathname?.startsWith(c.href))) {
        setExpanded(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const toggleExpand = (label: string) => {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/cashtro-icon.png" alt="Cashtro Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Cashtro</span>
        </div>
        <button className="btn btn-ghost" onClick={() => setMobileOpen(true)}>
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '0.25rem 0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: collapsed && !mobileOpen ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/cashtro-icon.png" alt="Cashtro Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>
            {(!collapsed || mobileOpen) && (
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1 }}>Cashtro</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Personal Finance</p>
              </div>
            )}
          </div>
          {mobileOpen && (
            <button className="btn btn-ghost" onClick={() => setMobileOpen(false)} style={{ padding: '0.25rem' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {NAV.map((item) => {
            const Icon = item.icon;
            if (item.href) {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', transition: 'var(--transition)',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
                  fontWeight: active ? 600 : 500,
                }}>
                  <Icon size={18} />
                  {(!collapsed || mobileOpen) && <span style={{ fontSize: 'var(--text-sm)' }}>{item.label}</span>}
                </Link>
              );
            }

            // Group with children
            const isExpanded = expanded.includes(item.label);
            const childActive = item.children?.some(c => isActive(c.href));
            return (
              <div key={item.label}>
                <button
                  onClick={() => collapsed && !mobileOpen ? null : toggleExpand(item.label)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    background: childActive && (collapsed && !mobileOpen) ? 'var(--accent-light)' : 'transparent',
                    color: childActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    border: 'none', cursor: 'pointer', transition: 'var(--transition)',
                    justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
                    fontWeight: childActive ? 600 : 500,
                  }}
                >
                  <Icon size={18} />
                  {(!collapsed || mobileOpen) && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left', fontSize: 'var(--text-sm)' }}>{item.label}</span>
                      <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </>
                  )}
                </button>
                {isExpanded && (!collapsed || mobileOpen) && (
                  <div style={{ marginLeft: '2.5rem', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {item.children?.map(child => (
                      <Link key={child.href} href={child.href} style={{
                        padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        textDecoration: 'none', fontSize: 'var(--text-sm)',
                        color: isActive(child.href) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        background: isActive(child.href) ? 'var(--accent-light)' : 'transparent',
                        fontWeight: isActive(child.href) ? 600 : 400,
                        transition: 'var(--transition)',
                      }}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-light)' : 'transparent',
                fontWeight: active ? 600 : 500, transition: 'var(--transition)',
                justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
                marginBottom: '0.25rem',
              }}>
                <Icon size={18} />
                {(!collapsed || mobileOpen) && <span style={{ fontSize: 'var(--text-sm)' }}>{item.label}</span>}
              </Link>
            );
          })}

          {(!collapsed || mobileOpen) && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', marginTop: '0.5rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.fullName}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{typeof user.plan === 'object' ? user.plan?.name : (user.plan || 'Free')}</p>
              </div>
            </div>
          )}

          <button onClick={handleLogout} style={{
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)',
            justifyContent: collapsed && !mobileOpen ? 'center' : 'flex-start',
            fontWeight: 500, fontSize: 'var(--text-sm)',
          }}>
            <LogOut size={18} />
            {(!collapsed || mobileOpen) && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="desktop-only-btn"
          style={{ position: 'absolute', right: '-12px', top: '48px', width: '24px', height: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50, boxShadow: 'var(--shadow-sm)' }}
        >
          {collapsed ? <ChevronRight size={13} color="var(--text-secondary)" /> : <ChevronLeft size={13} color="var(--text-secondary)" />}
        </button>
      </aside>

      <style>{`
        @media (max-width: 1024px) { .desktop-only-btn { display: none !important; } }
      `}</style>
    </>
  );
}
