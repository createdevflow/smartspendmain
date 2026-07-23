'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download, ArrowRight, BookOpen, ShieldCheck, PieChart, Wallet, TrendingUp } from 'lucide-react';

// ─── Static bar heights — no Math.random() to avoid hydration mismatch ────────
const BARS = {
  household: [40, 70, 55, 85, 65, 90, 75],
  business:  [55, 40, 80, 50, 95, 60, 85],
  savings:   [35, 65, 50, 75, 45, 80, 60],
};

// ─── Cashbook card data ───────────────────────────────────────────────────────
const CASHBOOKS = [
  {
    id: 'household',
    name: 'Household Expenses',
    owner: 'Priya Sharma',
    balance: '₹42,850',
    change: '+₹3,200',
    positive: true,
    icon: '🏠',
    gradient: 'linear-gradient(135deg, #2D8CFF 0%, #1D7AF0 100%)',
    glow: 'rgba(45,140,255,0.45)',
    transactions: 47,
    category: 'Personal',
    bars: BARS.household,
  },
  {
    id: 'business',
    name: 'Business Operations',
    owner: 'Rahul Verma',
    balance: '₹1,28,400',
    change: '+₹18,750',
    positive: true,
    icon: '💼',
    gradient: 'linear-gradient(135deg, #F26D21 0%, #D4581A 100%)',
    glow: 'rgba(242,109,33,0.50)',
    transactions: 132,
    category: 'Business',
    bars: BARS.business,
  },
  {
    id: 'savings',
    name: 'Monthly Savings',
    owner: 'Anjali Singh',
    balance: '₹85,000',
    change: '+₹5,000',
    positive: true,
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    glow: 'rgba(124,58,237,0.40)',
    transactions: 23,
    category: 'Savings',
    bars: BARS.savings,
  },
];

