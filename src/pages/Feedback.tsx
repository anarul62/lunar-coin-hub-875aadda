import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

const Feedback = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);
    const { data } = await (supabase as any)
      .from("user_feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !message.trim()) return;
    setSending(true);
    const { error } = await (supabase as any).from("user_feedback").insert({ user_id: userId, message: message.trim() });
    setSending(false);
    if (error) return toast.error(error.message);
    setMessage("");
    toast.success("Feedback sent");
    load();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />
      <main className="pt-14">
        <header className="px-4 py-5 border-b border-border bg-card/60">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="font-heading text-2xl font-bold text-gradient-gold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Feedback
          </h1>
        </header>

        <section className="px-4 py-4 space-y-4">
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Write your feedback..." className="bg-secondary border-border" />
            <Button type="submit" disabled={sending || !message.trim()} className="w-full bg-gradient-gold text-primary-foreground font-semibold">
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send Feedback
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">My feedback</h2>
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{item.status}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{item.message}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

export default Feedback;