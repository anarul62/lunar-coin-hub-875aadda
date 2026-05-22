// LG-Pay: Create payment order
// Creates a pending deposit, calls LG-Pay API, returns pay_url
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const md5Upper = async (s: string) => {
  const buf = await crypto.subtle.digest("MD5", new TextEncoder().encode(s)).catch(async () => {
    // Deno's WebCrypto doesn't support MD5; use polyfill
    const { Md5 } = await import("https://deno.land/std@0.160.0/hash/md5.ts");
    const m = new Md5();
    m.update(s);
    return m.digest();
  });
  const bytes = new Uint8Array(buf as ArrayBuffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { method_id, amount } = await req.json();
    if (!method_id || !amount || Number(amount) <= 0) {
      return new Response(JSON.stringify({ error: "method_id and amount required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth: extract user from JWT
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supaUser = createClient(supaUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userRes } = await supaUser.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(supaUrl, serviceKey);

    const { data: m, error: mErr } = await supa.from("payment_methods").select("*").eq("id", method_id).maybeSingle();
    if (mErr || !m) return new Response(JSON.stringify({ error: "Method not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!m.enabled || m.mode !== "gateway" || m.gateway_provider !== "lgpay") {
      return new Response(JSON.stringify({ error: "LG-Pay not configured for this method" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const gc = m.gateway_config || {};
    const app_id = gc.app_id;
    const secret_key = gc.secret_key;
    const trade_type = gc.trade_type;
    if (!app_id || !secret_key || !trade_type) {
      return new Response(JSON.stringify({ error: "Missing app_id / secret_key / trade_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amt = Number(amount);
    const rate = Number(m.rate) || 1;
    const amount_usdt = m.currency === "USDT" ? amt : (rate > 0 ? amt / rate : 0);

    // Create pending deposit
    const order_sn = "LG" + Date.now() + Math.floor(Math.random() * 900000 + 100000);
    const { data: dep, error: depErr } = await supa.from("deposits").insert({
      user_id: user.id,
      amount: amt,
      amount_usdt,
      currency: m.currency,
      method_key: m.method_key,
      method_label: m.label,
      status: "pending",
      order_number: order_sn,
      transaction_id: null,
    }).select().single();
    if (depErr) return new Response(JSON.stringify({ error: depErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build LG-Pay request
    const notify_url = `${supaUrl}/functions/v1/lgpay-webhook`;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
    const params: Record<string, string | number> = {
      app_id,
      trade_type,
      order_sn,
      money: Math.floor(amt * 100),
      notify_url,
      ip,
      remark: "web pay",
      return_url: req.headers.get("origin") || "https://lunar-coin-hub.lovable.app",
    };
    const keys = Object.keys(params).sort();
    let signStr = "";
    for (const k of keys) signStr += `${k}=${params[k]}&`;
    signStr += `key=${secret_key}`;
    const sign = await md5Upper(signStr);

    const form = new URLSearchParams();
    for (const k of keys) form.append(k, String(params[k]));
    form.append("sign", sign);

    const resp = await fetch("https://www.lg-pay.com/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const respText = await resp.text();
    let data: any = null;
    try { data = JSON.parse(respText); } catch { /* */ }

    if (data && data.status === 1 && data.data?.pay_url) {
      return new Response(JSON.stringify({ pay_url: data.data.pay_url, order_sn, deposit_id: dep.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Failure: delete the pending deposit
    await supa.from("deposits").delete().eq("id", dep.id);
    return new Response(JSON.stringify({ error: data?.message || "LG-Pay create order failed", raw: respText }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
