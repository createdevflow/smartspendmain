'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { BudgetModal } from '@/components/BudgetModal';
import { GoalModal } from '@/components/GoalModal';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle, Plus, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Link from 'next/link';

const COLORS = ['#2D8CFF', '#7C3AED', '#059669', '#F59E0B', '#DC2626', '#0891B2', '#DB2777', '#EA580C'];

export default function WealthHubPage() {
  const { user, isFeatureEnabled } = useApp();
  const currency = user?.currency || 'INR';
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');

  const [isBudgetOpen, setBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [isGoalOpen, setGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/budgets').catch(() => ({ data: { data: [] } })),
      api.get('/goals').catch(() => ({ data: { data: [] } })),
    ]).then(([bRes, gRes]) => {
      const raw = bRes.data?.data || [];
      setBudgets(raw.map((b: any) => ({ ...b, spent: Number(b.spent || 0), limit: Number(b.limit || b.amount || 0) })));
      setGoals(gRes.data?.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBudget = budgets.reduce((a, b) => a + b.limit, 0);
  const totalSpent = budgets.reduce((a, b) => a + b.spent, 0);
  const overBudgetCount = budgets.filter(b => b.spent > b.limit).length;
  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Budgets & Wealth Hub"
          subtitle="Track your spending limits and savings goals"
          action={
            <button className="btn btn-primary" onClick={() => { setSelectedBudget(null); setBudgetOpen(true); }}>
              <Plus size={15} /> Add Budget
            </button>
          }
        />

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Total Budget" value={fmt(totalBudget, currency)} icon={DollarSign} loading={loading} />
          <StatCard title="Total Spent" value={fmt(totalSpent, currency)} icon={TrendingUp} iconBg="#FEF2F2" iconColor="var(--danger)" loading={loading} />
          <StatCard title="Over-budget Items" value={String(overBudgetCount)} icon={AlertTriangle} iconBg={overBudgetCount > 0 ? '#FEF2F2' : '#ECFDF5'} iconColor={overBudgetCount > 0 ? 'var(--danger)' : 'var(--success)'} loading={loading} />
          <StatCard title="Active Goals" value={String(activeGoals)} icon={Target} iconBg="#FAE8FF" iconColor="#7C3AED" loading={loading} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          {(['budgets', 'goals'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem', fontWeight: 600, fontSize: 'var(--text-sm)', color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : '2px solid transparent', marginBottom: '-0.75rem', transition: 'var(--transition)' }}>
              {tab === 'budgets' ? 'Budgets' : 'Savings Goals'}
            </button>
          ))}
        </div>

        {activeTab === 'budgets' && (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Budget progress bars */}
            <div className="card" style={{ flex: '2 1 380px' }}>
              <h3 className="section-heading">Category Budgets</h3>
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} style={{ height: '60px', background: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '1rem' }} />)
              ) : budgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
                  <p style={{ fontSize: 'var(--text-sm)' }}>No budgets set. Create one to track spending.</p>
                </div>
              ) : (
                budgets.map((b, i) => {
                  const pct = Math.min((b.spent / b.limit) * 100, 100) || 0;
                  const over = b.spent > b.limit;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={b.id || i} style={{ marginBottom: '1.25rem', cursor: 'pointer' }} onClick={() => { setSelectedBudget(b); setBudgetOpen(true); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: 'var(--text-sm)' }}>
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: over ? 'var(--danger)' : color, display: 'inline-block', flexShrink: 0 }} />
                          {b.name || b.category}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{fmt(b.spent, currency)} / {fmt(b.limit, currency)}</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-hover)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: over ? 'var(--danger)' : color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
                      </div>
                      {over && (
                        <p style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={11} /> Over by {fmt(b.spent - b.limit, currency)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Donut */}
            <div className="card" style={{ flex: '1 1 260px' }}>
              <h3 className="section-heading">Spending Breakdown</h3>
              {budgets.length > 0 ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={budgets} dataKey="spent" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4}>
                          {budgets.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmt(Number(v), currency)} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {budgets.slice(0, 5).map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{b.name || b.category}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>{Math.round((b.spent / totalSpent) * 100) || 0}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>No data</div>}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="card" style={{ height: '180px', background: 'var(--bg-hover)' }} />)
            ) : goals.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
                <h3 style={{ marginBottom: '0.5rem' }}>No goals yet</h3>
                <p style={{ marginBottom: '1.5rem', fontSize: 'var(--text-sm)' }}>Set a savings goal to stay motivated.</p>
                <button className="btn btn-primary" onClick={() => { setSelectedGoal(null); setGoalOpen(true); }}><Plus size={14} /> Add Goal</button>
              </div>
            ) : (
              goals.map((g: any) => {
                const pct = Math.min(((Number(g.currentAmount) || 0) / (Number(g.targetAmount) || 1)) * 100, 100);
                return (
                  <div key={g.id} className="card" style={{ cursor: 'pointer' }} onClick={() => { setSelectedGoal(g); setGoalOpen(true); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>{g.name}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{g.category || 'Savings'}</p>
                      </div>
                      <span className={`badge ${g.status === 'ACTIVE' ? 'badge-success' : g.status === 'COMPLETED' ? 'badge-info' : 'badge-warning'}`}>{g.status}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: 'var(--text-sm)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{fmt(Number(g.currentAmount || 0), currency)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>of {fmt(Number(g.targetAmount || 0), currency)}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-hover)', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : 'var(--accent-primary)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>{pct.toFixed(0)}% complete{g.deadline ? ` · Due ${g.deadline}` : ''}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        <BudgetModal isOpen={isBudgetOpen} onClose={() => setBudgetOpen(false)} budget={selectedBudget} onSuccess={fetchData} />
        <GoalModal isOpen={isGoalOpen} onClose={() => setGoalOpen(false)} goal={selectedGoal} onSuccess={fetchData} />
      </main>
    </>
  );
}
