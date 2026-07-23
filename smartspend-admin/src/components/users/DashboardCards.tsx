import { 
  Users, UserCheck, UserMinus, Shield, ShieldAlert,
  CreditCard, Activity
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';

interface StatsProps {
  metrics: any;
  onCardClick?: (filter: string, value: string) => void;
}

export function DashboardCards({ metrics, onCardClick }: StatsProps) {
  if (!metrics) return null;

  const cards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, variant: 'primary', filter: null },
    { label: 'Active Sessions', value: metrics.activeSessions, icon: Activity, variant: 'success', filter: null },
    { label: 'Suspended', value: metrics.suspendedUsers, icon: ShieldAlert, variant: 'warning', filter: { f: 'status', v: 'SUSPENDED' } },
    { label: 'Banned', value: metrics.bannedUsers, icon: UserMinus, variant: 'danger', filter: { f: 'status', v: 'BANNED' } },
    { label: 'Unverified', value: metrics.pendingVerification, icon: Shield, variant: 'warning', filter: { f: 'status', v: 'PENDING_VERIFICATION' } },
    { label: 'Premium Users', value: metrics.premiumUsers, icon: CreditCard, variant: 'info', filter: { f: 'plan', v: 'premium' } },
    { label: 'Online Now', value: metrics.onlineNow, icon: Activity, variant: 'success', filter: { f: 'activity', v: 'online' } },
    { label: 'New Today', value: metrics.newUsersToday, icon: UserCheck, variant: 'primary', filter: { f: 'dateRange', v: 'today' } },
  ];

  return (
    <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          onClick={() => {
            if (card.filter && onCardClick) {
              onCardClick(card.filter.f, card.filter.v);
            }
          }}
          style={{ cursor: card.filter ? 'pointer' : 'default', height: '100%' }}
        >
          <StatCard 
            title={card.label} 
            value={card.value?.toLocaleString() || 0} 
            icon={card.icon} 
            variant={card.variant as any} 
          />
        </div>
      ))}
    </div>
  );
}
