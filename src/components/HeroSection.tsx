import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Users, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { icon: TrendingUp, label: "Trading Volume", value: "$12.8B+" },
  { icon: Users, label: "Active Users", value: "5M+" },
  { icon: Shield, label: "Assets Secured", value: "$50B+" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
    <div
      className="absolute inset-0 opacity-40"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

    <div className="container relative z-10 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-6">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-gold" />
          <span className="text-xs font-medium text-primary">Live Trading Active</span>
        </div>

        <h1 className="font-heading text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
          Trade Crypto &{" "}
          <span className="text-gradient-gold">NFTs</span>{" "}
          with Confidence
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Buy, sell, and invest in cryptocurrency with our secure platform. Support for USDT, INR, and BDT currencies.
        </p>

        <div className="flex flex-wrap gap-4 mb-16">
          <Button size="lg" className="bg-gradient-gold text-primary-foreground font-semibold text-base px-8 hover:opacity-90">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10 text-base px-8">
            Explore Markets
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;
