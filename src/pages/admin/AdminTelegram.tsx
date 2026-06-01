import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";

const AdminTelegram = () => {
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("app_settings").select("value").eq("key", "telegram_support_url").maybeSingle();
      setUrl(data?.value?.url || "");
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from("app_settings").upsert({ key: "telegram_support_url", value: { url }, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Telegram link saved");
  };

  return (
    <AdminLayout title="Telegram">
      <div className="max-w-xl bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Support Telegram Link</h2>
        </div>
        <div>
          <Label>Telegram URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://t.me/your_support" />
          <p className="text-xs text-slate-500 mt-1">User Profile → Support ক্লিক করলে এই লিংকে redirect হবে।</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Link"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminTelegram;