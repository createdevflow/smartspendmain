import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox, Table } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — Cashtro',
  description: 'Understand how Cashtro collects, uses, protects, and manages your personal and financial data. Compliant with India\'s DPDP Act 2023 and IT Act 2000.',
};

const TOC = [
  { id: 'definitions', label: '1. Definitions' },
  { id: 'data-collected', label: '2. Data We Collect' },
  { id: 'why-collected', label: '3. Why We Collect' },
  { id: 'what-we-dont-do', label: '4. What We Never Do' },
  { id: 'ai-data', label: '5. AI & Data Safety' },
  { id: 'third-party', label: '6. Third-Party Services' },
  { id: 'user-rights', label: '7. Your Rights' },
  { id: 'data-security', label: '8. Data Security' },
  { id: 'data-retention', label: '9. Retention' },
  { id: 'children', label: '10. Children\'s Privacy' },
  { id: 'changes', label: '11. Changes to Policy' },
  { id: 'contact', label: '12. Contact Us' },
];

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="At Cashtro, your privacy is not an afterthought — it is foundational to how we build our financial operating system. This policy details exactly what data we collect, why we collect it, and the comprehensive measures we take to protect it."
      badge="🔐 Data Safety & Privacy — India DPDP Compliant"
      badgeColor="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="privacy"
      toc={TOC}
    >
      <Section id="definitions" number={1} color="bg-blue-50 text-blue-600" title="Definitions">
        <p>Throughout this policy, the following terms carry the meanings described below:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>"Cashtro", "we", "our", "us"</strong> — Cashtro and its parent company, operators, and affiliates offering the Cashtro platform.</li>
          <li><strong>"Platform"</strong> — The Cashtro mobile application (Android & iOS), web application, admin portal, and associated APIs.</li>
          <li><strong>"User", "you"</strong> — Any individual who creates an account or uses the Platform.</li>
          <li><strong>"Personal Data"</strong> — Any information that directly or indirectly identifies you as an individual.</li>
          <li><strong>"Financial Data"</strong> — Transactions, cashbooks, budgets, goals, invoices, receipts, and other financial records you enter into the Platform.</li>
          <li><strong>"Processing"</strong> — Any operation performed on data including collection, storage, analysis, sharing, or deletion.</li>
          <li><strong>"Consent"</strong> — A freely given, specific, informed, and unambiguous indication of your agreement to data processing.</li>
          <li><strong>"DPDP Act"</strong> — India's Digital Personal Data Protection Act, 2023.</li>
        </ul>
      </Section>

      <Section id="data-collected" number={2} color="bg-indigo-50 text-indigo-600" title="Information We Collect">
        <SubSection title="A. Account & Identity Information">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Full name, email address, phone number (for OTP verification)</li>
            <li>Hashed & salted passwords (we never store plaintext passwords)</li>
            <li>Profile photo (optional, uploaded by you)</li>
            <li>Business name, GSTIN, PAN number (optional, for GST invoicing features)</li>
            <li>Registered address (for invoice generation)</li>
          </ul>
        </SubSection>

        <SubSection title="B. Financial Records (Entered by You)">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Transactions — amounts, dates, notes, categories, payment modes</li>
            <li>Cashbook titles, descriptions, and member invitations</li>
            <li>Budget limits, goal names, target amounts, and deadlines</li>
            <li>Invoice details — items, quantities, tax rates, client information</li>
            <li>Receipt images and documents (encrypted in your private vault)</li>
            <li>Notes and comments attached to transactions</li>
            <li>Chat messages within shared cashbooks</li>
            <li>Scheduler rules and automation configurations</li>
          </ul>
        </SubSection>

        <SubSection title="C. Usage & Technical Data">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Device type, operating system, app version</li>
            <li>Browser type and version (web users)</li>
            <li>IP address (for authentication security)</li>
            <li>Push notification tokens (FCM/APNs)</li>
            <li>Session identifiers and JWT tokens</li>
            <li>Crash logs and error reports (stripped of financial content)</li>
            <li>Feature usage analytics (which features are used, frequency)</li>
          </ul>
        </SubSection>

        <SubSection title="D. Cookies & Local Storage">
          <p>We use cookies and browser local storage to maintain your session, remember your preferences (theme, language, dashboard layout), and for analytics. See our <a href="/documents/cookie-policy" className="text-blue-600 underline">Cookie Policy</a> for full details.</p>
        </SubSection>

        <SubSection title="E. AI & Receipt Scanning Data">
          <p>When you use AI-powered features (receipt scanning, smart categorization, financial insights), receipt images and transaction context are temporarily processed by AI services. Images are processed ephemerally unless you explicitly save them to your account. See Section 5 for full AI data safety details.</p>
        </SubSection>
      </Section>

      <Section id="why-collected" number={3} color="bg-purple-50 text-purple-600" title="Why We Collect Your Data">
        <Table
          headers={['Purpose', 'Data Used', 'Legal Basis']}
          rows={[
            ['Account creation & authentication', 'Name, email, phone, password', 'Contract performance'],
            ['Cloud sync & cross-device access', 'All user-entered data', 'Contract performance'],
            ['Invoice & GST report generation', 'PAN, GSTIN, business info', 'Contract performance'],
            ['AI-powered financial insights', 'Anonymized transaction patterns', 'Consent'],
            ['Push notifications & email alerts', 'Notification tokens, email', 'Consent'],
            ['Fraud prevention & security', 'IP, device, session data', 'Legitimate interest'],
            ['Scheduler & automation', 'Scheduler rules, timing data', 'Contract performance'],
            ['Customer support', 'Account info, support ticket content', 'Contract performance'],
            ['Product improvement & analytics', 'Anonymized usage data', 'Legitimate interest'],
            ['Legal compliance', 'Identity, financial records (if ordered)', 'Legal obligation'],
          ]}
        />
      </Section>

      <Section id="what-we-dont-do" number={4} color="bg-red-50 text-red-600" title="What Cashtro Does Not Do">
        <InfoBox type="success">
          <strong>Our Non-Negotiable Commitments to You:</strong>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>✅ We do <strong>NOT</strong> sell, rent, or auction your personal information to third parties.</li>
            <li>✅ We do <strong>NOT</strong> sell your financial transaction data to advertisers, data brokers, or analytics firms.</li>
            <li>✅ We do <strong>NOT</strong> publicly expose your private transactions, cashbooks, or financial records.</li>
            <li>✅ We do <strong>NOT</strong> use your private financial records to train public AI models.</li>
            <li>✅ We do <strong>NOT</strong> share your data with third parties except as strictly necessary to provide the services you requested, or where required by law.</li>
            <li>✅ We do <strong>NOT</strong> allow advertising networks to track you across the Platform.</li>
            <li>✅ We do <strong>NOT</strong> share your data with government agencies without a valid court order or legal mandate, except as required under applicable Indian law.</li>
          </ul>
        </InfoBox>
      </Section>

      <Section id="ai-data" number={5} color="bg-violet-50 text-violet-600" title="AI Features & Data Safety">
        <InfoBox type="info">
          <strong>⚡ Special Disclosure — AI Processing:</strong>
          <p className="mt-2">Cashtro uses AI to power receipt scanning, smart categorization, financial insights, and chat assistant features. Here is exactly how your data is handled in AI workflows:</p>
        </InfoBox>

        <SubSection title="Receipt & Document Scanning">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Images are transmitted via encrypted TLS connections to AI processing services (e.g., Google Gemini Vision API).</li>
            <li><strong>Ephemeral Processing:</strong> Images are analyzed only to extract structured fields (merchant, date, amount, tax). They are discarded immediately after extraction unless you explicitly choose to save them.</li>
            <li><strong>No Model Training:</strong> Your private receipts and financial documents are NEVER used to train, fine-tune, or improve any public AI model.</li>
          </ul>
        </SubSection>

        <SubSection title="Financial Insights & Smart Categorization">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Transaction patterns are analyzed to generate personalized insights, budget alerts, and spending summaries.</li>
            <li>AI insights are informational only — they do not constitute financial advice.</li>
            <li>Aggregated, anonymized data may be used to improve our own internal categorization models.</li>
          </ul>
        </SubSection>

        <SubSection title="AI Chat Assistant">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Conversations with the AI assistant are processed to provide responses. Conversation history is stored in your account for continuity.</li>
            <li>AI providers process queries under their own privacy policies (see Section 6) with data processing agreements in place.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="third-party" number={6} color="bg-amber-50 text-amber-600" title="Third-Party Services & Data Sharing">
        <p>We use trusted sub-processors to provide our services. Each receives only the minimum data necessary for their function:</p>
        <Table
          headers={['Service', 'Purpose', 'Data Shared']}
          rows={[
            ['Cloud Infrastructure (AWS/Hetzner)', 'Hosting encrypted databases & storage', 'All encrypted user data'],
            ['Email Provider (SendGrid/AWS SES)', 'Transactional emails, OTPs, reports', 'Email address, notification content'],
            ['Push Notifications (FCM/APNs)', 'Mobile push notifications', 'Device token, notification payload'],
            ['AI Services (Google Gemini API)', 'Receipt scanning, insights', 'Receipt images (ephemeral), anonymized patterns'],
            ['Payment Gateway (Razorpay)', 'Subscription payments', 'Name, email, phone, transaction amount'],
            ['Analytics (Internal)', 'Product improvement', 'Anonymized usage metrics only'],
          ]}
        />
        <InfoBox type="warning">
          <strong>Note:</strong> All sub-processors are bound by data processing agreements ensuring they handle your data in accordance with applicable privacy laws and our security standards. They are not permitted to use your data for their own commercial purposes.
        </InfoBox>
      </Section>

      <Section id="user-rights" number={7} color="bg-emerald-50 text-emerald-600" title="Your Rights Under DPDP Act 2023">
        <p>Under India's Digital Personal Data Protection Act 2023 and principles of data sovereignty, you have the following rights:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { right: '📄 View Your Data', desc: 'Access all personal and financial data stored in your account at any time.' },
            { right: '✏️ Correct Information', desc: 'Update incorrect personal information directly from your Profile Settings.' },
            { right: '📥 Download & Export', desc: 'Export transactions as CSV/PDF, download invoices, and request a full data copy.' },
            { right: '🗑️ Delete Account', desc: 'Permanently delete your account and all associated data from Settings &gt; Account &gt; Delete.' },
            { right: '🔕 Withdraw Consent', desc: 'Opt out of non-essential data processing such as analytics and AI features.' },
            { right: '📵 Manage Notifications', desc: 'Control all push, email, and in-app notification preferences granularly.' },
            { right: '🍪 Manage Cookies', desc: 'Accept or decline non-essential cookies from our Cookie Preference Center.' },
            { right: '📋 Nominate a Representative', desc: 'Under DPDP, you may nominate a person to exercise rights on your behalf.' },
          ].map(({ right, desc }) => (
            <div key={right} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">{right}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">To exercise any right, email us at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline font-medium">legal@cashtro.in</a>. We will respond within <strong>30 days</strong> as required by applicable law. Account deletion requests are processed within 30 days, after which personal identifiers are permanently purged.</p>
      </Section>

      <Section id="data-security" number={8} color="bg-sky-50 text-sky-600" title="Data Security Measures">
        <p>We implement industry-standard technical and organizational security measures to protect your data:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { label: '🔒 AES-256 Encryption', desc: 'All sensitive data fields (passwords, PAN, GSTIN, financial records) are encrypted at rest.' },
            { label: '🌐 TLS 1.3 in Transit', desc: 'All data transmitted between your device and our servers is protected by TLS 1.3 encryption.' },
            { label: '🔑 Secure Authentication', desc: 'JWT-based session tokens, refresh token rotation, and optional two-factor authentication.' },
            { label: '🚦 Rate Limiting', desc: 'Brute-force protection on all authentication endpoints with automated lockout.' },
            { label: '📊 Audit Logging', desc: 'All administrative access and sensitive operations are logged with immutable audit trails.' },
            { label: '🗂️ Access Controls', desc: 'Strict role-based access controls (RBAC) ensure staff can only access data necessary for their function.' },
            { label: '💾 Automated Backups', desc: 'Encrypted daily backups with point-in-time recovery capabilities.' },
            { label: '🔍 Monitoring', desc: 'Continuous infrastructure monitoring for anomalies, intrusions, and unauthorized access attempts.' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900 text-xs mb-1">{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <InfoBox type="info">
          Despite our best efforts, no system is 100% impenetrable. If you discover a security vulnerability, please report it responsibly to <a href="mailto:legal@cashtro.in" className="text-blue-700 underline font-medium">legal@cashtro.in</a>. See our <a href="/security-policy" className="text-blue-700 underline">Security Policy</a> for responsible disclosure guidelines.
        </InfoBox>
      </Section>

      <Section id="data-retention" number={9} color="bg-slate-100 text-slate-600" title="Data Retention">
        <p>We retain your data only as long as necessary to provide our services or as required by law. See our full <a href="/data-retention" className="text-blue-600 underline">Data Retention Policy</a> for complete details.</p>
        <Table
          headers={['Data Category', 'Retention Period', 'Reason']}
          rows={[
            ['Account & identity info', 'Until account deletion + 30 days', 'Service provision'],
            ['Financial records & transactions', 'Until deletion request or 7 years (GST)', 'Legal compliance (GST Act)'],
            ['Invoices & GST records', '7 years from invoice date', 'Indian tax law requirement'],
            ['Chat messages', 'Until deletion request', 'User preference'],
            ['Crash logs & technical data', '90 days', 'Debugging & quality'],
            ['Support tickets', '3 years after closure', 'Dispute resolution'],
            ['Anonymized analytics', 'Indefinitely (not personal data)', 'Product improvement'],
          ]}
        />
      </Section>

      <Section id="children" number={10} color="bg-pink-50 text-pink-600" title="Children's Privacy">
        <p>Cashtro is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has created an account, we will take steps to delete the account and associated data promptly. If you believe a minor's data has been collected, contact us at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a>.</p>
      </Section>

      <Section id="changes" number={11} color="bg-orange-50 text-orange-600" title="Changes to This Policy">
        <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Update the "Last Updated" date at the top of this page.</li>
          <li>Send an in-app notification and/or email to registered users.</li>
          <li>In cases of significant changes affecting your rights, seek your renewed consent.</li>
        </ul>
        <p>Continued use of the Platform after changes take effect constitutes acceptance of the revised policy.</p>
      </Section>

      <Section id="contact" number={12} color="bg-blue-50 text-blue-600" title="Contact Our Privacy Officer">
        <p>For privacy-related inquiries, data requests, or complaints:</p>
        <div className="mt-4 p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-4">Cashtro Privacy & Grievance Officer</p>
          <div className="space-y-2 text-sm">
            <p>📧 <strong>Privacy Requests:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>🔒 <strong>Security Concerns:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>⚖️ <strong>Legal & Compliance:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>📞 <strong>Support:</strong> <a href="mailto:support@cashtro.in" className="text-blue-600 underline">support@cashtro.in</a></p>
            <p>⏱️ <strong>Response Time:</strong> Within 30 days for formal data requests; within 72 hours for security incidents.</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">If you are not satisfied with our response, you may approach the appropriate Data Protection Board as constituted under the DPDP Act 2023 once operational.</p>
      </Section>
    </LegalLayout>
  );
}
