// LG-Pay webhook: verifies signature, marks deposit completed, credits balance
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const md5Upper = async (s: string) => {
  const { Md5 } = await import("https://deno.land/std@0.160.0/hash/md5.ts");
  const m = new Md5();
  m.update(s);
  return (m.toString() as string).toUpperCase();
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const ct = req.headers.get("content-type") || "";
    let data: Record<string, string> = {};
    if (ct.includes("application/json")) {
      data = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((v, k) => { data[k] = v; });
    }

    const order_sn = data.order_sn;
    const resSign = data.sign;
    if (!order_sn || !resSign) {
      return new Response(JSON.stringify({ message: "fail(missing fields)", status: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Find deposit
    const { data: dep } = await supa.from("deposits").select("*").eq("order_number", order_sn).maybeSingle();
    if (!dep) {
      return new Response(JSON.stringify({ message: "fail(order not found)", status: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (dep.status === "completed") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Find the LG-Pay method to get secret_key
    const { data: m } = await supa.from("payment_methods").select("gateway_config").eq("method_key", dep.method_key).eq("gateway_provider", "lgpay").maybeSingle();
    const secret_key = (m?.gateway_config as any)?.secret_key;
    if (!secret_key) {
      return new Response(JSON.stringify({ message: "fail(no secret)", status: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify signature
    const paramArr: Record<string, string> = {
      order_sn: data.order_sn,
      money: data.money,
      status: data.status,
      pay_time: data.pay_time,
      msg: data.msg,
      remark: data.remark,
    };
    const filtered = Object.fromEntries(Object.entries(paramArr).filter(([_, v]) => v !== undefined && v !== null && v !== ""));
    const keys = Object.keys(filtered).sort();
    let signStr = "";
    for (const k of keys) signStr += `${k}=${filtered[k]}&`;
    signStr += `key=${secret_key}`;
    const calc = await md5Upper(signStr);

    if (calc !== resSign) {
      return new Response(JSON.stringify({ message: "fail(verify fail)", status: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Only credit on success status (LG-Pay uses status=1 typically)
    if (String(data.status) !== "1" && String(data.status).toLowerCase() !== "success") {
      await supa.from("deposits").update({ status: "rejected", rejection_reason: data.msg || "Payment failed" }).eq("id", dep.id);
      return new Response("ok", { headers: corsHeaders });
    }

    // Mark completed and credit balance
    await supa.from("deposits").update({ status: "completed", transaction_id: data.order_sn }).eq("id", dep.id);
    const { data: prof } = await supa.from("profiles").select("balance_usdt").eq("user_id", dep.user_id).maybeSingle();
    const newBal = Number(prof?.balance_usdt || 0) + Number(dep.amount_usdt || 0);
    await supa.from("profiles").update({ balance_usdt: newBal }).eq("user_id", dep.user_id);

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ message: "fail(" + String((e as Error).message) + ")", status: false }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
