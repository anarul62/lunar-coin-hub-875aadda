import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

type Channel = { id: string; name: string; key: string; type: string };

const empty = {
  channel_id: "",
  name: "",
  game_image_url: "",
  total_tickets: 100,
  ticket_price: 100,
  currency: "XCOIN",
  xcoin_bonus: 0,
  prize_mode: "auto" as "auto" | "manual",
  pct_first: 30,
  pct_second: 20,
  pct_third: 10,
  pct_4_11: 3.75,
  pct_company: 10,
  pct_4_11_enabled: true,
  duration_minutes: 60,
};

const AdminLotteryPlans = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data: chs } = await supabase.from("invest_channels").select("id,key,name,type").eq("type", "lottery");
    setChannels((chs as any) || []);
    const { data } = await supabase.from("lottery_plans").select("*").order("created_at", { ascending: false });
    setPlans((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.channel_id || !form.name) return toast.error("Channel and name required");
    if (!form.total_tickets || form.total_tickets < 1) return toast.error("Total tickets must be at least 1");
    if (!form.ticket_price || form.ticket_price <= 0) return toast.error("Ticket price required");
    const draw_at = new Date(Date.now() + form.duration_minutes * 60_000).toISOString();
    const { error } = await supabase.from("lottery_plans").insert({ ...form, draw_at, image_url: form.game_image_url } as any);
    if (error) return toast.error(error.message);
    toast.success("Lottery plan added (tickets seeded)");
    setForm({ ...empty });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete plan + tickets?")) return;
    await supabase.from("lottery_plans").delete().eq("id", id);
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { id, created_at, updated_at, ...patch } = editing;
    const { error } = await supabase.from("lottery_plans").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  return (
    <AdminLayout title="Lottery Plans">
      <div className="max-w-4xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h2 className="font-semibold">Add Lottery Plan</h2>
          {channels.length === 0 && (
            <p className="text-xs text-amber-600">First create an invest channel with type "lottery" in /admin/invest-channels.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Channel (lottery type)</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.channel_id} onChange={(e) => setForm({ ...form, channel_id: e.target.value })}>
                <option value="">-- choose --</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Input placeholder="Name (e.g. Snakes & Ladders No.1)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Game image URL" value={form.game_image_url} onChange={(e) => setForm({ ...form, game_image_url: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Total tickets" value={form.total_tickets} onChange={(e) => setForm({ ...form, total_tickets: Number(e.target.value) })} />
              <Input type="number" placeholder="Ticket price" value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option>XCOIN</option><option>BDT</option><option>USDT</option><option>INR</option>
              </select>
              <Input type="number" placeholder="X coin bonus (optional)" value={form.xcoin_bonus} onChange={(e) => setForm({ ...form, xcoin_bonus: Number(e.target.value) })} />
            </div>
            <Input type="number" placeholder="Duration (minutes till draw)" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            <div>
              <label className="text-xs text-slate-500">Prize Mode</label>
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.prize_mode} onChange={(e) => {
                const m = e.target.value as "auto" | "manual";
                if (m === "auto") setForm({ ...form, prize_mode: "auto", pct_first: 30, pct_second: 20, pct_third: 10, pct_4_11: 3.75, pct_company: 10 });
                else setForm({ ...form, prize_mode: m });
              }}>
                <option value="auto">Auto (defaults)</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <div><label className="text-xs text-slate-500">1st %</label><Input type="number" value={form.pct_first} onChange={(e) => setForm({ ...form, pct_first: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-slate-500">2nd %</label><Input type="number" value={form.pct_second} onChange={(e) => setForm({ ...form, pct_second: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-slate-500">3rd %</label><Input type="number" value={form.pct_third} onChange={(e) => setForm({ ...form, pct_third: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-slate-500">Company %</label><Input type="number" value={form.pct_company} onChange={(e) => setForm({ ...form, pct_company: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-slate-500">4-11 % (each)</label><Input type="number" value={form.pct_4_11} onChange={(e) => setForm({ ...form, pct_4_11: Number(e.target.value) })} /></div>
              <label className="flex items-end gap-2 text-sm pb-2"><Switch checked={form.pct_4_11_enabled} onCheckedChange={(v) => setForm({ ...form, pct_4_11_enabled: v })} /> 4–11 prizes enabled</label>
            </div>
          </div>
          <Button onClick={add}>Add Plan</Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {plans.map((p) => (
            <div key={p.id} className="p-3 flex items-center gap-3">
              {p.game_image_url ? <img src={p.game_image_url} className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 bg-slate-100 rounded" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {p.total_tickets} tix · {p.ticket_price} {p.currency} · {p.prize_mode} · {p.status} · draws {new Date(p.draw_at).toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
            </div>
          ))}
          {plans.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No lottery plans yet</div>}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Lottery Plan</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-2">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Name" />
              <Input value={editing.game_image_url || ""} onChange={(e) => setEditing({ ...editing, game_image_url: e.target.value })} placeholder="Game image URL" />
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" value={editing.ticket_price} onChange={(e) => setEditing({ ...editing, ticket_price: Number(e.target.value) })} />
                <select className="border border-slate-200 rounded-md px-3 py-2 text-sm" value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option>XCOIN</option><option>BDT</option><option>USDT</option><option>INR</option>
                </select>
              </div>
              <Input type="number" value={editing.xcoin_bonus || 0} onChange={(e) => setEditing({ ...editing, xcoin_bonus: Number(e.target.value) })} placeholder="X coin bonus" />
              <label className="text-xs text-slate-500">Total tickets (increasing seeds new ones)</label>
              <Input type="number" min={1} value={editing.total_tickets} onChange={(e) => setEditing({ ...editing, total_tickets: Number(e.target.value) })} />
              <label className="text-xs text-slate-500">Draw at</label>
              <Input type="datetime-local" value={new Date(editing.draw_at).toISOString().slice(0,16)} onChange={(e) => setEditing({ ...editing, draw_at: new Date(e.target.value).toISOString() })} />
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs text-slate-500">1st %</label><Input type="number" value={editing.pct_first} onChange={(e) => setEditing({ ...editing, pct_first: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-slate-500">2nd %</label><Input type="number" value={editing.pct_second} onChange={(e) => setEditing({ ...editing, pct_second: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-slate-500">3rd %</label><Input type="number" value={editing.pct_third} onChange={(e) => setEditing({ ...editing, pct_third: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-slate-500">Company %</label><Input type="number" value={editing.pct_company} onChange={(e) => setEditing({ ...editing, pct_company: Number(e.target.value) })} /></div>
                <div><label className="text-xs text-slate-500">4-11 %</label><Input type="number" value={editing.pct_4_11} onChange={(e) => setEditing({ ...editing, pct_4_11: Number(e.target.value) })} /></div>
                <label className="flex items-end gap-2 text-sm pb-2"><Switch checked={editing.pct_4_11_enabled} onCheckedChange={(v) => setEditing({ ...editing, pct_4_11_enabled: v })} /> 4–11 on</label>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={editing.enabled} onCheckedChange={(v) => setEditing({ ...editing, enabled: v })} /> Enabled</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminLotteryPlans;
