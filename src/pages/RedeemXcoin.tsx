import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import giftTicket from "@/assets/gift-ticket.png";

const RedeemXcoin = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [bgImg, setBgImg] = useState<string>(giftTicket);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);
    const [{ data: h }, { data: setRow }] = await Promise.all([
      supabase.from("xcoin_gift_redemptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("app_settings").select("value").eq("key", "gift_code_bg").maybeSingle(),
    ]);
    setHistory(h || []);
    const url = (setRow?.value as any)?.url;
    if (url) setBgImg(url);
  };
  useEffect(() => { load(); }, []);

  const redeem = async () => {
    if (!code.trim() || !userId) return;
    setSubmitting(true);
    const codeUp = code.trim().toUpperCase();
    const { data: gc } = await supabase.from("xcoin_gift_codes").select("*").eq("code", codeUp).maybeSingle();
    if (!gc) { setSubmitting(false); return toast({ title: "Invalid code", variant: "destructive" }); }
    if (gc.expire_at && new Date(gc.expire_at) < new Date()) { setSubmitting(false); return toast({ title: "Code expired", variant: "destructive" }); }
    if (gc.used_count >= gc.max_users) { setSubmitting(false); return toast({ title: "Code limit reached", variant: "destructive" }); }
    const { data: dup } = await supabase.from("xcoin_gift_redemptions").select("id").eq("code_id", gc.id).eq("user_id", userId).maybeSingle();
    if (dup) { setSubmitting(false); return toast({ title: "Already redeemed", variant: "destructive" }); }

    const { error: rErr } = await supabase.from("xcoin_gift_redemptions").insert({ code_id: gc.id, user_id: userId, amount: gc.amount });
    if (rErr) { setSubmitting(false); return toast({ title: "Failed", description: rErr.message, variant: "destructive" }); }
    await supabase.from("xcoin_gift_codes").update({ used_count: gc.used_count + 1 }).eq("id", gc.id);

    const { data: xc } = await supabase.from("user_xcoin").select("balance").eq("user_id", userId).maybeSingle();
    const newBal = Number(xc?.balance || 0) + Number(gc.amount);
    await supabase.from("user_xcoin").upsert({ user_id: userId, balance: newBal, updated_at: new Date().toISOString() });
    await supabase.from("xcoin_transactions").insert({ user_id: userId, type: "redeem_code", amount: gc.amount, meta: { code: codeUp } });

    setSubmitting(false);
    setCode("");
    toast({ title: `Received ${gc.amount} X Coin!` });
    load();
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-20">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="text-lg font-semibold">Gift</h1>
        <div className="w-9"/>
      </header>
      <div className="flex justify-center py-8">
        <img src={bgImg} alt="Gift" className="max-h-56 object-contain" />
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="font-semibold">Hi</p>
          <p className="text-slate-600 text-sm">We have a gift for you</p>
          <p className="mt-4 font-semibold text-sm">Please enter the gift code below</p>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Please enter gift code"
            className="w-full mt-2 px-4 py-3 rounded-full bg-slate-100 outline-none text-sm"/>
          <Button onClick={redeem} disabled={submitting} className="w-full mt-4 h-12 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8e3c] text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Receive"}
          </Button>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <p className="font-semibold mb-2">📜 History</p>
          {history.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">No redemptions yet</p>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between border-b py-2 text-sm">
                  <div>
                    <p className="font-semibold">+{Number(h.amount).toFixed(0)} X Coin</p>
                    <p className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedeemXcoin;
