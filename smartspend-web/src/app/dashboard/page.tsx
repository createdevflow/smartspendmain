'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { DataList } from '@/components/DataList';
import { TransactionModal } from '@/components/TransactionModal';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt } from '@/lib/utils';
import { Wallet, ArrowUpRight, ArrowDownRight, Target, Plus, TrendingUp, TrendingDown, Sparkles, BookOpen, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';

const CHART_COLORS = ['#2D8CFF', '#7C3AED', '#059669', '#F59E0B', '#DC2626', '#0891B2', '#DB2777'];
const PERIODS = [
  { label: 'Last 7 Days', value: 'weekly' },
  { label: 'Last 6 Months', value: 'monthly' },
  { label: 'Last 5 Years', value: 'yearly' },
];

function buildQ(cashbookId: string | null, existing?: string) {
  if (!cashbookId) return existing || '';
  return existing ? `${existing}&cashbookId=${cashbookId}` : `?cashbookId=${cashbookId}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isFeatureEnabled, activeCashbookId } = useApp();
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ balance: 0, income: 0, expense: 0, savings: 0, savingsRate: 0, expenseChange: 0 });
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [primaryCashbook, setPrimaryCashbook] = useState<any>(null);
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const currency = user?.currency || 'INR';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cbQ = activeCashbookId ? `?cashbookId=${activeCashbookId}` : '';
      const cbQA = activeCashbookId ? `&cashbookId=${activeCashbookId}` : '';

      const [dashRes, cashflowRes, catRes, cbRes, insightsRes] = await Promise.all([
        api.get(`/analytics/dashboard${cbQ}`).catch(() => ({ data: { data: {} } })),
        api.get(`/analytics/cashflow?period=${period}${cbQA}`).catch(() => ({ data: { data: [] } })),
        api.get(`/analytics/categories?type=EXPENSE${cbQA}`).catch(() => ({ data: { data: { data: [] } } })),
        api.get('/cashbooks').catch(() => ({ data: { data: [] } })),
        api.get(`/analytics/insights${cbQ}`).catch(() => ({ data: { data: [] } })),
      ]);

      // Backend wraps all responses: { success, data: <actual_payload>, timestamp }
      const dash = dashRes.data?.data || {};
      const sum = dash.summary || {};
      setStats({
        balance: Number(dash.netWorth?.netWorth ?? 0),
        income: Number(sum.income ?? 0),
        expense: Number(sum.expense ?? 0),
        savings: Number(sum.savings ?? 0),
        savingsRate: Number(sum.savingsRate ?? 0),
        expenseChange: Number(sum.expenseChange ?? 0),
      });

      // Cashflow: backend returns array directly → wrapped as { data: [...] }
      const cf = cashflowRes.data?.data;
      setCashflow(Array.isArray(cf) ? cf : []);

      // Categories: backend returns { data: [...], total } → wrapped as { data: { data: [...], total } }
      const catPayload = catRes.data?.data;
      const catArr = Array.isArray(catPayload?.data) ? catPayload.data : (Array.isArray(catPayload) ? catPayload : []);
      setCategories(catArr.slice(0, 7));

      // Recent transactions from dashboard
      const recentRaw = dash.recentTransactions;
      setRecentTxs(Array.isArray(recentRaw) ? recentRaw : []);

      // Insights: array of strings
      const insArr = insightsRes.data?.data;
      setInsights(Array.isArray(insArr) ? insArr : []);

      // Primary cashbook
      const cbs: any[] = cbRes.data?.data || [];
      if (cbs.length > 0) {
        const active = activeCashbookId ? cbs.find((c: any) => c.id === activeCashbookId) : cbs[0];
        const displayCb = active || cbs[0];
        setPrimaryCashbook(displayCb);
        if (displayCb?.id) {
          const billsRes = await api.get(`/transactions/upcoming-bills/${displayCb.id}`).catch(() => ({ data: { data: [] } }));
          setUpcomingBills((billsRes.data?.data || []).slice(0, 4));
        }
      }
    } catch (e) {
      console.error('Dashboard load error', e);
    } finally {
      setLoading(false);
    }
  }, [period, activeCashbookId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenWelcome');
      if (!hasSeen) {
        router.push('/onboarding');
      }
    }
  }, [router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || '';

  const hasFlowData = cashflow.length > 0 && cashflow.some(p => p.income > 0 || p.expense > 0);
  const hasCatData = categories.length > 0;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title={`${greeting}${firstName ? `, ${firstName}` : ''} 👋`}
          subtitle={primaryCashbook ? `Viewing: ${primaryCashbook.name}` : 'Your financial overview'}
          action={
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Transaction
            </button>
          }
        />

        {/* ── Stat Cards ── */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Net Worth" value={fmt(stats.balance, currency)} icon={Wallet} loading={loading} iconBg="#EFF6FF" iconColor="var(--accent-primary)" />
          <StatCard title="Monthly Income" value={fmt(stats.income, currency)} icon={ArrowUpRight} loading={loading} iconBg="#ECFDF5" iconColor="var(--success)" />
          <StatCard
            title="Monthly Expenses"
            value={fmt(stats.expense, currency)}
            icon={ArrowDownRight}
            loading={loading}
            iconBg="#FEF2F2"
            iconColor="var(--danger)"
            trend={stats.expenseChange !== 0 ? `${Math.abs(stats.expenseChange)}% vs last month` : undefined}
            trendUp={stats.expenseChange < 0}
          />
          <StatCard
            title="Monthly Savings"
            value={fmt(stats.savings, currency)}
            icon={Target}
            loading={loading}
            iconBg="#FAE8FF"
            iconColor="#7C3AED"
            trend={stats.savingsRate > 0 ? `${stats.savingsRate}% of income saved` : undefined}
            trendUp={stats.savingsRate > 0}
          />
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {/* Cash Flow */}
          <div className="card" style={{ flex: '2 1 480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="section-heading" style={{ margin: 0 }}>Cash Flow</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Income vs Expenses over time</p>
              </div>
              <select
                className="input-field"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: 'var(--text-xs)', margin: 0 }}
              >
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: 260, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ) : !hasFlowData ? (
              <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
                <BarChart2 size={40} strokeWidth={1} />
                <p style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: 200 }}>No transactions in this period. Add some to see your cash flow.</p>
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflow} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} dx={-4} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', fontSize: '0.8125rem', background: 'var(--bg-surface)' }}
                      formatter={(v: any, name: any) => [fmt(Number(v), currency), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.75rem' }} />
                    <Area type="monotone" dataKey="income" stroke="#059669" strokeWidth={2.5} fill="url(#incGrad)" dot={false} name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2.5} fill="url(#expGrad)" dot={false} name="Expenses" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Donut */}
          <div className="card" style={{ flex: '1 1 240px' }}>
            <h3 className="section-heading" style={{ marginBottom: '1rem' }}>Spending by Category</h3>
            {loading ? (
              <div style={{ height: 200, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : !hasCatData ? (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
                <TrendingDown size={36} strokeWidth={1} />
                <p style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }}>No expense categories this month</p>
              </div>
            ) : (
              <>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} dataKey="amount" nameKey="category.name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}>
                        {categories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, _: any, props: any) => [fmt(Number(v), currency), props.payload?.category?.name || 'Uncategorized']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {categories.slice(0, 5).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem' }}>{c.category?.emoji || '📦'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{c.category?.name || 'Uncategorized'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{c.percentage}%</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(c.amount, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Recent transactions */}
          <div style={{ flex: '2 1 380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 className="section-heading" style={{ margin: 0, fontSize: 'var(--text-base)' }}>Recent Transactions</h3>
              <Link href="/transactions" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
            </div>
            <DataList data={recentTxs} currency={currency} loading={loading} emptyMessage="No transactions yet. Add your first one!" />
          </div>

          {/* Right Rail */}
          <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active Cashbook Card */}
            {primaryCashbook && (
              <div className="card" style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BookOpen size={14} color="rgba(255,255,255,0.7)" />
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    {primaryCashbook.name}
                  </p>
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'white', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {fmt(Number(primaryCashbook.balance ?? 0), currency)}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                  <button className="btn" style={{ background: 'white', color: 'var(--accent-primary)', fontWeight: 700, fontSize: 'var(--text-sm)' }} onClick={() => setModalOpen(true)}>
                    <Plus size={14} /> Add Tx
                  </button>
                  <Link href="/transactions/reports" className="btn" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                    Reports
                  </Link>
                </div>
              </div>
            )}

            {/* Monthly Summary mini card */}
            {!loading && (stats.income > 0 || stats.expense > 0) && (
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>This Month</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={13} color="#16A34A" />
                      </div>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Income</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: '#16A34A' }}>{fmt(stats.income, currency)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingDown size={13} color="#DC2626" />
                      </div>
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Expenses</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: '#DC2626' }}>{fmt(stats.expense, currency)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.625rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>Net Savings</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: stats.savings >= 0 ? '#16A34A' : '#DC2626' }}>{fmt(stats.savings, currency)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Bills */}
            {isFeatureEnabled('subscriptions') && upcomingBills.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="section-heading" style={{ margin: 0, fontSize: 'var(--text-base)' }}>Upcoming Bills</h3>
                  <Link href="/subscriptions" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>All →</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {upcomingBills.map((bill: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>
                          {(bill.merchant || bill.name || 'B')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-primary)', margin: 0 }}>{bill.merchant || bill.name}</p>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: 0 }}>{bill.nextDate || bill.dueDate || 'Soon'}</p>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-xs)', color: 'var(--danger)' }}>−{fmt(Number(bill.amount), currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                  <Sparkles size={15} color="var(--accent-primary)" />
                  <h3 className="section-heading" style={{ margin: 0, fontSize: 'var(--text-base)' }}>Smart Insights</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {insights.map((ins: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start', background: 'var(--bg-hover)', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '1.1rem', lineHeight: 1.2, flexShrink: 0 }}>{ins.split(' ')[0]}</span>
                      <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.substring(ins.indexOf(' ') + 1)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <TransactionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} onSuccess={fetchData} />
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
