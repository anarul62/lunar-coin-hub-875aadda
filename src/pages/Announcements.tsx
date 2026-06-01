import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, Gift, Loader2, Megaphone } from "lucide-react";

const Announcements = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("announcements")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      setPosts(data || []);
      setLoading(false);
    })();
  }, []);

  const iconFor = (type: string) => {
    if (type === "gift_code") return <Gift className="h-5 w-5 text-primary" />;
    if (type === "announcement") return <Megaphone className="h-5 w-5 text-primary" />;
    return <Bell className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="pt-14">
        <header className="px-4 py-5 border-b border-border bg-card/60">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold text-gradient-gold">Announcements</h1>
        </header>

        <section className="px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <Megaphone className="h-10 w-10 mx-auto mb-3 text-primary/30" /> No announcements yet.
            </div>
          ) : posts.map((post) => (
            <article key={post.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                  {iconFor(post.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-foreground">{post.title}</h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                      {String(post.type || "notice").replace("_", " ")}
                    </span>
                  </div>
                  {post.body && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed">{post.body}</p>}
                  {post.gift_code && <p className="mt-2 font-mono text-sm text-primary">{post.gift_code}</p>}
                  {post.image_url && <img src={post.image_url} alt="Announcement" className="mt-3 rounded-xl border border-border max-h-56 w-full object-cover" loading="lazy" />}
                  <p className="text-[11px] text-muted-foreground mt-3">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Announcements;