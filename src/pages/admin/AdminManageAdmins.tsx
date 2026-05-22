import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const FEATURES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Manage Users" },
  { key: "banners", label: "Banners" },
  { key: "kyc", label: "KYC" },
  { key: "deposits", label: "Deposits" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "payment_methods", label: "Payment Methods" },
  { key: "withdraw_methods", label: "Withdraw Methods" },
  { key: "invest_plans", label: "Invest Plans" },
  { key: "invest_channels", label: "Invest Channels" },
  { key: "investments", label: "Investments" },
  { key: "lottery", label: "Lottery" },
  { key: "xcoin", label: "X Coin" },
  { key: "bonus", label: "Bonus & Rewards" },
  { key: "announcements", label: "Announcements" },
  { key: "notifications", label: "Notifications" },
  { key: "seo", label: "SEO" },
  { key: "agents", label: "Agents" },
  { key: "referral", label: "Referral" },
];

const AdminManageAdmins = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", permissions: [] as string[] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await (supabase as any).from("admin_permissions").select("*").order("created_at", { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const toggle = (k: string) => setForm(f => ({ ...f, permissions: f.permissions.includes(k) ? f.permissions.filter(x => x !== k) : [...f.permissions, k] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Email & password required"); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { type: "subadmin", ...form },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed. Please re-login as admin.");
      return;
    }
    toast.success("Sub-admin created");
    setForm({ name: "", email: "", password: "", permissions: [] });
    load();
  };

  const updatePerms = async (row: any, perms: string[]) => {
    const { error } = await (supabase as any).from("admin_permissions").update({ permissions: perms }).eq("id", row.id);
    if (error) toast.error(error.message); else { toast.success("Updated"); load(); }
  };

  const remove = async (row: any) => {
    if (!confirm("Delete this sub-admin's permissions row?")) return;
    await (supabase as any).from("user_roles").delete().eq("user_id", row.user_id).eq("role", "subadmin");
    await (supabase as any).from("admin_permissions").delete().eq("id", row.id);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout title="Manage Admins">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Add Sub-Admin</h2>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
              <div><Label>Password *</Label><Input type="text" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></div>
            </div>
            <div>
              <Label className="mb-2 block">Allowed Features</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEATURES.map(f => (
                  <label key={f.key} className="flex items-center gap-2 text-sm bg-slate-50 rounded px-2 py-1.5">
                    <Checkbox checked={form.permissions.includes(f.key)} onCheckedChange={()=>toggle(f.key)} />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading}>{loading?"Creating...":"Create Sub-Admin"}</Button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Sub-Admins ({rows.length})</h2>
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{r.name || r.user_id.slice(0,8)}</div>
                    <div className="text-xs text-slate-500">{r.user_id}</div>
                  </div>
                  <Button size="sm" variant="destructive" onClick={()=>remove(r)}><Trash2 className="h-4 w-4"/></Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FEATURES.map(f => {
                    const has = (r.permissions || []).includes(f.key);
                    return (
                      <label key={f.key} className="flex items-center gap-2 text-xs">
                        <Checkbox checked={has} onCheckedChange={()=>{
                          const next = has ? (r.permissions||[]).filter((x:string)=>x!==f.key) : [...(r.permissions||[]), f.key];
                          updatePerms(r, next);
                        }} />
                        {f.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            {rows.length===0 && <p className="text-center text-slate-400 py-6">No sub-admins yet</p>}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminManageAdmins;
