
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
USING (active = true);

CREATE POLICY "Public can manage banners (admin UI)"
ON public.banners FOR ALL
USING (true) WITH CHECK (true);

CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Public upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Public update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners');

CREATE POLICY "Public delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners');
