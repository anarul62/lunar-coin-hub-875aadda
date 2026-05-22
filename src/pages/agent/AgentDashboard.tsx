import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, LogOut, Users, TrendingUp, DollarSign } from "lucide-react";

const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, totalDeposit: 0, todayDeposit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    if (localStorage.getItem("agent_session_v1") !== "1") { navigate("/agent/login"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/agent/login"); return; }
    const { data: ag } = await (supabase as any).from("agents").select("*").eq("user_id", user.id).maybeSingle();
    if (!ag) { navigate("/agent/login"); return; }
    setAgent(ag);

    const { data: profs } = await (supabase as any).from("profiles")
      .select("user_id, full_name, email, phone, referral_code, balance_usdt, created_at")
      .eq("agent_id", user.id);
    const list = profs || [];
    const ids = list.map((p: any) => p.user_id);

    let deposits: any[] = [];
    if (ids.length) {
      const { data } = await (supabase as any).from("deposits").select("user_id, amount_usdt, created_at, status").in("user_id", ids).eq("status", "approved");
      deposits = data || [];
    }
    const sumBy: Record<string, number> = {};
    let totalDep = 0, todayDep = 0; const tStart = todayStart();
    const depositorSet = new Set<string>();
    deposits.forEach(d => {
      const amt = Number(d.amount_usdt || 0);
      sumBy[d.user_id] = (sumBy[d.user_id] || 0) + amt;
      totalDep += amt;
      if (d.created_at >= tStart) todayDep += amt;
      depositorSet.add(d.user_id);
    });
    setUsers(list.map((p: any) => ({ ...p, deposit_total: sumBy[p.user_id] || 0 })));
    setStats({ total: list.length, active: depositorSet.size, totalDeposit: totalDep, todayDeposit: todayDep });
    setLoading(false);
  })(); }, [navigate]);

  const logout = async () => {
    localStorage.removeItem("agent_session_v1");
    await supabase.auth.signOut();
    navigate("/agent/login");
  };

  const copyCode = () => {
    if (!agent) return;
    navigator.clipboard.writeText(agent.agent_code);
    toast.success("Refcode copied");
  };

  const copyLink = () => {
    if (!agent) return;
    const link = `${window.location.origin}/register?ref=${agent.agent_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Welcome, {agent?.name || agent?.email}</h1>
            <p className="text-xs text-slate-500">Agent Panel</p>
          </div>
          <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-1"/>Logout</Button>
        </div>

        <Card className="p-5 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
          <p className="text-xs opacity-80">Your Agent Refcode</p>
          <div className="flex items-center justify-between mt-1">
            <h2 className="text-3xl font-bold font-mono tracking-wider">{agent?.agent_code}</h2>
            <div className="flex gap-2">
              <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 rounded-lg p-2"><Copy className="h-4 w-4"/></button>
            </div>
          </div>
          <Button onClick={copyLink} className="mt-3 bg-white text-emerald-700 hover:bg-white/90 w-full">Copy Invite Link</Button>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4"><Users className="h-5 w-5 text-emerald-600 mb-2"/><p className="text-xs text-slate-500">Total Invited</p><p className="text-2xl font-bold">{stats.total}</p></Card>
          <Card className="p-4"><TrendingUp className="h-5 w-5 text-emerald-600 mb-2"/><p className="text-xs text-slate-500">Active (Deposited)</p><p className="text-2xl font-bold">{stats.active}</p></Card>
          <Card className="p-4"><DollarSign className="h-5 w-5 text-emerald-600 mb-2"/><p className="text-xs text-slate-500">Today Deposit</p><p className="text-2xl font-bold">{stats.todayDeposit.toFixed(2)}</p></Card>
          <Card className="p-4"><DollarSign className="h-5 w-5 text-emerald-600 mb-2"/><p className="text-xs text-slate-500">Total Deposit</p><p className="text-2xl font-bold">{stats.totalDeposit.toFixed(2)}</p></Card>
        </div>

        <Card className="p-5">
          <h2 className="font-semibold mb-4">Your Downline ({users.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 border-b">
                <tr><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Refcode</th><th>Deposit</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} className="border-b">
                    <td className="py-2">{u.full_name || "-"}</td>
                    <td>{u.email || "-"}</td>
                    <td>{u.phone || "-"}</td>
                    <td className="font-mono">{u.referral_code || "-"}</td>
                    <td className={u.deposit_total>0?"text-emerald-600 font-medium":""}>{u.deposit_total.toFixed(2)}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {users.length===0 && <tr><td colSpan={6} className="py-6 text-center text-slate-400">No users invited yet. Share your refcode!</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default AgentDashboard;
