import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const currencies = ["USDT", "INR", "BDT"];

const WalletSection = () => {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");

  return (
    <section id="wallet" className="py-20">
      <div className="container max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
            <span className="text-gradient-gold">Wallet</span>
          </h2>
          <p className="text-muted-foreground">Deposit & withdraw with multiple currencies</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          {/* Balance */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-4xl font-heading font-bold text-gradient-gold">$12,450.00</p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-secondary p-1 mb-6">
            <button
              onClick={() => setTab("deposit")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "deposit" ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "withdraw" ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </button>
          </div>

          {/* Currency */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Currency</label>
            <div className="flex gap-2">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    currency === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                {currency}
              </span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-6">
            {["100", "500", "1000", "5000"].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
              >
                ${a}
              </button>
            ))}
          </div>

          <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold text-base py-6 hover:opacity-90">
            {tab === "deposit" ? (
              <><ArrowDownToLine className="h-5 w-5 mr-2" /> Deposit {currency}</>
            ) : (
              <><ArrowUpFromLine className="h-5 w-5 mr-2" /> Withdraw {currency}</>
            )}
          </Button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Transactions processed within 5 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WalletSection;
