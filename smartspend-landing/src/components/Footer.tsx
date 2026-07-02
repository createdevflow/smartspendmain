import Link from 'next/link';
import Image from 'next/image';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Ecosystem', href: '#ecosystem' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Download', href: '#download' },
  ],
  Support: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact Us', href: 'mailto:support@cashtro.in' },
    { label: 'Help Center', href: '#' },
    { label: 'Status', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {/* Main footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-5 gap-10 border-b border-white/10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 brightness-0 invert">
              <Image 
                src="/cashtro-logo.png" 
                alt="Cashtro Logo" 
                width={130} 
                height={40} 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              The connected financial workspace for modern India. Track money, grow wealth, and collaborate — all in one place.
            </p>
            <div className="flex gap-3">
              <a
                href="mailto:support@cashtro.in"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                support@cashtro.in
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">{title}</div>
              <ul className="space-y-2.5">
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
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Cashtro. All rights reserved. Made with ❤️ in India.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
