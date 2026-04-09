import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarketTicker from "@/components/MarketTicker";
import InvestmentPlans from "@/components/InvestmentPlans";
import NFTMarketplace from "@/components/NFTMarketplace";
import WalletSection from "@/components/WalletSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <MarketTicker />
    <InvestmentPlans />
    <NFTMarketplace />
    <WalletSection />
    <Footer />
  </div>
);

export default Index;
