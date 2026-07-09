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
    <div className="min-h-screen bg-gray-50/50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Plans & Pricing</h1>
              <p className="text-sm text-gray-500 mt-1">Manage subscription tiers and feature limits</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-1 rounded-xl flex">
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'matrix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Feature Matrix
                </button>
              </div>
              <button
                onClick={() => setPlanModal({ open: true, mode: 'create', data: EMPTY_PLAN })}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                New Plan
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
        </main>
      </div>

      <PlanEditorDrawer
        open={planModal.open}
        mode={planModal.mode}
        plan={planModal.data}
        features={features}
        onClose={() => setPlanModal({ open: false, mode: 'create', data: EMPTY_PLAN })}
        onSave={handleSavePlan}
        saving={saving}
      />
    </div>
  );
}
