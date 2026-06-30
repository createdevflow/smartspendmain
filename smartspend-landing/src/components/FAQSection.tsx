"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is Cashtro completely free?",
    a: "Cashtro offers a generous Free tier for everyday users. We also offer Premium and Business plans with advanced features like AI insights, shared team cashbooks, and receipt OCR scanning."
  },
  {
    q: "How secure is my financial data?",
    a: "We take security extremely seriously. Cashtro uses AES-256 encryption, operates offline-first, and syncs to a secure cloud. Your sensitive transaction details are encrypted so only you can read them."
  },
  {
    q: "Can I share a Cashbook with my partner?",
    a: "Yes! Cashtro's shared cashbooks feature allows you to collaborate on expenses in real-time, complete with a built-in chat to discuss transactions directly."
  },
  {
    q: "Does Cashtro connect directly to my bank?",
    a: "Currently, Cashtro focuses on manual smart-entry to build mindful financial habits, but we are working on safe, read-only bank connections for our upcoming releases."
  },
  {
    q: "Can I track my stocks and crypto?",
    a: "Yes, our Wealth Hub allows you to track market watchlists, live gold/silver rates, and manually log your investment portfolios."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-text-main mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-brand-text-muted">
            Everything you need to know about Cashtro.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className={`border rounded-2xl overflow-hidden transition-all ${
                openIndex === idx ? 'border-brand-primary shadow-sm bg-blue-50/30' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-brand-text-main text-lg">{faq.q}</span>
                <ChevronDown 
                  className={`text-brand-text-muted transition-transform duration-300 ${
                    openIndex === idx ? 'rotate-180 text-brand-primary' : ''
                  }`} 
                  size={20} 
                />
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-brand-text-muted leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
