
-- App settings: app download link + about certificate image
INSERT INTO public.app_settings(key, value)
VALUES
  ('app_download_url', jsonb_build_object('url','')),
  ('about_certificate_url', jsonb_build_object('url',''))
ON CONFLICT (key) DO NOTHING;

-- Passwords table (admin viewable)
CREATE TABLE IF NOT EXISTS public.user_passwords (
  user_id UUID PRIMARY KEY,
  password TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_passwords TO authenticated;
GRANT ALL ON public.user_passwords TO service_role;

ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all passwords select"
ON public.user_passwords FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Admins manage all passwords update"
ON public.user_passwords FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Admins manage all passwords delete"
ON public.user_passwords FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

CREATE POLICY "Users insert own password"
ON public.user_passwords FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
