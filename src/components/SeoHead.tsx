import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Mutates <head> with SEO settings stored in site_seo_settings (id=1). Re-runs on route change & realtime updates. */
const upsertMeta = (selector: string, attr: "name" | "property", key: string, value: string) => {
  if (!value) return;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const upsertLink = (rel: string, href: string) => {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const upsertScript = (id: string, content: string, type = "application/ld+json", src?: string) => {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo="${id}"]`);
  if (!content && !src) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.dataset.seo = id;
    document.head.appendChild(el);
  }
  if (src) {
    el.src = src;
    el.async = true;
  } else {
    el.type = type;
    el.text = content;
  }
};

const applySettings = (s: any) => {
  if (!s) return;
  if (s.title) document.title = s.title;
  upsertMeta('meta[name="description"]', "name", "description", s.description);
  upsertMeta('meta[name="keywords"]', "name", "keywords", s.keywords);
  upsertMeta('meta[name="author"]', "name", "author", s.author);
  upsertMeta('meta[name="robots"]', "name", "robots", s.robots);
  upsertMeta('meta[name="google-site-verification"]', "name", "google-site-verification", s.google_site_verification);
  upsertMeta('meta[name="msvalidate.01"]', "name", "msvalidate.01", s.bing_site_verification);

  upsertMeta('meta[property="og:title"]', "property", "og:title", s.og_title || s.title);
  upsertMeta('meta[property="og:description"]', "property", "og:description", s.og_description || s.description);
  upsertMeta('meta[property="og:image"]', "property", "og:image", s.og_image);
  upsertMeta('meta[property="og:url"]', "property", "og:url", s.canonical_url || window.location.href);
  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", s.og_title || s.title);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", s.og_description || s.description);
  upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", s.og_image);
  upsertMeta('meta[name="twitter:site"]', "name", "twitter:site", s.twitter_handle);

  upsertLink("canonical", s.canonical_url || window.location.href);
  if (s.favicon_url) upsertLink("icon", s.favicon_url);

  // JSON-LD
  if (s.json_ld?.trim()) {
    upsertScript("jsonld", s.json_ld.trim());
  }

  // Google Analytics (gtag)
  if (s.google_analytics_id) {
    upsertScript("ga-src", "", "text/javascript", `https://www.googletagmanager.com/gtag/js?id=${s.google_analytics_id}`);
    upsertScript("ga-init", `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${s.google_analytics_id}');`, "text/javascript");
  }

  // GTM
  if (s.gtm_id) {
    upsertScript("gtm", `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtm_id}');`, "text/javascript");
  }

  // Facebook Pixel
  if (s.facebook_pixel_id) {
    upsertScript("fbpixel", `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${s.facebook_pixel_id}');fbq('track','PageView');`, "text/javascript");
  }
};

const SeoHead = () => {
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("site_seo_settings" as any).select("*").eq("id", 1).maybeSingle();
      if (mounted && data) applySettings(data);
    };
    load();
    const ch = supabase
      .channel("seo-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_seo_settings" }, (p) => applySettings(p.new))
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, []);
  return null;
};

export default SeoHead;
