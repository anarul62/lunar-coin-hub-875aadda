import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Megaphone, Bell, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import giftTicket from "@/assets/gift-ticket.png";

const Rewards = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [codeAmounts, setCodeAmounts] = useState<Record<string, number>>({});
  const [bgImg, setBgImg] = useState<string>(giftTicket);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: setRow }] = await Promise.all([
        supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("app_settings").select("value").eq("key", "gift_code_bg").maybeSingle(),
      ]);
      setPosts(data || []);
      const url = (setRow?.value as any)?.url;
      if (url) setBgImg(url);

      const codes = (data || []).filter(p => p.gift_code).map(p => p.gift_code);
      if (codes.length) {
        const { data: gc } = await supabase.from("xcoin_gift_codes").select("code, amount").in("code", codes);
        const map: Record<string, number> = {};
        (gc || []).forEach((g: any) => { map[g.code] = Number(g.amount); });
        setCodeAmounts(map);
      }
      setLoading(false);
    })();
  }, []);

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast({ title: "Copied" }); };

  const Icon = ({ t }: { t: string }) => {
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
          posts.map(p => {
            if (p.type === "gift_code" && p.gift_code) {
              const amt = codeAmounts[p.gift_code];
              return (
                <div key={p.id} className="rounded-2xl p-4 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-amber-500/20">
                  {p.title && <p className="font-semibold mb-3 text-amber-200 tracking-wide">{p.title}</p>}
                  <div className="relative w-full overflow-hidden rounded-xl ring-1 ring-amber-300/40 shadow-[0_8px_30px_-8px_rgba(251,191,36,0.5)]" style={{ aspectRatio: "2 / 1" }}>
                    <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pr-[12%] pl-[4%]">
                      <p className="font-extrabold text-slate-900 text-2xl sm:text-3xl tracking-[0.18em] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]" style={{ fontFamily: 'ui-monospace, monospace' }}>{p.gift_code}</p>
                      {amt != null && <p className="font-black text-slate-900 text-3xl sm:text-4xl mt-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">X{amt}</p>}
                    </div>
                  </div>
                  <button onClick={() => copy(p.gift_code)} className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition rounded-xl px-3 py-3 text-slate-900 font-bold shadow-md">
                    <Copy className="h-4 w-4"/> Copy code
                  </button>
                  {p.body && <p className="text-xs text-slate-300 mt-3 whitespace-pre-wrap">{p.body}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              );
            }
            return (
              <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Icon t={p.type}/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{p.title}</p>
                    {p.body && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{p.body}</p>}
                    {p.image_url && <img src={p.image_url} className="rounded-lg mt-2 max-h-48 object-cover" alt=""/>}
                    <p className="text-[11px] text-slate-400 mt-2">{new Date(p.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default Rewards;
