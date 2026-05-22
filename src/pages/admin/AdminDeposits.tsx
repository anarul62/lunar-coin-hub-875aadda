import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Search, TrendingUp, Wallet, Clock, ShieldX, ShieldCheck, Eye, CreditCard, X } from "lucide-react";

type Dep = {
  id: string; user_id: string; order_number: string | null;
  status: string; amount: number; currency: string; amount_usdt: number;
  method_key: string | null; method_label: string | null;
  transaction_id: string | null;
  rejection_reason: string | null; created_at: string;
};
type Prof = { user_id: string; full_name: string | null; phone: string | null; referral_code: string | null };

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected:  "bg-rose-100 text-rose-700",
};

const AdminDeposits = () => {
  const [items, setItems] = useState<Dep[]>([]);
  const [profMap, setProfMap] = useState<Record<string, Prof>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("pending");
  const [q, setQ] = useState("");
  const [searchMode, setSearchMode] = useState<"order" | "code">("order");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [showLgpay, setShowLgpay] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }).limit(1000);
    const list = (data as any[]) || [];
    setItems(list);
    const uids = Array.from(new Set(list.map(d => d.user_id)));
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,full_name,phone,referral_code").in("user_id", uids);
      const map: Record<string, Prof> = {};
      (profs as any[] || []).forEach(p => { map[p.user_id] = p; });
      setProfMap(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (d: Dep) => {
    if (!confirm(`Approve ${d.order_number}?`)) return;
    const { error: e1 } = await supabase.from("deposits").update({ status: "completed" }).eq("id", d.id);
    if (e1) return toast({ title: "Failed", description: e1.message, variant: "destructive" });
    const { data: prof } = await supabase.from("profiles").select("balance_usdt").eq("user_id", d.user_id).maybeSingle();
    const newBal = Number(prof?.balance_usdt || 0) + Number(d.amount_usdt || 0);
    await supabase.from("profiles").update({ balance_usdt: newBal }).eq("user_id", d.user_id);
    toast({ title: "Approved & credited" });
    load();
  };

  const reject = async () => {
    if (!rejectId) return;
    const { error } = await supabase.from("deposits").update({ status: "rejected", rejection_reason: reason }).eq("id", rejectId);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Rejected" });
    setRejectId(null); setReason("");
    load();
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    let todayAmount = 0, todayCount = 0, approved = 0, rejected = 0, pending = 0, completedAmt = 0;
    items.forEach(d => {
      const created = new Date(d.created_at);
      if (created >= today && d.status === "completed") { todayAmount += Number(d.amount_usdt||0); todayCount++; }
      if (d.status === "completed") { approved++; completedAmt += Number(d.amount_usdt||0); }
      if (d.status === "rejected") rejected++;
      if (d.status === "pending") pending++;
    });
    return { todayAmount, todayCount, approved, rejected, pending, completedAmt };
  }, [items]);

  // 7-day bar graph (completed deposits per day in USDT)
  const chart = useMemo(() => {
    const days: { label: string; key: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days.push({ key, label: d.toLocaleDateString(undefined, { weekday: "short" }), total: 0 });
    }
    items.forEach(d => {
      if (d.status !== "completed") return;
      const key = new Date(d.created_at).toISOString().slice(0,10);
      const day = days.find(x => x.key === key);
      if (day) day.total += Number(d.amount_usdt||0);
    });
    const max = Math.max(1, ...days.map(d => d.total));
    return { days, max };
  }, [items]);

  const filtered = useMemo(() => items.filter(i => {
    if (tab !== "all" && i.status !== tab) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    if (searchMode === "order") {
      return (i.order_number || "").toLowerCase().includes(needle)
        || (i.transaction_id || "").toLowerCase().includes(needle);
    }
    const p = profMap[i.user_id];
    return (p?.referral_code || "").toLowerCase().includes(needle);
  }), [items, tab, q, searchMode, profMap]);

  const sym = (c: string) => c === "INR" ? "₹" : c === "BDT" ? "৳" : c === "USDT" ? "₮" : "";

  return (
    <AdminLayout title="Deposit Requests">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard icon={<Wallet className="h-5 w-5"/>} label="Today's Deposit" value={`₮ ${stats.todayAmount.toFixed(2)}`} sub={`${stats.todayCount} orders`} color="from-sky-500 to-sky-600"/>
        <StatCard icon={<ShieldCheck className="h-5 w-5"/>} label="Approved" value={stats.approved} sub={`₮ ${stats.completedAmt.toFixed(2)}`} color="from-emerald-500 to-emerald-600"/>
        <StatCard icon={<ShieldX className="h-5 w-5"/>} label="Rejected" value={stats.rejected} color="from-rose-500 to-rose-600"/>
        <StatCard icon={<Clock className="h-5 w-5"/>} label="Pending" value={stats.pending} color="from-amber-500 to-amber-600"/>
        <StatCard icon={<TrendingUp className="h-5 w-5"/>} label="Total Orders" value={items.length} color="from-violet-500 to-violet-600"/>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-slate-900">Last 7 days — Completed Deposits (USDT)</div>
          <TrendingUp className="h-4 w-4 text-emerald-500"/>
        </div>
        <div className="flex items-end gap-3 h-40">
          {chart.days.map(d => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-slate-500">{d.total > 0 ? d.total.toFixed(0) : ""}</div>
              <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-md transition-all"
                style={{ height: `${(d.total / chart.max) * 100}%`, minHeight: d.total > 0 ? 4 : 2 }}/>
              <div className="text-xs text-slate-500">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-slate-100 rounded-lg p-1 flex-wrap">
            {["all", "pending", "completed", "rejected"].map(s => (
              <button key={s} onClick={() => setTab(s)}
                className={`px-3 py-1.5 text-sm rounded-md capitalize ${tab === s ? "bg-white shadow text-slate-900 font-medium" : "text-slate-600"}`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <select value={searchMode} onChange={e => setSearchMode(e.target.value as any)}
              className="border border-slate-200 rounded-lg text-sm px-2 py-2 bg-white">
              <option value="order">Order / Tx ID</option>
              <option value="code">User Ref Code</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input value={q} onChange={e => setQ(e.target.value)}
                placeholder={searchMode === "order" ? "Order or transaction id" : "Referral code"}
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"/>
            </div>
          </div>
        </div>

        {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-3">Order No</th>
                  <th className="py-2 pr-3">Transaction ID</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">USDT</th>
                  <th className="py-2 pr-3">User Code</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const p = profMap[d.user_id];
                  return (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-3 font-mono text-xs">{d.order_number}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{d.transaction_id || <span className="text-slate-300">—</span>}</td>
                      <td className="py-2 pr-3">{d.method_label || d.method_key}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{sym(d.currency)}{Number(d.amount).toFixed(2)} <span className="text-slate-400 text-xs">{d.currency}</span></td>
                      <td className="py-2 pr-3">{Number(d.amount_usdt).toFixed(4)}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-violet-600">{p?.referral_code || "—"}</td>
                      <td className="py-2 pr-3">
                        <div className="text-xs font-medium text-slate-900">{p?.full_name || "—"}</div>
                        <div className="text-[10px] text-slate-400">{p?.phone || ""}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded text-xs ${STATUS_BADGE[d.status] || "bg-slate-100"}`}>{d.status}</span></td>
                      <td className="py-2 pr-3 text-right">
                        {d.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approve(d)} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs"><CheckCircle2 className="h-3 w-3"/>Approve</button>
                            <button onClick={() => { setRejectId(d.id); setReason(""); }} className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600 text-white rounded text-xs"><XCircle className="h-3 w-3"/>Reject</button>
                          </div>
                        )}
                        {d.status === "rejected" && d.rejection_reason && <span className="text-xs text-rose-500">{d.rejection_reason}</span>}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 py-10">No deposits</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setRejectId(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-md p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Reject deposit</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="Reason for rejection (shown to user)"
              className="w-full border border-slate-200 rounded-lg p-3 text-sm bg-white"/>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setRejectId(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">Cancel</button>
              <button onClick={reject} disabled={!reason.trim()} className="px-3 py-2 text-sm bg-rose-600 text-white rounded-lg disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: any; sub?: string; color: string }) => (
  <div className={`rounded-xl p-4 text-white bg-gradient-to-br ${color} shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className="text-xs opacity-90">{label}</div>
      <div className="opacity-90">{icon}</div>
    </div>
    <div className="text-2xl font-bold mt-2">{value}</div>
    {sub && <div className="text-[11px] opacity-80 mt-0.5">{sub}</div>}
  </div>
);

export default AdminDeposits;
