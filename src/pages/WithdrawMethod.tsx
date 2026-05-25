import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { currencyToUsdt, fetchLiveRates, getCurrencySymbol, usdtToCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";

const WithdrawMethod = () => {
  const { methodKey = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [userLimits, setUserLimits] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rates, setRates] = useState<Record<string, number>>({ USDT: 1 });
  const [amount, setAmount] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    const [{ data: m }, { data: addrs }, { data: prof }, { data: setRow }, { data: ul }, rs] = await Promise.all([
      supabase.from("withdraw_methods").select("*").eq("method_key", methodKey).maybeSingle(),
      supabase.from("withdraw_addresses").select("*").eq("user_id", user.id).eq("method_key", methodKey).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("app_settings").select("value").eq("key", "withdraw_settings").maybeSingle(),
      supabase.from("user_withdraw_limits").select("*").eq("user_id", user.id).maybeSingle(),
      fetchLiveRates(),
    ]);
    setMethod(m);
    setAddresses(addrs || []);
    setSelectedAddr((addrs || [])[0] || null);
    setProfile(prof);
    setSettings(setRow?.value || {});
    setUserLimits(ul);
    setRates(rs);
    setLoading(false);
  };
  useEffect(() => { load(); }, [methodKey]);

  const currency = method?.charge_currency || "INR";
  const isUSDT = currency === "USDT";

  const limit = useMemo(() => {
    return {
      min: userLimits?.min_amount ?? settings?.min_amount ?? 0,
      max: userLimits?.max_amount ?? settings?.max_amount ?? 0,
      daily: userLimits?.daily_max_times ?? settings?.daily_max_times ?? 3,
    };
  }, [userLimits, settings]);

  const amt = Number(amount || 0);
  const amtUsdt = currencyToUsdt(amt, currency, rates);
  const charge = method
    ? method.charge_type === "percent"
      ? amt * Number(method.charge_value) / 100
      : Number(method.charge_value)
    : 0;
  const receive = Math.max(0, amt - charge);

  const balUsdt = Number(profile?.balance_usdt || 0);
  const balInDisplay = usdtToCurrency(balUsdt, currency, rates);

  const setAll = () => setAmount(String(balInDisplay.toFixed(2)));

  const submit = async () => {
    if (!method) return;
    if (!selectedAddr) return toast({ title: "Add a withdraw address first", variant: "destructive" });
    if (amt < limit.min) return toast({ title: `Min ${limit.min} ${currency}`, variant: "destructive" });
    if (limit.max && amt > limit.max) return toast({ title: `Max ${limit.max} ${currency}`, variant: "destructive" });
    if (amtUsdt > balUsdt) return toast({ title: "Insufficient balance", variant: "destructive" });

    // daily count
    const { data: { user } } = await supabase.auth.getUser();
    const today = new Date(); today.setHours(0,0,0,0);
    const { count } = await supabase.from("withdrawals").select("id", { count: "exact", head: true })
      .eq("user_id", user!.id).gte("created_at", today.toISOString()).neq("status", "rejected");
    if ((count || 0) >= limit.daily) return toast({ title: `Daily limit ${limit.daily} reached`, variant: "destructive" });

    setSubmitting(true);
    const chargeUsdt = currencyToUsdt(charge, currency, rates);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user!.id,
      method_key: method.method_key,
      method_label: method.label,
      amount: amt,
      currency,
      amount_usdt: amtUsdt,
      charge_usdt: chargeUsdt,
      net_usdt: Math.max(0, amtUsdt - chargeUsdt),
      address_snapshot: selectedAddr.details,
      status: "pending",
    });
    if (error) {
      setSubmitting(false);
      return toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
    // Deduct balance immediately on request (refunded if admin rejects)
    const { data: fresh } = await supabase.from("profiles").select("balance_usdt").eq("user_id", user!.id).maybeSingle();
    const newBal = Math.max(0, Number(fresh?.balance_usdt || 0) - amtUsdt);
    await supabase.from("profiles").update({ balance_usdt: newBal }).eq("user_id", user!.id);
    setSubmitting(false);
    toast({ title: "Withdrawal requested", description: `${amtUsdt.toFixed(2)} USDT deducted` });
    navigate("/withdraw/history");
  };

  if (loading || !method) return <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]"><Loader2 className="animate-spin"/></div>;

  const symbol = getCurrencySymbol(currency);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-32">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate("/withdraw")} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="text-lg font-semibold">{method.label} Withdraw</h1>
        <button onClick={() => navigate("/withdraw/history")} className="text-sm text-slate-700">History</button>
      </header>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#ff6b6b] to-[#ff8e3c]">
          <p className="text-sm opacity-90">Available balance</p>
          <p className="text-3xl font-extrabold mt-1">{symbol}{balInDisplay.toFixed(2)}</p>
          <p className="text-xs opacity-80">{balUsdt.toFixed(4)} USDT</p>
        </div>

        {/* Address */}
        {addresses.length === 0 ? (
          <button onClick={() => navigate(`/withdraw/${methodKey}/add`)}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 border border-dashed border-slate-300 text-slate-600">
            <Plus className="h-5 w-5"/> Add {method.label} address
          </button>
        ) : (
          <div className="bg-white rounded-xl p-3">
            {addresses.map(a => (
              <button key={a.id} onClick={() => setSelectedAddr(a)}
                className={`w-full flex items-center justify-between p-2 rounded-lg ${selectedAddr?.id === a.id ? "bg-orange-50" : ""}`}>
                <div className="text-left text-sm">
                  <p className="font-semibold">{a.label || a.details?.bank_name || a.details?.network || a.details?.wallet_type || method.label}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[220px]">
                    {a.details?.account_number || a.details?.upi_id || a.details?.address || a.details?.number || "—"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400"/>
              </button>
            ))}
            <button onClick={() => navigate(`/withdraw/${methodKey}/add`)} className="w-full mt-2 text-sm text-orange-600 flex items-center justify-center gap-1">
              <Plus className="h-4 w-4"/> Add new
            </button>
          </div>
        )}

        {/* Amount */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center bg-orange-50 rounded-lg px-3 py-3">
            <span className="font-bold text-orange-500 mr-2">{symbol}</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder={`Please enter ${currency === "USDT" ? "USDT" : "amount"}`}
              className="flex-1 bg-transparent outline-none text-orange-500 placeholder:text-orange-400"/>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-slate-500">Withdrawable balance <span className="text-orange-500 font-semibold">{symbol}{balInDisplay.toFixed(2)}</span></span>
            <button onClick={setAll} className="text-orange-500 border border-orange-300 rounded px-3 py-0.5 text-xs">All</button>
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-slate-500">Charge</span>
            <span className="text-orange-500 font-semibold">{symbol}{charge.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-sm">
            <span className="text-slate-500">You'll receive</span>
            <span className="text-orange-500 font-semibold">{symbol}{receive.toFixed(2)}</span>
          </div>

          <Button onClick={submit} disabled={submitting} className="w-full mt-4 h-12 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8e3c] text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Withdraw"}
          </Button>
        </div>

        {/* Rules */}
        <div className="bg-white rounded-xl p-4 text-sm text-slate-600 space-y-2">
          <p>◆ Need to refer: <span className="text-orange-500">{userLimits?.need_to_refer ?? settings?.need_to_refer ?? 0}</span></p>
          <p>◆ Need to deposit: <span className="text-orange-500">{userLimits?.need_to_deposit_usdt ?? settings?.need_to_deposit_usdt ?? 0} USDT</span></p>
          <p>◆ Withdraw time <span className="text-orange-500">{settings?.window_start || "00:00"}-{settings?.window_end || "23:59"}</span></p>
          <p>◆ Today remaining times <span className="text-orange-500">{limit.daily}</span></p>
          <p>◆ Withdrawal range <span className="text-orange-500">{symbol}{limit.min} - {symbol}{limit.max}</span></p>
          <p>◆ Please confirm your beneficial account info before withdrawing.</p>
        </div>
      </div>
    </div>
  );
};

export default WithdrawMethod;
