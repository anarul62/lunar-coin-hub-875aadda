import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";
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
  interest_value: number | null;
  interest_type: string | null;
  interest_period: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

const PlanHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Investment[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase
        .from("user_investments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-16 px-4">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="font-heading text-xl font-bold mb-4">Plan History</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-primary/40" />
            No investments yet. Visit the Invest page to start.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
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
                        <p className="text-[11px] text-muted-foreground">{it.channel_name}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        it.status === "active" ? "bg-emerald-500/15 text-emerald-500" :
                        it.status === "completed" ? "bg-primary/15 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{it.status.toUpperCase()}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <div><span className="text-muted-foreground">Invested:</span> <span className="font-semibold text-foreground">{Number(it.amount).toFixed(2)} {it.currency}</span></div>
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
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default PlanHistory;
