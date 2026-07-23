import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/AppContext';
import { ChatProvider } from '@/lib/ChatContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Cashtro | Personal Finance & Wealth',
  description: 'Track cashbooks, split bills, and gain AI insights.',
  icons: { icon: '/cashtro-icon.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppProvider>
          <ChatProvider>
            <div className="app-container">{children}</div>
          </ChatProvider>
        </AppProvider>
      </body>
    </html>
  );
}
