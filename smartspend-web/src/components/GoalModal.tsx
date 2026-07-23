'use client';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '@/lib/api';
import { Trash2 } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: any;
  onSuccess: () => void;
}

export function GoalModal({ isOpen, onClose, goal, onSuccess }: GoalModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setFormData({
          name: goal.name || '',
          targetAmount: String(goal.targetAmount || ''),
          currentAmount: String(goal.currentAmount || 0),
          deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
          status: goal.status || 'ACTIVE',
        });
      } else {
        setFormData({ name: '', targetAmount: '', currentAmount: '0', deadline: '', status: 'ACTIVE' });
      }
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        targetAmount: Number(formData.targetAmount),
        currentAmount: Number(formData.currentAmount),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };
      if (goal) {
        await api.patch(`/goals/${goal.id}`, payload);
      } else {
        await api.post('/goals', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this goal?')) return;
    setLoading(true);
    try {
      await api.delete(`/goals/${goal.id}`);
      onSuccess();
      onClose();
    } catch {
      alert('Failed to delete goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal ? 'Edit Goal' : 'New Goal'} width="400px">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Goal Name</label>
          <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dream Vacation" />
        </div>
        <div className="input-group">
          <label className="input-label">Target Amount</label>
          <input required type="number" step="0.01" min="1" className="input-field" value={formData.targetAmount} onChange={e => setFormData({ ...formData, targetAmount: e.target.value })} placeholder="0.00" />
        </div>
        <div className="input-group">
          <label className="input-label">Current Saved Amount</label>
          <input required type="number" step="0.01" min="0" className="input-field" value={formData.currentAmount} onChange={e => setFormData({ ...formData, currentAmount: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Deadline (Optional)</label>
          <input type="date" className="input-field" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
        </div>
        <div className="input-group">
          <label className="input-label">Status</label>
          <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: goal ? 'space-between' : 'flex-end' }}>
          {goal && (
            <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleDelete} disabled={loading}>
              <Trash2 size={15} /> Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Goal'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
