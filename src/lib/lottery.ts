import { Gem, DollarSign, IndianRupee } from "lucide-react";

export type LotteryPlan = {
  id: string;
  channel_id: string | null;
  name: string;
  image_url: string | null;
  game_image_url: string | null;
  total_tickets: number;
  ticket_price: number;
  currency: string;
  xcoin_bonus: number | null;
  prize_mode: "auto" | "manual";
  pct_first: number;
  pct_second: number;
  pct_third: number;
  pct_4_11: number;
  pct_company: number;
  pct_4_11_enabled: boolean;
  draw_at: string;
  duration_minutes: number;
  status: "open" | "drawing" | "completed";
  enabled: boolean;
};

export const currencySymbol = (c: string) => {
  switch ((c || "").toUpperCase()) {
    case "BDT": return "৳";
    case "INR": return "₹";
    case "USDT": return "$";
    case "XCOIN": return "💎";
    default: return c;
  }
};

export const currencyIcon = (c: string) => {
  switch ((c || "").toUpperCase()) {
    case "INR": return IndianRupee;
    case "USDT": return DollarSign;
    default: return Gem;
  }
};

export function formatCountdown(target: string | Date) {
  const t = new Date(target).getTime();
  const diff = Math.max(0, t - Date.now());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
