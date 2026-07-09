import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import TrustSection from '../components/TrustSection';
import FeaturesSection from '../components/FeaturesSection';
import EcosystemSection from '../components/EcosystemSection';
import PricingSection from '../components/PricingSection';
import FAQSection from '../components/FAQSection';
import DownloadSection from '../components/DownloadSection';
import BlogSection from '../components/BlogSection';
import Footer from '../components/Footer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Fetch app download config from backend (server-side)
async function getAppConfig() {
  try {
    const res = await fetch(`${API_BASE}/app-config/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const config = json?.data?.config || {};
    return {
      android_enabled: config.download_android_enabled === true,
      android_url: config.download_android_url || '',
      ios_enabled: config.download_ios_enabled === true,
      ios_url: config.download_ios_url || '',
    };
  } catch {
    return null;
  }
}

async function getLatestPosts() {
  try {
    const res = await fetch(`${API_BASE}/blog/published?limit=4`, {
      next: { revalidate: 60 }, // Refresh every minute
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.posts || json?.posts || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [appConfig, latestPosts] = await Promise.all([getAppConfig(), getLatestPosts()]);

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <EcosystemSection />
        <BlogSection posts={latestPosts} />
        <PricingSection />
        <FAQSection />
        <DownloadSection config={appConfig ?? undefined} />
      </main>
      <Footer />
    </>
  );
}
