'use client';

import { motion } from 'framer-motion';

function CloudSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 50" fill="none" className={className}>
      <path d="M 20 40 Q 10 40 10 30 Q 10 20 25 20 Q 30 10 45 10 Q 60 10 65 20 Q 80 15 85 25 Q 90 35 80 40 Z" fill="currentColor" />
    </svg>
  );
}

function AirplaneSVG() {
  return (
    <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[140px] md:w-[200px] lg:w-[240px] h-auto overflow-visible z-20 relative">
      {/* Wind Streaks */}
      <motion.g
        animate={{ x: [0, 60], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "linear", repeatDelay: 0.1 }}
      >
        <line x1="180" y1="20" x2="220" y2="20" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
        <line x1="150" y1="90" x2="190" y2="90" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <motion.g
        animate={{ x: [0, 80], opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear", delay: 0.3 }}
      >
        <line x1="190" y1="55" x2="250" y2="55" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round" />
        <line x1="160" y1="35" x2="200" y2="35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
      </motion.g>

      {/* Pilot Scarf (Animated) */}
      <motion.path
        d="M 120 40 Q 140 35 160 45 Q 180 55 190 40 M 120 45 Q 145 45 165 55 Q 185 65 195 50"
        stroke="#FDBA74"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        animate={{
          d: [
            "M 120 40 Q 140 35 160 45 Q 180 55 190 40 M 120 45 Q 145 45 165 55 Q 185 65 195 50",
            "M 120 40 Q 140 45 160 35 Q 180 30 190 45 M 120 45 Q 145 55 165 45 Q 185 40 195 55",
            "M 120 40 Q 140 35 160 45 Q 180 55 190 40 M 120 45 Q 145 45 165 55 Q 185 65 195 50"
          ]
        }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pilot */}
      <g>
        {/* Body */}
        <path d="M 100 50 Q 110 30 120 50 Z" fill="#1E3A8A" />
        {/* Head */}
        <circle cx="110" cy="32" r="10" fill="#FCD34D" />
        {/* Hair */}
        <path d="M 100 32 Q 110 20 120 32 Z" fill="#111827" />
        {/* Goggles */}
        <rect x="113" y="28" width="8" height="4" rx="2" fill="#111827" />
        <rect x="105" y="28" width="6" height="4" rx="2" fill="#111827" />
        <path d="M 100 30 L 120 30" stroke="#111827" strokeWidth="2" />
        {/* Pilot Arm/Steering */}
        <motion.path
          d="M 115 45 L 100 48" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round"
          animate={{ rotate: [-2, 2, -2], transformOrigin: "115px 45px" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <circle cx="98" cy="48" r="3" fill="#111827" />
      </g>

      {/* Airplane Body */}
      {/* Main Hull */}
      <path d="M 40 60 Q 40 40 100 40 Q 160 40 190 60 Q 160 80 100 80 Q 40 80 40 60 Z" fill="#3B82F6" />
      <path d="M 40 60 Q 40 40 100 40 Q 160 40 190 60 Z" fill="#60A5FA" opacity="0.6" /> {/* Highlight */}
      
      {/* Nose */}
      <ellipse cx="40" cy="60" rx="15" ry="20" fill="#F59E0B" />
      
      {/* Tail fin */}
      <path d="M 160 45 L 180 20 L 190 60 Z" fill="#F59E0B" />
      <path d="M 160 45 L 180 20 L 190 60 Z" fill="#2563EB" opacity="0.9" />
      
      {/* Bottom Wing */}
      <path d="M 100 65 L 140 100 L 150 65 Z" fill="#1D4ED8" />

      {/* Windows/Rivets */}
      <circle cx="80" cy="55" r="3" fill="#BFDBFE" />
      <circle cx="100" cy="55" r="3" fill="#BFDBFE" />
      <circle cx="120" cy="55" r="3" fill="#BFDBFE" />

      {/* Wheel */}
      <line x1="110" y1="75" x2="115" y2="90" stroke="#4B5563" strokeWidth="3" />
      <circle cx="115" cy="90" r="6" fill="#1F2937" />
      <circle cx="115" cy="90" r="2" fill="#9CA3AF" />

      {/* Propeller (Animated) */}
      <g transform="translate(25, 60)">
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
        >
          <ellipse cx="0" cy="0" rx="4" ry="25" fill="#9CA3AF" opacity="0.8" />
          <ellipse cx="0" cy="0" rx="25" ry="4" fill="#9CA3AF" opacity="0.8" />
          <circle cx="0" cy="0" r="3" fill="#4B5563" />
        </motion.g>
      </g>
    </svg>
  );
}

function AnimatedBanner() {
  return (
    <motion.div
      className="bg-white border-2 border-blue-500/80 p-4 md:p-8 flex z-10 bg-opacity-95 backdrop-blur-sm w-[280px] sm:w-[360px] md:w-auto max-w-[95vw]"
      style={{
        borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
        boxShadow: "0 10px 40px -10px rgba(45,140,255,0.15)"
      }}
      animate={{
        skewY: [-1.5, 1.5, -1.5],
        skewX: [-1, 1, -1],
        rotate: [-1, 1, -1],
        y: [-4, 4, -4]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div 
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full"
        animate={{ scaleX: [1, 1, -1, -1, 1] }}
        transition={{
          duration: 80,
          ease: "linear",
          repeat: Infinity,
          times: [0, 0.499, 0.5, 0.999, 1]
        }}
      >
        <div className="flex-shrink-0 w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-inner">
          <svg width="24" height="24" className="md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-1">
            Built for real life, <span style={{ background: 'linear-gradient(135deg, #2D8CFF, #F26D21)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>not just a demo.</span>
          </h3>
          <p className="text-xs md:text-base text-gray-500 font-medium max-w-md leading-relaxed">
            Everything you need working seamlessly together in one beautiful financial workspace.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FeatureFlightSection() {
  return (
    <div className="relative w-full pb-10 overflow-hidden flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto text-center px-5 mb-8">
        <div className="w-full text-4xl sm:text-5xl md:text-7xl lg:text-[88px] whitespace-nowrap leading-none tracking-tighter font-black bg-gradient-to-b from-gray-900 to-gray-300 bg-clip-text text-transparent pb-4">
          Every Feature You Need
        </div>
      </div>

      {/* Flight Path Container */}
      <div 
        className="w-full relative h-[220px] md:h-[260px] flex items-center justify-center"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        {/* Background Clouds */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ x: ["-10vw", "110vw"] }} 
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }} 
            className="absolute top-4 left-0 w-24 text-slate-200"
          >
            <CloudSVG className="w-full" />
          </motion.div>
          <motion.div 
            animate={{ x: ["110vw", "-20vw"] }} 
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }} 
            className="absolute bottom-8 right-0 w-32 text-slate-200 opacity-80"
          >
            <CloudSVG className="w-full" />
          </motion.div>
          <motion.div 
            animate={{ x: ["-20vw", "120vw"] }} 
            transition={{ duration: 180, repeat: Infinity, ease: "linear", delay: 10 }} 
            className="absolute top-1/2 left-0 w-40 text-slate-200 opacity-60"
          >
            <CloudSVG className="w-full" />
          </motion.div>
        </div>

        {/* The Animated Flight Group */}
        <motion.div
          className="flex items-center absolute left-0"
          animate={{
            x: ["150vw", "-150vw", "-150vw", "150vw", "150vw"],
            scaleX: [1, 1, -1, -1, 1]
          }}
          transition={{
            duration: 80,
            ease: "linear",
            repeat: Infinity,
            times: [0, 0.499, 0.5, 0.999, 1]
          }}
        >
          {/* Group containing Plane + Rope + Banner */}
          <div className="flex items-center">
            {/* Airplane hovering */}
            <motion.div
              animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <AirplaneSVG />
            </motion.div>

            {/* Tow Rope */}
            <div className="relative w-16 md:w-32 lg:w-48 h-full flex items-center -ml-6 md:-ml-12 -mr-4 md:-mr-8 z-0">
              <svg width="100%" height="60" viewBox="0 0 100 60" preserveAspectRatio="none" className="overflow-visible">
                <motion.path
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="2"
                  animate={{ 
                    d: [
                      "M 0 30 C 30 50, 70 10, 100 30", 
                      "M 0 30 C 30 10, 70 50, 100 30", 
                      "M 0 30 C 30 50, 70 10, 100 30"
                    ] 
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </div>

            {/* Banner */}
            <AnimatedBanner />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
