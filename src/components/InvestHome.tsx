import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, TrendingUp, Coins, Gem, ShieldCheck, FileBadge,
  Wallet, Sparkles, BarChart3, Lock, ChevronRight, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BannerSlider from "@/components/BannerSlider";
import KycModal from "@/components/KycModal";
import { supabase } from "@/integrations/supabase/client";

const tabs = ["Gold & Silver", "Crypto", "Plans"];

const categories = [
  { icon: Coins, label: "Gold Invest", tag: "Hot", path: "/invest/gold" },
  { icon: Gem, label: "Silver Invest", tag: null, path: "/invest/silver" },
  { icon: ShieldCheck, label: "KYC", tag: null, path: null },
  { icon: BarChart3, label: "Plans", tag: "12%+", path: "/plan-history" },
  { icon: Wallet, label: "Wallet", tag: null, path: "/wallet" },
  { icon: FileBadge, label: "Reports", tag: null, path: "/plan-history" },
  { icon: Sparkles, label: "Rewards", tag: "New", path: "/rewards" },
  { icon: Lock, label: "Vault", tag: null, path: null },
];

const newlyLaunched = [
  { name: "Gold Saver+", risk: "AA · Low Risk", roi: "11%", tenure: "12 Months", min: "₹98.1K", badge: "New" },
  { name: "Silver Plus", risk: "A · Low Risk", roi: "9.5%", tenure: "9 Months", min: "₹50K", badge: "New" },
];

const publicListed = [
  { name: "DAR Credit", grade: "BBB- (Moderate Risk)", roi: "13.65%", tenure: "28 Months", min: "₹9,940" },
];

const under10k = [
  { name: "Indel", grade: "A- (Low Risk)", roi: "9%", tenure: "3 Months", min: "₹10.0K" },
];

const sellingFast = [
  { name: "Capri Global", grade: "AA (Very Low Risk)", roi: "9%", tenure: "11 Months", min: "₹1,052" },
];

const allList = [
  { name: "Gold Saver+", risk: "AA · Low Risk", roi: "11%", tenure: "12 Months", min: "₹98.1K", badge: "New" },
  { name: "Silver Plus", risk: "A · Low Risk", roi: "11.75%", tenure: "13 Months", min: "₹1.9L", badge: "New" },
  { name: "Unifin Capital", risk: "BBB · Moderate Risk", roi: "14.25%", tenure: "23 Months", min: "₹9,886", badge: null },
];

