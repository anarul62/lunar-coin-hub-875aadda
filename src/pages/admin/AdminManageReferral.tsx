import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

type Section = { enabled: boolean; levels: number[] };
type Cfg = { deposit: Section; invest: Section; interest: Section };

const DEFAULT: Cfg = {
  deposit: { enabled: true, levels: [5, 3, 1] },
  invest: { enabled: true, levels: [3, 2, 1] },
  interest: { enabled: true, levels: [2, 1, 0.5] },
};

const AdminManageReferral = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<Cfg>(DEFAULT);
  const [numInputs, setNumInputs] = useState<Record<string, string>>({ deposit: "", invest: "", interest: "" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("value").eq("key", "commission_levels").maybeSingle();
    if (data?.value) setCfg({ ...DEFAULT, ...(data.value as any) });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert({ key: "commission_levels", value: cfg as any, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
  };

  const updateLevel = (key: keyof Cfg, i: number, v: number) => {
    const ls = [...cfg[key].levels]; ls[i] = v;
    setCfg({ ...cfg, [key]: { ...cfg[key], levels: ls } });
  };
  const generate = (key: keyof Cfg, n: number) => {
    if (n < 1 || n > 20) return;
    const ls = Array.from({ length: n }, (_, i) => cfg[key].levels[i] ?? 0);
    setCfg({ ...cfg, [key]: { ...cfg[key], levels: ls } });
  };
  const removeLevel = (key: keyof Cfg, i: number) => {
    const ls = cfg[key].levels.filter((_, j) => j !== i);
    setCfg({ ...cfg, [key]: { ...cfg[key], levels: ls } });
  };

  const SectionCard = ({ name, k, color }: { name: string; k: keyof Cfg; color: string }) => (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
      <div className={`px-4 py-3 ${color} text-white flex items-center justify-between`}>
        <h3 className="font-semibold">{name}</h3>
        <button onClick={() => setCfg({ ...cfg, [k]: { ...cfg[k], enabled: !cfg[k].enabled } })}
          className={`text-xs px-3 py-1.5 rounded ${cfg[k].enabled ? "bg-rose-500" : "bg-emerald-500"}`}>
          {cfg[k].enabled ? "Disable Now" : "Enable Now"}
        </button>
      </div>
      <div className="p-4 space-y-2">
        {cfg[k].levels.map((lv, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-sm font-semibold text-slate-700">Level {i + 1}</span>
            <Input type="number" step="0.01" min={0} value={lv} onChange={e => updateLevel(k, i, Number(e.target.value))} className="flex-1"/>
            <span className="text-slate-500 text-sm">%</span>
            <button onClick={() => removeLevel(k, i)} className="text-red-500"><Trash2 className="h-4 w-4"/></button>
          </div>
        ))}
        <div className="pt-3 mt-2 border-t border-slate-100">
          <p className="text-center text-xs text-slate-500 mb-2">Update Setting</p>
          <p className="text-xs text-slate-700 mb-1 font-medium">Number of Level</p>
          <div className="flex gap-2">
            <Input value={numInputs[k]} onChange={e => setNumInputs({ ...numInputs, [k]: e.target.value })} placeholder="Type a number & hit ENTER"
              onKeyDown={e => { if (e.key === "Enter") { generate(k, Number(numInputs[k])); } }}/>
            <Button onClick={() => generate(k, Number(numInputs[k]))} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-1"/> Generate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Manage Referral">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
        <div className="max-w-2xl space-y-5">
          <SectionCard name="Deposit Commission" k="deposit" color="bg-indigo-600"/>
          <SectionCard name="Invest Commission" k="invest" color="bg-indigo-600"/>
          <SectionCard name="Interest Commission" k="interest" color="bg-indigo-600"/>

          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save All Settings</>}
          </Button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminManageReferral;
