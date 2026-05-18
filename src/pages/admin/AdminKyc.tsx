import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck, UserX, Users, ClipboardList, ArrowRight } from "lucide-react";

const AdminKyc = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [kyc, setKyc] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: k }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("kyc_requests").select("*"),
      ]);
      setUsers(u || []);
      setKyc(k || []);
      setLoading(false);
    })();
  }, []);

  // Latest KYC per user
  const latestByUser = new Map<string, any>();
  [...kyc].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach(r => { if (!latestByUser.has(r.user_id)) latestByUser.set(r.user_id, r); });

  const approvedIds = new Set([...latestByUser.values()].filter(r => r.status === "approved").map(r => r.user_id));
  const pendingIds = new Set([...latestByUser.values()].filter(r => r.status === "pending").map(r => r.user_id));
  const notKycUsers = users.filter(u => !approvedIds.has(u.user_id));

  const total = users.length;
  const complete = approvedIds.size;
  const notComplete = total - complete;
  const pending = pendingIds.size;

  const maxBar = Math.max(complete, notComplete, 1);

  return (
    <AdminLayout title="KYC Manager">
      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Total Users" value={total} color="bg-blue-50 text-blue-600"/>
            <StatCard icon={FileCheck} label="KYC Complete" value={complete} color="bg-emerald-50 text-emerald-600"/>
            <StatCard icon={UserX} label="Not KYC" value={notComplete} color="bg-red-50 text-red-600"/>
            <StatCard icon={ClipboardList} label="Pending Requests" value={pending} color="bg-amber-50 text-amber-600"/>
          </div>

          {/* Graph */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">KYC Overview</h3>
            <div className="space-y-3">
              {[
                { label: "KYC Complete", value: complete, color: "bg-emerald-500" },
                { label: "Not KYC", value: notComplete, color: "bg-red-500" },
                { label: "Pending", value: pending, color: "bg-amber-500" },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{b.label}</span><span className="font-semibold">{b.value}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${b.color} transition-all`} style={{ width: `${(b.value / Math.max(total, 1)) * 100}%` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <Link to="/admin/kyc/requests" className="flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-4 hover:from-emerald-600 hover:to-emerald-700 transition-all">
            <div>
              <div className="font-semibold">KYC Requests</div>
              <div className="text-sm opacity-90">Review, approve or reject pending KYC submissions ({pending})</div>
            </div>
            <ArrowRight className="h-5 w-5"/>
          </Link>

          {/* Not KYC users list */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Users Without KYC ({notKycUsers.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Registration</th>
                    <th className="p-3 font-medium">Mobile</th>
                    <th className="p-3 font-medium">Balance</th>
                    <th className="p-3 font-medium">KYC Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notKycUsers.map(u => {
                    const k = latestByUser.get(u.user_id);
                    return (
                      <tr key={u.id} className="border-t border-slate-100">
                        <td className="p-3">{u.full_name || u.email?.split("@")[0] || "-"}</td>
                        <td className="p-3 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-3">{u.phone || "-"}</td>
                        <td className="p-3">₹0</td>
                        <td className="p-3">
                          {k?.status === "pending" && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700">Pending</span>}
                          {k?.status === "rejected" && <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700">Rejected</span>}
                          {!k && <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">Not Applied</span>}
                        </td>
                      </tr>
                    );
                  })}
                  {notKycUsers.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">All users have completed KYC</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4">
    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${color}`}><Icon className="h-5 w-5"/></div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
    <div className="text-xs text-slate-500">{label}</div>
  </div>
);

export default AdminKyc;
