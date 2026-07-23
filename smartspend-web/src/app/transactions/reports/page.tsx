'use client';
import { useEffect, useState, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt } from '@/lib/utils';
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieIcon, Calendar, Wallet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';

const COLORS = ['#2D8CFF', '#7C3AED', '#059669', '#F59E0B', '#DC2626', '#0891B2', '#DB2777', '#EA580C'];
const PERIODS = [
  { label: 'Last 7 Days', value: 'weekly' },
  { label: 'Last 6 Months', value: 'monthly' },
  { label: 'Last 5 Years', value: 'yearly' },
];

function SummaryCard({ label, value, icon: Icon, iconBg, iconColor, sub }: any) {
  return (
    <div style={{ flex: '1 1 140px', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '8px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={15} color={iconColor} />
        </div>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

export default function TransactionReportsPage() {
  const { user, activeCashbookId } = useApp();
  const currency = user?.currency || 'INR';
  const [period, setPeriod] = useState('weekly');
  const [catType, setCatType] = useState('EXPENSE');
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [networth, setNetworth] = useState<{ netWorth: number } | null>(null);
  const [dashSummary, setDashSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const cbQ = activeCashbookId ? `?cashbookId=${activeCashbookId}` : '';
      const cbQA = activeCashbookId ? `&cashbookId=${activeCashbookId}` : '';

      const [cfRes, catRes, nwRes, dashRes] = await Promise.all([
        api.get(`/analytics/cashflow?period=${period}${cbQA}`).catch(() => ({ data: { data: [] } })),
        api.get(`/analytics/categories?type=${catType}${cbQA}`).catch(() => ({ data: { data: { data: [] } } })),
        api.get(`/analytics/networth${cbQ}`).catch(() => ({ data: { data: null } })),
        api.get(`/analytics/dashboard${cbQ}`).catch(() => ({ data: { data: {} } })),
      ]);

      // Cashflow: backend returns array → { data: [...] }
      const cfData = cfRes.data?.data;
      setCashflow(Array.isArray(cfData) ? cfData : []);

      // Categories: backend returns { data: [...], total } → { data: { data: [...], total } }
      const catPayload = catRes.data?.data;
      const catArr = Array.isArray(catPayload?.data) ? catPayload.data : (Array.isArray(catPayload) ? catPayload : []);
      setCategories(catArr.slice(0, 8));

      // Networth: backend returns { netWorth: number } → { data: { netWorth: number } }
      setNetworth(nwRes.data?.data || null);

      // Dashboard summary for the month stats
      const dash = dashRes.data?.data || {};
      setDashSummary(dash.summary || null);

    } catch (e) {
      console.error('Reports load error', e);
    } finally {
      setLoading(false);
    }
  }, [period, catType, activeCashbookId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasFlow = cashflow.some(p => p.income > 0 || p.expense > 0);
  const hasCat = categories.length > 0;
  const totalCat = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Analytics & Reports"
          subtitle="Visual breakdown of your financial activity"
          action={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 'auto', margin: 0, padding: '0.375rem 2.25rem 0.375rem 0.75rem', fontSize: 'var(--text-sm)' }}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          }
        />

        {/* ── Monthly Summary Row ── */}
        {dashSummary && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <SummaryCard label="Income" value={fmt(dashSummary.income ?? 0, currency)} icon={TrendingUp} iconBg="#ECFDF5" iconColor="#16A34A" sub="This month" />
            <SummaryCard label="Expenses" value={fmt(dashSummary.expense ?? 0, currency)} icon={TrendingDown} iconBg="#FEF2F2" iconColor="#DC2626"
              sub={dashSummary.expenseChange !== 0 ? `${Math.abs(dashSummary.expenseChange)}% vs last month` : 'This month'} />
            <SummaryCard label="Net Savings" value={fmt(dashSummary.savings ?? 0, currency)} icon={Wallet} iconBg="#FAE8FF" iconColor="#7C3AED"
              sub={dashSummary.savingsRate > 0 ? `${dashSummary.savingsRate}% savings rate` : 'This month'} />
            {networth && (
              <SummaryCard label="Net Worth" value={fmt(networth.netWorth ?? 0, currency)} icon={Calendar} iconBg="#EFF6FF" iconColor="var(--accent-primary)" sub="All-time" />
            )}
          </div>
        )}

        {/* ── Charts Row ── */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {/* Income vs Expenses Bar Chart */}
          <div className="card" style={{ flex: '2 1 420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="section-heading" style={{ margin: 0 }}>Income vs Expenses</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {period === 'weekly' ? 'Daily for last 7 days' : period === 'monthly' ? 'Monthly for last 6 months' : 'Yearly for last 5 years'}
                </p>
              </div>
              <BarChart2 size={18} color="var(--text-tertiary)" />
            </div>

            {loading ? (
              <div style={{ height: 280, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : !hasFlow ? (
              <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-tertiary)' }}>
                <BarChart2 size={44} strokeWidth={1} />
                <p style={{ fontSize: 'var(--text-sm)', textAlign: 'center', maxWidth: 220 }}>No transactions in this period. Try a different time range.</p>
              </div>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflow} margin={{ left: -14, bottom: 0, right: 4 }} barGap={4} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} dy={6} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '0.8125rem', boxShadow: 'var(--shadow-md)' }}
                      formatter={(v: any, name: any) => [fmt(Number(v), currency), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.75rem' }} />
                    <Bar dataKey="income" fill="#059669" radius={[4, 4, 0, 0]} name="Income" maxBarSize={36} />
                    <Bar dataKey="expense" fill="#DC2626" radius={[4, 4, 0, 0]} name="Expenses" maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category Breakdown Donut */}
          <div className="card" style={{ flex: '1 1 280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 className="section-heading" style={{ margin: 0 }}>By Category</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>This month</p>
              </div>
              <select
                className="input-field"
                value={catType}
                onChange={e => setCatType(e.target.value)}
                style={{ width: 'auto', margin: 0, height: '32px', fontSize: 'var(--text-xs)', padding: '0.25rem 1.5rem 0.25rem 0.5rem' }}
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>

            {loading ? (
              <div style={{ height: 220, background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ) : !hasCat ? (
              <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
                <PieIcon size={40} strokeWidth={1} />
                <p style={{ fontSize: 'var(--text-xs)', textAlign: 'center' }}>No {catType.toLowerCase()} categories this month</p>
              </div>
            ) : (
              <>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} dataKey="amount" nameKey="category.name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3}>
                        {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, _: any, props: any) => [fmt(Number(v), currency), props.payload?.category?.name || 'Uncategorized']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '0.8rem' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {categories.slice(0, 6).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', flex: 1 }}>
                        {c.category?.emoji} {c.category?.name || 'Uncategorized'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{fmt(c.amount, currency)}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                          {totalCat > 0 ? Math.round((c.amount / totalCat) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Trend Area Chart (full width) ── */}
        {hasFlow && !loading && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="section-heading" style={{ margin: 0 }}>Cash Flow Trend</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>Area view — cumulative money movement</p>
              </div>
            </div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} dx={-4} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: '0.8125rem', boxShadow: 'var(--shadow-md)' }}
                    formatter={(v: any, name: any) => [fmt(Number(v), currency), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.75rem' }} />
                  <Area type="monotone" dataKey="income" stroke="#059669" strokeWidth={2.5} fill="url(#incGrad2)" dot={false} name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="#DC2626" strokeWidth={2.5} fill="url(#expGrad2)" dot={false} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Category Detail Table ── */}
        {hasCat && !loading && (
          <div className="card">
            <h3 className="section-heading" style={{ marginBottom: '1rem' }}>
              {catType === 'EXPENSE' ? 'Expense' : 'Income'} Category Breakdown
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transactions</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share</th>
                    <th style={{ padding: '0.5rem 0.75rem', width: 120 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontSize: '1rem' }}>{c.category?.emoji || '📦'}</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.category?.name || 'Uncategorized'}</span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: catType === 'EXPENSE' ? 'var(--danger)' : 'var(--success)' }}>{fmt(c.amount, currency)}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{c.count}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>{c.percentage}%</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ background: 'var(--bg-hover)', borderRadius: '99px', height: 6, overflow: 'hidden' }}>
                          <div style={{ width: `${c.percentage}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: '99px' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
