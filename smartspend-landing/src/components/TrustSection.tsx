'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';

const BASE_METRICS = [
  { id: 'totalTransactions', label: 'Transactions Managed', baseValue: 5000000, suffix: '+', prefix: '' },
  { id: 'totalBudgets', label: 'Budgets Managed', baseValue: 1200000, suffix: '+', prefix: '' },
  { id: 'totalUsers', label: 'Active Users', baseValue: 250000, suffix: '+', prefix: '' },
  { id: 'activeCashbooks', label: 'Cashbooks Created', baseValue: 850000, suffix: '+', prefix: '' },
  { id: 'savingsTracked', label: 'Savings Tracked', baseValue: 450, suffix: 'M+', prefix: '$' },
];

function AnimatedCounter({ from, to }: { from: number, to: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-50px" });
  
  useEffect(() => {
    if (inView && nodeRef.current) {
      const node = nodeRef.current;
      animate(from, to, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate: (val) => {
          node.textContent = Math.round(val).toLocaleString('en-US');
        }
      });
    }
  }, [inView, from, to]);

  return <span ref={nodeRef}>{from.toLocaleString('en-US')}</span>;
}

export default function TrustSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api/v1'}/app-config/metrics`)
      .then(r => r.json())
      .then(res => {
        if (res?.data) {
          setMetrics(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const displayMetrics = BASE_METRICS.map(m => {
    if (!metrics) return { ...m, value: m.baseValue };
    if (m.id === 'savingsTracked') return { ...m, value: m.baseValue }; // arbitrary static for now
    return { ...m, value: m.baseValue + (metrics[m.id] || 0) };
  });

  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={inView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.6 }}
           className="text-center mb-14"
        >
          <p className="text-sm font-bold text-[#747487] uppercase tracking-widest">
            Trusted by Thousands of Users
          </p>
        </motion.div>

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 md:gap-10">
          {displayMetrics.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="text-3xl md:text-4xl font-black text-[#232333] mb-2 group-hover:scale-110 transition-transform duration-300">
                {item.prefix}<AnimatedCounter from={0} to={item.value} />{item.suffix}
              </div>
              <div className="text-[13px] font-semibold text-[#747487]">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
