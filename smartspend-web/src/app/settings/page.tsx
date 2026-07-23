'use client';
import { useEffect, useState, useRef } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { api } from '@/lib/api';
import { useApp } from '@/lib/AppContext';
import { 
  User, Lock, Globe, CreditCard, Save, Eye, EyeOff, Sparkles, 
  Bell, FileText, Settings, HelpCircle, Download, Trash2, LogOut,
  Image as ImageIcon, CheckCircle, Shield, ChevronDown, ChevronUp, Camera, AlertCircle
} from 'lucide-react';

const TABS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'invoice', label: 'Invoice Branding', icon: FileText },
  { key: 'ai', label: 'AI & Insights', icon: Sparkles },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'billing', label: 'Subscription', icon: CreditCard },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'support', label: 'Support & Docs', icon: HelpCircle },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'JPY'];

export default function SettingsPage() {
  const { user, refreshUser } = useApp();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Profile form
  const [profile, setProfile] = useState({ fullName: '', phone: '', currency: 'INR' });
  // Security form
  const [security, setSecurity] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  // Plan & AI Credits
  const [plans, setPlans] = useState<any[]>([]);
  const [aiCredits, setAiCredits] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  
  // App Preferences
  const [privateMode, setPrivateMode] = useState(false);
  const [gstMode, setGstMode] = useState(false);

  // AI Prefs
  const [aiPrefs, setAiPrefs] = useState({ disableCategorization: false, disableInsights: false, disableReceiptScanning: false });

  // Invoice Branding
  const [bizProfile, setBizProfile] = useState({
    businessName: '', proprietorName: '', gstin: '', pan: '', 
    mobile: '', email: '', address: '', city: '', state: '', pincode: '',
    upiId: '', bankName: '', accountNumber: '', ifscCode: '',
    logoUri: null as string | null, signatureUri: null as string | null,
    defaultTerms: '', defaultNotes: ''
  });
  const [invoiceSettings, setInvoiceSettings] = useState({ businessPrefix: '', defaultSeries: 'INV', whiteLabelEnabled: false });

  // Support
  const [supportForm, setSupportForm] = useState({ type: 'contact_us', message: '' });
  
  // Tax Export
  const [taxYear, setTaxYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (user) {
      setProfile({ fullName: user.fullName || '', phone: '', currency: user.currency || 'INR' });
      
      // Load Local Preferences
      try {
        const pm = localStorage.getItem('@cashtro_private_mode');
        if (pm) setPrivateMode(pm === 'true');
        
        const gm = localStorage.getItem('@cashtro_gst_mode');
        if (gm) setGstMode(gm === 'true');
        
        const ai = localStorage.getItem('@ai_prefs');
        if (ai) setAiPrefs(JSON.parse(ai));
        
        const biz = localStorage.getItem(`@cashtro_biz_profile_${user.id}`);
        if (biz) setBizProfile(prev => ({ ...prev, ...JSON.parse(biz) }));
        
        const invSet = localStorage.getItem(`@cashtro_invoice_settings_${user.id}`);
        if (invSet) setInvoiceSettings(prev => ({ ...prev, ...JSON.parse(invSet) }));
      } catch(e) {}
    }
    
    api.get('/users/profile').then(r => {
      const u = r.data?.data || {};
      setProfile(prev => ({ ...prev, fullName: u.fullName || prev.fullName, phone: u.phone || '' }));
    }).catch(() => {});
    
    api.get('/plans').then(r => setPlans(r.data?.data || [])).catch(() => {});
    api.get('/users/ai-credits').then(r => setAiCredits(r.data?.data || r.data)).catch(() => {});
  }, [user]);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const saveProfile = async () => {
    if (!profile.fullName.trim()) { flash('Name is required', false); return; }
    setSaving(true);
    try {
      await api.patch('/users/profile', { fullName: profile.fullName, phone: profile.phone, currency: profile.currency });
      await refreshUser();
      flash('Profile updated successfully');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to update profile', false);
    } finally { setSaving(false); }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem('@cashtro_private_mode', String(privateMode));
      localStorage.setItem('@cashtro_gst_mode', String(gstMode));
      // Save currency as well
      await api.patch('/users/profile', { currency: profile.currency });
      await refreshUser();
      flash('Preferences saved successfully');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to save preferences', false);
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!security.newPassword || security.newPassword.length < 8) { flash('Password must be at least 8 characters', false); return; }
    if (security.newPassword !== security.confirmPassword) { flash('Passwords do not match', false); return; }
    setSaving(true);
    try {
      await api.post('/users/change-password', { currentPassword: security.currentPassword, newPassword: security.newPassword });
      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      flash('Password changed successfully');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to change password', false);
    } finally { setSaving(false); }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setSaving(true);
        let base64 = reader.result as string;
        try {
          const uploadRes = await api.post('/media/upload-base64', { base64, module: 'users' });
          base64 = uploadRes.data?.data?.url || uploadRes.data?.url || base64;
        } catch (e) {
          // fallback to passing raw base64 if upload fails, though it might be large
        }
        await api.post('/users/avatar', { image: base64 });
        await refreshUser();
        flash('Avatar updated successfully');
      } catch (err: any) {
        flash(err.response?.data?.message || 'Failed to update avatar', false);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUri' | 'signatureUri') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBizProfile(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveInvoiceBranding = async () => {
    if (!user) return;
    setSaving(true);
    try {
      localStorage.setItem(`@cashtro_biz_profile_${user.id}`, JSON.stringify(bizProfile));
      localStorage.setItem(`@cashtro_invoice_settings_${user.id}`, JSON.stringify(invoiceSettings));
      flash('Invoice branding saved');
    } catch (e) {
      flash('Failed to save invoice branding', false);
    } finally {
      setSaving(false);
    }
  };

  const saveAiPrefs = async () => {
    setSaving(true);
    try {
      localStorage.setItem('@ai_prefs', JSON.stringify(aiPrefs));
      flash('AI preferences saved');
    } catch (e) {
      flash('Failed to save AI preferences', false);
    } finally {
      setSaving(false);
    }
  };
  
  const clearAiHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all AI chat history?")) return;
    setSaving(true);
    try {
      await api.delete('/ai/chat/history');
      flash('AI history cleared');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to clear history', false);
    } finally {
      setSaving(false);
    }
  };

  const submitSupportForm = async () => {
    if (!supportForm.message.trim()) { flash('Message is required', false); return; }
    setSaving(true);
    try {
      await api.post('/support/tickets', { type: supportForm.type, message: supportForm.message });
      setSupportForm({ ...supportForm, message: '' });
      flash('Ticket submitted successfully');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to submit ticket', false);
    } finally {
      setSaving(false);
    }
  };

  const exportTaxReport = async () => {
    if (!taxYear) { flash('Please enter a year', false); return; }
    setSaving(true);
    try {
      const res = await api.get(`/export/tax-report/preview?year=${taxYear}`);
      const data = res.data?.data || [];
      
      if (data.length === 0) {
        flash('No data found for the selected year', false);
        return;
      }
      
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map((row: any) => headers.map((h: string) => `"${row[h] || ''}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `tax_report_${taxYear}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      flash('Tax report exported successfully');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to export tax report', false);
    } finally {
      setSaving(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: any) => {
    try {
      setSaving(true);
      const res = await loadRazorpay();
      if (!res) { alert('Razorpay SDK failed to load.'); setSaving(false); return; }

      const amount = billingCycle === 'weekly' ? plan.priceWeekly : billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
      const orderRes = await api.post('/payment/create-order', { planId: plan.id, amount, currency: 'INR' });
      const { orderId, keyId, amount: orderAmt, currency } = orderRes.data || {};
      
      if (!orderId) { alert('Failed to create order'); setSaving(false); return; }

      const options = {
        key: keyId,
        amount: orderAmt,
        currency: currency,
        name: 'Cashtro',
        description: `Subscription to ${plan.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            flash('Payment Successful! Plan activated.');
            refreshUser();
          } catch (e) {
            flash('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: profile.phone || '',
        },
        theme: {
          color: '#2D8CFF'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (e) {
      alert('Could not start checkout.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  
  const logoutAllDevices = async () => {
    if (!window.confirm("Sign out from all other devices?")) return;
    setSaving(true);
    try {
      await api.delete('/users/sessions/all/other');
      flash('Logged out from all other devices');
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to logout devices', false);
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("WARNING: This will permanently delete your account and all data. This action cannot be undone. Are you sure?")) return;
    setSaving(true);
    try {
      await api.delete('/users/account');
      window.location.href = '/login';
    } catch (e: any) {
      flash(e?.response?.data?.message || 'Failed to delete account', false);
      setSaving(false);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <TopBar title="Settings" subtitle="Manage your account preferences" />

        {msg && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: msg.ok ? 'var(--success-bg)' : 'var(--danger-bg)', color: msg.ok ? 'var(--success)' : 'var(--danger)', border: `1px solid ${msg.ok ? '#A7F3D0' : '#FECACA'}`, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            {msg.ok ? '✅' : '❌'} {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Tab nav */}
          <div className="card" style={{ flex: '0 0 220px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', background: tab === t.key ? 'var(--accent-light)' : 'transparent', color: tab === t.key ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: tab === t.key ? 600 : 500, fontSize: 'var(--text-sm)', width: '100%', textAlign: 'left', transition: 'var(--transition)' }}>
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="card" style={{ flex: '1 1 400px' }}>
            {tab === 'profile' && (
              <>
                <h3 className="section-heading">Profile Information</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '2rem', flexShrink: 0, overflow: 'hidden' }}>
                      {user?.avatar ? <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Avatar" /> : (user?.fullName?.charAt(0) || 'U')}
                    </div>
                    <label style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--bg-elevated)', border: '2px solid var(--border)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Camera size={14} />
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{user?.fullName}</h2>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
                    <span className={`badge ${user?.plan === 'FREE' ? 'badge-warning' : 'badge-success'}`}>
                      {user?.plan?.name || user?.plan || 'FREE'}
                    </span>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input-field" value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <input className="input-field" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXXXXXXX" type="tel" />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Currency</label>
                  <select className="input-field" value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Email <Lock size={12} color="var(--text-tertiary)" />
                  </label>
                  <input className="input-field" value={user?.email || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--bg-tertiary)' }} />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>Email cannot be changed for security reasons.</p>
                </div>
                
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2.5rem' }}>Account Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: 'var(--text-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>User ID</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{user?.id}</span>
                      <button onClick={() => { navigator.clipboard.writeText(user?.id || ''); flash('Copied User ID'); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 'var(--text-xs)' }}>Copy</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Plan</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{user?.plan?.name || user?.plan || 'FREE'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Member Since</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email Status</span>
                    <span style={{ fontWeight: 500, color: user?.isEmailVerified ? 'var(--success)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {user?.isEmailVerified ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {user?.isEmailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {tab === 'preferences' && (
              <>
                <h3 className="section-heading">General Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={privateMode} onChange={e => setPrivateMode(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>Private Mode</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Hide balances and sensitive amounts by default.</span>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={gstMode} onChange={e => setGstMode(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>GST Mode for Transactions</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Enable split view for GST portions in regular transactions.</span>
                    </div>
                  </label>
                </div>

                <button className="btn btn-primary" onClick={savePreferences} disabled={saving} style={{ marginTop: '1.5rem' }}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </>
            )}

            {tab === 'security' && (
              <>
                <h3 className="section-heading">Change Password</h3>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type={showPw ? 'text' : 'password'} value={security.currentPassword} onChange={e => setSecurity(s => ({ ...s, currentPassword: e.target.value }))} placeholder="Enter current password" />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input className="input-field" type={showPw ? 'text' : 'password'} value={security.newPassword} onChange={e => setSecurity(s => ({ ...s, newPassword: e.target.value }))} placeholder="Min. 8 characters" />
                </div>
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="input-label">Confirm New Password</label>
                  <input className="input-field" type={showPw ? 'text' : 'password'} value={security.confirmPassword} onChange={e => setSecurity(s => ({ ...s, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
                </div>

                {security.newPassword && security.confirmPassword && security.newPassword !== security.confirmPassword && (
                  <p style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', marginBottom: '1rem' }}>❌ Passwords do not match</p>
                )}

                <button className="btn btn-primary" onClick={savePassword} disabled={saving}>
                  <Lock size={15} /> {saving ? 'Updating...' : 'Change Password'}
                </button>

                <div style={{ marginTop: '2.5rem', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--text-sm)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} /> Danger Zone
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Manage active sessions and account deletion. Note that web sessions use the same management as the mobile app.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={logoutAllDevices} disabled={saving}>
                      <LogOut size={15} /> Logout All Other Devices
                    </button>
                    <button className="btn btn-secondary" onClick={deleteAccount} disabled={saving} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                      <Trash2 size={15} /> Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}

            {tab === 'ai' && (
              <>
                <h3 className="section-heading">AI & Insights Opt-outs</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Disable any AI features you prefer not to use.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={aiPrefs.disableCategorization} onChange={e => setAiPrefs({...aiPrefs, disableCategorization: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>Disable Smart Categorization</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Manual entry only for transaction categories.</span>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={aiPrefs.disableInsights} onChange={e => setAiPrefs({...aiPrefs, disableInsights: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>Disable AI Insights</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Turn off AI spending analysis and recommendations.</span>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={aiPrefs.disableReceiptScanning} onChange={e => setAiPrefs({...aiPrefs, disableReceiptScanning: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    <div>
                      <span style={{ display: 'block', fontWeight: 600 }}>Disable Receipt Scanning</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Turn off AI-powered receipt reading.</span>
                    </div>
                  </label>
                </div>
                
                <button className="btn btn-primary" onClick={saveAiPrefs} disabled={saving} style={{ marginTop: '1.5rem' }}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save AI Preferences'}
                </button>

                <div style={{ marginTop: '2.5rem', padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.05)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>Clear AI History</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Permanently erase all AI conversations. This action cannot be undone.</p>
                  <button className="btn btn-secondary" onClick={clearAiHistory} disabled={saving} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <Trash2 size={15} /> Clear AI History
                  </button>
                </div>
              </>
            )}

            {tab === 'notifications' && (
              <>
                <h3 className="section-heading">Notification Preferences</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage how you receive alerts and summaries.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    Push Notifications (Mobile App)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    Email: Weekly Digest & Reports
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                    Email: Bill Reminders
                  </label>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                  <Save size={15} /> Save Preferences
                </button>
              </>
            )}

            {tab === 'invoice' && (
              <>
                <h3 className="section-heading">Invoice Branding & Profile</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Customize your business profile and how your invoices look.</p>
                
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Business Images</h4>
                
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <label className="input-label">Business Logo</label>
                    <div style={{ width: '80px', height: '80px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: 'var(--bg-elevated)' }}>
                      {bizProfile.logoUri ? (
                        <img src={bizProfile.logoUri} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} color="var(--text-tertiary)" />
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUri')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                    {bizProfile.logoUri && (
                      <button onClick={() => setBizProfile({...bizProfile, logoUri: null})} style={{ color: 'var(--danger)', background: 'none', border: 'none', fontSize: 'var(--text-xs)', marginTop: '0.5rem', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                  
                  <div>
                    <label className="input-label">Signature</label>
                    <div style={{ width: '160px', height: '80px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: 'var(--bg-elevated)' }}>
                      {bizProfile.signatureUri ? (
                        <img src={bizProfile.signatureUri} alt="Signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Tap to upload</span>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUri')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    </div>
                    {bizProfile.signatureUri && (
                      <button onClick={() => setBizProfile({...bizProfile, signatureUri: null})} style={{ color: 'var(--danger)', background: 'none', border: 'none', fontSize: 'var(--text-xs)', marginTop: '0.5rem', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Basic Info</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Business Name *</label>
                    <input className="input-field" value={bizProfile.businessName} onChange={e => setBizProfile({...bizProfile, businessName: e.target.value})} placeholder="e.g. Acme Corp" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Proprietor Name</label>
                    <input className="input-field" value={bizProfile.proprietorName} onChange={e => setBizProfile({...bizProfile, proprietorName: e.target.value})} placeholder="Your Name" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">GSTIN</label>
                    <input className="input-field" value={bizProfile.gstin} onChange={e => setBizProfile({...bizProfile, gstin: e.target.value})} placeholder="15 char GST number" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">PAN</label>
                    <input className="input-field" value={bizProfile.pan} onChange={e => setBizProfile({...bizProfile, pan: e.target.value})} placeholder="10 char PAN" />
                  </div>
                </div>
                
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Contact & Address</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Mobile</label>
                    <input className="input-field" value={bizProfile.mobile} onChange={e => setBizProfile({...bizProfile, mobile: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-field" value={bizProfile.email} onChange={e => setBizProfile({...bizProfile, email: e.target.value})} />
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Address</label>
                  <textarea className="input-field" value={bizProfile.address} onChange={e => setBizProfile({...bizProfile, address: e.target.value})} rows={2} style={{ resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">City</label>
                    <input className="input-field" value={bizProfile.city} onChange={e => setBizProfile({...bizProfile, city: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">State *</label>
                    <input className="input-field" value={bizProfile.state} onChange={e => setBizProfile({...bizProfile, state: e.target.value})} placeholder="e.g. Maharashtra" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">PIN Code</label>
                    <input className="input-field" value={bizProfile.pincode} onChange={e => setBizProfile({...bizProfile, pincode: e.target.value})} />
                  </div>
                </div>

                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Bank Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Bank Name</label>
                    <input className="input-field" value={bizProfile.bankName} onChange={e => setBizProfile({...bizProfile, bankName: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Account Number</label>
                    <input className="input-field" value={bizProfile.accountNumber} onChange={e => setBizProfile({...bizProfile, accountNumber: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">IFSC Code</label>
                    <input className="input-field" value={bizProfile.ifscCode} onChange={e => setBizProfile({...bizProfile, ifscCode: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">UPI ID</label>
                    <input className="input-field" value={bizProfile.upiId} onChange={e => setBizProfile({...bizProfile, upiId: e.target.value})} />
                  </div>
                </div>
                
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1rem' }}>Preferences & Numbering</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label className="input-label">Business Prefix</label>
                    <input className="input-field" value={invoiceSettings.businessPrefix} onChange={e => setInvoiceSettings({...invoiceSettings, businessPrefix: e.target.value})} placeholder="e.g. SHOP" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Default Series</label>
                    <input className="input-field" value={invoiceSettings.defaultSeries} onChange={e => setInvoiceSettings({...invoiceSettings, defaultSeries: e.target.value})} placeholder="e.g. INV" />
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Default Terms</label>
                  <textarea className="input-field" value={bizProfile.defaultTerms} onChange={e => setBizProfile({...bizProfile, defaultTerms: e.target.value})} rows={2} style={{ resize: 'vertical' }} />
                </div>
                <div className="input-group">
                  <label className="input-label">Default Notes</label>
                  <textarea className="input-field" value={bizProfile.defaultNotes} onChange={e => setBizProfile({...bizProfile, defaultNotes: e.target.value})} rows={2} style={{ resize: 'vertical' }} />
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: 'var(--text-sm)', cursor: 'pointer', marginBottom: '1.5rem' }}>
                  <input type="checkbox" checked={invoiceSettings.whiteLabelEnabled} onChange={e => setInvoiceSettings({...invoiceSettings, whiteLabelEnabled: e.target.checked})} style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-primary)' }} />
                  <div>
                    <span style={{ display: 'block', fontWeight: 600 }}>White-label Invoices (Premium)</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Remove "Generated by Cashtro" footer from PDFs</span>
                  </div>
                </label>

                <button className="btn btn-primary" onClick={saveInvoiceBranding} disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Branding'}
                </button>
              </>
            )}

            {tab === 'billing' && (
              <>
                <h3 className="section-heading">Subscription & Billing</h3>
                
                {aiCredits && (
                  <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', marginBottom: '2rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} color="var(--accent-primary)" /> AI Credits
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <span>{aiCredits.monthlyUsage || 0} used this month</span>
                      <span>{aiCredits.balance || 0} remaining balance</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, ((aiCredits.monthlyUsage || 0) / ((aiCredits.balance || 0) + (aiCredits.monthlyUsage || 0) || 1)) * 100)}%`, height: '100%', background: 'var(--accent-gradient)' }} />
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                      Lifetime usage: {aiCredits.lifetimeUsage || 0} credits
                    </p>
                  </div>
                )}

                <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: '1rem' }}>Available Plans</h4>
                
                {/* Billing Cycle Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '1.5rem', width: 'fit-content' }}>
                  {['weekly', 'monthly', 'yearly'].map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle as any)}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: billingCycle === cycle ? 'var(--bg-elevated)' : 'transparent',
                        color: billingCycle === cycle ? 'var(--text-primary)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: billingCycle === cycle ? 600 : 500,
                        cursor: 'pointer',
                        boxShadow: billingCycle === cycle ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        textTransform: 'capitalize'
                      }}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
                
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '1.5rem' }}>
                  {plans.length > 0 ? plans.map(plan => {
                    const isCurrent = user?.plan?.id === plan.id || user?.plan === plan.name.toUpperCase();
                    return (
                      <div key={plan.id} style={{ padding: '1.5rem', border: `2px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', position: 'relative', overflow: 'hidden' }}>
                        {isCurrent && (
                          <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--accent-primary)', color: 'white', padding: '0.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, borderBottomLeftRadius: 'var(--radius-sm)' }}>
                            CURRENT PLAN
                          </div>
                        )}
                        <h2 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                          {plan.name}
                        </h2>
                        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{plan.tagline || plan.description}</p>
                        
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.75rem' }}>
                          ₹{billingCycle === 'weekly' ? plan.priceWeekly || 0 : billingCycle === 'yearly' ? plan.priceYearly || 0 : plan.priceMonthly || 0}
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            /{billingCycle === 'yearly' ? 'yr' : billingCycle === 'weekly' ? 'wk' : 'mo'}
                          </span>
                        </h3>
                        
                        {plan.features && (
                          <div style={{ margin: '1rem 0 1.5rem 0' }}>
                            <ul style={{ padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0 }}>
                              {plan.features.slice(0, expandedPlans[plan.id] ? undefined : 5).map((pf: any, i: number) => {
                                const isAvailable = pf.value !== "false" && pf.value !== "0";
                                return (
                                  <li key={i} style={{ fontSize: 'var(--text-sm)', color: isAvailable ? 'var(--text-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textDecoration: isAvailable ? 'none' : 'line-through' }}>
                                    <CheckCircle size={16} color={isAvailable ? 'var(--success)' : 'var(--text-tertiary)'} style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{pf.feature?.name || pf.name || pf[0] || pf} {pf.value !== "true" && pf.value !== "false" ? `: ${pf.value}` : ""}</span>
                                  </li>
                                )
                              })}
                            </ul>
                            {plan.features.length > 5 && (
                              <button 
                                onClick={() => setExpandedPlans(p => ({...p, [plan.id]: !p[plan.id]}))}
                                style={{ background: 'none', border: 'none', padding: '0.75rem 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontWeight: 500 }}
                              >
                                {expandedPlans[plan.id] ? "Show less" : `Show ${plan.features.length - 5} more`}
                                {expandedPlans[plan.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            )}
                          </div>
                        )}

                        <button 
                          className="btn btn-primary" 
                          style={{ width: '100%', background: isCurrent ? 'var(--bg-tertiary)' : 'var(--accent-primary)', color: isCurrent ? 'var(--text-secondary)' : 'white' }}
                          disabled={isCurrent || saving}
                          onClick={() => handleSubscribe(plan)}
                        >
                          {isCurrent ? 'Current Plan' : 'Select Plan'}
                        </button>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                      Loading plans...
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => flash('Purchases restored successfully')}>Restore Purchases</button>
                </div>
              </>
            )}
            
            {tab === 'support' && (
              <>
                <h3 className="section-heading">Support & Documentation</h3>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Contact Support</h4>
                  <div className="input-group">
                    <label className="input-label">Type</label>
                    <select className="input-field" value={supportForm.type} onChange={e => setSupportForm({...supportForm, type: e.target.value})}>
                      <option value="contact_us">Contact Us / Ask a Question</option>
                      <option value="bug_report">Report a Bug</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Message</label>
                    <textarea className="input-field" value={supportForm.message} onChange={e => setSupportForm({...supportForm, message: e.target.value})} rows={4} placeholder="Describe your issue..." style={{ resize: 'vertical' }} />
                  </div>
                  <button className="btn btn-primary" onClick={submitSupportForm} disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Export Tax Data</h4>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Download a CSV of all your transactions for a specific financial year.</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ margin: 0, width: '150px' }}>
                      <label className="input-label">Year</label>
                      <input className="input-field" type="number" value={taxYear} onChange={e => setTaxYear(e.target.value)} />
                    </div>
                    <button className="btn btn-secondary" onClick={exportTaxReport} disabled={saving}>
                      <Download size={15} /> Export CSV
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Required Documents</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a href="/documents/privacy" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} target="_blank">Privacy Policy</a>
                    <a href="/documents/terms" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} target="_blank">Terms of Service</a>
                    <a href="/documents/cookie-policy" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} target="_blank">Cookie Policy</a>
                    <a href="/ai-usage" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} target="_blank">AI Usage Policy</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
