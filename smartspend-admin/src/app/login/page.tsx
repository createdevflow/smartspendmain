'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Shield, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
        if (rememberMe) {
          localStorage.setItem('adminToken', token);
        } else {
          sessionStorage.setItem('adminToken', token);
        }
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
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background: 'var(--canvas)',
      }}
    >
      {/* Left brand panel — visible desktop only */}
      <div
        className="login-brand-panel"
        aria-hidden="true"
        style={{
          flex: '0 0 55%',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Illustration */}
        <img 
          src="/admin/login_banner.png" 
          alt="" 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            zIndex: 1
          }} 
        />

        {/* Logo */}
        <div style={{ padding: '40px 48px', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <img 
            src="/admin/cashtro-logo.png" 
            alt="Cashtro" 
            style={{ 
              height: '48px', 
              width: 'auto', 
              objectFit: 'contain' 
            }} 
          />
        </div>
      </div>

      {/* Right form panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          background: 'var(--canvas)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Form header */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>

            <h2
              style={{
                fontSize: 'var(--type-page-title)',
                lineHeight: 'var(--lh-page-title)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--sp-1)',
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: 'var(--type-body)', color: 'var(--text-secondary)' }}>
              Enter your administrator credentials to continue.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: 'var(--sp-3)',
                borderRadius: 'var(--radius-btn)',
                fontSize: 'var(--type-body)',
                fontWeight: 500,
                marginBottom: 'var(--sp-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--sp-2)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cashtro.app"
                required
                autoComplete="email"
                className="input-field"
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="login-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-field"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: 'var(--brand-blue)',
                }}
              />
              <label 
                htmlFor="remember-me" 
                style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--sp-2)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Authenticating…
                </>
              ) : (
                <>
                  Secure Sign In
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--sp-6)',
              fontSize: 'var(--type-caption)',
              color: 'var(--text-muted)',
            }}
          >
            © {new Date().getFullYear()} Cashtro. All systems secure.
          </p>
        </div>
      </div>

      {/* Hide brand panel below 1024px */}
      <style>{`
        @media (max-width: 1023px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
