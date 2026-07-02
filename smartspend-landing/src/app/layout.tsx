import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cashtro — Smart Finance for Modern India',
  description:
    'Cashtro is the connected financial workspace that unifies money tracking, wealth management, AI insights, shared cashbooks, and secure chat in one premium app.',
  keywords: ['finance app', 'money management', 'cashbook', 'budgeting', 'India', 'expense tracker', 'wealth tracker'],
  authors: [{ name: 'Cashtro' }],
  openGraph: {
    title: 'Cashtro — Smart Finance for Modern India',
    description: 'The connected financial workspace for modern India. Track money, grow wealth, and collaborate.',
    url: 'https://cashtro.in',
    siteName: 'Cashtro',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Cashtro App' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cashtro — Smart Finance for Modern India',
    description: 'The connected financial workspace for modern India.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
