'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Save, Shield, Bell, Database, Globe, RefreshCw, CheckCircle, Zap, AlertTriangle, Lock, Users } from 'lucide-react';

// ── All 18 feature toggles + legacy flags ─────────────────────────────────────
const FEATURE_TOGGLES = [
  {
    group: 'Core Features',
    items: [
      { key: 'feature_transactions', label: 'Transactions', desc: 'Allow users to create, edit, and delete transactions.' },
      { key: 'feature_cashbooks', label: 'Cashbooks', desc: 'Allow users to create and manage cashbooks.' },
      { key: 'feature_categories', label: 'Categories', desc: 'Allow users to manage income/expense categories.' },
      { key: 'feature_analytics', label: 'Analytics', desc: 'Show charts, trends, and spending analytics.' },
      { key: 'feature_reports', label: 'Reports', desc: 'Enable passbook and financial reports.' },
      { key: 'feature_notifications', label: 'Notifications', desc: 'Send in-app and push notifications.' },
    ],
  },
  {
    group: 'Financial Tools',
    items: [
      { key: 'feature_budget_management', label: 'Budget Management', desc: 'Allow users to create and track budgets.' },
      { key: 'feature_savings_goals', label: 'Savings Goals', desc: 'Allow users to set and track savings goals.' },
      { key: 'feature_export', label: 'Export Features', desc: 'Allow CSV/PDF export of transactions and reports.' },
      { key: 'feature_import', label: 'Import Features', desc: 'Allow bulk import of transactions.' },
    ],
  },
  {
    group: 'Account & Security',
    items: [
      { key: 'feature_user_registration', label: 'User Registration', desc: 'Allow new users to register. Disable to close registration.' },
      { key: 'feature_profile_editing', label: 'Profile Editing', desc: 'Allow users to edit their profile information.' },
      { key: 'feature_account_deletion', label: 'Account Deletion', desc: 'Allow users to delete their own accounts.' },
      { key: 'feature_multi_device_sync', label: 'Multi-Device Sync', desc: 'Enable real-time sync across multiple devices.' },
      { key: 'feature_backup_restore', label: 'Backup & Restore', desc: 'Enable data backup and restore functionality.' },
    ],
  },
  {
    group: 'Platform Control',
    items: [
      { key: 'feature_app_updates', label: 'App Updates', desc: 'Show update prompts when new app version is available.' },
      { key: 'feature_beta', label: 'Beta Features', desc: 'Enable experimental beta features for all users.' },
    ],
  },
  {
    group: 'Special Features',
    items: [
      { key: 'feature_shared_cashbooks_active', label: 'Shared Cashbooks', desc: 'Allow users to invite others to their cashbooks.' },
      { key: 'feature_tax_export_active', label: 'Tax Export', desc: 'Allow one-click export for tax season deductibles.' },
      { key: 'feature_panic_button_active', label: 'Shake to Lock (Panic Button)', desc: 'Allow shake gesture to enter private mode.' },
      { key: 'feature_ocr_active', label: 'AI Receipt Scanner', desc: 'Enable OCR receipt scanning via camera.' },
      { key: 'feature_gamification_active', label: 'Gamification', desc: 'Enable streaks, burn-rate alerts, and achievements.' },
      { key: 'feature_gallery', label: 'Gallery Attachments', desc: 'Allow attaching images to entries.' },
    ],
  },
];

const DEFAULT_SETTINGS = {
  appName: 'SmartSpend',
  supportEmail: 'support@smartspend.app',
  defaultPlanSlug: 'free',
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  otpExpiryMinutes: 10,
  sessionDurationDays: 30,
  enablePublicRegistration: true,
  requireEmailVerification: true,
  smtpHost: '',
  smtpPort: 587,
  smtpUser: '',
  smtpSender: '',
  budgetAlertEnabled: true,
  weeklyDigestEnabled: false,
  // Feature toggles
  maintenance_mode: false,
  feature_transactions: true,
  feature_cashbooks: true,
  feature_categories: true,
  feature_analytics: true,
  feature_reports: true,
  feature_notifications: true,
  feature_budget_management: true,
  feature_savings_goals: true,
  feature_multi_device_sync: true,
  feature_backup_restore: true,
  feature_export: true,
  feature_import: true,
  feature_user_registration: true,
  feature_profile_editing: true,
  feature_account_deletion: true,
  feature_app_updates: true,
  feature_beta: false,
  feature_whatsapp_active: false,
  feature_ocr_active: false,
  feature_gamification_active: false,
  feature_shared_cashbooks_active: false,
  feature_tax_export_active: true,
  feature_panic_button_active: true,
  feature_gallery: true,
};

