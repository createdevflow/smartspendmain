import React from 'react';
import type { Metadata } from 'next';
import LegalLayout, { Section, SubSection, InfoBox } from '@/components/legal/LegalLayout';

export const metadata: Metadata = {
  title: 'Security Policy — Cashtro',
  description: 'Learn about Cashtro\'s security practices, vulnerability reporting process, responsible disclosure program, and our commitment to protecting user data.',
};

const TOC = [
  { id: 'commitment', label: '1. Security Commitment' },
  { id: 'measures', label: '2. Security Measures' },
  { id: 'disclosure', label: '3. Vulnerability Disclosure' },
  { id: 'scope', label: '4. Disclosure Scope' },
  { id: 'process', label: '5. Reporting Process' },
  { id: 'response', label: '6. Response Timeline' },
  { id: 'incident', label: '7. Incident Response' },
  { id: 'updates', label: '8. Security Updates' },
  { id: 'contact', label: '9. Security Contact' },
];

export default function SecurityPolicy() {
  return (
    <LegalLayout
      title="Security Policy"
      subtitle="Protecting your financial data is our highest technical priority. This policy describes our security practices, our vulnerability disclosure program, and how we respond to security incidents."
      badge="🛡️ Security & Responsible Disclosure"
      badgeColor="bg-gradient-to-br from-slate-900 via-zinc-900 to-neutral-900"
      lastUpdated="July 20, 2026"
      version="2.0"
      currentSlug="security-policy"
      toc={TOC}
    >
      <Section id="commitment" number={1} color="bg-slate-100 text-slate-600" title="Our Security Commitment">
        <p>Cashtro handles sensitive financial data including transactions, invoices, and personal financial records. We treat security not as a compliance checkbox, but as a core product quality. Our security program is built on the following principles:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {[
            { title: '🔐 Defense in Depth', desc: 'Multiple layers of security controls so no single failure exposes your data.' },
            { title: '🔍 Transparency', desc: 'We disclose security practices openly and communicate incidents promptly.' },
            { title: '🔄 Continuous Improvement', desc: 'Regular security audits, penetration testing, and dependency updates.' },
            { title: '⚡ Rapid Response', desc: 'Dedicated processes to identify, contain, and remediate security issues quickly.' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">{title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="measures" number={2} color="bg-blue-50 text-blue-600" title="Security Measures">
        <SubSection title="Data Encryption">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>All data in transit is protected by TLS 1.3 encryption.</li>
            <li>Sensitive data fields (passwords, PAN, GSTIN, financial records) are encrypted at rest using AES-256.</li>
            <li>Database encryption is applied at the field level for the most sensitive data.</li>
          </ul>
        </SubSection>
        <SubSection title="Authentication & Access">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Passwords are hashed using bcrypt with appropriate cost factors; plaintext passwords are never stored.</li>
            <li>JWT access tokens have short expiry windows with secure refresh token rotation.</li>
            <li>Brute-force protection with progressive rate limiting and account lockout.</li>
            <li>Optional two-factor authentication (2FA) for enhanced account security.</li>
            <li>Suspicious login detection with email alerts for unrecognized devices.</li>
          </ul>
        </SubSection>
        <SubSection title="Infrastructure Security">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Servers run in private VPCs with strict network security groups limiting inbound access.</li>
            <li>All administrative access requires multi-factor authentication.</li>
            <li>Regular automated security scans for known vulnerabilities in dependencies.</li>
            <li>Immutable audit logs for all administrative operations.</li>
            <li>Automated encrypted backups with point-in-time recovery.</li>
          </ul>
        </SubSection>
        <SubSection title="Application Security">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Input validation and sanitization on all API endpoints.</li>
            <li>SQL injection prevention through parameterized queries and ORM usage.</li>
            <li>XSS prevention via output encoding and Content Security Policy headers.</li>
            <li>CSRF protection on all state-changing operations.</li>
            <li>API rate limiting to prevent abuse and denial-of-service attacks.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="disclosure" number={3} color="bg-emerald-50 text-emerald-600" title="Responsible Vulnerability Disclosure">
        <p>We believe responsible disclosure of security vulnerabilities improves security for everyone. We encourage security researchers, users, and developers who discover potential security vulnerabilities to report them to us responsibly.</p>
        <InfoBox type="success">
          <strong>Safe Harbor:</strong> We will not pursue legal action against researchers who discover and report security vulnerabilities in good faith, provided they follow our responsible disclosure guidelines below.
        </InfoBox>
      </Section>

      <Section id="scope" number={4} color="bg-sky-50 text-sky-600" title="Disclosure Program Scope">
        <SubSection title="In Scope">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Web application at cashtro.in and associated subdomains</li>
            <li>Cashtro mobile applications (Android & iOS)</li>
            <li>Cashtro API endpoints</li>
            <li>Authentication and authorization systems</li>
            <li>Data privacy and exposure vulnerabilities</li>
          </ul>
        </SubSection>
        <SubSection title="Out of Scope">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Denial of service attacks or load testing</li>
            <li>Social engineering of Cashtro employees</li>
            <li>Physical security attacks</li>
            <li>Vulnerabilities in third-party services not directly under our control</li>
            <li>Issues requiring physical access to a user's device</li>
            <li>Theoretical vulnerabilities without demonstrated impact</li>
          </ul>
        </SubSection>
        <SubSection title="Responsible Disclosure Rules">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Do not access, modify, or delete user data beyond what is necessary to demonstrate the vulnerability.</li>
            <li>Do not exploit vulnerabilities beyond what is necessary to confirm they exist.</li>
            <li>Do not publicly disclose the vulnerability until we have had a reasonable opportunity to investigate and remediate (minimum 90 days).</li>
            <li>Do not violate the privacy of other users when testing.</li>
          </ul>
        </SubSection>
      </Section>

      <Section id="process" number={5} color="bg-purple-50 text-purple-600" title="Reporting Process">
        <p>To report a security vulnerability:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-3">
          <li>Email a detailed vulnerability report to <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a>.</li>
          <li>Include: Description of the vulnerability, steps to reproduce, potential impact, and affected component.</li>
          <li>Encrypt your report using our PGP public key if sharing sensitive details (key available on request).</li>
          <li>We will acknowledge your report within 72 hours.</li>
          <li>We will keep you updated on our investigation and remediation progress.</li>
        </ol>
      </Section>

      <Section id="response" number={6} color="bg-amber-50 text-amber-600" title="Security Response Timeline">
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Acknowledgment:</strong> Within 72 hours of receiving a valid report.</li>
          <li><strong>Initial Assessment:</strong> Within 7 days — we assess severity using CVSS or similar framework.</li>
          <li><strong>Critical vulnerabilities (CVSS 9+):</strong> Remediated within 24–72 hours.</li>
          <li><strong>High vulnerabilities (CVSS 7–8.9):</strong> Remediated within 14 days.</li>
          <li><strong>Medium/Low vulnerabilities:</strong> Remediated within 90 days.</li>
          <li><strong>Disclosure:</strong> We coordinate with the reporter before any public disclosure.</li>
        </ul>
      </Section>

      <Section id="incident" number={7} color="bg-rose-50 text-rose-600" title="Security Incident Response">
        <p>In the event of a security incident affecting user data:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-3">
          <li><strong>Containment:</strong> Immediately isolate affected systems to prevent further exposure.</li>
          <li><strong>Assessment:</strong> Determine the scope, nature, and extent of the incident.</li>
          <li><strong>Remediation:</strong> Apply patches, revoke compromised tokens, and close attack vectors.</li>
          <li><strong>User Notification:</strong> Notify affected users within 72 hours as required by applicable law, including the nature of the incident and recommended user actions.</li>
          <li><strong>Regulatory Reporting:</strong> Report to relevant Indian regulatory authorities as required by law (CERT-In, Data Protection Board once operational).</li>
          <li><strong>Post-Incident Review:</strong> Conduct a root cause analysis and implement preventive measures.</li>
        </ol>
      </Section>

      <Section id="updates" number={8} color="bg-teal-50 text-teal-600" title="Security Updates">
        <p>We are committed to:</p>
        <ul className="list-disc pl-5 space-y-1.5 mt-3">
          <li>Promptly applying security patches to our infrastructure and dependencies.</li>
          <li>Conducting periodic penetration testing by independent security researchers.</li>
          <li>Reviewing and updating our security practices as threats evolve.</li>
          <li>Communicating significant security updates to users through in-app notifications and email.</li>
        </ul>
      </Section>

      <Section id="contact" number={9} color="bg-blue-50 text-blue-600" title="Security Contact">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="font-bold text-slate-900 mb-4">Cashtro Security Team</p>
          <div className="space-y-2 text-sm">
            <p>🛡️ <strong>Security Reports:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>🔐 <strong>Privacy Incidents:</strong> <a href="mailto:legal@cashtro.in" className="text-blue-600 underline">legal@cashtro.in</a></p>
            <p>⏱️ <strong>Acknowledgment:</strong> Within 72 hours</p>
            <p>🌐 <strong>CERT-In:</strong> We comply with CERT-In's cybersecurity incident reporting requirements.</p>
          </div>
        </div>
      </Section>
    </LegalLayout>
  );
}
