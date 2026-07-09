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
    <div className="relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Top Banner (Color Strip) */}
      <div className="h-2 w-full" style={{ backgroundColor: plan.color }} />
      
      <div className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {plan.name}
              {!plan.isActive && (
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                  Draft
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{plan.slug}</p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(plan)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Plan"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onClone(plan.id)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Duplicate Plan"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(plan)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Price & Description */}
        <div className="mb-6">
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-black text-gray-900">
              ₹{plan.priceMonthly || 0}
            </span>
            <span className="text-gray-500 mb-1">/mo</span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
            {plan.description || 'No description provided.'}
          </p>
        </div>

        {/* Key Features Preview */}
        <div className="space-y-3 flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Features</p>
          <ul className="space-y-2">
            {plan.features.slice(0, 5).map((f) => {
              const isEnabled = f.value === 'true' || (f.feature.type === 'number' && parseInt(f.value) > 0) || f.value === '-1';
              return (
                <li key={f.feature.key} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className={`w-4 h-4 mt-0.5 shrink-0 ${isEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={isEnabled ? '' : 'text-gray-400 line-through'}>
                    {f.feature.name}
                    {f.feature.type === 'number' && isEnabled && (
                      <span className="ml-1 text-gray-500 font-medium">
                        ({f.value === '-1' ? 'Unlimited' : f.value})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
          {plan.features.length > 5 && (
            <p className="text-xs text-gray-500 font-medium mt-2">
              + {plan.features.length - 5} more features
            </p>
          )}
        </div>

        {/* Footer / Users Count */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{plan._count.users}</span> active users
          </div>
        </div>
      </div>
    </div>
  );
}
