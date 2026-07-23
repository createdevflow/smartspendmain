import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, InfoBox, Table } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Data Retention Policy — Cashtro',
  description: 'Understand how long Cashtro retains different categories of your data, when data is deleted, and what is retained for legal compliance.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'retention-schedule', label: '2. Retention Schedule' },
  { id: 'account-data', label: '3. Account Data' },
  { id: 'financial-data', label: '4. Financial & Invoice Data' },
  { id: 'technical-data', label: '5. Technical & Log Data' },
  { id: 'ai-data', label: '6. AI Processing Data' },
  { id: 'legal-retention', label: '7. Legal Retention Requirements' },
  { id: 'deletion', label: '8. Data Deletion Process' },
  { id: 'contact', label: '9. Contact' },
];

export default function DataRetentionPolicy() {
  return (
    <LegalLayout
      title="Data Retention Policy"
      subtitle="We believe in keeping your data only as long as necessary. This policy details exactly how long each category of data is retained and what happens when it is deleted."
      badge="🗄️ Data Lifecycle & Retention"
      badgeColor="bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-900"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="data-retention"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-slate-100 text-slate-600" title="Overview">
        <p>Cashtro retains personal and financial data only for as long as necessary to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-3">
          <li>Provide and improve our services to you</li>
          <li>Comply with legal obligations under Indian law (including tax, GST, and financial regulations)</li>
          <li>Resolve disputes and enforce our agreements</li>
          <li>Protect the security and integrity of our Platform</li>
        </ul>
        <p className="mt-3">When data is no longer needed for any of these purposes, it is permanently deleted or irreversibly anonymized.</p>
      </Section>

      <Section id="retention-schedule" number={2} color="bg-blue-50 text-blue-600" title="Data Retention Schedule">
        <Table
          headers={['Data Category', 'Retention Period', 'Basis']}
          rows={[
            ['Account & identity information', 'Until deletion + 30 days grace period', 'Service provision'],
            ['Profile information (name, email, phone)', 'Until account deletion', 'Contract'],
            ['PAN / GSTIN / business info', 'Until deletion or 7 years, whichever later', 'GST Act compliance'],
            ['Financial transactions & cashbooks', 'Until deletion or 7 years for tax records', 'IT Act / GST Act'],
            ['GST Invoices', '7 years from invoice date', 'GST Act (mandatory)'],
            ['Budget & goal records', 'Until account deletion', 'User preference'],
            ['Receipt images (saved)', 'Until account deletion', 'User preference'],
            ['Receipt images (ephemeral AI scan)', 'Deleted within seconds of processing', 'No storage'],
            ['Chat messages', 'Until deletion or account closure', 'User preference'],
            ['Blog posts & comments', 'Until deletion or account closure', 'User preference'],
            ['Push notification tokens', 'Until logout or token renewal', 'Security'],
            ['Authentication logs (IP, timestamps)', '12 months', 'Security & fraud prevention'],
            ['Crash logs & error reports', '90 days', 'Debugging'],
            ['Support tickets', '3 years after closure', 'Dispute resolution'],
            ['Payment transaction records', '7 years', 'RBI / tax compliance'],
            ['Anonymized analytics', 'Indefinite (non-personal)', 'Product improvement'],
          ]}
        />
      </Section>

      <Section id="account-data" number={3} color="bg-indigo-50 text-indigo-600" title="Account & Identity Data">
        <p>When your account is active, we retain all account information necessary to provide the service. Upon account deletion:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>A 30-day grace period begins during which you may reactivate your account and recover data.</li>
          <li>After 30 days, personal identifiers (name, email, phone) are permanently purged.</li>
          <li>Financial records that must be retained for legal compliance are anonymized (detached from your identity) and retained only as long as legally required.</li>
        </ul>
      </Section>

      <Section id="financial-data" number={4} color="bg-emerald-50 text-emerald-600" title="Financial & Invoice Data">
        <InfoBox type="warning">
          <strong>Legal Notice:</strong> Under India's GST Act, businesses are required to maintain invoice and financial records for a minimum of <strong>7 years</strong> from the relevant assessment year. If you use Cashtro's GST invoicing features for business purposes, this legal retention requirement applies to your invoice data even after account deletion.
        </InfoBox>
        <p className="mt-4">In practice this means:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>If you delete your account, transaction and invoice data required by law is anonymized (personal identifiers removed) but the financial record shell is retained for the legally required period.</li>
          <li>Personal cashbooks and non-taxable transactions are deleted within 30 days of account deletion.</li>
          <li>You can export all your financial data at any time before account deletion from Settings &gt; Export Data.</li>
        </ul>
      </Section>

      <Section id="technical-data" number={5} color="bg-sky-50 text-sky-600" title="Technical & Log Data">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Authentication logs</strong> (login IP addresses, timestamps): Retained for 12 months to detect unauthorized access and support security investigations.</li>
          <li><strong>Crash reports</strong>: Retained for 90 days, automatically deleted thereafter. Crash reports do not contain financial data.</li>
          <li><strong>API access logs</strong>: Retained for 30 days for operational monitoring, then deleted.</li>
          <li><strong>Notification delivery logs</strong>: Retained for 30 days to confirm delivery and troubleshoot issues.</li>
        </ul>
      </Section>

      <Section id="ai-data" number={6} color="bg-violet-50 text-violet-600" title="AI Processing Data">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Receipt scan images (not saved):</strong> Discarded within seconds of AI processing completion. No persistent storage.</li>
          <li><strong>Receipt images (explicitly saved by you):</strong> Retained until you delete them or close your account.</li>
          <li><strong>AI chat conversation history:</strong> Retained until you delete individual conversations or close your account.</li>
          <li><strong>AI model outputs (insights, categorizations):</strong> Retained as part of your transaction/financial records. Deleted with the records they are attached to.</li>
        </ul>
      </Section>

      <Section id="legal-retention" number={7} color="bg-amber-50 text-amber-600" title="Legal Retention Requirements">
        <p>Certain data must be retained to comply with Indian law regardless of account deletion requests:</p>
        <Table
          headers={['Requirement', 'Data Type', 'Retention Period', 'Authority']}
          rows={[
            ['GST Act compliance', 'Tax invoices, GST records', '7 years', 'CBIC / GST Council'],
            ['Income Tax Act', 'Transaction & payment records', '7 years', 'Income Tax Department'],
            ['RBI guidelines', 'Payment gateway transaction records', '7 years', 'Reserve Bank of India'],
            ['IT Act 2000', 'Cybersecurity incident logs', '12 months', 'Ministry of Electronics'],
            ['Court orders / legal holds', 'Any relevant data', 'Duration of order', 'Competent court'],
          ]}
        />
      </Section>

      <Section id="deletion" number={8} color="bg-red-50 text-red-600" title="Data Deletion Process">
        <p>When you request account deletion or your data is due for deletion:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-3">
          <li><strong>Initiation:</strong> Deletion requested from Settings &gt; Account &gt; Delete Account, or via email to legal@cashtro.in.</li>
          <li><strong>Grace Period:</strong> 30-day grace period begins. You may reactivate during this time.</li>
          <li><strong>Export Window:</strong> During the grace period, you can still export your data.</li>
          <li><strong>Personal Data Purge:</strong> After 30 days, all personal identifiers are permanently deleted from production systems.</li>
          <li><strong>Backup Purge:</strong> Encrypted backups containing your data are overwritten within 90 days.</li>
          <li><strong>Legal Data Anonymization:</strong> Financial records requiring legal retention are anonymized and stripped of all personal identifiers before being retained for the legally required period.</li>
        </ol>
        <InfoBox type="info">
          Data deletion is irreversible after the grace period. Please ensure you have exported any data you wish to keep before confirming deletion.
        </InfoBox>
      </Section>

      <Section id="contact" number={9} color="bg-blue-50 text-blue-600" title="Questions About Data Retention">
        <p>For questions about data retention or to submit a formal deletion request, contact our Privacy Officer at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline font-medium">legal@cashtro.in</a>. We respond to formal data requests within <strong>30 days</strong>.</p>
      </Section>
    </LegalLayout>
  );
}
