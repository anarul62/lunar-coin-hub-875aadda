import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, ChevronDown, ChevronUp, FileText, Info, Smartphone, Award } from "lucide-react";

type Section = {
  id?: string;
  category: "fra" | "about";
  slug: string;
  title: string;
  body: string;
  icon: string;
  sort_order: number;
  enabled: boolean;
  _isNew?: boolean;
  _open?: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `s-${Date.now()}`;

const AdminSiteContent = () => {
  const [tab, setTab] = useState<"fra" | "about">("fra");
  const [items, setItems] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [appUrl, setAppUrl] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("app_settings").select("key,value").in("key", ["app_download_url", "about_certificate_url"]);
      (data || []).forEach((r: any) => {
        if (r.key === "app_download_url") setAppUrl(r.value?.url || "");
        if (r.key === "about_certificate_url") setCertUrl(r.value?.url || "");
      });
    })();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    await (supabase as any).from("app_settings").upsert([
      { key: "app_download_url", value: { url: appUrl } },
      { key: "about_certificate_url", value: { url: certUrl } },
    ]);
    setSavingSettings(false);
    toast.success("Settings saved");
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("site_content_sections")
      .select("*")
      .eq("category", tab)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data || []).map((d: any) => ({ ...d, _open: false })));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const update = (i: number, patch: Partial<Section>) =>
    setItems((arr) => arr.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const addNew = () => {
    setItems((arr) => [
      {
        category: tab,
        slug: "",
        title: "New section",
        body: "",
        icon: "📄",
        sort_order: (arr[arr.length - 1]?.sort_order || 0) + 10,
        enabled: true,
        _isNew: true,
        _open: true,
      },
      ...arr,
    ]);
  };

  const save = async (i: number) => {
    const it = items[i];
    const payload = {
      category: it.category,
      slug: it.slug?.trim() || slugify(it.title),
      title: it.title,
      body: it.body,
      icon: it.icon,
      sort_order: Number(it.sort_order) || 0,
      enabled: it.enabled,
    };
    if (it._isNew) {
      const { error } = await (supabase as any).from("site_content_sections").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Section added");
    } else {
      const { error } = await (supabase as any)
        .from("site_content_sections")
        .update(payload)
        .eq("id", it.id);
      if (error) return toast.error(error.message);
      toast.success("Saved");
    }
    load();
  };

  const remove = async (i: number) => {
    const it = items[i];
    if (it._isNew) return setItems((arr) => arr.filter((_, idx) => idx !== i));
    if (!confirm(`Delete "${it.title}"?`)) return;
    const { error } = await (supabase as any)
      .from("site_content_sections")
      .delete()
      .eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <AdminLayout title="FRA & About Content">
      <div className="max-w-3xl">
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5" />
            <h2 className="font-semibold">Page Content Manager</h2>
          </div>
          <p className="text-sm text-white/90">
            User-side FRA page এবং About Us page-এর সব section এখান থেকে edit করতে পারবেন।
          </p>
        </div>

        <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-900 text-sm">App & Certificate Settings</h3>
          <div>
            <Label className="text-xs flex items-center gap-1"><Smartphone className="h-3 w-3"/> App Download URL</Label>
            <Input value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://play.google.com/..." />
            <p className="text-[11px] text-slate-500 mt-1">Sidebar এ "Get the App" বাটনে এই লিংক open হবে।</p>
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Award className="h-3 w-3"/> About Page Certificate Image URL</Label>
            <Input value={certUrl} onChange={e => setCertUrl(e.target.value)} placeholder="https://.../certificate.jpg" />
            {certUrl && <img src={certUrl} alt="cert preview" className="mt-2 max-h-32 rounded border border-slate-200" />}
          </div>
          <Button onClick={saveSettings} disabled={savingSettings} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="h-4 w-4 mr-1" /> {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </div>


        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("fra")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "fra" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            <FileText className="inline h-4 w-4 mr-1" /> FRA
          </button>
          <button
            onClick={() => setTab("about")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              tab === "about" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            <Info className="inline h-4 w-4 mr-1" /> About Us
          </button>
          <div className="flex-1" />
          <Button onClick={addNew} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="h-4 w-4 mr-1" /> New
          </Button>
        </div>

        {loading ? (
          <div className="text-slate-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No sections yet. Click <b>New</b> to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={it.id || `new-${i}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  onClick={() => update(i, { _open: !it._open })}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{it.icon}</span>
                    <span className="font-medium text-slate-900 truncate">{it.title}</span>
                    {!it.enabled && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        Hidden
                      </span>
                    )}
                  </span>
                  {it._open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {it._open && (
                  <div className="p-4 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Icon (emoji)</Label>
                        <Input value={it.icon} onChange={(e) => update(i, { icon: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Slug</Label>
                        <Input
                          value={it.slug}
                          onChange={(e) => update(i, { slug: e.target.value })}
                          placeholder="auto-from-title"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Title</Label>
                      <Input value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Body</Label>
                      <Textarea
                        rows={5}
                        value={it.body}
                        onChange={(e) => update(i, { body: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <Label className="text-xs">Sort order</Label>
                        <Input
                          type="number"
                          className="w-24"
                          value={it.sort_order}
                          onChange={(e) => update(i, { sort_order: Number(e.target.value) })}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm mt-5">
                        <input
                          type="checkbox"
                          checked={it.enabled}
                          onChange={(e) => update(i, { enabled: e.target.checked })}
                        />
                        Visible
                      </label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => save(i)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button onClick={() => remove(i)} variant="outline" className="text-red-600 border-red-200">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSiteContent;
