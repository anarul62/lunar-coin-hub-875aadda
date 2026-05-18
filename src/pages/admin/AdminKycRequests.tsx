import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const AdminKycRequests = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase.from("kyc_requests").select("*").order("created_at", { ascending: false });
    setRows(data || []);
    const ids = [...new Set((data || []).map((r: any) => r.user_id))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("*").in("user_id", ids);
      const map: Record<string, any> = {};
      (p || []).forEach(x => { map[x.user_id] = x; });
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase.from("kyc_requests").update({ status: "approved", rejection_reason: null }).eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Approved" });
    load();
  };

  const submitReject = async () => {
    if (!rejectFor) return;
    if (!reason.trim()) return toast({ title: "Reason required", variant: "destructive" });
    const { error } = await supabase.from("kyc_requests").update({ status: "rejected", rejection_reason: reason.trim() }).eq("id", rejectFor.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Rejected" });
    setRejectFor(null); setReason(""); load();
  };

  const filtered = rows.filter(r => r.status === tab);

  return (
    <AdminLayout title="KYC Requests">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-2 mb-4 border-b border-slate-200">
          {(["pending", "approved", "rejected"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {t} ({rows.filter(r => r.status === t).length})
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">PAN</th>
                <th className="p-3 font-medium">Mobile</th>
                <th className="p-3 font-medium">User Email</th>
                <th className="p-3 font-medium">Submitted</th>
                <th className="p-3 font-medium">Reason</th>
                <th className="p-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{r.full_name}</td>
                  <td className="p-3 font-mono">{r.pan_number}</td>
                  <td className="p-3">{r.mobile}</td>
                  <td className="p-3 text-slate-500">{profiles[r.user_id]?.email || "-"}</td>
                  <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-xs text-red-600 max-w-[180px] truncate">{r.rejection_reason || "-"}</td>
                  <td className="p-3 text-right">
                    {r.status === "pending" ? (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={() => approve(r.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1"/>Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setRejectFor(r); setReason(""); }} className="h-8">
                          <XCircle className="h-3.5 w-3.5 mr-1"/>Reject
                        </Button>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-xs ${r.status === "approved" ? "text-emerald-700" : "text-red-700"}`}>
                        {r.status === "approved" ? <CheckCircle2 className="h-3.5 w-3.5"/> : <XCircle className="h-3.5 w-3.5"/>}
                        {r.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400"><Clock className="h-6 w-6 mx-auto mb-2 opacity-50"/>No {tab} requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!rejectFor} onOpenChange={o => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject KYC Request</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Provide a reason for rejecting <span className="font-semibold">{rejectFor?.full_name}</span>'s KYC. The user will see this and be able to re-apply.</p>
          <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. PAN number does not match the name provided" rows={4} maxLength={500}/>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject}>Submit Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKycRequests;
