import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

type Channel = {
  id: string;
  key: string;
  name: string;
  type: string;
  banner_url: string | null;
  description: string | null;
};

const Invest = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("invest_channels")
        .select("id,key,name,type,banner_url,description")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      setChannels((data as any) || []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="pt-16 px-4">
        <h1 className="font-heading text-xl font-bold text-foreground mb-3">Invest Channels</h1>

        <div className="space-y-4">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/invest/${c.key}`)}
              className="block w-full rounded-2xl overflow-hidden border border-primary/20 bg-card hover:border-primary/40 transition-colors text-left"
            >
              {c.banner_url ? (
                <img src={c.banner_url} alt={c.name} className="w-full aspect-[2/1] object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-[2/1] bg-gradient-gold-subtle flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-heading font-bold text-foreground">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </button>
          ))}

          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">More channels coming soon…</p>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Invest;
