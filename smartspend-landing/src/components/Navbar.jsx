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
          <img src="/cashtro-icon.png" alt="Cashtro" width="32" height="32" style={{ objectFit: 'contain' }} />
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
