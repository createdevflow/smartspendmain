import Link from 'next/link';
import Image from 'next/image';
import { Shield, Lock, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Col 1-2: Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl mb-6 group transition-transform hover:scale-105">
              <Image src="/cashtro-logo.png" alt="Cashtro Logo" width={130} height={36} className="object-contain h-8 w-auto" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              The connected financial workspace for modern individuals, families, and growing businesses. Track money, manage wealth, and collaborate with smart AI insights.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Shield size={13} className="text-blue-400" /> AES-256 Encrypted
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Lock size={13} className="text-emerald-400" /> Bank-Grade Privacy
              </span>
            </div>
          </div>

          {/* Col 3: Product */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Product</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#story" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing & Plans</Link></li>
              <li><Link href="#download" className="hover:text-white transition-colors">Download App</Link></li>
            </ul>
          </div>

          {/* Col 4: Resources */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Resources</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link href="#faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
              <li><a href="mailto:support@cashtro.in" className="hover:text-white transition-colors">Help Center & Support</a></li>
              <li><span className="text-slate-600 cursor-not-allowed">Developer API (Coming Soon)</span></li>
              <li><span className="text-slate-600 cursor-not-allowed">Security Whitepaper</span></li>
            </ul>
          </div>

          {/* Col 5: Legal */}
          <div>
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-5">Legal</h4>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy#data-safety" className="hover:text-white transition-colors">AI & OCR Data Safety</Link></li>
              <li><Link href="/terms#refunds" className="hover:text-white transition-colors">Refund & Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Cashtro Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Made with precision for modern financial management.</span>
            <Globe size={14} className="text-slate-600" />
          </div>
        </div>
      </div>
    </footer>
  );
}
