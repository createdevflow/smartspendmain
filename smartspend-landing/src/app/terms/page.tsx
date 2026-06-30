import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Cashtro Home
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            <FileText size={14} className="text-indigo-400" /> User Agreement
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Terms of Service</h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            Effective Date: June 28, 2026 · Version 2.4
          </p>
          <p className="text-slate-400 text-sm mt-4">
            Welcome to Cashtro. By downloading, accessing, or utilizing our mobile application, web platform, or associated APIs, you enter into a legally binding contract governed by these Terms of Service.
          </p>
        </div>

        {/* Quick Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {[
            { icon: <CheckCircle2 size={18} className="text-emerald-600" />, title: 'Acceptable Use', desc: 'Use Cashtro for lawful personal, family, or commercial accounting and financial planning.' },
            { icon: <AlertTriangle size={18} className="text-amber-600" />, title: 'No Financial Advice', desc: 'AI insights and automated charts are analytical tools, not professional fiduciary guidance.' },
            { icon: <CreditCard size={18} className="text-blue-600" />, title: 'Transparent Billing', desc: 'Pro subscriptions renew automatically unless canceled at least 24 hours prior to billing.' },
            { icon: <RefreshCw size={18} className="text-purple-600" />, title: 'Free Trials', desc: 'Eligible accounts receive full Pro access during trials without restrictive tease gates.' },
          ].map((r, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">{r.icon}</div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{r.title}</div>
                <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200/80 space-y-12 text-slate-700 leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">1. Account Registration & Eligibility</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              To utilize Cashtro, you must be at least 18 years of age (or the age of legal majority in your jurisdiction). When registering, you agree to provide truthful, accurate verification credentials. You are solely responsible for maintaining the confidentiality of your login sessions, device pins, and multi-factor authentication passcodes.
            </p>
          </section>

          <section id="subscriptions">
            <h2 className="text-2xl font-black text-slate-900 mb-4">2. Subscription Plans & Free Trial Terms</h2>
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                <strong>Freemium & Tease Mode:</strong> Cashtro provides a robust Free Plan granting access to essential personal transaction tracking. Certain advanced modules (such as AI Receipt Scanning, Gamification Burn Rate analytics, Tax Exports, and Shared Multi-User Cashbooks) may be presented in a locked "Freemium Tease Mode" allowing preview exploration prior to upgrading.
              </p>
              <p>
                <strong>Free Trials:</strong> New promotional user accounts may be granted an introductory Free Trial (e.g., 7 days). During an active Free Trial, all Freemium Tease restrictions are fully lifted, granting unhindered access to top-tier Pro features. Upon expiration of the trial period, access will automatically revert to standard Free tier gates unless an active subscription is initiated.
              </p>
            </div>
          </section>

          <section id="refunds">
            <h2 className="text-2xl font-black text-slate-900 mb-4">3. Payments, Billing & Refund Policy</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-sm space-y-3">
              <p>
                <strong>Payment Gateways:</strong> Pro subscriptions can be purchased weekly, monthly, or annually via supported merchant acquirers including Razorpay, Google Play In-App Billing, and Apple App Store StoreKit.
              </p>
              <p>
                <strong>Auto-Renewal:</strong> Subscription fees are billed at the beginning of each billing cycle. Subscriptions automatically renew unless disabled via your platform account settings (Google Play Subscriptions / Apple Apple ID Settings / Cashtro Billing Portal) at least 24 hours prior to the cycle expiration.
              </p>
              <p>
                <strong>Refunds & Cancellations:</strong> You may cancel recurring subscription renewals at any moment; your active feature access will persist until the conclusion of the paid period. For payments processed via Apple or Google mobile stores, refund eligibility is governed strictly by the respective merchant store refund policies. For direct Razorpay transactions, pro-rated refunds may be requested within 48 hours of accidental renewal by contacting support.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">4. Shared Cashbooks & Team Collaboration</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              Cashtro enables collaborative financial management through Shared Cashbooks. When inviting members (Administrators, Editors, or Viewers) to a cashbook:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1.5">
              <li>You expressly authorize invited participants to view, add, or edit financial records entries within that specific workspace.</li>
              <li>In-app Cashtro Chat messages exchanged inside shared cashbooks are visible to all current members of that specific ledger.</li>
              <li>Cashtro is not liable for interpersonal disputes, accounting discrepancies, or data modifications committed by co-members authorized by the cashbook owner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">5. Disclaimer of AI Financial Guidance</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Cashtro incorporates automated artificial intelligence ("Cashtro AI") to scan receipt images, categorize spending, and forecast burn rates. All AI-generated insights, summaries, and notifications are provided solely for convenience and informational awareness. They do NOT constitute formal tax advice, certified accounting audits, or fiduciary financial planning. Users are advised to verify critical financial calculations independently before making investment or tax-filing decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 mb-4">6. Limitation of Liability & Termination</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              We strive for 99.9% platform availability and employ robust automated data backups. However, to the maximum extent permitted by applicable law, Cashtro Inc. and its affiliates shall not be liable for indirect, incidental, or consequential damages resulting from network interruptions, force majeure events, or third-party API outages. We reserve the right to suspend or terminate user accounts demonstrated to engage in abusive scraping, reverse engineering, or fraudulent payment chargebacks.
            </p>
          </section>

          <section className="pt-6 border-t border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Legal Queries & Dispute Resolution</h3>
            <p className="text-sm text-slate-600">
              These Terms shall be governed by the applicable laws of the jurisdiction in which Cashtro operates. For legal notices or clarification regarding user agreements, please reach out to <a href="mailto:legal@cashtro.in" className="text-blue-600 font-semibold hover:underline">legal@cashtro.in</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
