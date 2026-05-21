import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Copy, Trash2, Send, Loader2 } from "lucide-react";

const randCode = () => "XC" + Array.from({length: 8}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");

const AdminXcoin = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({ xcoin_per_usdt: 1000, min_convert_xcoin: 100, description: "" });
  const [codes, setCodes] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [converts, setConverts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, todayRedeem: 0, todayConvert: 0 });
  const [search, setSearch] = useState("");

  // form
  const [amount, setAmount] = useState("");
  const [maxUsers, setMaxUsers] = useState("1");
  const [expireAt, setExpireAt] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const today = new Date(); today.setHours(0,0,0,0);
    const [{ data: setRow }, { data: c }, { data: rTx }, { data: cTx }, { data: bal }, { data: tot }] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "xcoin_settings").maybeSingle(),
      supabase.from("xcoin_gift_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("xcoin_transactions").select("*").eq("type", "redeem_code").order("created_at", { ascending: false }).limit(100),
      supabase.from("xcoin_transactions").select("*").eq("type", "convert_to_usdt").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_xcoin").select("*").order("balance", { ascending: false }).limit(200),
      supabase.from("user_xcoin").select("balance"),
    ]);
    setSettings(setRow?.value || { xcoin_per_usdt: 1000, min_convert_xcoin: 100 });
    setCodes(c || []);
    setRedemptions(rTx || []);
    setConverts(cTx || []);
    setBalances(bal || []);

    // join profile ref_codes
    const allUserIds = Array.from(new Set([
      ...(rTx || []).map(x => x.user_id),
      ...(cTx || []).map(x => x.user_id),
      ...(bal || []).map(x => x.user_id),
    ]));
    if (allUserIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, referral_code, full_name, email").in("user_id", allUserIds);
      const map = new Map((profs || []).map(p => [p.user_id, p]));
      (rTx || []).forEach((x: any) => x._p = map.get(x.user_id));
      (cTx || []).forEach((x: any) => x._p = map.get(x.user_id));
      (bal || []).forEach((x: any) => x._p = map.get(x.user_id));
    }

    const totalX = (tot || []).reduce((s, x: any) => s + Number(x.balance || 0), 0);
    const todayR = (rTx || []).filter(x => new Date(x.created_at) >= today).reduce((s, x) => s + Number(x.amount || 0), 0);
    const todayC = (cTx || []).filter(x => new Date(x.created_at) >= today).reduce((s, x) => s + Number(x.amount || 0), 0);
    setStats({ total: totalX, todayRedeem: todayR, todayConvert: todayC });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    await supabase.from("app_settings").upsert({ key: "xcoin_settings", value: settings, updated_at: new Date().toISOString() });
    toast({ title: "Settings saved" });
  };

  const generate = async () => {
    const amt = Number(amount);
    const max = Number(maxUsers);
    if (!amt || !max) return toast({ title: "Amount & max users required", variant: "destructive" });
    const code = randCode();
    const { error } = await supabase.from("xcoin_gift_codes").insert({
      code, amount: amt, max_users: max,
      expire_at: expireAt ? new Date(expireAt).toISOString() : null,
      note: note || null,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Generated ${code}` });
    setAmount(""); setMaxUsers("1"); setExpireAt(""); setNote("");
    load();
  };

  const delCode = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("xcoin_gift_codes").delete().eq("id", id);
    toast({ title: "Deleted" });
    load();
  };

  const postToFeed = async (c: any) => {
    await supabase.from("announcements").insert({
      type: "gift_code",
      title: c.note || "🎁 New Gift Code",
      body: `Amount: ${c.amount} X Coin • Max users: ${c.max_users}${c.expire_at ? ` • Expires ${new Date(c.expire_at).toLocaleString()}` : ""}`,
      gift_code: c.code,
    });
    toast({ title: "Posted to Rewards feed" });
  };

  const filteredBal = balances.filter((b: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return b._p?.referral_code?.toLowerCase().includes(s) || b._p?.email?.toLowerCase().includes(s) || b.user_id.includes(s);
  });

  if (loading) return <AdminLayout title="X Coin Manage"><div className="flex justify-center py-12"><Loader2 className="animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout title="X Coin Manage">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Kpi label="Total X Coin in circulation" value={stats.total.toFixed(2)}/>
        <Kpi label="Today Redeemed (from codes)" value={stats.todayRedeem.toFixed(2)}/>
        <Kpi label="Today Converted to USDT" value={stats.todayConvert.toFixed(2)}/>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl p-5 mb-6 border">
        <h3 className="font-semibold mb-3">X Coin Settings</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>X Coin per 1 USDT</Label>
            <Input type="number" value={settings.xcoin_per_usdt} onChange={e => setSettings({...settings, xcoin_per_usdt: Number(e.target.value)})}/></div>
          <div><Label>Min convert X Coin</Label>
            <Input type="number" value={settings.min_convert_xcoin} onChange={e => setSettings({...settings, min_convert_xcoin: Number(e.target.value)})}/></div>
          <div><Label>Description</Label>
            <Input value={settings.description || ""} onChange={e => setSettings({...settings, description: e.target.value})}/></div>
        </div>
        <Button onClick={saveSettings} className="mt-3">Save settings</Button>
      </div>

      {/* Generate code */}
      <div className="bg-white rounded-xl p-5 mb-6 border">
        <h3 className="font-semibold mb-3">Generate Gift Code</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div><Label>Amount (X Coin)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)}/></div>
          <div><Label>Max users</Label><Input type="number" value={maxUsers} onChange={e => setMaxUsers(e.target.value)}/></div>
          <div><Label>Expire at</Label><Input type="datetime-local" value={expireAt} onChange={e => setExpireAt(e.target.value)}/></div>
          <div><Label>Note (optional)</Label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason"/></div>
        </div>
        <Button onClick={generate} className="mt-3">Generate</Button>
      </div>

      {/* Codes table */}
      <div className="bg-white rounded-xl p-5 mb-6 border overflow-x-auto">
        <h3 className="font-semibold mb-3">Generated Codes</h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs">
            <tr><th className="text-left p-2">Code</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Used / Max</th><th className="text-left p-2">Expire</th><th className="text-left p-2">Note</th><th className="text-left p-2">Created</th><th className="text-left p-2">Actions</th></tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-2"><div className="flex items-center gap-1"><code className="font-mono font-bold">{c.code}</code><button onClick={() => {navigator.clipboard.writeText(c.code); toast({title:"Copied"});}}><Copy className="h-3 w-3"/></button></div></td>
                <td className="p-2">{c.amount}</td>
                <td className="p-2">{c.used_count} / {c.max_users}</td>
                <td className="p-2">{c.expire_at ? new Date(c.expire_at).toLocaleString() : "—"}</td>
                <td className="p-2">{c.note || "—"}</td>
                <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                <td className="p-2 flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => postToFeed(c)}><Send className="h-3 w-3 mr-1"/>Post</Button>
                  <Button size="sm" variant="destructive" onClick={() => delCode(c.id)}><Trash2 className="h-3 w-3"/></Button>
                </td>
              </tr>
            ))}
            {codes.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 p-4">No codes yet</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Redemption activity */}
      <div className="bg-white rounded-xl p-5 mb-6 border overflow-x-auto">
        <h3 className="font-semibold mb-3">Code Redemption Activity</h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs"><tr><th className="text-left p-2">User</th><th className="text-left p-2">Ref Code</th><th className="text-left p-2">Code</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Time</th></tr></thead>
          <tbody>
            {redemptions.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r._p?.full_name || r._p?.email || r.user_id.slice(0,8)}</td>
                <td className="p-2 font-mono">{r._p?.referral_code || "—"}</td>
                <td className="p-2 font-mono">{r.meta?.code || "—"}</td>
                <td className="p-2">{r.amount}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {redemptions.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 p-4">No redemptions</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Convert list */}
      <div className="bg-white rounded-xl p-5 mb-6 border overflow-x-auto">
        <h3 className="font-semibold mb-3">X Coin → USDT Conversions</h3>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs"><tr><th className="text-left p-2">User</th><th className="text-left p-2">Ref Code</th><th className="text-left p-2">X Coin</th><th className="text-left p-2">USDT</th><th className="text-left p-2">Time</th></tr></thead>
          <tbody>
            {converts.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r._p?.full_name || r._p?.email || r.user_id.slice(0,8)}</td>
                <td className="p-2 font-mono">{r._p?.referral_code || "—"}</td>
                <td className="p-2">{r.amount}</td>
                <td className="p-2">{Number(r.meta?.usdt || 0).toFixed(4)}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {converts.length === 0 && <tr><td colSpan={5} className="text-center text-slate-400 p-4">No conversions</td></tr>}
          </tbody>
        </table>
      </div>

      {/* User balances */}
      <div className="bg-white rounded-xl p-5 border overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">User X Coin Balances</h3>
          <Input placeholder="Search by ref code / email" value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs"/>
        </div>
        <table className="w-full text-sm">
          <thead className="text-slate-500 text-xs"><tr><th className="text-left p-2">User</th><th className="text-left p-2">Ref Code</th><th className="text-left p-2">Balance</th></tr></thead>
          <tbody>
            {filteredBal.map((b: any) => (
              <tr key={b.user_id} className="border-t">
                <td className="p-2">{b._p?.full_name || b._p?.email || b.user_id.slice(0,8)}</td>
                <td className="p-2 font-mono">{b._p?.referral_code || "—"}</td>
                <td className="p-2 font-semibold">{Number(b.balance).toFixed(2)}</td>
              </tr>
            ))}
            {filteredBal.length === 0 && <tr><td colSpan={3} className="text-center text-slate-400 p-4">No users</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const Kpi = ({ label, value }: any) => (
  <div className="bg-white rounded-xl p-4 border">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default AdminXcoin;
