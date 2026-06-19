import { useState, useEffect } from 'react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--frosted' : ''}`}>
      <div className="container navbar__inner">
        <div className="navbar__logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect width="28" height="28" rx="8" fill="url(#logo-grad)" />
            <path d="M8 18l4-8 4 6 2-3 3 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#4F46E5"/>
                <stop offset="1" stopColor="#7C3AED"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="navbar__brand">Cashtro</span>
        </div>

        <div className="navbar__links">
          <button className="navbar__link" onClick={() => scrollTo('features')}>Features</button>
          <button className="navbar__link" onClick={() => scrollTo('pricing')}>Pricing</button>
        </div>

        <button className="btn-primary navbar__cta" onClick={() => scrollTo('pricing')}>
          Get Started →
        </button>
      </div>
    </nav>
  );
}
