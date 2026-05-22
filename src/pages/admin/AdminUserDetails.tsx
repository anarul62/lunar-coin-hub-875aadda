import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Users, Loader2 } from "lucide-react";

const AdminUserDetails = () => {
  const { userId = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [refDeposits, setRefDeposits] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: d }, { data: w }, { data: inv }, { data: refs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("user_investments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id,full_name,phone,email,referral_code,balance_usdt,created_at").eq("referred_by", userId),
      ]);
      setProfile(p);
      setDeposits(d || []);
      setWithdrawals(w || []);
      setInvestments(inv || []);
      setReferrals(refs || []);

      const refIds = (refs || []).map((r: any) => r.user_id);
      if (refIds.length) {
        const { data: refDep } = await supabase.from("deposits").select("user_id,amount_usdt,status").in("user_id", refIds).eq("status", "completed");
        const map: Record<string, number> = {};
        (refDep || []).forEach((x: any) => {
          map[x.user_id] = (map[x.user_id] || 0) + Number(x.amount_usdt || 0);
        });
        setRefDeposits(map);
      }
      setLoading(false);
    })();
  }, [userId]);

  const stats = useMemo(() => {
    const totalDep = deposits.filter(d => d.status === "completed").reduce((s, d) => s + Number(d.amount_usdt || 0), 0);
    const totalWd  = withdrawals.filter(w => w.status === "approved" || w.status === "completed").reduce((s, w) => s + Number(w.amount_usdt || 0), 0);
    const totalProfit = investments.reduce((s, i) => s + Number(i.profit || 0), 0);
    const activePlans = investments.filter(i => i.status === "active").length;
    return { totalDep, totalWd, totalProfit, activePlans };
  }, [deposits, withdrawals, investments]);

  if (loading) return <AdminLayout title="User Details"><div className="py-20 flex justify-center"><Loader2 className="animate-spin"/></div></AdminLayout>;
  if (!profile) return <AdminLayout title="User Details"><div className="p-6 text-slate-500">User not found.</div></AdminLayout>;

  return (
    <AdminLayout title="User Details">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-3">
        <ArrowLeft className="h-4 w-4"/> Back to Users
      </Link>

      {/* Profile header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white rounded-xl p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xl font-bold">{profile.full_name || "Unnamed user"}</div>
            <div className="text-sm opacity-80 mt-1">{profile.email || "—"} · {profile.phone || "—"}</div>
            <div className="text-xs opacity-70 mt-2">
              Ref Code: <span className="font-mono text-amber-300">{profile.referral_code}</span>
              {profile.invitation_code && <> · Invited by: <span className="font-mono">{profile.invitation_code}</span></>}
            </div>
            <div className="text-xs opacity-70">Joined {new Date(profile.created_at).toLocaleDateString()}</div>
          </div>
          <div className="text-right">
            <div className="text-xs opacity-80">Current Balance</div>
            <div className="text-3xl font-bold">₮ {Number(profile.balance_usdt).toFixed(2)}</div>
            {profile.blocked && <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-rose-500">BLOCKED</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat icon={<ArrowDownToLine className="h-5 w-5"/>} label="Total Deposit" value={`₮ ${stats.totalDep.toFixed(2)}`} color="from-emerald-500 to-emerald-600"/>
        <Stat icon={<ArrowUpFromLine className="h-5 w-5"/>} label="Total Withdraw" value={`₮ ${stats.totalWd.toFixed(2)}`} color="from-rose-500 to-rose-600"/>
        <Stat icon={<TrendingUp className="h-5 w-5"/>} label="Total Profit" value={`₮ ${stats.totalProfit.toFixed(2)}`} color="from-amber-500 to-amber-600"/>
        <Stat icon={<Users className="h-5 w-5"/>} label="Referrals" value={referrals.length} color="from-violet-500 to-violet-600"/>
      </div>

      {/* Active / All Plans */}
      <Section title={`Investment Plans (${investments.length}) · Active: ${stats.activePlans}`}>
        <Table headers={["Plan", "Amount", "Profit", "Duration", "Status", "Started", "Ends"]}>
          {investments.map(i => (
            <tr key={i.id} className="border-b border-slate-100">
              <td className="py-2 pr-3">{i.plan_name}{i.channel_name ? <span className="text-slate-400 text-xs"> · {i.channel_name}</span> : null}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{Number(i.amount).toFixed(2)} {i.currency}</td>
              <td className="py-2 pr-3 text-emerald-600 whitespace-nowrap">+{Number(i.profit || 0).toFixed(2)}</td>
              <td className="py-2 pr-3">{i.duration_days}d</td>
              <td className="py-2 pr-3"><span className={`px-2 py-0.5 rounded text-xs ${i.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{i.status}</span></td>
              <td className="py-2 pr-3 text-xs">{new Date(i.starts_at).toLocaleDateString()}</td>
              <td className="py-2 pr-3 text-xs">{i.ends_at ? new Date(i.ends_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {investments.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">No plans</td></tr>}
        </Table>
      </Section>

      {/* Deposit History */}
      <Section title={`Deposit History (${deposits.length})`}>
        <Table headers={["Order No", "Method", "Amount", "USDT", "Status", "Time"]}>
          {deposits.map(d => (
            <tr key={d.id} className="border-b border-slate-100">
              <td className="py-2 pr-3 font-mono text-xs">{d.order_number}</td>
              <td className="py-2 pr-3">{d.method_label || d.method_key || "-"}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{Number(d.amount).toFixed(2)} {d.currency}</td>
              <td className="py-2 pr-3">{Number(d.amount_usdt).toFixed(4)}</td>
              <td className="py-2 pr-3"><StatusBadge s={d.status}/></td>
              <td className="py-2 pr-3 text-xs">{new Date(d.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {deposits.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6">No deposits</td></tr>}
        </Table>
      </Section>

      {/* Withdraw History */}
      <Section title={`Withdraw History (${withdrawals.length})`}>
        <Table headers={["Order No", "Method", "Amount", "USDT", "Net", "Status", "Time"]}>
          {withdrawals.map(w => (
            <tr key={w.id} className="border-b border-slate-100">
              <td className="py-2 pr-3 font-mono text-xs">{w.order_number}</td>
              <td className="py-2 pr-3">{w.method_label || w.method_key}</td>
              <td className="py-2 pr-3 whitespace-nowrap">{Number(w.amount).toFixed(2)} {w.currency}</td>
              <td className="py-2 pr-3">{Number(w.amount_usdt).toFixed(4)}</td>
              <td className="py-2 pr-3">{Number(w.net_usdt).toFixed(4)}</td>
              <td className="py-2 pr-3"><StatusBadge s={w.status}/></td>
              <td className="py-2 pr-3 text-xs">{new Date(w.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {withdrawals.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-6">No withdrawals</td></tr>}
        </Table>
      </Section>

      {/* Referrals / Downlines */}
      <Section title={`Downline / Referrals (${referrals.length})`}>
        <Table headers={["Name", "Ref Code", "Phone", "Email", "Their Deposit (USDT)", "Joined"]}>
          {referrals.map(r => (
            <tr key={r.user_id} className="border-b border-slate-100">
              <td className="py-2 pr-3">{r.full_name || "—"}</td>
              <td className="py-2 pr-3 font-mono text-xs text-violet-600">{r.referral_code}</td>
              <td className="py-2 pr-3 text-xs">{r.phone || "—"}</td>
              <td className="py-2 pr-3 text-xs">{r.email || "—"}</td>
              <td className="py-2 pr-3 font-semibold text-emerald-600">₮ {(refDeposits[r.user_id] || 0).toFixed(2)}</td>
              <td className="py-2 pr-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {referrals.length === 0 && <tr><td colSpan={6} className="text-center text-slate-400 py-6">No referrals</td></tr>}
        </Table>
      </Section>
    </AdminLayout>
  );
};

const Stat = ({ icon, label, value, color }: any) => (
  <div className={`rounded-xl p-4 text-white bg-gradient-to-br ${color} shadow-sm`}>
    <div className="flex items-center justify-between">
      <div className="text-xs opacity-90">{label}</div>
      <div className="opacity-90">{icon}</div>
    </div>
    <div className="text-2xl font-bold mt-2">{value}</div>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
    <h3 className="font-semibold text-slate-900 mb-3">{title}</h3>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

const Table = ({ headers, children }: any) => (
  <table className="w-full text-sm">
    <thead className="text-left text-slate-500 border-b border-slate-200">
      <tr>{headers.map((h: string) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

const StatusBadge = ({ s }: { s: string }) => {
  const colors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
    active: "bg-sky-100 text-sky-700",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${colors[s] || "bg-slate-100 text-slate-600"}`}>{s}</span>;
};

export default AdminUserDetails;
