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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-overlay" onClick={onClose}>
        {/* Modal Content */}
        <div className="modal" style={{ maxWidth: '620px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ padding: '1.25rem 1.5rem', margin: 0, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {mode === 'create' ? 'Create New Plan' : 'Edit Plan'}
            </h2>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.375rem' }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Basic Info */}
              <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Basic Information</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Pro Plan"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Slug</label>
                    <input
                      type="text"
                      required
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="input-field"
                      placeholder="e.g. pro-plan"
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '0.5rem' }}>
                  <label className="input-label">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="input-field"
                    style={{ resize: 'vertical', minHeight: '60px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">Theme Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="color"
                        value={formData.color || '#2563EB'}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        style={{ width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', padding: '2px', cursor: 'pointer', background: 'var(--bg-surface)' }}
                      />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{formData.color || '#2563EB'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginTop: '1.25rem' }}>
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                    />
                    <label htmlFor="isActive" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>Active (Visible to users)</label>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Pricing (₹)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Monthly Price</label>
                    <input
                      type="number"
                      value={formData.priceMonthly || 0}
                      onChange={(e) => setFormData({ ...formData, priceMonthly: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Yearly Price</label>
                    <input
                      type="number"
                      value={formData.priceYearly || 0}
                      onChange={(e) => setFormData({ ...formData, priceYearly: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Features limits/toggles */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Feature Limits</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {features.map((feat) => {
                    const val = formData.featureValues?.[feat.key] ?? feat.defaultValue;
                    return (
                      <div key={feat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{feat.name}</label>
                        {feat.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={val === 'true'}
                            onChange={(e) => handleFeatureChange(feat.key, e.target.checked ? 'true' : 'false')}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563EB' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                              type={feat.type === 'number' ? 'number' : 'text'}
                              value={val}
                              onChange={(e) => handleFeatureChange(feat.key, e.target.value)}
                              className="input-field"
                              style={{ width: '110px', padding: '0.375rem 0.625rem', textAlign: 'right', background: 'var(--bg-surface)' }}
                            />
                            {feat.unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', width: '32px' }}>{feat.unit}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', position: 'sticky', bottom: 0 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
