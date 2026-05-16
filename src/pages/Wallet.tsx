import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import WalletSection from "@/components/WalletSection";

const Wallet = () => (
  <div className="min-h-screen bg-background pb-16">
    <Navbar />
    <main className="pt-14">
      <WalletSection />
    </main>
    <BottomNav />
  </div>
);

export default Wallet;
