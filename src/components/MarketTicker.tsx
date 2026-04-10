import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import TradeModal from "./TradeModal";

const coins = [
  { name: "Bitcoin", symbol: "BTC", price: "67,432.50", change: "+2.4%", up: true, icon: "₿" },
  { name: "Ethereum", symbol: "ETH", price: "3,521.80", change: "+1.8%", up: true, icon: "Ξ" },
  { name: "BNB", symbol: "BNB", price: "612.30", change: "-0.5%", up: false, icon: "B" },
  { name: "Solana", symbol: "SOL", price: "178.90", change: "+5.2%", up: true, icon: "S" },
  { name: "XRP", symbol: "XRP", price: "0.6234", change: "-1.1%", up: false, icon: "X" },
  { name: "Cardano", symbol: "ADA", price: "0.4821", change: "+3.7%", up: true, icon: "A" },
];

const MarketTicker = () => {
  const [selectedCoin, setSelectedCoin] = useState<(typeof coins)[0] | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);

  return (
    <section id="market" className="py-16 px-4">
      <div className="container max-w-4xl mx-auto">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-1">
          Live <span className="text-gradient-gold">Market</span>
        </h2>
        <p className="text-muted-foreground text-sm mb-6">Real-time cryptocurrency prices</p>

        <div className="space-y-2">
          {coins.map((coin) => (
            <div
              key={coin.symbol}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-gold-subtle border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {coin.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{coin.name}</p>
                  <p className="text-[11px] text-muted-foreground">{coin.symbol}/USDT</p>
                </div>
              </div>

              <div className="text-right shrink-0 mx-2">
                <p className="font-semibold text-foreground text-sm">${coin.price}</p>
                <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${coin.up ? "text-success" : "text-destructive"}`}>
                  {coin.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {coin.change}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedCoin(coin);
                  setTradeOpen(true);
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all"
              >
                Trade
              </button>
            </div>
          ))}
        </div>
      </div>

      <TradeModal
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        coin={selectedCoin}
      />
    </section>
  );
};

export default MarketTicker;
