import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BookOpen, Save } from "lucide-react";

const AdminGuide = () => {
  const [title, setTitle] = useState("Guide");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("app_settings").select("value").eq("key", "user_guide").maybeSingle();
      setTitle(data?.value?.title || "Guide");
      setBody(data?.value?.body || "");
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from("app_settings").upsert({ key: "user_guide", value: { title, body }, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guide saved");
  };

  return (
    <AdminLayout title="User Guide">
      <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Guide Content</h2>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Guide Text</Label>
          <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write guide content..." />
        </div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Guide"}
        </Button>
      </div>
    </AdminLayout>
  );
};

export default AdminGuide;