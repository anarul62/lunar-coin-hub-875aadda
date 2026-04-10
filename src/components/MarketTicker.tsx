import { TrendingUp, TrendingDown } from "lucide-react";

const coins = [
  { name: "Bitcoin", symbol: "BTC", price: "67,432.50", change: "+2.4%", up: true, icon: "₿" },
  { name: "Ethereum", symbol: "ETH", price: "3,521.80", change: "+1.8%", up: true, icon: "Ξ" },
  { name: "BNB", symbol: "BNB", price: "612.30", change: "-0.5%", up: false, icon: "B" },
  { name: "Solana", symbol: "SOL", price: "178.90", change: "+5.2%", up: true, icon: "S" },
  { name: "XRP", symbol: "XRP", price: "0.6234", change: "-1.1%", up: false, icon: "X" },
  { name: "Cardano", symbol: "ADA", price: "0.4821", change: "+3.7%", up: true, icon: "A" },
];

const MarketTicker = () => (
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
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-gold-subtle border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {coin.icon}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.symbol}/USDT</p>
              </div>
            </div>

            <div className="text-right shrink-0 ml-3">
              <p className="font-semibold text-foreground text-sm">${coin.price}</p>
              <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${coin.up ? "text-success" : "text-destructive"}`}>
                {coin.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {coin.change}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default MarketTicker;
