import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";

const AdminAnnouncements = () => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [type, setType] = useState("notice");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [img, setImg] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!title) return toast({ title: "Title required", variant: "destructive" });
    const { error } = await supabase.from("announcements").insert({
      type, title, body: body || null, gift_code: code || null, image_url: img || null,
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setTitle(""); setBody(""); setCode(""); setImg("");
    toast({ title: "Posted" });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    load();
  };

  if (loading) return <AdminLayout title="Announcements"><div className="flex justify-center py-12"><Loader2 className="animate-spin"/></div></AdminLayout>;

  return (
    <AdminLayout title="Announcements / Rewards Feed">
      <div className="bg-white rounded-xl p-5 border mb-6 max-w-2xl">
        <h3 className="font-semibold mb-3">Create Post</h3>
        <div className="grid gap-3">
          <div><Label>Type</Label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full h-10 rounded-md border px-3">
              <option value="notice">Notice</option>
              <option value="announcement">Announcement</option>
              <option value="gift_code">Gift Code</option>
            </select>
          </div>
          <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)}/></div>
          <div><Label>Body</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={3}/></div>
          {type === "gift_code" && <div><Label>Gift Code</Label><Input value={code} onChange={e => setCode(e.target.value)} placeholder="XCxxxxxxxx"/></div>}
          <div><Label>Image URL (optional)</Label><Input value={img} onChange={e => setImg(e.target.value)}/></div>
        </div>
        <Button onClick={submit} className="mt-4">Post</Button>
      </div>

      <div className="bg-white rounded-xl p-5 border">
        <h3 className="font-semibold mb-3">All Posts</h3>
        <div className="space-y-3">
          {posts.map(p => (
            <div key={p.id} className="flex items-start gap-3 border-b pb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100">{p.type}</span>
                  <span className="font-semibold">{p.title}</span>
                </div>
                {p.body && <p className="text-sm text-slate-600 mt-1">{p.body}</p>}
                {p.gift_code && <code className="text-rose-600 font-mono text-sm">{p.gift_code}</code>}
                <p className="text-xs text-slate-400 mt-1">{new Date(p.created_at).toLocaleString()}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => del(p.id)}><Trash2 className="h-3 w-3"/></Button>
            </div>
          ))}
          {posts.length === 0 && <p className="text-center text-slate-400 py-6">No posts yet</p>}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
