import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { getReadyUser } from "@/lib/auth-session";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Loader2 } from "lucide-react";

type Row = {
  id: string;
  kind: "deposit" | "withdraw" | "invest";
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  meta?: string;
};

const Transactions = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "deposit" | "withdraw" | "invest">("all");

  useEffect(() => {
    (async () => {
      const u = await getReadyUser();
      if (!u) { navigate("/login"); return; }
      const [d, w, i] = await Promise.all([
        supabase.from("deposits").select("id,amount,currency,status,created_at,order_number").eq("user_id", u.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("withdrawals").select("id,amount,currency,status,created_at,order_number").eq("user_id", u.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("user_investments").select("id,amount,currency,status,created_at,plan_name").eq("user_id", u.id).order("created_at", { ascending: false }).limit(200),
      ]);
      const all: Row[] = [
        ...((d.data as any[]) || []).map((r) => ({ id: r.id, kind: "deposit" as const, amount: Number(r.amount), currency: r.currency, status: r.status, created_at: r.created_at, meta: r.order_number })),
        ...((w.data as any[]) || []).map((r) => ({ id: r.id, kind: "withdraw" as const, amount: Number(r.amount), currency: r.currency, status: r.status, created_at: r.created_at, meta: r.order_number })),
        ...((i.data as any[]) || []).map((r) => ({ id: r.id, kind: "invest" as const, amount: Number(r.amount), currency: r.currency, status: r.status, created_at: r.created_at, meta: r.plan_name })),
      ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setRows(all);
      setLoading(false);
    })();
  }, [navigate]);

  const list = tab === "all" ? rows : rows.filter((r) => r.kind === tab);

  const meta = (k: Row["kind"]) =>
    k === "deposit" ? { icon: ArrowDownToLine, color: "text-emerald-400", label: "Deposit", sign: "+" }
    : k === "withdraw" ? { icon: ArrowUpFromLine, color: "text-rose-400", label: "Withdraw", sign: "-" }
    : { icon: TrendingUp, color: "text-amber-400", label: "Investment", sign: "-" };

  const statusBadge = (s: string) => {
    const cls = s === "approved" || s === "completed" || s === "active"
      ? "bg-emerald-500/20 text-emerald-300"
      : s === "pending" ? "bg-amber-500/20 text-amber-300"
      : "bg-rose-500/20 text-rose-300";
    return <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls}`}>{s}</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="pt-14">
        <div className="px-4 pt-6 pb-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-heading text-2xl font-bold text-gradient-gold">Transactions</h1>
        </div>

        <div className="px-4 flex gap-2 overflow-x-auto pb-2">
          {(["all", "deposit", "withdraw", "invest"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${tab === t ? "bg-gradient-gold text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <section className="px-4 mt-2 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No transactions yet.</p>
          ) : list.map((r) => {
            const m = meta(r.kind);
            const Icon = m.icon;
            return (
              <div key={r.kind + r.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-card-foreground/5 flex items-center justify-center ${m.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{m.label}</p>
                    <p className={`text-sm font-semibold ${m.color}`}>{m.sign}{r.amount.toFixed(2)} {r.currency}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-[11px] text-muted-foreground truncate">{r.meta || "-"}</p>
                    <div className="flex items-center gap-2">
                      {statusBadge(r.status)}
                      <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Transactions;
