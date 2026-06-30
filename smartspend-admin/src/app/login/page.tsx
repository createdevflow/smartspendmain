'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Shield, Key, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { emailOrPhone: email.trim(), password });
      
      const role = res.data?.data?.user?.role;
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        setError('Unauthorized: Administrator access required.');
        setLoading(false);
        return;
      }

      const token = res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem('adminToken', token);
        router.push('/');
      } else {
        setError('Login failed: Invalid credentials.');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Network error: Cannot reach the authentication server.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Invalid email or password'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, minHeight: '100vh', background: '#F5F7FB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Left side - Brand / Marketing */}
      <div style={{ 
        flex: '0 0 50%', 
        width: '50%',
        flexDirection: 'column', 
        justifyContent: 'space-between',
        padding: '3rem',
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #E5E7EB'
      }} className="lg-flex">
        
        {/* Background decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4rem' }}>
            <img src="/admin/cashtro-logo.png" alt="Cashtro Logo" style={{ height: '36px', objectFit: 'contain' }} />
          </div>

          <div style={{ maxWidth: '480px' }}>
            <h1 style={{ color: '#111827', fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
              Command Center for <br />
              <span style={{ color: '#2563EB' }}>Modern Finance</span>
            </h1>
            <p style={{ color: '#6B7280', fontSize: '1.125rem', lineHeight: 1.6, fontWeight: 400 }}>
              Monitor transactions, manage users, and configure feature toggles across the entire Cashtro ecosystem securely.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} Cashtro. All rights reserved.</p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div style={{ 
        flex: '0 0 50%',
        width: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        background: '#F5F7FB',
        position: 'relative'
      }}>
        
        <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
          
          <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', marginBottom: '1.25rem' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem', margin: 0 }}>Please enter your administrator credentials to proceed.</p>
          </div>
          
          {error && (
            <div style={{ 
              background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', 
              padding: '1rem', borderRadius: '12px', fontSize: '0.875rem', 
              marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' 
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: 1.4 }}>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cashtro.app"
                  required
                  style={{ 
                    width: '100%', padding: '0.875rem 1rem', background: '#F9FAFB', 
                    border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.95rem',
                    color: '#111827', outline: 'none', transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>Password</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ 
                    width: '100%', padding: '0.875rem 1rem', background: '#F9FAFB', 
                    border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '0.95rem',
                    color: '#111827', outline: 'none', transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#FFFFFF'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.background = '#F9FAFB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                marginTop: '0.5rem', width: '100%', padding: '0.875rem', 
                background: loading ? '#60A5FA' : '#2563EB', 
                color: '#FFFFFF', border: 'none', borderRadius: '12px', 
                fontSize: '1rem', fontWeight: 600, letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
              onMouseOver={(e) => { if(!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = '#1D4ED8'; } }}
              onMouseOut={(e) => { if(!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#2563EB'; } }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Secure Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          
        </div>
      </div>
      
      {/* Global styles for utility classes */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1023px) {
          .lg-flex { display: none !important; }
        }
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
