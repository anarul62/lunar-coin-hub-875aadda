import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, Check, X, Copy } from "lucide-react";

type Row = any;
const STATUS = ["pending", "approved", "rejected", "all"] as const;

const sym = (c: string) => c === "INR" ? "₹" : c === "BDT" ? "৳" : "$";

const AdminWithdrawals = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof STATUS[number]>("pending");
  const [q, setQ] = useState("");
  const [rejectFor, setRejectFor] = useState<Row | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: ws } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(500);
    const ids = Array.from(new Set((ws || []).map(w => w.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("user_id, full_name, phone, referral_code, balance_usdt").in("user_id", ids)
      : { data: [] as any[] };
    setRows((ws || []).map(w => ({ ...w, profile: profs?.find(p => p.user_id === w.user_id) })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let r = rows;
    if (tab !== "all") r = r.filter(x => x.status === tab);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      r = r.filter(x =>
        x.order_number?.toLowerCase().includes(s) ||
        x.profile?.referral_code?.toLowerCase().includes(s) ||
        x.profile?.phone?.toLowerCase().includes(s) ||
        x.profile?.full_name?.toLowerCase().includes(s)
      );
    }
    return r;
  }, [rows, tab, q]);

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const todays = rows.filter(r => new Date(r.created_at) >= today);
    return {
      todayCount: todays.length,
      todayUsdt: todays.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount_usdt || 0), 0),
      pending: rows.filter(r => r.status === "pending").length,
      approved: rows.filter(r => r.status === "approved").length,
      rejected: rows.filter(r => r.status === "rejected").length,
      total: rows.length,
    };
  }, [rows]);

  const approve = async (w: Row) => {
    // Balance was already deducted at request time
    const { error } = await supabase.from("withdrawals").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", w.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Approved" });
    load();
  };

  const doReject = async () => {
    if (!rejectFor) return;
    if (!reason.trim()) return toast({ title: "Enter reason", variant: "destructive" });
    // Refund balance back to user
    const { data: fresh } = await supabase.from("profiles").select("balance_usdt").eq("user_id", rejectFor.user_id).maybeSingle();
    const refunded = Number(fresh?.balance_usdt || 0) + Number(rejectFor.amount_usdt || 0);
    const { error: eBal } = await supabase.from("profiles").update({ balance_usdt: refunded }).eq("user_id", rejectFor.user_id);
    if (eBal) return toast({ title: "Refund failed", description: eBal.message, variant: "destructive" });
    const { error } = await supabase.from("withdrawals").update({ status: "rejected", rejection_reason: reason, updated_at: new Date().toISOString() }).eq("id", rejectFor.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Rejected & balance refunded" });
    setRejectFor(null); setReason(""); load();
  };

  return (
    <AdminLayout title="Withdrawal Requests">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard label="Today requests" value={stats.todayCount}/>
            <StatCard label="Today USDT (approved)" value={stats.todayUsdt.toFixed(2)}/>
            <StatCard label="Pending" value={stats.pending} color="text-orange-500"/>
            <StatCard label="Approved" value={stats.approved} color="text-emerald-600"/>
            <StatCard label="Rejected" value={stats.rejected} color="text-red-500"/>
            <StatCard label="Total" value={stats.total}/>
          </div>

          {/* Tabs + Search */}
          <div className="bg-white rounded-xl p-3 border flex flex-wrap items-center gap-2">
            {STATUS.map(s => (
              <button key={s} onClick={() => setTab(s)} className={`px-3 py-1.5 rounded-md text-sm capitalize ${tab === s ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>{s}</button>
            ))}
            <div className="ml-auto relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order # or user code" className="pl-8 w-72"/>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs">
                <tr>
                  <th className="p-2 text-left">Order</th>
                  <th className="p-2">Type</th>
                  <th className="p-2 text-right">Amount</th>
                  <th className="p-2 text-right">USDT</th>
                  <th className="p-2 text-left">User</th>
                  <th className="p-2 text-left">Address</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} className="border-t align-top">
                    <td className="p-2">
                      <button onClick={() => { navigator.clipboard.writeText(w.order_number); toast({ title: "Copied" }); }} className="text-xs font-mono inline-flex items-center gap-1 text-slate-700 hover:text-emerald-600">
                        {w.order_number} <Copy className="h-3 w-3"/>
                      </button>
                    </td>
                    <td className="p-2 text-center">{w.method_label || w.method_key}</td>
                    <td className="p-2 text-right font-semibold">{sym(w.currency)}{Number(w.amount).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(w.amount_usdt).toFixed(2)}</td>
                    <td className="p-2">
                      <div className="text-xs">
                        <p className="font-semibold">{w.profile?.full_name || "—"}</p>
                        <p className="text-slate-500">{w.profile?.phone || "—"}</p>
                        <p className="font-mono text-emerald-600">{w.profile?.referral_code}</p>
                      </div>
                    </td>
                    <td className="p-2 text-xs max-w-[220px]">
                      <pre className="whitespace-pre-wrap break-words text-[10px] text-slate-600">{JSON.stringify(w.address_snapshot, null, 0)}</pre>
                    </td>
                    <td className="p-2 text-xs text-center">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="p-2 text-center capitalize">
                      <span className={`text-xs font-semibold ${w.status === "approved" ? "text-emerald-600" : w.status === "rejected" ? "text-red-500" : "text-orange-500"}`}>{w.status}</span>
                      {w.rejection_reason && <p className="text-[10px] text-red-500 mt-1">{w.rejection_reason}</p>}
                    </td>
                    <td className="p-2">
                      {w.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => approve(w)} className="bg-emerald-600 hover:bg-emerald-700 h-7 px-2"><Check className="h-3 w-3"/></Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectFor(w)} className="h-7 px-2"><X className="h-3 w-3"/></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400 p-6">No requests</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!rejectFor} onOpenChange={o => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject withdrawal</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason..." rows={4}/>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

const StatCard = ({ label, value, color }: any) => (
  <div className="bg-white rounded-xl p-3 border">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`text-xl font-bold mt-1 ${color || "text-slate-900"}`}>{value}</p>
  </div>
);

export default AdminWithdrawals;
