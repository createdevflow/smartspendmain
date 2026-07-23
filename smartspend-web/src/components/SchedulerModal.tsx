'use client';
import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { Mail, MessageCircle, Clock, Calendar } from 'lucide-react';
import { fmt } from '@/lib/utils';

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
  defaultType?: 'email' | 'message';
  onSuccess?: () => void;
}

const REPEAT_OPTIONS = [
  { key: 'ONE_TIME', label: 'One Time' },
  { key: 'DAILY', label: 'Daily' },
  { key: 'WEEKLY', label: 'Weekly' },
  { key: 'MONTHLY', label: 'Monthly' },
];

export function SchedulerModal({ isOpen, onClose, transaction, defaultType = 'email', onSuccess }: SchedulerModalProps) {
  const { user, activeCashbookId } = useApp();
  const [type, setType] = useState(defaultType);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedConvId, setSelectedConvId] = useState('');
  
  // Date time defaults to 1 hour from now
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [repeat, setRepeat] = useState('ONE_TIME');

  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      setDateStr(d.toISOString().split('T')[0]);
      setTimeStr(d.toTimeString().slice(0, 5));
      
      api.get('/chat/conversations')
        .then(res => {
          const payload = res.data?.data || res.data;
          const list = payload?.items || payload || [];
          setConversations(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!transaction) return;
    const currency = user?.currency || 'INR';
    const amount = fmt(Number(transaction.amount || 0), currency);
    const txType = transaction.type === 'INCOME' ? 'Receipt' : 'Invoice';
    const note = transaction.merchant || transaction.title || transaction.notes || 'Transaction';
    
    setSubject(`Cashtro ${txType}: ${note}`);
    setBody(
      `Hi,\n\nPlease find the ${txType.toLowerCase()} details below:\n\n` +
      `Amount: ${amount}\n` +
      `Type: ${transaction.type === 'INCOME' ? 'Income' : 'Expense'}\n` +
      `Note: ${note}\n` +
      `Date: ${new Date(transaction.date || transaction.createdAt).toLocaleDateString()}\n` +
      (transaction.cashbook?.name ? `Cashbook: ${transaction.cashbook.name}\n` : '') +
      `\nSent via Cashtro — Your Smart Finance Manager`
    );
  }, [transaction, user?.currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    try {
      if (type === 'email') {
        const emailList = recipients.split(',').map(e => e.trim()).filter(Boolean);
        if (!emailList.length) throw new Error('Please enter at least one recipient email.');
        if (!subject.trim()) throw new Error('Please enter a subject.');

        await api.post('/communication/emails/schedule', {
          recipients: emailList,
          subject: subject.trim(),
          body: body.trim(),
          emailType: 'invoice',
          scheduledAt,
          repeat,
          metadata: transaction ? { transactionId: transaction.id } : undefined,
        });
        alert('Email scheduled successfully!');
      } else {
        if (!selectedConvId) throw new Error('Please select a conversation.');
        if (!body.trim()) throw new Error('Please enter a message.');

        await api.post('/communication/messages/schedule', {
          conversationId: selectedConvId,
          content: body.trim(),
          messageType: transaction ? 'TRANSACTION' : 'TEXT',
          scheduledAt,
          repeat,
          attachmentData: transaction ? {
            transactionId: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            currency: user?.currency || 'INR',
            category: transaction.category || '',
            date: transaction.date,
            notes: transaction.notes || '',
            cashbookName: transaction.cashbook?.name || ''
          } : undefined,
        });
        alert('Message scheduled successfully!');
      }
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      alert(err?.message || err?.response?.data?.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Message" width="500px">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
        <button
          type="button"
          onClick={() => setType('email')}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: type === 'email' ? 'var(--accent-primary)' : 'transparent', color: type === 'email' ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <Mail size={16} /> Via Email
        </button>
        <button
          type="button"
          onClick={() => setType('message')}
          disabled={conversations.length === 0}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: type === 'message' ? 'var(--accent-primary)' : 'transparent', color: type === 'message' ? '#fff' : (conversations.length === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)'), fontWeight: 600, cursor: conversations.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
        >
          <MessageCircle size={16} /> Via Chat {conversations.length === 0 && '(No chats)'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {type === 'email' ? (
          <>
            <div className="input-group">
              <label className="input-label">Recipients</label>
              <input type="text" required className="input-field" placeholder="email@example.com, other@test.com" value={recipients} onChange={e => setRecipients(e.target.value)} />
              <p style={{ margin: '0.25rem 0 0', fontSize: '11px', color: 'var(--text-tertiary)' }}>Separate multiple emails with commas</p>
            </div>
            <div className="input-group">
              <label className="input-label">Subject</label>
              <input type="text" required className="input-field" placeholder="Email subject" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="input-group">
            <label className="input-label">Select Conversation</label>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
              {conversations.map(c => (
                <button
                  key={c.id} type="button"
                  onClick={() => setSelectedConvId(c.id)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid', borderColor: selectedConvId === c.id ? 'var(--accent-primary)' : 'var(--border)', background: selectedConvId === c.id ? 'var(--accent-primary-light)' : 'var(--bg-surface)', color: selectedConvId === c.id ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {c.name || c.title || 'Chat'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Message Body</label>
          <textarea required className="input-field" placeholder="Enter your message..." rows={6} value={body} onChange={e => setBody(e.target.value)} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Date</label>
            <div style={{ position: 'relative' }}>
              <input type="date" required className="input-field" value={dateStr} onChange={e => setDateStr(e.target.value)} />
            </div>
          </div>
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="input-label">Time</label>
            <div style={{ position: 'relative' }}>
              <input type="time" required className="input-field" value={timeStr} onChange={e => setTimeStr(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Repeat</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {REPEAT_OPTIONS.map(r => (
              <button
                key={r.key} type="button"
                onClick={() => setRepeat(r.key)}
                style={{ padding: '0.5rem 1rem', borderRadius: '99px', border: '1px solid', borderColor: repeat === r.key ? 'var(--accent-primary)' : 'var(--border)', background: repeat === r.key ? 'var(--accent-primary-light)' : 'var(--bg-surface)', color: repeat === r.key ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: '#EFF6FF', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', alignItems: 'center' }}>
          <Clock size={16} color="#2563EB" />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#1D4ED8' }}>
            {repeat === 'ONE_TIME' ? 'Will be sent once on ' : `Will repeat ${repeat.toLowerCase()} starting `}
            {new Date(`${dateStr}T${timeStr}:00`).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</button>
        </div>
      </form>
    </Modal>
  );
}
