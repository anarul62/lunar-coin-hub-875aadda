import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCheck, Loader2, ArrowDownToLine, ArrowUpFromLine, TrendingUp, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

type N = {
  id: string; type: string; title: string; body: string | null;
  amount: number | null; currency: string | null; link: string | null;
  read: boolean; created_at: string;
};

const iconFor = (t: string) => {
  if (t === "deposit") return <ArrowDownToLine className="h-4 w-4 text-emerald-500" />;
  if (t === "withdraw") return <ArrowUpFromLine className="h-4 w-4 text-amber-500" />;
  if (t === "invest") return <TrendingUp className="h-4 w-4 text-blue-500" />;
  if (t === "claim") return <Gift className="h-4 w-4 text-pink-500" />;
  return <Bell className="h-4 w-4 text-primary" />;
};

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<N[]>([]);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const { data } = await (supabase as any).from("notifications").select("*")
      .eq("audience", "user").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from("notifications").update({ read: true })
      .eq("audience", "user").eq("user_id", user.id).eq("read", false);
    load();
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-16 px-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={markAll} className="text-xs text-primary flex items-center gap-1">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
        <h1 className="font-heading text-xl font-bold mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-primary"/>Notifications</h1>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-sm text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 text-primary/30" /> No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => n.link && navigate(n.link)}
                className={`w-full text-left rounded-xl border p-3 flex gap-3 transition-colors ${
                  n.read ? "bg-card border-border" : "bg-primary/5 border-primary/30"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center shrink-0">{iconFor(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Notifications;
