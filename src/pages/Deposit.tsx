import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet as WalletIcon, BookOpen, Copy, CheckCircle2, Loader2, X } from "lucide-react";

type Method = {
  id: string;
  method_key: string;
  label: string;
  icon_url: string | null;
  enabled: boolean;
  mode: string;
  currency: string;
  rate: number;
  min_amount: number;
  preset_amounts: number[];
  config: any;
  gateway_provider: string | null;
};

const BG_BY_KEY: Record<string, string> = {
  upi_qr: "bg-rose-100",
  paytm_qr: "bg-white",
  nagad: "bg-orange-50",
  bkash: "bg-pink-50",
  usdt: "bg-emerald-50",
  bep20: "bg-yellow-50",
};

const Deposit = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceInr, setBalanceInr] = useState(0);
  const [selected, setSelected] = useState<Method | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const [{ data: pm }, { data: prof }] = await Promise.all([
        supabase.from("payment_methods").select("*").eq("enabled", true).order("sort_order"),
        supabase.from("profiles").select("balance_usdt").eq("user_id", user.id).maybeSingle(),
      ]);
      setMethods((pm as any) || []);
      const usdt = Number(prof?.balance_usdt || 0);
      // approx INR using stored rate from upi method if any, else 90
      const upi = (pm as any[])?.find(m => m.method_key === "upi_qr");
      const r = Number(upi?.rate || 90);
      setBalanceInr(usdt * r);
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="font-semibold text-slate-900">Deposit</h1>
        <button onClick={() => navigate("/deposit/history")} className="text-sm text-rose-500 font-medium">Deposit history</button>
      </header>

      <main className="p-4 pb-24 max-w-2xl mx-auto">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md mb-5"
          style={{ background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a70 100%)" }}>
          <div className="flex items-center gap-2 text-sm opacity-95"><WalletIcon className="h-4 w-4"/> Balance</div>
          <div className="text-3xl font-bold mt-2">₹{balanceInr.toFixed(2)}</div>
          <div className="absolute right-4 bottom-3 text-white/40 tracking-widest font-mono">**** ****</div>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"/>
        </div>

        {/* Methods grid */}
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>
        ) : methods.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">No payment methods available yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {methods.map(m => (
              <button key={m.id} onClick={() => setSelected(m)}
                className={`rounded-2xl border border-slate-200 p-3 flex flex-col items-center justify-center aspect-square shadow-sm hover:shadow-md transition ${BG_BY_KEY[m.method_key] || "bg-white"}`}>
                {m.icon_url ? (
                  <img src={m.icon_url} alt={m.label} className="h-14 w-14 object-contain"/>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-slate-200"/>
                )}
                <div className="mt-2 text-xs font-medium text-slate-700 text-center">{m.label}</div>
              </button>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <DepositSheet method={selected} onClose={() => setSelected(null)}/>
      )}
    </div>
  );
};

