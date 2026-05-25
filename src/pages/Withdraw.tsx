import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
import { fetchLiveRates, getCurrencySymbol, getUserWalletCurrency, usdtToCurrency } from "@/lib/currency";

const Withdraw = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<any[]>([]);
  const [bal, setBal] = useState(0);
  const [display, setDisplay] = useState({ amount: 0, currency: "USDT", symbol: "₮" });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const [{ data: ms }, { data: prof }, rates] = await Promise.all([
        supabase.from("withdraw_methods").select("*").eq("enabled", true).order("sort_order"),
        supabase.from("profiles").select("balance_usdt,preferred_currency,phone").eq("user_id", user.id).maybeSingle(),
        fetchLiveRates(),
      ]);
      setMethods(ms || []);
      const usdt = Number(prof?.balance_usdt || 0);
      const walletCurrency = getUserWalletCurrency(prof as any);
      setBal(usdt);
      setDisplay({ amount: usdtToCurrency(usdt, walletCurrency.code, rates), currency: walletCurrency.code, symbol: getCurrencySymbol(walletCurrency.code) });
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="text-lg font-semibold">Withdraw</h1>
        <button onClick={() => navigate("/withdraw/history")} className="text-sm text-slate-700">History</button>
      </header>

      <div className="p-4">
        <div className="rounded-2xl p-5 text-white bg-gradient-to-br from-[#ff6b6b] to-[#ff8e3c] shadow-lg">
          <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="h-4 w-4"/> Available balance</div>
          <p className="text-3xl font-extrabold mt-2">{display.symbol}{display.amount.toFixed(2)}</p>
          <p className="text-xs opacity-80 mt-1">{bal.toFixed(4)} USDT</p>
        </div>

        <h2 className="text-sm font-semibold text-slate-600 mt-6 mb-3">Choose withdraw method</h2>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : methods.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-10 bg-white rounded-xl">No withdraw methods enabled</div>
        ) : (
          <div className="space-y-3">
            {methods.map(m => (
              <button key={m.id} onClick={() => navigate(`/withdraw/${m.method_key}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-slate-100">
                {m.icon_url && <img src={m.icon_url} alt={m.label} className="h-12 w-12 object-contain"/>}
                <div className="flex-1 text-left">
                  <p className="font-semibold">{m.label}</p>
                  <p className="text-xs text-slate-500">
                    Charge: {m.charge_type === "percent" ? `${m.charge_value}%` : `${m.charge_value} ${m.charge_currency}`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400"/>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
