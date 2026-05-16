import Navbar from "@/components/Navbar";
import InvestHome from "@/components/InvestHome";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-14">
      <InvestHome />
    </main>
    <Footer />
  </div>
);

export default Index;
