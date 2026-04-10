import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp } from "lucide-react";

interface Coin {
  name: string;
  symbol: string;
  price: string;
  change: string;
  up: boolean;
  icon: string;
}

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coin: Coin | null;
}

const TradeModal = ({ open, onOpenChange, coin }: TradeModalProps) => {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  if (!coin) return null;

  const numericPrice = parseFloat(coin.price.replace(/,/g, ""));
  const total = amount ? (parseFloat(amount) * (orderType === "limit" && price ? parseFloat(price) : numericPrice)).toFixed(2) : "0.00";

  const percentages = [25, 50, 75, 100];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] bg-card border-border p-0 gap-0 rounded-2xl">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {coin.icon}
            </span>
            {coin.symbol}/USDT
          </DialogTitle>
        </DialogHeader>

        {/* Buy / Sell Tabs */}
        <div className="flex mx-4 rounded-lg bg-secondary p-0.5 mb-3">
          <button
            onClick={() => setTab("buy")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              tab === "buy"
                ? "bg-success text-success-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setTab("sell")}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              tab === "sell"
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Order Type */}
        <div className="flex gap-3 px-4 mb-3">
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`text-xs font-medium pb-1 border-b-2 transition-all capitalize ${
                orderType === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-2.5 pb-4">
          {/* Price */}
          {orderType === "limit" ? (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price (USDT)</label>
              <Input
                type="number"
                placeholder={numericPrice.toString()}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-secondary border-border h-9 text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
              <span className="text-xs text-muted-foreground">Price</span>
              <span className="text-sm font-medium text-foreground">Market Price</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount ({coin.symbol})</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border h-9 text-sm"
            />
          </div>

          {/* Percentage buttons */}
          <div className="flex gap-1.5">
            {percentages.map((p) => (
              <button
                key={p}
                onClick={() => setAmount((p / 100).toString())}
                className="flex-1 py-1 text-xs rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-sm font-semibold text-foreground">${total} USDT</span>
          </div>

          {/* Available balance mock */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Available</span>
            <span>0.00 USDT</span>
          </div>

          {/* Action Button */}
          <Button
            className={`w-full font-semibold text-sm h-10 ${
              tab === "buy"
                ? "bg-success hover:bg-success/90 text-success-foreground"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            }`}
          >
            {tab === "buy" ? `Buy ${coin.symbol}` : `Sell ${coin.symbol}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeModal;
