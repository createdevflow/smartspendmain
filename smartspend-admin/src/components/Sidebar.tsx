'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut, Ticket,
  BookOpen, FileDown, Activity, ShieldAlert, Bell, PenSquare, Database,
  Menu, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

type NavGroup = {
  label: string;
  items: { href: string; icon: React.ReactNode; label: string }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/', icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Users & Finance',
    items: [
      { href: '/users', icon: <Users size={16} />, label: 'Users' },
      { href: '/transactions', icon: <Activity size={16} />, label: 'Transactions' },
      { href: '/plans', icon: <CreditCard size={16} />, label: 'Plans & Features' },
      { href: '/cashbooks', icon: <BookOpen size={16} />, label: 'Shared Cashbooks' },
      { href: '/tax-exports', icon: <FileDown size={16} />, label: 'Tax Exports' },
    ],
  },
  {
    label: 'Content & Comms',
    items: [
      { href: '/communication', icon: <Bell size={16} />, label: 'Communication' },
      { href: '/blog', icon: <PenSquare size={16} />, label: 'Blog' },
      { href: '/support', icon: <Ticket size={16} />, label: 'Support Tickets' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/logs', icon: <ShieldAlert size={16} />, label: 'Logs & Monitoring' },
      { href: '/media', icon: <Database size={16} />, label: 'Media Library' },
      { href: '/settings', icon: <Settings size={16} />, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<{ email: string; name: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const token = (localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
    if (token) {
      const decoded = decodeJwt(token);
      setAdminInfo({
        email: decoded?.email || 'admin@cashtro.app',
        name: decoded?.fullName || 'Admin',
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken'); sessionStorage.removeItem('adminToken');
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials = adminInfo?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-header" role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--brand-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>C</span>
          </div>
          <span style={{ fontSize: 'var(--type-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Cashtro Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <ThemeToggle />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            style={{ width: '28px', padding: 0 }}
          >
            {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 'var(--sp-4)',
            marginBottom: 'var(--sp-2)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-btn)',
                background: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'white', fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>C</span>
            </div>
            <div className="sidebar-logo-text">
              <p
                style={{
                  fontSize: 'var(--type-card-title)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                Cashtro
              </p>
              <p
                style={{
                  fontSize: 'var(--type-caption)',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Admin Console
              </p>
            </div>
          </div>
          {/* Theme toggle — desktop sidebar */}
          <div className="sidebar-label">
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', gap: 0 }}
          className="no-scrollbar"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 'var(--sp-2)' }}>
              <div className="nav-group-label sidebar-label">{group.label}</div>
              {group.items.map(({ href, icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`nav-item ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true">{icon}</span>
                    <span className="sidebar-label">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Admin profile + logout */}
        <div
          style={{
            paddingTop: 'var(--sp-4)',
            marginTop: 'var(--sp-2)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            className="sidebar-label"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-2)',
              marginBottom: 'var(--sp-2)',
              padding: 'var(--sp-2) var(--sp-2)',
              borderRadius: 'var(--radius-btn)',
              background: 'var(--surface-raised)',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <span style={{ color: 'white', fontSize: 'var(--type-caption)', fontWeight: 700 }}>
                {initials}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 'var(--type-caption)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {adminInfo?.name || 'Super Admin'}
              </p>
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {adminInfo?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', color: 'var(--danger)' }}
            aria-label="Sign out of admin console"
          >
            <span className="nav-icon" aria-hidden="true">
              <LogOut size={16} />
            </span>
            <span className="sidebar-label">Secure Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
