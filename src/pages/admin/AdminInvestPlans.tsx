import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Channel = { id: string; name: string; key: string };
type Plan = any;

const emptyForm = {
  channel_id: "",
  name: "",
  image_url: "",
  interest_type: "percent",
  interest_value: 0,
  interest_period: "day",
  duration_days: 30,
  compound: false,
  featured: false,
  currency: "USDT",
  min_amount: 0,
  max_amount: 0,
};

const AdminInvestPlans = () => {
  const [params, setParams] = useSearchParams();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [rates, setRates] = useState({ usdt_bdt: 120, usdt_inr: 83, usdt_xcoin: 1000 });
  const [form, setForm] = useState({ ...emptyForm });
  const selectedChannel = params.get("channel") || "";

  const loadChannels = async () => {
    const { data } = await supabase.from("invest_channels").select("id,name,key").order("sort_order");
    setChannels((data as any) || []);
  };
  const loadPlans = async (channelId: string) => {
    if (!channelId) return setPlans([]);
    const { data } = await supabase.from("invest_plans").select("*").eq("channel_id", channelId).order("sort_order");
    setPlans((data as any) || []);
  };
  const loadRates = async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "currency_rates").maybeSingle();
    if (data?.value) setRates(data.value as any);
  };

  useEffect(() => { loadChannels(); loadRates(); }, []);
  useEffect(() => { loadPlans(selectedChannel); setForm((f) => ({ ...f, channel_id: selectedChannel })); }, [selectedChannel]);

  const saveRates = async () => {
    const { error } = await supabase.from("app_settings").upsert({ key: "currency_rates", value: rates as any });
    if (error) return toast.error(error.message);
    toast.success("Rates saved");
  };

  const addPlan = async () => {
    if (!form.channel_id || !form.name) return toast.error("Channel and name required");
    const { error } = await supabase.from("invest_plans").insert(form as any);
    if (error) return toast.error(error.message);
    toast.success("Plan added");
    setForm({ ...emptyForm, channel_id: form.channel_id });
    loadPlans(form.channel_id);
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("invest_plans").update(patch).eq("id", id);
    loadPlans(selectedChannel);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete plan?")) return;
    await supabase.from("invest_plans").delete().eq("id", id);
    loadPlans(selectedChannel);
  };

  return (
    <AdminLayout title="Invest Setup">
      <div className="max-w-4xl space-y-6">
        {/* Currency rates */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h2 className="font-semibold">Currency Rates (1 USDT =)</h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-500">BDT</label>
              <Input type="number" value={rates.usdt_bdt} onChange={(e) => setRates({ ...rates, usdt_bdt: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">INR</label>
              <Input type="number" value={rates.usdt_inr} onChange={(e) => setRates({ ...rates, usdt_inr: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">X Coin</label>
              <Input type="number" value={rates.usdt_xcoin} onChange={(e) => setRates({ ...rates, usdt_xcoin: Number(e.target.value) })} />
            </div>
          </div>
          <Button onClick={saveRates} size="sm">Save Rates</Button>
        </div>

        {/* Channel selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <label className="text-xs text-slate-500">Select Channel</label>
          <select
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
            value={selectedChannel}
            onChange={(e) => setParams({ channel: e.target.value })}
          >
            <option value="">-- choose --</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {selectedChannel && (
          <>
            {/* Add plan */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h2 className="font-semibold">Add New Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

                <div>
                  <label className="text-xs text-slate-500">Interest Type</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.interest_type} onChange={(e) => setForm({ ...form, interest_type: e.target.value })}>
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <Input type="number" placeholder="Interest value" value={form.interest_value} onChange={(e) => setForm({ ...form, interest_value: Number(e.target.value) })} />

                <div>
                  <label className="text-xs text-slate-500">Per</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.interest_period} onChange={(e) => setForm({ ...form, interest_period: e.target.value })}>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                <Input type="number" placeholder="Duration (days)" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })} />

                <div>
                  <label className="text-xs text-slate-500">Currency</label>
                  <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    <option>USDT</option><option>XCOIN</option><option>INR</option><option>BDT</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })} />
                  <Input type="number" placeholder="Max" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: Number(e.target.value) })} />
                </div>

                <label className="flex items-center gap-2 text-sm"><Switch checked={form.compound} onCheckedChange={(v) => setForm({ ...form, compound: v })} /> Compound Interest</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} /> Featured</label>
              </div>
              <Button onClick={addPlan}>Add Plan</Button>
            </div>

            {/* Existing plans */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y">
              {plans.map((p) => (
                <div key={p.id} className="p-3 flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url} className="h-12 w-12 object-cover rounded" /> : <div className="h-12 w-12 bg-slate-100 rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.name} {p.featured && <span className="text-amber-500 text-xs">★</span>}</p>
                    <p className="text-xs text-slate-500">
                      {p.interest_value}{p.interest_type === "percent" ? "%" : ` ${p.currency}`} / {p.interest_period} · {p.duration_days}d · {p.currency} {p.min_amount}–{p.max_amount}
                      {p.compound ? " · compound" : ""}
                    </p>
                  </div>
                  <Switch checked={p.enabled} onCheckedChange={(v) => update(p.id, { enabled: v })} />
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              ))}
              {plans.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No plans yet</div>}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInvestPlans;
