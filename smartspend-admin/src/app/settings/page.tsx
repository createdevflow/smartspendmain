'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { api } from '@/lib/api';
import { Save, Shield, Bell, Database, Globe, RefreshCw, CheckCircle, Zap, AlertTriangle, Lock, Mail, Send, Eye, EyeOff, Plus, Edit, Trash2, X, Upload } from 'lucide-react';

// ── All feature toggles ───────────────────────────────────────────────────────
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
      { key: 'feature_wealth_hub', label: 'Wealth Hub', desc: 'Enable stock market and investment features.' },
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
      { key: 'feature_ai_insights_mini', label: 'Smart Insights', desc: 'Show AI-powered spending insights on the home screen.' },
      { key: 'feature_gamification_active', label: 'Gamification', desc: 'Enable streaks, burn-rate alerts, and achievements.' },
      { key: 'feature_gallery', label: 'Gallery Attachments', desc: 'Allow attaching images to entries.' },
      { key: 'feature_chat', label: 'Cashtro Chat (In-App Messaging)', desc: 'Enable private messaging between contacts and cashbook members.' },
      { key: 'feature_invoices', label: 'Inbuilt Smart Invoicing', desc: 'Allow users to create invoices, GST billing, and professional estimates.' },
      { key: 'feature_payment_reminders', label: 'Payment Reminders', desc: 'Allow users to track amounts to receive or pay with due date reminders.' },
      { key: 'feature_scheduler', label: 'Scheduled Invoices & Messages', desc: 'Allow users to schedule invoice/receipt sharing via email or in-app chat. Adds a schedule icon in Transactions and Chat screens.' },
    ],
  },
];

const DEFAULT_SETTINGS = {
  appName: 'Cashtro',
  supportEmail: 'support@cashtro.in',
  brand_logo_url: 'https://cashtro.in/cashtro-logo.png',
  defaultPlanSlug: 'free',
  free_trial_days: 7,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  otpExpiryMinutes: 10,
  sessionDurationDays: 30,
  enablePublicRegistration: true,
  requireEmailVerification: true,
  // SMTP settings
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: '',
  smtp_pass: '',
  mail_from_name: 'Cashtro',
  mail_from_address: '',
  // Notification toggles
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
  feature_wealth_hub: true,
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
  feature_ai_insights_mini: false,
  feature_gamification_active: false,
  feature_shared_cashbooks_active: true,
  feature_tax_export_active: true,
  feature_panic_button_active: true,
  feature_gallery: true,
  feature_chat: true,
  feature_invoices: true,
  feature_payment_reminders: true,
  feature_scheduler: true,
  download_android_enabled: true,
  download_android_url: '',
  download_ios_enabled: false,
  download_ios_url: '',
  min_app_version: '1.0.0',
  force_update_enabled: false,
  gemini_api_key: '',
  razorpay_key_id: '',
  razorpay_key_secret: '',
  ai_maintenance_mode: false,
  ai_gemini_model: 'gemini-2.0-flash',
  ai_default_credits: 30,
  ai_max_prompt_length: 15000,
  ai_credit_cost_ocr: 2,
  ai_credit_cost_insight: 1,
  ai_credit_cost_chat: 1,
  ai_credit_cost_note_analysis: 1,
  ai_credit_cost_mini_insight: 1,
  ai_safety_harassment: 'BLOCK_MEDIUM_AND_ABOVE',
  ai_safety_hate: 'BLOCK_MEDIUM_AND_ABOVE',
  ai_safety_dangerous: 'BLOCK_MEDIUM_AND_ABOVE',
};

