import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import TrustSection from '../components/TrustSection';
import FeaturesSection from '../components/FeaturesSection';
import EcosystemSection from '../components/EcosystemSection';
import PricingSection from '../components/PricingSection';
import FAQSection from '../components/FAQSection';
import DownloadSection from '../components/DownloadSection';
import Footer from '../components/Footer';

// Fetch app download config from backend (server-side)
async function getAppConfig() {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    const res = await fetch(`${API_BASE}/app-config/public`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
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

export default async function Home() {
  const appConfig = await getAppConfig();

  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <EcosystemSection />
        <PricingSection />
        <FAQSection />
        <DownloadSection config={appConfig ?? undefined} />
      </main>
      <Footer />
    </>
  );
}
