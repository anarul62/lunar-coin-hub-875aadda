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
} from "lucide-react";
import { getUsdInrRate, usdtToInr } from "@/lib/currency";

const AVATARS = [
  72, 20, 10, 13, 2, 36, 1, 4, 5, 44, 28, 67, 3, 66, 34,
].map(n => `https://aviator-demo.spribegaming.com/assets/static/avatars/v2/av-${n}.png`);

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  balance_usdt: number;
  locked_bonus_usdt: number;
  preferred_currency: string;
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
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
    setProfile(prof as any);
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
    navigator.clipboard.writeText(profile.user_id);
    toast({ title: "ID copied" });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Navbar />
        <main className="pt-14 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary"/>
        </main>
        <BottomNav />
      </div>
    );
  }

  const totalUsdt = Number(profile.balance_usdt) + Number(profile.locked_bonus_usdt);
  const displayBal = showInr ? `₹${usdtToInr(totalUsdt, rate).toFixed(2)}` : `${totalUsdt.toFixed(4)} USDT`;
  const username = profile.full_name || profile.email?.split("@")[0] || "User";
  const last = new Date().toISOString().replace("T", " ").slice(0, 19);
  const kycVerified = kycStatus === "approved";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <main className="pt-14">
        {/* Header */}
        <div className="bg-gradient-to-br from-rose-400 to-orange-400 px-4 pt-5 pb-16 relative">
          <div className="flex items-start gap-3">
            <button onClick={() => setAvatarOpen(true)} className="relative shrink-0">
              <img
                src={profile.avatar_url || AVATARS[0]}
                alt="avatar"
                className="h-20 w-20 rounded-full border-4 border-white object-cover bg-white"
              />
              <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow">
                <Camera className="h-3.5 w-3.5 text-rose-500"/>
              </span>
            </button>
            <div className="flex-1 min-w-0 text-white">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold truncate">{username}</span>
                {kycVerified && (
                  <span title="KYC Verified" className="inline-flex items-center gap-0.5 text-xs font-semibold bg-white/25 backdrop-blur px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200"/>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  <Crown className="h-3 w-3"/> VIP0
                </span>
              </div>
              <button onClick={copyId} className="mt-1 inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded">
                {profile.phone || "+91XXXXXXXX"} <Copy className="h-3 w-3"/>
              </button>
              <p className="text-[11px] mt-1 opacity-90">Last login: {last}</p>
            </div>
          </div>
        </div>

        {/* Wallet card */}
        <section className="px-4 -mt-12">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">Total balance</p>
                <p className="font-heading text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  {displayBal}
                  <button onClick={() => setShowInr(s => !s)} className="text-slate-400 hover:text-slate-600">
                    <RefreshCw className="h-4 w-4"/>
                  </button>
                </p>
                {profile.locked_bonus_usdt > 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    🔒 Locked bonus: {Number(profile.locked_bonus_usdt).toFixed(2)} USDT (deposit to unlock)
                  </p>
                )}
              </div>
              <Button onClick={() => navigate("/wallet")} className="rounded-full bg-rose-500 hover:bg-rose-600 text-white">
                Enter wallet
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-2 text-center">
              <ActionTile icon={Wallet} label="Wallet" color="bg-orange-100 text-orange-600" onClick={() => navigate("/wallet")}/>
              <ActionTile icon={ArrowDownToLine} label="Deposit" color="bg-blue-100 text-blue-600" onClick={() => navigate("/wallet")}/>
              <ActionTile icon={ArrowUpFromLine} label="Withdraw" color="bg-emerald-100 text-emerald-600" onClick={() => setConvertOpen(true)}/>
              <ActionTile icon={Crown} label="VIP" color="bg-violet-100 text-violet-600" onClick={() => toast({ title: "VIP coming soon" })}/>
            </div>
          </div>
        </section>

        {/* History grid */}
        <section className="px-4 mt-4 grid grid-cols-2 gap-3">
          <CardTile icon={FileText} title="plan History" sub="My game history" tint="bg-blue-100 text-blue-600"/>
          <CardTile icon={History} title="Transaction" sub="My transaction history" tint="bg-emerald-100 text-emerald-600"/>
          <CardTile icon={ArrowDownToLine} title="Deposit" sub="My deposit history" tint="bg-rose-100 text-rose-500"/>
          <CardTile icon={ArrowUpFromLine} title="Withdraw" sub="My withdraw history" tint="bg-orange-100 text-orange-500"/>
        </section>

        {/* KYC strip */}
        <section className="px-4 mt-4">
          <button onClick={() => setKycOpen(true)} className="w-full flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${kycVerified ? "text-emerald-500" : "text-amber-500"}`}/>
              <span className="text-sm font-medium text-slate-900">
                {kycVerified ? "KYC Verified" : kycStatus === "pending" ? "KYC Under Review" : "Complete KYC"}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400"/>
          </button>
        </section>

        {/* Service center */}
        <section className="px-4 mt-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Service center</h3>
          <div className="grid grid-cols-3 gap-y-5">
            <Service icon={SettingsIcon} label="Settings"/>
            <Service icon={MessageSquare} label="Feedback"/>
            <Service icon={Megaphone} label="Announcement"/>
            <Service icon={Headphones} label="Customer Service"/>
            <Service icon={BookOpen} label="Beginner's Guide"/>
            <Service icon={Info} label="About us"/>
          </div>
        </section>

        <div className="px-4 mt-6">
          <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} className="w-full">
            Log out
          </Button>
        </div>
      </main>

      {/* Avatar picker */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-md">
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

      {/* Convert dialog */}
      <ConvertDialog open={convertOpen} onOpenChange={setConvertOpen} usdt={Number(profile.balance_usdt)} rate={rate}/>

      <KycModal open={kycOpen} onOpenChange={setKycOpen}/>
      <BottomNav />
    </div>
  );
};

