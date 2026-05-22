import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gem, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { calculateLotteryPrizes, currencySymbol, formatCountdown, LotteryPlan } from "@/lib/lottery";

type Props = { channelId: string; channelName: string; onBack: () => void };

const LotteryChannel = ({ channelId, channelName, onBack }: Props) => {
  const [tab, setTab] = useState<"lottery" | "dashboard">("lottery");
  const [plans, setPlans] = useState<LotteryPlan[]>([]);
  const [soldByPlan, setSoldByPlan] = useState<Record<string, number>>({});
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [confirm, setConfirm] = useState<LotteryPlan | null>(null);
  const [tick, setTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    // Ask backend to process expired draws + auto-recreate before reading
    try { await supabase.functions.invoke("lottery-draw", { body: {} }); } catch (_) {}

    const nowIso = new Date().toISOString();
    const { data: ps } = await supabase
      .from("lottery_plans")
      .select("*")
      .eq("channel_id", channelId)
      .eq("enabled", true)
      .order("created_at", { ascending: false });

    // Hide plans whose draw_at + hide_after_seconds is past
    const visible = ((ps as any[]) || []).filter((p) => {
      const sec = Number((p as any).hide_after_seconds);
      const fallbackSec = (Number((p as any).hide_after_minutes) || 0) * 60;
      const hideMs = ((Number.isFinite(sec) && sec > 0 ? sec : fallbackSec) || 10) * 1000;
      return new Date(p.draw_at).getTime() + hideMs > Date.now();
    });
    setPlans(visible as any);

    if (visible.length) {
      const ids = visible.map((p: any) => p.id);
      const { data: tix } = await supabase
        .from("lottery_tickets")
        .select("plan_id,user_id")
        .in("plan_id", ids)
        .not("user_id", "is", null);
      const m: Record<string, number> = {};
      (tix as any[] | null)?.forEach((t) => { m[t.plan_id] = (m[t.plan_id] || 0) + 1; });
      setSoldByPlan(m);
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: ent } = await supabase
        .from("lottery_entries")
        .select("*, lottery_plans(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setMyEntries((ent as any) || []);
    }
  };
  useEffect(() => { load(); const r = setInterval(load, 5_000); return () => clearInterval(r); }, [channelId]);

  return (
    <div className="min-h-[60vh] -mx-4">
      <div className="bg-gradient-to-b from-indigo-700 to-indigo-900 px-4 pt-4 pb-8 rounded-b-3xl text-white">
        <button onClick={onBack} className="flex items-center gap-1 text-sm opacity-80 mb-3"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="flex gap-6 items-end">
          <button onClick={() => setTab("lottery")} className={`font-bold text-2xl tracking-tight ${tab==="lottery" ? "" : "opacity-50"}`}>Lottery</button>
          <button onClick={() => setTab("dashboard")} className={`font-bold text-2xl tracking-tight ${tab==="dashboard" ? "" : "opacity-50"}`}>
            dashboard
            {tab==="dashboard" && <span className="block h-1 mt-1 bg-emerald-400 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="bg-indigo-900 min-h-[60vh] px-3 pt-4 pb-32 text-white">
        {tab === "lottery" ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-4 rounded-full border-2 border-white" />
              <span className="bg-black text-white text-sm font-bold rounded-md px-2 py-1">Digital E lottery</span>
            </div>
            <div className="space-y-4">
              {plans.length === 0 && <p className="text-sm text-white/60 text-center py-10">No lottery plans yet.</p>}
              {plans.map((p) => (
                <LotteryCard key={p.id} plan={p} sold={soldByPlan[p.id] || 0} onBuy={() => setConfirm(p)} />
              ))}
            </div>
          </>
        ) : (
          <DashboardList entries={myEntries} onOpen={(planId) => navigate(`/lottery/${planId}/details`)} />
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          plan={confirm}
          sold={soldByPlan[confirm.id] || 0}
          myCount={myEntries.filter((e) => e.plan_id === confirm.id).reduce((a, e) => a + e.tickets_count, 0)}
          onClose={() => { setConfirm(null); load(); }}
        />
      )}
    </div>
  );
};

