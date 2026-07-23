import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox, Table } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Cashtro',
  description: 'Read the Terms & Conditions governing your use of Cashtro — a financial operating system for personal and business finance, invoicing, AI, and cloud sync.',
};

const TOC = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'eligibility', label: '2. Eligibility' },
  { id: 'account', label: '3. Account Registration' },
  { id: 'acceptable-use', label: '4. Acceptable Use' },
  { id: 'financial-records', label: '5. Financial Records' },
  { id: 'ai-features', label: '6. AI Features' },
  { id: 'chat-messaging', label: '7. Chat & Messaging' },
  { id: 'invoicing', label: '8. Invoicing & GST' },
  { id: 'plans-pricing', label: '9. Plans & Pricing' },
  { id: 'payments-refunds', label: '10. Payments & Refunds' },
  { id: 'suspension', label: '11. Suspension & Termination' },
  { id: 'intellectual-property', label: '12. Intellectual Property' },
  { id: 'disclaimers', label: '13. Disclaimers' },
  { id: 'liability', label: '14. Limitation of Liability' },
  { id: 'governing-law', label: '15. Governing Law' },
  { id: 'changes', label: '16. Changes to Terms' },
  { id: 'contact', label: '17. Contact' },
];

export default function TermsAndConditions() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="These Terms and Conditions constitute a legally binding agreement between you and Cashtro governing your access to and use of the Cashtro financial operating system across all platforms."
      badge="📜 User Agreement — Effective July 20, 2026"
      badgeColor="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="terms"
      toc={TOC}
    >
      <Section id="acceptance" number={1} color="bg-indigo-50 text-indigo-600" title="Acceptance of Terms">
        <p>By downloading, installing, accessing, or using the Cashtro mobile application, web platform, or any associated services, you agree to be bound by these Terms and Conditions, our <a href="/documents/privacy" className="text-blue-600 underline">Privacy Policy</a>, and all other policies referenced herein.</p>
        <p>If you do not agree with any part of these Terms, you must immediately discontinue use of the Platform. Continued use after any updates to these Terms constitutes acceptance of the revised Terms.</p>
        <InfoBox type="warning">
          <strong>Important:</strong> These Terms constitute a legal contract. Please read them carefully. If you are using Cashtro on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
        </InfoBox>
      </Section>

      <Section id="eligibility" number={2} color="bg-blue-50 text-blue-600" title="Eligibility">
        <p>To use Cashtro, you must:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Be at least <strong>18 years of age</strong> or the age of legal majority in your jurisdiction.</li>
          <li>Have the legal capacity to enter into a binding contract.</li>
          <li>Not be prohibited from receiving or using financial technology services under applicable Indian or international law.</li>
          <li>Not have a previously terminated Cashtro account, unless re-registration has been expressly authorized by Cashtro.</li>
        </ul>
        <p className="mt-3">Cashtro reserves the right to verify eligibility at any time and to refuse or terminate service where eligibility requirements are not met.</p>
      </Section>

      <Section id="account" number={3} color="bg-purple-50 text-purple-600" title="Account Registration & Security">
        <SubSection title="Registration">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must provide accurate, complete, and current information during registration.</li>
            <li>You are responsible for maintaining the accuracy of your account information.</li>
            <li>You may only create one primary personal account. Business accounts may be created with appropriate plan subscriptions.</li>
          </ul>
        </SubSection>
        <SubSection title="Account Security">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You are solely responsible for maintaining the confidentiality of your credentials.</li>
            <li>You must immediately notify Cashtro of any unauthorized account access at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a>.</li>
            <li>Cashtro will not be liable for losses resulting from unauthorized access due to your failure to protect your credentials.</li>
            <li>Sharing your account credentials with others is prohibited and may result in account suspension.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="acceptable-use" number={4} color="bg-emerald-50 text-emerald-600" title="Acceptable Use Policy">
        <p>You agree to use Cashtro only for lawful purposes and in accordance with these Terms. You expressly agree <strong>NOT</strong> to:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            'Use the Platform for any illegal financial activity including money laundering, fraud, or tax evasion',
            'Attempt to reverse engineer, decompile, or extract source code from the Platform',
            'Scrape, harvest, or systematically extract data from the Platform without authorization',
            'Use automated bots or scripts to interact with the Platform',
            'Attempt to gain unauthorized access to other user accounts or data',
            'Upload malware, viruses, or any malicious code',
            'Impersonate any person or entity or misrepresent your affiliation',
            'Use the Platform to transmit unsolicited commercial communications (spam)',
            'Interfere with or disrupt the Platform\'s infrastructure or servers',
            'Post or share illegal, defamatory, or harmful content in chat or blog features',
          ].map((item, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800">
              <span className="shrink-0">🚫</span><span>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-4">Violations of this Acceptable Use Policy may result in immediate account suspension or termination without notice or refund.</p>
      </Section>

      <Section id="financial-records" number={5} color="bg-amber-50 text-amber-600" title="Financial Records & Accuracy">
        <p>Cashtro is a financial record-keeping tool. With respect to financial records:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>You are solely responsible for the accuracy, completeness, and legality of all financial data you enter into the Platform.</li>
          <li>Cashtro does not verify, audit, or validate the financial records you enter.</li>
          <li>The Platform is not a substitute for professional accounting, tax advisory, or financial planning services.</li>
          <li>Financial records stored in Cashtro are for your personal or business record-keeping convenience. Cashtro makes no representations about the suitability of these records for legal, tax, or audit purposes.</li>
          <li>You are responsible for ensuring your records comply with applicable accounting standards, tax laws, and regulatory requirements.</li>
        </ul>
      </Section>

      <Section id="ai-features" number={6} color="bg-violet-50 text-violet-600" title="AI Features — Disclaimer">
        <InfoBox type="warning">
          <strong>🤖 Important AI Disclaimer:</strong> Cashtro's AI features — including smart categorization, financial insights, budget suggestions, receipt scanning, and AI chat — are informational tools only. They do NOT constitute professional financial, tax, investment, or legal advice.
        </InfoBox>
        <p className="mt-4">Specifically:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>AI-generated insights are based on patterns in your data and may contain errors or inaccuracies.</li>
          <li>Do not make material financial decisions solely based on AI suggestions without consulting a qualified professional.</li>
          <li>AI features are provided "as is" and may be modified, updated, or discontinued at any time.</li>
          <li>You are responsible for verifying AI-extracted receipt data before saving it to your records.</li>
        </ul>
      </Section>

      <Section id="chat-messaging" number={7} color="bg-sky-50 text-sky-600" title="Chat & Messaging">
        <p>Cashtro includes secure messaging features within shared cashbooks and direct messaging. When using these features:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>You are responsible for all content you send through the Platform's messaging features.</li>
          <li>Messages within shared cashbooks are visible to all members of that cashbook.</li>
          <li>You must comply with our <a href="/community-guidelines" className="text-blue-600 underline">Community Guidelines</a> in all communications.</li>
          <li>Cashtro reserves the right to review flagged messages for safety and compliance purposes.</li>
          <li>Do not share sensitive financial credentials (passwords, PINs, OTPs) through chat messages.</li>
        </ul>
      </Section>

      <Section id="invoicing" number={8} color="bg-orange-50 text-orange-600" title="Invoicing & GST Features">
        <p>Cashtro provides tools to generate professional GST-compliant invoices. Important terms apply:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>You are solely responsible for the accuracy of all invoice data including GSTIN, HSN codes, tax rates, and line items.</li>
          <li>Cashtro's invoice generator is a formatting tool — it does not validate GSTIN numbers against government databases in real-time unless explicitly stated.</li>
          <li>You are responsible for ensuring compliance with the Goods and Services Tax Act and associated rules.</li>
          <li>Cashtro is not liable for incorrect GST calculations resulting from erroneous data you enter.</li>
          <li>Invoice numbering sequences are managed by you; Cashtro is not responsible for invoice number conflicts or compliance gaps.</li>
          <li>See our full <a href="/invoice-disclaimer" className="text-blue-600 underline">Invoice & Tax Disclaimer</a> for complete terms.</li>
        </ul>
      </Section>

      <Section id="plans-pricing" number={9} color="bg-teal-50 text-teal-600" title="Plans, Pricing & Credits">
        <SubSection title="Free Plan">
          <p>Cashtro offers a free tier with core personal finance features. Certain advanced features are available only on paid plans.</p>
        </SubSection>
        <SubSection title="Premium Plans">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Premium features are available via monthly or annual subscription plans.</li>
            <li>Plan features, pricing, and included limits are detailed on our Pricing page and may change with advance notice.</li>
            <li>Premium plan access begins immediately upon successful payment.</li>
          </ul>
        </SubSection>
        <SubSection title="Credits System">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Cashtro Credits are virtual credits that may be used for specific premium features or AI usage.</li>
            <li>Credits have no monetary value and cannot be exchanged for cash.</li>
            <li>Unused credits may expire as per the terms applicable at the time of grant.</li>
            <li>Credits are non-transferable between accounts.</li>
          </ul>
        </SubSection>
        <SubSection title="Free Trials">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Eligible users may receive a free trial period with full premium access.</li>
            <li>Free trials revert to the free tier automatically upon expiration unless a subscription is initiated.</li>
            <li>Only one free trial per user is permitted unless expressly stated otherwise.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="payments-refunds" number={10} color="bg-green-50 text-green-600" title="Payments & Refund Policy">
        <SubSection title="Payment Methods">
          <p>Subscriptions may be purchased through Razorpay (web), Google Play Billing (Android), or Apple App Store (iOS). All payments are processed securely by respective payment processors.</p>
        </SubSection>
        <SubSection title="Auto-Renewal">
          <p>Subscriptions automatically renew at the end of each billing period. You may cancel auto-renewal at any time from your account settings or the respective app store subscription management page. Cancellation must occur at least 24 hours before the next billing date to take effect.</p>
        </SubSection>
        <SubSection title="Refund Policy">
          <p>See our comprehensive <a href="/documents/refund-policy" className="text-blue-600 underline">Refund & Cancellation Policy</a> for full details. In summary:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Refunds for purchases via Apple/Google are governed by their respective platform policies.</li>
            <li>For direct web payments via Razorpay, refund requests must be submitted within 48 hours of accidental renewal.</li>
            <li>No refunds are provided for partially used subscription periods unless otherwise required by law.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="suspension" number={11} color="bg-red-50 text-red-600" title="Account Suspension & Termination">
        <SubSection title="Suspension by Cashtro">
          <p>We reserve the right to suspend or terminate your account immediately, without notice, if you:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Violate these Terms or our Acceptable Use Policy</li>
            <li>Engage in fraudulent activity or payment chargebacks</li>
            <li>Attempt unauthorized access to systems or other accounts</li>
            <li>Use the Platform for illegal financial activities</li>
            <li>Abuse support staff or other users</li>
          </ul>
        </SubSection>
        <SubSection title="Voluntary Account Closure">
          <p>You may close your account at any time from Settings &gt; Account &gt; Delete Account. Upon closure, your data is retained for 30 days to allow for data export, then permanently deleted (subject to legal retention requirements for invoice/tax records).</p>
        </SubSection>
      </Section>

      <Section id="intellectual-property" number={12} color="bg-slate-100 text-slate-600" title="Intellectual Property">
        <ul className="list-disc pl-5 space-y-2">
          <li>All rights, title, and interest in the Cashtro Platform, including software, design, logos, and content created by Cashtro, are owned exclusively by Cashtro.</li>
          <li>You are granted a limited, non-exclusive, non-transferable license to use the Platform for personal or authorized business purposes.</li>
          <li>You retain ownership of all financial data and content you enter into the Platform.</li>
          <li>You grant Cashtro a limited license to process, store, and display your data solely to provide the services you request.</li>
          <li>You may not use Cashtro's trademarks, logos, or brand assets without prior written permission.</li>
        </ul>
      </Section>

      <Section id="disclaimers" number={13} color="bg-yellow-50 text-yellow-700" title="Disclaimers">
        <InfoBox type="warning">
          <strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE"</strong> WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </InfoBox>
        <p className="mt-4">Specifically, Cashtro does not warrant that:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>The Platform will be uninterrupted, error-free, or completely secure at all times.</li>
          <li>AI-generated insights will be accurate, complete, or suitable for your specific financial situation.</li>
          <li>Financial calculations performed by the Platform will satisfy tax authority or audit requirements.</li>
          <li>Third-party integrations will remain available and functional.</li>
        </ul>
      </Section>

      <Section id="liability" number={14} color="bg-rose-50 text-rose-600" title="Limitation of Liability">
        <p>To the maximum extent permitted by applicable Indian law:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Cashtro's total liability to you for any claim arising from your use of the Platform shall not exceed the amount you paid to Cashtro in the three months preceding the claim.</li>
          <li>Cashtro shall not be liable for indirect, incidental, consequential, special, or punitive damages.</li>
          <li>Cashtro is not liable for data loss caused by your own actions, device failure, or third-party service outages.</li>
          <li>Cashtro is not responsible for financial decisions made based on data or AI insights from the Platform.</li>
        </ul>
      </Section>

      <Section id="governing-law" number={15} color="bg-blue-50 text-blue-600" title="Governing Law & Dispute Resolution">
        <SubSection title="Governing Law">
          <p>These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</p>
        </SubSection>
        <SubSection title="Dispute Resolution">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We encourage resolving disputes informally. Contact us first at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a>.</li>
            <li>If informal resolution fails, disputes shall be subject to binding arbitration under the Arbitration and Conciliation Act, 1996.</li>
            <li>Courts in India shall have jurisdiction for matters that cannot be resolved through arbitration.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="changes" number={16} color="bg-orange-50 text-orange-600" title="Changes to These Terms">
        <p>We may modify these Terms at any time. We will notify you of material changes via:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>In-app notification when you next open the Platform</li>
          <li>Email notification to your registered email address</li>
          <li>Updating the "Last Updated" date on this page</li>
        </ul>
        <p className="mt-3">Changes become effective 30 days after notice is provided. If you object to the changes, you may close your account before the effective date.</p>
      </Section>

      <Section id="contact" number={17} color="bg-emerald-50 text-emerald-600" title="Contact Us">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-4">Cashtro Legal Team</p>
          <div className="space-y-2 text-sm">
            <p>⚖️ <strong>Legal & Terms:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>📧 <strong>General Support:</strong> <a href="mailto:support@cashtro.in" className="text-blue-600 underline">support@cashtro.in</a></p>
            <p>⏱️ <strong>Response Time:</strong> Within 5 business days for legal inquiries.</p>
          </div>
        </div>
      </Section>
    </LegalLayout>
  );
}
