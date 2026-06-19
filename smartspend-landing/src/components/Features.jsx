import { useEffect, useRef, useState } from 'react';
import './Features.css';

/* ---------- Live Cashbook mini-ledger rows ---------- */
const LEDGER_ROWS = [
  { emoji: '🍕', name: 'Domino\'s Pizza', cat: 'Food', amount: '-₹549', neg: true },
  { emoji: '⛽', name: 'HPCL Petrol', cat: 'Transport', amount: '-₹1,200', neg: true },
  { emoji: '🏦', name: 'HDFC Interest', cat: 'Income', amount: '+₹342', neg: false },
  { emoji: '📦', name: 'Amazon Order', cat: 'Shopping', amount: '-₹2,499', neg: true },
];

function LedgerRow({ emoji, name, cat, amount, neg, visible }) {
  return (
    <div className={`ledger-row ${visible ? 'ledger-row--visible' : ''}`}>
      <span className="ledger-row__icon">{emoji}</span>
      <div className="ledger-row__text">
        <span className="ledger-row__name">{name}</span>
        <span className="ledger-row__cat">{cat}</span>
      </div>
      <span className={`ledger-row__amount mono ${neg ? 'neg' : 'pos'}`}>{amount}</span>
    </div>
  );
}

/* ---------- Spending bar chart ---------- */
const SPEND_CATS = [
  { label: 'Food', pct: 35, color: '#F59E0B' },
  { label: 'Transport', pct: 18, color: '#3B82F6' },
  { label: 'Bills', pct: 22, color: '#8B5CF6' },
  { label: 'Shopping', pct: 15, color: '#EC4899' },
  { label: 'Other', pct: 10, color: '#10B981' },
];

function SpendingChart({ animate }) {
  return (
    <div className="spend-chart">
      {SPEND_CATS.map((c) => (
        <div key={c.label} className="spend-chart__row">
          <span className="spend-chart__label">{c.label}</span>
          <div className="spend-chart__track">
            <div
              className="spend-chart__bar"
              style={{
                width: animate ? `${c.pct}%` : '0%',
                background: c.color,
              }}
            />
          </div>
          <span className="spend-chart__pct mono">{c.pct}%</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Private mode toggle ---------- */
function PrivateDemo() {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="private-demo">
      <div className="private-demo__row">
        <span className="private-demo__key">Balance</span>
        <span className={`private-demo__val mono ${hidden ? 'blurred' : ''}`}>₹84,320.50</span>
      </div>
      <div className="private-demo__row">
        <span className="private-demo__key">Last txn</span>
        <span className={`private-demo__val mono ${hidden ? 'blurred' : ''}`}>-₹342</span>
      </div>
      <button
        className="private-demo__toggle"
        onClick={() => setHidden(!hidden)}
        aria-label="Toggle private mode"
      >
        {hidden ? '👁 Show' : '🙈 Hide'}
      </button>
    </div>
  );
}

/* ---------- Currency chip ---------- */
const CURRENCIES = ['₹ 84,320', '$ 1,012', '€ 935'];

function CurrencyChip() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CURRENCIES.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="currency-chip">
      <span className="currency-chip__arrow">⇄</span>
      <span className="currency-chip__val mono">{CURRENCIES[idx]}</span>
    </div>
  );
}

/* ---------- Main Features ---------- */
export default function Features() {
  const [ledgerCount, setLedgerCount] = useState(0);
  const [chartInView, setChartInView] = useState(false);
  const ledgerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ledgerObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let i = 0;
        const tick = () => {
          setLedgerCount((c) => Math.min(c + 1, LEDGER_ROWS.length));
          i++;
          if (i < LEDGER_ROWS.length) setTimeout(tick, 220);
        };
        tick();
        ledgerObs.disconnect();
      }
    }, { threshold: 0.3 });

    const chartObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setChartInView(true); chartObs.disconnect(); }
    }, { threshold: 0.4 });

    if (ledgerRef.current) ledgerObs.observe(ledgerRef.current);
    if (chartRef.current) chartObs.observe(chartRef.current);
    return () => { ledgerObs.disconnect(); chartObs.disconnect(); };
  }, []);

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="section-header">
          <h2>Everything your bank app forgot to build.</h2>
          <p>Built for people who actually want to understand their money, not just track it.</p>
        </div>

        {/* Row 1: 2-col asymmetric */}
        <div className="features__grid">
          {/* Large card: Live Cashbooks */}
          <div className="feat-card feat-card--large" ref={ledgerRef}>
            <div className="feat-card__tag">Live Cashbooks</div>
            <h3 className="feat-card__title">Every transaction, exactly where you expect it.</h3>
            <p className="feat-card__desc">Create separate cashbooks for personal, business, or family. Log cash, UPI, card — all in one ledger.</p>
            <div className="feat-card__demo">
              <div className="ledger-header">
                <span>Transactions</span>
                <span className="mono" style={{ color: 'var(--positive)' }}>+₹12,450 net</span>
              </div>
              {LEDGER_ROWS.map((row, i) => (
                <LedgerRow key={i} {...row} visible={i < ledgerCount} />
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="features__right-col">
            {/* Private Mode */}
            <div className="feat-card">
              <div className="feat-card__tag">Private Mode</div>
              <h3 className="feat-card__title">Check your balance in public without the anxiety.</h3>
              <div className="feat-card__demo">
                <PrivateDemo />
              </div>
            </div>

            {/* Multi-Currency */}
            <div className="feat-card">
              <div className="feat-card__tag">Multi-Currency</div>
              <h3 className="feat-card__title">One app, every currency you travel with.</h3>
              <div className="feat-card__demo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                <CurrencyChip />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Spending Insights full-width */}
        <div className="feat-card feat-card--full" ref={chartRef}>
          <div className="feat-card__tag">Spending Insights</div>
          <h3 className="feat-card__title">See exactly where your money escapes.</h3>
          <p className="feat-card__desc">Auto-categorised spending. Real percentages. No filler dashboards.</p>
          <SpendingChart animate={chartInView} />
        </div>
      </div>
    </section>
  );
}
