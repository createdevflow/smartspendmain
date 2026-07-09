import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';

interface Feature { id: string; key: string; name: string; type: string; category?: string; defaultValue?: string; unit?: string; [key: string]: any; }
interface PlanFeature { feature: { key: string }; value: string; }
interface Plan { id: string; name: string; slug: string; description?: string; color: string; isActive: boolean; priceMonthly?: number; priceYearly?: number; features: PlanFeature[]; }

interface PlanEditorDrawerProps {
  open: boolean;
  mode: 'create' | 'edit';
  plan: Plan;
  features: Feature[];
  onClose: () => void;
  onSave: (planData: any) => void;
  saving: boolean;
}

export function PlanEditorDrawer({ open, mode, plan, features, onClose, onSave, saving }: PlanEditorDrawerProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open && plan) {
      // Map existing plan features to a dictionary for easy editing
      const featureValues: Record<string, string> = {};
      plan.features?.forEach((pf) => {
        featureValues[pf.feature.key] = pf.value;
      });
      setFormData({ ...plan, featureValues });
    }
  }, [open, plan]);

  if (!open) return null;

  const handleFeatureChange = (key: string, val: string) => {
    setFormData((prev: any) => ({
      ...prev,
      featureValues: { ...prev.featureValues, [key]: val },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Reconstruct features array
    const featuresArr = Object.entries(formData.featureValues || {}).map(([key, value]) => {
      const featId = features.find((f) => f.key === key)?.id;
      return { featureId: featId, value };
    }).filter(f => f.featureId);

    const payload = {
      ...formData,
      features: featuresArr,
    };
    delete payload.featureValues;
    onSave(payload);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transform transition-transform overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Plan' : 'Edit Plan'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g. Pro Plan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g. pro-plan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color || '#2563EB'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-sm text-gray-500 uppercase">{formData.color || '#2563EB'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible to users)</label>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pricing (₹)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
                  <input
                    type="number"
                    value={formData.priceMonthly || 0}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price</label>
                  <input
                    type="number"
                    value={formData.priceYearly || 0}
                    onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Features limits/toggles */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Feature Limits</h3>
              <div className="space-y-4">
                {features.map((feat) => {
                  const val = formData.featureValues?.[feat.key] ?? feat.defaultValue;
                  return (
                    <div key={feat.key} className="flex flex-col gap-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-800">{feat.name}</label>
                        {feat.type === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={val === 'true'} 
                              onChange={(e) => handleFeatureChange(feat.key, e.target.checked ? 'true' : 'false')} 
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                          </label>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type={feat.type === 'number' ? 'number' : 'text'}
                              value={val}
                              onChange={(e) => handleFeatureChange(feat.key, e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-200 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            />
                            {feat.unit && <span className="text-xs text-gray-500 w-8">{feat.unit}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
