'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Search, Filter, Download, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, RefreshCw, Calendar,
} from 'lucide-react';

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
    a.download = `smartspend_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Transactions</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              View and manage all transactions across all users. ({meta.total.toLocaleString()} total)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={fetchTransactions} style={{ gap: '0.5rem' }}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV} style={{ gap: '0.5rem' }}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </header>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Records', value: meta.total.toLocaleString(), color: 'var(--accent-primary)', bg: 'rgba(37,99,235,0.08)' },
            { label: 'Total Income (page)', value: formatAmount(totalIncome), color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
            { label: 'Total Expense (page)', value: formatAmount(totalExpense), color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '1.25rem', borderLeft: `3px solid ${card.color}` }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
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
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>to</span>
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
        <div className="card glass-panel" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Type', 'Amount', 'Category', 'Payment', 'Date'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '0.875rem 1rem' }}>
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
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{tx.user?.fullName || '—'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tx.user?.email || '—'}</p>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '999px',
                        background: tx.type === 'INCOME' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {tx.type === 'INCOME' ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: tx.type === 'INCOME' ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem' }}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {tx.category ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          {tx.category.emoji} {tx.category.name}
                        </span>
                      ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {tx.paymentMethod || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
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
