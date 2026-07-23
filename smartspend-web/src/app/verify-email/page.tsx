'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertCircle, ArrowRight, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!email) {
      router.push('/login');
    } else {
      inputsRef.current[0]?.focus();
    }
  }, [email, router]);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^[0-9]$/.test(text)) return;
    
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus next
    if (text && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current is empty and backspace is pressed, focus previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus the next empty input, or the last one if all are filled
    const nextIndex = Math.min(pastedData.length, 5);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, otp: code });
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?message=Email+verified.+Please+login.');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'email_verify' });
      setSuccess('Verification code sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', marginBottom: '16px' }}>
            <Mail size={32} />
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Check your email
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            We sent a 6-digit verification code to<br />
            <strong>{email}</strong>
          </p>
        </div>

        {error && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #DC2626', color: '#DC2626', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="alert" style={{ background: '#F0FDF4', border: '1px solid #16A34A', color: '#16A34A', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '16px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputsRef.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                style={{
                  width: '48px',
                  height: '56px',
                  fontSize: '24px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface)',
                  border: `2px solid ${digit ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent-primary)';
                  e.target.select();
                }}
                onBlur={(e) => {
                  if (!otp[index]) e.target.style.borderColor = 'var(--border-color)';
                }}
              />
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Verifying...</>
            ) : (
              <>Verify Email <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Didn't receive the code?
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: 500,
              fontSize: 'var(--text-sm)',
              cursor: resending ? 'not-allowed' : 'pointer',
              opacity: resending ? 0.7 : 1,
            }}
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
