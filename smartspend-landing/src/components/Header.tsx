'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Menu, X, Download } from 'lucide-react';

const NAV_LINKS = [
  { name: 'How It Works', href: '#story' },
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={false}
        animate={{
          backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.92)',
          boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.08)' : '0 2px 20px rgba(0, 0, 0, 0.05)',
        }}
        transition={{ duration: 0.3 }}
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group py-1">
            <Image src="/cashtro-logo.png" alt="Cashtro Logo" width={140} height={40} className="object-contain h-9 w-auto" priority />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <motion.a
              href="#download"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <Download size={15} /> Download App
            </motion.a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Nav Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-6 shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-bold text-slate-800 hover:text-blue-600 py-2 border-b border-slate-100"
              >
                {link.name}
              </Link>
            ))}
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
            >
              <Download size={16} /> Download App
            </a>
          </div>
        </div>
      )}
    </>
  );
}
