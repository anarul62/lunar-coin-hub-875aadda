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
    case "PKR": return "Rs";
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

export function calculateLotteryPrizes(plan: any, soldTickets: number) {
  const effectiveTickets = soldTickets > 0 ? soldTickets : Number(plan.total_tickets || 0);
  const pool = effectiveTickets * Number(plan.ticket_price || 0);
  const ranks = [
    { rank: "#1", pct: Number(plan.pct_first || 0) },
    { rank: "#2", pct: Number(plan.pct_second || 0) },
    { rank: "#3", pct: Number(plan.pct_third || 0) },
    ...(plan.pct_4_11_enabled ? Array.from({ length: 8 }, (_, i) => ({ rank: `#${i + 4}`, pct: Number(plan.pct_4_11 || 0) })) : []),
  ];
  const visibleRanks = ranks.slice(0, Math.max(1, effectiveTickets));
  const companyPct = Math.max(0, Math.min(100, Number(plan.pct_company || 0)));
  const configuredPrizePct = ranks.reduce((sum, r) => sum + Math.max(0, r.pct), 0);
  const targetPrizePct = Math.min(Math.max(0, 100 - companyPct), configuredPrizePct || Math.max(0, 100 - companyPct));
  const assignedPct = visibleRanks.reduce((sum, r) => sum + Math.max(0, r.pct), 0);
  const distributable = Math.floor(pool * targetPrizePct * 100) / 10000;
  let paid = 0;

  return visibleRanks.map((r, i) => {
    const isLast = i === visibleRanks.length - 1;
    const weight = assignedPct > 0 ? Math.max(0, r.pct) / assignedPct : 1 / visibleRanks.length;
    const amount = isLast ? Math.max(0, Math.floor((distributable - paid) * 100) / 100) : Math.floor(distributable * weight * 100) / 100;
    paid += amount;
    return { ...r, amount };
  });
}
