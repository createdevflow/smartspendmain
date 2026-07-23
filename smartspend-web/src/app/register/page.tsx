'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation for password constraints (backend also does this)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { 
        fullName: fullName.trim(),
        email: email.trim(), 
        password 
      });
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err: any) {
      if (!err.response) {
        setError('Network error: Cannot reach the server.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Registration failed'));
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
        background: 'var(--bg-base)',
      }}
    >
      {/* Left brand panel — visible desktop only */}
      <div
        className="login-brand-panel"
        aria-hidden="true"
        style={{
          flex: '0 0 55%',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img 
          src="/login_banner.png" 
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
        <div style={{ padding: '40px 48px', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
          <img 
            src="/cashtro-logo.png" 
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
          background: 'var(--bg-base)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {/* Form header */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                lineHeight: '1.2',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: 'var(--space-1)',
              }}
            >
              Create an Account
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Join Cashtro and take control of your finances.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              style={{
                background: '#FEF2F2',
                border: '1px solid #DC2626',
                color: '#DC2626',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                marginBottom: 'var(--space-4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="register-fullname">
                Full Name
              </label>
              <input
                id="register-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                autoComplete="name"
                className="input-field"
              />
            </div>
          
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="register-email">
                Email Address
              </label>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input-field"
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="register-password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Creating Account…
                </>
              ) : (
                <>
                  Sign Up
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-6)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-4)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-tertiary)',
            }}
          >
            © {new Date().getFullYear()} Cashtro. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
