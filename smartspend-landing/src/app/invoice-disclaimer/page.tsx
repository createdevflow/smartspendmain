import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Invoice & Tax Disclaimer — Cashtro',
  description: 'Important disclaimer regarding Cashtro\'s GST invoice generator, tax calculations, compliance responsibility, and the limits of our invoicing tools.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'user-responsibility', label: '2. User Responsibility' },
  { id: 'gst-calculations', label: '3. GST Calculations' },
  { id: 'invoice-numbering', label: '4. Invoice Numbering' },
  { id: 'gstin-validation', label: '5. GSTIN Validation' },
  { id: 'compliance', label: '6. Tax Compliance' },
  { id: 'export-formats', label: '7. Export Formats' },
  { id: 'white-label', label: '8. White-Label Invoices' },
  { id: 'disclaimer', label: '9. Legal Disclaimer' },
  { id: 'contact', label: '10. Contact' },
];

export default function InvoiceDisclaimer() {
  return (
    <LegalLayout
      title="Invoice & Tax Disclaimer"
      subtitle="Cashtro provides professional GST invoice generation as a formatting convenience tool. This disclaimer explains the scope, limitations, and compliance responsibilities when using invoicing features."
      badge="🧾 GST Invoicing & Tax Disclaimer"
      badgeColor="bg-gradient-to-br from-stone-800 via-amber-900 to-orange-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="invoice-disclaimer"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-amber-50 text-amber-600" title="Overview">
        <p>Cashtro provides a GST Invoice Generator that allows users to create professional, formatted invoices for their business transactions. This tool is provided as a <strong>formatting and record-keeping aid</strong> — it is not a certified accounting system, tax filing platform, or substitute for professional tax or accounting services.</p>
        <InfoBox type="warning">
          <strong>Critical Notice:</strong> You are solely and entirely responsible for the accuracy, completeness, and legal compliance of all invoices you generate using Cashtro. Always verify invoices with a qualified tax professional, Chartered Accountant, or GST consultant.
        </InfoBox>
      </Section>

      <Section id="user-responsibility" number={2} color="bg-orange-50 text-orange-600" title="User Responsibility for Invoice Data">
        <p>You are solely responsible for ensuring the accuracy of all invoice information you enter, including but not limited to:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {[
            'Your legal business name and registered address',
            'Your GSTIN (GST Identification Number)',
            'Your PAN (Permanent Account Number)',
            'Customer/client name and GSTIN',
            'HSN/SAC codes for goods or services',
            'Applicable GST tax rates (IGST, CGST, SGST)',
            'Line item descriptions and quantities',
            'Invoice dates and due dates',
            'Place of supply designation',
            'Reverse charge mechanism applicability',
          ].map((item, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-900">
              <span className="shrink-0">⚠️</span><span>{item}</span>
            </div>
          ))}
        </div>
        <p className="mt-4">Cashtro is not liable for any financial, legal, or tax consequence arising from incorrect data entered by you.</p>
      </Section>

      <Section id="gst-calculations" number={3} color="bg-yellow-50 text-yellow-700" title="GST Calculations">
        <ul className="list-disc pl-5 space-y-2">
          <li>Cashtro's invoice tool calculates GST amounts based on the tax rate you select. The correctness of the selected rate is entirely your responsibility.</li>
          <li>GST rate structures (standard rates, exempted goods/services, nil-rated items) are complex and subject to government notification. Cashtro does not automatically update tax rates when the government revises them.</li>
          <li>Always verify the correct applicable GST rate from the official CBIC GST portal or your tax advisor before invoicing.</li>
          <li>Cashtro does not determine whether the Reverse Charge Mechanism (RCM) applies to your transaction — this is your responsibility.</li>
          <li>Cess calculations (additional cess on specific goods) must be manually accounted for if applicable.</li>
        </ul>
      </Section>

      <Section id="invoice-numbering" number={4} color="bg-blue-50 text-blue-600" title="Invoice Numbering">
        <ul className="list-disc pl-5 space-y-2">
          <li>GST regulations require invoices to have sequential, unique invoice numbers without gaps within a financial year.</li>
          <li>Cashtro provides invoice number management tools to help maintain sequences, but the responsibility for maintaining a legally compliant invoice numbering series rests with you.</li>
          <li>If you use multiple billing systems (Cashtro + other tools), you must ensure invoice numbers do not conflict across systems.</li>
          <li>Invoice number gaps or duplicates may attract scrutiny during GST audits. Cashtro is not responsible for such compliance gaps.</li>
        </ul>
      </Section>

      <Section id="gstin-validation" number={5} color="bg-purple-50 text-purple-600" title="GSTIN Validation">
        <p>Cashtro may provide basic format validation for GSTIN numbers (checking that the format conforms to the standard 15-character GSTIN structure). However:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Cashtro does <strong>not</strong> guarantee real-time verification of GSTIN validity against the official GSTN database.</li>
          <li>A GSTIN that passes format validation may still be invalid, cancelled, or suspended on the GSTN portal.</li>
          <li>Always verify customer GSTINs on the official GST portal (gst.gov.in) before issuing tax invoices.</li>
          <li>Cashtro is not liable for Input Tax Credit (ITC) claims rejected due to incorrect customer GSTINs on your invoices.</li>
        </ul>
      </Section>

      <Section id="compliance" number={6} color="bg-rose-50 text-rose-600" title="Tax Compliance Responsibility">
        <InfoBox type="danger">
          <strong>You are responsible for your own tax compliance.</strong> Cashtro's invoicing features do not file GST returns, submit data to GSTN, or ensure your invoices comply with e-invoicing requirements (IRN/QR code mandates) applicable to your business turnover category.
        </InfoBox>
        <ul className="list-disc pl-5 space-y-2 mt-4">
          <li><strong>e-Invoicing (IRN):</strong> If your business turnover exceeds the e-invoicing threshold set by the government, you are required to generate invoices through the Invoice Registration Portal (IRP). Cashtro does not integrate with IRP for IRN generation unless explicitly stated.</li>
          <li><strong>GSTR Filing:</strong> Generating invoices in Cashtro does not automatically file GSTR-1, GSTR-3B, or any other GST return. You must separately manage GST return filing.</li>
          <li><strong>TDS/TCS:</strong> Cashtro does not calculate or manage TDS/TCS obligations.</li>
          <li><strong>HSN/SAC Codes:</strong> Ensure HSN/SAC codes are current and accurate. The government periodically updates HSN classifications.</li>
        </ul>
      </Section>

      <Section id="export-formats" number={7} color="bg-emerald-50 text-emerald-600" title="Export Formats">
        <p>Cashtro allows invoice export in the following formats:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-3">
          <li><strong>PDF:</strong> Professional formatted invoices suitable for sharing with customers.</li>
          <li><strong>CSV/Excel:</strong> Tabular data suitable for importing into accounting software.</li>
        </ul>
        <p className="mt-3">Cashtro does not guarantee that exported formats will be accepted by all accounting systems, tax authorities, or auditors without modification. Verify export requirements with your accounting team.</p>
      </Section>

      <Section id="white-label" number={8} color="bg-sky-50 text-sky-600" title="White-Label Invoices">
        <p>Cashtro allows you to add your business logo, brand colors, and custom invoice notes to create professional, white-label invoices. These invoices represent your business — not Cashtro. You are solely responsible for the content and legal accuracy of your branded invoices.</p>
      </Section>

      <Section id="disclaimer" number={9} color="bg-slate-100 text-slate-600" title="Legal Disclaimer">
        <InfoBox type="warning">
          <strong>CASHTRO'S INVOICING TOOL IS PROVIDED "AS IS" FOR RECORD-KEEPING CONVENIENCE ONLY.</strong> CASHTRO MAKES NO WARRANTIES, EXPRESS OR IMPLIED, REGARDING THE LEGAL SUFFICIENCY, TAX COMPLIANCE, OR COMPLETENESS OF ANY INVOICE GENERATED THROUGH THE PLATFORM.
          <br /><br />
          CASHTRO SHALL NOT BE LIABLE FOR ANY TAXES, PENALTIES, INTEREST, FINES, OR OTHER FINANCIAL CONSEQUENCES ARISING FROM INVOICES GENERATED USING THE PLATFORM.
          <br /><br />
          ALWAYS CONSULT A QUALIFIED CHARTERED ACCOUNTANT, TAX CONSULTANT, OR LEGAL ADVISOR FOR PROFESSIONAL GUIDANCE ON TAX AND INVOICING COMPLIANCE.
        </InfoBox>
      </Section>

      <Section id="contact" number={10} color="bg-blue-50 text-blue-600" title="Questions About Invoicing">
        <p>For questions about invoicing features or to report concerns: <a href="mailto:support@cashtro.in" className="text-blue-600 underline font-medium">support@cashtro.in</a></p>
      </Section>
    </LegalLayout>
  );
}
