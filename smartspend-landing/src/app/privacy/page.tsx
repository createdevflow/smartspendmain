import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Server, Cpu, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cashtro Home
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield size={14} className="text-blue-400" /> Data Safety & Privacy Disclosure
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Effective Date: June 28, 2026 · Last Updated: June 28, 2026
          </p>
          <p className="text-slate-400 text-sm mt-4">
            At Cashtro ("we", "our", or "us"), your privacy is our foundational promise. This Privacy Policy details how we collect, use, encrypt, store, and protect your financial and personal data across our web, mobile (Android/iOS), and AI services.
          </p>
        </div>

        {/* Highlights Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: <Lock size={20} className="text-blue-600" />, title: 'Zero Data Selling', desc: 'We never sell, rent, or monetize your financial transaction history or personal identity.' },
            { icon: <Cpu size={20} className="text-purple-600" />, title: 'AI OCR Safety', desc: 'Receipt photos are processed via secure ephemeral memory for OCR extraction and never used to train public models.' },
            { icon: <Server size={20} className="text-emerald-600" />, title: 'AES-256 Encryption', desc: 'All financial logs, session tokens, and passwords are encrypted in transit (TLS 1.3) and at rest.' },
          ].map((h, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-1">{h.icon}</div>
              <div className="font-bold text-slate-900 text-base">{h.title}</div>
              <div className="text-slate-500 text-xs leading-relaxed">{h.desc}</div>
            </div>
          ))}
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/80 space-y-12 text-slate-700 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              Information We Collect
            </h2>
            <p className="mb-4">To provide seamless financial tracking, cashbook management, and AI assistance, we collect two types of information:</p>
            <div className="space-y-4 pl-4 border-l-2 border-blue-100">
              <div>
                <strong className="text-slate-900">A. Personal Account Information:</strong>
                <p className="text-sm text-slate-600 mt-1">When you register or authenticate, we collect your full name, email address, phone number (if provided for OTP verification), device platform identifier, and hashed passwords.</p>
              </div>
              <div>
                <strong className="text-slate-900">B. Financial & Transactional Data:</strong>
                <p className="text-sm text-slate-600 mt-1">Information you explicitly log into Cashtro, including transaction amounts, merchant names, categories, cashbook titles, budgets, savings goals, and shared cashbook participant designations.</p>
              </div>
              <div>
                <strong className="text-slate-900">C. Technical & Device Metadata:</strong>
                <p className="text-sm text-slate-600 mt-1">We log IP addresses, browser/app user agents, device OS versions, and secure JWT session tokens to prevent unauthorized account access and brute-force attacks.</p>
              </div>
            </div>
          </section>

          <section id="data-safety">
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
              AI Receipt Scanner & OCR Data Safety
            </h2>
            <div className="bg-purple-50/60 rounded-2xl p-6 border border-purple-100 mb-4">
              <p className="text-sm text-purple-900 font-medium mb-2">
                ⚡ Special Disclosure for App Store & Google Play Compliance regarding AI Scanning:
              </p>
              <ul className="list-disc list-inside text-xs text-purple-800 space-y-1.5">
                <li>When you use the AI Receipt Scanner, images captured via camera or uploaded from your gallery are transmitted over encrypted TLS connections directly to our OCR processing engine (powered by enterprise API integrations such as Google Gemini Vision).</li>
                <li><strong>Ephemeral Processing:</strong> Images are analyzed solely to extract structured data (Merchant, Date, Amount, Tax, Warranty). Unless you explicitly choose to attach and save the image to your transaction record in your private cloud vault, the image is discarded immediately after processing.</li>
                <li><strong>No Model Training:</strong> Your private financial receipts and invoice data are strictly isolated and are NEVER used to train, fine-tune, or improve public AI models.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">3</span>
              How We Use Your Data
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600">
              <li><strong>Core Functionality:</strong> To maintain your ledgers, calculate real-time cashflow balances, and synchronize shared cashbooks across collaborative team members.</li>
              <li><strong>Personalized AI Insights:</strong> To generate weekly anomaly alerts, spending burn-rate warnings, and budgeting suggestions tailored to your historical categories.</li>
              <li><strong>Subscription & Billing:</strong> To verify active Pro memberships or Freemium Tease access grants via payment gateways (Razorpay, App Store In-App Purchases, Google Play Billing).</li>
              <li><strong>Security & Communication:</strong> To dispatch OTP verification codes, security alerts, and critical system notifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">4</span>
              Data Sharing & Sub-Processors
            </h2>
            <p className="text-sm text-slate-600 mb-3">We adhere to a strict Principle of Least Privilege. We do not sell or broker your data. We share limited encrypted tokens with regulated sub-processors solely for service fulfillment:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Payment Gateways (Razorpay / Apple / Google):</strong> Process subscription purchases. We never store raw credit card numbers or banking CVVs.
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <strong>Cloud Infrastructure (AWS / PostgreSQL):</strong> Hosts encrypted databases with strict network firewalls and automated disaster recovery backups.
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">5</span>
              User Rights & Account Deletion
            </h2>
            <p className="text-sm text-slate-600 mb-3">You retain full sovereignty over your personal data under global data privacy frameworks (including GDPR compliance principles and India DDP rules):</p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
              <li><strong>Right to Export:</strong> You can export your full transaction ledger into CSV/PDF passbook formats directly within the application settings at any time.</li>
              <li><strong>Right to Erasure (Account Deletion):</strong> You can permanently delete your account directly from Profile Settings or by emailing support. Upon triggering deletion, all active session tokens are revoked, personal identification is wiped, and associated transaction data is purged or permanently anonymized within 30 days.</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Contacting Our Privacy Officer</h3>
            <p className="text-sm text-slate-600">
              If you have inquiries, privacy requests, or vulnerability reports, please reach out directly to our dedicated security team at <a href="mailto:privacy@cashtro.in" className="text-blue-600 font-semibold hover:underline">privacy@cashtro.in</a> or <a href="mailto:support@cashtro.in" className="text-blue-600 font-semibold hover:underline">support@cashtro.in</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
