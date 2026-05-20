import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, Search } from "lucide-react";

type Dep = {
  id: string; user_id: string; order_number: string | null;
  status: string; amount: number; currency: string; amount_usdt: number;
  method_key: string | null; method_label: string | null;
  rejection_reason: string | null; created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected:  "bg-rose-100 text-rose-700",
};

const AdminDeposits = () => {
  const [items, setItems] = useState<Dep[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("pending");
  const [q, setQ] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("deposits").select("*").order("created_at", { ascending: false }).limit(500);
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const approve = async (d: Dep) => {
    if (!confirm(`Approve ${d.order_number}?`)) return;
    const { error: e1 } = await supabase.from("deposits").update({ status: "completed" }).eq("id", d.id);
    if (e1) return toast({ title: "Failed", description: e1.message, variant: "destructive" });
    // Credit user balance
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

  const filtered = items.filter(i =>
    (tab === "all" || i.status === tab) &&
    (!q || (i.order_number || "").toLowerCase().includes(q.toLowerCase()) || (i.user_id || "").includes(q))
  );

  return (
    <AdminLayout title="Deposit Requests">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-slate-100 rounded-lg p-1">
            {["pending", "completed", "rejected", "all"].map(s => (
              <button key={s} onClick={() => setTab(s)}
                className={`px-3 py-1.5 text-sm rounded-md capitalize ${tab === s ? "bg-white shadow text-slate-900 font-medium" : "text-slate-600"}`}>{s}</button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Order or user id"
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"/>
          </div>
        </div>

        {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">USDT</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Time</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-xs">{d.order_number}</td>
                    <td className="py-2 pr-3">{d.method_label || d.method_key}</td>
                    <td className="py-2 pr-3">{d.currency} {Number(d.amount).toFixed(2)}</td>
                    <td className="py-2 pr-3">{Number(d.amount_usdt).toFixed(4)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{d.user_id.slice(0, 8)}…</td>
                    <td className="py-2 pr-3 text-xs">{new Date(d.created_at).toLocaleString()}</td>
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
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="text-center text-slate-400 py-10">No deposits</td></tr>}
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

export default AdminDeposits;
