import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gem, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { currencySymbol, formatCountdown, LotteryPlan } from "@/lib/lottery";

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
    const { data: ps } = await supabase
      .from("lottery_plans")
      .select("*")
      .eq("channel_id", channelId)
      .eq("enabled", true)
      .order("created_at", { ascending: false });
    setPlans((ps as any) || []);
    if (ps?.length) {
      const ids = (ps as any[]).map((p) => p.id);
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
  useEffect(() => { load(); }, [channelId]);

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
  // Show potential max pool when nothing sold yet so users see attractive numbers
  const effectiveCount = sold > 0 ? sold : plan.total_tickets;
  const pool = effectiveCount * Number(plan.ticket_price);
  const first = Math.floor(pool * (Number(plan.pct_first) / 100));
  const sym = currencySymbol(plan.currency);
  const isXcoin = plan.currency?.toUpperCase() === "XCOIN";
  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-indigo-800 to-indigo-700 border border-indigo-500/40 overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 bg-fuchsia-600/40 px-3 py-1 rounded-bl-xl text-xs">
        Ends in <span className="font-bold text-amber-300">{formatCountdown(plan.draw_at)}</span>
      </div>
      <div className="flex gap-3 p-3 pt-8">
        {plan.game_image_url ? (
          <img src={plan.game_image_url} className="h-24 w-24 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-24 w-24 rounded-xl bg-indigo-600 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="italic text-white/90 text-sm">Prize Pool</p>
          <p className="font-extrabold text-2xl text-amber-300 italic flex items-center gap-1">
            {isXcoin
              ? <><Gem className="h-5 w-5 text-cyan-300" />{pool.toLocaleString()}</>
              : <>{pool.toLocaleString()} <span className="text-cyan-300">{sym}</span></>}
          </p>
          <p className="italic text-white/70 text-xs mt-1">1st Prize</p>
          <p className="text-white font-bold flex items-center gap-1">
            {isXcoin
              ? <><Gem className="h-4 w-4 text-cyan-300" />{first.toLocaleString()}</>
              : <>{first.toLocaleString()} <span className="text-cyan-300">{sym}</span></>}
          </p>
          {plan.xcoin_bonus ? <p className="text-xs text-emerald-300 mt-1">+ {plan.xcoin_bonus} X coin</p> : null}
          <p className="text-[10px] text-white/50 mt-1">{sold}/{plan.total_tickets} sold</p>
        </div>
      </div>
      <div className="flex justify-end p-3 pt-0">
        <button
          onClick={onBuy}
          className="bg-gradient-to-b from-emerald-400 to-emerald-600 text-white font-bold text-sm px-5 py-2 rounded-lg shadow-lg border border-emerald-300 flex items-center gap-1"
        >
          <CurrencyBadge currency={plan.currency} className="h-4 w-4" />
          {plan.ticket_price}
        </button>
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
  const available = plan.total_tickets - sold;
  const sym = currencySymbol(plan.currency);

  const submit = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Login required"); navigate("/login"); return; }
      if (count > available) { toast.error("Not enough tickets left"); return; }

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

      toast.success("Ticket purchased!");
      onClose();
      navigate(`/lottery/${plan.id}/tickets`);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const filled = Math.round(((sold + count) / plan.total_tickets) * 100);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-b from-purple-700 to-purple-900 text-white py-4">
          <DialogTitle className="text-center font-extrabold tracking-wider">CONFIRMATION!</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3 bg-white">
          <div className="flex justify-between text-sm"><span>Total Entries</span><span className="flex items-center gap-1"><Gem className="h-4 w-4 text-cyan-500"/>{myCount + count}</span></div>
          <div className="flex justify-between text-sm"><span>Total</span><span className="flex items-center gap-1"><Gem className="h-4 w-4 text-cyan-500"/>{total}</span></div>
          <div className="bg-indigo-600 text-white text-center italic font-bold py-2 rounded">{sold + count}/{plan.total_tickets}</div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${filled}%` }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-lg">total ticket</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCount(Math.max(1, count - 1))} className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
              <span className="font-extrabold text-2xl w-8 text-center">{count}</span>
              <button onClick={() => setCount(Math.min(available, count + 1))} className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
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
