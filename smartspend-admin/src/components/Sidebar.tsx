'use client';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Ticket, BookOpen, FileDown, CreditCard as TxIcon, Activity, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

function decodeJwt(token: string) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminInfo, setAdminInfo] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const decoded = decodeJwt(token);
      setAdminInfo({
        email: decoded?.email || 'admin@smartspend.app',
        name: decoded?.fullName || 'Admin',
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  const nav = [
    { href: '/', icon: <LayoutDashboard className="nav-icon" />, label: 'Dashboard' },
    { href: '/users', icon: <Users className="nav-icon" />, label: 'Users' },
    { href: '/transactions', icon: <Activity className="nav-icon" />, label: 'Transactions' },
    { href: '/plans', icon: <CreditCard className="nav-icon" />, label: 'Plans & Features' },
    { href: '/cashbooks', icon: <BookOpen className="nav-icon" />, label: 'Shared Cashbooks' },
    { href: '/tax-exports', icon: <FileDown className="nav-icon" />, label: 'Tax Exports' },
    { href: '/support', icon: <Ticket className="nav-icon" />, label: 'Support' },
    { href: '/logs', icon: <ShieldAlert className="nav-icon" />, label: 'Logs & Monitoring' },
    { href: '/settings', icon: <Settings className="nav-icon" />, label: 'Settings' },
  ];

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const initials = adminInfo?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          }}>
            <span style={{ color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>S</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem', lineHeight: 1 }}>SmartSpend</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>Admin Console</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {nav.map(({ href, icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
            {icon} {label}
          </Link>
        ))}
      </nav>

      {/* Admin User + Logout */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0.5rem 0.875rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: '700' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminInfo?.name || 'Super Admin'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {adminInfo?.email || ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
        >
          <LogOut className="nav-icon" style={{ color: 'var(--danger)' }} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
