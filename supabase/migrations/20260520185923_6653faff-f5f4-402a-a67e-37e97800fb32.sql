
CREATE TABLE IF NOT EXISTS public.site_seo_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Crypto x',
  title TEXT NOT NULL DEFAULT 'Crypto x',
  description TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  canonical_url TEXT NOT NULL DEFAULT '',
  og_title TEXT NOT NULL DEFAULT '',
  og_description TEXT NOT NULL DEFAULT '',
  og_image TEXT NOT NULL DEFAULT '',
  twitter_handle TEXT NOT NULL DEFAULT '',
  robots TEXT NOT NULL DEFAULT 'index,follow',
  favicon_url TEXT NOT NULL DEFAULT '',
  google_site_verification TEXT NOT NULL DEFAULT '',
  bing_site_verification TEXT NOT NULL DEFAULT '',
  google_analytics_id TEXT NOT NULL DEFAULT '',
  gtm_id TEXT NOT NULL DEFAULT '',
  facebook_pixel_id TEXT NOT NULL DEFAULT '',
  json_ld TEXT NOT NULL DEFAULT '',
  custom_head TEXT NOT NULL DEFAULT '',
  sitemap_extra TEXT NOT NULL DEFAULT '',
  robots_txt TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT only_one_row CHECK (id = 1)
);

ALTER TABLE public.site_seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read seo settings" ON public.site_seo_settings FOR SELECT USING (true);
CREATE POLICY "Public manage seo settings (admin UI)" ON public.site_seo_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.site_seo_settings (id, site_name, title, description, keywords)
VALUES (1, 'Crypto x', 'Crypto x — Buy, Sell & Invest in Crypto', 'Crypto x is a crypto investment platform for buying/selling NFTs and managing digital assets.', 'crypto, nft, investment, usdt, bitcoin, trading')
ON CONFLICT (id) DO NOTHING;
