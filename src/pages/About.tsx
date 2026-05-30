import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

type Section = { id: string; slug: string; icon: string; title: string; body: string };

const About = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("site_content_sections")
        .select("id,slug,icon,title,body")
        .eq("category", "about")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      setItems(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="pt-14">
        <div className="relative px-4 pt-6 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-heading text-2xl font-bold text-gradient-gold">About Crypto X</h1>
          </div>
        </div>

        <section className="px-4 -mt-2 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No content yet.</p>
          ) : (
            items.map((s) => (
              <article
                key={s.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-gradient-gold">{s.title}</span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {s.body}
                </p>
              </article>
            ))
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default About;