const ActionTile = ({ icon: Icon, label, color, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="h-5 w-5"/></div>
    <span className="text-[11px] text-slate-700">{label}</span>
  </button>
);

const CardTile = ({ icon: Icon, title, sub, tint }: any) => (
  <button className="bg-white rounded-xl p-3 flex items-start gap-3 shadow-sm border border-slate-100 text-left">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${tint}`}><Icon className="h-5 w-5"/></div>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
      <p className="text-[11px] text-slate-500 leading-tight">{sub}</p>
    </div>
  </button>
);

const Service = ({ icon: Icon, label }: any) => (
  <button className="flex flex-col items-center gap-1.5">
    <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center"><Icon className="h-5 w-5"/></div>
    <span className="text-[11px] text-slate-600 text-center">{label}</span>
  </button>
);

const ConvertDialog = ({ open, onOpenChange, usdt, rate }: { open: boolean; onOpenChange: (v: boolean) => void; usdt: number; rate: number }) => {
  const [amt, setAmt] = useState("");
  const inr = Number(amt || 0) * rate;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Convert USDT → INR</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-slate-600">Available: <span className="font-semibold">{usdt.toFixed(4)} USDT</span></div>
          <div className="text-xs text-slate-500">Live rate: 1 USDT = ₹{rate.toFixed(2)}</div>
          <input value={amt} onChange={e => setAmt(e.target.value)} type="number" min={0} max={usdt} placeholder="USDT amount"
            className="w-full px-3 py-2 rounded-md border border-slate-200 outline-none focus:ring-2 focus:ring-rose-300"/>
          <div className="text-sm">You'll receive: <span className="font-semibold">₹{inr.toFixed(2)}</span></div>
          <Button onClick={() => { toast({ title: "Conversion requested", description: `${amt} USDT → ₹${inr.toFixed(2)}` }); onOpenChange(false); }} className="w-full bg-rose-500 hover:bg-rose-600">
            Convert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Profile;
