import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, ShieldOff, Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, TrendingUp, Trophy, Target } from "lucide-react";

const Stat = ({ label, value, icon: Icon, tone = "blue", sub }: any) => {
  const tones: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    cyan: "bg-cyan-50 text-cyan-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-slate-500">{label}</span>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-4 w-4"/>
        </div>
      </div>
      <div className="text-xl font-bold text-slate-900 truncate">{value}</div>
      <span className="text-[11px] text-slate-400">{sub}</span>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, banned: 0 });

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setStats({ total: count || 0, active: count || 0, banned: 0 });
    })();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Users" value={stats.total} icon={Users} tone="blue" sub="All registered users"/>
        <Stat label="Active Users" value={stats.active} icon={UserCheck} tone="green" sub="Active accounts"/>
        <Stat label="Banned Users" value={stats.banned} icon={ShieldOff} tone="red" sub="Suspended accounts"/>
        <Stat label="Wallet Balance" value="₹0.00" icon={Wallet} tone="cyan" sub="Total balance"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Target className="h-4 w-4 text-emerald-600"/>Profit Distribution</h3>
          <div className="flex justify-center py-6">
            <div className="h-36 w-36 rounded-full border-[14px] border-emerald-500 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-slate-500">Profit Today</div>
                <div className="text-emerald-600 font-bold text-lg">₹0.00</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Profit</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"/>Loss</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"/>Commission</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600"/>Deposit vs Withdraw (Last 7 Days)</h3>
          <div className="h-56 flex items-end justify-around gap-2 pt-4">
            {[
              [60, 10], [40, 30], [20, 15], [80, 70], [25, 35], [55, 20], [30, 25],
            ].map(([d, w], i) => (
              <div key={i} className="flex-1 flex items-end gap-1 h-full">
                <div className="flex-1 bg-emerald-500 rounded-t" style={{ height: `${d}%` }}/>
                <div className="flex-1 bg-red-500 rounded-t" style={{ height: `${w}%` }}/>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 text-xs mt-3">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"/>Deposit</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"/>Withdraw</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Stat label="Today's Join" value={0} icon={Users} tone="blue" sub="New registrations"/>
        <Stat label="Today's Recharge" value="₹0" icon={ArrowDownToLine} tone="green" sub="Total recharge today"/>
        <Stat label="Today's Withdrawal" value="₹0" icon={ArrowUpFromLine} tone="amber" sub="Total withdraw today"/>
        <Stat label="User Balance" value="₹0.00" icon={Wallet} tone="cyan" sub="Total user wallet"/>

        <Stat label="Pending Recharge" value="₹0" icon={Clock} tone="amber" sub="Awaiting approval"/>
        <Stat label="Success Recharge" value="₹0" icon={CheckCircle2} tone="green" sub="Completed recharges"/>
        <Stat label="Total Withdrawal" value="₹0" icon={ArrowUpFromLine} tone="amber" sub="Total withdrawn amount"/>
        <Stat label="Withdrawal Requests" value="0" icon={Clock} tone="red" sub="Pending withdrawals"/>

        <Stat label="Today's Total Invest" value="₹0.00" icon={TrendingUp} tone="blue" sub="Total invests placed"/>
        <Stat label="Today's Total Return" value="₹0.00" icon={Trophy} tone="green" sub="Total returns paid"/>
        <Stat label="Today's Profit" value="₹0.00" icon={Target} tone="violet" sub="Net profit today"/>
        <Stat label="Total Active Users" value={stats.active} icon={UserCheck} tone="green" sub="All active users"/>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">© 2026 · Powered by Admin Panel</p>
    </AdminLayout>
  );
};

export default AdminDashboard;
