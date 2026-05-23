import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getReadyUser } from "@/lib/auth-session";
import { ArrowLeft, Send, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  sender_role: "user" | "admin";
  content: string | null;
  image_url: string | null;
  created_at: string;
};

const Support = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const u = await getReadyUser();
      if (!u) { navigate("/login"); return; }
      setUserId(u.id);

      let { data: conv } = await (supabase as any)
        .from("support_conversations").select("*").eq("user_id", u.id).maybeSingle();
      if (!conv) {
        const { data: created, error } = await (supabase as any)
          .from("support_conversations").insert({ user_id: u.id }).select().single();
        if (error) { toast.error(error.message); return; }
        conv = created;
      }
      setConvId(conv.id);

      const { data: msgs } = await (supabase as any)
        .from("support_messages").select("*").eq("conversation_id", conv.id).order("created_at");
      setMessages((msgs as Msg[]) || []);
      setLoading(false);

      await (supabase as any).from("support_conversations").update({ unread_user: 0 }).eq("id", conv.id);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!convId) return;
    const ch = supabase
      .channel(`support-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_role === "admin") {
            (supabase as any).from("support_conversations").update({ unread_user: 0 }).eq("id", convId);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (content: string | null, image_url: string | null) => {
    if (!userId || !convId) return;
    if (!content && !image_url) return;
    setSending(true);
    const { error } = await (supabase as any).from("support_messages").insert({
      conversation_id: convId, sender_id: userId, sender_role: "user", content, image_url,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); send(text.trim() || null, null); };

  const upload = async (file: File) => {
    if (!userId) return;
    setSending(true);
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("support-chat").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setSending(false); return; }
    const { data } = supabase.storage.from("support-chat").getPublicUrl(path);
    await send(null, data.publicUrl);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-card border-b border-border h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft className="h-5 w-5 text-foreground"/></button>
        <div>
          <h1 className="font-semibold text-foreground">Customer Service</h1>
          <p className="text-xs text-muted-foreground">We usually reply within minutes</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="flex justify-center pt-10"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground pt-10">Say hi to start a conversation 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_role === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}>
                {m.image_url && <img src={m.image_url} alt="attachment" className="rounded-lg mb-1 max-h-60"/>}
                {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                <div className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="border-t border-border bg-card p-2 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }} />
        <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-muted-foreground hover:text-primary" aria-label="Upload image">
          <ImagePlus className="h-5 w-5"/>
        </button>
        <input
          value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
          className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button type="submit" disabled={sending || (!text.trim())} className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-50" aria-label="Send">
          {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
        </button>
      </form>
    </div>
  );
};

export default Support;
