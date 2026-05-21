import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCheck, Loader2, ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

type N = {
  id: string; type: string; title: string; body: string | null;
  amount: number | null; currency: string | null; link: string | null;
  read: boolean; created_at: string; meta: any;
};

const iconFor = (t: string) => {
  if (t === "deposit") return <ArrowDownToLine className="h-4 w-4 text-emerald-600" />;
  if (t === "withdraw") return <ArrowUpFromLine className="h-4 w-4 text-amber-600" />;
  if (t === "invest") return <TrendingUp className="h-4 w-4 text-blue-600" />;
  return <Bell className="h-4 w-4 text-slate-600" />;
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<N[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("notifications").select("*")
      .eq("audience", "admin").order("created_at", { ascending: false }).limit(300);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await (supabase as any).from("notifications").update({ read: true }).eq("audience", "admin").eq("read", false);
    load();
  };

  return (
    <AdminLayout title="Notifications">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">Activity alerts from users — deposits, withdrawals, investments.</p>
        <button onClick={markAll} className="text-xs text-emerald-700 flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-sm text-slate-500"><Bell className="h-10 w-10 mx-auto mb-3 text-slate-300" />No notifications yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => n.link && navigate(n.link)}
              className={`w-full text-left p-3 flex gap-3 hover:bg-slate-50 ${n.read ? "" : "bg-emerald-50/40"}`}
            >
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">{iconFor(n.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-slate-900 truncate">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />}
                </div>
                {n.body && <p className="text-xs text-slate-600 mt-0.5">{n.body}</p>}
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNotifications;
