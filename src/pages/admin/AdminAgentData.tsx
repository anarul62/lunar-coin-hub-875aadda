import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

type Row = {
  agent_id: string;
  agent_code: string;
  name: string | null;
  email: string | null;
  users: number;
  deposit_total: number;
  deposit_today: number;
  withdraw_total: number;
};

const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };

const AdminAgentData = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailUsers, setDetailUsers] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data: agents } = await (supabase as any).from("agents").select("user_id, agent_code, name, email");
    const list = agents || [];
    const tStart = todayStart();
    const out: Row[] = [];
    for (const a of list) {
      const { data: profs } = await (supabase as any).from("profiles").select("user_id").eq("agent_id", a.user_id);
      const ids = (profs || []).map((p: any) => p.user_id);
      let dTotal = 0, dToday = 0, wTotal = 0;
      if (ids.length) {
        const { data: deps } = await (supabase as any).from("deposits").select("amount_usdt, created_at, status").in("user_id", ids).eq("status", "approved");
        (deps || []).forEach((d: any) => {
          dTotal += Number(d.amount_usdt || 0);
          if (d.created_at >= tStart) dToday += Number(d.amount_usdt || 0);
        });
        const { data: wds } = await (supabase as any).from("withdrawals").select("amount_usdt, status").in("user_id", ids).eq("status", "approved");
        (wds || []).forEach((w: any) => { wTotal += Number(w.amount_usdt || 0); });
      }
      out.push({ agent_id: a.user_id, agent_code: a.agent_code, name: a.name, email: a.email, users: ids.length, deposit_total: dTotal, deposit_today: dToday, withdraw_total: wTotal });
    }
    setRows(out);
    setLoading(false);
  })(); }, []);

  const openDetails = async (agentUserId: string) => {
    setOpenId(agentUserId);
    const { data: profs } = await (supabase as any).from("profiles")
      .select("user_id, full_name, email, phone, referral_code, balance_usdt, created_at")
      .eq("agent_id", agentUserId);
    const list = profs || [];
    const ids = list.map((p: any) => p.user_id);
    let deps: any[] = [];
    if (ids.length) {
      const { data } = await (supabase as any).from("deposits").select("user_id, amount_usdt, status").in("user_id", ids).eq("status", "approved");
      deps = data || [];
    }
    const sumBy: Record<string, number> = {};
    deps.forEach(d => { sumBy[d.user_id] = (sumBy[d.user_id] || 0) + Number(d.amount_usdt || 0); });
    setDetailUsers(list.map((p: any) => ({ ...p, deposit_total: sumBy[p.user_id] || 0 })));
  };

  return (
    <AdminLayout title="Agent Data">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Agent Performance</h2>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b">
                  <tr><th className="py-2">Refcode</th><th>Name</th><th>Email</th><th>Users</th><th>Today Deposit</th><th>Total Deposit</th><th>Total Withdraw</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.agent_id} className="border-b">
                      <td className="py-2 font-mono font-semibold">{r.agent_code}</td>
                      <td>{r.name || "-"}</td>
                      <td>{r.email}</td>
                      <td>{r.users}</td>
                      <td className="text-emerald-600">{r.deposit_today.toFixed(2)}</td>
                      <td>{r.deposit_total.toFixed(2)}</td>
                      <td>{r.withdraw_total.toFixed(2)}</td>
                      <td><button className="text-emerald-600 text-xs underline" onClick={()=>openDetails(r.agent_id)}>View Users</button></td>
                    </tr>
                  ))}
                  {rows.length===0 && <tr><td colSpan={8} className="py-6 text-center text-slate-400">No agents</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {openId && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Downline Users</h2>
              <button onClick={()=>{setOpenId(null);setDetailUsers([]);}} className="text-sm text-slate-500">Close</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b">
                  <tr><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Refcode</th><th>Balance</th><th>Deposit Total</th><th>Joined</th></tr>
                </thead>
                <tbody>
                  {detailUsers.map(u => (
                    <tr key={u.user_id} className="border-b">
                      <td className="py-2">{u.full_name || "-"}</td>
                      <td>{u.email || "-"}</td>
                      <td>{u.phone || "-"}</td>
                      <td className="font-mono">{u.referral_code || "-"}</td>
                      <td>{Number(u.balance_usdt).toFixed(2)}</td>
                      <td className="text-emerald-600">{u.deposit_total.toFixed(2)}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {detailUsers.length===0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">No users under this agent</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};
export default AdminAgentData;
