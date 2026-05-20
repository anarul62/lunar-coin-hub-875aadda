import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Save, Globe, Code2, BarChart3, FileText } from "lucide-react";

type Settings = {
  site_name: string; title: string; description: string; keywords: string; author: string;
  canonical_url: string; og_title: string; og_description: string; og_image: string;
  twitter_handle: string; robots: string; favicon_url: string;
  google_site_verification: string; bing_site_verification: string;
  google_analytics_id: string; gtm_id: string; facebook_pixel_id: string;
  json_ld: string; custom_head: string; sitemap_extra: string; robots_txt: string;
};

const empty: Settings = {
  site_name: "", title: "", description: "", keywords: "", author: "",
  canonical_url: "", og_title: "", og_description: "", og_image: "",
  twitter_handle: "", robots: "index,follow", favicon_url: "",
  google_site_verification: "", bing_site_verification: "",
  google_analytics_id: "", gtm_id: "", facebook_pixel_id: "",
  json_ld: "", custom_head: "", sitemap_extra: "", robots_txt: "",
};

const Section = ({ icon: Icon, title, desc, children }: any) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
    <div className="flex items-start gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Icon className="h-5 w-5"/></div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const F = ({ label, hint, children }: any) => (
  <div>
    <Label className="text-xs font-medium text-slate-700">{label}</Label>
    {children}
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

const AdminSeo = () => {
  const [s, setS] = useState<Settings>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_seo_settings" as any).select("*").eq("id", 1).maybeSingle();
      if (data) setS({ ...empty, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  const set = (k: keyof Settings) => (e: any) => setS(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_seo_settings" as any).upsert({ id: 1, ...s, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("SEO settings saved — applied site-wide");
  };

  if (loading) return <AdminLayout title="SEO Settings"><div className="text-slate-500">Loading…</div></AdminLayout>;

  return (
    <AdminLayout title="SEO Settings">
      <div className="max-w-3xl">
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
          <div className="flex items-center gap-2 mb-1"><Search className="h-5 w-5"/><h2 className="font-semibold">Search Engine Optimization</h2></div>
          <p className="text-sm text-white/90">Google, Bing & অন্যান্য search engine-এ আপনার website ranking বাড়ানোর জন্য নিচের তথ্যগুলো ভালো ভাবে fill up করুন।</p>
        </div>

        <Section icon={Globe} title="Basic Meta Tags" desc="Page title, description ও keywords — সবচেয়ে গুরুত্বপূর্ণ SEO ফিল্ড।">
          <F label="Site Name"><Input value={s.site_name} onChange={set("site_name")} placeholder="Crypto x"/></F>
          <F label="Title (≤ 60 chars)" hint={`${s.title.length}/60`}><Input value={s.title} onChange={set("title")} maxLength={70}/></F>
          <F label="Meta Description (≤ 160 chars)" hint={`${s.description.length}/160`}><Textarea value={s.description} onChange={set("description")} rows={3} maxLength={180}/></F>
          <F label="Keywords (comma separated)"><Input value={s.keywords} onChange={set("keywords")} placeholder="crypto, nft, usdt"/></F>
          <F label="Author"><Input value={s.author} onChange={set("author")}/></F>
          <F label="Canonical URL" hint="যেমনঃ https://yoursite.com"><Input value={s.canonical_url} onChange={set("canonical_url")}/></F>
          <F label="Favicon URL"><Input value={s.favicon_url} onChange={set("favicon_url")}/></F>
          <F label="Robots" hint="index,follow (allow) | noindex,nofollow (block)"><Input value={s.robots} onChange={set("robots")}/></F>
        </Section>

        <Section icon={FileText} title="Open Graph / Social Share" desc="Facebook, WhatsApp, Twitter-এ share করলে যা দেখাবে।">
          <F label="OG Title"><Input value={s.og_title} onChange={set("og_title")}/></F>
          <F label="OG Description"><Textarea value={s.og_description} onChange={set("og_description")} rows={2}/></F>
          <F label="OG Image URL" hint="1200×630px recommended"><Input value={s.og_image} onChange={set("og_image")}/></F>
          <F label="Twitter Handle"><Input value={s.twitter_handle} onChange={set("twitter_handle")} placeholder="@yourbrand"/></F>
        </Section>

        <Section icon={Search} title="Search Engine Verification" desc="Google Search Console ও Bing Webmaster-এ ownership verify করার জন্য।">
          <F label="Google Site Verification Code" hint="Search Console থেকে paste করুন (content value)"><Input value={s.google_site_verification} onChange={set("google_site_verification")}/></F>
          <F label="Bing Site Verification (msvalidate.01)"><Input value={s.bing_site_verification} onChange={set("bing_site_verification")}/></F>
        </Section>

        <Section icon={BarChart3} title="Analytics & Tracking" desc="Visitor tracking এবং conversion measurement।">
          <F label="Google Analytics ID" hint="যেমনঃ G-XXXXXXXXXX"><Input value={s.google_analytics_id} onChange={set("google_analytics_id")}/></F>
          <F label="Google Tag Manager ID" hint="GTM-XXXXXXX"><Input value={s.gtm_id} onChange={set("gtm_id")}/></F>
          <F label="Facebook Pixel ID"><Input value={s.facebook_pixel_id} onChange={set("facebook_pixel_id")}/></F>
        </Section>

        <Section icon={Code2} title="Advanced — Structured Data & Custom" desc="Schema.org JSON-LD যোগ করলে rich snippet পেতে পারেন।">
          <F label="JSON-LD Structured Data" hint='যেমনঃ {"@context":"https://schema.org","@type":"Organization","name":"Crypto x","url":"https://yoursite.com"}'>
            <Textarea value={s.json_ld} onChange={set("json_ld")} rows={6} className="font-mono text-xs"/>
          </F>
          <F label="Custom Head HTML" hint="যেকোনো additional <meta> বা <script> tag।">
            <Textarea value={s.custom_head} onChange={set("custom_head")} rows={4} className="font-mono text-xs"/>
          </F>
        </Section>

        <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 pb-2 -mx-4 px-4">
          <Button onClick={save} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11">
            <Save className="h-4 w-4 mr-2"/>{saving ? "Saving…" : "Save SEO Settings"}
          </Button>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            ⚡ Saving-এর সাথে সাথেই পুরো website-এ apply হয়ে যাবে। Google-এ index হতে সাধারণত 1–4 সপ্তাহ লাগে।
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSeo;
