import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";

type Cfg = {
  amount: number; currency: "USDT" | "INR" | "BDT";
  min_deposit: number; min_deposit_currency: "USDT" | "INR" | "BDT";
  required_invites: number; image_url: string;
};

const DEFAULT: Cfg = { amount: 100, currency: "INR", min_deposit: 10, min_deposit_currency: "USDT", required_invites: 1, image_url: "" };

const AdminInviteBonus = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [c, setC] = useState<Cfg>(DEFAULT);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("value").eq("key", "invite_bonus").maybeSingle();
    if (data?.value) setC({ ...DEFAULT, ...(data.value as any) });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "invite_bonus", value: c as any, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
  };

  const upload = async (f: File) => {
    setUploading(true);
    const path = `invite/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("banners").upload(path, f);
    if (error) { setUploading(false); return toast({ title: "Upload failed", description: error.message, variant: "destructive" }); }
    const { data } = supabase.storage.from("banners").getPublicUrl(path);
    setC({ ...c, image_url: data.publicUrl });
    setUploading(false);
  };

  const Cur = ({ value, onChange }: any) => (
    <div className="flex gap-1">
      {(["USDT", "INR", "BDT"] as const).map(x => (
        <button key={x} onClick={() => onChange(x)} className={`px-3 py-1.5 rounded text-xs font-medium border ${value === x ? "bg-emerald-600 text-white border-emerald-600" : "bg-white border-slate-300"}`}>{x}</button>
      ))}
    </div>
  );

  return (
    <AdminLayout title="Invite Bonus Setup">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
        <div className="max-w-2xl space-y-5">
          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold">Reward per Successful Invite</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" min={0} step="0.01" value={c.amount} onChange={e => setC({ ...c, amount: Number(e.target.value) })}/>
              </div>
              <div>
                <Label>Currency</Label>
                <div className="mt-1"><Cur value={c.currency} onChange={(v: any) => setC({ ...c, currency: v })}/></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold">Eligibility Requirements</h3>
            <div>
              <Label>Required Invites</Label>
              <Input type="number" min={1} value={c.required_invites} onChange={e => setC({ ...c, required_invites: Number(e.target.value) })}/>
              <p className="text-xs text-slate-500 mt-1">Number of friends user must invite (who also deposit) before claim.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Deposit per Invitee</Label>
                <Input type="number" min={0} step="0.01" value={c.min_deposit} onChange={e => setC({ ...c, min_deposit: Number(e.target.value) })}/>
              </div>
              <div>
                <Label>Currency</Label>
                <div className="mt-1"><Cur value={c.min_deposit_currency} onChange={(v: any) => setC({ ...c, min_deposit_currency: v })}/></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="font-semibold">Referral Promo Image</h3>
            <div className="flex gap-4 items-start">
              <div className="w-28 h-36 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {c.image_url ? <img src={c.image_url} alt="" className="w-full h-full object-cover"/> : <ImageIcon className="h-8 w-8 text-slate-400"/>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-sm">
                  <Upload className="h-4 w-4"/> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
                </label>
                {uploading && <p className="text-xs text-slate-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Uploading…</p>}
                {c.image_url && (
                  <button onClick={() => setC({ ...c, image_url: "" })} className="inline-flex items-center gap-1 text-red-600 text-sm">
                    <Trash2 className="h-4 w-4"/> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save All</>}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInviteBonus;
