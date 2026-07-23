'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Calendar,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

function formatAmount(amount: number | string, currency = 'INR') {
  const n = parseFloat(String(amount));
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(search ? { search } : {}),
      });
      const res = await api.get(`/admin/transactions?${params}`);
      const d = res.data?.data;
      setTransactions(d?.data || []);
      setMeta(d?.meta || { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, from, to, search]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = ['ID', 'User', 'Type', 'Amount', 'Currency', 'Category', 'Date', 'Payment Method'];
    const rows = transactions.map(tx => [
      tx.id,
      tx.user?.email || '',
      tx.type,
      tx.amount,
      tx.currency,
      tx.category?.name || '',
      formatDate(tx.date),
      tx.paymentMethod || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashtro_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="responsive-form-grid">
          <div>
            <h1 className="page-title animate-fade-in">Transactions</h1>
            <p className="body-text">
              View and manage all transactions across all users. ({meta.total.toLocaleString()} total)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={fetchTransactions}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <StatCard 
            title="Total Records" 
            value={meta.total.toLocaleString()} 
            icon={Filter} 
            variant="primary" 
          />
          <StatCard 
            title="Total Income (page)" 
            value={formatAmount(totalIncome)} 
            icon={ArrowUpCircle} 
            variant="success" 
          />
          <StatCard 
            title="Total Expense (page)" 
            value={formatAmount(totalExpense)} 
            icon={ArrowDownCircle} 
            variant="danger" 
          />
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                className="input-field"
                placeholder="Search by user email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ paddingLeft: '2.25rem', margin: 0 }}
              />
            </div>

            {/* Type filter */}
            <select
              className="input-field"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ width: '140px', margin: 0 }}
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>

            {/* Date range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="date"
                className="input-field"
                value={from}
                onChange={e => { setFrom(e.target.value); setPage(1); }}
                style={{ width: '140px', margin: 0 }}
              />
              <span className="caption-text">to</span>
              <input
                type="date"
                className="input-field"
                value={to}
                onChange={e => { setTo(e.target.value); setPage(1); }}
                style={{ width: '140px', margin: 0 }}
              />
            </div>

            {(typeFilter || from || to || search) && (
              <button
                className="btn btn-secondary"
                onClick={() => { setTypeFilter(''); setFrom(''); setTo(''); setSearch(''); setPage(1); }}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['User', 'Type', 'Amount', 'Category', 'Payment', 'Date'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}>
                          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: j === 0 ? '140px' : '80px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No transactions found
                    </td>
                  </tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>{tx.user?.fullName || '—'}</p>
                        <p className="caption-text" style={{ margin: 0 }}>{tx.user?.email || '—'}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${tx.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type === 'INCOME' ? <ArrowUpCircle size={12} style={{marginRight: '4px'}}/> : <ArrowDownCircle size={12} style={{marginRight: '4px'}}/>}
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td>
                      {tx.category ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          {tx.category.emoji} {tx.category.name}
                        </span>
                      ) : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {tx.paymentMethod || '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(tx.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Showing {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total.toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.4rem 0.75rem', gap: '0.3rem' }}
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(meta.totalPages - 4, page - 2)) + i;
                  return (
                    <button
                      key={p}
                      className={`btn ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPage(p)}
                      style={{ padding: '0.4rem 0.75rem', minWidth: '36px' }}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  style={{ padding: '0.4rem 0.75rem' }}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
