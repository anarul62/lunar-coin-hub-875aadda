import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, XCircle, ShieldCheck, Loader2 } from "lucide-react";

type KycRow = {
  id: string;
  full_name: string;
  pan_number: string;
  mobile: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

const KycModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [latest, setLatest] = useState<KycRow | null>(null);
  const [form, setForm] = useState({ full_name: "", pan_number: "", mobile: "" });

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const { data } = await supabase
      .from("kyc_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setLatest((data?.[0] as KycRow) || null);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const submit = async () => {
    if (!userId) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }
    if (!form.full_name.trim() || !form.pan_number.trim() || !form.mobile.trim()) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan_number.trim().toUpperCase())) {
      toast({ title: "Invalid PAN number", description: "Format: ABCDE1234F", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("kyc_requests").insert({
      user_id: userId,
      full_name: form.full_name.trim(),
      pan_number: form.pan_number.trim().toUpperCase(),
      mobile: form.mobile.trim(),
    });
    setSubmitting(false);
    if (error) { toast({ title: "Submission failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "KYC submitted", description: "Your KYC request is under review." });
    setForm({ full_name: "", pan_number: "", mobile: "" });
    load();
  };

  const canApply = !latest || latest.status === "rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> KYC Verification
          </DialogTitle>
          <DialogDescription>Submit your details for KYC verification.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>
        ) : (
          <>
            {latest && (
              <div className={`rounded-lg p-3 border ${
                latest.status === "approved" ? "border-green-500/40 bg-green-500/10" :
                latest.status === "rejected" ? "border-red-500/40 bg-red-500/10" :
                "border-amber-500/40 bg-amber-500/10"
              }`}>
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {latest.status === "approved" && <><CheckCircle2 className="h-4 w-4 text-green-600"/> KYC Complete — Successful</>}
                  {latest.status === "pending" && <><Clock className="h-4 w-4 text-amber-600"/> Under Review</>}
                  {latest.status === "rejected" && <><XCircle className="h-4 w-4 text-red-600"/> Rejected</>}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {latest.full_name} · PAN {latest.pan_number}
                </div>
                {latest.status === "rejected" && latest.rejection_reason && (
                  <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                    <span className="font-semibold">Reason:</span> {latest.rejection_reason}
                  </div>
                )}
              </div>
            )}

            {canApply && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="As per PAN" maxLength={100}/>
                </div>
                <div>
                  <Label>PAN Card Number</Label>
                  <Input value={form.pan_number} onChange={e => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10}/>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" maxLength={15}/>
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : latest?.status === "rejected" ? "Re-apply KYC" : "Submit KYC"}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KycModal;
