import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  let planFilter: string | null = null;
  try {
    const body = await req.json();
    if (body?.plan_id) planFilter = body.plan_id;
  } catch (_) {}

  // Find plans needing draw
  let q = sb.from("lottery_plans").select("*").eq("status", "open").lte("draw_at", new Date().toISOString());
  if (planFilter) q = sb.from("lottery_plans").select("*").eq("id", planFilter).eq("status", "open");
  const { data: plans, error } = await q;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const results: any[] = [];
  for (const plan of plans || []) {
    // Mark drawing
    await sb.from("lottery_plans").update({ status: "drawing" }).eq("id", plan.id);

    const { data: sold } = await sb.from("lottery_tickets").select("id,user_id,ticket_number").eq("plan_id", plan.id).not("user_id", "is", null);
    const tickets = sold || [];

    if (tickets.length === 0) {
      await sb.from("lottery_plans").update({ status: "completed" }).eq("id", plan.id);
      results.push({ plan: plan.id, winners: 0 });
      continue;
    }

    // Shuffle
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);
    const pool = tickets.length * Number(plan.ticket_price);

    const pickRanks: { rank: number; pct: number }[] = [
      { rank: 1, pct: Number(plan.pct_first) },
      { rank: 2, pct: Number(plan.pct_second) },
      { rank: 3, pct: Number(plan.pct_third) },
    ];
    if (plan.pct_4_11_enabled) {
      for (let r = 4; r <= 11; r++) pickRanks.push({ rank: r, pct: Number(plan.pct_4_11) });
    }

    const availableWinnerSlots = pickRanks.slice(0, shuffled.length);
    const companyPct = Math.max(0, Math.min(100, Number(plan.pct_company || 0)));
    const totalConfiguredPrizePct = pickRanks.reduce((sum, r) => sum + Math.max(0, Number(r.pct || 0)), 0);
    const targetPrizePct = Math.min(Math.max(0, 100 - companyPct), totalConfiguredPrizePct || Math.max(0, 100 - companyPct));
    const assignedWinnerPct = availableWinnerSlots.reduce((sum, r) => sum + Math.max(0, Number(r.pct || 0)), 0);
    const distributablePool = Math.floor((pool * targetPrizePct) * 100) / 10000;

    const winners: any[] = [];
    let paidSoFar = 0;
    for (let i = 0; i < availableWinnerSlots.length; i++) {
      const t = shuffled[i];
      const rankInfo = availableWinnerSlots[i];
      const isLastWinner = i === availableWinnerSlots.length - 1;
      const weight = assignedWinnerPct > 0 ? Math.max(0, Number(rankInfo.pct || 0)) / assignedWinnerPct : 1 / availableWinnerSlots.length;
      const prize = isLastWinner
        ? Math.max(0, Math.floor((distributablePool - paidSoFar) * 100) / 100)
        : Math.floor(distributablePool * weight * 100) / 100;
      paidSoFar += prize;
      winners.push({
        plan_id: plan.id,
        ticket_id: t.id,
        user_id: t.user_id,
        rank: rankInfo.rank,
        prize_amount: prize,
        currency: plan.currency,
        paid: false,
      });
    }

    // Insert results
    if (winners.length) await sb.from("lottery_results").insert(winners);

    // Credit winners
    for (const w of winners) {
      if (plan.currency === "XCOIN") {
        const { data: xc } = await sb.from("user_xcoin").select("balance").eq("user_id", w.user_id).maybeSingle();
        const bal = Number(xc?.balance || 0);
        if (xc) await sb.from("user_xcoin").update({ balance: bal + Number(w.prize_amount) }).eq("user_id", w.user_id);
        else await sb.from("user_xcoin").insert({ user_id: w.user_id, balance: w.prize_amount });
      } else {
        const { data: pr } = await sb.from("profiles").select("balance_usdt").eq("user_id", w.user_id).maybeSingle();
        const bal = Number(pr?.balance_usdt || 0);
        await sb.from("profiles").update({ balance_usdt: bal + Number(w.prize_amount) }).eq("user_id", w.user_id);
      }
      await sb.from("notifications").insert({
        audience: "user",
        user_id: w.user_id,
        type: "lottery",
        title: `🎉 Lottery winner — Rank ${w.rank}`,
        body: `You won ${w.prize_amount} ${w.currency} in ${plan.name}`,
        amount: w.prize_amount,
        currency: w.currency,
        link: `/lottery/${plan.id}/details?tab=leaderboard`,
      });
    }

    // Mark paid
    if (winners.length) await sb.from("lottery_results").update({ paid: true }).eq("plan_id", plan.id);

    await sb.from("lottery_plans").update({ status: "completed" }).eq("id", plan.id);
    results.push({ plan: plan.id, winners: winners.length, pool });

    // Auto-recreate: schedule a fresh round with the same settings
    if (plan.auto_recreate) {
      const days = Number(plan.recreate_days || 0);
      const hours = Number(plan.recreate_hours || 0);
      const mins = Number(plan.recreate_minutes || 0);
      const intervalMs = ((days * 24 + hours) * 60 + mins) * 60_000;
      const nextDraw = new Date(Date.now() + Math.max(60_000, intervalMs)).toISOString();
      const { id, created_at, updated_at, status, ...base } = plan as any;
      await sb.from("lottery_plans").insert({ ...base, status: "open", draw_at: nextDraw });
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
