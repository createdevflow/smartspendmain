import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, InfoBox } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Contact & Grievance Officer — Cashtro',
  description: 'Contact Cashtro for support, legal inquiries, privacy requests, security reports, or to reach our Grievance Officer under the IT Act 2000 and DPDP Act 2023.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'support', label: '2. Customer Support' },
  { id: 'billing', label: '3. Billing & Finance' },
  { id: 'legal', label: '4. Legal & Compliance' },
  { id: 'response', label: '5. Response Times' },
];

export default function ContactGrievance() {
  return (
    <LegalLayout
      title="Contact & Support"
      subtitle="We are committed to resolving your concerns promptly and transparently. This page provides all official Cashtro email channels."
      badge="📞 Contact & Support"
      badgeColor="bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="contact"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-blue-50 text-blue-600" title="Overview">
        <p>Cashtro is committed to addressing user concerns, data rights requests, and grievances through clear, accessible channels. Please use the appropriate department email below to ensure the fastest response to your inquiry.</p>
      </Section>

      <Section id="support" number={2} color="bg-emerald-50 text-emerald-600" title="Customer Support">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-3">📧 support@cashtro.in</p>
          <p className="text-sm text-slate-600 mb-3">Primary customer support channel. Handles account issues, login problems, bug reports, feature requests, technical assistance, AI scanner issues, and transaction queries.</p>
          <a href="mailto:support@cashtro.in" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            support@cashtro.in
          </a>
          <p className="text-xs text-slate-500 mt-2">Response SLA: Within 24 Hours</p>
        </div>
      </Section>

      <Section id="billing" number={3} color="bg-indigo-50 text-indigo-600" title="Billing & Finance">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-3">💳 billing@cashtro.in</p>
          <p className="text-sm text-slate-600 mb-3">Handles all financial communications, including subscription payments, invoice requests, refunds, failed payments, GST invoices, renewal notices, and enterprise billing.</p>
          <a href="mailto:billing@cashtro.in" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            billing@cashtro.in
          </a>
          <p className="text-xs text-slate-500 mt-2">Response SLA: Within 24 Hours</p>
        </div>
      </Section>

      <Section id="legal" number={4} color="bg-rose-50 text-rose-600" title="Legal, Compliance & Privacy">
        <InfoBox type="info">
          <strong>Statutory Requirement:</strong> In accordance with applicable laws, including the DPDP Act 2023, Cashtro has designated this channel for all legal and grievance concerns.
        </InfoBox>

        <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-3">⚖️ legal@cashtro.in</p>
          <p className="text-sm text-slate-600 mb-3">Handles legal notices, compliance, terms & conditions, privacy requests, DPDP/GDPR requests, copyright claims, grievance officer matters, and security vulnerability reports.</p>
          <a href="mailto:legal@cashtro.in" className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors">
            legal@cashtro.in
          </a>
          <p className="text-xs text-slate-500 mt-2">Response SLA: Priority Issues within 4 Hours</p>
        </div>
        
        <InfoBox type="warning">
          <strong>Law Enforcement:</strong> We require a valid court order, judicial warrant, or other legally mandated process before disclosing any user information to law enforcement agencies.
        </InfoBox>
      </Section>

      <Section id="response" number={5} color="bg-teal-50 text-teal-600" title="Response Time Commitments">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Target Response</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Customer Support', 'support@cashtro.in', 'Within 24 Hours'],
                ['Billing & Finance', 'billing@cashtro.in', 'Within 24 Hours'],
                ['Legal & Compliance', 'legal@cashtro.in', 'Priority Issues within 4 Hours'],
                ['Privacy & Grievances', 'legal@cashtro.in', 'Within 30 days (per DPDP Act)'],
                ['Security Vulnerability', 'legal@cashtro.in', 'Critical: Immediately'],
              ].map((row, i) => (
                <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-slate-600">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-4">* Response times are targets and may vary during holidays, high-volume periods, or for complex investigations. We always aim to exceed these commitments.</p>
      </Section>
    </LegalLayout>
  );
}
