'use client';
import { useState, useEffect, useCallback, Fragment } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Plus, Edit2, Trash2, Check, X, RefreshCw, Copy, Users, ArrowUp, ArrowDown } from 'lucide-react';

interface Feature { id: string; key: string; name: string; type: string; defaultValue: string; unit?: string; category?: string; sortOrder: number; }
interface PlanFeature { feature: Feature; value: string; }
interface Plan {
  id: string; name: string; slug: string; description?: string; tagline?: string;
  color: string; isActive: boolean; isDefault: boolean; sortOrder: number;
  priceWeekly?: number; priceMonthly?: number; priceYearly?: number;
  features: PlanFeature[];
  _count: { users: number };
}

const EMPTY_PLAN = { name: '', slug: '', description: '', tagline: '', color: '#2563EB', isActive: true, isDefault: false, sortOrder: 0, priceWeekly: 0, priceMonthly: 0, priceYearly: 0 };
const EMPTY_FEATURE = { key: '', name: '', description: '', type: 'boolean', defaultValue: 'false', unit: '', category: 'general', sortOrder: 0, isVisible: true };

const STANDARD_FEATURES = [
  { key: 'max_cashbooks', name: 'Max Cashbooks', type: 'number', defaultValue: '99', unit: 'books', category: 'general', description: 'Maximum number of cashbooks allowed (-1 for unlimited)' },
  { key: 'max_transactions_monthly', name: 'Max Transactions / Month', type: 'number', defaultValue: '200', unit: 'txns', category: 'general', description: 'Monthly transaction limit (-1 for unlimited)' },
  { key: 'max_goals', name: 'Max Saving Goals', type: 'number', defaultValue: '10', unit: 'goals', category: 'general', description: 'Maximum number of active saving goals' },
  { key: 'scheduled_communications', name: 'Scheduled Invoices & Messages', type: 'boolean', defaultValue: 'true', category: 'finance', description: 'Enable scheduling chat messages and financial communications' },
  { key: 'recurring_transactions', name: 'Recurring Transactions', type: 'boolean', defaultValue: 'true', category: 'finance', description: 'Enable automatic recurring income and expenses' },
  { key: 'transaction_splits', name: 'Split Transactions', type: 'boolean', defaultValue: 'true', category: 'finance', description: 'Split single transactions across multiple categories' },
  { key: 'receipt_scanning', name: 'Receipt Scanning OCR', type: 'boolean', defaultValue: 'true', category: 'integrations', description: 'Enable AI OCR receipt scanning' },
  { key: 'export_pdf', name: 'PDF Reports', type: 'boolean', defaultValue: 'true', category: 'export', description: 'Allow exporting beautiful PDF reports' },
  { key: 'priority_support', name: 'Priority Support', type: 'boolean', defaultValue: 'false', category: 'general', description: 'Access to priority customer support' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [planModal, setPlanModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: EMPTY_PLAN });
  const [featureModal, setFeatureModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: EMPTY_FEATURE });
  const [assignModal, setAssignModal] = useState<{ open: boolean; plan: Plan | null; emails: string }>({ open: false, plan: null, emails: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'plan' | 'feature'; id: string; name: string; usersCount?: number; fallbackPlanId?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, featuresRes] = await Promise.all([
        api.get('/admin/plans'),
        api.get('/admin/features'),
      ]);
      setPlans(plansRes.data?.data || []);
      setFeatures(featuresRes.data?.data || []);
    } catch (e) {
      console.error('Failed to load', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Plan CRUD ─────────────────────────────────────────────────────────────
  const savePlan = async () => {
    setSaving(true);
    try {
      if (planModal.mode === 'create') {
        await api.post('/admin/plans', planModal.data);
      } else {
        await api.patch(`/admin/plans/${planModal.data.id}`, planModal.data);
      }
      setPlanModal({ open: false, mode: 'create', data: EMPTY_PLAN });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      const url = deleteConfirm.fallbackPlanId 
        ? `/admin/plans/${deleteConfirm.id}?fallbackPlanId=${deleteConfirm.fallbackPlanId}`
        : `/admin/plans/${deleteConfirm.id}`;
      await api.delete(url);
      setDeleteConfirm(null);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete plan');
    } finally {
      setSaving(false);
    }
  };

  const clonePlan = async (id: string) => {
    try {
      await api.post(`/admin/plans/${id}/duplicate`);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to clone plan');
    }
  };

  const assignUsers = async () => {
    if (!assignModal.plan || !assignModal.emails.trim()) return;
    setSaving(true);
    try {
      const emailList = assignModal.emails.split(',').map(e => e.trim()).filter(e => e);
      const res = await api.post(`/admin/plans/${assignModal.plan.id}/assign`, { emails: emailList });
      alert(`Successfully assigned ${res.data?.data?.count || 0} users to ${assignModal.plan.name}`);
      setAssignModal({ open: false, plan: null, emails: '' });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to assign users');
    } finally {
      setSaving(false);
    }
  };

  // ── Feature CRUD ──────────────────────────────────────────────────────────
  const saveFeature = async () => {
    setSaving(true);
    try {
      if (featureModal.mode === 'create') {
        await api.post('/admin/features', featureModal.data);
      } else {
        await api.patch(`/admin/features/${featureModal.data.id}`, featureModal.data);
      }
      setFeatureModal({ open: false, mode: 'create', data: EMPTY_FEATURE });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save feature');
    } finally {
      setSaving(false);
    }
  };

  const deleteFeature = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/features/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete feature');
    }
  };

  const moveFeature = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === features.length - 1) return;

    const newFeatures = [...features];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap sortOrder
    const tempSort = newFeatures[index].sortOrder;
    newFeatures[index].sortOrder = newFeatures[targetIndex].sortOrder;
    newFeatures[targetIndex].sortOrder = tempSort;

    // Call API
    try {
      await api.post('/admin/features/reorder', {
        updates: [
          { id: newFeatures[index].id, sortOrder: newFeatures[index].sortOrder },
          { id: newFeatures[targetIndex].id, sortOrder: newFeatures[targetIndex].sortOrder }
        ]
      });
      fetchData();
    } catch (e) {
      alert('Failed to reorder features');
    }
  };

  const setPlanFeatureValue = async (planId: string, featureId: string, value: string) => {
    try {
      await api.patch(`/admin/plans/${planId}/features/${featureId}`, { value });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update feature value');
    }
  };

  const planField = (field: string, value: any) => setPlanModal(m => ({ ...m, data: { ...m.data, [field]: value } }));
  const featField = (field: string, value: any) => setFeatureModal(m => ({ ...m, data: { ...m.data, [field]: value } }));

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
            <p>Loading plans & features...</p>
          </div>
        </main>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Plans & Features Matrix</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Manage subscription tiers, feature access, and bulk user assignments.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={fetchData}><RefreshCw size={16} /></button>
            <button className="btn btn-primary" onClick={() => setPlanModal({ open: true, mode: 'create', data: EMPTY_PLAN })}>
              <Plus size={16} /> New Plan
            </button>
          </div>
        </header>

        {/* Pricing Matrix View */}
        <div className="card" style={{ overflowX: 'auto', padding: 0, marginBottom: '2.5rem' }}>
          <table className="table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '200px', borderRight: '1px solid var(--border)', background: 'var(--bg-elevated)', zIndex: 10 }}>Feature \ Plan</th>
                {plans.map(plan => (
                  <th key={plan.id} style={{ minWidth: '220px', textAlign: 'center', borderRight: '1px solid var(--border)', borderTop: `4px solid ${plan.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {plan.isDefault && <span className="badge badge-info">DEFAULT</span>}
                      {!plan.isActive && <span className="badge badge-warning">INACTIVE</span>}
                    </div>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{plan.name}</h2>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      {plan.priceMonthly ? `₹${plan.priceWeekly}/wk | ₹${plan.priceMonthly}/mo | ₹${plan.priceYearly}/yr` : 'Free'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                      <Users size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {plan._count.users} Users
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                      <button className="btn btn-ghost" title="Edit Plan" onClick={() => setPlanModal({ open: true, mode: 'edit', data: { ...plan } })}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost" title="Clone Plan" onClick={() => clonePlan(plan.id)}><Copy size={14} /></button>
                      <button className="btn btn-ghost" title="Assign Users" onClick={() => setAssignModal({ open: true, plan, emails: '' })}><Users size={14} /></button>
                      <button className="btn btn-ghost" title="Delete Plan" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm({ type: 'plan', id: plan.id, name: plan.name, usersCount: plan._count.users, fallbackPlanId: '' })}><Trash2 size={14} /></button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.length === 0 && (
                <tr><td colSpan={plans.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No features added.</td></tr>
              )}
              {features.map((feat) => (
                <tr key={feat.id}>
                  <td style={{ borderRight: '1px solid var(--border)', background: 'var(--bg-elevated)', fontWeight: 500 }}>
                    <div>{feat.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{feat.key}</div>
                  </td>
                  {plans.map(plan => {
                    const pf = plan.features.find(f => f.feature.id === feat.id);
                    const value = pf ? pf.value : feat.defaultValue;
                    return (
                      <td key={`${feat.id}-${plan.id}`} style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                        {feat.type === 'boolean' ? (
                          <label className="toggle-switch" style={{ margin: '0 auto' }}>
                            <input
                              type="checkbox"
                              checked={value === 'true' || value === '1'}
                              onChange={e => setPlanFeatureValue(plan.id, feat.id, e.target.checked ? 'true' : 'false')}
                            />
                            <span className="slider round"></span>
                          </label>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                            <input
                              type={feat.type === 'number' ? 'number' : 'text'}
                              defaultValue={value}
                              style={{
                                width: '70px', padding: '4px 8px', fontSize: '0.875rem', textAlign: 'center',
                                border: '1px solid var(--border)', borderRadius: '6px',
                                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                              }}
                              onBlur={e => {
                                if (e.target.value !== value) {
                                  setPlanFeatureValue(plan.id, feat.id, e.target.value);
                                }
                              }}
                            />
                            {feat.unit && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{feat.unit}</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Features Config */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3>Global Feature Settings</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Define base feature settings, defaults, and ordering.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => setFeatureModal({ open: true, mode: 'create', data: EMPTY_FEATURE })}>
              <Plus size={15} /> Add Feature
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Key</th>
                <th>Name</th>
                <th>Type</th>
                <th>Default</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feat, idx) => (
                <tr key={feat.id}>
                  <td style={{ width: '80px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="btn btn-ghost" style={{ padding: '2px' }} disabled={idx === 0} onClick={() => moveFeature(idx, 'up')}><ArrowUp size={14}/></button>
                      <button className="btn btn-ghost" style={{ padding: '2px' }} disabled={idx === features.length - 1} onClick={() => moveFeature(idx, 'down')}><ArrowDown size={14}/></button>
                    </div>
                  </td>
                  <td><code style={{ background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{feat.key}</code></td>
                  <td style={{ fontWeight: 500 }}>{feat.name}</td>
                  <td><span className="badge badge-gray">{feat.type}</span></td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{feat.defaultValue}{feat.unit ? ` ${feat.unit}` : ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => setFeatureModal({ open: true, mode: 'edit', data: { ...feat } })}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => setDeleteConfirm({ type: 'feature', id: feat.id, name: feat.name })}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Assign Users Modal ─────────────────────────────────────────────── */}
      {assignModal.open && (
        <div className="modal-overlay" onClick={() => setAssignModal({ open: false, plan: null, emails: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Users to {assignModal.plan?.name}</h3>
              <button className="btn btn-ghost" onClick={() => setAssignModal({ open: false, plan: null, emails: '' })}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Paste a comma-separated list of user emails to instantly move them to this plan.
            </p>
            <textarea 
              className="input-field" 
              rows={4} 
              placeholder="user1@example.com, user2@example.com"
              value={assignModal.emails}
              onChange={e => setAssignModal(m => ({ ...m, emails: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setAssignModal({ open: false, plan: null, emails: '' })}>Cancel</button>
              <button className="btn btn-primary" onClick={assignUsers} disabled={saving || !assignModal.emails.trim()}>{saving ? 'Assigning...' : 'Assign Users'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan Modal ─────────────────────────────────────────────────────── */}
      {planModal.open && (
        <div className="modal-overlay" onClick={() => setPlanModal(m => ({ ...m, open: false }))}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{planModal.mode === 'create' ? 'Create Plan' : 'Edit Plan'}</h3>
              <button className="btn btn-ghost" onClick={() => setPlanModal(m => ({ ...m, open: false }))}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Plan Name *</label>
                <input className="input-field" value={planModal.data.name} onChange={e => planField('name', e.target.value)} placeholder="e.g. Pro" />
              </div>
              <div className="input-group">
                <label className="input-label">Slug *</label>
                <input className="input-field" value={planModal.data.slug} onChange={e => planField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="e.g. pro" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label">Weekly Price (₹)</label>
                <input className="input-field" type="number" value={planModal.data.priceWeekly ?? 0} onChange={e => planField('priceWeekly', Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">Monthly Price (₹)</label>
                <input className="input-field" type="number" value={planModal.data.priceMonthly ?? 0} onChange={e => planField('priceMonthly', Number(e.target.value))} />
              </div>
              <div className="input-group">
                <label className="input-label">Yearly Price (₹)</label>
                <input className="input-field" type="number" value={planModal.data.priceYearly ?? 0} onChange={e => planField('priceYearly', Number(e.target.value))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={planModal.data.color} onChange={e => planField('color', e.target.value)} style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <input className="input-field" value={planModal.data.color} onChange={e => planField('color', e.target.value)} style={{ flex: 1 }} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Sort Order</label>
                <input className="input-field" type="number" value={planModal.data.sortOrder} onChange={e => planField('sortOrder', Number(e.target.value))} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Tagline</label>
              <input className="input-field" value={planModal.data.tagline ?? ''} onChange={e => planField('tagline', e.target.value)} placeholder="Short marketing phrase" />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input-field" value={planModal.data.description ?? ''} onChange={e => planField('description', e.target.value)} rows={2} placeholder="What's included..." />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={planModal.data.isActive} onChange={e => planField('isActive', e.target.checked)} style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }} />
                Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={planModal.data.isDefault} onChange={e => planField('isDefault', e.target.checked)} style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16 }} />
                Default for new users
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setPlanModal(m => ({ ...m, open: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={savePlan} disabled={saving}>{saving ? 'Saving...' : planModal.mode === 'create' ? 'Create Plan' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feature Modal ──────────────────────────────────────────────────── */}
      {featureModal.open && (
        <div className="modal-overlay" onClick={() => setFeatureModal(m => ({ ...m, open: false }))}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{featureModal.mode === 'create' ? 'Add Feature' : 'Edit Feature'}</h3>
              <button className="btn btn-ghost" onClick={() => setFeatureModal(m => ({ ...m, open: false }))}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {featureModal.mode === 'create' && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Quick Templates</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {STANDARD_FEATURES.map(sf => (
                      <button key={sf.key} className="badge badge-gray" style={{ cursor: 'pointer', border: '1px solid var(--border)' }} onClick={(e) => { e.preventDefault(); setFeatureModal(m => ({ ...m, data: { ...m.data, ...sf } })); }}>
                        + {sf.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Feature Key *</label>
                <input className="input-field" value={featureModal.data.key} onChange={e => featField('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="e.g. max_cashbooks" disabled={featureModal.mode === 'edit'} />
              </div>
              <div className="input-group">
                <label className="input-label">Display Name *</label>
                <input className="input-field" value={featureModal.data.name} onChange={e => featField('name', e.target.value)} placeholder="e.g. Max Cashbooks" />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="input-field" value={featureModal.data.type} onChange={e => featField('type', e.target.value)}>
                  <option value="boolean">Boolean (true/false)</option>
                  <option value="number">Number</option>
                  <option value="string">String</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Default Value</label>
                {featureModal.data.type === 'boolean' ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={featureModal.data.defaultValue === 'true' || featureModal.data.defaultValue === '1'} onChange={e => featField('defaultValue', e.target.checked ? 'true' : 'false')} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                ) : featureModal.data.type === 'number' ? (
                  <input type="number" className="input-field" value={featureModal.data.defaultValue} onChange={e => featField('defaultValue', String(e.target.value))} placeholder="e.g. 3 or -1" />
                ) : (
                  <input className="input-field" value={featureModal.data.defaultValue} onChange={e => featField('defaultValue', e.target.value)} placeholder="e.g. standard" />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setFeatureModal(m => ({ ...m, open: false }))}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFeature} disabled={saving}>{saving ? 'Saving...' : featureModal.mode === 'create' ? 'Add Feature' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Confirm Delete</h3>
            {deleteConfirm.type === 'plan' && deleteConfirm.usersCount && deleteConfirm.usersCount > 0 ? (
              <>
                <p style={{ marginBottom: '1rem', color: 'var(--danger)' }}>
                  <strong>Warning:</strong> {deleteConfirm.usersCount} users are currently on this plan. You must select a fallback plan to move them to before deleting.
                </p>
                <div className="input-group">
                  <label className="input-label">Fallback Plan</label>
                  <select 
                    className="input-field" 
                    value={deleteConfirm.fallbackPlanId || ''} 
                    onChange={e => setDeleteConfirm(prev => prev ? { ...prev, fallbackPlanId: e.target.value } : null)}
                  >
                    <option value="" disabled>Select a plan...</option>
                    {plans.filter(p => p.id !== deleteConfirm.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <p style={{ marginBottom: '1.5rem' }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button 
                className="btn btn-danger" 
                onClick={() => deleteConfirm.type === 'plan' ? deletePlan() : deleteFeature()}
                disabled={deleteConfirm.type === 'plan' && (deleteConfirm.usersCount ?? 0) > 0 && !deleteConfirm.fallbackPlanId}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
