import { TrendingUp, TrendingDown } from "lucide-react";

const coins = [
  { name: "Bitcoin", symbol: "BTC", price: "67,432.50", change: "+2.4%", up: true },
  { name: "Ethereum", symbol: "ETH", price: "3,521.80", change: "+1.8%", up: true },
  { name: "BNB", symbol: "BNB", price: "612.30", change: "-0.5%", up: false },
  { name: "Solana", symbol: "SOL", price: "178.90", change: "+5.2%", up: true },
  { name: "XRP", symbol: "XRP", price: "0.6234", change: "-1.1%", up: false },
  { name: "Cardano", symbol: "ADA", price: "0.4821", change: "+3.7%", up: true },
];

const MarketTicker = () => (
  <section id="market" className="py-20">
    <div className="container">
      <h2 className="font-heading text-3xl font-bold mb-2">
        Live <span className="text-gradient-gold">Market</span>
      </h2>
      <p className="text-muted-foreground mb-8">Real-time cryptocurrency prices</p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Coin</span>
          <span className="text-right">Price (USDT)</span>
          <span className="text-right">24h Change</span>
          <span className="text-right">Action</span>
        </div>
        {coins.map((coin) => (
          <div key={coin.symbol} className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {coin.symbol.slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{coin.name}</p>
                <p className="text-xs text-muted-foreground">{coin.symbol}</p>
              </div>
            </div>
            <p className="text-right self-center font-medium text-foreground">${coin.price}</p>
            <div className={`text-right self-center flex items-center justify-end gap-1 text-sm font-medium ${coin.up ? "text-success" : "text-destructive"}`}>
              {coin.up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {coin.change}
            </div>
            <div className="text-right self-center">
              <button className="text-xs font-semibold text-primary hover:underline">Trade</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default MarketTicker;
