import React from 'react';
import { Check, X } from 'lucide-react';

interface Feature { id: string; key: string; name: string; type: string; category?: string; }
interface PlanFeature { feature: { key: string }; value: string; }
interface Plan { id: string; name: string; features: PlanFeature[]; color: string; }

interface FeatureMatrixProps {
  plans: Plan[];
  features: Feature[];
}

export function FeatureMatrix({ plans, features }: FeatureMatrixProps) {
  const groupedFeatures = features.reduce((acc, f) => {
    const cat = f.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {} as Record<string, Feature[]>);

  const renderValue = (type: string, value?: string) => {
    if (!value || value === 'false') return <X size={18} style={{ color: 'var(--text-tertiary)', margin: '0 auto' }} />;
    if (value === 'true') return <Check size={18} style={{ color: 'var(--success)', margin: '0 auto' }} />;
    if (value === '-1') return <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Unlimited</span>;
    return <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{value}</span>;
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '30%', minWidth: '200px' }}>
                Features Comparison
              </th>
              {plans.map((plan) => (
                <th key={plan.id} style={{ textAlign: 'center', minWidth: '140px' }}>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                  <div style={{ height: '3px', width: '36px', margin: '6px auto 0', borderRadius: '2px', backgroundColor: plan.color || '#2563EB' }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedFeatures).map(([category, catsFeatures]) => (
              <React.Fragment key={category}>
                {/* Category Header */}
                <tr>
                  <td
                    colSpan={plans.length + 1}
                    style={{ background: 'var(--bg-elevated)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.625rem 1rem' }}
                  >
                    {category}
                  </td>
                </tr>
                {/* Features rows */}
                {catsFeatures.map((feature) => (
                  <tr key={feature.key}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{feature.name}</td>
                    {plans.map((plan) => {
                      const planFeat = plan.features?.find((pf) => pf.feature?.key === feature.key);
                      return (
                        <td key={`${plan.id}-${feature.key}`} style={{ textAlign: 'center' }}>
                          {renderValue(feature.type, planFeat?.value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
