'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// All Cashtro modules with brand colors
const MODULES = [
  {
    id: 'dashboard', label: 'Dashboard', emoji: '🏠', desc: 'Smart overview',
    color: '#2D8CFF', glow: 'rgba(45,140,255,0.35)',
    stat: 'Balance ₹1,24,500', angle: 0, radius: 0, // center
  },
  {
    id: 'cashbooks', label: 'Cashbooks', emoji: '📒', desc: 'Multi-book tracking',
    color: '#0EA5E9', glow: 'rgba(14,165,233,0.3)',
    stat: '3 active books', angle: 0, radius: 38,
  },
  {
    id: 'transactions', label: 'Transactions', emoji: '💳', desc: 'Income & expenses',
    color: '#10B981', glow: 'rgba(16,185,129,0.3)',
    stat: '247 entries', angle: 60, radius: 38,
  },
  {
    id: 'analytics', label: 'Analytics', emoji: '📊', desc: 'AI spending insights',
    color: '#8B5CF6', glow: 'rgba(139,92,246,0.3)',
    stat: '68% budget used', angle: 120, radius: 38,
  },
  {
    id: 'wealth', label: 'Wealth Hub', emoji: '📈', desc: 'Investments & gold',
    color: '#F59E0B', glow: 'rgba(245,158,11,0.3)',
    stat: '₹8.2L portfolio', angle: 180, radius: 38,
  },
  {
    id: 'invoices', label: 'Invoices', emoji: '🧾', desc: 'Create & send bills',
    color: '#F26D21', glow: 'rgba(242,109,33,0.3)',
    stat: '12 invoices sent', angle: 240, radius: 38,
  },
  {
    id: 'chat', label: 'Chat', emoji: '💬', desc: 'Finance messaging',
    color: '#EC4899', glow: 'rgba(236,72,153,0.3)',
    stat: '5 conversations', angle: 300, radius: 38,
  },
  {
    id: 'goals', label: 'Goals', emoji: '🎯', desc: 'Savings targets',
    color: '#14B8A6', glow: 'rgba(20,184,166,0.3)',
    stat: 'Goa Trip 60%', angle: 90, radius: 20,
  },
  {
    id: 'notifications', label: 'Alerts', emoji: '🔔', desc: 'Smart nudges',
    color: '#EF4444', glow: 'rgba(239,68,68,0.3)',
    stat: '3 unread alerts', angle: 270, radius: 20,
  },
];

// Connections: which modules share data with which
const CONNECTIONS: [string, string, string][] = [
  ['dashboard', 'cashbooks', '#0EA5E9'],
  ['dashboard', 'transactions', '#10B981'],
  ['dashboard', 'analytics', '#8B5CF6'],
  ['dashboard', 'wealth', '#F59E0B'],
  ['dashboard', 'invoices', '#F26D21'],
  ['dashboard', 'chat', '#EC4899'],
  ['dashboard', 'goals', '#14B8A6'],
  ['dashboard', 'notifications', '#EF4444'],
  ['transactions', 'analytics', '#8B5CF6'],
  ['cashbooks', 'transactions', '#10B981'],
  ['invoices', 'notifications', '#EF4444'],
  ['goals', 'analytics', '#8B5CF6'],
  ['wealth', 'analytics', '#F59E0B'],
];

const SVG_SIZE = 100;
const CENTER = 50;

