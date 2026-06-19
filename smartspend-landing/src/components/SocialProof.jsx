import './SocialProof.css';

const STATS = [
  { label: 'on App Store', value: '★★★★★  4.8' },
  { label: 'active users', value: '12,000+' },
  { label: 'tracked this month', value: '₹2.4 Cr' },
];

export default function SocialProof() {
  return (
    <div className="social-proof">
      <div className="container social-proof__inner">
        {STATS.map((s, i) => (
          <div key={i} className="social-proof__item">
            <span className="social-proof__value mono">{s.value}</span>
            <span className="social-proof__label">{s.label}</span>
            {i < STATS.length - 1 && <div className="social-proof__sep" />}
          </div>
        ))}
      </div>
    </div>
  );
}
