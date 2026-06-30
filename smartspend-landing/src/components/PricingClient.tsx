"use client";

import { useState, useMemo } from "react";
import { Check, X } from "lucide-react";

export default function PricingClient({ plans }: { plans: any[] }) {
  const [billingCycle, setBillingCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Extract a master list of all unique features across all plans
  const allFeatures = useMemo(() => {
    const featureMap = new Map();
    plans.forEach(plan => {
      plan.features?.forEach((f: any) => {
        if (f.feature?.name) {
          featureMap.set(f.feature.name, true);
        }
      });
    });
    return Array.from(featureMap.keys());
  }, [plans]);

  if (!plans || plans.length === 0) return null;

  return (
    <section id="pricing" className="py-24 bg-brand-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-text-main mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-brand-text-muted max-w-2xl mx-auto mb-10">
            Choose the perfect plan for your financial journey. No hidden fees, ever.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            {(['weekly', 'monthly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold capitalize transition-all ${
                  billingCycle === cycle 
                    ? 'bg-brand-primary text-white shadow-md' 
                    : 'text-brand-text-muted hover:text-brand-text-main'
                }`}
              >
                {cycle}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
          {plans.map((plan: any) => {
            const isPopular = plan.slug === 'pro' || plan.isPopular;
            
            // Get the appropriate price
            let price = plan.priceMonthly;
            if (billingCycle === 'weekly') price = plan.priceWeekly || Math.round((plan.priceMonthly * 12) / 52);
            if (billingCycle === 'yearly') price = plan.priceYearly || Math.round(plan.priceMonthly * 10);
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 border h-full flex flex-col ${
                  isPopular 
                    ? 'border-brand-primary shadow-[0_8px_30px_rgb(37,99,235,0.12)] md:-translate-y-4' 
                    : 'border-gray-100 shadow-sm'
                } transition-transform hover:-translate-y-2`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-brand-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-brand-text-main mb-2">{plan.name}</h3>
                <p className="text-brand-text-muted text-sm mb-6">{plan.description || 'Unlock advanced features for a smarter financial life.'}</p>
                
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-brand-text-main">
                    ₹{price?.toLocaleString('en-IN') || 0}
                  </span>
                  <span className="text-brand-text-muted">/{billingCycle === 'weekly' ? 'wk' : billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                
                <a 
                  href="http://localhost:3001/register" 
                  className={`block w-full py-3 px-4 rounded-xl text-center font-semibold transition-all mb-8 ${
                    isPopular 
                      ? 'bg-brand-primary text-white hover:bg-brand-primary-dark shadow-md hover:shadow-lg' 
                      : 'bg-brand-bg text-brand-text-main hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </a>
                
                <div className="space-y-4 flex-1">
                  {allFeatures.map((featureName, i) => {
                    const featureEntry = plan.features?.find((f: any) => f.feature?.name === featureName);
                    
                    let hasFeature = false;
                    let displayValue = featureName;

                    if (featureEntry) {
                      const val = featureEntry.value;
                      const type = featureEntry.feature?.type;
                      
                      if (type === 'boolean') {
                        hasFeature = val === 'true';
                      } else if (type === 'number') {
                        hasFeature = parseInt(val) > 0;
                        if (hasFeature) {
                          const formattedVal = val === '-1' || parseInt(val) > 900 ? 'Unlimited' : val;
                          displayValue = `${formattedVal} ${featureName}`;
                        }
                      } else {
                        hasFeature = true;
                      }
                    }
                    
                    if (hasFeature) {
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                            <Check size={12} className="text-brand-primary" />
                          </div>
                          <span className="text-sm text-brand-text-main font-medium">
                            {displayValue}
                          </span>
                        </div>
                      );
                    } else {
                      return (
                        <div key={i} className="flex items-start gap-3 opacity-50">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                            <X size={12} className="text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-400 line-through">
                            {featureName}
                          </span>
                        </div>
                      );
                    }
                  })}
                  
                  {allFeatures.length === 0 && (
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                        <Check size={12} className="text-brand-primary" />
                      </div>
                      <span className="text-sm text-brand-text-main">Basic tracking features</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