const CurrencyBadge = ({ currency, className = "" }: { currency: string; className?: string }) => {
  const sym = currencySymbol(currency);
  if (currency?.toUpperCase() === "XCOIN") return <Gem className={`text-cyan-300 ${className}`} />;
  return <span className={`font-extrabold ${className}`}>{sym}</span>;
};

const LotteryCard = ({ plan, sold, onBuy }: { plan: LotteryPlan; sold: number; onBuy: () => void }) => {
  const effectiveCount = sold > 0 ? sold : plan.total_tickets;
  const pool = effectiveCount * Number(plan.ticket_price);
  const first = calculateLotteryPrizes(plan, sold)[0]?.amount || 0;
  const sym = currencySymbol(plan.currency);
  const isXcoin = plan.currency?.toUpperCase() === "XCOIN";
  const Money = ({ value, className = "" }: { value: number; className?: string }) => (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {isXcoin ? <Gem className="h-3.5 w-3.5 text-cyan-300" /> : <span className="text-cyan-300 font-extrabold">{sym}</span>}
      {value.toLocaleString()}
    </span>
  );
  return (
    <div className="relative rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 border border-amber-500/40 overflow-hidden shadow-md">
      {/* Top end-in pill */}
      <div className="absolute top-0 right-0 bg-gradient-to-l from-fuchsia-600/80 to-fuchsia-700/30 px-2.5 py-0.5 rounded-bl-xl rounded-tr-xl text-[10px] text-white/90">
        Ends in <span className="font-extrabold text-amber-300 tracking-wider">{formatCountdown(plan.draw_at)}</span>
      </div>
      <div className="flex gap-2.5 p-2.5 pt-5 items-center">
        {plan.game_image_url ? (
          <img src={plan.game_image_url} className="h-16 w-16 rounded-lg object-cover shrink-0 ring-1 ring-amber-400/40" />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-indigo-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="italic text-white/80 text-[11px] leading-tight">Prize Pool</p>
          <p className="font-extrabold text-lg text-amber-300 italic leading-tight"><Money value={pool} /></p>
          <p className="italic text-white/60 text-[10px] mt-0.5 leading-tight">1st Prize</p>
          <p className="text-white font-bold text-sm leading-tight"><Money value={first} /></p>
          {plan.xcoin_bonus ? <p className="text-[10px] text-emerald-300 leading-tight">+ {plan.xcoin_bonus} X coin</p> : null}
          <p className="text-[9px] text-white/50 mt-0.5">{sold}/{plan.total_tickets} sold</p>
        </div>
        {(() => {
          const closed = new Date(plan.draw_at).getTime() <= Date.now();
          return (
            <button
              onClick={closed ? undefined : onBuy}
              disabled={closed}
              className={`self-center font-extrabold text-xs px-3 py-2 rounded-lg shadow-md border-2 flex items-center gap-1 shrink-0 ${closed ? "bg-slate-500 border-slate-400 text-white/80 cursor-not-allowed" : "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white border-emerald-300"}`}
            >
              {closed ? "Closed" : (<><CurrencyBadge currency={plan.currency} className="h-3.5 w-3.5" />{plan.ticket_price}</>)}
            </button>
          );
        })()}
      </div>
    </div>
  );
};

const DashboardList = ({ entries, onOpen }: { entries: any[]; onOpen: (planId: string) => void }) => {
  if (!entries.length) return <p className="text-sm text-white/60 text-center py-10">You haven't joined any lottery yet.</p>;
  const grouped = entries.reduce((acc: Record<string, any>, e) => {
    if (!acc[e.plan_id]) acc[e.plan_id] = { plan: e.lottery_plans, count: 0 };
    acc[e.plan_id].count += e.tickets_count;
    return acc;
  }, {});
  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([id, v]: any) => (
        <button key={id} onClick={() => onOpen(id)} className="w-full text-left bg-indigo-800/80 rounded-xl p-3 flex gap-3 items-center border border-indigo-600/50">
          {v.plan?.game_image_url && <img src={v.plan.game_image_url} className="h-14 w-14 rounded-lg object-cover" />}
          <div className="flex-1">
            <p className="font-bold">{v.plan?.name}</p>
            <p className="text-xs text-white/70">You have {v.count} tickets</p>
          </div>
          <p className="text-xs text-amber-300">{v.plan?.status}</p>
        </button>
      ))}
    </div>
  );
};

