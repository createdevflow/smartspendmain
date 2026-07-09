import { 
  Users, UserCheck, UserMinus, Shield, ShieldAlert,
  CreditCard, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface StatsProps {
  metrics: any;
  onCardClick?: (filter: string, value: string) => void;
}

export function DashboardCards({ metrics, onCardClick }: StatsProps) {
  if (!metrics) return null;

  const cards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: '#2563EB', filter: null },
    { label: 'Active Sessions', value: metrics.activeSessions, icon: Activity, color: '#059669', filter: null },
    { label: 'Suspended', value: metrics.suspendedUsers, icon: ShieldAlert, color: '#D97706', filter: { f: 'status', v: 'SUSPENDED' } },
    { label: 'Banned', value: metrics.bannedUsers, icon: UserMinus, color: '#DC2626', filter: { f: 'status', v: 'BANNED' } },
    { label: 'Unverified', value: metrics.pendingVerification, icon: Shield, color: '#D97706', filter: { f: 'status', v: 'PENDING_VERIFICATION' } },
    { label: 'Premium Users', value: metrics.premiumUsers, icon: CreditCard, color: '#7C3AED', filter: { f: 'plan', v: 'premium' } },
    { label: 'Online Now', value: metrics.onlineNow, icon: Activity, color: '#059669', filter: { f: 'activity', v: 'online' } },
    { label: 'New Today', value: metrics.newUsersToday, icon: UserCheck, color: '#0284C7', filter: { f: 'dateRange', v: 'today' } },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="card"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            cursor: card.filter ? 'pointer' : 'default',
            padding: '1.25rem'
          }}
          onClick={() => {
            if (card.filter && onCardClick) {
              onCardClick(card.filter.f, card.filter.v);
            }
          }}
        >
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{card.label}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {card.value?.toLocaleString() || 0}
            </h3>
          </div>
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: `${card.color}15` 
          }}>
            <card.icon size={24} color={card.color} />
          </div>
        </div>
      ))}
    </div>
  );
}