const InvestHome = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [kycOpen, setKycOpen] = useState(false);
  const [liveLaunched, setLiveLaunched] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [{ data: ip }, { data: lp }, { data: chans }] = await Promise.all([
        supabase.from("invest_plans").select("id,name,image_url,interest_value,interest_period,duration_days,min_amount,currency,channel_id,created_at").eq("enabled", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("lottery_plans").select("id,name,image_url,ticket_price,currency,total_tickets,draw_at,channel_id,created_at,hide_after_seconds").eq("enabled", true).order("created_at", { ascending: false }).limit(6),
        supabase.from("invest_channels").select("id,key,name"),
      ]);
      const chanMap: Record<string, any> = {};
      (chans || []).forEach((c: any) => { chanMap[c.id] = c; });
      const inv = ((ip as any[]) || []).map((p) => ({
        kind: "invest" as const,
        id: p.id,
        name: p.name,
        image_url: p.image_url,
        risk: `${chanMap[p.channel_id]?.name || "Invest"} · ${p.duration_days}d`,
        roi: `${Number(p.interest_value || 0)}%/${p.interest_period}`,
        tenure: `${p.duration_days} Days`,
        min: `${p.currency === "INR" ? "₹" : p.currency === "USDT" ? "$" : ""}${Number(p.min_amount || 0)}`,
        path: `/invest/${chanMap[p.channel_id]?.key || ""}`,
        created_at: p.created_at,
      }));
      const lot = ((lp as any[]) || [])
        .filter((p) => new Date(p.draw_at).getTime() + (Number(p.hide_after_seconds || 10) * 1000) > Date.now())
        .map((p) => ({
          kind: "lottery" as const,
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          risk: "Lottery",
          roi: `${p.total_tickets} Tickets`,
          tenure: "Live Draw",
          min: `${p.currency === "BDT" ? "৳" : p.currency === "INR" ? "₹" : p.currency === "USDT" ? "$" : "💎"}${Number(p.ticket_price || 0)}`,
          path: `/lottery/${p.id}/tickets`,
          created_at: p.created_at,
        }));
      const combined = [...inv, ...lot].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      setLiveLaunched(combined);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);


  return (
    <div className="pb-20">
      {/* Search */}
      <div className="px-4 pt-3 pb-3 sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search by Name, Symbol, Category"
            className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-5 mt-3 px-1 text-sm font-medium overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Admin-managed sliding banners */}
      <BannerSlider />

      {/* Categories grid */}
      <section className="px-4 pt-6">
        <h2 className="font-heading text-lg font-bold mb-3 text-foreground">Categories</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {categories.map((c) => (
            <button
              key={c.label}
              onClick={() => { if (c.label === "KYC") setKycOpen(true); else if (c.path) navigate(c.path); }}
              className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl bg-card border border-border py-3 px-1 hover:border-primary/30 transition-colors"
            >
              {c.tag && (
                <span className="absolute -top-1.5 right-1 px-1.5 py-0.5 rounded bg-gradient-gold text-primary-foreground text-[8px] font-bold">
                  {c.tag}
                </span>
              )}
              <div className="h-9 w-9 rounded-full bg-gradient-gold-subtle border border-primary/20 flex items-center justify-center">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Newly Launched */}
      <Section title="Newly Launched">
        <div className="space-y-3">
          {newlyLaunched.map((it) => <ProductCard key={it.name} item={it} />)}
        </div>
      </Section>

      {/* Promo banner */}
      <section className="px-4 mt-5">
        <div className="rounded-2xl border border-primary/30 bg-gradient-gold-subtle p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Diversify your portfolio</p>
            <p className="text-xs text-muted-foreground">with curated baskets</p>
            <button className="mt-2 text-xs font-semibold text-primary inline-flex items-center gap-1">
              Explore Now <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="h-14 w-14 rounded-xl bg-gradient-gold flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </section>

      <Section title="Public Listed Issuers">
        <div className="space-y-3">
          {publicListed.map((it) => <ProductCard key={it.name} item={{ ...it, badge: null, risk: it.grade }} listed />)}
        </div>
      </Section>

      <Section title="Under 10k">
        <div className="space-y-3">
          {under10k.map((it) => <ProductCard key={it.name} item={{ ...it, badge: null, risk: it.grade }} />)}
        </div>
      </Section>

      {/* Stats banner */}
      <section className="px-4 mt-6">
        <div className="rounded-xl border border-border bg-card py-4 text-center">
          <p className="font-heading text-xl font-bold text-gradient-gold">₹ 3,000 Cr +</p>
          <p className="text-xs text-muted-foreground">Investments Enabled</p>
        </div>
      </section>

      <Section title="Selling Fast">
        <div className="space-y-3">
          {sellingFast.map((it) => <ProductCard key={it.name} item={{ ...it, badge: null, risk: it.grade }} listed />)}
        </div>
      </Section>

      {/* Sell Anytime banner */}
      <section className="px-4 mt-5">
        <div className="rounded-xl bg-gradient-gold-subtle border border-primary/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Sell Anytime</span>
          </div>
          <span className="text-xs text-muted-foreground">Buy, Hold, or Sell</span>
        </div>
      </section>

      <Section title="All">
        <div className="space-y-3">
          {allList.map((it) => <ProductCard key={it.name} item={it} />)}
        </div>
        <Button variant="outline" className="w-full mt-4 border-primary/30 text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Section>

      {/* Why invest */}
      <section className="px-4 mt-8">
        <h2 className="font-heading text-lg font-bold mb-3 text-foreground">Why Invest with Us?</h2>
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {[
            { icon: ShieldCheck, t: "Portfolio Diversification", d: "Reduce market volatility with stable investing" },
            { icon: TrendingUp, t: "High Yield Returns", d: "Up to 25% annual returns across plans" },
            { icon: Lock, t: "Bank-Grade Security", d: "Your assets stay fully protected, always" },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-gold-subtle border border-primary/20 flex items-center justify-center shrink-0">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.t}</p>
                <p className="text-xs text-muted-foreground">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KYC bottom CTA */}
      <section id="wallet" className="px-4 mt-6">
        <div className="rounded-2xl bg-gradient-gold text-primary-foreground p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Is investment ready by completing your KYC</p>
            <p className="text-xs opacity-80">Quick 2-minute verification</p>
          </div>
          <Button onClick={() => setKycOpen(true)} className="bg-background text-primary font-semibold hover:bg-background/90 shrink-0">
            Start KYC
          </Button>
        </div>
      </section>
      <KycModal open={kycOpen} onOpenChange={setKycOpen} />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="px-4 mt-6">
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
      <button className="text-xs font-semibold text-primary inline-flex items-center gap-1">
        View All <ChevronRight className="h-3 w-3" />
      </button>
    </div>
    {children}
  </section>
);

const ProductCard = ({
  item,
  listed,
}: {
  item: { name: string; risk: string; roi: string; tenure: string; min: string; badge?: string | null };
  listed?: boolean;
}) => (
  <div className="rounded-2xl border border-border bg-card overflow-hidden">
    {item.badge && (
      <div className="bg-gradient-gold-subtle border-b border-primary/20 px-3 py-1 text-[10px] font-bold text-primary inline-block rounded-br-lg">
        ★ {item.badge}
      </div>
    )}
    <div className="px-4 pt-3 pb-2 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <div className="h-7 w-7 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
          {item.name.slice(0, 2).toUpperCase()}
        </div>
        <p className="font-semibold text-sm text-foreground truncate">{item.name}</p>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground shrink-0">{item.risk}</span>
    </div>
    <div className="grid grid-cols-3 px-4 py-3 border-t border-border/60">
      <div>
        <p className="font-heading text-lg font-bold text-foreground">{item.roi}</p>
        <p className="text-[10px] text-muted-foreground">YTM</p>
      </div>
      <div>
        <p className="font-heading text-sm font-semibold text-foreground">{item.tenure}</p>
        <p className="text-[10px] text-muted-foreground">Tenure</p>
      </div>
      <div className="text-right">
        <p className="font-heading text-sm font-semibold text-foreground">{item.min}</p>
        <p className="text-[10px] text-muted-foreground">Starts at</p>
      </div>
    </div>
    <button className="w-full px-4 py-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground hover:bg-secondary/40 transition-colors">
      <span className="flex items-center gap-3">
        {listed ? "Public Listed Company" : "Sell Anytime"}
        <span className="text-primary font-medium">Extra Returns</span>
      </span>
      <ChevronRight className="h-3 w-3" />
    </button>
  </div>
);

export default InvestHome;
