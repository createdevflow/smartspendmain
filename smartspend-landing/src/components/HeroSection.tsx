'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

// Animated phone screen cycling through app screens
const PHONE_SCREENS = [
  {
    label: 'Dashboard',
    bg: 'from-blue-600 to-blue-700',
    content: (
      <div className="flex flex-col gap-3 pt-14 px-4 pb-4">
        <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="text-blue-200 text-[9px] uppercase tracking-wider mb-1">Total Balance</div>
          <div className="font-black text-2xl mb-1">₹1,24,500</div>
          <div className="flex gap-2">
            <div className="bg-white/20 rounded-full text-[9px] px-2 py-0.5 flex items-center gap-1">↑ +2.4% this month</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="text-[9px] text-gray-500 mb-1">Income</div>
            <div className="text-sm font-bold text-green-600">₹85,000</div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="text-[9px] text-gray-500 mb-1">Expenses</div>
            <div className="text-sm font-bold text-red-500">₹45,200</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="text-[10px] font-bold text-gray-700 mb-2">Recent Transactions</div>
          {[
            { icon: '🍕', name: 'Zomato', cat: 'Food', amt: '-₹450', color: 'text-red-500' },
            { icon: '🛒', name: 'Amazon', cat: 'Shopping', amt: '-₹1,299', color: 'text-red-500' },
            { icon: '💰', name: 'Salary', cat: 'Income', amt: '+₹85,000', color: 'text-green-600' },
          ].map((tx) => (
            <div key={tx.name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-base">{tx.icon}</span>
                <div>
                  <div className="text-[10px] font-bold text-gray-800">{tx.name}</div>
                  <div className="text-[8px] text-gray-400">{tx.cat}</div>
                </div>
              </div>
              <div className={`text-[10px] font-bold ${tx.color}`}>{tx.amt}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    label: 'Analytics',
    bg: 'from-indigo-600 to-violet-600',
    content: (
      <div className="flex flex-col gap-3 pt-14 px-4 pb-4">
        <div className="text-[12px] font-black text-gray-800">Spending Insights</div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="text-[9px] text-gray-500 mb-2">Category Breakdown</div>
          {[
            { label: 'Food & Dining', pct: 32, color: 'bg-orange-400' },
            { label: 'Shopping', pct: 28, color: 'bg-blue-500' },
            { label: 'Transport', pct: 18, color: 'bg-green-500' },
            { label: 'Bills', pct: 22, color: 'bg-purple-500' },
          ].map((c) => (
            <div key={c.label} className="mb-2">
              <div className="flex justify-between mb-0.5">
                <span className="text-[9px] text-gray-600 font-medium">{c.label}</span>
                <span className="text-[9px] font-bold text-gray-800">{c.pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
            <div className="text-[8px] text-blue-500 font-medium mb-0.5">Budget Used</div>
            <div className="text-sm font-black text-blue-700">68%</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
            <div className="text-[8px] text-green-500 font-medium mb-0.5">Saved</div>
            <div className="text-sm font-black text-green-700">₹12.4k</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: 'Goals',
    bg: 'from-emerald-600 to-teal-600',
    content: (
      <div className="flex flex-col gap-3 pt-14 px-4 pb-4">
        <div className="text-[12px] font-black text-gray-800">Savings Goals</div>
        {[
          { icon: '🏖️', name: 'Goa Trip', saved: 18000, target: 30000, color: 'bg-blue-500' },
          { icon: '💻', name: 'MacBook Pro', saved: 45000, target: 120000, color: 'bg-violet-500' },
          { icon: '🏠', name: 'Emergency Fund', saved: 75000, target: 100000, color: 'bg-green-500' },
        ].map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <div key={g.name} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{g.icon}</span>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-gray-800">{g.name}</div>
                  <div className="text-[8px] text-gray-400">₹{g.saved.toLocaleString('en-IN')} / ₹{g.target.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-[10px] font-black text-blue-600">{pct}%</div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${g.color}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    ),
  },
];

export default function HeroSection() {
  const [activeScreen, setActiveScreen] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-cycle screens
  useEffect(() => {
    const t = setInterval(() => setActiveScreen((s) => (s + 1) % PHONE_SCREENS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 md:pt-28 md:pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="max-w-7xl mx-auto px-5 md:px-10 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col items-start"
          >
            <h1 className="text-5xl md:text-6xl xl:text-7xl font-black text-gray-900 tracking-tight leading-[1.08] mb-6">
              Finance,{' '}
              <span style={{ background: 'linear-gradient(135deg, #2D8CFF 0%, #1D7AF0 60%, #F26D21 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                beautifully
              </span>
              <br />
              connected.
            </h1>

            <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 max-w-lg leading-relaxed">
              Cashtro brings your money, wealth, team, and insights into one seamless workspace. Built for the way you actually live.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-12">
              <Link
                href="#download"
                className="inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-4 rounded-2xl hover:opacity-90 hover:shadow-xl transition-all text-base"
                style={{ background: 'linear-gradient(135deg, #2D8CFF, #1D7AF0)' }}
              >
                Get Cashtro Free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 font-semibold px-7 py-4 rounded-2xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 transition-all text-base"
              >
                See Features
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4">
              {[
                { icon: <Shield size={14} className="text-blue-500" />, label: 'End-to-End Encrypted' },
                { icon: <Zap size={14} className="text-amber-500" />, label: 'Offline First' },
                { icon: <TrendingUp size={14} className="text-green-500" />, label: 'Real-time Sync' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  {b.icon}
                  {b.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center lg:justify-end w-full"
          >
            {/* Phone frame */}
            <div className="relative w-[220px] md:w-[240px]">
              {/* Floating stat cards */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="absolute top-10 -left-6 lg:-left-20 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 z-30"
              >
                <div className="text-xs text-gray-400 font-medium mb-0.5">This Week</div>
                <div className="text-base font-black text-green-600">+₹12,400</div>
                <div className="text-xs text-gray-400">saved</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-24 -right-4 lg:-right-12 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 z-30"
              >
                <div className="text-xs text-gray-400 font-medium mb-0.5">AI Insight</div>
                <div className="text-xs font-bold text-blue-700">🧠 Save ₹3,200</div>
                <div className="text-[10px] text-gray-400">on dining this month</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-40 -right-2 lg:-right-8 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 z-30"
              >
                <div className="text-[9px] text-gray-400">Budget</div>
                <div className="text-xs font-black text-orange-500">68% used</div>
              </motion.div>

              {/* Glow behind phone */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-indigo-500/10 blur-3xl rounded-full scale-150" />

              <div className="relative z-10 bg-gray-900 rounded-[44px] p-2.5 shadow-2xl ring-1 ring-white/10">
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full z-30" />

                <div className="bg-[#F7F9FC] rounded-[38px] overflow-hidden aspect-[9/19.5] relative">
                  {/* Status bar */}
                  <div className="absolute top-0 w-full z-20 flex justify-between items-center px-5 pt-3 pb-1">
                    <span className="text-[9px] font-semibold text-gray-600">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-3 h-1.5 bg-gray-400 rounded-sm" />
                      <div className="w-1 h-1.5 bg-gray-400 rounded-sm" />
                    </div>
                  </div>

                  {/* Screen content - animated */}
                  <div className="w-full h-full">
                    {PHONE_SCREENS.map((screen, i) => (
                      <motion.div
                        key={screen.label}
                        initial={false}
                        animate={{ opacity: i === activeScreen ? 1 : 0, scale: i === activeScreen ? 1 : 0.98 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0"
                        style={{ pointerEvents: i === activeScreen ? 'auto' : 'none' }}
                      >
                        {/* Top header bar */}
                        <div className="absolute top-0 w-full h-14 bg-white/90 backdrop-blur-md z-10 flex justify-between items-end pb-2 px-4 border-b border-gray-100">
                          <div className="text-[11px] font-black text-gray-900">{screen.label}</div>
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                            <span className="text-white text-[9px] font-black">A</span>
                          </div>
                        </div>
                        {screen.content}
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom tab bar */}
                  <div className="absolute bottom-0 w-full h-14 bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-1 z-20">
                    {['🏠', '📒', '💳', '📈', '⚙️'].map((icon, i) => (
                      <div
                        key={i}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
                          i === activeScreen % 5 ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span>{icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Screen indicator dots */}
              <div className="flex justify-center gap-2 mt-5">
                {PHONE_SCREENS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveScreen(i)}
                    className={`transition-all rounded-full ${
                      i === activeScreen ? 'w-5 h-2' : 'w-2 h-2 bg-gray-300'
                    }`}
                    style={i === activeScreen ? { background: '#2D8CFF' } : {}}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
