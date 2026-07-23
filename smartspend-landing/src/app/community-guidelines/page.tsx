import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Community Guidelines — Cashtro',
  description: 'Community guidelines for Cashtro\'s chat, messaging, and blog features. Learn what is allowed and what is prohibited in the Cashtro community.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'values', label: '2. Our Community Values' },
  { id: 'chat-guidelines', label: '3. Chat & Messaging' },
  { id: 'blog-guidelines', label: '4. Blog & Content' },
  { id: 'prohibited', label: '5. Prohibited Activities' },
  { id: 'reporting', label: '6. Reporting Violations' },
  { id: 'enforcement', label: '7. Enforcement' },
  { id: 'contact', label: '8. Contact' },
];

export default function CommunityGuidelines() {
  return (
    <LegalLayout
      title="Community Guidelines"
      subtitle="Cashtro is more than a financial app — it's a community of people building better financial habits. These guidelines ensure our shared spaces remain safe, helpful, and respectful."
      badge="💬 Chat, Messaging & Blog Guidelines"
      badgeColor="bg-gradient-to-br from-cyan-800 via-teal-900 to-emerald-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="community-guidelines"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-teal-50 text-teal-600" title="Overview">
        <p>Cashtro's community features — including secure chat in shared cashbooks, direct messaging, public blog posts, and comments — are designed to help users collaborate, share insights, and support each other's financial journeys.</p>
        <p>These guidelines apply to all content you create, share, or transmit through any community feature on the Cashtro Platform. Violations may result in content removal, feature restrictions, or account suspension.</p>
      </Section>

      <Section id="values" number={2} color="bg-emerald-50 text-emerald-600" title="Our Community Values">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { value: '🤝 Respect', desc: 'Treat all users with dignity regardless of financial background, profession, or opinion.' },
            { value: '💡 Helpfulness', desc: 'Share knowledge and insights that genuinely help others manage their finances better.' },
            { value: '🔒 Privacy', desc: 'Respect others\' privacy. Do not share or expose other users\' financial information.' },
            { value: '✅ Accuracy', desc: 'Share financial information responsibly. Clearly distinguish fact from opinion.' },
            { value: '⚖️ Lawfulness', desc: 'Only share content that complies with applicable Indian law and regulations.' },
            { value: '🌱 Inclusivity', desc: 'Build an inclusive space that welcomes all backgrounds and financial literacy levels.' },
          ].map(({ value, desc }) => (
            <div key={value} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">{value}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="chat-guidelines" number={3} color="bg-sky-50 text-sky-600" title="Chat & Messaging Guidelines">
        <SubSection title="Shared Cashbook Chat">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Keep conversations relevant to the shared financial purpose of the cashbook.</li>
            <li>Be respectful when discussing transactions, expenses, or financial decisions with co-members.</li>
            <li>Do not share sensitive personal financial information (account numbers, PINs, OTPs) in chat.</li>
            <li>Resolve financial disputes civilly. If you cannot, contact Cashtro support for mediation guidance.</li>
          </ul>
        </SubSection>
        <SubSection title="Direct Messaging">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Only message users with whom you have a legitimate connection (cashbook members, mutual contacts).</li>
            <li>Do not send unsolicited promotional or commercial messages.</li>
            <li>Do not solicit money, investments, or financial commitments from other users.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="blog-guidelines" number={4} color="bg-violet-50 text-violet-600" title="Blog & Content Guidelines">
        <SubSection title="Acceptable Blog Content">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Personal finance tips, budgeting strategies, savings experiences</li>
            <li>Investment learning journeys (clearly labeled as personal opinion, not advice)</li>
            <li>GST, invoicing, and business finance educational content</li>
            <li>Feature tutorials and how-to guides for Cashtro</li>
            <li>Financial goal-setting stories and motivation</li>
          </ul>
        </SubSection>
        <SubSection title="Blog Quality Standards">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Clearly label investment content as personal opinion, not professional financial advice.</li>
            <li>Cite sources for statistical claims about markets, returns, or financial products.</li>
            <li>Do not plagiarize content from other sources.</li>
            <li>Disclose any affiliations or conflicts of interest relevant to the content.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="prohibited" number={5} color="bg-red-50 text-red-600" title="Prohibited Activities">
        <InfoBox type="danger">
          The following activities are strictly prohibited and will result in immediate content removal and potential account action:
        </InfoBox>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {[
            { category: '💰 Financial Scams & Fraud', items: ['Promoting pyramid schemes, Ponzi schemes, or MLM financial schemes', 'Making fraudulent investment promises or guaranteed return claims', 'Soliciting money, loans, or investments from community members', 'Sharing phishing links or fraudulent financial websites'] },
            { category: '🔞 Harmful & Illegal Content', items: ['Sharing illegal financial advice (unlicensed advisory, insider trading tips)', 'Content that facilitates tax evasion, money laundering, or financial fraud', 'Sexually explicit content', 'Content that incites violence, terrorism, or self-harm'] },
            { category: '🎭 Harassment & Abuse', items: ['Targeted harassment, bullying, or threats toward individuals', 'Sharing others\' private financial information without consent (doxxing)', 'Hate speech based on caste, religion, gender, ethnicity, or other protected characteristics', 'Impersonating financial advisors, SEBI-registered entities, or other users'] },
            { category: '🦠 Spam & Malware', items: ['Sending unsolicited bulk messages or promotional content', 'Distributing malicious links, malware, or phishing attempts', 'Creating duplicate accounts to circumvent restrictions', 'Automated bot-generated content'] },
            { category: '©️ Intellectual Property', items: ['Posting copyrighted content without permission or fair use justification', 'Using Cashtro\'s brand, name, or logos without authorization', 'Sharing others\' proprietary financial models or tools without permission'] },
          ].map(({ category, items }) => (
            <div key={category} className="p-4 rounded-xl border border-red-100 bg-red-50/50">
              <p className="font-bold text-red-900 mb-2">{category}</p>
              <ul className="list-disc pl-4 space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="text-xs text-red-800">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="reporting" number={6} color="bg-amber-50 text-amber-600" title="Reporting Violations">
        <p>If you encounter content or behavior that violates these guidelines:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Use the <strong>Report</strong> button on messages, posts, or user profiles within the app.</li>
          <li>Email <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a> for urgent reports or those not resolvable through in-app tools.</li>
          <li>For suspected financial scams targeting Cashtro users, contact <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a>.</li>
        </ul>
        <p className="mt-3">We review all reports and aim to respond within 48 hours. Reports are kept confidential.</p>
      </Section>

      <Section id="enforcement" number={7} color="bg-orange-50 text-orange-600" title="Enforcement">
        <p>Cashtro reserves the right to take any of the following actions in response to guideline violations:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-3">
          <li><strong>Content Removal:</strong> Remove violating messages, posts, or comments.</li>
          <li><strong>Warning:</strong> Issue a formal warning to the user's account.</li>
          <li><strong>Feature Restriction:</strong> Temporarily or permanently restrict access to community features.</li>
          <li><strong>Account Suspension:</strong> Temporarily suspend the account pending review.</li>
          <li><strong>Account Termination:</strong> Permanently close the account for severe or repeated violations.</li>
          <li><strong>Legal Referral:</strong> Report violations involving illegal activity to appropriate authorities.</li>
        </ul>
      </Section>

      <Section id="contact" number={8} color="bg-blue-50 text-blue-600" title="Questions & Appeals">
        <p>To appeal a moderation decision or ask questions about these guidelines, contact <a href="mailto:legal@cashtro.in" className="text-blue-600 underline font-medium">legal@cashtro.in</a>. We review all appeals and respond within 5 business days.</p>
      </Section>
    </LegalLayout>
  );
}
