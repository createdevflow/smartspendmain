import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox, Table } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Cashtro',
  description: 'Understand Cashtro\'s refund, cancellation, and subscription policies for web and mobile app purchases.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'cancellation', label: '2. Cancellation' },
  { id: 'refunds-web', label: '3. Refunds — Web' },
  { id: 'refunds-mobile', label: '4. Refunds — Mobile' },
  { id: 'credits', label: '5. Credits Policy' },
  { id: 'disputes', label: '6. Chargebacks & Disputes' },
  { id: 'contact', label: '7. Contact' },
];

export default function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="Cashtro aims to be fair and transparent about subscription billing, cancellation, and refunds. This policy explains your options clearly."
      badge="💳 Billing, Refunds & Cancellation"
      badgeColor="bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="refund-policy"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-emerald-50 text-emerald-600" title="Overview">
        <p>Cashtro offers free and paid subscription plans. Paid subscriptions are billed on a recurring basis (monthly or annually). This policy explains when and how you can cancel, and under what circumstances refunds may be provided.</p>
        <InfoBox type="info">
          Refund eligibility and processes differ depending on whether you purchased through the Cashtro website (Razorpay) or through the Apple App Store or Google Play Store.
        </InfoBox>
      </Section>

      <Section id="cancellation" number={2} color="bg-blue-50 text-blue-600" title="Cancellation Policy">
        <SubSection title="How to Cancel">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Web subscriptions:</strong> Cancel from Settings &gt; Billing &gt; Manage Subscription on the Cashtro web app.</li>
            <li><strong>Android subscriptions:</strong> Cancel from Google Play Store &gt; Subscriptions &gt; Cashtro.</li>
            <li><strong>iOS subscriptions:</strong> Cancel from Apple ID &gt; Subscriptions &gt; Cashtro.</li>
          </ul>
        </SubSection>
        <SubSection title="When Cancellation Takes Effect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Cancellation must be made at least <strong>24 hours before</strong> your next renewal date to avoid being charged for the next cycle.</li>
            <li>Upon cancellation, your premium access continues until the end of the current paid billing period.</li>
            <li>After the billing period ends, your account reverts to the free tier.</li>
            <li>Your data is not deleted upon cancellation — only premium features are restricted.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="refunds-web" number={3} color="bg-purple-50 text-purple-600" title="Refunds — Web (Razorpay)">
        <Table
          headers={['Scenario', 'Eligible?', 'Process']}
          rows={[
            ['Accidental renewal within 48 hours', '✅ Yes', 'Email support@cashtro.in within 48 hours'],
            ['Duplicate charge', '✅ Yes', 'Contact support with proof of duplicate'],
            ['Technical failure preventing access', '✅ Yes (pro-rated)', 'Contact support with description'],
            ['Changed mind after renewal', '❌ No', 'Cancel to stop future renewals'],
            ['Partial period refunds', '❌ No', 'Access continues until end of period'],
            ['Annual plan — early cancellation', '❌ No (standard)', 'Contact support for exceptional cases'],
          ]}
        />
        <p className="mt-4">To request a refund for web purchases, email <a href="mailto:billing@cashtro.in" className="text-blue-600 underline">billing@cashtro.in</a> with your account email and reason. Approved refunds are processed within 7-10 business days to your original payment method.</p>
      </Section>

      <Section id="refunds-mobile" number={4} color="bg-orange-50 text-orange-600" title="Refunds — Mobile Apps (Apple & Google)">
        <InfoBox type="warning">
          <strong>Important:</strong> For subscriptions purchased through the Apple App Store or Google Play Store, refunds are governed entirely by Apple's and Google's refund policies respectively. Cashtro does not process these refunds directly.
        </InfoBox>
        <SubSection title="Google Play">
          <p>Request refunds through <a href="https://support.google.com/googleplay/answer/2479637" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google Play's refund policy</a>. Google typically allows refunds within 48 hours of purchase.</p>
        </SubSection>
        <SubSection title="Apple App Store">
          <p>Request refunds through <a href="https://reportaproblem.apple.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">reportaproblem.apple.com</a>. Apple evaluates refund requests on a case-by-case basis.</p>
        </SubSection>
      </Section>

      <Section id="credits" number={5} color="bg-yellow-50 text-yellow-700" title="Cashtro Credits Policy">
        <ul className="list-disc pl-5 space-y-2">
          <li>Cashtro Credits are virtual credits granted for promotional activities, referrals, or purchased plans.</li>
          <li>Credits have <strong>no monetary value</strong> and cannot be exchanged for cash or transferred to another account.</li>
          <li>Promotional credits expire 90 days from the date of grant unless stated otherwise.</li>
          <li>Purchased credits (if applicable) expire 12 months from purchase date.</li>
          <li>Credits are forfeited upon account deletion and are not refundable.</li>
        </ul>
      </Section>

      <Section id="disputes" number={6} color="bg-red-50 text-red-600" title="Chargebacks & Payment Disputes">
        <p>If you believe you were incorrectly charged, please contact our billing team at <a href="mailto:billing@cashtro.in" className="text-blue-600 underline">billing@cashtro.in</a> before initiating a chargeback with your bank or card issuer. We will work to resolve billing issues promptly.</p>
        <InfoBox type="danger">
          <strong>Chargeback Abuse:</strong> Initiating fraudulent chargebacks may result in immediate account suspension and recovery of outstanding amounts through legal means. We maintain complete transaction records for dispute resolution.
        </InfoBox>
      </Section>

      <Section id="contact" number={7} color="bg-blue-50 text-blue-600" title="Billing Support">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-3">Cashtro Billing Team</p>
          <div className="space-y-2 text-sm">
            <p>💳 <strong>Billing Issues:</strong> <a href="mailto:billing@cashtro.in" className="text-blue-600 underline">billing@cashtro.in</a></p>
            <p>📧 <strong>General Support:</strong> <a href="mailto:support@cashtro.in" className="text-blue-600 underline">support@cashtro.in</a></p>
            <p>⏱️ <strong>Response Time:</strong> Within 2 business days.</p>
          </div>
        </div>
      </Section>
    </LegalLayout>
  );
}
