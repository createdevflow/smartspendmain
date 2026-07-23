'use client';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '@/lib/api';
import { Trash2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: any;
  onSuccess: () => void;
}

export function SubscriptionModal({ isOpen, onClose, subscription, onSuccess }: SubscriptionModalProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [cashbooks, setCashbooks] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    merchant: '',
    category: 'Bills',
    amount: '',
    cycle: 'MONTHLY',
    nextDate: new Date().toISOString().split('T')[0],
    cashbookId: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/cashbooks').then(res => {
        const cbs = res.data?.data || [];
        setCashbooks(cbs);
        if (!subscription && cbs.length > 0 && !formData.cashbookId) {
          setFormData(prev => ({ ...prev, cashbookId: cbs[0].id }));
        }
      }).catch(() => {});

      if (subscription) {
        setFormData({
          merchant: subscription.merchant || subscription.name || '',
          category: subscription.category || 'Bills',
          amount: String(subscription.amount || ''),
          cycle: subscription.cycle || 'MONTHLY',
          nextDate: subscription.nextDate ? new Date(subscription.nextDate).toISOString().split('T')[0] : '',
          cashbookId: subscription.cashbookId || '',
          status: subscription.status || 'ACTIVE'
        });
      } else {
        setFormData({
          merchant: '',
          category: 'Bills',
          amount: '',
          cycle: 'MONTHLY',
          nextDate: new Date().toISOString().split('T')[0],
          cashbookId: formData.cashbookId,
          status: 'ACTIVE'
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount || !formData.cashbookId) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        type: 'EXPENSE',
        name: formData.merchant
      };

      if (subscription) {
        await api.patch(`/transactions/scheduled/${subscription.id}`, payload);
      } else {
        await api.post('/transactions/scheduled', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to save subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this subscription?')) return;
    setLoading(true);
    try {
      await api.delete(`/transactions/scheduled/${subscription.id}`);
      onSuccess();
      onClose();
    } catch {
      alert('Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={subscription ? 'Edit Subscription' : 'New Subscription'} width="450px">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Merchant / Bill Name</label>
          <input required type="text" className="input-field" value={formData.merchant} onChange={e => setFormData({ ...formData, merchant: e.target.value })} placeholder="e.g. Netflix, Rent" />
        </div>
        <div className="input-group">
          <label className="input-label">Amount</label>
          <input required type="number" step="0.01" min="0" className="input-field" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
        </div>
        <div className="input-group">
          <label className="input-label">Cashbook</label>
          <select required className="input-field" value={formData.cashbookId} onChange={e => setFormData({ ...formData, cashbookId: e.target.value })}>
            <option value="" disabled>Select a cashbook</option>
            {cashbooks.map(cb => <option key={cb.id} value={cb.id}>{cb.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {['Bills', 'Entertainment', 'Health', 'Rent', 'Education', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Cycle</label>
            <select className="input-field" value={formData.cycle} onChange={e => setFormData({ ...formData, cycle: e.target.value })}>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Next Billing Date</label>
            <input required type="date" className="input-field" value={formData.nextDate} onChange={e => setFormData({ ...formData, nextDate: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: subscription ? 'space-between' : 'flex-end' }}>
          {subscription && (
            <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleDelete} disabled={loading}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
