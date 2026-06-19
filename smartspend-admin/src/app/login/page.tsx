'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

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
      
      // Ensure the user is an ADMIN
      const role = res.data?.data?.user?.role;
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        setError('Unauthorized: You are not an admin.');
        setLoading(false);
        return;
      }

      const token = res.data?.data?.accessToken;
      if (token) {
        localStorage.setItem('adminToken', token);
        router.push('/');
      } else {
        setError('Login failed: No access token received.');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Network error: Unable to reach the server. Make sure the backend is running.');
      } else {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg[0] : (msg || 'Invalid email or password'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: '#F3F4F6', // Light gray background
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%', 
        maxWidth: '420px', 
        padding: '2.5rem',
        background: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        margin: '1rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '48px', height: '48px', background: '#2563EB', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>Cashtro Admin</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Enter your credentials to access the command center</p>
        </div>
        
        {error && (
          <div style={{ 
            background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', 
            padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', 
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' 
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cashtro.app"
              required
              style={{ 
                width: '100%', padding: '0.75rem 1rem', background: '#F9FAFB', 
                border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem',
                color: '#111827', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Password</label>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ 
                width: '100%', padding: '0.75rem 1rem', background: '#F9FAFB', 
                border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '0.95rem',
                color: '#111827', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#D1D5DB'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              marginTop: '0.5rem', width: '100%', padding: '0.875rem', 
              background: loading ? '#93C5FD' : '#2563EB', color: '#FFFFFF', 
              border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onMouseOver={(e) => { if(!loading) e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseOut={(e) => { if(!loading) e.currentTarget.style.background = '#2563EB'; }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
