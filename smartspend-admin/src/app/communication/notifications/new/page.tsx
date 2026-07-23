'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import {
  Bell, Send, Clock, ChevronLeft, Upload, Users, Smartphone,
  Globe, Crown, Gift, AlertTriangle, Info, Megaphone,
} from 'lucide-react';

const NOTIF_TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Announcement', icon: '📢' },
  { value: 'FEATURE_UPDATE', label: 'Feature Update', icon: '✨' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
  { value: 'SECURITY', label: 'Security Alert', icon: '🔒' },
  { value: 'OFFER', label: 'Offer', icon: '🎁' },
  { value: 'PROMOTIONAL', label: 'Promotional', icon: '📣' },
  { value: 'REMINDER', label: 'Reminder', icon: '⏰' },
  { value: 'INFO', label: 'Information', icon: 'ℹ️' },
];

const AUDIENCES = [
  { value: 'ALL', label: 'All Users', icon: <Globe size={16} />, desc: 'Send to every registered user' },
  { value: 'FREE_USERS', label: 'Free Users', icon: <Users size={16} />, desc: 'Users on the free plan' },
  { value: 'PREMIUM_USERS', label: 'Premium Users', icon: <Crown size={16} />, desc: 'Users on paid plans' },
  { value: 'ANDROID', label: 'Android Users', icon: <Smartphone size={16} />, desc: 'Only Android devices' },
  { value: 'IOS', label: 'iOS Users', icon: <Smartphone size={16} />, desc: 'Only iOS devices' },
  { value: 'SELECTED', label: 'Selected Users', icon: <Users size={16} />, desc: 'Specific user IDs' },
];

export default function NewNotificationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    body: '',
    bannerImage: '',
    buttonText: '',
    actionUrl: '',
    notifType: 'ANNOUNCEMENT',
    audience: 'ALL',
    selectedUserIds: '',
    channelInApp: true,
    channelPush: true,
    scheduledAt: '',
    sendNow: false,
  });

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const saveAndSend = async (immediate: boolean) => {
    if (!form.title || !form.body) {
      alert('Title and body are required');
      return;
    }
    if (immediate) setSending(true); else setSaving(true);
    try {
      const dto: any = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        body: form.body,
        bannerImage: form.bannerImage || undefined,
        buttonText: form.buttonText || undefined,
        actionUrl: form.actionUrl || undefined,
        notifType: form.notifType,
        audience: form.audience,
        channelInApp: form.channelInApp,
        channelPush: form.channelPush,
        scheduledAt: form.scheduledAt || undefined,
        selectedUserIds: form.audience === 'SELECTED'
          ? form.selectedUserIds.split('\n').map((s: string) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await api.post('/communication/admin/notifications', dto);
      const id = res.data?.id || res.data?.data?.id;

      if (immediate && id) {
        await api.post(`/communication/admin/notifications/${id}/send`);
        alert('Notification sent successfully!');
      } else {
        alert('Notification saved!');
      }
      router.push('/communication');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save notification');
    } finally {
      setSaving(false);
      setSending(false);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => router.back()}>
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">New Notification</h1>
              <p className="page-subtitle">Compose and schedule a notification for your users</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => saveAndSend(false)} disabled={saving || sending}>
              {saving ? 'Saving…' : <><Clock size={16} /> Save as Draft</>}
            </button>
            <button className="btn btn-primary" onClick={() => saveAndSend(true)} disabled={saving || sending}>
              {sending ? 'Sending…' : <><Send size={16} /> Send Now</>}
            </button>
          </div>
        </div>

        <div className="responsive-form-grid">
          {/* Main Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Content */}
            <div className="card">
              <div className="card-header">
                <h2 className="section-heading">Content</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input className="input-field" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g., New Feature Available! 🎉" />
                </div>
                <div className="input-group">
                  <label className="input-label">Subtitle</label>
                  <input className="input-field" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Optional short description" />
                </div>
                <div className="input-group">
                  <label className="input-label">Message Body *</label>
                  <textarea className="input-field" rows={5} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Write your notification message here…" style={{ resize: 'vertical' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Banner Image URL</label>
                  <input className="input-field" value={form.bannerImage} onChange={(e) => set('bannerImage', e.target.value)} placeholder="https://…" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="input-group">
                    <label className="input-label">Action Button Text</label>
                    <input className="input-field" value={form.buttonText} onChange={(e) => set('buttonText', e.target.value)} placeholder="e.g., Learn More" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Deep Link / Action URL</label>
                    <input className="input-field" value={form.actionUrl} onChange={(e) => set('actionUrl', e.target.value)} placeholder="cashtro://goals or https://…" />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Type */}
            <div className="card">
              <div className="card-header"><h2 className="section-heading" style={{marginBottom: 0}}>Notification Type</h2></div>
              <div className="responsive-grid-4" style={{ marginTop: 'var(--space-4)', gap: '0.75rem' }}>
                {NOTIF_TYPES.map((t) => (
                  <button key={t.value} onClick={() => set('notifType', t.value)}
                    style={{
                      padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `2px solid ${form.notifType === t.value ? 'var(--accent-primary)' : 'var(--border)'}`,
                      background: form.notifType === t.value ? 'var(--accent-light)' : 'transparent',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{t.icon}</div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: form.notifType === t.value ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className="card">
              <div className="card-header"><h2 className="section-heading" style={{marginBottom: 0}}>Audience</h2></div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {AUDIENCES.map((a) => (
                  <label key={a.value} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)', border: `2px solid ${form.audience === a.value ? 'var(--accent-primary)' : 'var(--border)'}`,
                    background: form.audience === a.value ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="audience" value={a.value} checked={form.audience === a.value} onChange={() => set('audience', a.value)} style={{ display: 'none' }} />
                    <div style={{ color: form.audience === a.value ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{a.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{a.label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{a.desc}</div>
                    </div>
                  </label>
                ))}
                {form.audience === 'SELECTED' && (
                  <textarea className="input-field" rows={4} value={form.selectedUserIds}
                    onChange={(e) => set('selectedUserIds', e.target.value)}
                    placeholder="Enter user IDs, one per line"
                    style={{ marginTop: '0.5rem', resize: 'vertical' }} />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Delivery Channels */}
            <div className="card">
              <div className="card-header"><h2 className="section-heading" style={{marginBottom: 0}}>Delivery Channels</h2></div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { key: 'channelInApp', label: 'In-App Notification', desc: 'Appears in the notification inbox' },
                  { key: 'channelPush', label: 'Push Notification', desc: 'Native device push alert' },
                ].map((ch) => (
                  <label key={ch.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={(form as any)[ch.key]} onChange={(e) => set(ch.key, e.target.checked)} style={{ marginTop: '2px' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{ch.label}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{ch.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="card">
              <div className="card-header"><h2 className="section-heading" style={{marginBottom: 0}}>Schedule</h2></div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Send Date & Time</label>
                  <input className="input-field" type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
                  <p className="caption-text" style={{ marginTop: '4px' }}>Leave empty to use "Send Now"</p>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <Bell size={16} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Preview</span>
                </div>
                {form.bannerImage && (
                  <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', height: '100px', background: '#fff2' }}>
                    <img src={form.bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginBottom: '4px' }}>
                  {form.title || 'Your Title Here'}
                </div>
                {form.subtitle && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>{form.subtitle}</div>}
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {form.body || 'Your message body will appear here…'}
                </div>
                {form.buttonText && (
                  <button style={{ marginTop: '0.75rem', padding: '6px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    {form.buttonText}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
