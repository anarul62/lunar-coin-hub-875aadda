import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Upload, Image as ImageIcon, Plus } from "lucide-react";

type Banner = {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  sort_order: number;
  active: boolean;
};

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [order, setOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true });
    setBanners(data || []);
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file) return toast.error("Select an image first");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const up = await supabase.storage.from("banners").upload(path, file);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
      const ins = await supabase.from("banners").insert({
        title: title || null,
        link_url: link || null,
        image_url: pub.publicUrl,
        sort_order: parseInt(order) || 0,
        active: true,
      });
      if (ins.error) throw ins.error;
      toast.success("Banner added");
      setTitle(""); setLink(""); setOrder("0"); setFile(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally { setBusy(false); }
  };

  const toggle = async (b: Banner) => {
    await supabase.from("banners").update({ active: !b.active }).eq("id", b.id);
    load();
  };

  const remove = async (b: Banner) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", b.id);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout title="Banners">
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> Add New Banner
          </h2>
          <div className="space-y-3">
            <div>
              <Label>Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo title" />
            </div>
            <div>
              <Label>Link URL (optional)</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
            <div>
              <Label>Image</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm border border-slate-200 rounded-md p-2"
              />
            </div>
            <Button onClick={upload} disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Upload className="h-4 w-4 mr-2" /> {busy ? "Uploading..." : "Upload Banner"}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-emerald-600" /> Active Banners ({banners.length})
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {banners.length === 0 && <p className="text-sm text-slate-500">No banners yet.</p>}
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-3 border border-slate-200 rounded-lg p-2">
                <img src={b.image_url} alt="" className="h-16 w-24 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{b.title || "Untitled"}</p>
                  <p className="text-xs text-slate-500 truncate">{b.link_url || "No link"}</p>
                  <p className="text-xs text-slate-400">Order: {b.sort_order}</p>
                </div>
                <button
                  onClick={() => toggle(b)}
                  className={`text-xs px-2 py-1 rounded ${b.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {b.active ? "Active" : "Hidden"}
                </button>
                <button onClick={() => remove(b)} className="text-red-600 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBanners;
