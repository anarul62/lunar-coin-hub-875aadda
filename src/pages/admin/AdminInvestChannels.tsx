import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Settings, Pencil } from "lucide-react";

type Channel = {
  id: string;
  key: string;
  name: string;
  type: string;
  banner_url: string | null;
  description: string | null;
  enabled: boolean;
  sort_order: number;
};

const TYPES = ["investplan", "crypto", "lottery", "others"];

const AdminInvestChannels = () => {
  const [rows, setRows] = useState<Channel[]>([]);
  const [form, setForm] = useState({ key: "", name: "", type: "investplan", banner_url: "", description: "" });
  const [editing, setEditing] = useState<Channel | null>(null);

  const load = async () => {
    const { data } = await supabase.from("invest_channels").select("*").order("sort_order");
    setRows((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.key || !form.name) return toast.error("Key and name required");
    const { error } = await supabase.from("invest_channels").insert({
      key: form.key.toLowerCase().trim(),
      name: form.name,
      type: form.type,
      banner_url: form.banner_url || null,
      description: form.description || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Channel added");
    setForm({ key: "", name: "", type: "investplan", banner_url: "", description: "" });
    load();
  };

  const update = async (id: string, patch: Partial<Channel>) => {
    const { error } = await supabase.from("invest_channels").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("invest_channels").update({
      key: editing.key.toLowerCase().trim(),
      name: editing.name,
      type: editing.type,
      banner_url: editing.banner_url || null,
      description: editing.description || null,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Channel updated");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete channel and all its plans?")) return;
    await supabase.from("invest_channels").delete().eq("id", id);
    load();
  };

  return (
    <AdminLayout title="Invest Channels">
      <div className="max-w-4xl space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h2 className="font-semibold">Add New Channel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Key (e.g. gold)" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="border border-slate-200 rounded-md px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input placeholder="Banner image URL" value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} />
            <Input className="sm:col-span-2" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <Button onClick={add}>Add Channel</Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {rows.map((r) => (
            <div key={r.id} className="p-3 flex items-center gap-2 flex-wrap">
              {r.banner_url ? <img src={r.banner_url} className="h-14 w-24 object-cover rounded" /> : <div className="h-14 w-24 bg-slate-100 rounded" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.name} <span className="text-xs text-slate-400">/{r.key} · {r.type}</span></p>
                {r.description && <p className="text-xs text-slate-500 truncate">{r.description}</p>}
              </div>
              <Input className="w-16" type="number" value={r.sort_order} onChange={(e) => update(r.id, { sort_order: Number(e.target.value) })} />
              <Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} />
              <Button variant="outline" size="sm" onClick={() => setEditing(r)}><Pencil className="h-4 w-4" /></Button>
              <Link to={`/admin/invest-plans?channel=${r.id}`}>
                <Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
            </div>
          ))}
          {rows.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No channels yet</div>}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Channel</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input placeholder="Key" value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} />
              <Input placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <select className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <Input placeholder="Banner image URL" value={editing.banner_url || ""} onChange={(e) => setEditing({ ...editing, banner_url: e.target.value })} />
              {editing.banner_url && <img src={editing.banner_url} className="w-full h-32 object-cover rounded" />}
              <Input placeholder="Description" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
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

export default AdminInvestChannels;
