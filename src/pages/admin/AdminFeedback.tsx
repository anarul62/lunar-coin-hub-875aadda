import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";

const AdminFeedback = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("user_feedback").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = data || [];
    const ids = list.map((x: any) => x.user_id);
    if (ids.length) {
      const { data: profs } = await (supabase as any).from("profiles").select("user_id, full_name, email, phone").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      list.forEach((x: any) => { x.profile = map[x.user_id]; });
    }
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateItem = (id: string, patch: any) => setItems((arr) => arr.map((x) => x.id === id ? { ...x, ...patch } : x));

  const save = async (item: any) => {
    const { error } = await (supabase as any).from("user_feedback").update({ status: item.status, admin_note: item.admin_note || null }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Feedback updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this feedback?")) return;
    const { error } = await (supabase as any).from("user_feedback").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  if (loading) return <AdminLayout title="Users Feedback"><div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout title="Users Feedback">
      <div className="space-y-3">
        {items.length === 0 && <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">No feedback yet</div>}
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{item.profile?.full_name || item.profile?.email || "User"}</p>
                <p className="text-xs text-slate-500">{item.profile?.phone || item.user_id} · {new Date(item.created_at).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap border-l-2 border-emerald-500 pl-3">{item.message}</p>
            <div className="grid md:grid-cols-4 gap-2">
              <Input value={item.status} onChange={(e) => updateItem(item.id, { status: e.target.value })} placeholder="new / reviewed" />
              <Textarea className="md:col-span-2" rows={2} value={item.admin_note || ""} onChange={(e) => updateItem(item.id, { admin_note: e.target.value })} placeholder="Admin note" />
              <Button onClick={() => save(item)} className="bg-emerald-600 hover:bg-emerald-700 text-white self-start"><Save className="h-4 w-4 mr-1" /> Save</Button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;