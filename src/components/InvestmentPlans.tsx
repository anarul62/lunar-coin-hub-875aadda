import { motion } from "framer-motion";
import { Check, Star, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    roi: "5-8%",
    duration: "30 Days",
    min: "$100",
    max: "$5,000",
    features: ["Daily ROI", "24/7 Support", "Instant Withdrawal"],
    popular: false,
  },
  {
    name: "Professional",
    icon: Star,
    roi: "10-15%",
    duration: "60 Days",
    min: "$1,000",
    max: "$50,000",
    features: ["Daily ROI", "Priority Support", "Instant Withdrawal", "Bonus Rewards"],
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Crown,
    roi: "18-25%",
    duration: "90 Days",
    min: "$10,000",
    max: "$500,000",
    features: ["Daily ROI", "VIP Support", "Instant Withdrawal", "Bonus Rewards", "NFT Airdrops"],
    popular: false,
  },
];

const InvestmentPlans = () => (
  <section id="investment" className="py-20">
    <div className="container">
      <div className="text-center mb-12">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
          Investment <span className="text-gradient-gold">Plans</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">Choose a plan that fits your investment goals</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className={`relative rounded-2xl border p-8 flex flex-col ${
              plan.popular
                ? "border-primary glow-gold bg-gradient-gold-subtle"
                : "border-border bg-card"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
              </span>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <plan.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
            </div>

            <p className="text-4xl font-heading font-bold text-gradient-gold mb-1">{plan.roi}</p>
            <p className="text-sm text-muted-foreground mb-6">Monthly Returns • {plan.duration}</p>

            <div className="flex justify-between text-sm mb-6 text-muted-foreground">
              <span>Min: {plan.min}</span>
              <span>Max: {plan.max}</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className={`w-full font-semibold ${
                plan.popular
                  ? "bg-gradient-gold text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              Invest Now
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default InvestmentPlans;
