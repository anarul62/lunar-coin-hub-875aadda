import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const TITLES: Record<string, string> = {
  upi: "Payment method",
  bank: "Add a bank account number",
  usdt: "Add USDT address",
  ewallet: "E-Wallet Payment method",
};

const WithdrawAddAddress = () => {
  const { methodKey = "" } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [password, setPassword] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      setForm((f: any) => ({ ...f, full_name: data?.full_name || "" }));
    })();
  }, [navigate]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    // validations per type
    if (methodKey === "upi") {
      if (!form.upi_name || !form.phone || !form.upi_id || !form.confirm_upi) return toast({ title: "Fill all fields", variant: "destructive" });
      if (form.upi_id !== form.confirm_upi) return toast({ title: "UPI IDs don't match", variant: "destructive" });
    } else if (methodKey === "bank") {
      if (!form.bank_name || !form.full_name || !form.account_number || !form.ifsc || !form.phone) return toast({ title: "Fill all fields", variant: "destructive" });
    } else if (methodKey === "usdt") {
      if (!form.network || !form.address) return toast({ title: "Fill all fields", variant: "destructive" });
    } else if (methodKey === "ewallet") {
      if (!form.wallet_type || !form.account_name || !form.number) return toast({ title: "Fill all fields", variant: "destructive" });
    }
    if (!password) return toast({ title: "Enter your login password to save", variant: "destructive" });

    setSaving(true);
    // verify password
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email;
    if (!email) { setSaving(false); return toast({ title: "Login again", variant: "destructive" }); }
    const { error: pwErr } = await supabase.auth.signInWithPassword({ email, password });
    if (pwErr) { setSaving(false); return toast({ title: "Wrong password", variant: "destructive" }); }

    const label =
      methodKey === "bank" ? form.bank_name :
      methodKey === "upi" ? form.upi_name :
      methodKey === "usdt" ? `USDT-${form.network}` :
      methodKey === "ewallet" ? form.wallet_type : null;

    const { error } = await supabase.from("withdraw_addresses").insert({
      user_id: user.id, method_key: methodKey, label, details: form,
    });
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Address saved" });
    navigate(`/withdraw/${methodKey}`);
  };


  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-40">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="flex-1 text-center text-lg font-semibold">{TITLES[methodKey] || "Add address"}</h1>
        <div className="w-9"/>
      </header>

      <div className="p-4">
        {methodKey === "upi" && (
          <>
            <h2 className="font-bold mb-4">Information UPI</h2>
            <Field label="UPI Name"><input className={inp} value={form.upi_name || ""} onChange={e => set("upi_name", e.target.value)}/></Field>
            <Field label="Phone number"><input className={inp} value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="Please enter the phone number"/></Field>
            <p className="text-xs text-red-500 -mt-2 mb-3">⓵ For the security of your account, please fill in your real mobile phone number</p>
            <Field label="UPI ID"><input className={inp} value={form.upi_id || ""} onChange={e => set("upi_id", e.target.value)} placeholder="Please enter your UPI ID"/></Field>
            <Field label="Confirm UPI ID"><input className={inp} value={form.confirm_upi || ""} onChange={e => set("confirm_upi", e.target.value)} placeholder="Please enter your UPI ID"/></Field>
          </>
        )}

        {methodKey === "bank" && (
          <>
            <Field label="Choose a bank">
              <input className={inp} value={form.bank_name || ""} onChange={e => set("bank_name", e.target.value)} placeholder="Bank name (e.g. SBI, HDFC, PNB)"/>
            </Field>
            <Field label="Full recipient's name"><input className={inp} value={form.full_name || ""} onChange={e => set("full_name", e.target.value)}/></Field>
            <Field label="Bank account number"><input className={inp} value={form.account_number || ""} onChange={e => set("account_number", e.target.value)} placeholder="Please enter your bank account number"/></Field>
            <Field label="Phone number"><input className={inp} value={form.phone || ""} onChange={e => set("phone", e.target.value)} placeholder="Please enter your phone number"/></Field>
            <Field label="IFSC code"><input className={inp} value={form.ifsc || ""} onChange={e => set("ifsc", e.target.value.toUpperCase())} placeholder="Please enter IFSC code"/></Field>
          </>
        )}

        {methodKey === "usdt" && (
          <>
            <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4">⓵ To ensure the safety of your funds, please link your wallet</div>
            <Field label="Select main network">
              <select className={inp} value={form.network || ""} onChange={e => set("network", e.target.value)}>
                <option value="">Select</option>
                <option value="TRC20">TRC20</option>
                <option value="BEP20">BEP20</option>
              </select>
            </Field>
            <Field label="USDT Address"><input className={inp} value={form.address || ""} onChange={e => set("address", e.target.value)} placeholder="Please enter the USDT address"/></Field>
            <Field label="Address Alias"><input className={inp} value={form.alias || ""} onChange={e => set("alias", e.target.value)} placeholder="Please enter a remark"/></Field>
          </>
        )}

        {methodKey === "ewallet" && (
          <>
            <h2 className="font-bold mb-4">E-Wallet</h2>
            <Field label="Choose type">
              <select className={inp} value={form.wallet_type || ""} onChange={e => set("wallet_type", e.target.value)}>
                <option value="">Please choose</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
              </select>
            </Field>
            <Field label="Full name"><input className={inp} value={form.account_name || ""} onChange={e => set("account_name", e.target.value)}/></Field>
            <Field label={form.wallet_type === "Nagad" ? "Nagad number" : "bKash number"}>
              <input className={inp} value={form.number || ""} onChange={e => set("number", e.target.value)} placeholder="Please enter account"/>
            </Field>
          </>
        )}

        <Field label="Login password (for security)">
          <input type="password" className={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your login password"/>
        </Field>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button onClick={save} disabled={saving} className="w-full h-12 rounded-full bg-gradient-to-r from-[#ff6b6b] to-[#ff8e3c] text-white text-base">
          {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default WithdrawAddAddress;
