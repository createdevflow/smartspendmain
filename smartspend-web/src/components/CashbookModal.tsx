'use client';
import { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { useApp } from '@/lib/AppContext';
import { api } from '@/lib/api';
import { Trash2, UserPlus, Settings, Users } from 'lucide-react';

interface CashbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashbook?: any;
  onSuccess: () => void;
}

export function CashbookModal({ isOpen, onClose, cashbook, onSuccess }: CashbookModalProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'details' | 'members'>('details');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberId, setNewMemberId] = useState('');

  const fetchMembers = useCallback(async () => {
    if (!cashbook?.id) return;
    try {
      const res = await api.get(`/cashbooks/${cashbook.id}/members`);
      const d = res.data?.data || res.data;
      setMembers(Array.isArray(d) ? d : (d?.data && Array.isArray(d.data) ? d.data : []));
    } catch (err) {
      console.error(err);
    }
  }, [cashbook?.id]);

  useEffect(() => {
    if (isOpen) {
      setTab('details');
      if (cashbook) {
        setFormData({ name: cashbook.name, description: cashbook.description || '' });
        fetchMembers();
      } else {
        setFormData({ name: '', description: '' });
        setMembers([]);
      }
    }
  }, [isOpen, cashbook, fetchMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      if (cashbook) {
        await api.patch(`/cashbooks/${cashbook.id}`, formData);
      } else {
        await api.post('/cashbooks', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save cashbook');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId || !cashbook?.id) return;
    setLoading(true);
    try {
      const isEmail = newMemberId.includes('@');
      const payload = isEmail ? { email: newMemberId, role: 'VIEWER' } : { userId: newMemberId, role: 'VIEWER' };
      await api.post(`/cashbooks/${cashbook.id}/members`, payload);
      setNewMemberId('');
      fetchMembers();
      onSuccess(); // Update list count
      alert('Invite sent successfully!');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/cashbooks/${cashbook.id}/members/${memberId}`);
      fetchMembers();
      onSuccess();
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const handleDeleteCashbook = async () => {
    if (!confirm('Are you sure you want to delete this cashbook? This action cannot be undone.')) return;
    setLoading(true);
    try {
      await api.delete(`/cashbooks/${cashbook.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      alert('Failed to delete cashbook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cashbook ? 'Manage Cashbook' : 'New Cashbook'} width="500px">
      {cashbook && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setTab('details')}
            style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: 'var(--text-sm)', color: tab === 'details' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Settings size={15} /> Details
          </button>
          <button
            onClick={() => setTab('members')}
            style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: 'var(--text-sm)', color: tab === 'members' ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Users size={15} /> Members
          </button>
        </div>
      )}

      {tab === 'details' && (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Name</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Home Expenses"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Description (optional)</label>
            <textarea
              className="input-field"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this cashbook for?"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: cashbook ? 'space-between' : 'flex-end' }}>
            {cashbook && (
              <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleDeleteCashbook} disabled={loading}>
                <Trash2 size={15} /> Delete
              </button>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Cashbook'}
              </button>
            </div>
          </div>
        </form>
      )}

      {tab === 'members' && cashbook && (
        <div>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Your User ID to receive invites:</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: 'var(--text-sm)', fontWeight: 600, userSelect: 'all' }}>{user?.id}</p>
          </div>

          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              required
              placeholder="User ID or Email to invite"
              className="input-field"
              style={{ flex: 1, margin: 0 }}
              value={newMemberId}
              onChange={e => setNewMemberId(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary" disabled={loading}>
              <UserPlus size={15} /> Add
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Members</h4>
            {(!Array.isArray(members) || members.length === 0) ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>No members found.</p>
            ) : (
              members.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)' }}>{m.user?.fullName || m.user?.email || 'Unknown User'}</p>
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{m.role}</p>
                  </div>
                  {m.role !== 'OWNER' && m.user?.id !== user?.id && (
                    <button className="btn btn-ghost" style={{ padding: '0.375rem', color: 'var(--danger)' }} onClick={() => handleRemoveMember(m.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
