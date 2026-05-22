import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Agent = {
  id: string;
  user_id: string;
  agent_code: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
};

const randCode = () => "AG" + Math.random().toString(36).slice(2, 8).toUpperCase();

const AdminAddAgent = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", agent_code: randCode() });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from("agents").select("*").order("created_at", { ascending: false });
    setAgents(data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.agent_code) { toast.error("Email, password & refcode required"); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || ""}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ type: "agent", ...form, agent_code: form.agent_code.toUpperCase() }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(json.error || "Failed"); return; }
    toast.success("Agent created");
    setForm({ name: "", email: "", phone: "", password: "", agent_code: randCode() });
    load();
  };

  const remove = async (a: Agent) => {
    if (!confirm(`Delete agent ${a.agent_code}? This removes the agent record (not the auth user).`)) return;
    const { error } = await (supabase as any).from("agents").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const toggle = async (a: Agent) => {
    const { error } = await (supabase as any).from("agents").update({ active: !a.active }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <AdminLayout title="Add Agent">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Create Agent</h2>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><Label>Agent Refcode *</Label><Input value={form.agent_code} onChange={e=>setForm({...form,agent_code:e.target.value.toUpperCase()})} required /></div>
            <div><Label>Email (Agent ID) *</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></div>
            <div><Label>Password *</Label><Input type="text" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
            <div className="sm:col-span-2"><Button type="submit" disabled={loading}>{loading?"Creating...":"Add Agent"}</Button></div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">All Agents ({agents.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr><th className="py-2">Refcode</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {agents.map(a => (
                  <tr key={a.id} className="border-b">
                    <td className="py-2 font-mono font-semibold">{a.agent_code}</td>
                    <td>{a.name || "-"}</td>
                    <td>{a.email}</td>
                    <td>{a.phone || "-"}</td>
                    <td>
                      <button onClick={()=>toggle(a)} className={`text-xs px-2 py-1 rounded ${a.active?"bg-emerald-100 text-emerald-700":"bg-slate-200 text-slate-600"}`}>
                        {a.active?"Active":"Inactive"}
                      </button>
                    </td>
                    <td>{new Date(a.created_at).toLocaleDateString()}</td>
                    <td><Button size="sm" variant="destructive" onClick={()=>remove(a)}><Trash2 className="h-4 w-4"/></Button></td>
                  </tr>
                ))}
                {agents.length===0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No agents yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminAddAgent;