const DepositSheet = ({ method, onClose }: { method: Method; onClose: () => void }) => {
  const [amount, setAmount] = useState<string>("");
  const [usdtAmount, setUsdtAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"amount" | "txid">("amount");
  const [txid, setTxid] = useState("");

  const presets = method.preset_amounts || [];
  const isUpi = method.method_key === "upi_qr" || method.method_key === "paytm_qr";
  const isUsdt = method.method_key === "usdt" || method.method_key === "bep20";
  const isBdt = method.method_key === "nagad" || method.method_key === "bkash";

  const numAmount = Number(amount) || 0;
  const numUsdt = Number(usdtAmount) || 0;

  const qrUrl = useMemo(() => {
    if (method.mode !== "manual") return "";
    if (isUpi && method.config?.upi_id && numAmount > 0) {
      const merchant = method.config.merchant_name || "Merchant";
      const upi = `upi://pay?pa=${method.config.upi_id}&pn=${merchant}&am=${numAmount}&cu=INR&tn=Recharge`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upi)}&margin=10&bgcolor=ffffff`;
    }
    if (isUsdt && method.config?.address) {
      return method.config.qr_url ||
        `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(method.config.address)}&margin=10&bgcolor=ffffff`;
    }
    return "";
  }, [method, numAmount, isUpi, isUsdt]);

  const fmt = (n: number) => n >= 1000 ? `${(n/1000)}K` : `${n}`;
  const symbol = method.currency === "INR" ? "₹" : method.currency === "BDT" ? "৳" : "";

  const proceedToPay = () => {
    const min = method.min_amount || 0;
    const a = isUsdt ? numUsdt : numAmount;
    if (!(a > 0)) return toast({ title: "Enter amount", variant: "destructive" });
    if (a < min) return toast({ title: `Minimum ${min} ${method.currency}`, variant: "destructive" });
    setStep("txid");
  };

  const submit = async () => {
    if (!txid.trim()) return toast({ title: "Enter transaction ID", variant: "destructive" });
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    const a = isUsdt ? numUsdt : numAmount;
    const usdt = isUsdt ? a : (method.rate > 0 ? a / method.rate : 0);
    const { error } = await supabase.from("deposits").insert({
      user_id: user.id, amount_usdt: usdt, amount: a, currency: method.currency,
      method_key: method.method_key, method_label: method.label, status: "pending",
      transaction_id: txid.trim(),
    } as any);
    setSubmitting(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Deposit request submitted" });
    onClose();
    window.location.href = "/deposit/history";
  };

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-slate-50 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === "txid" && (
              <button onClick={() => setStep("amount")} className="p-1 -ml-1 text-slate-500"><ArrowLeft className="h-4 w-4"/></button>
            )}
            {method.icon_url && <img src={method.icon_url} alt="" className="h-6 w-6 object-contain"/>}
            <div className="font-semibold text-slate-900 text-sm">
              {step === "txid" ? "Submit Transaction ID" : method.label}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500"><X className="h-5 w-5"/></button>
        </div>

        {step === "amount" ? (
        <div className="p-4 space-y-4">
          {/* Amount picker */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              {isUsdt
                ? <img src="https://files.catbox.moe/q4kw4f.png" alt="" className="h-6 w-6"/>
                : <div className="h-6 w-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm">{symbol}</div>}
              <div className="font-semibold text-slate-900">{isUsdt ? "Select amount of USDT" : "Deposit amount"}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => {
                const active = (isUsdt ? Number(usdtAmount) : Number(amount)) === p;
                return (
                  <button key={p} onClick={() => isUsdt ? setUsdtAmount(String(p)) : setAmount(String(p))}
                    className={`py-2.5 rounded-lg border text-sm font-semibold ${active ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-rose-500"}`}>
                    {isUsdt ? "₮ " : `${symbol} `}{fmt(p)}
                  </button>
                );
              })}
            </div>

            {isUsdt ? (
              <>
                <div className="mt-3 flex items-center gap-2 bg-slate-100 rounded-lg px-3">
                  <span className="text-emerald-600 font-bold">₮</span>
                  <span className="text-slate-400">|</span>
                  <input type="number" value={usdtAmount} onChange={e => setUsdtAmount(e.target.value)}
                    placeholder="Please enter USDT amount" className="flex-1 bg-transparent py-3 outline-none text-sm"/>
                  {usdtAmount && <button onClick={() => setUsdtAmount("")} className="text-slate-400"><X className="h-4 w-4"/></button>}
                </div>
                <div className="mt-2 flex items-center gap-2 bg-slate-100 rounded-lg px-3">
                  <span className="text-rose-500 font-bold">₹</span>
                  <span className="text-slate-400">|</span>
                  <input readOnly value={numUsdt > 0 ? (numUsdt * method.rate).toFixed(2) : ""}
                    placeholder="Please enter the amount" className="flex-1 bg-transparent py-3 outline-none text-sm"/>
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-center gap-2 bg-slate-100 rounded-lg px-3">
                <span className="text-rose-500 font-bold">{symbol}</span>
                <span className="text-slate-400">|</span>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={`${symbol}${method.min_amount} - ${symbol}50,000.00`}
                  className="flex-1 bg-transparent py-3 outline-none text-sm"/>
                {amount && <button onClick={() => setAmount("")} className="text-slate-400"><X className="h-4 w-4"/></button>}
              </div>
            )}
          </div>

          {/* Payment details */}
          {method.mode === "manual" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="font-semibold text-slate-900 text-sm">Payment details</div>
              {qrUrl && (
                <div className="flex justify-center">
                  <img src={qrUrl} alt="QR" className="h-56 w-56 rounded-lg border border-slate-200"/>
                </div>
              )}
              {isUpi && method.config?.upi_id && (
                <DetailRow label="UPI ID" value={method.config.upi_id} onCopy={() => copy(method.config.upi_id)} copied={copied}/>
              )}
              {isUsdt && method.config?.address && (
                <DetailRow label="Wallet Address" value={method.config.address} onCopy={() => copy(method.config.address)} copied={copied}/>
              )}
              {isBdt && method.config?.account_number && (
                <>
                  <DetailRow label="Account Number" value={method.config.account_number} onCopy={() => copy(method.config.account_number)} copied={copied}/>
                  <DetailRow label="Pay Type" value={method.config.pay_type === "cashout" ? "Cash Out" : "Send Money"}/>
                </>
              )}
              {numAmount > 0 && !isUsdt && (
                <DetailRow label="Amount to pay" value={`${symbol}${numAmount}`}/>
              )}
            </div>
          )}

          {method.mode === "gateway" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 text-sm text-slate-600">
              Payment via <b>{method.gateway_provider || "gateway"}</b>. You will be redirected to complete the payment.
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-rose-500"/>
              <div className="font-semibold text-slate-900">Recharge instructions</div>
            </div>
            <ul className="text-sm text-slate-600 space-y-2 pl-4 list-disc marker:text-rose-500">
              <li>Minimum deposit: {method.min_amount} {method.currency}, less will not be credited.</li>
              <li>After paying, click <b>Deposit</b> and submit your <b>Transaction ID / UTR</b>.</li>
              <li>The transfer amount must match the order you created, otherwise the money cannot be credited successfully.</li>
              <li>Note: do not cancel the deposit order after the money has been transferred.</li>
            </ul>
          </div>
        </div>
        ) : (
        <div className="p-4 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="text-sm text-slate-500">Amount paid</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {isUsdt ? `₮ ${numUsdt}` : `${symbol}${numAmount}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">via {method.label}</div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="font-semibold text-slate-900 text-sm">Transaction / UTR ID</div>
            <input value={txid} onChange={e => setTxid(e.target.value)}
              placeholder="Paste the 12-digit UTR or TxID from your payment app"
              className="w-full bg-slate-100 rounded-lg px-3 py-3 text-sm outline-none"/>
            <p className="text-xs text-slate-500">
              You will find this on your payment app's success page (UPI reference number,
              bKash/Nagad TrxID, or USDT TxHash). Without a valid Transaction ID, your deposit may be rejected.
            </p>
          </div>
        </div>
        )}

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between">
          <div className="text-xs">
            <div className="text-slate-500">Recharge Method:</div>
            <div className="font-bold text-slate-900">{method.label}</div>
          </div>
          {step === "amount" ? (
            <button onClick={proceedToPay}
              className="px-6 py-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-semibold">
              Deposit
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


const DetailRow = ({ label, value, onCopy, copied }: { label: string; value: string; onCopy?: () => void; copied?: boolean }) => (
  <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-3">
    <div className="min-w-0">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900 font-medium truncate">{value}</div>
    </div>
    {onCopy && (
      <button onClick={onCopy} className="p-2 text-slate-500 hover:bg-slate-200 rounded">
        {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/> : <Copy className="h-4 w-4"/>}
      </button>
    )}
  </div>
);

export default Deposit;
