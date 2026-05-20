import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TABS = [
  { key: "all", label: "All" },
  { key: "upi", label: "UPI" },
  { key: "bank", label: "Bank" },
  { key: "usdt", label: "USDT" },
  { key: "ewallet", label: "E-Wallet" },
];

const statusColor = (s: string) =>
  s === "approved" ? "text-emerald-600" : s === "rejected" ? "text-red-500" : "text-orange-500";

const WithdrawHistory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    (tab === "all" || i.method_key === tab) &&
    (statusFilter === "all" || i.status === statusFilter)
  );

  const sym = (c: string) => c === "INR" ? "₹" : c === "BDT" ? "৳" : "$";

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-10">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="flex-1 text-center text-lg font-semibold">Withdrawal history</h1>
        <div className="w-9"/>
      </header>

      <div className="px-3 pt-3 flex gap-2 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium shrink-0 ${tab === t.key ? "bg-gradient-to-r from-[#ff6b6b] to-[#ff8e3c] text-white" : "bg-white text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-3 pt-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-xl">No withdrawals yet</div>
        ) : filtered.map(w => (
          <div key={w.id} className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="bg-[#ff6b6b] text-white text-sm font-semibold px-3 py-1 rounded-md">Withdraw</span>
              <span className={`font-semibold ${statusColor(w.status)}`}>{w.status.charAt(0).toUpperCase() + w.status.slice(1)}</span>
            </div>
            <Row k="Balance" v={<span className="text-orange-500 font-bold">{sym(w.currency)}{Number(w.amount).toFixed(2)}</span>}/>
            <Row k="Type" v={w.method_label || w.method_key.toUpperCase()}/>
            <Row k="Time" v={new Date(w.created_at).toLocaleString()}/>
            <Row k="Order number" v={
              <button onClick={() => { navigator.clipboard.writeText(w.order_number); toast({ title: "Copied" }); }} className="inline-flex items-center gap-1 text-xs">
                {w.order_number} <Copy className="h-3 w-3"/>
              </button>
            }/>
            {w.rejection_reason && <Row k="Remarks" v={<span className="text-red-500 text-xs">{w.rejection_reason}</span>}/>}
          </div>
        ))}
      </div>
    </div>
  );
};

const Row = ({ k, v }: any) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-slate-500">{k}</span>
    <span className="text-slate-800">{v}</span>
  </div>
);

export default WithdrawHistory;
