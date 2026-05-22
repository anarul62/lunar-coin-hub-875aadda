import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Gem, Trophy } from "lucide-react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { formatCountdown, currencySymbol } from "@/lib/lottery";
import { Button } from "@/components/ui/button";

type Tab = "prizes" | "tickets" | "leaderboard";

const LotteryDetails = () => {
  const { planId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) || "prizes");
  const [plan, setPlan] = useState<any>(null);
  const [sold, setSold] = useState(0);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    const { data: p } = await supabase.from("lottery_plans").select("*").eq("id", planId).maybeSingle();
    setPlan(p);
    const { count } = await supabase.from("lottery_tickets").select("*", { count: "exact", head: true }).eq("plan_id", planId).not("user_id", "is", null);
    setSold(count || 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: mt } = await supabase.from("lottery_tickets").select("*").eq("plan_id", planId).eq("user_id", user.id).order("ticket_number");
      setMyTickets(mt || []);
    }
    const { data: rs } = await supabase.from("lottery_results").select("*").eq("plan_id", planId).order("rank");
    setResults(rs || []);
  };
  useEffect(() => { load(); }, [planId]);

  // Auto-trigger draw when timer passed and status open
  useEffect(() => {
    if (!plan) return;
    const expired = new Date(plan.draw_at).getTime() <= Date.now();
    if (expired && plan.status === "open") {
      supabase.functions.invoke("lottery-draw", { body: { plan_id: plan.id } }).then(() => setTimeout(load, 1500));
    }
  }, [plan, tick]);

  if (!plan) return <div className="p-8 text-center">Loading...</div>;

  const pool = sold * Number(plan.ticket_price);
  const sym = currencySymbol(plan.currency);
  const prizes = [
    { rank: "#1", pct: plan.pct_first, amount: Math.floor(pool * plan.pct_first / 100) },
    { rank: "#2", pct: plan.pct_second, amount: Math.floor(pool * plan.pct_second / 100) },
    { rank: "#3", pct: plan.pct_third, amount: Math.floor(pool * plan.pct_third / 100) },
    ...(plan.pct_4_11_enabled ? [{ rank: "#4-11", pct: plan.pct_4_11, amount: Math.floor(pool * plan.pct_4_11 / 100) }] : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-16">
        <div className="bg-gradient-to-b from-indigo-700 to-purple-900 px-4 pt-4 pb-6 text-white relative">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-3 h-9 w-9 rounded-full bg-black/30 flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <p className="text-center font-bold text-lg mb-3">DETAILS</p>
          <div className="flex gap-3">
            {plan.game_image_url && <img src={plan.game_image_url} className="h-20 w-20 rounded-xl object-cover" />}
            <div className="flex-1 grid grid-cols-2 gap-y-1 text-sm">
              <div className="text-white/70 text-xs">Prize Pool</div>
              <div className="text-white/70 text-xs">Registration end</div>
              <div className="font-bold flex items-center gap-1"><Gem className="h-4 w-4 text-cyan-300" />{pool.toLocaleString()}</div>
              <div className="font-bold text-xs">{new Date(plan.draw_at).toLocaleString()}</div>
              <div className="text-white/70 text-xs mt-1">Tournament Spots</div>
              <div className="text-white/70 text-xs mt-1">Results Out</div>
              <div className="font-extrabold italic">{sold}/{plan.total_tickets}</div>
              <div className="font-bold text-xs">{new Date(plan.draw_at).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 bg-purple-950 text-white">
          {(["prizes","tickets","leaderboard"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`py-3 font-bold text-sm uppercase ${tab===t ? "border-b-2 border-white" : "text-white/50"}`}>
              {t === "tickets" ? "View Tickets" : t}
            </button>
          ))}
        </div>

        <div className="bg-purple-900 min-h-[40vh] p-4 text-white">
          {tab === "prizes" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 text-xs text-white/60 px-2"><span>Rank</span><span className="text-right">Prize</span></div>
              {prizes.map((p, i) => (
                <div key={p.rank} className={`flex items-center justify-between rounded-lg px-4 py-3 ${i===0 ? "bg-gradient-to-r from-amber-500 to-amber-300 text-black" : "bg-purple-800/60"}`}>
                  <div className="flex items-center gap-2 font-bold italic text-lg">
                    {p.rank}{i===0 && <Trophy className="h-5 w-5"/>}
                  </div>
                  <div className="font-extrabold flex items-center gap-1"><Gem className={`h-4 w-4 ${i===0 ? "text-cyan-700" : "text-cyan-300"}`}/>{p.amount.toLocaleString()}{sym !== "💎" && ` ${sym}`}</div>
                </div>
              ))}
            </div>
          )}
          {tab === "tickets" && (
            <div>
              {myTickets.length === 0 ? <p className="text-center text-white/60 py-8">No booked tickets yet.</p> : (
                <div className="grid grid-cols-2 gap-2">
                  {myTickets.map((t) => (
                    <div key={t.id} className="bg-purple-800/60 rounded-lg p-3 text-sm">
                      <p className="text-xs text-white/60">Ticket #{t.ticket_number}</p>
                      <p className="font-bold">{t.code}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={() => navigate(`/lottery/${planId}/tickets`)} className="w-full mt-4 bg-emerald-500">Buy / Book more tickets</Button>
            </div>
          )}
          {tab === "leaderboard" && (
            results.length === 0 ? (
              <p className="text-center text-white/60 py-8">Leaderboard available after draw.</p>
            ) : (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.id} className="bg-purple-800/60 rounded-lg px-3 py-2 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-white/60">Rank {r.rank}</p>
                      <p className="text-xs">User {String(r.user_id).slice(0,8)}…</p>
                    </div>
                    <p className="font-bold flex items-center gap-1"><Gem className="h-4 w-4 text-cyan-300"/>{Number(r.prize_amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="bg-purple-950 text-center text-white py-3 font-bold text-sm">
          TOURNAMENT ENDS IN <span className="text-amber-400">{formatCountdown(plan.draw_at)}</span>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default LotteryDetails;
