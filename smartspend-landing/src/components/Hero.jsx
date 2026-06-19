import { useState, useEffect, useRef } from 'react';
import './Hero.css';

const TODAY = new Date().toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const ENTRIES = [
  { time: '10:00 AM', merchant: 'HDFC Salary',   category: 'Income',  amount: '+₹52,000', positive: true  },
  { time: '01:30 PM', merchant: 'Swiggy',         category: 'Food',    amount: '−₹340',   positive: false },
  { time: '04:15 PM', merchant: 'Metro Card',     category: 'Travel',  amount: '−₹200',   positive: false },
  { time: '08:00 PM', merchant: 'Netflix',        category: 'Bills',   amount: '−₹649',   positive: false },
];

const NET_AMOUNT = '+₹50,811';

const ROW_DELAY_MS = 380; // gap between each row appearing

export default function Hero() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showNet, setShowNet] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(ENTRIES.length);
      setShowNet(true);
      setShowCTA(true);
      return;
    }

    // Stagger each entry row appearing
    let i = 0;
    const tick = () => {
      i++;
      setVisibleCount(i);
      if (i < ENTRIES.length) {
        setTimeout(tick, ROW_DELAY_MS);
      } else {
        setTimeout(() => setShowNet(true), ROW_DELAY_MS * 0.8);
        setTimeout(() => setShowCTA(true), ROW_DELAY_MS * 1.6);
      }
    };

    // Small initial pause so the page settles first
    const start = setTimeout(tick, 400);
    return () => clearTimeout(start);
  }, [reducedMotion]);

  return (
    <section className="hero">
      <div className="container hero__container">

        {/* ── Passbook Ledger ── */}
        <div className="ledger" role="table" aria-label="Today's passbook entries">

          {/* Date stamp header */}
          <div className="ledger__header" role="row">
            <span className="ledger__header-date mono">{TODAY}</span>
            <span className="ledger__header-brand">Cashtro</span>
          </div>

          <div className="ledger__rule" />

          {/* Column labels */}
          <div className="ledger__col-labels" role="row" aria-hidden="true">
            <span className="ledger__col-label col-time">Time</span>
            <span className="ledger__col-label col-merchant">Merchant</span>
            <span className="ledger__col-label col-category">Category</span>
            <span className="ledger__col-label col-amount">Amount</span>
          </div>

          <div className="ledger__rule" />

          {/* Transaction rows */}
          <div className="ledger__body" role="rowgroup">
            {ENTRIES.map((entry, i) => (
              <div
                key={i}
                role="row"
                className={`ledger__row ${entry.positive ? 'ledger__row--income' : 'ledger__row--expense'} ${i < visibleCount ? 'ledger__row--visible' : ''}`}
              >
                <span className="mono col-time ledger__cell ledger__cell--time">{entry.time}</span>
                <span className="col-merchant ledger__cell ledger__cell--merchant">{entry.merchant}</span>
                <span className="col-category ledger__cell ledger__cell--category">
                  <span className={`category-chip ${entry.positive ? 'category-chip--income' : 'category-chip--expense'}`}>
                    {entry.category}
                  </span>
                </span>
                <span className={`mono col-amount ledger__cell ledger__cell--amount ${entry.positive ? 'amount--positive' : 'amount--negative'}`}>
                  {entry.amount}
                </span>
              </div>
            ))}
          </div>

          <div className="ledger__rule" />

          {/* Net row */}
          <div className={`ledger__net ${showNet ? 'ledger__net--visible' : ''}`} role="row">
            <span className="ledger__net-label">Today's Net</span>
            <span className="mono ledger__net-amount amount--positive">{NET_AMOUNT}</span>
          </div>

          <div className="ledger__rule" />
        </div>

        {/* ── CTAs below ledger ── */}
        <div className={`hero__cta ${showCTA ? 'hero__cta--visible' : ''}`}>
          <button className="btn-primary hero__cta-primary">
            Open Your Passbook →
          </button>
          <a href="#features" className="hero__cta-link">See how it works</a>
        </div>

      </div>
    </section>
  );
}
