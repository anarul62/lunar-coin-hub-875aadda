import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Users } from "lucide-react";

type Ref = { type: "flat" | "percent"; amount: number; currency: "INR" | "USDT"; percent: number };

const AdminReferralBonus = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [r, setR] = useState<Ref>({ type: "flat", amount: 0, currency: "USDT", percent: 0 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("value").eq("key", "agent_referral").maybeSingle();
    if (data?.value) setR(data.value as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "agent_referral", value: r as any, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Referral settings saved" });
  };

  return (
    <AdminLayout title="Agent Referral Bonus">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
        <div className="rounded-xl bg-white border border-slate-200 p-5 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-emerald-600"/>
            <h2 className="font-semibold text-slate-900">Agent Referral Setup</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Reward Type</Label>
              <div className="flex gap-2 mt-1">
                {(["flat", "percent"] as const).map(t => (
                  <button key={t} onClick={() => setR({ ...r, type: t })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize ${r.type === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300"}`}>
                    {t === "flat" ? "Flat Bonus" : "Commission %"}
                  </button>
                ))}
              </div>
            </div>

            {r.type === "flat" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Bonus Amount</Label>
                  <Input type="number" min={0} step="0.01" value={r.amount} onChange={e => setR({ ...r, amount: Number(e.target.value) })}/>
                </div>
                <div>
                  <Label>Currency</Label>
                  <div className="flex gap-2 mt-1">
                    {(["USDT", "INR"] as const).map(c => (
                      <button key={c} onClick={() => setR({ ...r, currency: c })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${r.currency === c ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300"}`}>{c}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <Label>Commission Percentage</Label>
                <Input type="number" min={0} max={100} step="0.01" value={r.percent} onChange={e => setR({ ...r, percent: Number(e.target.value) })} placeholder="e.g. 5 for 5%"/>
                <p className="text-xs text-slate-500 mt-1">Agent earns this % of referred user's deposit/investment.</p>
              </div>
            )}

            <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save Settings</>}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminReferralBonus;