function toCartesian(angle: number, radius: number) {
  if (radius === 0) return { x: CENTER, y: CENTER };
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

const nodeMap: Record<string, { x: number; y: number }> = Object.fromEntries(
  MODULES.map(m => [m.id, toCartesian(m.angle, m.radius)])
);

const FEATURE_HIGHLIGHTS = [
  { icon: '⚡', title: 'Real-time sync', desc: 'Every entry instantly updates across all modules' },
  { icon: '🤖', title: 'AI Insights', desc: 'Smart spending patterns analysed automatically' },
  { icon: '🔗', title: 'Cross-module alerts', desc: 'Budget breach? Invoice overdue? We tell you.' },
  { icon: '📤', title: 'One-tap export', desc: 'PDF/CSV from any screen, any time' },
  { icon: '👥', title: 'Shared access', desc: 'Collaborate on cashbooks with team roles' },
  { icon: '🔒', title: 'Bank-grade security', desc: 'End-to-end encrypted, always private' },
];

export default function EcosystemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  return (
    <section id="ecosystem" className="py-24 md:py-36 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold px-5 py-2.5 rounded-full mb-6"
          >
            🔗 The Connected Financial OS
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl xl:text-6xl font-black text-white tracking-tight mb-5"
          >
            Everything{' '}
            <span style={{ background: 'linear-gradient(135deg, #2D8CFF, #F26D21)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              talks to everything.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Cashtro isn&apos;t a collection of tools — it&apos;s an interconnected financial workspace where every module enriches the others.
          </motion.p>
        </div>

        {/* Main layout: graph + features side by side on desktop */}
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* ── Network Graph ── */}
          <div className="relative w-full mx-auto" style={{ maxWidth: 520 }}>
            {/* Outer glow ring */}
            <div className="absolute inset-4 rounded-full bg-blue-500/5 blur-2xl" />
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              style={{ aspectRatio: '1 / 1' }}
            >
              <defs>
                {MODULES.map(m => (
                  <radialGradient key={`grad-${m.id}`} id={`grad-${m.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={m.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={m.color} stopOpacity="0.4" />
                  </radialGradient>
                ))}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connection lines */}
              {CONNECTIONS.map(([fromId, toId, color], i) => {
                const from = nodeMap[fromId];
                const to = nodeMap[toId];
                if (!from || !to) return null;
                const isActive = hoveredModule === fromId || hoveredModule === toId;
                return (
                  <motion.line
                    key={`line-${fromId}-${toId}`}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke={color}
                    strokeWidth={isActive ? '0.9' : '0.45'}
                    strokeOpacity={isActive ? 0.9 : 0.25}
                    strokeDasharray="2.5 2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={inView ? { pathLength: 1, opacity: isActive ? 0.9 : 0.25 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.06 }}
                    style={{ filter: isActive ? 'url(#glow)' : 'none' }}
                  />
                );
              })}

              {/* Animated data packets */}
              {inView && CONNECTIONS.slice(0, 9).map(([fromId, toId, color], i) => {
                const from = nodeMap[fromId];
                const to = nodeMap[toId];
                if (!from || !to) return null;
                return (
                  <motion.circle
                    key={`packet-${fromId}-${toId}`}
                    r="0.9"
                    fill={color}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.95, 0.95, 0],
                      cx: [from.x, to.x],
                      cy: [from.y, to.y],
                    }}
                    transition={{
                      duration: 2.2,
                      delay: 1.2 + i * 0.5,
                      repeat: Infinity,
                      repeatDelay: 2 + i * 0.3,
                      ease: 'easeInOut',
                    }}
                    style={{ filter: 'url(#glow)' }}
                  />
                );
              })}

              {/* Nodes */}
              {MODULES.map((mod, i) => {
                const pos = nodeMap[mod.id];
                if (!pos) return null;
                const isCenter = mod.id === 'dashboard';
                const isHovered = hoveredModule === mod.id;
                const nodeSize = isCenter ? 9 : 5.5;

                return (
                  <g
                    key={mod.id}
                    onMouseEnter={() => setHoveredModule(mod.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow halo */}
                    <motion.circle
                      cx={pos.x} cy={pos.y}
                      r={nodeSize + 3}
                      fill={mod.color}
                      fillOpacity={isHovered ? 0.25 : isCenter ? 0.15 : 0.08}
                      initial={{ scale: 0 }}
                      animate={inView ? { scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.07, type: 'spring' }}
                    />
                    {/* Node circle */}
                    <motion.circle
                      cx={pos.x} cy={pos.y}
                      r={nodeSize}
                      fill={`url(#grad-${mod.id})`}
                      stroke={isHovered ? '#fff' : mod.color}
                      strokeWidth={isHovered ? 0.7 : isCenter ? 0.5 : 0.3}
                      strokeOpacity={isHovered ? 1 : 0.6}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={inView ? { scale: 1, opacity: 1 } : {}}
                      transition={{ duration: 0.45, delay: 0.4 + i * 0.07, type: 'spring', stiffness: 260 }}
                      style={{ filter: isHovered || isCenter ? 'url(#glow)' : 'none' }}
                    />
                    {/* Emoji */}
                    <motion.text
                      x={pos.x} y={pos.y + (isCenter ? 1.4 : 1)}
                      textAnchor="middle"
                      fontSize={isCenter ? 5 : 3.2}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.6 + i * 0.07 }}
                    >
                      {mod.emoji}
                    </motion.text>
                    {/* Label below node */}
                    <motion.text
                      x={pos.x}
                      y={pos.y + nodeSize + 3.2}
                      textAnchor="middle"
                      fontSize={isCenter ? 2.8 : 2.2}
                      fontWeight="700"
                      fill={isHovered ? '#fff' : '#94A3B8'}
                      initial={{ opacity: 0 }}
                      animate={inView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.7 + i * 0.07 }}
                    >
                      {mod.label}
                    </motion.text>
                    {/* Stat badge on hover */}
                    {isHovered && (
                      <g>
                        <rect
                          x={pos.x - 10} y={pos.y - nodeSize - 6.5}
                          width={20} height={5} rx={2.5}
                          fill={mod.color} fillOpacity={0.95}
                        />
                        <text
                          x={pos.x} y={pos.y - nodeSize - 3.2}
                          textAnchor="middle"
                          fontSize={2.1} fill="white" fontWeight="600"
                        >
                          {mod.stat}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Pulse ring on center node */}
            <motion.div
              className="absolute rounded-full border-2 border-blue-400/40"
              style={{ width: '20%', height: '20%', top: '40%', left: '40%' }}
              animate={inView ? { scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* ── Feature highlights grid ── */}
          <div className="space-y-4">
            {FEATURE_HIGHLIGHTS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all group"
              >
                <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">{f.icon}</div>
                <div>
                  <div className="text-white font-bold text-sm mb-1">{f.title}</div>
                  <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stat bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { val: '9', label: 'Integrated Modules' },
            { val: '13+', label: 'Live Data Connections' },
            { val: '< 1s', label: 'Cross-module Sync' },
            { val: '100%', label: 'Data Stays Private' },
          ].map(s => (
            <div key={s.label} className="text-center p-5 rounded-2xl bg-white/4 border border-white/8">
              <div className="text-3xl font-black text-white mb-1" style={{ background: 'linear-gradient(135deg, #2D8CFF, #F26D21)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.val}
              </div>
              <div className="text-slate-400 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
