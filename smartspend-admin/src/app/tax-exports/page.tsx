'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { FileText, RefreshCw, Download } from 'lucide-react';

import { StatCard } from '@/components/ui/StatCard';

export default function TaxExportLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/tax-export-logs?page=${p}&limit=20`);
      setLogs(res.data?.data?.data || []);
      setMeta(res.data?.data?.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page]);

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
          <div className="page-header animate-fade-in">
          <div className="page-header-left">
            <h1 className="page-title">Tax Export Logs</h1>
            <p className="body-text" style={{ marginTop: 'var(--sp-1)' }}>
              Track when users download their tax-deductible transaction reports. Total: {meta?.total ?? '—'}
            </p>
          </div>
          <div className="page-header-right">
            <button className="btn btn-secondary btn-sm" onClick={() => fetchLogs(page)} aria-label="Refresh logs">
              <RefreshCw size={14} aria-hidden="true" /> Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="stats-grid-3" style={{ marginBottom: 'var(--sp-6)' }}>
          <StatCard
            title="Total Exports"
            value={meta?.total ?? '—'}
            icon={Download}
            variant="success"
            accentBorder
            loading={loading}
          />
          <StatCard
            title="Unique Users"
            value={new Set(logs.map(l => l.userId)).size}
            icon={FileText}
            variant="primary"
            accentBorder
            loading={loading}
          />
          <StatCard
            title="Total Tx Exported"
            value={logs.reduce((sum, l) => sum + (l.txCount || 0), 0).toLocaleString()}
            icon={FileText}
            variant="info"
            accentBorder
            loading={loading}
          />
        </div>

        {/* Table */}
        <div className="table-shell">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">User</th>
                  <th scope="col">Year</th>
                  <th scope="col">Transactions</th>
                  <th scope="col">Total Amount</th>
                  <th scope="col">Exported At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {[140, 60, 80, 100, 100].map((w, j) => (
                        <td key={j}>
                          <div className="skeleton" style={{ height: '13px', width: `${w}px`, borderRadius: '3px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0 }}>
                      <div className="state-empty">
                        <div className="state-empty-icon"><FileText size={32} aria-hidden="true" /></div>
                        <p className="state-empty-title">No tax exports yet</p>
                        <p className="state-empty-desc">Exports appear here when users download their tax reports.</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.user?.fullName || '—'}</div>
                      <div className="caption-text">{log.user?.email}</div>
                    </td>
                    <td>
                      <span className="pill pill-info">{log.year}</span>
                    </td>
                    <td className="tabular">
                      {log.txCount} <span className="caption-text">transactions</span>
                    </td>
                    <td className="tabular" style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {Number(log.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div className="mono-text" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(log.exportedAt).toLocaleDateString('en-IN')}
                      </div>
                      <div className="caption-text">
                        {new Date(log.exportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Page {page} of {meta.totalPages}</span>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1} aria-label="Previous page">‹</button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))} disabled={page === meta.totalPages} aria-label="Next page">›</button>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>
    </>
  );
}
