import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cashtro | The Connected Financial Workspace",
  description: "Experience the next generation of personal and business finance. Cashtro combines money management, wealth tracking, AI insights, and secure chat into one beautiful platform.",
  openGraph: {
    title: "Cashtro | The Connected Financial Workspace",
    description: "Experience the next generation of personal and business finance.",
    url: "https://cashtro.app",
    siteName: "Cashtro",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cashtro App Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col pt-[64px]">
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
