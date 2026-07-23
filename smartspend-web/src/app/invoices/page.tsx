'use client';
/**
 * Invoices page — NOTE: The backend has no standalone /invoices API module.
 * Invoices on mobile are stored in AsyncStorage (per-user). For web parity,
 * we persist invoices in localStorage under the same key contract.
 * FLAG: If backend team adds a /invoices REST API, replace localStorage calls
 * with api.get/post/patch/delete('/invoices') throughout this file.
 */
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { InvoiceModal } from '@/components/InvoiceModal';
import { SchedulerModal } from '@/components/SchedulerModal';
import { fmt, fmtDate } from '@/lib/utils';
import { FileText, Plus, CheckCircle2, Clock, AlertCircle, Download, Trash2, Edit } from 'lucide-react';

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  clientName: string;
  clientEmail?: string;
  issueDate: string;
  dueDate: string;
  total: number;
  currency: string;
  items?: any[];
}

const STATUS_META: Record<InvoiceStatus, { label: string; cls: string; icon: any }> = {
  DRAFT:     { label: 'Draft',     cls: 'badge-warning', icon: Clock },
  SENT:      { label: 'Sent',      cls: 'badge-info',    icon: Clock },
  PAID:      { label: 'Paid',      cls: 'badge-success', icon: CheckCircle2 },
  OVERDUE:   { label: 'Overdue',   cls: 'badge-danger',  icon: AlertCircle },
  CANCELLED: { label: 'Cancelled', cls: '',              icon: null },
};



export default function InvoicesPage() {
  const { user } = useApp();
  const currency = user?.currency || 'INR';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleInvoice, setScheduleInvoice] = useState<any>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data?.data || []);
    } catch {
      // fallback to empty if backend doesn't exist
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.id]);

  const handleOpenModal = (inv?: any) => {
    setSelectedInvoice(inv || null);
    setModalOpen(true);
  };

  const handleSchedule = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Transform invoice to match transaction shape expected by SchedulerModal
    setScheduleInvoice({
      ...inv,
      type: 'INCOME', // Usually invoices are money coming in
      amount: inv.total,
      merchant: inv.clientName,
      date: inv.issueDate,
    });
    setScheduleOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch {
      alert('Failed to delete invoice');
    }
  };

  const filtered = filter === 'ALL' ? invoices : invoices.filter(inv => inv.status === filter);

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + Number(i.total), 0);
  const totalPending = invoices.filter(i => i.status === 'SENT').reduce((a, i) => a + Number(i.total), 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((a, i) => a + Number(i.total), 0);

  const FILTERS = ['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'];

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Invoices"
          subtitle={`${invoices.length} total invoices`}
          action={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={15} /> New Invoice
            </button>
          }
        />

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Revenue (Paid)" value={fmt(totalRevenue, currency)} icon={CheckCircle2} iconBg="#ECFDF5" iconColor="var(--success)" loading={loading} />
          <StatCard title="Pending" value={fmt(totalPending, currency)} icon={Clock} iconBg="#FFFBEB" iconColor="var(--warning)" loading={loading} />
          <StatCard title="Overdue" value={fmt(totalOverdue, currency)} icon={AlertCircle} iconBg="#FEF2F2" iconColor="var(--danger)" loading={loading} />
          <StatCard title="Total Invoices" value={String(invoices.length)} icon={FileText} loading={loading} />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ height: '34px', fontSize: 'var(--text-xs)' }} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : STATUS_META[f as InvoiceStatus]?.label || f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Status', 'Amount', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[...Array(7)].map((_, j) => <td key={j} style={{ padding: '0.875rem 1.25rem' }}><div style={{ height: '0.875rem', background: 'var(--bg-hover)', borderRadius: '4px', width: '70%' }} /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧾</div>
                    <p style={{ fontSize: 'var(--text-sm)' }}>No invoices found. Create your first one!</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv, i) => {
                  const meta = STATUS_META[inv.status] || STATUS_META['DRAFT'];
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={inv.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => handleOpenModal(inv)}>
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--accent-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={14} />
                          {inv.invoiceNumber || inv.id?.slice(0, 8) || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{inv.clientName}</td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{fmtDate(inv.issueDate)}</td>
                      <td style={{ padding: '0.875rem 1.25rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{fmtDate(inv.dueDate)}</td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span className={`badge ${meta.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {StatusIcon && <StatusIcon size={10} />}
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {fmt(Number(inv.total), inv.currency || currency)}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost" style={{ padding: '0.375rem' }} onClick={e => handleSchedule(inv, e)}><Clock size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '0.375rem' }} onClick={e => { e.stopPropagation(); /* PDF export logic */ }}><Download size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: '0.375rem', color: 'var(--danger)' }} onClick={e => handleDelete(inv.id, e)}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <InvoiceModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} invoice={selectedInvoice} onSuccess={fetchInvoices} />
        <SchedulerModal isOpen={isScheduleOpen} onClose={() => setScheduleOpen(false)} transaction={scheduleInvoice} onSuccess={fetchInvoices} />
      </main>
    </>
  );
}
