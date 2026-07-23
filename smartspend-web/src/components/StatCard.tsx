import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  iconBg?: string;
  iconColor?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, iconBg, iconColor, loading }: StatCardProps) {
  const bg = iconBg || 'var(--accent-light)';
  const color = iconColor || 'var(--accent-primary)';

  if (loading) {
    return (
      <div className="card" style={{ minHeight: '120px' }}>
        <div style={{ height: '1rem', width: '60%', background: 'var(--bg-hover)', borderRadius: '6px', marginBottom: '0.75rem' }} />
        <div style={{ height: '1.75rem', width: '80%', background: 'var(--bg-hover)', borderRadius: '6px', marginBottom: '0.5rem' }} />
        <div style={{ height: '0.75rem', width: '40%', background: 'var(--bg-hover)', borderRadius: '6px' }} />
      </div>
    );
  }

  return (
    <div className="card stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <p className="card-label">{title}</p>
        <div style={{ padding: '0.5rem', background: bg, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div>
        <h3 style={{ fontSize: '1.625rem', fontWeight: 700, margin: 0, lineHeight: 1.2, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</h3>
        {trend !== undefined && (
          <p style={{ fontSize: 'var(--text-xs)', color: trendUp ? 'var(--success)' : 'var(--danger)', marginTop: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
