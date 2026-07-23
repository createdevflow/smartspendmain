'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, FileText, BookOpen, PieChart, File, MessageCircle } from 'lucide-react';

const FEATURE_CARDS = [
  { id: '1', icon: FileText, title: 'Track Transactions', desc: 'Record every expense and income securely.', color: '#2D8CFF' },
  { id: '2', icon: BookOpen, title: 'Smart Cashbooks', desc: 'Separate personal, family, or business finances.', color: '#10B981' },
  { id: '3', icon: PieChart, title: 'Analytics & Reports', desc: 'Understand exactly where your money goes.', color: '#F59E0B' },
  { id: '4', icon: File, title: 'Professional Invoices', desc: 'Create GST-compliant invoices in seconds.', color: '#8B5CF6' },
  { id: '5', icon: MessageCircle, title: 'Secure Messaging', desc: 'Share reports and receipts with your team.', color: '#EC4899' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleNext = () => setStep(prev => prev + 1);

  const handleFinish = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenWelcome', 'true');
    }
    router.push('/dashboard');
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        
        {step === 0 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>👋</div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              Welcome to Cashtro
            </h1>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px' }}>
              Your personal financial command center. Manage your cashbooks, track wealth, and generate professional invoices all in one place.
            </p>
            <button onClick={handleNext} className="btn btn-primary btn-lg" style={{ width: '100%', marginBottom: '16px' }}>
              Get Started <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
            <button onClick={handleFinish} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontWeight: 500, cursor: 'pointer', padding: '12px' }}>
              Skip Tour
            </button>
          </div>
        )}

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
              Everything you need
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px' }}>
              Powerful tools designed for your financial success.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {FEATURE_CARDS.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: `${f.color}15`, color: f.color, flexShrink: 0 }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{f.title}</h3>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleNext} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', marginBottom: '24px' }}>
              <CheckCircle2 size={40} />
            </div>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
              You're all set!
            </h2>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px' }}>
              Thank you for choosing Cashtro. Let's take control of your finances together.
            </p>
            <button onClick={handleFinish} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
