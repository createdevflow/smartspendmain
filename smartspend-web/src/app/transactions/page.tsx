'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { DataList } from '@/components/DataList';
import { TransactionModal } from '@/components/TransactionModal';
import { SchedulerModal } from '@/components/SchedulerModal';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt } from '@/lib/utils';
import { Activity, ArrowUpRight, ArrowDownRight, Filter, Download, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

const PAGE_SIZE = 20;

function TransactionsPageContent() {
  const { user, activeCashbookId } = useApp();
  const searchParams = useSearchParams();
  const currency = user?.currency || 'INR';

  const [txs, setTxs] = useState<any[]>([]);
  const [cashbooks, setCashbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: searchParams?.get('type') || '',
    cashbookId: searchParams?.get('cashbookId') || activeCashbookId || '',
    q: searchParams?.get('q') || '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTx, setScheduleTx] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!searchParams?.get('cashbookId')) {
      if (activeCashbookId && filters.cashbookId !== activeCashbookId) {
        setFilters(prev => ({ ...prev, cashbookId: activeCashbookId }));
      } else if (!activeCashbookId && filters.cashbookId !== '') {
        setFilters(prev => ({ ...prev, cashbookId: '' }));
      }
    }
  }, [activeCashbookId, searchParams, filters.cashbookId]);

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (filters.type) params.set('type', filters.type);
      if (filters.cashbookId) params.set('cashbookId', filters.cashbookId);
      if (filters.q) params.set('q', filters.q);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/transactions?${params}`);
      const data = res.data?.data;
      setTxs(data?.data || data || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Failed to load transactions', e);
      setTxs([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  useEffect(() => {
    api.get('/cashbooks').then(r => setCashbooks(r.data?.data || [])).catch(() => {});
  }, []);

  // Summary stats from visible set
  const income = txs.filter((t: any) => t.type === 'INCOME').reduce((a: number, t: any) => a + Number(t.amount), 0);
  const expenses = txs.filter((t: any) => t.type === 'EXPENSE').reduce((a: number, t: any) => a + Number(t.amount), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await api.delete(`/transactions/${id}`);
      fetchTxs();
    } catch {
      alert('Failed to delete transaction.');
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (tx: any) => {
    setSelectedTx(tx);
    setModalOpen(true);
  };

  const handleSchedule = (tx: any) => {
    setScheduleTx(tx);
    setScheduleOpen(true);
  };

  const handleShare = (tx: any) => {
    const text = `Transaction: ${tx.merchant || tx.title} - ${fmt(Number(tx.amount), currency)}`;
    if (navigator.share) {
      navigator.share({ title: 'Transaction', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Transaction details copied to clipboard!');
    }
  };

  const handleExport = () => {
    if (txs.length === 0) return alert('No transactions to export');
    const headers = ['Date', 'Type', 'Category', 'Title', 'Amount', 'Cashbook'];
    const csvData = txs.map(t => [
      new Date(t.date || t.createdAt).toLocaleDateString(),
      t.type,
      t.category,
      `"${t.title || ''}"`,
      t.amount,
      `"${t.cashbook?.name || t.cashbookId || ''}"`
    ].join(','));
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const clearFilters = () => {
    setFilters({ type: '', cashbookId: '', q: '', startDate: '', endDate: '' });
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(v => !!v);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Transactions"
          subtitle={`${total.toLocaleString()} total records`}
          action={
            <button className="btn btn-primary" onClick={() => { setSelectedTx(null); setModalOpen(true); }}>
              <Plus size={15} /> Add Transaction
            </button>
          }
        />

        {/* Stat row */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Shown Income" value={fmt(income, currency)} icon={ArrowUpRight} iconBg="#ECFDF5" iconColor="var(--success)" loading={loading} />
          <StatCard title="Shown Expenses" value={fmt(expenses, currency)} icon={ArrowDownRight} iconBg="#FEF2F2" iconColor="var(--danger)" loading={loading} />
          <StatCard title="Net (Shown)" value={fmt(income - expenses, currency)} icon={Activity} iconBg={(income - expenses) >= 0 ? '#ECFDF5' : '#FEF2F2'} iconColor={(income - expenses) >= 0 ? 'var(--success)' : 'var(--danger)'} loading={loading} />
          <StatCard title="Records" value={total.toLocaleString()} icon={Filter} loading={loading} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="input-field" style={{ width: '160px', margin: 0, fontSize: 'var(--text-sm)', padding: '0.375rem 2.25rem 0.375rem 0.75rem' }}
              value={filters.cashbookId} onChange={e => { setFilters(f => ({ ...f, cashbookId: e.target.value })); setPage(1); }}>
              <option value="">All Cashbooks</option>
              {cashbooks.map((cb: any) => <option key={cb.id} value={cb.id}>{cb.name}</option>)}
            </select>
            <select className="input-field" style={{ width: '140px', margin: 0, fontSize: 'var(--text-sm)', padding: '0.375rem 2.25rem 0.375rem 0.75rem' }}
              value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
            <input type="text" placeholder="Search..." className="input-field"
              style={{ width: '180px', margin: 0, fontSize: 'var(--text-sm)', padding: '0.375rem 0.75rem' }}
              value={filters.q} onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }} />
            <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem' }} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} /> Filters {hasFilters && <span className="badge badge-info" style={{ marginLeft: '4px', padding: '2px 6px' }}>ON</span>}
            </button>
            {hasFilters && <button className="btn btn-ghost" style={{ padding: '0.375rem 0.5rem', color: 'var(--danger)' }} onClick={clearFilters}><X size={14} /> Clear</button>}
          </div>
          <button className="btn btn-secondary" style={{ height: '38px' }} onClick={handleExport}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="card" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem 1.25rem' }}>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 160px' }}>
              <label className="input-label">From Date</label>
              <input type="date" className="input-field" style={{ margin: 0 }} value={filters.startDate}
                onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }} />
            </div>
            <div className="input-group" style={{ marginBottom: 0, flex: '1 1 160px' }}>
              <label className="input-label">To Date</label>
              <input type="date" className="input-field" style={{ margin: 0 }} value={filters.endDate}
                onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }} />
            </div>
          </div>
        )}

        <DataList 
          data={txs} 
          currency={currency} 
          loading={loading} 
          onEdit={handleEdit}
          onDelete={handleDelete} 
          onSchedule={handleSchedule}
          onShare={handleShare}
          emptyMessage="No transactions match your filters." 
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages} · {total} records
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft size={16} /> Prev
              </button>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <TransactionModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} transaction={selectedTx} onSuccess={fetchTxs} />
        <SchedulerModal isOpen={isScheduleOpen} onClose={() => setScheduleOpen(false)} transaction={scheduleTx} onSuccess={fetchTxs} />
      </main>
    </>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading transactions...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
