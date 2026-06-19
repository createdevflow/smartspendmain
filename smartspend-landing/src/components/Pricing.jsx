import { useState, useEffect } from 'react';
import './Pricing.css';

/* API endpoint — your real backend */
const PLANS_API = 'http://localhost:3000/api/v1/plans';

/* Skeleton loader for a single card */
function PricingSkeleton() {
  return (
    <div className="pricing-card pricing-card--skeleton" aria-hidden="true">
      <div className="skeleton" style={{ height: 22, width: '60%', marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 48, width: '80%', marginBottom: 24 }} />
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton" style={{ height: 16, width: '90%', marginBottom: 12 }} />
      ))}
      <div className="skeleton" style={{ height: 44, width: '100%', marginTop: 24, borderRadius: 9999 }} />
    </div>
  );
}

/* Resolve a feature to a readable label */
function featureLabel(pf) {
  const f = pf.feature;
  if (!f) return pf.featureKey || '';
  if (f.type === 'BOOLEAN') return f.name;
  const val = pf.value ?? pf.limitValue ?? '∞';
  return `${f.name}: ${val}${f.unit ? ' ' + f.unit : ''}`;
}

/* Individual plan card */
function PlanCard({ plan, billing }) {
  const price = billing === 'yearly'
    ? plan.priceYearly ?? null
    : plan.priceMonthly ?? null;

  const isPopular = plan.isPopular ?? plan.slug === 'pro';
  const isPaid = price !== null && price > 0;
  const yearlyOriginal = plan.priceMonthly ? plan.priceMonthly * 12 : null;
  const yearlySaving = (billing === 'yearly' && yearlyOriginal && isPaid)
    ? Math.round(((yearlyOriginal - plan.priceYearly) / yearlyOriginal) * 100)
    : null;

  return (
    <div className={`pricing-card ${isPopular ? 'pricing-card--popular' : ''}`}>
      {isPopular && <div className="pricing-card__badge">Most Popular</div>}

      <h3 className="pricing-card__name">{plan.name}</h3>

      <div className="pricing-card__price">
        {isPaid ? (
          <>
            <span className="pricing-card__currency mono">₹</span>
            <span className="pricing-card__amount mono">{price}</span>
            <span className="pricing-card__period">/mo</span>
            {yearlySaving && (
              <span className="pricing-card__saving">Save {yearlySaving}%</span>
            )}
          </>
        ) : (
          <span className="pricing-card__amount mono">Free</span>
        )}
      </div>

      {plan.description && (
        <p className="pricing-card__desc">{plan.description}</p>
      )}

      <ul className="pricing-card__features">
        {(plan.features || []).map((pf, i) => (
          <li key={i}>
            <span className="pricing-card__check">✓</span>
            {featureLabel(pf)}
          </li>
        ))}
      </ul>

      <button className={`pricing-card__cta ${isPopular ? 'btn-primary' : 'btn-ghost'}`}>
        {plan.ctaLabel ?? `Choose ${plan.name}`}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [billing, setBilling] = useState('monthly');

  useEffect(() => {
    setStatus('loading');
    fetch(PLANS_API)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const data = Array.isArray(json) ? json : json.data ?? [];
        setPlans(data);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <div className="section-header">
          <h2>Simple pricing, no surprises.</h2>
          <p>Start free. Upgrade when your finances get serious.</p>
        </div>

        {/* Billing toggle */}
        <div className="pricing__toggle" role="group" aria-label="Billing period">
          <button
            className={`pricing__toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`pricing__toggle-btn ${billing === 'yearly' ? 'active' : ''}`}
            onClick={() => setBilling('yearly')}
          >
            Yearly
            <span className="pricing__toggle-save">–20%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="pricing__grid">
          {status === 'loading' && [1,2,3].map(i => <PricingSkeleton key={i} />)}

          {status === 'error' && (
            <div className="pricing__error">
              <p>Could not load pricing right now.</p>
              <button className="btn-ghost" onClick={() => setStatus('loading') || location.reload()}>
                Try again
              </button>
            </div>
          )}

          {status === 'ok' && plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  );
}
