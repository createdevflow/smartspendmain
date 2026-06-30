import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cashtro Admin | SaaS Command Center",
  description: "Premium dashboard to manage Cashtro users, plans, and features.",
  icons: {
    icon: "/admin/cashtro-icon.png",
    shortcut: "/admin/cashtro-icon.png",
    apple: "/admin/cashtro-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
