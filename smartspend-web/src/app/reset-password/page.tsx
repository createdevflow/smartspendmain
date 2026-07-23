'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp');
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (otpParam) setOtp(otpParam);
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      if (!err.response) {
        setError('Network error: Cannot reach the authentication server.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Failed to reset password'));
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
              Set New Password
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Enter the reset code sent to your email and your new password.
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
              <span>Password reset successful! Redirecting to login...</span>
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
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
                  readOnly={!!searchParams.get('email')}
                  className="input-field"
                  style={searchParams.get('email') ? { background: 'var(--bg-surface)' } : {}}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reset-otp">
                  Reset Code (OTP)
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  className="input-field"
                  style={{ letterSpacing: '2px' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="reset-new-password">
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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
                disabled={loading || !email || !otp || !newPassword}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 'var(--space-2)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Resetting…
                  </>
                ) : (
                  <>
                    Confirm New Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