const ConfirmDialog = ({ plan, sold, myCount, onClose }: { plan: LotteryPlan; sold: number; myCount: number; onClose: () => void }) => {
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const total = useMemo(() => count * Number(plan.ticket_price), [count, plan]);
  const available = Math.max(1, plan.total_tickets - sold);
  const sym = currencySymbol(plan.currency);
  const isXcoin = plan.currency?.toUpperCase() === "XCOIN";

  const submit = async () => {
    setBusy(true);
    try {
      if (new Date(plan.draw_at).getTime() <= Date.now()) { toast.error("Booking time has ended for this lottery"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Login required"); navigate("/login"); return; }
      if (plan.total_tickets > 0 && count > plan.total_tickets - sold) { toast.error("Not enough tickets left"); return; }

      if (plan.currency === "XCOIN") {
        const { data: xc } = await supabase.from("user_xcoin").select("balance").eq("user_id", user.id).maybeSingle();
        const bal = Number(xc?.balance || 0);
        if (bal < total) { toast.error("Not enough X coin"); return; }
        if (xc) await supabase.from("user_xcoin").update({ balance: bal - total }).eq("user_id", user.id);
        else await supabase.from("user_xcoin").insert({ user_id: user.id, balance: -total } as any);
      } else {
        const { data: pr } = await supabase.from("profiles").select("balance_usdt").eq("user_id", user.id).maybeSingle();
        const bal = Number(pr?.balance_usdt || 0);
        if (bal < total) { toast.error("Insufficient balance"); return; }
        await supabase.from("profiles").update({ balance_usdt: bal - total }).eq("user_id", user.id);
      }

      const { error } = await supabase.from("lottery_entries").insert({
        plan_id: plan.id,
        user_id: user.id,
        tickets_count: count,
        amount_paid: total,
        currency: plan.currency,
      });
      if (error) throw error;

      // Credit X coin bonus per ticket purchased
      const bonus = Number(plan.xcoin_bonus || 0) * count;
      if (bonus > 0) {
        const { data: xc2 } = await supabase.from("user_xcoin").select("balance").eq("user_id", user.id).maybeSingle();
        const bal2 = Number(xc2?.balance || 0);
        if (xc2) await supabase.from("user_xcoin").update({ balance: bal2 + bonus }).eq("user_id", user.id);
        else await supabase.from("user_xcoin").insert({ user_id: user.id, balance: bonus } as any);
        await supabase.from("xcoin_transactions").insert({ user_id: user.id, amount: bonus, type: "lottery_bonus", meta: { plan_id: plan.id, tickets: count } } as any);
        toast.success(`+${bonus} X coin bonus credited!`);
      }

      toast.success("Ticket purchased!");
      onClose();
      navigate(`/lottery/${plan.id}/tickets`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const filled = plan.total_tickets > 0 ? Math.round(((sold + count) / plan.total_tickets) * 100) : 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-b from-purple-700 to-purple-900 text-white py-4">
          <DialogTitle className="text-center font-extrabold tracking-wider">CONFIRMATION!</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3 bg-white text-slate-900">
          <div className="flex justify-between text-sm"><span>Total Entries</span><span className="flex items-center gap-1">{isXcoin ? <Gem className="h-4 w-4 text-cyan-500"/> : <span className="font-bold">{sym}</span>}{myCount + count}</span></div>
          <div className="flex justify-between text-sm"><span>Total</span><span className="flex items-center gap-1">{isXcoin ? <Gem className="h-4 w-4 text-cyan-500"/> : <span className="font-bold">{sym}</span>}{total}</span></div>
          <div className="bg-indigo-600 text-white text-center italic font-bold py-2 rounded">{sold + count}/{plan.total_tickets}</div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${filled}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-lg">total ticket</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCount(Math.max(1, count - 1))} className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
              <span className="font-extrabold text-2xl w-8 text-center">{count}</span>
              <button onClick={() => setCount(Math.min(available, count + 1))} className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <p className="text-xs text-slate-500 text-center">Price per ticket: {plan.ticket_price} {sym}</p>
        </div>
        <div className="p-3 bg-slate-50">
          <Button disabled={busy} onClick={submit} className="w-full h-12 bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-extrabold text-lg shadow-lg">
            Conform
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LotteryChannel;
