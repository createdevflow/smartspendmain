'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      if (!err.response) {
        setError('Network error: Cannot reach the authentication server.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Failed to request password reset'));
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
        {/* Illustration */}
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

        {/* Logo */}
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
              Reset your password
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Success */}
          {success && (
            <div
              role="alert"
              style={{
                background: '#F0FDF4',
                border: '1px solid #16A34A',
                color: '#16A34A',
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
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
              <span>We've sent a password reset link to your email. Please check your inbox.</span>
            </div>
          )}

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

          {!success && (
            <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reset-email">
                  Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Sending link…
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          <p
            style={{
              textAlign: 'center',
              marginTop: 'var(--space-6)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Remembered your password?{' '}
            <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Back to login
            </Link>
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
