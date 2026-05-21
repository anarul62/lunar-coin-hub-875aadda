
CREATE TABLE IF NOT EXISTS public.invest_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'investplan',
  banner_url text,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invest_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read invest_channels" ON public.invest_channels FOR SELECT USING (true);
CREATE POLICY "Public manage invest_channels (admin UI)" ON public.invest_channels FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.invest_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.invest_channels(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text,
  interest_type text NOT NULL DEFAULT 'percent',
  interest_value numeric NOT NULL DEFAULT 0,
  interest_period text NOT NULL DEFAULT 'day',
  duration_days integer NOT NULL DEFAULT 30,
  compound boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'USDT',
  min_amount numeric NOT NULL DEFAULT 0,
  max_amount numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invest_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read invest_plans" ON public.invest_plans FOR SELECT USING (true);
CREATE POLICY "Public manage invest_plans (admin UI)" ON public.invest_plans FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.invest_channels (key, name, type, sort_order) VALUES
  ('gold', 'Gold Investment', 'investplan', 1),
  ('silver', 'Silver Investment', 'investplan', 2),
  ('lottery', 'Digital Lottery Booking', 'lottery', 3)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.app_settings (key, value)
VALUES ('currency_rates', '{"usdt_bdt": 120, "usdt_inr": 83, "usdt_xcoin": 1000}'::jsonb)
ON CONFLICT (key) DO NOTHING;