const DEFAULT_EMAIL_DEPARTMENTS = [
  { id: 'noreply', name: 'Cashtro', email: 'noreply@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Thank you,<br><strong style="color:#232333">Cashtro</strong><br>Automated Notification<br>Please do not reply to this email.<br>🌐 <a href="https://cashtro.in">https://cashtro.in</a></p>` },
  { id: 'admin', name: 'Cashtro Administration', email: 'admin@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Administration</strong><br>Internal Operations<br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 admin@cashtro.in</p>` },
  { id: 'support', name: 'Cashtro Support', email: 'support@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Here to help,<br><strong style="color:#232333">Cashtro Support Team</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 support@cashtro.in</p>` },
  { id: 'billing', name: 'Cashtro Billing', email: 'billing@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Billing Team</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 billing@cashtro.in</p>` },
  { id: 'legal', name: 'Cashtro Legal', email: 'legal@cashtro.in', signature: `<p style="margin-top:24px;color:#64748B;font-size:14px;">Regards,<br><strong style="color:#232333">Cashtro Legal & Compliance</strong><br>🌐 <a href="https://cashtro.in">https://cashtro.in</a><br>📧 legal@cashtro.in</p>` }
];

type TabId = 'general' | 'features' | 'security' | 'notifications' | 'maintenance' | 'integrations' | 'ai';


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULT_SETTINGS);
  const [emailDepartments, setEmailDepartments] = useState<any[]>(DEFAULT_EMAIL_DEPARTMENTS);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('module', 'system');
      
      const res = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.data?.url) {
        setSettings(s => ({ ...s, brand_logo_url: res.data.data.url }));
      } else {
        alert('Upload failed: Invalid response');
      }
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

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
            if (s.key === 'email_departments') {
              try {
                setEmailDepartments(JSON.parse(s.value));
              } catch (e) {}
              return;
            }
            if (s.value === 'true') mappedSettings[s.key] = true;
            else if (s.value === 'false') mappedSettings[s.key] = false;
            else if (!isNaN(Number(s.value)) && s.value !== '') mappedSettings[s.key] = Number(s.value);
            else mappedSettings[s.key] = s.value;
          });
        }

        // Merge feature toggles from app-config
        if (configRes.data?.data) {
          Object.entries(configRes.data.data).forEach(([key, configObj]: [string, any]) => {
            const val = typeof configObj === 'object' ? configObj.value : configObj;
            if (val === 'true') mappedSettings[key] = true;
            else if (val === 'false') mappedSettings[key] = false;
            else mappedSettings[key] = val;
            
            if (typeof configObj === 'object' && configObj.teaseMode !== undefined) {
              mappedSettings[`${key}_teaseMode`] = configObj.teaseMode;
            }
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
      // Keys that go to app-config (feature toggles)
      const featureKeys = new Set(FEATURE_TOGGLES.flatMap(g => g.items.map(i => i.key)));
      featureKeys.add('maintenance_mode');
      featureKeys.add('download_android_enabled');
      featureKeys.add('download_android_url');
      featureKeys.add('download_ios_enabled');
      featureKeys.add('download_ios_url');
      featureKeys.add('min_app_version');
      featureKeys.add('force_update_enabled');

      const regularSettings: { key: string; value: string }[] = [];
      const featureToggles: { key: string; value: string; teaseMode?: boolean }[] = [];

      Object.keys(settings).forEach(key => {
        if (key.endsWith('_teaseMode')) return; // handled with main key
        
        const value = String((settings as any)[key]);
        if (featureKeys.has(key)) {
          const teaseMode = (settings as any)[`${key}_teaseMode`];
          featureToggles.push({ key, value, ...(teaseMode !== undefined && { teaseMode }) });
        } else {
          regularSettings.push({ key, value });
        }
      });
      regularSettings.push({ key: 'email_departments', value: JSON.stringify(emailDepartments) });

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

  const sendTestEmail = async () => {
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await api.post('/admin/test-email', { email: testEmailAddr || undefined });
      setTestEmailResult({ ok: true, msg: res.data?.data?.message || 'Test email sent successfully!' });
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || e.response?.data?.message || 'Failed to send test email. Check SMTP settings.';
      setTestEmailResult({ ok: false, msg });
    } finally {
      setTestingEmail(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe size={16} /> },
    { id: 'features', label: 'Feature Toggles', icon: <Zap size={16} /> },
    { id: 'security', label: 'Security & Auth', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'integrations', label: 'Integrations', icon: <Database size={16} /> },
    { id: 'ai', label: 'AI Management', icon: <Zap size={16} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <AlertTriangle size={16} /> },
  ];

  const ToggleRow = ({ label, desc, field, danger = false, hasTease = false }: { label: string; desc: string; field: string; danger?: boolean; hasTease?: boolean }) => (
    <div style={{ padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: '1.5rem' }}>
          <p style={{ fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--text-primary)', fontSize: '0.875rem' }}>{label}</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem', lineHeight: 1.5 }}>{desc}</p>
        </div>
        <label className="toggle" style={{ flexShrink: 0 }}>
          <input type="checkbox" checked={(settings as any)[field] === true || (settings as any)[field] === 'true'} onChange={e => set(field as string, e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
      
      {hasTease && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Lock size={12} /> Freemium Tease Mode</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>If enabled, free users will see a locked padlocked version of this feature with an upgrade prompt. (The main toggle above must be ON for Pro users to access it).</p>
          </div>
          <label className="toggle" style={{ flexShrink: 0, transform: 'scale(0.8)' }}>
            <input type="checkbox" checked={(settings as any)[`${String(field)}_teaseMode`] === true} onChange={e => set(`${String(field)}_teaseMode`, e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <header style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} className="responsive-form-grid">
          <div>
            <h1 className="page-title animate-fade-in">System Settings</h1>
            <p className="body-text">
              Configure global application parameters, feature toggles, and integrations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {error && <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</span>}
            <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
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
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label className="input-label">Brand Logo (Used in Emails)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label className="btn btn-secondary" style={{ display: 'inline-flex', padding: '0.5rem 1rem', cursor: uploadingLogo ? 'not-allowed' : 'pointer', opacity: uploadingLogo ? 0.7 : 1 }}>
                          <Upload size={16} style={{ marginRight: '0.5rem' }} />
                          {uploadingLogo ? 'Uploading...' : 'Upload Logo Image'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLogo} disabled={uploadingLogo} />
                        </label>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', marginBottom: 0 }}>
                          Recommended: PNG or JPG, max 2MB. Image will be automatically resized for emails.
                        </p>
                      </div>
                      {settings.brand_logo_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img src={settings.brand_logo_url} alt="Logo preview" style={{ height: '48px', objectFit: 'contain', background: '#f1f5f9', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                          <button type="button" onClick={() => set('brand_logo_url', '')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="input-group">
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
                  <div className="input-group">
                    <label className="input-label">Free Trial Days</label>
                    <input className="input-field" type="number" min={0} value={settings.free_trial_days} onChange={e => set('free_trial_days', Number(e.target.value))} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.375rem' }}>
                      Number of days users get full access (0 for none).
                    </p>
                  </div>
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
                      {group.items.map(item => {
                       const isAiFeature = ['feature_ocr_active', 'feature_ai_insights_mini'].includes(item.key);
                        const hasTeaseSupport = isAiFeature || [
                          'feature_gamification_active',
                          'feature_top_categories',
                          'feature_upcoming_bills',
                          'feature_shared_cashbooks_active',
                          'feature_tax_export_active',
                          'feature_gallery',
                          'feature_wealth_hub',
                        ].includes(item.key);
                        return (
                          <ToggleRow 
                            key={item.key} 
                            label={item.label} 
                            desc={item.desc} 
                            field={item.key as keyof typeof settings} 
                            hasTease={hasTeaseSupport}
                          />
                        );
                      })}
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
                {/* SMTP Config */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                  <Mail size={18} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ margin: 0 }}>SMTP Email Configuration</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Configure your SMTP server to enable all transactional emails: OTP verification, password reset, budget alerts, and monthly reports.
                  Settings are saved to the database and applied immediately — <strong>no server restart required</strong>.
                </p>

                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>SERVER SETTINGS</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">SMTP Host</label>
                      <input className="input-field" value={settings.smtp_host} onChange={e => set('smtp_host', e.target.value)} placeholder="e.g. smtp.gmail.com or mail.yourdomain.com" />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Gmail: smtp.gmail.com · Brevo: smtp-relay.brevo.com · Mailgun: smtp.mailgun.org</p>
                    </div>
                    <div className="input-group">
                      <label className="input-label">SMTP Port</label>
                      <input className="input-field" type="number" value={settings.smtp_port} onChange={e => set('smtp_port', Number(e.target.value))} />
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>587 (TLS/STARTTLS) · 465 (SSL) · 25 (plain)</p>
                    </div>
                    <div className="input-group">
                      <label className="input-label">SMTP Username</label>
                      <input className="input-field" value={settings.smtp_user} onChange={e => set('smtp_user', e.target.value)} placeholder="your@gmail.com" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">SMTP Password / App Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="input-field"
                          type={showSmtpPass ? 'text' : 'password'}
                          value={settings.smtp_pass}
                          onChange={e => set('smtp_pass', e.target.value)}
                          placeholder="••••••••••••"
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(p => !p)}
                          style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
                        >
                          {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>For Gmail, use a 16-character App Password (not your main password).</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      <input type="checkbox" checked={!!settings.smtp_secure} onChange={e => set('smtp_secure', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                      <span><strong>Use SSL/TLS</strong> — Enable for port 465. Leave off for port 587 (STARTTLS).</span>
                    </label>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>EMAIL DEPARTMENTS</h4>
                    <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }} onClick={() => setEditingDepartment({ id: '', name: '', email: '', signature: '' })}>
                      <Plus size={14} style={{ marginRight: '0.375rem' }} /> Add Department
                    </button>
                  </div>
                  
                  {editingDepartment ? (
                    <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">Department ID (e.g., noreply, support)</label>
                          <input className="input-field" value={editingDepartment.id} onChange={e => setEditingDepartment({ ...editingDepartment, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })} />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label className="input-label">From Name</label>
                          <input className="input-field" value={editingDepartment.name} onChange={e => setEditingDepartment({ ...editingDepartment, name: e.target.value })} />
                        </div>
                        <div className="input-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                          <label className="input-label">From Email Address</label>
                          <input className="input-field" type="email" value={editingDepartment.email} onChange={e => setEditingDepartment({ ...editingDepartment, email: e.target.value })} />
                        </div>
                        <div className="input-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                          <label className="input-label">HTML Signature</label>
                          <textarea className="input-field" style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '13px' }} value={editingDepartment.signature} onChange={e => setEditingDepartment({ ...editingDepartment, signature: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setEditingDepartment(null)}>Cancel</button>
                        <button className="btn btn-primary" onClick={() => {
                          if (!editingDepartment.id || !editingDepartment.email) return;
                          setEmailDepartments(prev => {
                            const exists = prev.findIndex(d => d.id === editingDepartment.id);
                            if (exists >= 0) {
                              const newDeps = [...prev];
                              newDeps[exists] = editingDepartment;
                              return newDeps;
                            }
                            return [...prev, editingDepartment];
                          });
                          setEditingDepartment(null);
                        }}>Save Department</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem', color: 'var(--text-tertiary)' }}>ID</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-tertiary)' }}>Name</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-tertiary)' }}>Email</th>
                            <th style={{ padding: '0.75rem', color: 'var(--text-tertiary)' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailDepartments.map(dep => (
                            <tr key={dep.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 600 }}>{dep.id}</td>
                              <td style={{ padding: '0.75rem' }}>{dep.name}</td>
                              <td style={{ padding: '0.75rem' }}>{dep.email}</td>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => setEditingDepartment(dep)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><Edit size={16} /></button>
                                  <button onClick={() => setEmailDepartments(prev => prev.filter(d => d.id !== dep.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Test Email */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>TEST YOUR CONFIGURATION</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    After saving your SMTP settings above, send a test email to verify delivery works correctly.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ flex: 1, margin: 0 }}>
                      <label className="input-label">Recipient Email</label>
                      <input
                        className="input-field"
                        type="email"
                        value={testEmailAddr}
                        onChange={e => setTestEmailAddr(e.target.value)}
                        placeholder="your@email.com (leave blank to send to your admin email)"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={sendTestEmail}
                      disabled={testingEmail}
                      style={{ gap: '0.5rem', flexShrink: 0, height: '42px' }}
                    >
                      <Send size={15} />
                      {testingEmail ? 'Sending...' : 'Send Test Email'}
                    </button>
                  </div>
                  {testEmailResult && (
                    <div style={{
                      marginTop: '0.875rem', padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
                      background: testEmailResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${testEmailResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: testEmailResult.ok ? '#065F46' : '#B91C1C',
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                      {testEmailResult.ok ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                      {testEmailResult.msg}
                    </div>
                  )}
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
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                  <h3 style={{ marginBottom: '1.25rem' }}>Platform Controls</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                      <label className="input-label">Minimum App Version</label>
                      <input 
                        className="input-field" 
                        type="text" 
                        value={settings.min_app_version} 
                        onChange={e => set('min_app_version', e.target.value)} 
                        placeholder="e.g. 1.0.2"
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.375rem' }}>
                        Users on older versions will see the force update screen.
                      </p>
                    </div>
                  </div>

                  <ToggleRow
                    label="Force Update Active"
                    desc="If enabled, all users below the Minimum App Version will be completely blocked and forced to update."
                    field="force_update_enabled"
                    danger
                  />
                  
                  <h4 style={{ marginBottom: '0.75rem', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>APP DOWNLOAD LINKS</h4>
                  
                  <ToggleRow
                    label="Enable Android App Download"
                    desc="Show the download banner for Android devices."
                    field="download_android_enabled"
                  />
                  <div className="input-group" style={{ marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
                    <input 
                      className="input-field" 
                      type="url" 
                      value={settings.download_android_url} 
                      onChange={e => set('download_android_url', e.target.value)} 
                      placeholder="https://play.google.com/store/apps/details?id=..."
                    />
                  </div>

                  <ToggleRow
                    label="Enable iOS App Download"
                    desc="Show the download banner for iOS devices."
                    field="download_ios_enabled"
                  />
                  <div className="input-group" style={{ marginBottom: '1rem', marginTop: '-0.5rem' }}>
                    <input 
                      className="input-field" 
                      type="url" 
                      value={settings.download_ios_url} 
                      onChange={e => set('download_ios_url', e.target.value)} 
                      placeholder="https://apps.apple.com/app/id..."
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
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

            {/* ── Integrations ────────────────────────────────────────── */}
            {activeTab === 'integrations' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>API Keys & Integrations</h3>
                
                <div style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>MOBILE APP STORE DOWNLOAD LINKS</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>Configure links displayed on the public website landing page. If disabled or empty, the button shows "Coming Soon".</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Google Play Store (Android)</span>
                        <input type="checkbox" checked={settings.download_android_enabled} onChange={e => set('download_android_enabled', e.target.checked)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>Play Store URL or APK Link</label>
                        <input className="input-field" type="text" placeholder="https://play.google.com/store/apps/details?id=..." value={settings.download_android_url} onChange={e => set('download_android_url', e.target.value)} disabled={!settings.download_android_enabled} />
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Apple App Store (iOS)</span>
                        <input type="checkbox" checked={settings.download_ios_enabled} onChange={e => set('download_ios_enabled', e.target.checked)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontSize: '0.75rem' }}>App Store URL</label>
                        <input className="input-field" type="text" placeholder="https://apps.apple.com/app/id..." value={settings.download_ios_url} onChange={e => set('download_ios_url', e.target.value)} disabled={!settings.download_ios_enabled} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>GOOGLE GEMINI AI</h4>
                  <div className="input-group">
                    <label className="input-label">Gemini API Key</label>
                    <input className="input-field" type="text" placeholder="AIzaSy..." value={settings.gemini_api_key} onChange={e => set('gemini_api_key', e.target.value)} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Used for AI Receipt Scanning and Smart Insights.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>RAZORPAY PAYMENT GATEWAY</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Razorpay Key ID</label>
                      <input className="input-field" type="text" placeholder="rzp_live_..." value={settings.razorpay_key_id} onChange={e => set('razorpay_key_id', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Razorpay Key Secret</label>
                      <div style={{ position: 'relative' }}>
                        <input className="input-field" type="password" placeholder="Secret" value={settings.razorpay_key_secret} onChange={e => set('razorpay_key_secret', e.target.value)} style={{ paddingRight: '2.5rem' }} />
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Used for Plan Upgrades and Subscriptions.</p>
                </div>
              </div>
            )}

            {/* ── AI Management ────────────────────────────────────────── */}
            {activeTab === 'ai' && (
              <div>
                <h3 style={{ marginBottom: '1.25rem' }}>AI Management & Security</h3>
                
                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>AI Configuration</h4>
                  
                  <ToggleRow label="Enable AI Maintenance Mode" desc="Temporarily disable all AI features across the app." field="ai_maintenance_mode" danger />

                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label className="input-label">Gemini Model</label>
                    <select className="input-field" value={settings.ai_gemini_model || 'gemini-2.0-flash'} onChange={e => set('ai_gemini_model', e.target.value)}>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash (Default/Free)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Paid)</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label className="input-label">Default New User AI Credits</label>
                    <input className="input-field" type="number" value={settings.ai_default_credits ?? 30} onChange={e => set('ai_default_credits', e.target.value)} />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>Free AI credits automatically granted to every new user upon registration or first AI use.</p>
                  </div>

                  <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label className="input-label">Max Prompt Length (Characters)</label>
                    <input className="input-field" type="number" value={settings.ai_max_prompt_length ?? 15000} onChange={e => set('ai_max_prompt_length', e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Credit System Costs</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Receipt OCR Cost</label>
                      <input className="input-field" type="number" value={settings.ai_credit_cost_ocr || 2} onChange={e => set('ai_credit_cost_ocr', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Financial Insight Cost</label>
                      <input className="input-field" type="number" value={settings.ai_credit_cost_insight || 1} onChange={e => set('ai_credit_cost_insight', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Agent Chat Cost</label>
                      <input className="input-field" type="number" value={settings.ai_credit_cost_chat || 1} onChange={e => set('ai_credit_cost_chat', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Note Analysis Cost</label>
                      <input className="input-field" type="number" value={settings.ai_credit_cost_note_analysis || 1} onChange={e => set('ai_credit_cost_note_analysis', e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Mini Insight Cost</label>
                      <input className="input-field" type="number" value={settings.ai_credit_cost_mini_insight || 1} onChange={e => set('ai_credit_cost_mini_insight', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Safety Thresholds</h4>
                  
                  <div className="input-group">
                    <label className="input-label">Harassment</label>
                    <select className="input-field" value={settings.ai_safety_harassment || 'BLOCK_MEDIUM_AND_ABOVE'} onChange={e => set('ai_safety_harassment', e.target.value)}>
                      <option value="BLOCK_LOW_AND_ABOVE">Block Low and Above (Strictest)</option>
                      <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium and Above</option>
                      <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                      <option value="BLOCK_NONE">Block None</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Hate Speech</label>
                    <select className="input-field" value={settings.ai_safety_hate || 'BLOCK_MEDIUM_AND_ABOVE'} onChange={e => set('ai_safety_hate', e.target.value)}>
                      <option value="BLOCK_LOW_AND_ABOVE">Block Low and Above (Strictest)</option>
                      <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium and Above</option>
                      <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                      <option value="BLOCK_NONE">Block None</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Dangerous Content</label>
                    <select className="input-field" value={settings.ai_safety_dangerous || 'BLOCK_MEDIUM_AND_ABOVE'} onChange={e => set('ai_safety_dangerous', e.target.value)}>
                      <option value="BLOCK_LOW_AND_ABOVE">Block Low and Above (Strictest)</option>
                      <option value="BLOCK_MEDIUM_AND_ABOVE">Block Medium and Above</option>
                      <option value="BLOCK_ONLY_HIGH">Block Only High</option>
                      <option value="BLOCK_NONE">Block None</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
