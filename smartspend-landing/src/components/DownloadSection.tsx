'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Smartphone } from 'lucide-react';

interface AppConfig {
  android_enabled: boolean;
  android_url: string;
  ios_enabled: boolean;
  ios_url: string;
}

export default function DownloadSection({ config }: { config?: AppConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const androidEnabled = config?.android_enabled ?? true;
  const iosEnabled = config?.ios_enabled ?? false;
  const androidUrl = config?.android_url || '#';
  const iosUrl = config?.ios_url || '#';

  return (
    <section id="download" className="relative py-24 md:py-32 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        <div
          ref={ref}
          className="relative"
        >
          {/* Background effects */}
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <div className="flex items-center gap-2 bg-white/10 text-white/90 text-sm font-semibold px-3 py-1.5 rounded-full w-fit mb-6">
                <Smartphone size={14} />
                Available Now
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Start for free.<br />
                Upgrade anytime.
              </h2>
              <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                Download Cashtro and take control of your finances today. No credit card required to start.
              </p>

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {androidEnabled && (
                  <a
                    href={androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-white text-gray-900 font-semibold px-5 py-3.5 rounded-2xl hover:bg-gray-100 hover:shadow-xl transition-all"
                  >
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">GET IT ON</div>
                      <div className="text-sm font-black">Google Play</div>
                    </div>
                  </a>
                )}

                {iosEnabled ? (
                  <a
                    href={iosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-white text-gray-900 font-semibold px-5 py-3.5 rounded-2xl hover:bg-gray-100 hover:shadow-xl transition-all"
                  >
                    <span className="text-2xl">🍎</span>
                    <div>
                      <div className="text-[10px] text-gray-500 font-medium">DOWNLOAD ON THE</div>
                      <div className="text-sm font-black">App Store</div>
                    </div>
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-3 bg-white/10 text-white/60 border border-white/20 font-semibold px-5 py-3.5 rounded-2xl">
                    <span className="text-2xl">🍎</span>
                    <div>
                      <div className="text-[10px] text-white/50 font-medium">COMING SOON</div>
                      <div className="text-sm font-bold">App Store</div>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-blue-300 text-xs mt-4">Free plan includes 200 transactions/month · No credit card required</p>
            </motion.div>

            {/* Visual side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              {/* Mini phone stack */}
              <div className="relative">
                <div className="w-44 h-auto bg-gray-900 rounded-[36px] p-2 shadow-2xl ring-1 ring-white/10">
                  <div className="bg-[#F7F9FC] rounded-[28px] overflow-hidden">
                    <div className="bg-blue-600 p-4">
                      <div className="text-blue-200 text-[9px] uppercase tracking-wider mb-1">Total Balance</div>
                      <div className="text-white font-black text-xl">₹1,24,500</div>
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        { icon: '🍕', name: 'Zomato', amt: '-₹450' },
                        { icon: '💰', name: 'Salary', amt: '+₹85,000' },
                        { icon: '🛒', name: 'Amazon', amt: '-₹1,299' },
                      ].map(tx => (
                        <div key={tx.name} className="flex items-center justify-between bg-white rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{tx.icon}</span>
                            <span className="text-[10px] font-bold text-gray-800">{tx.name}</span>
                          </div>
                          <span className={`text-[10px] font-black ${tx.amt.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{tx.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute -top-3 -right-8 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2">
                  <div className="text-[10px] font-bold text-green-600">✓ Free Plan</div>
                  <div className="text-[9px] text-gray-400">Always available</div>
                </div>

                <div className="absolute -bottom-3 -left-10 bg-white rounded-2xl shadow-xl border border-gray-100 px-3 py-2">
                  <div className="text-[10px] font-bold text-blue-700">📱 Cross-platform</div>
                  <div className="text-[9px] text-gray-400">Android & iOS</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
