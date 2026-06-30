"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-16 pb-16 md:pt-28 md:pb-24 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-[0.08] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-blue-400 to-transparent blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start text-left lg:pr-8"
          >
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-6">
              Finance, <br/>
              <span className="text-brand-primary">
                beautifully connected.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 font-medium mb-10 max-w-lg leading-relaxed">
              Cashtro brings your money, wealth, and team into one seamless workspace. Experience the premium standard for modern finance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="#download"
                className="inline-flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-primary-dark hover:shadow-lg hover:shadow-brand-primary/30 transition-all"
              >
                Get Cashtro Free
                <ArrowRight size={18} />
              </Link>
              <Link 
                href="#ecosystem"
                className="inline-flex justify-center items-center gap-2 bg-white text-brand-text-main font-semibold px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Explore Ecosystem
              </Link>
            </div>
          </motion.div>

          {/* Right: Interactive Phone Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[240px] lg:max-w-[260px] transform lg:rotate-[-2deg] lg:hover:rotate-0 transition-transform duration-500"
          >
            {/* Abstract floating elements behind phone */}
            <motion.div 
              animate={{ y: [0, -15, 0] }} 
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 w-28 h-28 bg-white rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center z-0"
            >
              <div className="text-center">
                <div className="text-green-500 font-bold text-xl">+$2,400</div>
                <div className="text-xs text-gray-400">Salary</div>
              </div>
            </motion.div>

            {/* Phone Frame */}
            <div className="relative z-10 bg-gray-900 rounded-[40px] p-2.5 shadow-2xl border-4 border-gray-800">
              <div className="bg-brand-bg rounded-[32px] overflow-hidden relative aspect-[9/19] flex flex-col">
                
                {/* Fake Header */}
                <div className="absolute top-0 w-full h-14 bg-white/90 backdrop-blur-md z-20 flex justify-between items-end pb-3 px-5 border-b border-gray-100">
                  <div className="w-12 h-3.5 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">A</span>
                  </div>
                </div>

                {/* Fake Content Scroll */}
                <motion.div 
                  animate={{ y: [0, -150, -150, 0] }}
                  transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", times: [0, 0.4, 0.6, 1] }}
                  className="pt-20 px-4 pb-16 flex flex-col gap-3 flex-1"
                >
                  <div className="h-28 rounded-2xl bg-brand-primary p-5 shadow-[0_8px_30px_rgb(37,99,235,0.2)] flex flex-col justify-between">
                    <div>
                      <div className="text-blue-100 text-[10px] font-medium mb-0.5 uppercase tracking-wider">Total Balance</div>
                      <div className="text-white font-bold text-2xl">₹1,24,500</div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-white/20 rounded text-[10px] text-white px-2 py-0.5 flex items-center gap-1">
                        <ArrowRight size={10} className="-rotate-45" /> +2.4%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 h-16 rounded-xl bg-white shadow-sm border border-gray-100 p-3 flex flex-col justify-center">
                      <div className="text-[9px] text-gray-500 font-medium mb-1">Monthly Spend</div>
                      <div className="text-sm font-bold text-gray-900">₹45,200</div>
                    </div>
                    <div className="flex-1 h-16 rounded-xl bg-white shadow-sm border border-gray-100 p-3 flex flex-col justify-center">
                      <div className="text-[9px] text-gray-500 font-medium mb-1">Savings</div>
                      <div className="text-sm font-bold text-green-600">₹12,400</div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
                    <div className="text-[11px] font-bold text-gray-900 mb-1">Recent Transactions</div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 text-[10px] font-bold">Z</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-900">Zomato</div>
                          <div className="text-[9px] text-gray-500">Food & Dining</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-gray-900">-₹450</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 text-[10px] font-bold">A</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-900">Amazon</div>
                          <div className="text-[9px] text-gray-500">Shopping</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-gray-900">-₹1,299</div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-500 text-[10px] font-bold">S</div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-900">Salary</div>
                          <div className="text-[9px] text-gray-500">Income</div>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-green-600">+₹85,000</div>
                    </div>
                    
                  </div>
                </motion.div>

                {/* Fake Bottom Tab */}
                <div className="absolute bottom-0 w-full h-16 bg-white border-t border-gray-100 flex justify-around items-center px-4 pb-2 z-20">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-5 h-5 rounded-md ${i===1 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            </div>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
}
