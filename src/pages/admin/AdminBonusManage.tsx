import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { fetchLiveUsdInr } from "@/lib/currency";
import { Loader2, Save, Lock, Unlock, DollarSign, Gift } from "lucide-react";

type Bonus = { amount: number; currency: "INR" | "USDT"; locked: boolean };
type Rate = { mode: "auto" | "manual"; rate: number };

const AdminBonusManage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bonus, setBonus] = useState<Bonus>({ amount: 0, currency: "USDT", locked: true });
  const [rate, setRate] = useState<Rate>({ mode: "auto", rate: 83 });
  const [liveRate, setLiveRate] = useState<number>(83);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*").in("key", ["registration_bonus", "usd_inr_rate"]);
    data?.forEach((row: any) => {
      if (row.key === "registration_bonus") setBonus(row.value);
      if (row.key === "usd_inr_rate") setRate(row.value);
    });
    setLiveRate(await fetchLiveUsdInr());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveBonus = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "registration_bonus", value: bonus as any, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Registration bonus saved" });
  };
  const saveRate = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "usd_inr_rate", value: rate as any, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "USD rate saved" });
  };

  return (
    <AdminLayout title="Bonus Manage">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Registration Bonus */}
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="h-5 w-5 text-emerald-600"/>
              <h2 className="font-semibold text-slate-900">Registration Bonus</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-slate-700">Bonus Amount</Label>
                <Input type="number" min={0} step="0.01" value={bonus.amount}
                  onChange={(e) => setBonus({ ...bonus, amount: Number(e.target.value) })}
                  placeholder="0 = no bonus"/>
                <p className="text-xs text-slate-500 mt-1">Set 0 to disable signup bonus.</p>
              </div>
              <div>
                <Label className="text-slate-700">Currency</Label>
                <div className="flex gap-2 mt-1">
                  {(["USDT", "INR"] as const).map(c => (
                    <button key={c} onClick={() => setBonus({ ...bonus, currency: c })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${bonus.currency === c ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={saveBonus} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save Bonus</>}
              </Button>
            </div>
          </div>

          {/* Registration Bonus Lock */}
          <div className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              {bonus.locked ? <Lock className="h-5 w-5 text-amber-600"/> : <Unlock className="h-5 w-5 text-emerald-600"/>}
              <h2 className="font-semibold text-slate-900">Registration Bonus Lock</h2>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-900">
                  {bonus.locked ? "Locked" : "Unlocked"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {bonus.locked
                    ? "User must deposit first to use signup bonus or buy plans."
                    : "User can use signup bonus without depositing."}
                </p>
              </div>
              <Switch checked={bonus.locked} onCheckedChange={(v) => setBonus({ ...bonus, locked: v })}/>
            </div>
            <Button onClick={saveBonus} disabled={saving} className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save Lock Setting</>}
            </Button>
          </div>

          {/* USD/INR rate */}
          <div className="rounded-xl bg-white border border-slate-200 p-5 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-blue-600"/>
              <h2 className="font-semibold text-slate-900">USDT / INR Conversion Rate</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <Label className="text-slate-700">Mode</Label>
                <div className="flex gap-2 mt-1">
                  {(["auto", "manual"] as const).map(m => (
                    <button key={m} onClick={() => setRate({ ...rate, mode: m })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize ${rate.mode === m ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-slate-700">Manual Rate (1 USDT = ? INR)</Label>
                <Input type="number" min={0} step="0.01" value={rate.rate}
                  disabled={rate.mode === "auto"}
                  onChange={(e) => setRate({ ...rate, rate: Number(e.target.value) })}/>
              </div>
              <div>
                <Label className="text-slate-700">Live Market Rate</Label>
                <div className="h-10 rounded-md border border-slate-200 px-3 flex items-center text-sm text-slate-900">
                  1 USDT ≈ ₹{liveRate.toFixed(2)}
                </div>
              </div>
            </div>
            <Button onClick={saveRate} disabled={saving} className="mt-3 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save Rate</>}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBonusManage;
