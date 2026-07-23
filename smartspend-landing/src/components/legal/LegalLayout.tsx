'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Printer } from 'lucide-react';
import Header from '../Header';
import Footer from '../Footer';

export const POLICY_NAV = [
  { slug: 'privacy', label: 'Privacy Policy', emoji: '🔐' },
  { slug: 'terms', label: 'Terms & Conditions', emoji: '📜' },
  { slug: 'cookie-policy', label: 'Cookie Policy', emoji: '🍪' },
  { slug: 'data-retention', label: 'Data Retention', emoji: '🗄️' },
  { slug: 'refund-policy', label: 'Refund & Cancellation', emoji: '💳' },
  { slug: 'ai-usage', label: 'AI Usage Policy', emoji: '🤖' },
  { slug: 'community-guidelines', label: 'Community Guidelines', emoji: '💬' },
  { slug: 'invoice-disclaimer', label: 'Invoice & Tax Disclaimer', emoji: '🧾' },
  { slug: 'security-policy', label: 'Security Policy', emoji: '🛡️' },
  { slug: 'contact', label: 'Contact & Grievance', emoji: '📞' },
];

export interface TocItem { id: string; label: string; level?: number }

interface Props {
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  lastUpdated: string;
  version: string;
  currentSlug: string;
  toc: TocItem[];
  children: React.ReactNode;
}

export default function LegalLayout({ title, subtitle, badge, badgeColor, lastUpdated, version, currentSlug, toc, children }: Props) {
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection observer for active TOC item
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [toc]);

  const filtered = POLICY_NAV.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#F8F9FA] print:bg-white pt-24 pb-16">
        {/* Print Styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-content { padding: 0 !important; }
            body { font-size: 12px; }
          }
          /* Custom scrollbar for sidebars */
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #CBD5E1; }
        `}</style>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 xl:gap-10 relative items-start">
          
          {/* ── LEFT SIDEBAR: Policy Navigation ── */}
          <aside className="no-print flex flex-col gap-4 w-full lg:w-[220px] xl:w-[260px] shrink-0 lg:sticky top-28 self-start lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar lg:pr-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search policies…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-[13px] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>

            {/* Nav List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-4 pb-2">Legal Documents</p>
              <div className="pb-2">
                {filtered.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all border-l-2 ${
                      p.slug === currentSlug
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base">{p.emoji}</span>
                    <span className="leading-tight">{p.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ── CENTER: Main Content ── */}
          <main className="flex-1 min-w-0 print-content w-full">
            {/* Hero Header */}
            <div className={`rounded-[32px] p-6 md:p-8 text-white shadow-lg mb-8 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${badgeColor}`}>
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full pointer-events-none blur-xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none blur-xl" />
              
              <div className="relative z-10 flex-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{title}</h1>
                <p className="text-white/90 text-sm max-w-2xl leading-relaxed mb-3 font-medium">{subtitle}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70 font-medium">
                  <span>📅 Updated: {lastUpdated}</span>
                  <span className="hidden sm:inline">·</span>
                  <span>🔖 Version {version}</span>
                  <span className="hidden sm:inline">·</span>
                  <span>⚖️ Governed by Indian Law</span>
                </div>
              </div>
              
              <button
                onClick={() => window.print()}
                className="no-print hidden sm:flex items-center justify-center gap-2 bg-white text-slate-900 text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all shrink-0 relative z-10"
              >
                <Printer size={16} /> Print Document
              </button>
            </div>

            {/* Content Body */}
            <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 md:p-10 space-y-10 text-slate-700 leading-relaxed text-[15px]">
              {children}
            </div>

            {/* Policy Footer Navigation */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
              {POLICY_NAV.filter((p) => p.slug !== currentSlug).slice(0, 4).map((p) => (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <span className="text-3xl bg-slate-50 p-3 rounded-xl">{p.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.label}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Read policy &rarr;</p>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          {/* ── RIGHT SIDEBAR: On This Page (TOC) ── */}
          {toc.length > 0 && (
            <aside className="no-print hidden lg:flex flex-col w-[220px] xl:w-[260px] shrink-0 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar lg:pl-2 pb-8">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col max-h-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-3 pb-2 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-10">On This Page</p>
                <div className="py-1.5 overflow-y-auto custom-scrollbar">
                  {toc.map(({ id, label, level }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={`flex items-center gap-2 px-4 py-1.5 text-[12px] leading-tight transition-all relative ${
                        level === 2 ? 'pl-7' : ''
                      } ${
                        activeSection === id
                          ? 'text-blue-600 font-semibold bg-blue-50/50'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {activeSection === id && (
                        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-r" />
                      )}
                      <span className="line-clamp-2">{label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}

// Reusable Section component
export function Section({ id, number, color, title, children }: {
  id: string; number: string | number; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-3">
        <span className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-sm font-bold shrink-0`}>{number}</span>
        {title}
      </h2>
      <div className="space-y-4 text-sm text-slate-600 leading-7">{children}</div>
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pl-4 border-l-2 border-slate-100">
      <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
      <div className="text-sm text-slate-600 leading-7">{children}</div>
    </div>
  );
}

export function InfoBox({ type, children }: { type: 'info' | 'warning' | 'success' | 'danger'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
  };
  return (
    <div className={`rounded-2xl border p-5 text-sm leading-7 ${styles[type]}`}>{children}</div>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
