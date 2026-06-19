import './HowItWorks.css';

const STEPS = [
  {
    num: '01',
    title: 'Create a Cashbook',
    desc: 'Name it "Personal", "Business", or anything you like. Set a currency and start fresh.',
    clip: (
      <div className="hiw-clip">
        <div className="hiw-clip__row">
          <div className="hiw-clip__dot" style={{ background: '#4F46E5' }} />
          <span>Personal</span>
          <span className="hiw-clip__badge">₹ INR</span>
        </div>
        <div className="hiw-clip__row">
          <div className="hiw-clip__dot" style={{ background: '#059669' }} />
          <span>Business</span>
          <span className="hiw-clip__badge">$ USD</span>
        </div>
        <div className="hiw-clip__add">+ Add cashbook</div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'Log your transactions',
    desc: 'Cash, UPI, card — log in seconds. Add a note, category, and date.',
    clip: (
      <div className="hiw-clip">
        <div className="hiw-clip__entry">
          <span className="hiw-clip__entry-label">Amount</span>
          <span className="hiw-clip__entry-val mono">₹ 1,250</span>
        </div>
        <div className="hiw-clip__entry">
          <span className="hiw-clip__entry-label">Category</span>
          <span className="hiw-clip__entry-val">🍔 Food</span>
        </div>
        <div className="hiw-clip__save btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px', borderRadius: '8px', display: 'inline-flex', marginTop: '8px' }}>
          Save transaction
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Watch insights build',
    desc: 'As you log more, SmartSpend reveals spending patterns you\'d never spot on your own.',
    clip: (
      <div className="hiw-clip">
        <div className="hiw-clip__insight">
          <span className="hiw-clip__insight-label">Food</span>
          <div className="hiw-clip__insight-bar" style={{ width: '68%', background: '#F59E0B' }} />
        </div>
        <div className="hiw-clip__insight">
          <span className="hiw-clip__insight-label">Travel</span>
          <div className="hiw-clip__insight-bar" style={{ width: '40%', background: '#3B82F6' }} />
        </div>
        <div className="hiw-clip__insight">
          <span className="hiw-clip__insight-label">Bills</span>
          <div className="hiw-clip__insight-bar" style={{ width: '52%', background: '#8B5CF6' }} />
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="hiw">
      <div className="container">
        <div className="section-header">
          <h2>Up and running in 3 steps.</h2>
          <p>No manual imports. No setup wizards. Just log and go.</p>
        </div>
        <div className="hiw__steps">
          {STEPS.map((s, i) => (
            <div key={i} className="hiw__step">
              <span className="hiw__num mono">{s.num}</span>
              <div className="hiw__step-clip">{s.clip}</div>
              <h3 className="hiw__title">{s.title}</h3>
              <p className="hiw__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
