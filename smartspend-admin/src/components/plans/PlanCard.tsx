import React from 'react';
import { Edit2, Trash2, Check, Copy } from 'lucide-react';

interface PlanFeature {
  feature: { key: string; name: string; type: string };
  value: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  priceMonthly?: number;
  features: PlanFeature[];
  _count: { users: number };
}

interface PlanCardProps {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onClone: (id: string) => void;
}

export function PlanCard({ plan, onEdit, onDelete, onClone }: PlanCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '0', borderTop: `4px solid ${plan.color || '#2563EB'}` }}>
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {plan.name}
              </h3>
              {!plan.isActive && (
                <span className="badge badge-gray" style={{ fontSize: '0.6875rem' }}>
                  Draft
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{plan.slug}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => onEdit(plan)}
              className="btn btn-ghost"
              style={{ padding: '0.375rem' }}
              title="Edit Plan"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onClone(plan.id)}
              className="btn btn-ghost"
              style={{ padding: '0.375rem', color: 'var(--success)' }}
              title="Duplicate Plan"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={() => onDelete(plan)}
              className="btn btn-ghost"
              style={{ padding: '0.375rem', color: 'var(--danger)' }}
              title="Delete Plan"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Price & Description */}
        <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₹{plan.priceMonthly || 0}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>/month</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: '36px' }}>
            {plan.description || 'No description provided.'}
          </p>
        </div>

        {/* Key Features Preview */}
        <div style={{ flex: 1, marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Top Features
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {plan.features.slice(0, 5).map((f) => {
              const isEnabled = f.value === 'true' || (f.feature.type === 'number' && parseInt(f.value) > 0) || f.value === '-1';
              return (
                <li key={f.feature.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  <Check size={16} style={{ color: isEnabled ? 'var(--success)' : 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: isEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)', textDecoration: isEnabled ? 'none' : 'line-through' }}>
                    {f.feature.name}
                    {f.feature.type === 'number' && isEnabled && (
                      <strong style={{ marginLeft: '0.25rem', color: 'var(--text-secondary)' }}>
                        ({f.value === '-1' ? 'Unlimited' : f.value})
                      </strong>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {plan.features.length > 5 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.75rem' }}>
              + {plan.features.length - 5} more features
            </p>
          )}
        </div>

        {/* Footer / Users Count */}
        <div style={{ paddingTop: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{plan._count?.users || 0}</strong> active users
          </div>
        </div>
      </div>
    </div>
  );
}
