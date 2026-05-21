import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Search } from "lucide-react";

type Inv = {
  id: string; user_id: string; channel_name: string | null; plan_name: string;
  amount: number; currency: string; expected_return: number; profit: number;
  duration_days: number; status: string; starts_at: string; ends_at: string | null; created_at: string;
};

type Profile = { user_id: string; full_name: string | null; phone: string | null; email: string | null; balance_usdt: number; referral_code: string | null; };

type Wd = { user_id: string; amount_usdt: number; status: string };

const Card = ({ label, value, sub }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
    {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
  </div>
);

const AdminInvestments = ({ mode }: { mode: "today" | "all" | "completed" }) => {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Inv[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [withdrawn, setWithdrawn] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");

  const title = mode === "today" ? "Today's Investments" : mode === "completed" ? "Completed Investments" : "All Investments";

  useEffect(() => {
    (async () => {
      setLoading(true);
      let qry = (supabase as any).from("user_investments").select("*").order("created_at", { ascending: false });
      if (mode === "today") {
        const start = new Date(); start.setHours(0, 0, 0, 0);
        qry = qry.gte("created_at", start.toISOString());
      } else if (mode === "completed") {
        qry = qry.or(`status.eq.completed,ends_at.lt.${new Date().toISOString()}`);
      }
      const { data } = await qry.limit(500);
      const list = (data as Inv[]) || [];
      setItems(list);

      const ids = Array.from(new Set(list.map(i => i.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("user_id,full_name,phone,email,balance_usdt,referral_code").in("user_id", ids);
        const map: Record<string, Profile> = {};
        (profs as Profile[] || []).forEach(p => { map[p.user_id] = p; });
        setProfiles(map);

        if (mode === "completed") {
          const { data: wds } = await supabase.from("withdrawals")
            .select("user_id,amount_usdt,status").in("user_id", ids).eq("status", "approved");
          const wmap: Record<string, number> = {};
          (wds as Wd[] || []).forEach(w => { wmap[w.user_id] = (wmap[w.user_id] || 0) + Number(w.amount_usdt || 0); });
          setWithdrawn(wmap);
        }
      }
      setLoading(false);
    })();
  }, [mode, pathname]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(it => {
      const p = profiles[it.user_id];
      return it.plan_name.toLowerCase().includes(s)
        || (p?.full_name || "").toLowerCase().includes(s)
        || (p?.phone || "").includes(s)
        || (p?.referral_code || "").toLowerCase().includes(s);
    });
  }, [q, items, profiles]);

  const totals = useMemo(() => {
    const sum = items.reduce((a, b) => a + Number(b.amount || 0), 0);
    const ret = items.reduce((a, b) => a + Number(b.expected_return || 0), 0);
    return { count: items.length, sum, ret };
  }, [items]);

  return (
    <AdminLayout title={title}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card label="Total Investments" value={totals.count} />
        <Card label="Total Invested (USDT)" value={totals.sum.toFixed(2)} />
        <Card label="Expected Return (USDT)" value={totals.ret.toFixed(2)} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by user, phone, referral code or plan…"
          className="flex-1 outline-none text-sm bg-transparent" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-slate-500"><TrendingUp className="h-10 w-10 mx-auto mb-3 text-slate-300" />No records.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Ref Code</th>
                <th className="text-left px-3 py-2">Balance</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Return</th>
                <th className="text-left px-3 py-2">Duration</th>
                {mode === "completed" && <th className="text-left px-3 py-2">Withdrawn</th>}
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((it) => {
                const p = profiles[it.user_id];
                const ended = it.ends_at && new Date(it.ends_at) < new Date();
                const status = it.status === "completed" || ended ? "completed" : it.status;
                return (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{p?.full_name || p?.email || p?.phone || "—"}</div>
                      <div className="text-[11px] text-slate-500">{p?.phone || p?.email}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{p?.referral_code || "—"}</td>
                    <td className="px-3 py-2">{Number(p?.balance_usdt || 0).toFixed(2)} USDT</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{it.plan_name}</div>
                      <div className="text-[11px] text-slate-500">{it.channel_name}</div>
                    </td>
                    <td className="px-3 py-2">{Number(it.amount).toFixed(2)} {it.currency}</td>
                    <td className="px-3 py-2 text-emerald-600">{Number(it.expected_return).toFixed(2)} {it.currency}</td>
                    <td className="px-3 py-2">{it.duration_days}d</td>
                    {mode === "completed" && <td className="px-3 py-2">{(withdrawn[it.user_id] || 0).toFixed(2)} USDT</td>}
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        status === "active" ? "bg-emerald-50 text-emerald-700" :
                        status === "completed" ? "bg-blue-50 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{status.toUpperCase()}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{new Date(it.starts_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInvestments;
