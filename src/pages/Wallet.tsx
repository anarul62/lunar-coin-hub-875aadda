import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { fetchLiveRates, getUserWalletCurrency, formatUserBalance } from "@/lib/currency";
import { Info, RefreshCw, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import xcoinImg from "@/assets/xcoin.png";

const XCOIN_IMG = xcoinImg;

const Wallet = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [xcoin, setXcoin] = useState(0);
  const [rates, setRates] = useState<Record<string, number>>({ INR: 83, BDT: 120, PKR: 280, USDT: 1 });
  const [settings, setSettings] = useState<any>({ xcoin_per_usdt: 1000, min_convert_xcoin: 100, description: "" });
  const [showLocal, setShowLocal] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convAmt, setConvAmt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    // Auto-credit any matured investments before reading balances
    await supabase.rpc("finalize_matured_investments" as any, { _user_id: user.id });
    const [{ data: prof }, { data: xc }, { data: setRow }, rs] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_xcoin").select("balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "xcoin_settings").maybeSingle(),
      fetchLiveRates(),
    ]);
    setProfile(prof);
    setXcoin(Number(xc?.balance || 0));
    setSettings(setRow?.value || { xcoin_per_usdt: 1000, min_convert_xcoin: 100 });
    setRates(rs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const bal = Number(profile?.balance_usdt || 0);
  const locked = Number(profile?.locked_bonus_usdt || 0);
  const totalUsdt = bal + locked;
  const userCur = getUserWalletCurrency(profile);
  const display = showLocal ? formatUserBalance(totalUsdt, userCur, rates) : `${totalUsdt.toFixed(4)} USDT`;

  const xcoinPerUsdt = Number(settings.xcoin_per_usdt || 1000);
  const minConvert = Number(settings.min_convert_xcoin || 100);

  const convert = async () => {
    const amt = Number(convAmt);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (amt < minConvert) return toast({ title: `Min ${minConvert} X Coin`, variant: "destructive" });
    if (amt > xcoin) return toast({ title: "Insufficient X Coin", variant: "destructive" });
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const usdt = amt / xcoinPerUsdt;
    const newX = xcoin - amt;
    const { data: fresh } = await supabase.from("profiles").select("balance_usdt").eq("user_id", user!.id).maybeSingle();
    const newBal = Number(fresh?.balance_usdt || 0) + usdt;
    await supabase.from("user_xcoin").upsert({ user_id: user!.id, balance: newX, updated_at: new Date().toISOString() });
    await supabase.from("profiles").update({ balance_usdt: newBal }).eq("user_id", user!.id);
    await supabase.from("xcoin_transactions").insert({ user_id: user!.id, type: "convert_to_usdt", amount: amt, meta: { usdt } });
    setSubmitting(false);
    setConvertOpen(false);
    setConvAmt("");
    toast({ title: "Converted", description: `${amt} X Coin → ${usdt.toFixed(4)} USDT` });
    load();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground relative overflow-hidden">
      {/* Cinematic ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px 300px at 50% -10%, hsl(43 96% 56% / 0.18), transparent 60%), radial-gradient(500px 280px at 100% 30%, hsl(35 100% 45% / 0.12), transparent 70%)",
        }}
      />
      <Navbar />
      <main className="pt-14 relative z-10">
        {/* Total balance — premium 3D gold card */}
        <div className="px-4 pt-4 pb-5">
          <div
            className="relative rounded-2xl p-5 overflow-hidden cat-3d"
            style={{ perspective: "1000px" }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
              style={{ background: "var(--gradient-gold)" }}
            />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80 font-semibold">Total balance</p>
              <p className="font-heading text-4xl font-extrabold mt-2 flex items-center gap-2 text-gradient-gold drop-shadow-[0_2px_10px_rgba(255,180,40,0.35)]">
                {display}
                <button onClick={() => setShowLocal(s => !s)} className="text-primary/70 hover:text-primary transition">
                  <RefreshCw className="h-4 w-4"/>
                </button>
              </p>
              <div className="mt-3 flex items-center gap-3 text-[11px]">
                <span className="px-2 py-0.5 rounded-md border border-primary/30 bg-primary/5 text-primary/90">Available</span>
                <span className="text-muted-foreground">{bal.toFixed(4)} USDT</span>
              </div>
              {locked > 0 && (
                <p className="text-[11px] text-primary/90 mt-1.5">🔒 Locked bonus: {locked.toFixed(2)} USDT</p>
              )}
            </div>
          </div>
        </div>

        {/* X Coin panel — dark premium gold-trim */}
        <div className="px-4">
          <div
            className="relative rounded-2xl p-5 overflow-hidden cat-3d"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(220px 160px at 15% 50%, hsl(43 96% 56% / 0.25), transparent 70%)",
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: "var(--gradient-gold)" }} />
                <img src={XCOIN_IMG} alt="X Coin" className="relative h-16 w-16 object-contain drop-shadow-[0_4px_12px_rgba(255,180,40,0.5)]"/>
              </div>
              <div className="flex-1">
                <p className="text-foreground/90 font-semibold text-base leading-tight">Total X Coin</p>
                <p className="text-3xl font-heading font-extrabold mt-1 text-gradient-gold">{xcoin.toFixed(1)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setInfoOpen(true)} className="h-8 w-8 rounded-full flex items-center justify-center text-primary-foreground shadow-[0_4px_0_hsl(0_0%_2%),0_8px_18px_hsl(0_0%_0%/0.5)] active:translate-y-[2px] transition"
                    style={{ background: "var(--gradient-gold)" }}>
                    <Info className="h-4 w-4"/>
                  </button>
                  <button onClick={() => setConvertOpen(true)} className="px-4 py-1.5 rounded-lg text-primary-foreground font-bold text-sm shadow-[0_4px_0_hsl(0_0%_2%),0_8px_18px_hsl(0_0%_0%/0.5)] active:translate-y-[2px] transition"
                    style={{ background: "var(--gradient-gold)" }}>
                    Convert
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-tight">transfer main<br/>wallet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two cards — premium dark with gold trim */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/redeem-xcoin")} className="cat-3d rounded-2xl overflow-hidden text-left">
            <div className="h-32 flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, hsl(0 70% 45%), hsl(15 80% 40%))" }}>
              <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(circle at 30% 30%, hsl(43 96% 56% / 0.4), transparent 60%)" }} />
              <span className="text-6xl relative drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">🧧</span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm flex items-center gap-1 text-gradient-gold">
                <img src={XCOIN_IMG} className="h-4 w-4"/> Redeem X Coin
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-1">Enter the redemption code to receive gift rewards</p>
            </div>
          </button>
          <button onClick={() => navigate("/attendance")} className="cat-3d rounded-2xl overflow-hidden text-left">
            <div className="h-32 flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, hsl(35 100% 45%), hsl(43 96% 56%))" }}>
              <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 70% 30%, hsl(0 0% 100% / 0.4), transparent 60%)" }} />
              <span className="text-6xl relative drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">📅</span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm text-gradient-gold">Attendance bonus</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-1">The more consecutive days you sign in, the higher the reward will be.</p>
            </div>
          </button>
        </div>
      </main>


      {/* Info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>X Coin info</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Market price: <span className="font-bold text-primary">1 USDT = {xcoinPerUsdt} X Coin</span></p>
            <p>Minimum convert: <span className="font-bold text-primary">{minConvert} X Coin</span></p>
            <p className="text-muted-foreground text-xs">{settings.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Convert X Coin → USDT</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Available: <span className="text-foreground font-semibold">{xcoin.toFixed(2)} X Coin</span></p>
            <p className="text-xs text-muted-foreground">Rate: {xcoinPerUsdt} X Coin = 1 USDT</p>
            <input value={convAmt} onChange={e => setConvAmt(e.target.value)} type="number" placeholder="X Coin amount"
              className="w-full px-3 py-2 rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:border-primary"/>
            <p className="text-sm">You'll receive: <span className="font-bold text-primary">{(Number(convAmt || 0) / xcoinPerUsdt).toFixed(4)} USDT</span></p>
            <Button onClick={convert} disabled={submitting} className="w-full bg-gradient-gold text-primary-foreground">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Convert"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Wallet;
