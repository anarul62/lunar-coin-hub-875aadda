import { supabase } from "@/integrations/supabase/client";

export type RateSetting = { mode: "auto" | "manual"; rate: number };

let cached: { rate: number; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

export const fetchLiveUsdInr = async (): Promise<number> => {
  if (cached && Date.now() - cached.ts < TTL) return cached.rate;
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    const rate = Number(j?.rates?.INR);
    if (rate > 0) { cached = { rate, ts: Date.now() }; return rate; }
  } catch {}
  return 83;
};

export const getUsdInrRate = async (): Promise<number> => {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "usd_inr_rate").maybeSingle();
  const v = (data?.value as RateSetting) || { mode: "auto", rate: 83 };
  if (v.mode === "manual" && v.rate > 0) return v.rate;
  return await fetchLiveUsdInr();
};

export const usdtToInr = (usdt: number, rate: number) => usdt * rate;
export const inrToUsdt = (inr: number, rate: number) => (rate > 0 ? inr / rate : 0);

export const formatCurrency = (amount: number, currency: "INR" | "USDT") => {
  if (currency === "INR") return `₹${amount.toFixed(2)}`;
  return `${amount.toFixed(4)} USDT`;
};
