'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/documents/privacy' },
  { label: 'Terms & Conditions', href: '/documents/terms' },
  { label: 'Cookie Policy', href: '/documents/cookie-policy' },
  { label: 'Data Retention', href: '/data-retention' },
  { label: 'Refund Policy', href: '/documents/refund-policy' },
  { label: 'AI Usage Policy', href: '/ai-usage' },
  { label: 'Community Guidelines', href: '/community-guidelines' },
  { label: 'Invoice Disclaimer', href: '/invoice-disclaimer' },
  { label: 'Security Policy', href: '/security-policy' },
  { label: 'Contact & Grievance', href: '/contact' },
];

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Legal', href: '#', dropdown: LEGAL_LINKS },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-legal-menu]')) setLegalOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/cashtro-icon.png"
              alt="Cashtro Icon"
              width={32}
              height={32}
              className="h-8 w-8 object-contain mix-blend-multiply"
              priority
            />
            <span className="font-bold text-[1.1rem] text-[#232333]">Cashtro</span>
          </Link>

          {/* Desktop nav — plain links, no pill wrapper */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((l) =>
              l.dropdown ? (
                <div key={l.label} className="relative" data-legal-menu>
                  <button
                    onClick={() => setLegalOpen((v) => !v)}
                    className="flex items-center gap-1 px-4 py-2 text-[14px] font-semibold text-[#747487] hover:text-[#232333] transition-colors duration-200"
                  >
                    {l.label}
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${legalOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {legalOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl py-2 z-50"
                      >
                        {l.dropdown.map((d) => (
                          <Link
                            key={d.href}
                            href={d.href}
                            onClick={() => setLegalOpen(false)}
                            className="block px-4 py-2 text-[13px] font-medium text-[#747487] hover:text-[#2D8CFF] hover:bg-blue-50/50 transition-colors"
                          >
                            {d.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="px-4 py-2 text-[14px] font-semibold text-[#747487] hover:text-[#232333] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-5">
            <Link
              href="https://app.cashtro.in/login"
              className="text-[14px] font-semibold text-[#747487] hover:text-[#232333] transition-colors"
            >
              Login
            </Link>
            <Link
              href="#download"
              className="inline-flex items-center justify-center bg-[#232333] text-white text-[14px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#2D8CFF] hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              Download App
            </Link>
          </div>

          {/* Mobile menu btn */}
          <button
            className="lg:hidden p-2 text-[#232333] rounded-lg hover:bg-gray-100/50 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-[72px] left-4 right-4 z-40 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl lg:hidden overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {NAV_LINKS.filter((l) => !l.dropdown).map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-[15px] font-semibold text-[#232333] hover:text-[#2D8CFF] rounded-2xl hover:bg-blue-50/50 transition-all"
                >
                  {l.label}
                </Link>
              ))}
              {/* Legal in mobile */}
              <div>
                <p className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Legal Documents</p>
                {LEGAL_LINKS.map((d) => (
                  <Link
                    key={d.href}
                    href={d.href}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[13px] font-medium text-[#747487] hover:text-[#2D8CFF] rounded-xl hover:bg-blue-50/50 transition-all"
                  >
                    {d.label}
                  </Link>
                ))}
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <Link
                href="https://app.cashtro.in/login"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-[15px] font-semibold text-[#747487] hover:text-[#232333] transition-colors text-center"
              >
                Login
              </Link>
              <Link
                href="#download"
                onClick={() => setMenuOpen(false)}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-[#2D8CFF] text-white text-[15px] font-semibold px-5 py-3.5 rounded-2xl hover:bg-[#1D7AF0] transition-all shadow-lg shadow-blue-500/25"
              >
                Download App <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
