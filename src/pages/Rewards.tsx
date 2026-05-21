import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Gift, Megaphone, Bell, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Rewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast({ title: "Copied" }); };

  const Icon = ({ t }: { t: string }) => {
    if (t === "gift_code") return <Gift className="h-5 w-5 text-pink-500"/>;
    if (t === "announcement") return <Megaphone className="h-5 w-5 text-orange-500"/>;
    return <Bell className="h-5 w-5 text-blue-500"/>;
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-20">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="text-lg font-semibold">Rewards</h1>
        <div className="w-9"/>
      </header>
      <div className="p-4 space-y-3">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin"/></div> :
          posts.length === 0 ? <p className="text-center text-slate-400 py-12">No rewards or announcements yet</p> :
          posts.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Icon t={p.type}/>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{p.title}</p>
                  {p.body && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{p.body}</p>}
                  {p.image_url && <img src={p.image_url} className="rounded-lg mt-2 max-h-48 object-cover" alt=""/>}
                  {p.gift_code && (
                    <div className="mt-3 flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      <code className="font-mono font-bold text-rose-600 flex-1">{p.gift_code}</code>
                      <button onClick={() => copy(p.gift_code)} className="text-rose-600"><Copy className="h-4 w-4"/></button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

export default Rewards;
