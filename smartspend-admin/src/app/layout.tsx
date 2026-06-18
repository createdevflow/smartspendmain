import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartSpend Admin | SaaS Command Center",
  description: "Premium dashboard to manage SmartSpend users, plans, and features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
