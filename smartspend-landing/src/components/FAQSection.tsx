'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Is Cashtro free to use?',
    a: 'Yes! Cashtro has a generous free plan with unlimited cashbooks and up to 200 monthly transactions. Premium plans unlock AI features, shared cashbooks, tax export, and more.',
  },
  {
    q: 'How does Cashtro keep my data secure?',
    a: 'Your data is encrypted with AES-256 at rest and in transit. We use JWT-based authentication, optional biometric lock, and a Private Mode that instantly hides sensitive data with a shake gesture.',
  },
  {
    q: 'Can I share a cashbook with my family or team?',
    a: 'Absolutely. Shared Cashbooks let you invite members with custom roles (Viewer, Editor, Admin). All changes sync in real time and are visible to all members.',
  },
  {
    q: 'Does Cashtro work offline?',
    a: 'Yes. Cashtro is built offline-first. You can add transactions, view balances, and use all core features without internet. Data syncs automatically when you reconnect.',
  },
  {
    q: 'What is the Wealth Hub?',
    a: 'The Wealth Hub aggregates your investments in one place — live gold rates, Sensex/Nifty, SIP performance, FD tracking, and more. Get a complete picture of your net worth.',
  },
  {
    q: 'Can I export my transaction data?',
    a: 'Yes. Export all transactions as CSV or PDF reports. Pro and Business plans include formatted tax-ready reports with GST breakdown for accounting and filing.',
  },
  {
    q: 'What is the AI Receipt Scanner?',
    a: 'Point your camera at any physical or digital receipt. Cashtro\'s OCR automatically extracts merchant name, amount, date, and category — no manual entry needed. Available on Pro and above.',
  },
  {
    q: 'Can I schedule recurring invoices or reminders?',
    a: 'Yes. The Scheduler feature (available with feature_scheduler enabled) lets you send receipts or invoices via email on a one-time or recurring schedule directly from the Transactions screen.',
  },
  {
    q: 'Is there an Android and iOS app?',
    a: 'Cashtro is available on Android (Google Play) and is coming soon to iOS. The app is built with React Native / Expo, providing a native experience on both platforms.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can cancel anytime from the app\'s Subscription settings. Your plan remains active until the end of the billing period — no mid-cycle charges.',
  },
];

function FAQItem({ item, isOpen, onToggle, index }: {
  item: typeof FAQ_ITEMS[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-100 transition-colors"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-base font-semibold text-gray-800">{item.q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 text-gray-400"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-6 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-4">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIdx(prev => prev === i ? null : i);

  return (
    <section id="faq" className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-3xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            ❓ Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-3">
            Got questions?
          </h2>
          <p className="text-gray-500 text-lg">We've got answers. No fluff, no jargon.</p>
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              index={i}
              isOpen={openIdx === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center bg-white rounded-2xl border border-gray-100 p-8"
        >
          <div className="text-2xl mb-3">🤝</div>
          <div className="text-base font-bold text-gray-800 mb-2">Still have questions?</div>
          <p className="text-gray-500 text-sm mb-5">Our support team usually responds within a few hours.</p>
          <a
            href="mailto:support@cashtro.in"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all text-sm"
          >
            Contact Support →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
