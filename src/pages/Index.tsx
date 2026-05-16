import Navbar from "@/components/Navbar";
import InvestHome from "@/components/InvestHome";
import BottomNav from "@/components/BottomNav";

const Index = () => (
  <div className="min-h-screen bg-background pb-16">
    <Navbar />
    <main className="pt-14">
      <InvestHome />
    </main>
    <BottomNav />
  </div>
);

export default Index;