// ─── Single Cashbook Card ─────────────────────────────────────────────────────
function CashbookCard({
  book,
  size = 'md',
}: {
  book: typeof CASHBOOKS[0];
  size?: 'sm' | 'md' | 'lg';
}) {
  const w = size === 'lg' ? 'w-[280px]' : size === 'sm' ? 'w-[240px]' : 'w-[260px]';
  const p = size === 'lg' ? 'p-6' : 'p-5';

  return (
    <div
      className={`${w} ${p} rounded-[28px] text-white flex flex-col gap-3 overflow-hidden relative select-none min-h-[300px]`}
      style={{ background: book.gradient }}
    >
      {/* Decorative glare blob */}
      <div
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full"
        style={{ background: 'rgba(255,255,255,0.18)', filter: 'blur(28px)' }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full"
        style={{ background: 'rgba(0,0,0,0.12)', filter: 'blur(20px)' }}
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest mb-0.5">
            Cashbook
          </p>
          <p className="font-bold text-[15px] leading-tight">{book.name}</p>
          <p className="text-[11px] text-white/60 mt-0.5">{book.owner}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shrink-0">
          {book.icon}
        </div>
      </div>

      {/* Balance */}
      <div className="relative">
        <p className="text-[10px] text-white/55 uppercase tracking-wider mb-0.5">
          Current Balance
        </p>
        <p className={`font-black tracking-tight ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>
          {book.balance}
        </p>
        <p className="text-[11px] font-semibold mt-0.5 text-green-300">
          {book.change} this month
        </p>
      </div>

      {/* Mini bar chart */}
      <div className="relative flex items-end gap-[3px] h-10">
        {book.bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full"
            style={{
              height: `${h}%`,
              background: i === 4 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)',
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="relative flex justify-between items-center">
        <span className="flex items-center gap-1 text-[11px] text-white/60 font-medium">
          <BookOpen size={11} />
          {book.transactions} transactions
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-white/80">
          {book.category}
        </span>
      </div>
    </div>
  );
}

// ─── Floating Decorative Icon ─────────────────────────────────────────────────
function FloatingIcon({ icon: Icon, color, delay, position }: { icon: any, color: string, delay: number, position: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, type: 'spring' }}
      className={`absolute hidden lg:flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-xl shadow-gray-200/50 z-20 ${position}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delay * 2 }}
      >
        <Icon size={26} color={color} strokeWidth={2.5} />
      </motion.div>
    </motion.div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section className="relative pt-24 pb-0 px-4 md:px-8 w-full flex flex-col items-center bg-[#F0F4FF] overflow-hidden">

      {/* Subtle grid/dot background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(45,140,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Floating brand-accent blobs */}
      <div className="absolute top-24 left-[8%] w-56 h-56 rounded-full bg-[#2D8CFF] opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute top-16 right-[10%] w-48 h-48 rounded-full bg-[#F26D21] opacity-10 blur-3xl pointer-events-none" />

      {/* Floating Decorative Icons for empty side spaces */}
      <FloatingIcon icon={ShieldCheck} color="#2ECC71" delay={0.4} position="top-[20%] left-[12%]" />
      <FloatingIcon icon={PieChart} color="#F5A623" delay={0.6} position="top-[55%] left-[16%] -rotate-6" />
      <FloatingIcon icon={Wallet} color="#2D8CFF" delay={0.5} position="top-[18%] right-[14%] rotate-6" />
      <FloatingIcon icon={TrendingUp} color="#7C3AED" delay={0.7} position="top-[50%] right-[18%] -rotate-12" />

      {/* ── Hero text ── */}
      <div className="max-w-3xl mx-auto w-full relative z-20 flex flex-col items-center text-center mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-[62px] font-black text-[#1A1A1A] tracking-tight leading-[1.08] mb-4"
        >
          Manage Your Money
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-5 mb-4"
        >
          {[
            { emoji: '💡', label: 'Smarter', color: '#F5A623' },
            { emoji: '🚀', label: 'Faster', color: '#2D8CFF' },
            { emoji: '✅', label: 'Safer', color: '#2ECC71' },
          ].map(({ emoji, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-2xl md:text-3xl font-bold"
              style={{ color }}
            >
              <span>{emoji}</span> {label}
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-[#555] max-w-md mb-7 font-medium"
        >
          Track expenses, manage cashbooks, and grow your wealth — all in one app.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="#download"
            className="inline-flex items-center justify-center gap-2 bg-[#2D8CFF] text-white text-[15px] font-bold px-8 py-3.5 rounded-full hover:bg-[#1D7AF0] hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
          >
            <Download size={17} /> Download App
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#1A1A1A] text-[15px] font-bold px-8 py-3.5 rounded-full shadow-sm hover:shadow-md transition-all duration-300"
          >
            <ArrowRight size={17} /> Learn More
          </Link>
        </motion.div>
      </div>

      {/* ── Fan Card Composition ── */}
      {/*
        Layout: all 3 cards share a common bottom anchor point.
      */}
      <div className="relative w-full max-w-4xl mx-auto mt-6 flex justify-center items-end" style={{ height: 420 }}>

        {/* ── LEFT card ── */}
        <motion.div
          initial={{ opacity: 0, y: 120, rotate: -18, x: -80 }}
          animate={{ opacity: 1, y: 10, rotate: -18, x: -150 }}
          whileHover={{ y: -20, rotate: -10, scale: 1.05, zIndex: 35, transition: { duration: 0.3 } }}
          transition={{ duration: 0.85, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[-20px] z-30 origin-bottom cursor-pointer"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(45,140,255,0.35))' }}
        >
          <CashbookCard book={CASHBOOKS[0]} size="sm" />
        </motion.div>

        {/* ── RIGHT card ── */}
        <motion.div
          initial={{ opacity: 0, y: 120, rotate: 18, x: 80 }}
          animate={{ opacity: 1, y: 10, rotate: 18, x: 150 }}
          whileHover={{ y: -20, rotate: 10, scale: 1.05, zIndex: 35, transition: { duration: 0.3 } }}
          transition={{ duration: 0.85, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[-20px] z-30 origin-bottom cursor-pointer"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(124,58,237,0.35))' }}
        >
          <CashbookCard book={CASHBOOKS[2]} size="sm" />
        </motion.div>

        {/* ── CENTER card (front, largest) ── */}
        <motion.div
          initial={{ opacity: 0, y: 140 }}
          animate={{ opacity: 1, y: -10 }}
          whileHover={{ y: -40, scale: 1.05, transition: { duration: 0.3 } }}
          transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-[-20px] z-40 origin-bottom cursor-pointer"
          style={{ filter: `drop-shadow(0 24px 48px ${CASHBOOKS[1].glow})` }}
        >
          <CashbookCard book={CASHBOOKS[1]} size="lg" />
        </motion.div>

        {/* Bottom gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none z-40"
          style={{ background: 'linear-gradient(to top, #F0F4FF, transparent)' }}
        />
      </div>
    </section>
  );
}
