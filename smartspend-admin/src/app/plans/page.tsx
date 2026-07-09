'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Plus, Settings2 } from 'lucide-react';
import { PlanCard } from '@/components/plans/PlanCard';
import { FeatureMatrix } from '@/components/plans/FeatureMatrix';
import { PlanEditorDrawer } from '@/components/plans/PlanEditorDrawer';

const EMPTY_PLAN = { name: '', slug: '', description: '', tagline: '', color: '#2563EB', isActive: true, isDefault: false, sortOrder: 0, priceWeekly: 0, priceMonthly: 0, priceYearly: 0 };

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

  const [planModal, setPlanModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: any }>({ open: false, mode: 'create', data: EMPTY_PLAN });
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

  const handleSavePlan = async (payload: any) => {
    setSaving(true);
    try {
      if (planModal.mode === 'create') {
        await api.post('/admin/plans', payload);
      } else {
        await api.patch(`/admin/plans/${payload.id}`, payload);
      }
      setPlanModal({ open: false, mode: 'create', data: EMPTY_PLAN });
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (plan: any) => {
    if (confirm(`Are you sure you want to delete ${plan.name}?`)) {
      try {
        await api.delete(`/admin/plans/${plan.id}`);
        fetchData();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Failed to delete plan');
      }
    }
  };

  const handleClonePlan = async (id: string) => {
    try {
      await api.post(`/admin/plans/${id}/duplicate`);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to clone plan');
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="animate-fade-in" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Plans & Pricing</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>Manage subscription tiers and feature limits across the platform</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex' }}>
                <button
                  onClick={() => setActiveTab('cards')}
                  style={{
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeTab === 'cards' ? 'var(--bg-surface)' : 'transparent',
                    color: activeTab === 'cards' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'cards' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Cards
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  style={{
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeTab === 'matrix' ? 'var(--bg-surface)' : 'transparent',
                    color: activeTab === 'matrix' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'matrix' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  Feature Matrix
                </button>
              </div>
              <button
                onClick={() => setPlanModal({ open: true, mode: 'create', data: EMPTY_PLAN })}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                New Plan
              </button>
            </div>
          </header>

          {/* Main Content */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : activeTab === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={(p) => setPlanModal({ open: true, mode: 'edit', data: p })}
                  onDelete={handleDeletePlan}
                  onClone={handleClonePlan}
                />
              ))}
            </div>
          ) : (
            <FeatureMatrix plans={plans} features={features} />
          )}
        </div>
      </main>

      <PlanEditorDrawer
        open={planModal.open}
        mode={planModal.mode}
        plan={planModal.data}
        features={features}
        onClose={() => setPlanModal({ open: false, mode: 'create', data: EMPTY_PLAN })}
        onSave={handleSavePlan}
        saving={saving}
      />
    </>
  );
}
