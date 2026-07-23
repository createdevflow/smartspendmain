'use client';
import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * DS Theme Toggle:
 * Applies data-theme="dark" to <html> element.
 * Persists to localStorage.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cashtro-admin-theme');
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('cashtro-admin-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('cashtro-admin-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost btn-sm"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      style={{ width: '28px', padding: 0 }}
    >
      {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}
