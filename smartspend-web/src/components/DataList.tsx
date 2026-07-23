'use client';
import { useState, useEffect } from 'react';
import { getCatMeta, fmt, fmtDate } from '@/lib/utils';
import { MoreVertical, Edit2, Clock, Share2, Trash2 } from 'lucide-react';

interface Tx {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  merchant?: string;
  notes?: string;
  date: string;
  paymentMethod?: string;
  category?: any;
}

interface DataListProps {
  data: Tx[];
  currency?: string;
  loading?: boolean;
  onEdit?: (tx: Tx) => void;
  onDelete?: (id: string) => void;
  onSchedule?: (tx: Tx) => void;
  onShare?: (tx: Tx) => void;
  emptyMessage?: string;
}

export function DataList({ data, currency = 'INR', loading, onEdit, onDelete, onSchedule, onShare, emptyMessage = 'No transactions found.' }: DataListProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-hover)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '0.875rem', width: '40%', background: 'var(--bg-hover)', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div style={{ height: '0.75rem', width: '25%', background: 'var(--bg-hover)', borderRadius: '4px' }} />
            </div>
            <div style={{ height: '1rem', width: '80px', background: 'var(--bg-hover)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.875rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction</th>
            <th style={{ padding: '0.875rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
            <th style={{ padding: '0.875rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Method</th>
            <th style={{ padding: '0.875rem 1.5rem', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '0.875rem 1rem' }} />
          </tr>
        </thead>
        <tbody>
          {data.map((tx, i) => {
            const cat = tx.category || getCatMeta(tx.merchant || '');
            const bg = cat.bg || (cat.color ? `${cat.color}22` : '#F3F4F6');
            const emoji = cat.emoji || '💳';
            const isIn = tx.type === 'INCOME';

            const menuItemStyle = {
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
              padding: '0.5rem 0.75rem', border: 'none', background: 'transparent',
              fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer',
              textAlign: 'left' as const, borderRadius: '4px',
            };

            return (
              <tr key={tx.id || i} style={{ borderBottom: i < data.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '0.875rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                      {emoji}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', margin: 0 }}>{tx.merchant || cat.name || (isIn ? 'Income' : 'Expense')}</p>
                      {tx.notes && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0, marginTop: '2px' }}>{tx.notes}</p>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{fmtDate(tx.date)}</td>
                <td style={{ padding: '0.875rem 1.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{tx.paymentMethod || '—'}</td>
                <td style={{ padding: '0.875rem 1.5rem', textAlign: 'right', fontWeight: 700, fontSize: 'var(--text-sm)', color: isIn ? 'var(--success)' : 'var(--danger)' }}>
                  {isIn ? '+' : '−'}{fmt(Number(tx.amount), currency).replace(/^[+−]?[^\d]*/, '')}
                </td>
                
                {/* Actions Menu */}
                <td style={{ padding: '0.875rem 1rem', textAlign: 'right', position: 'relative' }}>
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.375rem' }} 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === tx.id ? null : tx.id); }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {activeMenu === tx.id && (
                    <div 
                      style={{
                        position: 'absolute', right: '3rem', top: '50%', transform: 'translateY(-50%)',
                        backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: '8px', boxShadow: 'var(--shadow-md)', zIndex: 10,
                        display: 'flex', flexDirection: 'column', padding: '0.25rem', width: '130px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <button style={menuItemStyle} onClick={() => { onEdit(tx); setActiveMenu(null); }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Edit2 size={14}/> Edit
                        </button>
                      )}
                      {onSchedule && (
                        <button style={menuItemStyle} onClick={() => { onSchedule(tx); setActiveMenu(null); }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Clock size={14}/> Schedule
                        </button>
                      )}
                      {onShare && (
                        <button style={menuItemStyle} onClick={() => { onShare(tx); setActiveMenu(null); }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Share2 size={14}/> Share
                        </button>
                      )}
                      {onDelete && (
                        <button style={{ ...menuItemStyle, color: 'var(--danger)' }} onClick={() => { onDelete(tx.id); setActiveMenu(null); }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--danger-bg)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <Trash2 size={14}/> Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
