import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

const Guide = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Guide");
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("app_settings").select("value").eq("key", "user_guide").maybeSingle();
      setTitle(data?.value?.title || "Guide");
      setBody(data?.value?.body || "No guide content yet.");
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="pt-14">
        <header className="px-4 py-5 border-b border-border bg-card/60">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold text-gradient-gold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> {title}
          </h1>
        </header>

        <section className="px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{body}</p>
            </article>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Guide;