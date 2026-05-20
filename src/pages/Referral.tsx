import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Copy, Download, Send, MessageCircle, Loader2, Megaphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type InviteCfg = {
  amount: number; currency: "USDT" | "INR" | "BDT";
  min_deposit: number; min_deposit_currency: "USDT" | "INR" | "BDT";
  required_invites: number; image_url: string;
};

const DEFAULT_CFG: InviteCfg = {
  amount: 100, currency: "INR", min_deposit: 10, min_deposit_currency: "USDT",
  required_invites: 1, image_url: "",
};

const Referral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [cfg, setCfg] = useState<InviteCfg>(DEFAULT_CFG);
  const [referred, setReferred] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const [{ data: prof }, { data: c }, { data: kids }, { data: cl }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "invite_bonus").maybeSingle(),
      supabase.from("profiles").select("user_id, full_name, email").eq("referred_by", user.id),
      supabase.from("referral_claims").select("*").eq("user_id", user.id),
    ]);
    setProfile(prof);
    if (c?.value) setCfg({ ...DEFAULT_CFG, ...(c.value as any) });
    setReferred(kids || []);
    setClaims(cl || []);

    // compute eligible deposited members
    if (kids && kids.length) {
      const ids = kids.map(k => k.user_id);
      const { data: deps } = await supabase.from("deposits").select("user_id, amount_usdt").in("user_id", ids);
      const minUsdt = (c?.value as any)?.min_deposit_currency === "USDT" ? (c?.value as any)?.min_deposit : (c?.value as any)?.min_deposit / 83;
      const depMap: Record<string, number> = {};
      (deps || []).forEach((d: any) => { depMap[d.user_id] = (depMap[d.user_id] || 0) + Number(d.amount_usdt || 0); });
      (kids as any[]).forEach(k => { k._deposited = depMap[k.user_id] || 0; k._eligible = (depMap[k.user_id] || 0) >= (minUsdt || 0); });
      setReferred([...kids]);
    }
    setLoading(false);
  };

  const code = profile?.referral_code || "—";
  const shareLink = `${window.location.origin}/register?ref=${code}`;
  const username = profile?.full_name || profile?.email?.split("@")[0] || "User";
  const eligibleCount = referred.filter(r => r._eligible).length;
  const claimedIds = new Set(claims.map(c => c.claimed_user_id));
  const claimableUsers = referred.filter(r => r._eligible && !claimedIds.has(r.user_id));
  const totalReferrals = referred.length;
  const totalCommission = claims.reduce((s, c) => s + Number(c.amount_usdt || 0), 0);
  const claimableAmount = claimableUsers.length * cfg.amount;
  const requiredRemaining = Math.max(0, cfg.required_invites - eligibleCount);

  const copy = (txt: string, label: string) => { navigator.clipboard.writeText(txt); toast({ title: `${label} copied` }); };

  const claim = async () => {
    if (!profile) return;
    if (eligibleCount < cfg.required_invites) {
      return toast({ title: "Not eligible yet", description: `Need ${cfg.required_invites} qualified invites (current: ${eligibleCount})`, variant: "destructive" });
    }
    if (!claimableUsers.length) return toast({ title: "Nothing to claim" });
    setClaiming(true);
    const amtUsdt = cfg.currency === "USDT" ? cfg.amount : cfg.currency === "INR" ? cfg.amount / 83 : cfg.amount / 110;
    const rows = claimableUsers.map(u => ({ user_id: profile.user_id, claimed_user_id: u.user_id, amount_usdt: amtUsdt }));
    const { error } = await supabase.from("referral_claims").insert(rows);
    if (!error) {
      await supabase.from("profiles").update({ balance_usdt: Number(profile.balance_usdt || 0) + amtUsdt * rows.length }).eq("user_id", profile.user_id);
      toast({ title: "Bonus claimed!", description: `${rows.length} × ${cfg.amount} ${cfg.currency}` });
      await load();
    } else toast({ title: "Claim failed", description: error.message, variant: "destructive" });
    setClaiming(false);
  };

  const cur = cfg.currency === "INR" ? "₹" : cfg.currency === "BDT" ? "৳" : "";
  const inviteLabel = `Earn ${cur}${cfg.amount}${cfg.currency === "USDT" ? " USDT" : ""} per Successful Invite`;

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-14">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5"/></button>
          <h1 className="font-semibold flex-1 text-center pr-5">Affiliate</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary"/></div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Stats card */}
            <div className="rounded-2xl bg-gradient-to-br from-card to-secondary border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center">
                  <img src={profile?.avatar_url || ""} alt="" className="h-12 w-12 rounded-lg object-cover" onError={(e: any) => e.target.style.display = "none"}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{username}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-gold text-primary-foreground">Rank 1</span>
                </div>
              </div>
              <div className="grid grid-cols-3 mt-4 pt-4 border-t border-border text-center">
                <Stat label="Total Commission" value={`${cur}${totalCommission.toFixed(2)}`}/>
                <Stat label="Claimable" value={`${cur}${claimableAmount.toFixed(2)}`} accent/>
                <Stat label="Total Referrals" value={String(totalReferrals)}/>
              </div>
              <Button onClick={claim} disabled={claiming || !claimableUsers.length} className="w-full mt-4 bg-gradient-gold text-primary-foreground font-bold rounded-full">
                {claiming ? <Loader2 className="h-4 w-4 animate-spin"/> : inviteLabel}
              </Button>
            </div>

            {/* Progress */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Invite progress</span>
                <span className="text-primary font-semibold">{eligibleCount}/{cfg.required_invites}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-gold" style={{ width: `${Math.min(100, (eligibleCount / Math.max(1, cfg.required_invites)) * 100)}%` }}/>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {requiredRemaining > 0
                  ? `Invite ${requiredRemaining} more friend(s) who deposit at least ${cfg.min_deposit_currency === "INR" ? "₹" : cfg.min_deposit_currency === "BDT" ? "৳" : ""}${cfg.min_deposit}${cfg.min_deposit_currency === "USDT" ? " USDT" : ""} to unlock the bonus.`
                  : <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3"/> Requirement complete — claim now!</span>}
              </p>
            </div>

            {/* Code + Image card */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex gap-3">
                <div className="w-28 h-36 rounded-lg overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center">
                  {cfg.image_url ? <img src={cfg.image_url} alt="" className="w-full h-full object-cover"/> : <Megaphone className="h-8 w-8 text-muted-foreground"/>}
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="bg-secondary border border-border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Referral Code</p>
                    <button onClick={() => copy(code, "Code")} className="w-full mt-1 flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-primary truncate">{code}</span>
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0"/>
                    </button>
                  </div>
                  <div className="bg-secondary border border-border rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Share Link</p>
                    <button onClick={() => copy(shareLink, "Link")} className="w-full mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs truncate">{shareLink}</span>
                      <Copy className="h-4 w-4 text-muted-foreground shrink-0"/>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4">
                <ShareBtn icon={Download} onClick={() => copy(shareLink, "Link")}/>
                <ShareBtn icon={Send} onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}`, "_blank")}/>
                <ShareBtn icon={MessageCircle} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareLink)}`, "_blank")}/>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <Megaphone className="h-3 w-3"/> {inviteLabel}
              </p>
            </div>

            {/* Referred list */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-2">My Invitees ({referred.length})</h3>
              {referred.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No invitees yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {referred.map(r => (
                    <div key={r.user_id} className="flex items-center justify-between bg-secondary border border-border rounded-lg p-2">
                      <div className="min-w-0">
                        <p className="text-sm truncate">{r.full_name || r.email?.split("@")[0]}</p>
                        <p className="text-[10px] text-muted-foreground">Deposited: {(r._deposited || 0).toFixed(2)} USDT</p>
                      </div>
                      {claimedIds.has(r.user_id) ? <span className="text-[10px] text-success">Claimed</span>
                        : r._eligible ? <span className="text-[10px] text-primary">Eligible</span>
                        : <span className="text-[10px] text-muted-foreground">Pending</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

const Stat = ({ label, value, accent }: any) => (
  <div>
    <p className={`text-lg font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

const ShareBtn = ({ icon: Icon, onClick }: any) => (
  <button onClick={onClick} className="h-11 w-11 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary hover:bg-primary/10">
    <Icon className="h-5 w-5"/>
  </button>
);

export default Referral;
