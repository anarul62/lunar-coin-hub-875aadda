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
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-14">
        {/* Total balance card */}
        <div className="relative px-4 pt-4 pb-6">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
            <p className="text-xs text-muted-foreground">Total balance</p>
            <p className="font-heading text-3xl font-bold mt-1 flex items-center gap-2 text-gradient-gold">
              {display}
              <button onClick={() => setShowLocal(s => !s)} className="text-muted-foreground hover:text-primary">
                <RefreshCw className="h-4 w-4"/>
              </button>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Available: {bal.toFixed(4)} USDT</p>
            {locked > 0 && <p className="text-[11px] text-primary/90 mt-0.5">🔒 Locked bonus: {locked.toFixed(2)} USDT</p>}
          </div>
        </div>

        {/* X Coin panel - cyan */}
        <div className="px-4">
          <div className="rounded-2xl p-5" style={{ backgroundColor: "#b9eaf6" }}>
            <div className="flex items-center gap-3">
              <img src={XCOIN_IMG} alt="X Coin" className="h-16 w-16 object-contain"/>
              <div className="flex-1">
                <p className="text-slate-900 font-bold text-lg leading-tight">Total x coin</p>
                <p className="text-slate-900 text-3xl font-extrabold mt-1">{xcoin.toFixed(1)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setInfoOpen(true)} className="h-7 w-7 rounded-full bg-blue-400 flex items-center justify-center text-white shadow">
                    <Info className="h-4 w-4"/>
                  </button>
                  <button onClick={() => setConvertOpen(true)} className="px-4 py-1.5 bg-yellow-400 rounded-lg text-slate-900 font-bold shadow text-sm">
                    Convert
                  </button>
                </div>
                <p className="text-[10px] text-slate-700 text-center leading-tight">transfer main<br/>wallet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Two cards */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/redeem-xcoin")} className="bg-card border border-border rounded-2xl overflow-hidden text-left">
            <div className="h-32 bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
              <img src="https://i.ibb.co/3v8y5sJ/redpacket.png" onError={(e:any) => e.target.style.display='none'} className="h-24 object-contain" alt=""/>
              <span className="text-6xl">🧧</span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm flex items-center gap-1">
                <img src={XCOIN_IMG} className="h-4 w-4"/> Redeem X Coin
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-1">Enter the redemption code to receive gift rewards</p>
            </div>
          </button>
          <button onClick={() => navigate("/attendance")} className="bg-card border border-border rounded-2xl overflow-hidden text-left">
            <div className="h-32 bg-gradient-to-br from-orange-300 to-rose-400 flex items-center justify-center">
              <span className="text-6xl">📅</span>
            </div>
            <div className="p-3">
              <p className="font-bold text-sm">Attendance bonus</p>
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
