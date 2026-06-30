'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { BarChart3, RefreshCw, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';

export default function DeliveryLogsAdminPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Fetch stats or notifications logs
      const res = await api.get('/communication/admin/notifications?limit=50');
      const items = res.data?.items || res.data?.data?.items || [];
      setLogs(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
              <h1 className="page-title">Delivery Logs</h1>
              <p className="page-subtitle">Track delivery history and performance across campaigns</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={16} /></button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />Loading logs…
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <BarChart3 size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No delivery records yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Campaign / Event</th>
                    <th>Type</th>
                    <th>Audience</th>
                    <th>Delivered Count</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td><span className="badge">{item.notifType}</span></td>
                      <td>{item.audience}</td>
                      <td style={{ fontWeight: 700, color: item.sentCount > 0 ? '#059669' : 'var(--text-muted)' }}>
                        {item.sentCount > 0 ? `✓ ${item.sentCount} delivered` : '0'}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(item.createdAt).toLocaleString('en-IN')}</td>
                      <td><span className="badge" style={{ background: item.status === 'SENT' ? '#D1FAE5' : '#F3F4F6', color: item.status === 'SENT' ? '#059669' : '#6B7280' }}>{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
