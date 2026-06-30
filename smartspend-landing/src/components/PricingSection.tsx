'use client';

import { useState, useEffect } from 'react';
import PricingClient from './PricingClient';

const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free',
    slug: 'free',
    priceWeekly: 0,
    priceMonthly: 0,
    priceYearly: 0,
    isPopular: false,
    description: 'Essential tracking for everyday personal finance',
    tagline: 'Start tracking your finances for free',
    features: [
      { feature: { name: 'Max Cashbooks', type: 'number' }, value: '99' },
      { feature: { name: 'Monthly Transactions', type: 'number' }, value: '200' },
      { feature: { name: 'AI Receipt Scanner (OCR)', type: 'boolean' }, value: 'false' },
      { feature: { name: 'Smart AI Budget Insights', type: 'boolean' }, value: 'false' },
      { feature: { name: 'Shared Team Cashbooks', type: 'boolean' }, value: 'false' },
      { feature: { name: 'Tax Export Reports', type: 'boolean' }, value: 'false' },
      { feature: { name: 'Wealth Management Hub', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Gamification & Rewards', type: 'boolean' }, value: 'true' },
      { feature: { name: 'AI Assistant Chat', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Emergency Panic Button', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Cloud Backup & Restore', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Receipt Gallery Attachments', type: 'boolean' }, value: 'true' },
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    priceWeekly: 49,
    priceMonthly: 199,
    priceYearly: 1990,
    isPopular: true,
    description: 'Advanced AI features & automation for power users',
    tagline: 'Take full control of your finances',
    features: [
      { feature: { name: 'Max Cashbooks', type: 'number' }, value: '999' },
      { feature: { name: 'Monthly Transactions', type: 'number' }, value: '9999' },
      { feature: { name: 'AI Receipt Scanner (OCR)', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Smart AI Budget Insights', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Shared Team Cashbooks', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Tax Export Reports', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Wealth Management Hub', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Gamification & Rewards', type: 'boolean' }, value: 'true' },
      { feature: { name: 'AI Assistant Chat', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Emergency Panic Button', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Cloud Backup & Restore', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Receipt Gallery Attachments', type: 'boolean' }, value: 'true' },
    ]
  },
  {
    id: 'business',
    name: 'Business',
    slug: 'business',
    priceWeekly: 149,
    priceMonthly: 499,
    priceYearly: 4990,
    isPopular: false,
    description: 'Complete collaboration & finance toolkit for growing teams',
    tagline: 'Complete finance toolkit for your business',
    features: [
      { feature: { name: 'Max Cashbooks', type: 'number' }, value: '999' },
      { feature: { name: 'Monthly Transactions', type: 'number' }, value: '99999' },
      { feature: { name: 'AI Receipt Scanner (OCR)', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Smart AI Budget Insights', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Shared Team Cashbooks', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Tax Export Reports', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Wealth Management Hub', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Gamification & Rewards', type: 'boolean' }, value: 'true' },
      { feature: { name: 'AI Assistant Chat', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Emergency Panic Button', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Cloud Backup & Restore', type: 'boolean' }, value: 'true' },
      { feature: { name: 'Receipt Gallery Attachments', type: 'boolean' }, value: 'true' },
    ]
  }
];

export default function PricingSection() {
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    fetch(`${API_BASE}/plans`)
      .then(async r => {
        if (!r.ok) return null;
        const contentType = r.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return null;
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })
      .then(data => {
        if (!data) return;
        const fetchedPlans = data?.data || data || [];
        if (Array.isArray(fetchedPlans) && fetchedPlans.length > 0) {
          setPlans(prevPlans => prevPlans.map(defaultPlan => {
            const dbPlan = fetchedPlans.find((p: any) => p.slug === defaultPlan.slug || p.id === defaultPlan.id);
            if (!dbPlan) return defaultPlan;
            return {
              ...defaultPlan,
              name: dbPlan.name || defaultPlan.name,
              priceWeekly: dbPlan.priceWeekly ?? defaultPlan.priceWeekly,
              priceMonthly: dbPlan.priceMonthly ?? defaultPlan.priceMonthly,
              priceYearly: dbPlan.priceYearly ?? defaultPlan.priceYearly,
              description: dbPlan.description || defaultPlan.description,
            };
          }));
        }
      })
      .catch(err => {
        console.error('Error fetching plans:', err);
      });
  }, []);

  return <PricingClient plans={plans} />;
}