type TabId = 'general' | 'features' | 'security' | 'notifications' | 'maintenance';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, plansRes, settingsRes, configRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/plans'),
          api.get('/admin/settings'),
          api.get('/admin/app-config'),
        ]);
        setMetrics(dashRes.data?.data?.metrics);
        setPlans(plansRes.data?.data || []);

        const mappedSettings: any = { ...DEFAULT_SETTINGS };

        // Parse system settings
        if (settingsRes.data?.data) {
          settingsRes.data.data.forEach((s: any) => {
            if (s.value === 'true') mappedSettings[s.key] = true;
            else if (s.value === 'false') mappedSettings[s.key] = false;
            else if (!isNaN(Number(s.value)) && s.value !== '') mappedSettings[s.key] = Number(s.value);
            else mappedSettings[s.key] = s.value;
          });
        }

        // Merge feature toggles from app-config
        if (configRes.data?.data) {
          Object.entries(configRes.data.data).forEach(([key, value]) => {
            mappedSettings[key] = value;
          });
        }

        setSettings(mappedSettings);
      } catch (e) {
        console.error(e);
        setError('Failed to load settings. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (field: string, value: any) => setSettings(s => ({ ...s, [field]: value }));

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      // Separate feature toggle keys from regular settings
      const featureKeys = new Set(FEATURE_TOGGLES.flatMap(g => g.items.map(i => i.key)));
      featureKeys.add('maintenance_mode');

      const regularSettings: { key: string; value: string }[] = [];
      const featureToggles: { key: string; value: string }[] = [];

      Object.keys(settings).forEach(key => {
        const value = String((settings as any)[key]);
        if (featureKeys.has(key)) {
          featureToggles.push({ key, value });
        } else {
          regularSettings.push({ key, value });
        }
      });

      await Promise.all([
        regularSettings.length > 0 && api.patch('/admin/settings', { settings: regularSettings }),
        featureToggles.length > 0 && api.patch('/admin/app-config', { config: featureToggles }),
      ]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe size={16} /> },
    { id: 'features', label: 'Feature Toggles', icon: <Zap size={16} /> },
    { id: 'security', label: 'Security & Auth', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Database size={16} /> },
  ];

  const ToggleRow = ({ label, desc, field, danger = false }: { label: string; desc: string; field: keyof typeof settings; danger?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1, marginRight: '1.5rem' }}>
        <p style={{ fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--text-primary)', fontSize: '0.875rem' }}>{label}</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <label className="toggle" style={{ flexShrink: 0 }}>
        <input type="checkbox" checked={settings[field] === true || settings[field] === 'true'} onChange={e => set(field, e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="animate-fade-in">System Settings</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Configure global application parameters, feature toggles, and integrations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
            <button className="btn btn-primary" onClick={saveSettings} disabled={saving} style={{ gap: '0.5rem' }}>
              {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </header>

        {/* Maintenance Mode Banner */}
        {settings.maintenance_mode && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.875rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 600 }}>
              🚨 Maintenance Mode is currently ACTIVE — all users are seeing the maintenance screen.
            </p>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', background: 'var(--bg-elevated)', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', whiteSpace: 'nowrap' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.75rem 1.5rem' }}>

            {/* ── General ──────────────────────────────────────────────── */}
            {activeTab === 'general' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>General Configuration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">App Name</label>
                    <input className="input-field" value={settings.appName} onChange={e => set('appName', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Support Email</label>
                    <input className="input-field" type="email" value={settings.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
                  </div>
                </div>
                <div className="input-group" style={{ maxWidth: '50%' }}>
                  <label className="input-label">Default Plan for New Users</label>
                  <select className="input-field" value={settings.defaultPlanSlug} onChange={e => set('defaultPlanSlug', e.target.value)}>
                    {loading ? <option>Loading...</option> : plans.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.375rem' }}>
                    New users are automatically assigned this plan on registration.
                  </p>
                </div>

                <h4 style={{ marginBottom: '0.75rem', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ACCESS CONTROL</h4>
                <ToggleRow
                  label="Enable Public Registration"
                  desc="If disabled, new users cannot register — only existing users can log in."
                  field="enablePublicRegistration"
                />
                <ToggleRow
                  label="Require Email Verification"
                  desc="Users must verify their email address before they can use the app."
                  field="requireEmailVerification"
                />
              </div>
            )}

            {/* ── Feature Toggles ──────────────────────────────────────── */}
            {activeTab === 'features' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <h3>Feature Toggles</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Instantly enable or disable features across the entire platform for all users.
                    </p>
                  </div>
                </div>

                {/* Maintenance Mode — prominent first */}
                <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                  <ToggleRow
                    label="🚨 Maintenance Mode"
                    desc="When enabled, all users (except admins) see a maintenance screen and cannot access the app."
                    field="maintenance_mode"
                    danger
                  />
                </div>

                {FEATURE_TOGGLES.map(group => (
                  <div key={group.group} style={{ marginBottom: '1.75rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                      {group.group}
                    </h4>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0 1rem', border: '1px solid var(--border)' }}>
                      {group.items.map(item => (
                        <ToggleRow key={item.key} label={item.label} desc={item.desc} field={item.key as keyof typeof settings} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Security ─────────────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>Security & Authentication</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">Max Login Attempts (Brute Force)</label>
                    <input className="input-field" type="number" min={1} max={20} value={settings.maxLoginAttempts} onChange={e => set('maxLoginAttempts', Number(e.target.value))} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>After this many failures, account is temporarily locked.</p>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Lockout Duration (Minutes)</label>
                    <input className="input-field" type="number" min={1} value={settings.lockoutDurationMinutes} onChange={e => set('lockoutDurationMinutes', Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">OTP Expiry (Minutes)</label>
                    <input className="input-field" type="number" min={1} value={settings.otpExpiryMinutes} onChange={e => set('otpExpiryMinutes', Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Session Duration (Days)</label>
                    <input className="input-field" type="number" min={1} value={settings.sessionDurationDays} onChange={e => set('sessionDurationDays', Number(e.target.value))} />
                  </div>
                </div>

                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: '0.8125rem', color: 'var(--warning)' }}>
                  ⚠️ Security settings are stored in the database and take effect immediately for new requests. Existing sessions are unaffected until expiry.
                </div>
              </div>
            )}

            {/* ── Notifications ─────────────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>Email & Notification Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="input-group">
                    <label className="input-label">SMTP Host</label>
                    <input className="input-field" value={settings.smtpHost} onChange={e => set('smtpHost', e.target.value)} placeholder="e.g. smtp.gmail.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">SMTP Port</label>
                    <input className="input-field" type="number" value={settings.smtpPort} onChange={e => set('smtpPort', Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">SMTP Username</label>
                    <input className="input-field" value={settings.smtpUser} onChange={e => set('smtpUser', e.target.value)} placeholder="your@email.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Sender Name</label>
                    <input className="input-field" value={settings.smtpSender} onChange={e => set('smtpSender', e.target.value)} placeholder="SmartSpend" />
                  </div>
                </div>

                <h4 style={{ marginBottom: '0.75rem', marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>NOTIFICATION TYPES</h4>
                <ToggleRow label="Budget Alert Emails" desc="Send email when a user exceeds their monthly budget." field="budgetAlertEnabled" />
                <ToggleRow label="Weekly Digest" desc="Send users a weekly summary of their spending." field="weeklyDigestEnabled" />
                <ToggleRow label="Push Notifications" desc="Send push notifications to mobile devices." field="feature_notifications" />
              </div>
            )}

            {/* ── Maintenance ───────────────────────────────────────────── */}
            {activeTab === 'maintenance' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>Platform Statistics</h3>
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="card skeleton" style={{ height: '80px' }} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { label: 'Total Users', value: metrics?.totalUsers ?? 0, color: '#2563EB' },
                      { label: 'Active Sessions', value: metrics?.activeSessions ?? 0, color: '#059669' },
                      { label: 'Total Transactions', value: metrics?.totalTransactions ?? 0, color: '#D97706' },
                      { label: 'Total Cashbooks', value: metrics?.activeSubscriptions ?? 0, color: '#7C3AED' },
                      { label: 'New This Month', value: metrics?.newUsersThisMonth ?? 0, color: '#0284C7' },
                      { label: 'Verified Users', value: metrics?.verifiedUsers ?? 0, color: '#059669' },
                      { label: 'Suspended Users', value: metrics?.suspendedUsers ?? 0, color: '#DC2626' },
                      { label: 'Active Goals', value: metrics?.totalGoals ?? 0, color: '#8B5CF6' },
                      { label: 'Active Budgets', value: metrics?.totalBudgets ?? 0, color: '#F59E0B' },
                    ].map(m => (
                      <div key={m.label} className="card" style={{ textAlign: 'center', padding: '1.25rem', borderTop: `2px solid ${m.color}` }}>
                        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: m.color }}>{m.value.toLocaleString()}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => window.location.reload()} style={{ gap: '0.5rem' }}>
                    <RefreshCw size={15} /> Refresh Stats
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.open('http://localhost:5555', '_blank')}
                    style={{ gap: '0.5rem' }}
                  >
                    <Database size={15} /> Open Prisma Studio
                  </button>
                  <a href="/logs" className="btn btn-secondary" style={{ gap: '0.5rem', textDecoration: 'none' }}>
                    <Lock size={15} /> View Audit Logs
                  </a>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger Zone</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', lineHeight: 1.5 }}>
                    Dangerous operations (data wipes, hard deletes) are intentionally disabled in this interface.
                    Use the database directly or Prisma Studio for irreversible changes.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </>
  );
}
