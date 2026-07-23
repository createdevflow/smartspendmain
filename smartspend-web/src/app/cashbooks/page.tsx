'use client';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { StatCard } from '@/components/StatCard';
import { CashbookModal } from '@/components/CashbookModal';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { BookOpen, Users, Plus, Settings, ChevronRight, Share2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CashbooksPage() {
  const router = useRouter();
  const { user, activeCashbookId, setActiveCashbookId } = useApp();
  const currency = user?.currency || 'INR';
  const [cashbooks, setCashbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCashbook, setSelectedCashbook] = useState<any>(null);

  const fetchCashbooks = () => {
    api.get('/cashbooks').then(r => setCashbooks(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCashbooks();
  }, []);

  const handleOpenModal = (cb?: any) => {
    setSelectedCashbook(cb || null);
    setModalOpen(true);
  };

  const totalBalance = cashbooks.reduce((a, c) => a + Number(c.balance || 0), 0);
  const sharedCount = cashbooks.filter(c => c.memberCount > 1 || c.isShared).length;
  const myCount = cashbooks.length;

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Cashbooks"
          subtitle="Manage your personal and shared ledgers"
          action={
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={15} /> New Cashbook
            </button>
          }
        />

        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <StatCard title="Total Balance" value={fmt(totalBalance, currency)} icon={Wallet} iconBg="#EFF6FF" iconColor="var(--accent-primary)" loading={loading} />
          <StatCard title="My Cashbooks" value={String(myCount)} icon={BookOpen} iconBg="#F5F3FF" iconColor="#7C3AED" loading={loading} />
          <StatCard title="Shared Ledgers" value={String(sharedCount)} icon={Share2} iconBg="#ECFDF5" iconColor="var(--success)" loading={loading} />
          <StatCard title="Members Across All" value={String(cashbooks.reduce((a, c) => a + (c.memberCount || 1), 0))} icon={Users} loading={loading} />
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="card" style={{ height: '180px', background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : cashbooks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📒</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No cashbooks yet</h3>
            <p style={{ marginBottom: '1.5rem' }}>Create your first cashbook to start tracking finances.</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}><Plus size={15} /> Create Cashbook</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {cashbooks.map((cb: any) => {
              const isShared = cb.memberCount > 1 || cb.isShared;
              const myRole = cb.memberRole || 'OWNER';
              const isActive = activeCashbookId === cb.id;
              return (
                <div key={cb.id} className="card" style={{ transition: 'var(--transition)', position: 'relative', border: isActive ? '2px solid var(--accent-primary)' : undefined }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={20} color="white" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>{cb.name}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          {isShared ? `Shared · ${cb.memberCount || 2} members` : 'Personal'}
                          {myRole !== 'OWNER' ? ` · ${myRole}` : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {isActive && <span className="badge" style={{ background: 'var(--accent-primary)', color: 'white' }}>Active</span>}
                      {isShared && <span className="badge badge-info"><Share2 size={10} style={{ marginRight: '3px' }} />Shared</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <p className="card-label" style={{ marginBottom: '0.25rem' }}>Balance</p>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: Number(cb.balance) >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                      {fmt(Number(cb.balance || 0), currency)}
                    </h2>
                  </div>

                  <div style={{ display: 'flex', gap: '0.625rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <button 
                      className={`btn ${isActive ? 'btn-ghost' : 'btn-secondary'}`} 
                      style={{ flex: 1, height: '34px', fontSize: 'var(--text-xs)' }}
                      onClick={() => isActive ? setActiveCashbookId(null) : setActiveCashbookId(cb.id)}
                    >
                      {isActive ? 'Deactivate' : 'Set as Active'}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '0 0.5rem', height: '34px' }} onClick={() => router.push(`/transactions?cashbookId=${cb.id}`)}>
                      Transactions
                    </button>
                    {(myRole === 'OWNER' || myRole === 'ADMIN') && (
                      <button className="btn btn-ghost" style={{ padding: '0 0.5rem', height: '34px' }} onClick={(e) => { e.stopPropagation(); handleOpenModal(cb); }}>
                        <Settings size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <CashbookModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} cashbook={selectedCashbook} onSuccess={fetchCashbooks} />
      </main>
    </>
  );
}
