import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { getReadyUser } from "@/lib/auth-session";
import { Send, ImagePlus, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Conv = {
  id: string; user_id: string; status: string;
  last_message: string | null; last_message_at: string;
  unread_admin: number;
  profile?: { full_name: string | null; email: string | null; phone: string | null };
};
type Msg = { id: string; sender_role: "user"|"admin"; content: string|null; image_url: string|null; created_at: string };

const AdminSupport = () => {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    const { data } = await (supabase as any).from("support_conversations")
      .select("*").order("last_message_at", { ascending: false });
    const list = (data as Conv[]) || [];
    const ids = list.map(c => c.user_id);
    if (ids.length) {
      const { data: profs } = await (supabase as any).from("profiles")
        .select("user_id, full_name, email, phone").in("user_id", ids);
      const map: any = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      list.forEach(c => { c.profile = map[c.user_id]; });
    }
    setConvs(list);
  };

  useEffect(() => {
    (async () => {
      const u = await getReadyUser();
      if (u) setAdminId(u.id);
      loadConvs();
    })();
    const ch = supabase.channel("admin-support-convs")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_conversations" }, () => loadConvs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const { data } = await (supabase as any).from("support_messages")
        .select("*").eq("conversation_id", activeId).order("created_at");
      setMessages((data as Msg[]) || []);
      await (supabase as any).from("support_conversations").update({ unread_admin: 0 }).eq("id", activeId);
      loadConvs();
    })();
    const ch = supabase.channel(`admin-support-${activeId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender_role === "user") {
            (supabase as any).from("support_conversations").update({ unread_admin: 0 }).eq("id", activeId);
          }
        }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (content: string | null, image_url: string | null) => {
    if (!adminId || !activeId) return;
    if (!content && !image_url) return;
    setSending(true);
    const { error } = await (supabase as any).from("support_messages").insert({
      conversation_id: activeId, sender_id: adminId, sender_role: "admin", content, image_url,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  const upload = async (file: File) => {
    if (!adminId) return;
    setSending(true);
    const path = `${adminId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("support-chat").upload(path, file);
    if (error) { toast.error(error.message); setSending(false); return; }
    const { data } = supabase.storage.from("support-chat").getPublicUrl(path);
    await send(null, data.publicUrl);
  };

  const active = convs.find(c => c.id === activeId);
  const openCount = convs.filter(c => c.unread_admin > 0).length;
  const totalUsers = convs.length;

  return (
    <AdminLayout title="Customer Service">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Conversations</p><p className="text-2xl font-bold text-slate-900">{totalUsers}</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Unread Requests</p><p className="text-2xl font-bold text-red-600">{openCount}</p></div>
        <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Total Messages Today</p><p className="text-2xl font-bold text-emerald-600">{convs.filter(c => new Date(c.last_message_at).toDateString() === new Date().toDateString()).length}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
        {/* Conversation list */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-y-auto">
          <div className="px-4 py-3 border-b text-sm font-semibold text-slate-700">All Requests</div>
          {convs.length === 0 && <div className="p-6 text-center text-sm text-slate-400">No conversations yet</div>}
          {convs.map(c => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-slate-50 ${activeId === c.id ? "bg-emerald-50" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-slate-900 truncate">{c.profile?.full_name || c.profile?.email || "User"}</p>
                {c.unread_admin > 0 && <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] text-center">{c.unread_admin}</span>}
              </div>
              <p className="text-xs text-slate-500 truncate">{c.last_message || "—"}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.last_message_at).toLocaleString()}</p>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="h-10 w-10 mb-2"/><p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b">
                <p className="font-semibold text-slate-900 text-sm">{active.profile?.full_name || "User"}</p>
                <p className="text-xs text-slate-500">{active.profile?.email} {active.profile?.phone ? `· ${active.profile.phone}` : ""}</p>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {messages.map(m => {
                  const mine = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"}`}>
                        {m.image_url && <img src={m.image_url} alt="" className="rounded-lg mb-1 max-h-56"/>}
                        {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                        <div className={`text-[10px] mt-0.5 ${mine ? "text-white/70" : "text-slate-400"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(text.trim() || null, null); }} className="border-t p-2 flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.currentTarget.value = ""; }}/>
                <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-600"><ImagePlus className="h-5 w-5"/></button>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm focus:outline-none"/>
                <button type="submit" disabled={sending || !text.trim()} className="p-2 rounded-full bg-emerald-600 text-white disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
