'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { FileText, RefreshCw, Download } from 'lucide-react';

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
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">Tax Export Logs</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Track when users download their tax deductible transaction reports. Total exports: {meta?.total ?? '—'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchLogs(page)} style={{ gap: '0.5rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card metric-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Exports</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{meta?.total ?? '—'}</p>
              </div>
            </div>
          </div>
          <div className="card metric-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unique Users</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {new Set(logs.map(l => l.userId)).size}
                </p>
              </div>
            </div>
          </div>
          <div className="card metric-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Tx Exported</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  {logs.reduce((sum, l) => sum + (l.txCount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading export logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-secondary)' }}>No tax exports have been made yet.</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Exports will appear here when users download their tax reports.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Year</th>
                  <th>Transactions</th>
                  <th>Total Amount</th>
                  <th>Exported At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.user?.fullName || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{log.user?.email}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{log.year}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.txCount}</span> transactions
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#059669' }}>
                        {Number(log.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div>{new Date(log.exportedAt).toLocaleDateString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(log.exportedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Page {page} of {meta.totalPages}
            </span>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))} disabled={page === meta.totalPages}>Next</button>
          </div>
        )}
      </main>
    </>
  );
}
