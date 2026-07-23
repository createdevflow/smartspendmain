import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '/blog' },
    { label: 'Download', href: '#download' },
    { label: 'FAQ', href: '#faq' },
  ],
  Support: [
    { label: 'Contact Us', href: 'mailto:support@cashtro.in' },
    { label: 'Help Center', href: '/contact' },
    { label: 'Grievance Officer', href: '/contact' },
    { label: 'Report Vulnerability', href: 'mailto:legal@cashtro.in' },
    { label: 'System Status', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/documents/privacy' },
    { label: 'Terms & Conditions', href: '/documents/terms' },
    { label: 'Cookie Policy', href: '/documents/cookie-policy' },
    { label: 'Data Retention', href: '/data-retention' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-6 gap-10 border-b border-white/10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            {/* Logo */}
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/cashtro-icon.png"
                alt="Cashtro Icon"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                style={{ filter: 'grayscale(1) invert(1) brightness(1000%)', mixBlendMode: 'screen' }}
              />
              <span className="font-bold text-[1.1rem] text-white">Cashtro</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              The connected financial operating system for modern India. Track money, grow wealth, and collaborate — all in one place.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:support@cashtro.in"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                support@cashtro.in
              </a>
            </div>

            {/* Compliance badges */}
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title} className={title === 'Legal' ? 'col-span-2' : ''}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</div>
              <ul className={`space-y-2.5 ${title === 'Legal' ? 'grid grid-cols-2 gap-x-4 gap-y-2.5 space-y-0' : ''}`}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm" suppressHydrationWarning>
            © {new Date().getFullYear()} Cashtro. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
            <Link href="/documents/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/documents/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Grievance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
