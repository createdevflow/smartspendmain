'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import PricingSection from '../components/PricingSection';
import {
  ArrowRight, Sparkles, Zap, Shield, BarChart3, MessageCircle,
  BookOpen, TrendingUp, Camera, Users, Bell, Target, Award,
  ChevronDown, Star, CheckCircle, Cpu, Wallet, Calendar,
  Lock, Globe, Smartphone, Download, AlertCircle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppDownloadConfig {
  android_enabled: boolean;
  android_url: string;
  ios_enabled: boolean;
  ios_url: string;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const step = target / 60;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Story Step Card ──────────────────────────────────────────────────────────
function StoryStep({
  step, icon, title, description, color, accent, side, delay
}: {
  step: number; icon: React.ReactNode; title: string; description: string;
  color: string; accent: string; side: 'left' | 'right'; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-center gap-8 md:gap-16 ${side === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} flex-col`}
    >
      {/* Content */}
      <div className="flex-1 max-w-lg">
        <div className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 ${accent}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black bg-gradient-to-br ${color}`}>
            {step}
          </span>
          Step {step}
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">{title}</h3>
        <p className="text-lg text-slate-500 leading-relaxed">{description}</p>
      </div>

      {/* Visual Card */}
      <motion.div
        whileHover={{ scale: 1.03, rotate: side === 'left' ? 1 : -1 }}
        className={`w-64 h-64 rounded-3xl bg-gradient-to-br ${color} p-8 flex flex-col items-center justify-center shadow-2xl shrink-0`}
      >
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-4">
          {icon}
        </div>
        <div className="text-white font-black text-xl text-center">{title}</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, desc, color, delay
}: {
  icon: React.ReactNode; title: string; desc: string; color: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm cursor-pointer group transition-all duration-300"
    >
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Download Badge ───────────────────────────────────────────────────────────
function DownloadBadge({
  platform, enabled, url
}: {
  platform: 'android' | 'ios'; enabled: boolean; url: string;
}) {
  const isAndroid = platform === 'android';

  if (!enabled) {
    return (
      <div className="relative group cursor-default">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 opacity-60">
          {isAndroid ? (
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4043-6.0424l1.9297-3.3407c.1066-.1847.0435-.4212-.1411-.5278-.1847-.1066-.4213-.0435-.5279.1411l-1.9508 3.3783C15.3337 8.2585 13.7148 7.7793 12 7.7793s-3.3337.4792-4.7337 1.1696L5.3161 5.571c-.1065-.1847-.3431-.2478-.5278-.1411-.1846.1066-.2477.3431-.1411.5278l1.9297 3.3407C4.6 10.9898 3.2 13.5637 3 16.4048h18c-.2-2.8411-1.6-5.4149-3.1184-7.1058"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
          )}
          <div className="text-left">
            <div className="text-white/60 text-xs font-medium">Coming Soon</div>
            <div className="text-white font-bold text-base">{isAndroid ? 'Google Play' : 'App Store'}</div>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
          Soon
        </div>
      </div>
    );
  }

  return (
    <motion.a
      href={url || '#'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 bg-white text-slate-900 rounded-2xl px-6 py-4 shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      {isAndroid ? (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-green-600" fill="currentColor">
          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4043-6.0424l1.9297-3.3407c.1066-.1847.0435-.4212-.1411-.5278-.1847-.1066-.4213-.0435-.5279.1411l-1.9508 3.3783C15.3337 8.2585 13.7148 7.7793 12 7.7793s-3.3337.4792-4.7337 1.1696L5.3161 5.571c-.1065-.1847-.3431-.2478-.5278-.1411-.1846.1066-.2477.3431-.1411.5278l1.9297 3.3407C4.6 10.9898 3.2 13.5637 3 16.4048h18c-.2-2.8411-1.6-5.4149-3.1184-7.1058"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-800" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
      )}
      <div className="text-left">
        <div className="text-slate-500 text-xs font-medium">
          {isAndroid ? 'Get it on' : 'Download on the'}
        </div>
        <div className="text-slate-900 font-bold text-base">
          {isAndroid ? 'Google Play' : 'App Store'}
        </div>
      </div>
    </motion.a>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const [downloadConfig, setDownloadConfig] = useState<AppDownloadConfig>({
    android_enabled: true,
    android_url: '',
    ios_enabled: false,
    ios_url: '',
  });

  useEffect(() => {
    // Fetch from backend API
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    fetch(`${API_BASE}/app-config/public`)
      .then(async r => {
        if (!r.ok) return null;
        const contentType = r.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return null;
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })
      .then(data => {
        if (!data) return;
        const cfg = data?.data?.config || data?.config || {};
        setDownloadConfig({
          android_enabled: cfg.download_android_enabled !== false,
          android_url: cfg.download_android_url || '',
          ios_enabled: cfg.download_ios_enabled === true,
          ios_url: cfg.download_ios_url || '',
        });
      })
      .catch(() => {}); // silently use defaults
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        style={{ width: progressWidth }}
        className="fixed top-0 left-0 h-1 z-[100] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
      />

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-pattern opacity-30" />

        {/* Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pulse-glow-anim" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pulse-glow-anim" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

            {/* Left: Copy */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-left"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Your Money,
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Beautifully
                </span>
                <br />
                Organized.
              </h1>

              <p className="text-xl text-white/60 leading-relaxed mb-10 max-w-lg">
                Cashtro combines cashbooks, AI insights, wealth tracking, and secure team collaboration into one premium financial workspace.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a
                  href="#download"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:shadow-xl transition-all"
                >
                  <Download size={18} />
                  Download the App
                </motion.a>
                <motion.a
                  href="#story"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/15 transition-all"
                >
                  See How It Works
                  <ChevronDown size={18} />
                </motion.a>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-emerald-400', 'bg-amber-400'].map((c, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/60 text-sm">Trusted by <span className="text-white font-semibold">5,000+</span> users</p>
                </div>
              </div>
            </motion.div>

            {/* Right: Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30, rotateY: -10 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex justify-center"
            >
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="absolute -top-6 -left-4 bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Savings Goal</div>
                  <div className="text-slate-900 font-bold">₹1,24,000 <span className="text-green-500 text-xs">+8.2%</span></div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 z-20"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Cpu size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">AI Insight</div>
                  <div className="text-slate-900 font-bold text-sm">Save ₹4,200 this month</div>
                </div>
              </motion.div>

              {/* Phone frame */}
              <div className="relative w-[240px] lg:w-[270px] float-slow-anim">
                <div className="bg-slate-800 rounded-[44px] p-2.5 shadow-[0_40px_80px_rgba(0,0,0,0.6)] border-2 border-slate-700">
                  <div className="bg-white rounded-[36px] overflow-hidden aspect-[9/19.5] flex flex-col">
                    {/* Status bar */}
                    <div className="bg-white h-10 flex items-center justify-between px-5 pt-2">
                      <span className="text-[9px] font-bold text-slate-800">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 bg-slate-800 rounded-sm" />
                        <div className="w-1 h-1 bg-slate-800 rounded-full" />
                      </div>
                    </div>

                    {/* Content */}
                    <motion.div
                      animate={{ y: [0, -160, -160, 0] }}
                      transition={{ repeat: Infinity, duration: 14, times: [0, 0.4, 0.6, 1], ease: 'easeInOut' }}
                      className="flex flex-col px-3.5 pb-16 gap-2.5 flex-1"
                    >
                      {/* Balance card */}
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 shadow-lg">
                        <div className="text-blue-100 text-[9px] font-semibold uppercase tracking-wider mb-1">Total Balance</div>
                        <div className="text-white font-black text-xl">₹1,24,500</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="bg-white/20 rounded text-[8px] text-white px-1.5 py-0.5 flex items-center gap-0.5">↑ +₹85,000</div>
                          <div className="bg-white/20 rounded text-[8px] text-white px-1.5 py-0.5">↓ -₹45,200</div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {['Income', 'Expense', 'Scan'].map((a, i) => (
                          <div key={i} className={`rounded-xl p-2 text-center ${i === 0 ? 'bg-green-50' : i === 1 ? 'bg-red-50' : 'bg-blue-50'}`}>
                            <div className={`text-[8px] font-bold ${i === 0 ? 'text-green-600' : i === 1 ? 'text-red-600' : 'text-blue-600'}`}>{a}</div>
                          </div>
                        ))}
                      </div>

                      {/* Insight */}
                      <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-2">
                        <div className="w-6 h-6 bg-indigo-200 rounded-lg flex items-center justify-center shrink-0">
                          <Cpu size={10} className="text-indigo-600" />
                        </div>
                        <div className="text-[9px] text-indigo-700 font-semibold leading-tight">AI: You spent 18% more on food this week 🍔</div>
                      </div>

                      {/* Transactions */}
                      <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-2">
                        <div className="text-[10px] font-black text-slate-800">Recent</div>
                        {[
                          { l: 'Zomato', c: 'Food', a: '-₹450', cl: 'text-red-500', bg: 'bg-orange-50', t: 'Z' },
                          { l: 'Salary', c: 'Income', a: '+₹85,000', cl: 'text-green-600', bg: 'bg-green-50', t: 'S' },
                          { l: 'Amazon', c: 'Shopping', a: '-₹1,299', cl: 'text-red-500', bg: 'bg-blue-50', t: 'A' },
                        ].map((tx, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${tx.bg} flex items-center justify-center text-[8px] font-black text-slate-600`}>{tx.t}</div>
                              <div>
                                <div className="text-[9px] font-bold text-slate-800">{tx.l}</div>
                                <div className="text-[8px] text-slate-400">{tx.c}</div>
                              </div>
                            </div>
                            <div className={`text-[9px] font-bold ${tx.cl}`}>{tx.a}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Bottom nav */}
                    <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-100 flex justify-around items-center px-4 pb-1">
                      {['home', 'book-open', 'bar-chart-3', 'settings'].map((_, i) => (
                        <div key={i} className={`w-5 h-5 rounded-md ${i === 0 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 mt-16 text-white/40"
          >
            <span className="text-xs font-medium uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown size={20} />
          </motion.div>
        </div>
      </section>

      {/* ─── STATS STRIP ──────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Users', value: 5000, suffix: '+' },
              { label: 'Transactions Tracked', value: 250000, suffix: '+' },
              { label: 'Countries', value: 15, suffix: '+' },
              { label: 'App Rating', value: 4.9, suffix: '★' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-black text-slate-900 mb-1">
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-slate-500 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SCROLL STORY ─────────────────────────────────────────────── */}
      <section id="story" className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        {/* Story timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-blue-200 to-transparent hidden lg:block" />

        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-5 leading-tight">
              A Story of
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Financial Freedom
              </span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              From logging your first coffee to building generational wealth — Cashtro walks every step with you.
            </p>
          </motion.div>

          <div className="flex flex-col gap-32">
            <StoryStep
              step={1} side="left" delay={0}
              icon={<Wallet size={40} className="text-white" />}
              title="Capture Every Rupee"
              description="Log income and expenses instantly with smart quick-entry. Or let our AI Receipt Scanner read your bills automatically with just a photo."
              color="from-blue-500 to-blue-700"
              accent="text-blue-500"
            />
            <StoryStep
              step={2} side="right" delay={0.1}
              icon={<BarChart3 size={40} className="text-white" />}
              title="Understand Your Spending"
              description="Visual analytics reveal where every rupee goes. Spot trends, set budgets, and get AI-powered suggestions tailored to your habits — before overspending happens."
              color="from-indigo-500 to-indigo-700"
              accent="text-indigo-500"
            />
            <StoryStep
              step={3} side="left" delay={0.1}
              icon={<Users size={40} className="text-white" />}
              title="Collaborate With Your Team"
              description="Share cashbooks with family, business partners, or your accountant. Assign roles, discuss transactions in secure in-app chat — all in one place."
              color="from-purple-500 to-purple-700"
              accent="text-purple-500"
            />
            <StoryStep
              step={4} side="right" delay={0.1}
              icon={<TrendingUp size={40} className="text-white" />}
              title="Grow Your Wealth"
              description="Track investments, gold rates, and stock watchlists. Know your net worth at any moment and make decisions backed by real data."
              color="from-emerald-500 to-teal-700"
              accent="text-emerald-600"
            />
            <StoryStep
              step={5} side="left" delay={0.1}
              icon={<Award size={40} className="text-white" />}
              title="Build Lasting Habits"
              description="No-spend streak trackers, savings goals, and burn-rate dashboards make saving fun and measurable. Turn good intentions into daily actions."
              color="from-amber-500 to-orange-600"
              accent="text-amber-600"
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Everything You Need,
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Nothing You Don't
              </span>
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Cashtro replaces 5 different apps with one beautiful, cohesive workspace.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <BookOpen size={24} className="text-blue-600" />, title: 'Smart Cashbooks', desc: 'Organize money in separate books — personal, family, business. Share with collaborators, assign roles, track in real time.', color: 'bg-blue-50', delay: 0 },
              { icon: <Camera size={24} className="text-purple-600" />, title: 'AI Receipt Scanner', desc: 'Point your camera at any bill or receipt. Our AI extracts amounts, merchants, and even warranty dates automatically.', color: 'bg-purple-50', delay: 0.05 },
              { icon: <BarChart3 size={24} className="text-indigo-600" />, title: 'Advanced Analytics', desc: 'Beautiful charts for cashflow trends, top spending categories, 7-day patterns, and monthly budget progress.', color: 'bg-indigo-50', delay: 0.1 },
              { icon: <TrendingUp size={24} className="text-emerald-600" />, title: 'Wealth Hub', desc: 'Track gold prices, stock watchlists, and calculate your true net worth including all investments.', color: 'bg-emerald-50', delay: 0.15 },
              { icon: <MessageCircle size={24} className="text-pink-600" />, title: 'Cashtro Chat', desc: 'Secure in-app messaging. Discuss expenses with family or partners without leaving the app.', color: 'bg-pink-50', delay: 0.2 },
              { icon: <Cpu size={24} className="text-orange-600" />, title: 'AI Insights', desc: 'Your personal financial advisor. Get daily spending summaries, savings tips, and anomaly alerts.', color: 'bg-orange-50', delay: 0.25 },
              { icon: <Calendar size={24} className="text-teal-600" />, title: 'Bill Reminders', desc: 'Never miss a subscription or EMI. Track recurring bills and get timely alerts before due dates.', color: 'bg-teal-50', delay: 0.3 },
              { icon: <Shield size={24} className="text-slate-600" />, title: 'Bank-Grade Security', desc: 'AES-256 encryption at rest. JWT auth with device management. Private mode to hide balances instantly.', color: 'bg-slate-50', delay: 0.35 },
              { icon: <Target size={24} className="text-rose-600" />, title: 'Goals & Budgets', desc: 'Set savings targets and monthly budgets. Visual progress rings keep you motivated every day.', color: 'bg-rose-50', delay: 0.4 },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Real People,
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Real Results
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', role: 'Freelance Designer, Mumbai', quote: 'I used to dread checking my finances. Cashtro makes it genuinely enjoyable. The AI insights alone saved me ₹8,000 last month by spotting my subscription leaks.', stars: 5, color: 'bg-blue-50' },
              { name: 'Rohan Gupta', role: 'Small Business Owner, Delhi', quote: 'Managing two businesses and personal finances was chaos. With shared cashbooks and role-based access, my accountant and I work seamlessly. Incredible product.', stars: 5, color: 'bg-purple-50' },
              { name: 'Meera Nair', role: 'Software Engineer, Bangalore', quote: 'The receipt scanner is genuinely magical. I scan bills instantly, it extracts everything. No more manual entry. Worth every rupee of the Pro subscription.', stars: 5, color: 'bg-emerald-50' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`${t.color} rounded-3xl p-8 border border-white shadow-sm transition-all`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 text-sm">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                    <div className="text-slate-500 text-xs">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ───────────────────────────────────────────── */}
      <PricingSection />

      {/* ─── FAQ SECTION ───────────────────────────────────────────────── */}
      <section id="faq" className="py-28 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-4">
              Got Questions?
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Everything you need to know about Cashtro, data security, AI Receipt scanning, and subscription plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Is Cashtro really secure for my financial data?",
                a: "Yes! We employ bank-grade AES-256 encryption at rest and TLS 1.3 in transit. We never sell your transaction history or monetize your financial identity."
              },
              {
                q: "How does the AI Receipt Scanner work?",
                a: "Simply snap a photo of any receipt or invoice. Our AI processing engine extracts merchant names, dates, amounts, and tax in seconds. Images are processed in ephemeral memory and never used to train public AI models."
              },
              {
                q: "What happens when my Free Trial ends?",
                a: "During your trial, you get full, unhindered access to all Pro features. When the trial ends, your account smoothly transitions to our generous Free Plan. Your existing records are never lost or locked."
              },
              {
                q: "Can I collaborate on cashbooks with family or partners?",
                a: "Absolutely! With Shared Cashbooks, you can invite family members or business associates with custom role permissions (Admin, Editor, Viewer) to track shared budgets in real time."
              },
              {
                q: "Can I export my data for tax filing or accounting?",
                a: "Yes! You can export your complete transaction ledgers and professional passbook reports formatted in clean CSV or PDF spreadsheets directly from your app settings."
              },
              {
                q: "How can I cancel or change my subscription?",
                a: "You have complete freedom to cancel recurring renewals at any time via your platform billing settings (Google Play Store, Apple App Store, or Cashtro Web Portal). Your Pro benefits persist until the end of the paid cycle."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                <h3 className="font-bold text-lg text-white mb-3 flex items-start gap-3">
                  <span className="text-blue-400 font-black">Q.</span>
                  {item.q}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed pl-7">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DOWNLOAD CTA ─────────────────────────────────────────────── */}
      <section id="download" className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[180px]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <Smartphone size={14} className="text-blue-400" />
              <span className="text-white/80 text-sm font-semibold">Available on Android · iOS Coming Soon</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Take Control of
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Your Money
              </span>
            </h2>

            <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Download Cashtro for free and start your 7-day premium trial. No credit card required. Upgrade whenever you're ready.
            </p>

            {/* Download badges */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <DownloadBadge platform="android" enabled={downloadConfig.android_enabled} url={downloadConfig.android_url} />
              <DownloadBadge platform="ios" enabled={downloadConfig.ios_enabled} url={downloadConfig.ios_url} />
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-sm">
              {[
                { icon: <Shield size={14} />, label: 'Bank-grade security' },
                { icon: <Lock size={14} />, label: 'End-to-end encrypted' },
                { icon: <CheckCircle size={14} />, label: '7-day free trial' },
                { icon: <Globe size={14} />, label: 'Works offline' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  {t.icon}
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
