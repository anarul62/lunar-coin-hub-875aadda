import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Power } from "lucide-react";

type Tier = { id: string; min_deposit_usdt: number; bonus_usdt: number; active: boolean };

const AdminDepositBonus = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ min: "", bonus: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("deposit_bonus_tiers").select("*").order("min_deposit_usdt", { ascending: true });
    setTiers((data as Tier[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const min = Number(form.min), bonus = Number(form.bonus);
    if (!(min > 0) || !(bonus >= 0)) return toast({ title: "Enter valid amounts", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.from("deposit_bonus_tiers").insert({ min_deposit_usdt: min, bonus_usdt: bonus });
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setForm({ min: "", bonus: "" });
    toast({ title: "Tier added" }); load();
  };
  const toggle = async (t: Tier) => {
    await supabase.from("deposit_bonus_tiers").update({ active: !t.active }).eq("id", t.id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("deposit_bonus_tiers").delete().eq("id", id);
    load();
  };

  return (
    <AdminLayout title="Member Deposit Bonus">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white border border-slate-200 p-5 md:col-span-1">
          <h2 className="font-semibold text-slate-900 mb-3">Add Deposit Tier</h2>
          <div className="space-y-3">
            <div>
              <Label>Min Deposit (USDT)</Label>
              <Input type="number" min={0} step="0.01" value={form.min} onChange={e => setForm(f => ({ ...f, min: e.target.value }))} placeholder="e.g. 10"/>
            </div>
            <div>
              <Label>Bonus (USDT)</Label>
              <Input type="number" min={0} step="0.01" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} placeholder="e.g. 1"/>
            </div>
            <Button onClick={add} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Plus className="h-4 w-4 mr-1"/> Add Tier</>}
            </Button>
            <p className="text-xs text-slate-500">User deposits ≥ Min Deposit → receives the Bonus.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-5 md:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-3">Active Tiers</h2>
          {loading ? <Loader2 className="animate-spin mx-auto"/> : tiers.length === 0 ? (
            <p className="text-sm text-slate-500">No tiers configured.</p>
          ) : (
            <div className="space-y-2">
              {tiers.map(t => (
                <div key={t.id} className={`flex items-center justify-between rounded-lg border p-3 ${t.active ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50"}`}>
                  <div className="text-sm">
                    <span className="font-semibold">Deposit ≥ {t.min_deposit_usdt} USDT</span>
                    <span className="text-slate-500"> → bonus </span>
                    <span className="font-semibold text-emerald-700">{t.bonus_usdt} USDT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggle(t)} className={`p-2 rounded-md ${t.active ? "text-emerald-600 hover:bg-emerald-100" : "text-slate-400 hover:bg-slate-100"}`}><Power className="h-4 w-4"/></button>
                    <button onClick={() => remove(t.id)} className="p-2 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDepositBonus;
