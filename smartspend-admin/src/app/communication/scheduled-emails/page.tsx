'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Mail, Clock, CheckCircle, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';

export default function ScheduledEmailsAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      // Admin endpoint or user scheduled emails
      const res = await api.get(`/communication/emails?page=${page}&limit=${LIMIT}`);
      setItems(res.data?.items || res.data?.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    SENT: { bg: '#D1FAE5', color: '#059669' },
    PENDING: { bg: '#FEF3C7', color: '#D97706' },
    PAUSED: { bg: '#F3F4F6', color: '#6B7280' },
    FAILED: { bg: '#FEE2E2', color: '#DC2626' },
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/communication')}>
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">Scheduled Emails</h1>
              <p className="page-subtitle">View all automated emails across the platform</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={16} /></button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />Loading…
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Mail size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No scheduled emails found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Recipients</th>
                    <th>Type</th>
                    <th>Repeat</th>
                    <th>Status</th>
                    <th>Next Run</th>
                    <th>Sent Count</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const ss = STATUS_STYLES[item.status] || { bg: '#F3F4F6', color: '#6B7280' };
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>✉️ {item.subject}</td>
                        <td style={{ fontSize: '0.82rem' }}>{item.recipients?.join(', ')}</td>
                        <td><span className="badge">{item.emailType || 'custom'}</span></td>
                        <td>{item.repeat}</td>
                        <td><span className="badge" style={{ background: ss.bg, color: ss.color }}>{item.status}</span></td>
                        <td style={{ fontSize: '0.82rem' }}>{item.nextRunAt ? new Date(item.nextRunAt).toLocaleString('en-IN') : '—'}</td>
                        <td style={{ fontWeight: 600 }}>{item.sentCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
