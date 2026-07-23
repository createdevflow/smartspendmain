'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import {
  Smile, Shield, Users, WifiOff, TrendingUp, Download,
  Camera, Calendar, Smartphone, CreditCard
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Is Cashtro free to use?',
    a: 'Yes! Cashtro has a generous free plan with unlimited cashbooks and up to 200 monthly transactions. Premium plans unlock AI features, shared cashbooks, tax export, and more.',
    icon: Smile,
  },
  {
    q: 'How does Cashtro keep my data secure?',
    a: 'Your data is encrypted with AES-256 at rest and in transit. We use JWT-based authentication, optional biometric lock, and a Private Mode that instantly hides sensitive data with a shake gesture.',
    icon: Shield,
  },
  {
    q: 'Can I share a cashbook with my family or team?',
    a: 'Absolutely. Shared Cashbooks let you invite members with custom roles (Viewer, Editor, Admin). All changes sync in real time and are visible to all members.',
    icon: Users,
  },
  {
    q: 'Does Cashtro work offline?',
    a: 'Yes. Cashtro is built offline-first. You can add transactions, view balances, and use all core features without internet. Data syncs automatically when you reconnect.',
    icon: WifiOff,
  },
  {
    q: 'What is the Wealth Hub?',
    a: 'The Wealth Hub aggregates your investments in one place — live gold rates, Sensex/Nifty, SIP performance, FD tracking, and more. Get a complete picture of your net worth.',
    icon: TrendingUp,
  },
  {
    q: 'Can I export my transaction data?',
    a: 'Yes. Export all transactions as CSV or PDF reports. Pro and Business plans include formatted tax-ready reports with GST breakdown for accounting and filing.',
    icon: Download,
  },
  {
    q: 'What is the AI Receipt Scanner?',
    a: 'Point your camera at any physical or digital receipt. Cashtro\'s OCR automatically extracts merchant name, amount, date, and category — no manual entry needed. Available on Pro and above.',
    icon: Camera,
  },
  {
    q: 'Can I schedule recurring invoices or reminders?',
    a: 'Yes. The Scheduler feature lets you send receipts or invoices via email on a one-time or recurring schedule directly from the Transactions screen.',
    icon: Calendar,
  },
  {
    q: 'Is there an Android and iOS app?',
    a: 'Cashtro is available on Android (Google Play) and is coming soon to iOS. The app is built with React Native / Expo, providing a native experience on both platforms.',
    icon: Smartphone,
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'You can cancel anytime from the app\'s Subscription settings. Your plan remains active until the end of the billing period — no mid-cycle charges.',
    icon: CreditCard,
  },
];

function FAQItem({ item, index }: {
  item: typeof FAQ_ITEMS[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="flex gap-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="text-[15px] font-bold text-gray-900 mb-1.5">{item.q}</h4>
        <p className="text-[13px] text-gray-500 leading-relaxed pr-4">{item.a}</p>
      </div>
    </motion.div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-16">
          <div className="md:max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-lg">
              Quick answers to questions you may have. Can't find what you're looking for? Check out our <a href="/documents/privacy" className="text-gray-900 font-semibold underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-colors">full documentation</a>.
            </p>
          </div>
          <a
            href="/documents/privacy"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all self-start"
          >
            Documentation ↗
          </a>
        </div>

        {/* FAQ list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              index={i}
            />
          ))}
        </div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-20 flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 rounded-2xl border border-gray-100 p-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 flex items-center justify-center text-xl">
              👋
            </div>
            <div>
              <div className="text-base font-bold text-gray-900 mb-0.5">Still have questions?</div>
              <p className="text-gray-500 text-sm">Can't find the answer you're looking for? Please chat to our friendly team.</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <a
              href="/documents/privacy"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm"
            >
              Documentation ↗
            </a>
            <a
              href="mailto:support@cashtro.in"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-800 transition-colors text-sm"
            >
              Get in touch
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
