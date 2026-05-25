import { supabase } from "@/integrations/supabase/client";

export type RateSetting = { mode: "auto" | "manual"; rate: number };

export type UserCurrency = {
  code: "INR" | "BDT" | "PKR" | "USDT";
  symbol: string; // ₹, ৳, Rs, USDT
};

export type WalletCurrency = "INR" | "BDT" | "PKR" | "USDT" | "XCOIN";

export const DEFAULT_CURRENCY_RATES: Record<string, number> = {
  INR: 83,
  BDT: 120,
  PKR: 280,
  USDT: 1,
  USD: 1,
  XCOIN: 1000,
};

let cached: { rate: number; ts: number } | null = null;
let ratesCache: { rates: Record<string, number>; ts: number } | null = null;
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

export const fetchLiveRates = async (): Promise<Record<string, number>> => {
  if (ratesCache && Date.now() - ratesCache.ts < TTL) return ratesCache.rates;
  const fallback = DEFAULT_CURRENCY_RATES;
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "currency_rates").maybeSingle();
    const v: any = data?.value || {};
    if (data?.value) {
      const rates: Record<string, number> = {
        INR: Number(v.usdt_inr) || fallback.INR,
        BDT: Number(v.usdt_bdt) || fallback.BDT,
        PKR: Number(v.usdt_pkr) || fallback.PKR,
        XCOIN: Number(v.usdt_xcoin) || fallback.XCOIN,
        USDT: 1,
        USD: 1,
      };
      ratesCache = { rates, ts: Date.now() };
      return rates;
    }
  } catch {}
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/USD");
    const j = await r.json();
    const rates: Record<string, number> = {
      INR: Number(j?.rates?.INR) || fallback.INR,
      BDT: Number(j?.rates?.BDT) || fallback.BDT,
      PKR: Number(j?.rates?.PKR) || fallback.PKR,
      XCOIN: fallback.XCOIN,
      USDT: 1,
      USD: 1,
    };
    ratesCache = { rates, ts: Date.now() };
    return rates;
  } catch {
    return fallback;
  }
};

export const getUsdInrRate = async (): Promise<number> => {
  const rates = await fetchLiveRates();
  if (rates.INR > 0) return rates.INR;
  const { data } = await supabase.from("app_settings").select("value").eq("key", "usd_inr_rate").maybeSingle();
  const v = (data?.value as RateSetting) || { mode: "auto", rate: 83 };
  if (v.mode === "manual" && v.rate > 0) return v.rate;
  return await fetchLiveUsdInr();
};

export const usdtToInr = (usdt: number, rate: number) => usdt * rate;
export const inrToUsdt = (inr: number, rate: number) => (rate > 0 ? inr / rate : 0);

export const formatCurrency = (amount: number, currency: "INR" | "USDT" | "BDT" | "PKR") => {
  if (currency === "INR") return `₹${amount.toFixed(2)}`;
  if (currency === "BDT") return `৳${amount.toFixed(2)}`;
  if (currency === "PKR") return `Rs ${amount.toFixed(2)}`;
  return `${amount.toFixed(4)} USDT`;
};

export const getCurrencySymbol = (currency?: string | null) => {
  const c = (currency || "USDT").toUpperCase();
  if (c === "INR") return "₹";
  if (c === "BDT") return "৳";
  if (c === "PKR") return "Rs ";
  if (c === "XCOIN") return "💎";
  return "₮";
};

/** Detect display currency by phone country code. */
export const getUserCurrencyFromPhone = (phone?: string | null): UserCurrency => {
  const p = (phone || "").trim();
  if (p.startsWith("+880")) return { code: "BDT", symbol: "৳" };
  if (p.startsWith("+91")) return { code: "INR", symbol: "₹" };
  if (p.startsWith("+92")) return { code: "PKR", symbol: "Rs " };
  if (p.startsWith("+1")) return { code: "USDT", symbol: "" };
  return { code: "USDT", symbol: "" };
};

/** Convert a USDT amount to the user's local currency value using live rates. */
export const usdtToUserCurrency = (
  usdt: number,
  cur: UserCurrency,
  rates: Record<string, number>
): number => {
  if (cur.code === "USDT") return usdt;
  const r = rates[cur.code] || 1;
  return usdt * r;
};

/** Format USDT balance as user's local currency string. */
export const formatUserBalance = (
  usdt: number,
  cur: UserCurrency,
  rates: Record<string, number>
): string => {
  if (cur.code === "USDT") return `${usdt.toFixed(4)} USDT`;
  const v = usdtToUserCurrency(usdt, cur, rates);
  return formatCurrency(v, cur.code);
};
