import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'AI Usage Policy — Cashtro',
  description: 'Understand how Cashtro uses artificial intelligence, what data AI processes, user responsibilities, and the limitations of AI-generated content.',
};

const TOC = [
  { id: 'overview', label: '1. Overview' },
  { id: 'how-ai-is-used', label: '2. How AI Is Used' },
  { id: 'data-handling', label: '3. Data Handling in AI' },
  { id: 'limitations', label: '4. AI Limitations' },
  { id: 'user-responsibilities', label: '5. User Responsibilities' },
  { id: 'ai-providers', label: '6. AI Providers' },
  { id: 'safety', label: '7. AI Safety & Ethics' },
  { id: 'opt-out', label: '8. Opting Out of AI' },
  { id: 'contact', label: '9. Contact' },
];

export default function AIUsagePolicy() {
  return (
    <LegalLayout
      title="AI Usage Policy"
      subtitle="Cashtro uses artificial intelligence to enhance your financial management experience. This policy explains how AI works within Cashtro, what data it processes, and its limitations."
      badge="🤖 Artificial Intelligence Policy"
      badgeColor="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="ai-usage"
      toc={TOC}
    >
      <Section id="overview" number={1} color="bg-violet-50 text-violet-600" title="Overview">
        <p>Cashtro integrates artificial intelligence across several features to provide smarter financial insights, automate data entry, and improve your overall experience. We are committed to using AI responsibly, transparently, and in ways that genuinely benefit you.</p>
        <InfoBox type="warning">
          <strong>Core Principle:</strong> AI features in Cashtro are tools to assist you — they are not a substitute for professional financial, tax, or legal advice. Always consult qualified professionals for important financial decisions.
        </InfoBox>
      </Section>

      <Section id="how-ai-is-used" number={2} color="bg-purple-50 text-purple-600" title="How AI Is Used in Cashtro">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {[
            { feature: '📸 Receipt Scanning', desc: 'AI extracts merchant, date, amount, tax, and category from uploaded receipt photos or documents.' },
            { feature: '🏷️ Smart Categorization', desc: 'Transactions are automatically categorized based on merchant names and historical patterns.' },
            { feature: '📊 Financial Insights', desc: 'AI analyzes your spending patterns to generate personalized summaries, alerts, and trends.' },
            { feature: '💡 Budget Suggestions', desc: 'Based on historical spending, AI suggests budget limits and identifies potential savings.' },
            { feature: '⚡ Anomaly Detection', desc: 'Unusual transactions or spending patterns are flagged for your review.' },
            { feature: '🗓️ Scheduler Suggestions', desc: 'AI suggests recurring transaction entries based on observed frequency patterns.' },
            { feature: '💬 AI Chat Assistant', desc: 'An AI assistant that helps you understand your finances, answer questions, and navigate the app.' },
            { feature: '📝 Smart Notes', desc: 'AI can summarize and tag notes attached to your transactions.' },
          ].map(({ feature, desc }) => (
            <div key={feature} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 text-sm mb-1">{feature}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="data-handling" number={3} color="bg-blue-50 text-blue-600" title="Data Handling in AI Features">
        <SubSection title="Receipt & Document Processing">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Images are transmitted via encrypted TLS to AI vision APIs for processing.</li>
            <li>Images are processed ephemerally — they are NOT stored by the AI provider after processing unless you explicitly save the image in Cashtro.</li>
            <li>Extracted structured data (merchant, amount, date) is saved to your Cashtro account only after your confirmation.</li>
          </ul>
        </SubSection>
        <SubSection title="Financial Insights">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Insight generation uses your own transaction history stored in your Cashtro account.</li>
            <li>When powered by external AI APIs, anonymized transaction summaries (not raw records) may be sent to the AI provider.</li>
            <li>Your complete, identifiable financial records are never sent to external AI providers.</li>
          </ul>
        </SubSection>
        <SubSection title="AI Chat">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Messages you send to the AI chat assistant are processed by the AI provider to generate responses.</li>
            <li>Do not share sensitive credentials, complete PAN numbers, or banking passwords in AI chat.</li>
            <li>Chat history is stored in your Cashtro account and can be deleted at any time.</li>
          </ul>
        </SubSection>
        <InfoBox type="success">
          <strong>Our Commitment:</strong> Your private financial data is NEVER used to train public AI models. We maintain strict contractual controls with all AI providers to prevent your data from being used for model training.
        </InfoBox>
      </Section>

      <Section id="limitations" number={4} color="bg-amber-50 text-amber-600" title="AI Limitations & Disclaimers">
        <p>AI features in Cashtro have inherent limitations you should be aware of:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>Not Always Accurate:</strong> AI-extracted receipt data may contain errors. Always verify AI-suggested data before saving.</li>
          <li><strong>Not Financial Advice:</strong> AI insights, budget suggestions, and spending analyses are informational. They do not constitute professional financial or tax advice.</li>
          <li><strong>Not Tax Guidance:</strong> AI features do not provide tax advice, filing assistance, or representation before tax authorities.</li>
          <li><strong>Not Legal Advice:</strong> Nothing the AI generates constitutes legal advice.</li>
          <li><strong>Context Limitations:</strong> AI may not understand highly specialized financial situations, local regulations, or unique business contexts.</li>
          <li><strong>Service Availability:</strong> AI features depend on third-party APIs and may be temporarily unavailable due to API outages or capacity constraints.</li>
        </ul>
      </Section>

      <Section id="user-responsibilities" number={5} color="bg-emerald-50 text-emerald-600" title="User Responsibilities">
        <p>When using AI features, you agree to:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>Verify AI-generated data before using it for financial records, tax filings, or business decisions.</li>
          <li>Not rely solely on AI insights for material financial, tax, or investment decisions.</li>
          <li>Report clearly incorrect AI outputs to us at <a href="mailto:support@cashtro.in" className="text-blue-600 underline">support@cashtro.in</a> to help us improve.</li>
          <li>Not attempt to manipulate or "jailbreak" AI features to produce harmful, illegal, or unethical outputs.</li>
          <li>Not use AI chat to spread misinformation, generate harmful content, or harass others.</li>
          <li>Not upload documents belonging to third parties without authorization.</li>
        </ul>
      </Section>

      <Section id="ai-providers" number={6} color="bg-sky-50 text-sky-600" title="AI Providers">
        <p>Cashtro currently uses or may use the following AI providers to power various features:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>Google Gemini API</strong> — Vision-based receipt scanning, document processing, and conversational AI features.</li>
          <li><strong>OpenAI API</strong> — Conversational AI, text generation, and smart categorization (where applicable).</li>
          <li><strong>Internal ML Models</strong> — Proprietary categorization models trained on anonymized, aggregated data.</li>
        </ul>
        <p className="mt-3">All external AI providers are bound by data processing agreements that prohibit using your data for training their public models. Provider usage may change as we update the Platform — this policy will be updated to reflect such changes.</p>
      </Section>

      <Section id="safety" number={7} color="bg-rose-50 text-rose-600" title="AI Safety & Ethics">
        <p>Cashtro is committed to responsible AI use:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>Transparency:</strong> We clearly label AI-generated content and suggestions within the app.</li>
          <li><strong>Human Oversight:</strong> Critical financial actions require your explicit confirmation; AI never autonomously modifies your financial records.</li>
          <li><strong>Bias Awareness:</strong> We monitor AI outputs for patterns of bias and work to improve fairness.</li>
          <li><strong>No Discriminatory Use:</strong> AI features will not be used to make discriminatory decisions about users based on protected characteristics.</li>
          <li><strong>Continuous Improvement:</strong> We regularly evaluate AI outputs for accuracy and safety.</li>
        </ul>
      </Section>

      <Section id="opt-out" number={8} color="bg-slate-100 text-slate-600" title="Opting Out of AI Features">
        <p>You can control AI feature usage from Settings &gt; AI &amp; Insights:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-2">
          <li>Disable AI smart categorization (manual categories only)</li>
          <li>Disable AI insights and spending analysis</li>
          <li>Disable AI receipt scanning (manual entry only)</li>
          <li>Delete your AI chat conversation history</li>
        </ul>
        <p className="mt-3">Disabling AI features does not affect your core financial record-keeping capabilities.</p>
      </Section>

      <Section id="contact" number={9} color="bg-blue-50 text-blue-600" title="Questions About AI">
        <p>For questions about AI features, data handling, or to report problematic AI outputs: <a href="mailto:support@cashtro.in" className="text-blue-600 underline font-medium">support@cashtro.in</a></p>
      </Section>
    </LegalLayout>
  );
}
