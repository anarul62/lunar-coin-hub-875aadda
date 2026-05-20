import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Loader2, LayoutGrid } from "lucide-react";

type Deposit = {
  id: string;
  order_number: string | null;
  status: "pending" | "completed" | "rejected" | string;
  amount: number;
  currency: string;
  amount_usdt: number;
  method_key: string | null;
  method_label: string | null;
  transaction_id: string | null;
  rejection_reason: string | null;
  created_at: string;
};


type Method = { method_key: string; label: string; icon_url: string | null };

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "To Be Paid", color: "text-sky-500" },
  completed: { label: "Complete",   color: "text-emerald-600" },
  rejected:  { label: "Failed",     color: "text-rose-500" },
};

const fmtTime = (s: string) => {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const sym = (c: string) => c === "INR" ? "₹" : c === "BDT" ? "৳" : c === "USDT" ? "₮" : "";

const DepositHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Deposit[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [filterKey, setFilterKey] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const [{ data: deps }, { data: pm }] = await Promise.all([
      supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("payment_methods").select("method_key,label,icon_url").eq("enabled", true).order("sort_order"),
    ]);
    setItems((deps as any) || []);
    setMethods((pm as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(i =>
    (filterKey === "all" || i.method_key === filterKey) &&
    (filterStatus === "all" || i.status === filterStatus)
  ), [items, filterKey, filterStatus]);

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast({ title: "Copied" }); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center justify-center px-4 relative">
        <button onClick={() => navigate(-1)} className="absolute left-3 p-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="font-semibold text-slate-900">Deposit history</h1>
      </header>

      <main className="p-3 pb-24 max-w-2xl mx-auto">
        {/* Method tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button onClick={() => setFilterKey("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shrink-0 ${filterKey === "all" ? "bg-gradient-to-r from-rose-400 to-rose-300 text-white" : "bg-white border border-slate-200 text-slate-700"}`}>
            <LayoutGrid className="h-4 w-4"/> <span className="text-sm font-medium">All</span>
          </button>
          {methods.map(m => (
            <button key={m.method_key} onClick={() => setFilterKey(m.method_key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg shrink-0 ${filterKey === m.method_key ? "ring-2 ring-rose-400" : ""} bg-white border border-slate-200 text-slate-700`}>
              {m.icon_url && <img src={m.icon_url} alt="" className="h-5 w-5 object-contain"/>}
              <span className="text-sm font-medium">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-2 gap-3 my-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700">
            <option value="all">All</option>
            <option value="pending">To Be Paid</option>
            <option value="completed">Complete</option>
            <option value="rejected">Failed</option>
          </select>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-400">Choose a date</div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-slate-400 py-16 text-sm">No deposits yet</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const st = STATUS_META[d.status] || { label: d.status, color: "text-slate-500" };
              return (
                <div key={d.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="bg-emerald-500 text-white text-sm font-semibold px-4 py-1.5 rounded-md">Deposit</span>
                    <span className={`text-sm font-semibold ${st.color}`}>{st.label}</span>
                  </div>
                  <Row label="Balance" value={<span className="text-amber-500 font-semibold">{sym(d.currency)}{Number(d.amount).toFixed(2)}</span>}/>
                  <Row label="Type" value={<span className="text-slate-700">{d.method_label || d.method_key || "—"}</span>}/>
                  <Row label="Time" value={<span className="text-slate-700">{fmtTime(d.created_at)}</span>}/>
                  <Row label="Order number" value={
                    <button onClick={() => d.order_number && copy(d.order_number)} className="flex items-center gap-1 text-slate-700">
                      <span className="truncate max-w-[180px]">{d.order_number || "—"}</span>
                      <Copy className="h-3.5 w-3.5 text-slate-400"/>
                    </button>
                  }/>
                  <Row label="Transaction ID" value={
                    d.transaction_id ? (
                      <button onClick={() => copy(d.transaction_id!)} className="flex items-center gap-1 text-slate-700">
                        <span className="truncate max-w-[180px] font-mono text-xs">{d.transaction_id}</span>
                        <Copy className="h-3.5 w-3.5 text-slate-400"/>
                      </button>
                    ) : <span className="text-slate-400">—</span>
                  }/>

                  {d.status === "rejected" && d.rejection_reason && (
                    <div className="mt-2 text-xs text-rose-500 bg-rose-50 rounded-md p-2">Reason: {d.rejection_reason}</div>
                  )}
                </div>
              );
            })}
            <div className="text-center text-slate-400 text-sm py-4">No more</div>
          </div>
        )}
      </main>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 text-sm">
    <span className="text-slate-500">{label}</span>
    {value}
  </div>
);

export default DepositHistory;
