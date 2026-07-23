'use client';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget?: any;
  onSuccess: () => void;
}

export function BudgetModal({ isOpen, onClose, budget, onSuccess }: BudgetModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Other',
    limit: '',
    period: 'MONTHLY',
  });

  useEffect(() => {
    if (isOpen) {
      if (budget) {
        setFormData({
          name: budget.name || '',
          category: budget.category || 'Other',
          limit: String(budget.limit || budget.amount || ''),
          period: budget.period || 'MONTHLY',
        });
      } else {
        setFormData({ name: '', category: 'Other', limit: '', period: 'MONTHLY' });
      }
    }
  }, [isOpen, budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.limit) return;
    setLoading(true);
    try {
      const payload = { ...formData, limit: Number(formData.limit) };
      if (budget) {
        await api.patch(`/budgets/${budget.id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this budget?')) return;
    setLoading(true);
    try {
      await api.delete(`/budgets/${budget.id}`);
      onSuccess();
      onClose();
    } catch {
      alert('Failed to delete budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget ? 'Edit Budget' : 'New Budget'} width="400px">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Budget Name</label>
          <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Monthly Groceries" />
        </div>
        <div className="input-group">
          <label className="input-label">Category</label>
          <select className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
            {['Salary', 'Bonus', 'Gift', 'Refund', 'Investment', 'Freelance', 'Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Rent', 'Groceries', 'Dining', 'Entertainment', 'Education', 'Travel', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Limit Amount</label>
          <input required type="number" step="0.01" min="0" className="input-field" value={formData.limit} onChange={e => setFormData({ ...formData, limit: e.target.value })} placeholder="0.00" />
        </div>
        <div className="input-group">
          <label className="input-label">Period</label>
          <select className="input-field" value={formData.period} onChange={e => setFormData({ ...formData, period: e.target.value })}>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: budget ? 'space-between' : 'flex-end' }}>
          {budget && (
            <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleDelete} disabled={loading}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Budget'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
