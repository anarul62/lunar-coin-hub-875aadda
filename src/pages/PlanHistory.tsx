import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

type Investment = {
  id: string;
  channel_name: string | null;
  plan_name: string;
  plan_image_url: string | null;
  amount: number;
  currency: string;
  expected_return: number;
  profit: number;
  duration_days: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

type LotteryItem = {
  id: string;
  plan_id: string;
  tickets_count: number;
  amount_paid: number;
  currency: string;
  created_at: string;
  plan_name: string;
  plan_image_url: string | null;
  draw_at: string | null;
  status: string;
  won: number;
};

const PlanHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Investment[]>([]);
  const [lotItems, setLotItems] = useState<LotteryItem[]>([]);
  const [tab, setTab] = useState<"all" | "invest" | "lottery">("all");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const [{ data: inv }, { data: ent }, { data: res }] = await Promise.all([
        supabase.from("user_investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("lottery_entries").select("*, lottery_plans(name,image_url,draw_at,status)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("lottery_results").select("plan_id,prize_amount").eq("user_id", user.id),
      ]);

      const wonMap: Record<string, number> = {};
      (res as any[] | null)?.forEach((r) => { wonMap[r.plan_id] = (wonMap[r.plan_id] || 0) + Number(r.prize_amount || 0); });

      setItems((inv as any) || []);
      setLotItems(((ent as any[]) || []).map((e) => ({
        id: e.id,
        plan_id: e.plan_id,
        tickets_count: e.tickets_count,
        amount_paid: Number(e.amount_paid),
        currency: e.currency,
        created_at: e.created_at,
        plan_name: e.lottery_plans?.name || "Lottery",
        plan_image_url: e.lottery_plans?.image_url || null,
        draw_at: e.lottery_plans?.draw_at || null,
        status: e.lottery_plans?.status || "open",
        won: wonMap[e.plan_id] || 0,
      })));
      setLoading(false);
    })();
  }, [navigate]);

  const totalInvested = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalProfit = items.reduce((s, i) => s + Number(i.profit || 0), 0);
  const totalLotteryPaid = lotItems.reduce((s, i) => s + i.amount_paid, 0);
  const totalLotteryWon = lotItems.reduce((s, i) => s + i.won, 0);
  const totalEarned = totalProfit + totalLotteryWon;
  const totalSpent = totalInvested + totalLotteryPaid;

  const showInvest = tab !== "lottery";
  const showLot = tab !== "invest";
  const empty = items.length === 0 && lotItems.length === 0;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-16 px-4">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-heading text-xl font-bold mb-3">Plan History</h1>

        {/* Earnings summary */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-gold-subtle p-4 mb-4">
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="font-heading text-3xl font-bold text-gradient-gold mt-1">+{totalEarned.toFixed(2)}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-[11px]">
            <div className="rounded-lg bg-card/60 p-2">
              <p className="text-muted-foreground">Invest Profit</p>
              <p className="text-emerald-500 font-semibold">+{totalProfit.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-card/60 p-2">
              <p className="text-muted-foreground">Lottery Win</p>
              <p className="text-emerald-500 font-semibold">+{totalLotteryWon.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-card/60 p-2">
              <p className="text-muted-foreground">Invested</p>
              <p className="text-foreground font-semibold">-{totalInvested.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-card/60 p-2">
              <p className="text-muted-foreground">Tickets Paid</p>
              <p className="text-foreground font-semibold">-{totalLotteryPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 text-xs">
          {(["all", "invest", "lottery"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full border ${tab === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
              {t === "all" ? "All" : t === "invest" ? "Investments" : "Lottery"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : empty ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary/40" />
            No purchases yet.
          </div>
        ) : (
          <div className="space-y-3">
            {showInvest && items.map((it) => (
              <div key={it.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex gap-3 p-3">
                  {it.plan_image_url ? (
                    <img src={it.plan_image_url} alt={it.plan_name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold shrink-0">
                      {it.plan_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{it.plan_name}</p>
                        <p className="text-[11px] text-muted-foreground">{it.channel_name} · Investment</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        it.status === "active" ? "bg-emerald-500/15 text-emerald-500" :
                        it.status === "completed" ? "bg-primary/15 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{it.status.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div><span className="text-muted-foreground">Spent:</span> <span className="font-semibold text-red-400">-{Number(it.amount).toFixed(2)} {it.currency}</span></div>
                      <div><span className="text-muted-foreground">Return:</span> <span className="font-semibold text-primary">{Number(it.expected_return).toFixed(2)} {it.currency}</span></div>
                      <div><span className="text-muted-foreground">Profit:</span> <span className="text-emerald-500">+{Number(it.profit).toFixed(2)}</span></div>
                      <div><span className="text-muted-foreground">Duration:</span> {it.duration_days}d</div>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-border bg-secondary/30 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Started: {new Date(it.starts_at).toLocaleString()}</span>
                  {it.ends_at && <span>Ends: {new Date(it.ends_at).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}

            {showLot && lotItems.map((it) => (
              <div key={it.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex gap-3 p-3">
                  {it.plan_image_url ? (
                    <img src={it.plan_image_url} alt={it.plan_name} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300 shrink-0">
                      <Ticket className="h-7 w-7" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{it.plan_name}</p>
                        <p className="text-[11px] text-muted-foreground">Lottery · {it.tickets_count} ticket{it.tickets_count > 1 ? "s" : ""}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        it.status === "completed" ? "bg-primary/15 text-primary" :
                        it.status === "drawing" ? "bg-amber-500/15 text-amber-500" :
                        "bg-emerald-500/15 text-emerald-500"
                      }`}>{it.status.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold text-red-400">-{it.amount_paid.toFixed(2)} {it.currency}</span></div>
                      <div><span className="text-muted-foreground">Won:</span> <span className="font-semibold text-emerald-500">+{it.won.toFixed(2)} {it.currency}</span></div>
                      <div><span className="text-muted-foreground">Tickets:</span> {it.tickets_count}</div>
                      <div><span className="text-muted-foreground">Draw:</span> {it.draw_at ? new Date(it.draw_at).toLocaleDateString() : "—"}</div>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-border bg-secondary/30 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Bought: {new Date(it.created_at).toLocaleString()}</span>
                  <button onClick={() => navigate(`/lottery/${it.plan_id}/details`)} className="text-primary font-semibold">View →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PlanHistory;
