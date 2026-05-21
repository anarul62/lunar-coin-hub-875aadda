import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

type Channel = { id: string; key: string; name: string; banner_url: string | null };
type Plan = {
  id: string;
  name: string;
  image_url: string | null;
  interest_type: "percent" | "fixed";
  interest_value: number;
  interest_period: "day" | "month";
  duration_days: number;
  compound: boolean;
  featured: boolean;
  currency: string;
  min_amount: number;
  max_amount: number;
};

const InvestChannel = () => {
  const { channelKey } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!channelKey) return;
    (async () => {
      const { data: ch } = await supabase
        .from("invest_channels")
        .select("id,key,name,banner_url")
        .eq("key", channelKey)
        .maybeSingle();
      if (!ch) return;
      setChannel(ch as any);
      const { data: ps } = await supabase
        .from("invest_plans")
        .select("*")
        .eq("channel_id", (ch as any).id)
        .eq("enabled", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true });
      setPlans((ps as any) || []);
    })();
  }, [channelKey]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="pt-16 px-4">
        <button onClick={() => navigate("/invest")} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {channel?.banner_url && (
          <img src={channel.banner_url} alt={channel.name} className="w-full aspect-[2/1] object-cover rounded-xl mb-4" />
        )}
        <h1 className="font-heading text-xl font-bold text-foreground mb-3">{channel?.name || "Loading..."}</h1>

        <div className="space-y-3">
          {plans.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">No plans yet. Check back soon.</p>
          )}
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              amount={amounts[p.id] ?? p.min_amount}
              onAmount={(v) => setAmounts((m) => ({ ...m, [p.id]: v }))}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

const calcReturn = (p: Plan, amount: number) => {
  const periods =
    p.interest_period === "day" ? p.duration_days : Math.max(1, Math.round(p.duration_days / 30));
  if (p.interest_type === "fixed") {
    return p.compound ? amount + p.interest_value * periods : amount + p.interest_value * periods;
  }
  const r = p.interest_value / 100;
  if (p.compound) return amount * Math.pow(1 + r, periods);
  return amount * (1 + r * periods);
};

const PlanCard = ({ plan, amount, onAmount }: { plan: Plan; amount: number; onAmount: (v: number) => void }) => {
  const total = useMemo(() => calcReturn(plan, amount || 0), [plan, amount]);
  const profit = total - (amount || 0);
  const periodLabel = plan.interest_period === "day" ? "per day" : "per month";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {plan.featured && (
        <div className="bg-gradient-gold-subtle border-b border-primary/20 px-3 py-1 text-[10px] font-bold text-primary inline-flex items-center gap-1 rounded-br-lg">
          <Star className="h-3 w-3" /> Featured
        </div>
      )}
      <div className="flex gap-3 p-3">
        {plan.image_url ? (
          <img src={plan.image_url} alt={plan.name} className="h-20 w-20 object-cover rounded-lg shrink-0" />
        ) : (
          <div className="h-20 w-20 rounded-lg bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold shrink-0">
            {plan.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{plan.name}</p>
          <p className="text-xs text-muted-foreground">
            {plan.interest_type === "percent"
              ? `${plan.interest_value}% ${periodLabel}`
              : `${plan.interest_value} ${plan.currency} ${periodLabel}`}
            {plan.compound ? " · Compound" : ""}
          </p>
          <p className="text-xs text-muted-foreground">Duration: {plan.duration_days} days</p>
          <p className="text-xs text-muted-foreground">
            Range: {plan.min_amount} – {plan.max_amount} {plan.currency}
          </p>
        </div>
      </div>
      <div className="px-3 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={plan.min_amount}
            max={plan.max_amount || undefined}
            value={amount}
            onChange={(e) => onAmount(Number(e.target.value))}
            className="flex-1 bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm outline-none"
            placeholder={`Amount in ${plan.currency}`}
          />
          <span className="text-xs text-muted-foreground">{plan.currency}</span>
        </div>
        <div className="rounded-lg bg-secondary/40 border border-border px-3 py-2 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Info className="h-3 w-3" /> Total return
          </span>
          <span className="font-semibold text-primary">
            {total.toFixed(2)} {plan.currency} <span className="text-muted-foreground">(+{profit.toFixed(2)})</span>
          </span>
        </div>
        <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold">Invest Now</Button>
      </div>
    </div>
  );
};

export default InvestChannel;
