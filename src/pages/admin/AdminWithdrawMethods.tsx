import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

const AdminWithdrawMethods = () => {
  const [methods, setMethods] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [override, setOverride] = useState<any>({ ref_code: "", need_to_refer: 0, need_to_deposit_usdt: 0, daily_max_times: 3, min_amount: 0, max_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from("withdraw_methods").select("*").order("sort_order"),
      supabase.from("app_settings").select("value").eq("key", "withdraw_settings").maybeSingle(),
    ]);
    setMethods(m || []);
    setSettings(s?.value || { min_amount: 1000, max_amount: 1000000, daily_max_times: 3, window_start: "00:00", window_end: "23:59", need_to_bet: 0, need_to_refer: 0, need_to_deposit_usdt: 0 });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updM = (id: string, patch: any) => setMethods(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m));

  const saveMethod = async (m: any) => {
    setSaving(m.id);
    const { error } = await supabase.from("withdraw_methods").update({
      enabled: m.enabled, charge_type: m.charge_type, charge_value: Number(m.charge_value) || 0,
      charge_currency: m.charge_currency,
    }).eq("id", m.id);
    setSaving(null);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${m.label} saved` });
  };

  const saveSettings = async () => {
    setSaving("settings");
    const { error } = await supabase.from("app_settings").upsert({ key: "withdraw_settings", value: settings, updated_at: new Date().toISOString() });
    setSaving(null);
    if (error) return toast({ title: "Failed", variant: "destructive" });
    toast({ title: "Settings saved" });
  };

  const applyOverride = async () => {
    if (!override.ref_code) return toast({ title: "Enter user ref code", variant: "destructive" });
    const { data: prof } = await supabase.from("profiles").select("user_id, full_name, phone, referral_code").eq("referral_code", override.ref_code.toUpperCase()).maybeSingle();
    if (!prof) return toast({ title: "User not found", variant: "destructive" });
    const { error } = await supabase.from("user_withdraw_limits").upsert({
      user_id: prof.user_id,
      need_to_refer: Number(override.need_to_refer) || 0,
      need_to_deposit_usdt: Number(override.need_to_deposit_usdt) || 0,
      daily_max_times: Number(override.daily_max_times) || 0,
      min_amount: Number(override.min_amount) || 0,
      max_amount: Number(override.max_amount) || 0,
      updated_at: new Date().toISOString(),
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Override applied to ${prof.full_name || prof.phone || prof.referral_code}` });
    loadUsers();
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("user_withdraw_limits").select("*").order("updated_at", { ascending: false }).limit(50);
    if (!data?.length) { setUsers([]); return; }
    const ids = data.map(d => d.user_id);
    const { data: profs } = await supabase.from("profiles").select("user_id, referral_code, full_name, phone").in("user_id", ids);
    setUsers(data.map(d => ({ ...d, profile: profs?.find(p => p.user_id === d.user_id) })));
  };
  useEffect(() => { loadUsers(); }, []);

  return (
    <AdminLayout title="Withdraw Methods & Settings">
      {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div> : (
      <div className="space-y-6 max-w-4xl">
        {/* Methods */}
        <section className="bg-white rounded-xl p-4 border">
          <h2 className="font-bold mb-4">Withdraw Methods</h2>
          <div className="space-y-3">
            {methods.map(m => (
              <div key={m.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                {m.icon_url && <img src={m.icon_url} className="h-10 w-10 object-contain"/>}
                <div className="flex-1 min-w-[140px]">
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-xs text-slate-500">{m.method_key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{m.enabled ? "Enabled" : "Disabled"}</span>
                  <Switch checked={m.enabled} onCheckedChange={v => updM(m.id, { enabled: v })}/>
                </div>
                <select value={m.charge_type} onChange={e => updM(m.id, { charge_type: e.target.value })} className="h-9 rounded border border-slate-300 px-2 text-sm">
                  <option value="percent">Percent %</option>
                  <option value="flat">Flat amount</option>
                </select>
                <Input type="number" step="0.01" className="w-24" value={m.charge_value} onChange={e => updM(m.id, { charge_value: e.target.value })}/>
                <select value={m.charge_currency} onChange={e => updM(m.id, { charge_currency: e.target.value })} className="h-9 rounded border border-slate-300 px-2 text-sm">
                  <option value="INR">INR</option>
                  <option value="BDT">BDT</option>
                  <option value="USDT">USDT</option>
                </select>
                <Button onClick={() => saveMethod(m)} disabled={saving === m.id} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving === m.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/>Save</>}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Global Settings */}
        <section className="bg-white rounded-xl p-4 border">
          <h2 className="font-bold mb-4">Global Withdraw Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              ["min_amount", "Min amount"],
              ["max_amount", "Max amount"],
              ["daily_max_times", "Daily max times"],
              ["need_to_bet", "Need to bet"],
              ["need_to_refer", "Need to refer (#)"],
              ["need_to_deposit_usdt", "Need to deposit (USDT)"],
              ["window_start", "Window start (HH:MM)"],
              ["window_end", "Window end (HH:MM)"],
            ].map(([k, label]) => (
              <div key={k}>
                <Label>{label}</Label>
                <Input value={settings[k] ?? ""} onChange={e => setSettings({ ...settings, [k]: e.target.value })}/>
              </div>
            ))}
          </div>
          <Button onClick={saveSettings} disabled={saving === "settings"} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            {saving === "settings" ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/>Save Settings</>}
          </Button>
        </section>

        {/* Per-user override */}
        <section className="bg-white rounded-xl p-4 border">
          <h2 className="font-bold mb-2">Per-user Override</h2>
          <p className="text-xs text-slate-500 mb-4">Find user by referral code, then set custom limits.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label>User Ref Code</Label>
              <Input value={override.ref_code} onChange={e => setOverride({ ...override, ref_code: e.target.value })}/>
            </div>
            <div><Label>Need to refer</Label><Input type="number" value={override.need_to_refer} onChange={e => setOverride({ ...override, need_to_refer: e.target.value })}/></div>
            <div><Label>Need to deposit USDT</Label><Input type="number" value={override.need_to_deposit_usdt} onChange={e => setOverride({ ...override, need_to_deposit_usdt: e.target.value })}/></div>
            <div><Label>Daily max times</Label><Input type="number" value={override.daily_max_times} onChange={e => setOverride({ ...override, daily_max_times: e.target.value })}/></div>
            <div><Label>Min amount</Label><Input type="number" value={override.min_amount} onChange={e => setOverride({ ...override, min_amount: e.target.value })}/></div>
            <div><Label>Max amount</Label><Input type="number" value={override.max_amount} onChange={e => setOverride({ ...override, max_amount: e.target.value })}/></div>
          </div>
          <Button onClick={applyOverride} className="mt-4 bg-emerald-600 hover:bg-emerald-700">Apply Override</Button>

          <div className="mt-6">
            <h3 className="font-semibold mb-2 text-sm">Active overrides</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs">
                  <tr><th className="p-2 text-left">User</th><th className="p-2">Refer</th><th className="p-2">Deposit</th><th className="p-2">Daily</th><th className="p-2">Min</th><th className="p-2">Max</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id} className="border-t">
                      <td className="p-2">{u.profile?.full_name || u.profile?.phone || u.profile?.referral_code || u.user_id.slice(0,8)}</td>
                      <td className="p-2 text-center">{u.need_to_refer}</td>
                      <td className="p-2 text-center">{u.need_to_deposit_usdt}</td>
                      <td className="p-2 text-center">{u.daily_max_times}</td>
                      <td className="p-2 text-center">{u.min_amount}</td>
                      <td className="p-2 text-center">{u.max_amount}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 p-4">No overrides yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
      )}
    </AdminLayout>
  );
};

export default AdminWithdrawMethods;
