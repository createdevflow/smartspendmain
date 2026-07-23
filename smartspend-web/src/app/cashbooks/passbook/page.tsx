'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, BookOpen } from 'lucide-react';
import Link from 'next/link';

function PassbookContent() {
  const { user } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cashbookId = searchParams?.get('cashbookId');
  const currency = user?.currency || 'INR';

  const [cashbook, setCashbook] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cashbookId) {
      router.push('/cashbooks');
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cbRes, txsRes] = await Promise.all([
          api.get(`/cashbooks/${cashbookId}`),
          api.get(`/transactions?cashbookId=${cashbookId}&limit=100`)
        ]);
        setCashbook(cbRes.data?.data);
        setTransactions(txsRes.data?.data?.data || txsRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cashbookId, router]);

  let currentBal = 0;
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const txsWithBalance = sortedTxs.map(tx => {
    if (tx.type === 'INCOME') {
      currentBal += Number(tx.amount);
    } else {
      currentBal -= Number(tx.amount);
    }
    return { ...tx, runningBalance: currentBal };
  }).reverse();

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar
          title="Passbook"
          subtitle={cashbook ? `Running balance for ${cashbook.name}` : 'Loading...'}
          action={
            <Link href="/cashbooks" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <ChevronLeft size={15} /> Back to Cashbooks
            </Link>
          }
        />

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading passbook data...</div>
        ) : !cashbook ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Cashbook not found.</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={24} color="white" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{cashbook.name}</h2>
                  <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{cashbook.description || 'Passbook timeline'}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="card-label" style={{ marginBottom: '0.25rem' }}>Current Balance</p>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: Number(cashbook.balance) >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                  {fmt(Number(cashbook.balance || 0), currency)}
                </h2>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Details</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Withdrawal</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Deposit</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {txsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>No transactions found for this cashbook.</td>
                    </tr>
                  ) : (
                    txsWithBalance.map((tx, i) => (
                      <tr key={tx.id} style={{ borderBottom: i < txsWithBalance.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}>
                        <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {fmtDate(tx.date || tx.createdAt)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--text-sm)' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.title}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{tx.category}</div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 500, color: 'var(--danger)' }}>
                          {tx.type === 'EXPENSE' ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              {fmt(Number(tx.amount), currency)} <ArrowDownRight size={14} />
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 500, color: 'var(--success)' }}>
                          {tx.type === 'INCOME' ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              {fmt(Number(tx.amount), currency)} <ArrowUpRight size={14} />
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {fmt(tx.runningBalance, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function PassbookPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <PassbookContent />
    </Suspense>
  );
}
