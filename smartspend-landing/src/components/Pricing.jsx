import { useState, useEffect, useRef } from 'react';
import './Pricing.css';

/* API endpoint */
const PLANS_API = 'http://localhost:3000/api/v1/plans';

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Skeleton loader ── */
function PricingSkeleton() {
  return (
    <div className="pricing-card pricing-card--skeleton" aria-hidden="true">
      <div className="skeleton" style={{ height: 20, width: '55%', marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 52, width: '75%', marginBottom: 22 }} />
      {[1,2,3,4].map(i => (
        <div key={i} className="skeleton" style={{ height: 14, width: `${75+i*4}%`, marginBottom: 12 }} />
      ))}
      <div className="skeleton" style={{ height: 46, width: '100%', marginTop: 24, borderRadius: 9999 }} />
    </div>
  );
}

/* ── Feature label resolver ── */
function featureLabel(pf) {
  const f = pf.feature;
  if (!f) return pf.featureKey || '';
  if (f.type === 'BOOLEAN') return f.name;
  const val = pf.value ?? pf.limitValue ?? '∞';
  return `${f.name}${val !== true ? ': ' + val + (f.unit ? ' ' + f.unit : '') : ''}`;
}

/* ── Individual plan card ── */
function PlanCard({ plan, billing, delay }) {
  const ref = useReveal();
  const price = billing === 'yearly' ? plan.priceYearly ?? null : plan.priceMonthly ?? null;
  const isPopular = plan.isPopular ?? plan.slug === 'pro';
  const isPaid = price !== null && price > 0;
  const yearlyOriginal = plan.priceMonthly ? plan.priceMonthly * 12 : null;
  const yearlySaving = (billing === 'yearly' && yearlyOriginal && isPaid)
    ? Math.round(((yearlyOriginal - plan.priceYearly) / yearlyOriginal) * 100) : null;

  return (
    <div
      ref={ref}
      className={`pricing-card reveal ${isPopular ? 'pricing-card--popular' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {isPopular && (
        <div className="pricing-card__badge">
          ⭐ Most Popular
        </div>
      )}

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
        {plan.ctaLabel ?? (isPaid ? `Choose ${plan.name}` : 'Get Started Free')}
      </button>
    </div>
  );
}

/* ── Pricing section ── */
export default function Pricing() {
  const [plans, setPlans]   = useState([]);
  const [status, setStatus] = useState('loading');
  const [billing, setBilling] = useState('monthly');
  const headerRef = useReveal();
  const toggleRef = useReveal();

  useEffect(() => {
    setStatus('loading');
    fetch(PLANS_API)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(json => { setPlans(Array.isArray(json) ? json : json.data ?? []); setStatus('ok'); })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <section id="pricing" className="pricing">
      <div className="container">

        {/* Header */}
        <div ref={headerRef} className="section-header reveal">
          <div className="pricing__eyebrow">Pricing Plans</div>
          <h2>Simple pricing, no surprises.</h2>
          <p>Start free. Upgrade when your finances get serious.</p>
        </div>

        {/* Billing toggle */}
        <div ref={toggleRef} className="pricing__toggle reveal" role="group" aria-label="Billing period">
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

        {/* Cards grid */}
        <div className="pricing__grid">
          {status === 'loading' && [1,2,3].map(i => <PricingSkeleton key={i} />)}

          {status === 'error' && (
            <div className="pricing__error">
              <div className="pricing__error-icon">🔌</div>
              <p>Could not load pricing right now.</p>
              <button className="btn-ghost" onClick={() => { setStatus('loading'); location.reload(); }}>
                Try again
              </button>
            </div>
          )}

          {status === 'ok' && plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} delay={i * 80} />
          ))}
        </div>

        {/* Trust strip */}
        <div className="pricing__trust reveal" ref={useReveal()}>
          <span>🔒 Secure payments</span>
          <span>·</span>
          <span>💳 Cancel anytime</span>
          <span>·</span>
          <span>🇮🇳 Made for India</span>
        </div>

      </div>
    </section>
  );
}
