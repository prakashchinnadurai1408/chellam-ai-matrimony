import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import SuccessStories from "@/components/SuccessStories";
import TrustSection from "@/components/TrustSection";
import CommunityPortals from "@/components/CommunityPortals";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <DiscoveryFeed />
      <HowItWorks />
      <TrustSection />
      <CommunityPortals />
      <PricingSection />
      <SuccessStories />
      <Footer />
    </div>
  );
};

export default Index;
