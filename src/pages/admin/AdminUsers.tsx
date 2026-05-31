import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Eye, Ban, CheckCircle2, Trash2, Pencil, ShieldCheck, ShieldAlert, Loader2, KeyRound, EyeOff } from "lucide-react";

type Profile = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  invitation_code: string | null;
  referral_code: string | null;
  balance_usdt: number;
  blocked: boolean;
  created_at: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [kycMap, setKycMap] = useState<Record<string, string>>({});
  const [pwMap, setPwMap] = useState<Record<string, string>>({});
  const [pwShow, setPwShow] = useState<Record<string, boolean>>({});
  const [pwEdit, setPwEdit] = useState<{ uid: string; val: string } | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [editBal, setEditBal] = useState<{ uid: string; val: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(2000);
    const list = (data as Profile[]) || [];
    setUsers(list);
    const { data: kyc } = await supabase.from("kyc_requests").select("user_id,status");
    const m: Record<string, string> = {};
    (kyc || []).forEach((k: any) => { m[k.user_id] = k.status; });
    setKycMap(m);
    const { data: pws } = await (supabase as any).from("user_passwords").select("user_id,password");
    const pm: Record<string, string> = {};
    (pws || []).forEach((p: any) => { pm[p.user_id] = p.password; });
    setPwMap(pm);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return users;
    return users.filter(u =>
      (u.phone || "").toLowerCase().includes(n) ||
      (u.email || "").toLowerCase().includes(n) ||
      (u.full_name || "").toLowerCase().includes(n) ||
      (u.referral_code || "").toLowerCase().includes(n) ||
      (u.invitation_code || "").toLowerCase().includes(n)
    );
  }, [users, q]);

  const saveBalance = async () => {
    if (!editBal) return;
    const v = Number(editBal.val);
    if (Number.isNaN(v) || v < 0) return toast({ title: "Invalid amount", variant: "destructive" });
    const { error } = await supabase.from("profiles").update({ balance_usdt: v }).eq("user_id", editBal.uid);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Balance updated" });
    setEditBal(null);
    load();
  };

  const toggleBlock = async (u: Profile) => {
    if (!confirm(`${u.blocked ? "Unblock" : "Block"} this user?`)) return;
    const { error } = await supabase.from("profiles").update({ blocked: !u.blocked }).eq("user_id", u.user_id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: u.blocked ? "User unblocked" : "User blocked" });
    load();
  };

  const removeUser = async (u: Profile) => {
    if (!confirm(`Delete profile for ${u.full_name || u.phone || u.email}? This removes their app data.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("user_id", u.user_id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "User deleted" });
    load();
  };

  const savePassword = async () => {
    if (!pwEdit) return;
    if (pwEdit.val.length < 6) return toast({ title: "Password must be at least 6 chars", variant: "destructive" });
    const { error } = await supabase.functions.invoke("admin-update-user-password", {
      body: { user_id: pwEdit.uid, password: pwEdit.val },
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Password updated" });
    setPwEdit(null);
    load();
  };

  return (
    <AdminLayout title="Manage Users">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative mb-4">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input placeholder="Search by ref code, phone, email, name, invite code..." value={q} onChange={e => setQ(e.target.value)} className="pl-9"/>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Ref Code</th>
                  <th className="p-3 font-medium">Invite</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Balance</th>
                  <th className="p-3 font-medium">Password</th>
                  <th className="p-3 font-medium">KYC</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const kyc = kycMap[u.user_id];
                  return (
                    <tr key={u.user_id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 whitespace-nowrap">{u.full_name || "-"}</td>
                      <td className="p-3 whitespace-nowrap">{u.phone || "-"}</td>
                      <td className="p-3 whitespace-nowrap text-xs">{u.email || "-"}</td>
                      <td className="p-3 font-mono text-xs text-violet-600">{u.referral_code || "-"}</td>
                      <td className="p-3 font-mono text-xs text-slate-500">{u.invitation_code || "-"}</td>
                      <td className="p-3 text-slate-500 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold">₮ {Number(u.balance_usdt).toFixed(2)}</span>
                          <button onClick={() => setEditBal({ uid: u.user_id, val: String(u.balance_usdt) })}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"><Pencil className="h-3 w-3"/></button>
                        </div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-slate-700">
                            {pwMap[u.user_id] ? (pwShow[u.user_id] ? pwMap[u.user_id] : "•".repeat(Math.min(8, pwMap[u.user_id].length))) : "—"}
                          </span>
                          {pwMap[u.user_id] && (
                            <button onClick={() => setPwShow(s => ({ ...s, [u.user_id]: !s[u.user_id] }))}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500">
                              {pwShow[u.user_id] ? <EyeOff className="h-3 w-3"/> : <Eye className="h-3 w-3"/>}
                            </button>
                          )}
                          <button onClick={() => setPwEdit({ uid: u.user_id, val: "" })}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Edit password">
                            <KeyRound className="h-3 w-3"/>
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        {kyc === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700"><ShieldCheck className="h-3 w-3"/>Yes</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600"><ShieldAlert className="h-3 w-3"/>No</span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.blocked
                          ? <span className="px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700">Blocked</span>
                          : <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">Active</span>}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/users/${u.user_id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700">
                            <Eye className="h-3 w-3"/>View
                          </Link>
                          <button onClick={() => toggleBlock(u)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-white ${u.blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                            {u.blocked ? <><CheckCircle2 className="h-3 w-3"/>Unblock</> : <><Ban className="h-3 w-3"/>Block</>}
                          </button>
                          <button onClick={() => removeUser(u)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700">
                            <Trash2 className="h-3 w-3"/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={11} className="p-8 text-center text-slate-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editBal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditBal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Edit balance (USDT)</h3>
            <Input type="number" step="0.0001" value={editBal.val} onChange={e => setEditBal({ ...editBal, val: e.target.value })}/>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setEditBal(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">Cancel</button>
              <button onClick={saveBalance} className="px-3 py-2 text-sm bg-sky-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}

      {pwEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setPwEdit(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-xl w-full max-w-sm p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Set new password</h3>
            <Input type="text" placeholder="Min 6 characters" value={pwEdit.val} onChange={e => setPwEdit({ ...pwEdit, val: e.target.value })}/>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setPwEdit(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">Cancel</button>
              <button onClick={savePassword} className="px-3 py-2 text-sm bg-sky-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
