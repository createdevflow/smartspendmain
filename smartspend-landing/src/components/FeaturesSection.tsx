'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen, BarChart3, Target, MessageCircle, TrendingUp, Camera,
  Users, Shield, Zap, Bell, Award, Globe
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Smart Cashbooks',
    sub: 'Multi-book money management',
    desc: 'Organize every rupee with intelligent cashbooks. Create separate books for personal, business, and shared finances. Invite team members with custom roles.',
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {[
          { icon: '🏠', name: 'Personal', bal: '₹1,24,500', color: 'text-blue-600' },
          { icon: '💼', name: 'Business', bal: '₹8,45,200', color: 'text-green-600' },
          { icon: '🤝', name: 'Family', bal: '₹52,300', color: 'text-purple-600' },
        ].map(b => (
          <div key={b.name} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">{b.icon}</span>
              <div>
                <div className="text-xs font-bold text-gray-800">{b.name}</div>
                <div className="text-[10px] text-gray-400">3 members</div>
              </div>
            </div>
            <div className={`text-sm font-black ${b.color}`}>{b.bal}</div>
          </div>
        ))}
      </div>
    ),
    side: 'right' as const,
  },
  {
    icon: BarChart3,
    color: 'from-indigo-500 to-violet-600',
    bg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    title: 'AI-Powered Analytics',
    sub: 'Spending intelligence at a glance',
    desc: 'Cashtro\'s AI analyzes your spending patterns, surfaces actionable insights, and helps you optimize where money goes. Real-time charts, category breakdowns, and trend forecasting.',
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="text-xs font-bold text-gray-700">Spending by Category</div>
        {[
          { label: 'Food & Dining', pct: 32, color: 'bg-orange-400' },
          { label: 'Shopping', pct: 28, color: 'bg-blue-500' },
          { label: 'Transport', pct: 18, color: 'bg-green-500' },
          { label: 'Bills & Utilities', pct: 22, color: 'bg-purple-500' },
        ].map(c => (
          <div key={c.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-600 font-medium">{c.label}</span>
              <span className="text-[10px] font-bold text-gray-800">{c.pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${c.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`h-full rounded-full ${c.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    ),
    side: 'left' as const,
  },
  {
    icon: Target,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Goals & Budgets',
    sub: 'Save smarter, spend intentionally',
    desc: 'Set savings goals with visual progress rings. Create intelligent budgets per category. Get alerts before you overspend. Celebrate milestones as you hit them.',
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Goa Trip', pct: 60, color: '#3B82F6' },
            { label: 'MacBook', pct: 38, color: '#8B5CF6' },
            { label: 'Emergency', pct: 75, color: '#10B981' },
          ].map(g => (
            <div key={g.label} className="flex flex-col items-center">
              <div className="relative w-14 h-14 mb-1">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#F3F4F6" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={g.color} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 22 * g.pct / 100} 999`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-black text-gray-700">{g.pct}%</span>
                </div>
              </div>
              <div className="text-[9px] text-gray-500 text-center font-medium">{g.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5">
          <div className="text-[9px] text-emerald-700 font-medium">🎯 You're on track to hit your Goa Trip goal in 3 months!</div>
        </div>
      </div>
    ),
    side: 'right' as const,
  },
  {
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Wealth Hub',
    sub: 'Investments, gold & market pulse',
    desc: 'Monitor your entire financial portfolio in one place. Live gold rates, market indices, SIP performance, and mutual fund tracking. Your wealth, unified.',
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
        {[
          { label: 'Gold Rate', val: '₹6,420/g', change: '+0.8%', up: true },
          { label: 'Sensex', val: '81,234', change: '+1.2%', up: true },
          { label: 'SIP Portfolio', val: '₹2,45,000', change: '+12.4%', up: true },
          { label: 'Fixed Deposits', val: '₹50,000', change: '7.5% p.a.', up: true },
        ].map(w => (
          <div key={w.label} className="flex items-center justify-between">
            <span className="text-[10px] text-gray-600 font-medium">{w.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-800">{w.val}</span>
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">{w.change}</span>
            </div>
          </div>
        ))}
      </div>
    ),
    side: 'left' as const,
  },
  {
    icon: MessageCircle,
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    title: 'In-App Messaging',
    sub: 'Finance conversations, kept private',
    desc: 'Chat with cashbook members, share receipts, and discuss finances securely inside Cashtro. No third-party apps needed — everything stays in your financial workspace.',
    visual: (
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-2">
        {[
          { from: 'You', msg: 'Added ₹5,000 for groceries 🛒', mine: true },
          { from: 'Priya', msg: 'Got it! I\'ll add the electricity bill.', mine: false },
          { from: 'You', msg: 'Rent split done — sharing the receipt now.', mine: true },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[10px] font-medium ${
              m.mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {m.msg}
            </div>
          </div>
        ))}
      </div>
    ),
    side: 'right' as const,
  },
  {
    icon: Camera,
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    title: 'AI Receipt Scanner',
    sub: 'Snap, scan, done',
    desc: 'Point your camera at any receipt and Cashtro\'s OCR extracts merchant, amount, date, and category automatically. No more manual entry for expenses.',
    visual: (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="bg-gray-800 rounded-xl aspect-video flex items-center justify-center mb-3 relative overflow-hidden">
          <div className="absolute inset-4 border-2 border-cyan-400 rounded-lg">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />
          </div>
          <div className="text-center text-white/50 text-[10px]">📄 Receipt detected</div>
        </div>
        <div className="flex items-center gap-2 bg-cyan-50 rounded-xl p-2.5">
          <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
          <div>
            <div className="text-[10px] font-bold text-gray-800">Swiggy • ₹289</div>
            <div className="text-[9px] text-gray-500">Food & Dining • Auto-filled</div>
          </div>
        </div>
      </div>
    ),
    side: 'left' as const,
  },
];

function FeatureRow({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const isLeft = feature.side === 'left';
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1 }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center ${
        isLeft ? 'lg:flex-row-reverse' : ''
      }`}
    >
      {/* Text side */}
      <div className={isLeft ? 'lg:order-2' : ''}>
        <div className={`inline-flex items-center gap-2 ${feature.bg} ${feature.iconColor} text-sm font-semibold px-3 py-1.5 rounded-full mb-4`}>
          <Icon size={14} />
          {feature.sub}
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
        <p className="text-gray-500 text-lg leading-relaxed">{feature.desc}</p>
      </div>

      {/* Visual side */}
      <div className={`${isLeft ? 'lg:order-1' : ''}`}>
        <div className="relative">
          {/* Background blob */}
          <div className={`absolute -inset-6 bg-gradient-to-br ${feature.color} opacity-5 rounded-3xl blur-2xl`} />
          <div className="relative">{feature.visual}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            <Zap size={14} />
            Every Feature You Need
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Built for real life,<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">not just a demo.</span>
          </h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto">
            Six powerful features working together in one beautiful app.
          </p>
        </div>

        {/* Feature rows */}
        <div className="space-y-24 md:space-y-32">
          {FEATURES.map((f, i) => (
            <FeatureRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
