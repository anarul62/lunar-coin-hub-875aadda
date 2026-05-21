import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const AdminAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("attendance_rewards").select("*").order("day");
    let r = data || [];
    if (r.length < 7) {
      for (let d = 1; d <= 7; d++) if (!r.find(x => x.day === d)) r.push({ day: d, amount_xcoin: 0, active: true, updated_at: new Date().toISOString() } as any);
      r.sort((a,b) => a.day - b.day);
    }
    setRows(r);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    for (const r of rows) {
      await supabase.from("attendance_rewards").upsert({ day: r.day, amount_xcoin: Number(r.amount_xcoin || 0), active: !!r.active, updated_at: new Date().toISOString() });
    }
    toast({ title: "Saved" });
    load();
  };

  if (loading) return <AdminLayout title="Attendance Bonus"><div className="flex justify-center py-12"><Loader2 className="animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout title="Attendance Bonus">
      <div className="bg-white rounded-xl p-5 border max-w-2xl">
        <h3 className="font-semibold mb-3">7-Day Attendance Rewards (X Coin)</h3>
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.day} className="flex items-center gap-3">
              <span className="w-16 text-sm font-semibold">Day {r.day}</span>
              <Input type="number" value={r.amount_xcoin} onChange={e => { const cp=[...rows]; cp[i].amount_xcoin = e.target.value; setRows(cp); }} className="max-w-xs"/>
              <span className="text-sm text-slate-500">X Coin</span>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-slate-500">Active</span>
                <Switch checked={r.active} onCheckedChange={(v) => { const cp=[...rows]; cp[i].active = v; setRows(cp); }}/>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={save} className="mt-5">Save</Button>
      </div>
    </AdminLayout>
  );
};

export default AdminAttendance;
