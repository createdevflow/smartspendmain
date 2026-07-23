'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import { X, Calendar, Image as ImageIcon, Camera, Trash2, DollarSign, Smartphone, CreditCard, Archive, Shield } from 'lucide-react';
import Image from 'next/image';

const INCOME_CATS = [
  { label: 'Salary', emoji: '💼', color: '#16A34A', bg: '#DCFCE7' },
  { label: 'Bonus', emoji: '🏆', color: '#CA8A04', bg: '#FEF9C3' },
  { label: 'Gift', emoji: '🎁', color: '#F26D21', bg: '#FFF7ED' },
  { label: 'Refund', emoji: '↩️', color: '#2563EB', bg: '#DBEAFE' },
  { label: 'Investment', emoji: '📈', color: '#0F766E', bg: '#CCFBF1' },
  { label: 'Freelance', emoji: '💻', color: '#0369A1', bg: '#E0F2FE' },
  { label: 'Other', emoji: '💰', color: '#4B5563', bg: '#F3F4F6' },
];

const EXPENSE_CATS = [
  { label: 'Food', emoji: '🍔', color: '#EA580C', bg: '#FFEDD5' },
  { label: 'Transport', emoji: '🚇', color: '#0369A1', bg: '#E0F2FE' },
  { label: 'Shopping', emoji: '🛍️', color: '#A21CAF', bg: '#FAE8FF' },
  { label: 'Bills', emoji: '⚡', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Health', emoji: '💊', color: '#BE123C', bg: '#FFE4E6' },
  { label: 'Rent', emoji: '🏠', color: '#2D8CFF', bg: '#E0E7FF' },
  { label: 'Groceries', emoji: '🛒', color: '#15803D', bg: '#DCFCE7' },
  { label: 'Dining', emoji: '🍽️', color: '#DB2777', bg: '#FCE7F3' },
  { label: 'Entertainment', emoji: '🎬', color: '#B45309', bg: '#FEF3C7' },
  { label: 'Education', emoji: '📚', color: '#1D4ED8', bg: '#DBEAFE' },
  { label: 'Travel', emoji: '✈️', color: '#0891B2', bg: '#CFFAFE' },
  { label: 'Other', emoji: '📌', color: '#4B5563', bg: '#F3F4F6' },
];

const PAYMENT_METHODS = [
  { label: 'UPI', icon: Smartphone },
  { label: 'Bank Transfer', icon: CreditCard },
  { label: 'Cash', icon: DollarSign },
  { label: 'Card', icon: CreditCard },
  { label: 'Wallet', icon: Archive },
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
  onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, transaction, onSuccess }: TransactionModalProps) {
  const { user, activeCashbookId } = useApp();
  const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', JPY: '¥' };
  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || user?.currency || '₹';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    amount: '',
    title: '',
    categoryId: '',
    cashbookId: activeCashbookId || '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    notes: '',
  });

  const [cashbooks, setCashbooks] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      api.get('/cashbooks').then(res => {
        const cbs = res.data?.data || [];
        setCashbooks(cbs);
        if (cbs.length > 0 && !formData.cashbookId && !activeCashbookId) {
          setFormData(prev => ({ ...prev, cashbookId: cbs[0].id }));
        }
      }).catch(() => {});

      if (transaction) {
        setFormData({
          type: transaction.type,
          amount: String(transaction.amount),
          title: transaction.merchant || transaction.title || '',
          categoryId: transaction.categoryId || transaction.category || '',
          cashbookId: transaction.cashbookId || '',
          date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: transaction.paymentMethod || 'UPI',
          notes: transaction.notes || '',
        });
      } else {
        setFormData(prev => ({
          ...prev,
          type: 'EXPENSE',
          amount: '',
          title: '',
          categoryId: '',
          cashbookId: activeCashbookId || (cashbooks[0]?.id || ''),
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'UPI',
          notes: '',
        }));
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, transaction, activeCashbookId, cashbooks, formData.cashbookId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.categoryId || !formData.cashbookId) {
      alert("Amount, Category and Cashbook are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        amount: Number(formData.amount),
        merchant: formData.title || formData.categoryId,
        category: formData.categoryId,
        cashbookId: formData.cashbookId,
        date: new Date(formData.date).toISOString(),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      if (transaction) {
        await api.patch(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const currentCats = formData.type === 'INCOME' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end',
      backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)'
    }}>
      <div 
        style={{
          width: '100%', maxWidth: '480px', backgroundColor: '#fff', height: '100%',
          display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
          animation: 'drawer-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <form id="tx-form" onSubmit={handleSubmit}>
            
            {/* Type toggle */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: '#F3F4F6', padding: '0.25rem', borderRadius: '12px' }}>
              {['INCOME', 'EXPENSE'].map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setFormData(p => ({ ...p, type: t, categoryId: '' }))}
                  style={{
                    flex: 1, padding: '0.5rem 0', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600,
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    backgroundColor: formData.type === t ? (t === 'INCOME' ? '#DCFCE7' : '#FEE2E2') : 'transparent',
                    color: formData.type === t ? (t === 'INCOME' ? '#16A34A' : '#DC2626') : '#6B7280',
                  }}
                >
                  {t === 'INCOME' ? '↓ Cash In' : '↑ Cash Out'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'center', margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderBottom: `2px solid ${formData.type === 'INCOME' ? '#16A34A' : '#DC2626'}`, paddingBottom: '0.5rem', width: 'fit-content', minWidth: '150px', maxWidth: '100%' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: formData.type === 'INCOME' ? '#16A34A' : '#DC2626' }}>
                  {currencySymbol}
                </span>
                <input
                  type="number" step="0.01" required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  style={{
                    fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', border: 'none',
                    background: 'transparent', outline: 'none', color: formData.type === 'INCOME' ? '#16A34A' : '#DC2626',
                    width: '100%', maxWidth: '250px', textAlign: 'left'
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Cashbook</label>
              <select required className="input-field" value={formData.cashbookId} onChange={e => setFormData({ ...formData, cashbookId: e.target.value })}>
                <option value="" disabled>Select a cashbook</option>
                {cashbooks.map(cb => <option key={cb.id} value={cb.id}>{cb.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Title / Merchant</label>
              <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Morning Coffee" />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                {currentCats.map(cat => {
                  const isSelected = formData.categoryId === cat.label;
                  return (
                    <button
                      key={cat.label} type="button"
                      onClick={() => setFormData(p => ({ ...p, categoryId: cat.label }))}
                      style={{
                        padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid',
                        borderColor: isSelected ? cat.color : '#E5E7EB', backgroundColor: isSelected ? cat.bg : '#F9FAFB',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{cat.emoji}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? cat.color : '#374151' }}>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Payment Method</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon;
                  const isSelected = formData.paymentMethod === pm.label;
                  return (
                    <button
                      key={pm.label} type="button"
                      onClick={() => setFormData(p => ({ ...p, paymentMethod: pm.label }))}
                      style={{
                        padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid',
                        borderColor: isSelected ? '#1D4ED8' : '#E5E7EB', backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} color={isSelected ? '#1D4ED8' : '#6B7280'} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? '#1D4ED8' : '#6B7280' }}>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Date</label>
              <input type="date" required className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Note / Description</label>
              <textarea
                className="input-field" value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add an optional note..." rows={2} style={{ resize: 'vertical' }}
              />
            </div>

          </form>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', backgroundColor: '#fff' }}>
          <button
            type="submit" form="tx-form" disabled={loading}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              backgroundColor: formData.type === 'INCOME' ? '#10B981' : '#EF4444', color: '#fff',
              fontSize: '1rem', fontWeight: 700, letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {loading ? 'SAVING...' : (transaction ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION')}
          </button>
        </div>

        <style>{`
          @keyframes drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
      </div>
    </div>
  );
}
