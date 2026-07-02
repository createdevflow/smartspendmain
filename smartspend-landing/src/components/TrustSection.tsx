'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

const TRUST_ITEMS = [
  { emoji: '🔒', title: 'Bank-Level Security', desc: 'All data encrypted at rest and in transit with AES-256.' },
  { emoji: '☁️', title: 'Secure Cloud Sync', desc: 'Your data syncs instantly and securely across all devices.' },
  { emoji: '📱', title: 'Offline First', desc: 'Works fully offline. Syncs when connectivity is restored.' },
  { emoji: '🔄', title: 'Cross-Device', desc: 'Start on phone, pick up on tablet. Same seamless experience.' },
  { emoji: '⚡', title: 'Blazing Fast', desc: 'Optimized for speed. Every tap feels instant.' },
  { emoji: '🛡️', title: 'Private by Design', desc: 'Private Mode hides balances instantly. Panic button included.' },
];

export default function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-16 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Why 10,000+ users trust Cashtro
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all"
            >
              <span className="text-3xl mb-3">{item.emoji}</span>
              <div className="text-sm font-bold text-gray-800 mb-2 leading-tight">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
