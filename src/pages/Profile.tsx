import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import KycModal from "@/components/KycModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Copy, CheckCircle2, Wallet, ArrowDownToLine, ArrowUpFromLine, Crown,
  FileText, History, Settings as SettingsIcon, MessageSquare, Megaphone,
  Headphones, BookOpen, Info, RefreshCw, ChevronRight, ShieldCheck, Camera, Loader2,
  LogOut,
} from "lucide-react";
import { getUsdInrRate, usdtToInr } from "@/lib/currency";

const AVATARS = [72, 20, 10, 13, 2, 36, 1, 4, 5, 44, 28, 67, 3, 66, 34]
  .map(n => `https://aviator-demo.spribegaming.com/assets/static/avatars/v2/av-${n}.png`);

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [rate, setRate] = useState(83);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [showInr, setShowInr] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const [{ data: prof }, { data: kyc }, r] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("kyc_requests").select("status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      getUsdInrRate(),
    ]);
    if (!prof) {
      // create empty profile fallback
      const { data: created } = await supabase.from("profiles").insert({ user_id: user.id, email: user.email }).select().maybeSingle();
      setProfile(created);
    } else {
      setProfile(prof);
    }
    setKycStatus((kyc?.[0]?.status as any) || "none");
    setRate(r);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const pickAvatar = async (url: string) => {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", profile.user_id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setProfile({ ...profile, avatar_url: url });
    setAvatarOpen(false);
    toast({ title: "Avatar updated" });
  };

  const copyId = () => {
    if (!profile) return;
    navigator.clipboard.writeText(profile.referral_code || profile.user_id);
    toast({ title: "Copied" });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Navbar />
        <main className="pt-14 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
        <BottomNav />
      </div>
    );
  }

  const bal = Number(profile.balance_usdt || 0);
  const locked = Number(profile.locked_bonus_usdt || 0);
  const totalUsdt = bal + locked;
  const displayBal = showInr ? `₹${usdtToInr(totalUsdt, rate).toFixed(2)}` : `${totalUsdt.toFixed(4)} USDT`;
  const username = profile.full_name || profile.email?.split("@")[0] || "User";
  const kycVerified = kycStatus === "approved";

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-14">
        {/* Header */}
        <div className="relative px-4 pt-5 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"/>
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"/>
          <div className="relative flex items-start gap-3">
            <button onClick={() => setAvatarOpen(true)} className="relative shrink-0">
              <div className="p-[2px] rounded-full bg-gradient-gold">
                <img src={profile.avatar_url || AVATARS[0]} alt="" className="h-20 w-20 rounded-full object-cover bg-secondary"/>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow">
                <Camera className="h-3.5 w-3.5"/>
              </span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold truncate text-foreground">{username}</span>
                {kycVerified && (
                  <span title="KYC Verified" className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-success/15 text-success px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="h-3 w-3"/> Verified
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                  <Crown className="h-3 w-3"/> VIP0
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{profile.phone || "Phone not set"}</p>
              <button onClick={copyId} className="mt-1 inline-flex items-center gap-1 text-[11px] bg-secondary border border-border px-2 py-0.5 rounded text-foreground/80">
                Code: <span className="font-mono text-primary">{profile.referral_code || "—"}</span> <Copy className="h-3 w-3"/>
              </button>
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <section className="px-4 -mt-14 relative">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total balance</p>
                <p className="font-heading text-2xl font-bold mt-1 flex items-center gap-2 text-gradient-gold">
                  {displayBal}
                  <button onClick={() => setShowInr(s => !s)} className="text-muted-foreground hover:text-primary">
                    <RefreshCw className="h-4 w-4"/>
                  </button>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Available: <span className="text-foreground/80">{bal.toFixed(4)} USDT</span>
                </p>
                {locked > 0 && (
                  <p className="text-[11px] text-primary/90 mt-0.5">🔒 Locked bonus: {locked.toFixed(2)} USDT</p>
                )}
              </div>
              <Button onClick={() => navigate("/wallet")} className="rounded-full bg-gradient-gold text-primary-foreground hover:opacity-90 shrink-0">
                Wallet
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-4 gap-2 text-center">
              <ActionTile icon={Wallet} label="Wallet" onClick={() => navigate("/wallet")}/>
              <ActionTile icon={ArrowDownToLine} label="Deposit" onClick={() => navigate("/deposit")}/>
              <ActionTile icon={ArrowUpFromLine} label="Withdraw" onClick={() => setConvertOpen(true)}/>
              <ActionTile icon={Crown} label="VIP" onClick={() => toast({ title: "VIP coming soon" })}/>
            </div>
          </div>
        </section>

        {/* History grid */}
        <section className="px-4 mt-4 grid grid-cols-2 gap-3">
          <CardTile icon={FileText} title="Plan History" sub="My game history"/>
          <CardTile icon={History} title="Transactions" sub="My transaction history"/>
          <div onClick={() => navigate("/deposit/history")} className="cursor-pointer"><CardTile icon={ArrowDownToLine} title="Deposit" sub="My deposit history"/></div>
          <CardTile icon={ArrowUpFromLine} title="Withdraw" sub="My withdraw history"/>
        </section>

        {/* KYC strip */}
        <section className="px-4 mt-4">
          <button onClick={() => setKycOpen(true)} className="w-full flex items-center justify-between bg-card rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${kycVerified ? "text-success" : "text-primary"}`}/>
              <span className="text-sm font-medium">
                {kycVerified ? "KYC Verified" : kycStatus === "pending" ? "KYC Under Review" : "Complete KYC"}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground"/>
          </button>
        </section>

        {/* Service center */}
        <section className="px-4 mt-5">
          <h3 className="text-sm font-semibold mb-3">Service Center</h3>
          <div className="grid grid-cols-3 gap-y-5">
            <Service icon={SettingsIcon} label="Settings"/>
            <Service icon={MessageSquare} label="Feedback"/>
            <Service icon={Megaphone} label="Announcement"/>
            <Service icon={Headphones} label="Support"/>
            <Service icon={BookOpen} label="Guide"/>
            <Service icon={Info} label="About us"/>
          </div>
        </section>

        <div className="px-4 mt-6">
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full border-border">
            <LogOut className="h-4 w-4 mr-2"/> Log out
          </Button>
        </div>
      </main>

      {/* Avatar picker */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Choose Avatar</DialogTitle></DialogHeader>
          <div className="grid grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
            {AVATARS.map(url => (
              <button key={url} onClick={() => pickAvatar(url)} className={`rounded-full overflow-hidden border-2 ${profile.avatar_url === url ? "border-primary" : "border-transparent"}`}>
                <img src={url} alt="" className="w-full aspect-square object-cover bg-secondary"/>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConvertDialog open={convertOpen} onOpenChange={setConvertOpen} usdt={bal} rate={rate}/>
      <KycModal open={kycOpen} onOpenChange={setKycOpen}/>
      <BottomNav />
    </div>
  );
};

const ActionTile = ({ icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1">
    <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary"><Icon className="h-5 w-5"/></div>
    <span className="text-[11px] text-foreground/80">{label}</span>
  </button>
);

const CardTile = ({ icon: Icon, title, sub }: any) => (
  <button className="bg-card border border-border rounded-xl p-3 flex items-start gap-3 text-left">
    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5"/></div>
    <div className="min-w-0">
      <p className="text-sm font-semibold truncate">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{sub}</p>
    </div>
  </button>
);

const Service = ({ icon: Icon, label }: any) => (
  <button className="flex flex-col items-center gap-1.5">
    <div className="h-10 w-10 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center"><Icon className="h-5 w-5"/></div>
    <span className="text-[11px] text-muted-foreground text-center">{label}</span>
  </button>
);

const ConvertDialog = ({ open, onOpenChange, usdt, rate }: any) => {
  const [amt, setAmt] = useState("");
  const inr = Number(amt || 0) * rate;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader><DialogTitle>Convert USDT → INR</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Available: <span className="text-foreground font-semibold">{usdt.toFixed(4)} USDT</span></div>
          <div className="text-xs text-muted-foreground">Rate: 1 USDT = ₹{rate.toFixed(2)}</div>
          <input value={amt} onChange={e => setAmt(e.target.value)} type="number" min={0} max={usdt} placeholder="USDT amount"
            className="w-full px-3 py-2 rounded-md border border-border bg-secondary text-foreground focus:outline-none focus:border-primary"/>
          <div className="text-sm">You'll receive: <span className="font-semibold text-primary">₹{inr.toFixed(2)}</span></div>
          <Button onClick={() => { toast({ title: "Conversion requested", description: `${amt} USDT → ₹${inr.toFixed(2)}` }); onOpenChange(false); }} className="w-full bg-gradient-gold text-primary-foreground">
            Convert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Profile;
