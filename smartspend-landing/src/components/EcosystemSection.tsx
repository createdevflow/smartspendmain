'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard', emoji: '🏠', x: 50, y: 10, desc: 'Balance overview' },
  { id: 'cashbooks', label: 'Cashbooks', emoji: '📒', x: 15, y: 35, desc: 'Multi-book tracking' },
  { id: 'transactions', label: 'Transactions', emoji: '💳', x: 85, y: 35, desc: 'Income & expenses' },
  { id: 'analytics', label: 'Analytics', emoji: '📊', x: 20, y: 65, desc: 'AI insights' },
  { id: 'wealth', label: 'Wealth Hub', emoji: '📈', x: 80, y: 65, desc: 'Investments & gold' },
  { id: 'chat', label: 'Chat', emoji: '💬', x: 15, y: 90, desc: 'Finance messaging' },
  { id: 'goals', label: 'Goals', emoji: '🎯', x: 50, y: 55, desc: 'Savings goals' },
  { id: 'notifications', label: 'Notifications', emoji: '🔔', x: 85, y: 90, desc: 'Smart alerts' },
];

const CONNECTIONS = [
  ['dashboard', 'cashbooks'],
  ['dashboard', 'transactions'],
  ['dashboard', 'analytics'],
  ['dashboard', 'wealth'],
  ['cashbooks', 'transactions'],
  ['cashbooks', 'chat'],
  ['goals', 'analytics'],
  ['goals', 'dashboard'],
  ['notifications', 'transactions'],
  ['notifications', 'goals'],
  ['wealth', 'notifications'],
];

export default function EcosystemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const getNode = (id: string) => MODULES.find(m => m.id === id)!;

  return (
    <section id="ecosystem" className="py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            🔗 The Connected Financial OS
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Everything{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              talks to everything.
            </span>
          </h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            Cashtro isn't a collection of tools — it's an interconnected financial workspace where every module enriches the others.
          </p>
        </div>

        {/* Network diagram */}
        <div ref={ref} className="relative w-full" style={{ paddingBottom: '70%' }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Connection lines */}
            {CONNECTIONS.map(([fromId, toId], i) => {
              const from = getNode(fromId);
              const to = getNode(toId);
              return (
                <motion.path
                  key={`${fromId}-${toId}`}
                  d={`M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}`}
                  stroke="#DBEAFE"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {MODULES.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08, type: 'spring', stiffness: 200 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${mod.x}%`, top: `${mod.y}%` }}
            >
              <div className="flex flex-col items-center cursor-default">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 group-hover:shadow-xl group-hover:border-blue-200 transition-all duration-300">
                  {mod.emoji}
                </div>
                <div className="mt-1.5 text-center">
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-700 whitespace-nowrap">{mod.label}</div>
                  <div className="text-[8px] text-gray-400 hidden md:block">{mod.desc}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-wrap justify-center gap-3 mt-8"
        >
          {[
            'Real-time sync across modules',
            'Smart cross-module alerts',
            'Unified search everywhere',
            'One-tap export',
            'Shared cashbook members',
          ].map(pill => (
            <div
              key={pill}
              className="text-sm font-medium text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full"
            >
              {pill}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
