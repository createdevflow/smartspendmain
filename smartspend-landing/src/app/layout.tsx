import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cashtro.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Cashtro — Smart Finance for Modern India',
  description:
    'Cashtro is the connected financial workspace that unifies money tracking, wealth management, AI insights, shared cashbooks, and secure chat in one premium app.',
  keywords: ['finance app', 'money management', 'cashbook', 'budgeting', 'India', 'expense tracker', 'wealth tracker', 'invoicing', 'GST billing'],
  authors: [{ name: 'Cashtro' }],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: 'Cashtro — Smart Finance for Modern India',
    description: 'The connected financial workspace for modern India. Track money, grow wealth, and collaborate.',
    url: SITE_URL,
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

// JSON-LD structured data for rich search results
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Cashtro',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@cashtro.in',
  },
  sameAs: [],
};

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cashtro',
  operatingSystem: 'Android, iOS',
  applicationCategory: 'FinanceApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description:
    'Cashtro is the connected financial workspace that unifies money tracking, wealth management, AI insights, shared cashbooks, and secure chat.',
  url: SITE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      </head>
      <body className="min-h-full bg-white text-gray-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
