import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
  loading?: boolean;
  /** Show colored left border accent */
  accentBorder?: boolean;
}

const variantMap = {
  primary: { color: 'var(--brand-blue)', bg: 'var(--info-bg)' },
  success: { color: 'var(--success)', bg: 'var(--success-bg)' },
  warning: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
  danger:  { color: 'var(--danger)',  bg: 'var(--danger-bg)'  },
  info:    { color: 'var(--info)',    bg: 'var(--info-bg)'    },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  trend,
  loading = false,
  accentBorder = false,
}: StatCardProps) {
  const { color, bg } = variantMap[variant];

  return (
    <div
      className="stat-card"
      style={{
        backgroundImage: accentBorder ? `linear-gradient(to right, ${bg}, transparent 70%)` : undefined,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sp-3)',
        minHeight: '80px',
      }}
    >
      {Icon && (
        <div
          aria-hidden="true"
          style={{
            backgroundColor: bg,
            color,
            padding: 'var(--sp-2)',
            borderRadius: 'var(--radius-badge)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} strokeWidth={1.5} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="label-text" style={{ marginBottom: 'var(--sp-1)' }}>
          {title}
        </p>

        {loading ? (
          <>
            <div className="skeleton" style={{ height: '28px', width: '70%', borderRadius: '4px', marginBottom: 'var(--sp-1)' }} />
            <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '4px' }} />
          </>
        ) : (
          <>
            <div
              className="mono-text"
              style={{
                fontSize: '24px',
                lineHeight: '32px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>

            {trend && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', marginTop: 'var(--sp-1)' }}>
                <span
                  style={{
                    fontSize: 'var(--type-caption)',
                    fontWeight: 500,
                    color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {trend.value}
                </span>
                <span style={{ fontSize: 'var(--type-caption)', color: 'var(--text-muted)' }}>
                  {trend.label}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
