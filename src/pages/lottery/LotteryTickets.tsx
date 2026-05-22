import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ticketImg from "@/assets/lucky-ticket.png";
import soldRibbon from "@/assets/sold-ribbon.png";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";

type Ticket = { id: string; ticket_number: number; code: string; user_id: string | null };

const LotteryTickets = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setMe(user?.id || null);
    const { data: p } = await supabase.from("lottery_plans").select("*").eq("id", planId).maybeSingle();
    setPlan(p);
    const { data: tix } = await supabase.from("lottery_tickets").select("*").eq("plan_id", planId).order("ticket_number");
    setTickets((tix as any) || []);
    if (user) {
      const { data: ent } = await supabase.from("lottery_entries").select("tickets_count,tickets_assigned").eq("plan_id", planId).eq("user_id", user.id);
      const bought = (ent || []).reduce((a, e: any) => a + e.tickets_count, 0);
      const used = (ent || []).reduce((a, e: any) => a + e.tickets_assigned, 0);
      const ownedNow = (tix as any[] | null)?.filter((t) => t.user_id === user.id).length || 0;
      setRemaining(Math.max(0, bought - used - (ownedNow - used)));
      // Simpler: remaining = bought - currently-owned-tickets
      setRemaining(Math.max(0, bought - ownedNow));
    }
  };
  useEffect(() => { load(); }, [planId]);

  const toggle = (t: Ticket) => {
    if (t.user_id) return;
    const s = new Set(selected);
    if (s.has(t.id)) s.delete(t.id);
    else {
      if (s.size >= remaining) { toast.error(`You can book ${remaining} more ticket(s)`); return; }
      s.add(t.id);
    }
    setSelected(s);
  };

  const book = async () => {
    if (!me || selected.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("lottery_tickets")
        .update({ user_id: me, booked_at: new Date().toISOString() })
        .in("id", ids)
        .is("user_id", null);
      if (error) throw error;
      toast.success(`Booked ${ids.length} ticket(s)`);
      navigate(`/lottery/${planId}/details?tab=tickets`);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const soldCount = tickets.filter((t) => t.user_id).length;

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navbar />
      <main className="pt-16 px-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="bg-purple-700 -mx-3 px-4 py-4 relative">
          <h1 className="text-white font-bold text-lg">{plan?.name}</h1>
          <p className="text-right text-white font-extrabold text-xl absolute top-3 right-4">{soldCount}/{tickets.length}</p>
          <p className="text-white/80 text-xs mt-1">You can book {remaining} ticket(s)</p>
        </div>
        <div className="bg-purple-800 -mx-3 px-3 pt-3 pb-32 min-h-[60vh]">
          <div className="grid grid-cols-3 gap-3">
            {tickets.map((t) => {
              const isSold = !!t.user_id;
              const mine = t.user_id === me;
              const sel = selected.has(t.id);
              return (
                <button key={t.id} onClick={() => toggle(t)} className={`relative aspect-[3/2] rounded-md overflow-hidden ${sel ? "ring-4 ring-emerald-400" : ""} ${isSold && !mine ? "opacity-90" : ""}`}>
                  <img src={ticketImg} className="w-full h-full object-cover" alt="ticket" />
                  {/* Number sits on the dark engraved plate */}
                  <span
                    className="absolute font-black text-amber-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
                    style={{ top: "47%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "clamp(14px,4.5vw,22px)", letterSpacing: "1px" }}
                  >
                    #{String(t.ticket_number).padStart(3, "0")}
                  </span>
                  {/* Code sits on the lower golden blank plate */}
                  <span
                    className="absolute font-extrabold text-[#3a210a]"
                    style={{ top: "82%", left: "50%", transform: "translate(-50%,-50%)", fontSize: "clamp(8px,2.6vw,12px)", letterSpacing: "0.5px" }}
                  >
                    {t.code}
                  </span>
                  {isSold && !mine && (
                    <>
                      <div className="absolute inset-0 bg-red-900/40 pointer-events-none" />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-red-600 text-white text-xs font-black px-3 py-1 rounded shadow-lg border-2 border-white">SOLD</span>
                    </>
                  )}
                  {mine && (
                    <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">MINE</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {selected.size > 0 && (
          <div className="fixed bottom-20 inset-x-3 z-40">
            <Button disabled={busy} onClick={book} className="w-full h-12 bg-gradient-to-b from-emerald-400 to-emerald-600 text-black font-extrabold text-lg shadow-lg">
              Book {selected.size} ticket{selected.size > 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default LotteryTickets;
