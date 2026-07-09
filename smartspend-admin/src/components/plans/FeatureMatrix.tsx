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
  // Group features by category
  const groupedFeatures = features.reduce((acc, f) => {
    const cat = f.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {} as Record<string, Feature[]>);

  const renderValue = (type: string, value?: string) => {
    if (!value || value === 'false') return <X className="w-5 h-5 text-gray-300 mx-auto" />;
    if (value === 'true') return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    if (value === '-1') return <span className="text-gray-900 font-medium">Unlimited</span>;
    return <span className="text-gray-700 font-medium">{value}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-gray-200 bg-gray-50/50 text-sm font-semibold text-gray-600 w-1/3 min-w-[200px]">
                Features Comparison
              </th>
              {plans.map((plan) => (
                <th key={plan.id} className="p-4 border-b border-gray-200 text-center min-w-[140px]">
                  <div className="text-base font-bold text-gray-900">{plan.name}</div>
                  <div className="h-1 w-12 mx-auto mt-2 rounded-full" style={{ backgroundColor: plan.color }} />
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
                    className="p-3 bg-gray-50 border-y border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    {category}
                  </td>
                </tr>
                {/* Features rows */}
                {catsFeatures.map((feature, idx) => (
                  <tr key={feature.key} className={idx !== catsFeatures.length - 1 ? 'border-b border-gray-100' : ''}>
                    <td className="p-4 text-sm font-medium text-gray-700">{feature.name}</td>
                    {plans.map((plan) => {
                      const planFeat = plan.features.find((pf) => pf.feature.key === feature.key);
                      return (
                        <td key={`${plan.id}-${feature.key}`} className="p-4 text-center">
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
