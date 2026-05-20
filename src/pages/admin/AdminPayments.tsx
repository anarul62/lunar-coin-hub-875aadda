import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";

type Method = {
  id: string;
  method_key: string;
  label: string;
  icon_url: string | null;
  enabled: boolean;
  mode: string; // 'gateway' | 'manual'
  currency: string;
  rate: number;
  min_amount: number;
  preset_amounts: number[];
  config: any;
  gateway_provider: string | null;
  gateway_config: any;
};

const GATEWAYS = ["lgpay", "watchpay", "morepay", "razorpay", "easypay", "phonepe", "okpay"];

const CURRENCY_BY_KEY: Record<string, string> = {
  upi_qr: "INR", paytm_qr: "INR", nagad: "BDT", bkash: "BDT", usdt: "USDT", bep20: "USDT",
};

const AdminPayments = () => {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("payment_methods").select("*").order("sort_order");
    setMethods((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Method>) => {
    setMethods(ms => ms.map(m => m.id === id ? { ...m, ...patch } : m));
  };

  const toggleEnabled = async (m: Method) => {
    update(m.id, { enabled: !m.enabled });
    await supabase.from("payment_methods").update({ enabled: !m.enabled }).eq("id", m.id);
  };

  const save = async (m: Method) => {
    setSavingKey(m.id);
    const { error } = await supabase.from("payment_methods").update({
      mode: m.mode,
      currency: m.currency,
      rate: Number(m.rate) || 0,
      min_amount: Number(m.min_amount) || 0,
      preset_amounts: m.preset_amounts,
      config: m.config,
      gateway_provider: m.gateway_provider,
      gateway_config: m.gateway_config,
      updated_at: new Date().toISOString(),
    }).eq("id", m.id);
    setSavingKey(null);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: `${m.label} saved` });
  };

  return (
    <AdminLayout title="Auto PayIn Gateway / Deposit Methods">
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin"/></div>
      ) : (
        <div className="space-y-3 max-w-4xl">
          <p className="text-sm text-slate-500">Enable/disable deposit methods. For each enabled method, pick <b>Payment Gateway</b> or <b>Manual</b> and fill required fields.</p>
          {methods.map(m => {
            const open = openKey === m.id;
            return (
              <div key={m.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  {m.icon_url && <img src={m.icon_url} alt={m.label} className="h-10 w-10 rounded object-contain bg-slate-50 p-1"/>}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{m.label}</div>
                    <div className="text-xs text-slate-500">{m.method_key} · {CURRENCY_BY_KEY[m.method_key] || m.currency}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{m.enabled ? "Enabled" : "Disabled"}</span>
                    <Switch checked={m.enabled} onCheckedChange={() => toggleEnabled(m)}/>
                  </div>
                  <button onClick={() => setOpenKey(open ? null : m.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded">
                    {open ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                  </button>
                </div>

                {open && (
                  <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50/50">
                    <div>
                      <Label>Mode</Label>
                      <div className="flex gap-2 mt-1">
                        {(["gateway", "manual"] as const).map(t => (
                          <button key={t} onClick={() => update(m.id, { mode: t })}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize ${m.mode === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300"}`}>
                            {t === "gateway" ? "Payment Gateway" : "Manual"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {m.mode === "gateway" ? (
                      <div className="space-y-3">
                        <div>
                          <Label>Gateway Provider</Label>
                          <select value={m.gateway_provider || ""} onChange={e => update(m.id, { gateway_provider: e.target.value })}
                            className="mt-1 w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
                            <option value="">— Select gateway —</option>
                            {GATEWAYS.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>API Key</Label>
                            <Input value={m.gateway_config?.api_key || ""} onChange={e => update(m.id, { gateway_config: { ...m.gateway_config, api_key: e.target.value } })}/>
                          </div>
                          <div>
                            <Label>API Secret</Label>
                            <Input value={m.gateway_config?.api_secret || ""} onChange={e => update(m.id, { gateway_config: { ...m.gateway_config, api_secret: e.target.value } })}/>
                          </div>
                          <div className="col-span-2">
                            <Label>Merchant / Endpoint URL</Label>
                            <Input value={m.gateway_config?.endpoint || ""} onChange={e => update(m.id, { gateway_config: { ...m.gateway_config, endpoint: e.target.value } })}/>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ManualForm m={m} update={update}/>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Min Deposit ({m.currency})</Label>
                        <Input type="number" min={0} step="0.01" value={m.min_amount}
                          onChange={e => update(m.id, { min_amount: Number(e.target.value) })}/>
                      </div>
                      <div>
                        <Label>Preset Amounts (comma sep)</Label>
                        <Input value={(m.preset_amounts || []).join(",")}
                          onChange={e => update(m.id, { preset_amounts: e.target.value.split(",").map(v => Number(v.trim())).filter(v => v > 0) })}/>
                      </div>
                    </div>

                    <Button onClick={() => save(m)} disabled={savingKey === m.id} className="bg-emerald-600 hover:bg-emerald-700">
                      {savingKey === m.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Save className="h-4 w-4 mr-1"/> Save {m.label}</>}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

const ManualForm = ({ m, update }: { m: Method; update: (id: string, patch: Partial<Method>) => void }) => {
  const cfg = m.config || {};
  const setCfg = (patch: any) => update(m.id, { config: { ...cfg, ...patch } });

  const isUpi = m.method_key === "upi_qr" || m.method_key === "paytm_qr";
  const isUsdt = m.method_key === "usdt" || m.method_key === "bep20";
  const isBdt = m.method_key === "nagad" || m.method_key === "bkash";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Currency</Label>
          <Input value={m.currency} onChange={e => update(m.id, { currency: e.target.value })}/>
        </div>
        <div>
          <Label>1 USDT = ? {m.currency}</Label>
          <Input type="number" step="0.0001" value={m.rate} onChange={e => update(m.id, { rate: Number(e.target.value) })}/>
        </div>
      </div>

      {isUpi && (
        <>
          <div>
            <Label>UPI ID</Label>
            <Input value={cfg.upi_id || ""} onChange={e => setCfg({ upi_id: e.target.value })} placeholder="merchant@upi"/>
            <p className="text-xs text-slate-500 mt-1">QR code will be auto-generated from this UPI ID + amount.</p>
          </div>
          <div>
            <Label>Merchant Name</Label>
            <Input value={cfg.merchant_name || ""} onChange={e => setCfg({ merchant_name: e.target.value })} placeholder="Merchant"/>
          </div>
        </>
      )}

      {isUsdt && (
        <>
          <div>
            <Label>{m.method_key === "bep20" ? "BEP20" : "USDT-TRC20"} Wallet Address</Label>
            <Input value={cfg.address || ""} onChange={e => setCfg({ address: e.target.value })}/>
          </div>
          <div>
            <Label>QR Code Image URL (optional)</Label>
            <Input value={cfg.qr_url || ""} onChange={e => setCfg({ qr_url: e.target.value })} placeholder="https://..."/>
          </div>
        </>
      )}

      {isBdt && (
        <>
          <div>
            <Label>{m.label} Account Number</Label>
            <Input value={cfg.account_number || ""} onChange={e => setCfg({ account_number: e.target.value })}/>
          </div>
          <div>
            <Label>Pay Type</Label>
            <div className="flex gap-2 mt-1">
              {(["send_money", "cashout"] as const).map(t => (
                <button key={t} onClick={() => setCfg({ pay_type: t })}
                  className={`px-3 py-2 rounded-lg text-sm border ${cfg.pay_type === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300"}`}>
                  {t === "send_money" ? "Send Money" : "Cash Out"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPayments;
