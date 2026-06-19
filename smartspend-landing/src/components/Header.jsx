import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

export default function Header() {
  return (
    <header className="header glass">
      <div className="container header-container">
        <div className="logo">
          <Wallet size={28} color="var(--primary)" />
          <span className="logo-text">SmartSpend</span>
        </div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="header-actions">
          <button className="btn-secondary btn-sm">Login</button>
          <button className="btn-primary btn-sm">Get Started</button>
        </div>
      </div>
    </header>
  );
}
