import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox, Table } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy — Cashtro',
  description: 'Learn how Cashtro uses cookies, local storage, and session storage to improve your experience and keep your account secure.',
};

const TOC = [
  { id: 'what-are-cookies', label: '1. What Are Cookies?' },
  { id: 'cookies-we-use', label: '2. Cookies We Use' },
  { id: 'essential', label: '3. Essential Cookies' },
  { id: 'functional', label: '4. Functional Cookies' },
  { id: 'analytics', label: '5. Analytics Cookies' },
  { id: 'local-storage', label: '6. Local & Session Storage' },
  { id: 'managing', label: '7. Managing Cookies' },
  { id: 'contact', label: '8. Contact' },
];

export default function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="This Cookie Policy explains how Cashtro uses cookies, similar tracking technologies, and browser storage to provide a secure and personalized experience."
      badge="🍪 Cookie & Storage Policy"
      badgeColor="bg-gradient-to-br from-amber-700 via-orange-800 to-rose-900"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="cookie-policy"
      toc={TOC}
    >
      <Section id="what-are-cookies" number={1} color="bg-amber-50 text-amber-600" title="What Are Cookies?">
        <p>Cookies are small text files that are stored on your device when you visit our web application. They are widely used to make websites work efficiently, improve performance, and provide information to site operators.</p>
        <p>In addition to cookies, we also use browser localStorage and sessionStorage to maintain your session state and preferences on the client side.</p>
        <InfoBox type="info">
          Cashtro does <strong>not</strong> use advertising cookies, behavioral tracking cookies, or allow third-party advertising networks to place cookies on our Platform.
        </InfoBox>
      </Section>

      <Section id="cookies-we-use" number={2} color="bg-orange-50 text-orange-600" title="Summary of Cookies We Use">
        <Table
          headers={['Cookie Name / Type', 'Category', 'Purpose', 'Duration']}
          rows={[
            ['auth_session / adminToken', 'Essential', 'Maintains your login session securely', 'Session / 30 days (if remembered)'],
            ['csrf_token', 'Essential', 'Prevents cross-site request forgery attacks', 'Session'],
            ['device_id', 'Essential', 'Identifies trusted devices for security alerts', '1 year'],
            ['theme_preference', 'Functional', 'Remembers your light/dark mode selection', '1 year'],
            ['dashboard_layout', 'Functional', 'Saves your dashboard widget arrangement', '1 year'],
            ['language_preference', 'Functional', 'Remembers your language choice', '1 year'],
            ['onboarding_complete', 'Functional', 'Tracks whether you have completed onboarding', '1 year'],
            ['analytics_id (internal)', 'Analytics', 'Anonymized product usage analytics', '90 days'],
          ]}
        />
      </Section>

      <Section id="essential" number={3} color="bg-blue-50 text-blue-600" title="Essential Cookies">
        <p>These cookies are strictly necessary for the Platform to function. Without them, you cannot log in, maintain a session, or use core features. They cannot be disabled.</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>Authentication Tokens:</strong> Secure JWT tokens stored in httpOnly cookies or localStorage to maintain your login state.</li>
          <li><strong>CSRF Protection:</strong> Tokens that prevent malicious websites from making unauthorized requests using your session.</li>
          <li><strong>Security Flags:</strong> Cookies that help us detect and prevent suspicious access attempts.</li>
        </ul>
      </Section>

      <Section id="functional" number={4} color="bg-purple-50 text-purple-600" title="Functional Cookies">
        <p>Functional cookies improve your experience by remembering your preferences:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li><strong>Theme Preference:</strong> Remembers whether you prefer light or dark mode.</li>
          <li><strong>Dashboard Layout:</strong> Saves your customized widget arrangement on the dashboard.</li>
          <li><strong>Filter & Sort Preferences:</strong> Remembers your last-used filters in transaction lists and reports.</li>
          <li><strong>Onboarding State:</strong> Tracks which onboarding steps you have completed to avoid repetition.</li>
        </ul>
        <InfoBox type="success">
          You can clear functional cookies by resetting your app preferences in Settings &gt; Appearance, or by clearing your browser's cookies and localStorage.
        </InfoBox>
      </Section>

      <Section id="analytics" number={5} color="bg-emerald-50 text-emerald-600" title="Analytics Cookies">
        <p>We use internal analytics to understand how users interact with Cashtro and improve the product:</p>
        <ul className="list-disc pl-5 space-y-2 mt-3">
          <li>All analytics data is <strong>anonymized</strong> — it cannot be linked back to your identity.</li>
          <li>We track which features are used, how frequently, and common navigation paths to improve usability.</li>
          <li>We do <strong>not</strong> use Google Analytics, Facebook Pixel, or other third-party advertising analytics.</li>
          <li>Analytics data is retained for 90 days and then automatically deleted.</li>
        </ul>
      </Section>

      <Section id="local-storage" number={6} color="bg-sky-50 text-sky-600" title="Local Storage & Session Storage">
        <p>In addition to cookies, we use browser storage mechanisms:</p>
        <Table
          headers={['Storage Type', 'What We Store', 'When Cleared']}
          rows={[
            ['localStorage', 'Auth tokens (if "Remember Me"), theme, layout prefs', 'When you log out or clear browser data'],
            ['sessionStorage', 'Auth tokens (if not "Remember Me"), temp form data', 'When browser tab or window is closed'],
            ['IndexedDB (Mobile App)', 'Offline transaction queue, cached report data', 'On sync or manual clear'],
          ]}
        />
      </Section>

      <Section id="managing" number={7} color="bg-rose-50 text-rose-600" title="Managing & Controlling Cookies">
        <SubSection title="In-App Controls">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Clear your session: Settings &gt; Security &gt; Sign Out of All Devices</li>
            <li>Reset preferences: Settings &gt; Appearance &gt; Reset to Defaults</li>
          </ul>
        </SubSection>
        <SubSection title="Browser Controls">
          <p>You can control cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in. Common browser cookie controls:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Chrome: Settings → Privacy and security → Cookies</li>
            <li>Safari: Settings → Privacy → Manage Website Data</li>
            <li>Firefox: Settings → Privacy & Security → Cookies</li>
          </ul>
        </SubSection>
        <InfoBox type="warning">
          Clearing essential authentication cookies will log you out of Cashtro on that device.
        </InfoBox>
      </Section>

      <Section id="contact" number={8} color="bg-blue-50 text-blue-600" title="Questions About Cookies">
        <p>For questions about our cookie usage, contact us at <a href="mailto:legal@cashtro.in" className="text-blue-600 underline font-medium">legal@cashtro.in</a>.</p>
      </Section>
    </LegalLayout>
  );
}
