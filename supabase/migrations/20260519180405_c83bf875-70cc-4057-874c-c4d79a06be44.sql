
-- App settings (singleton key/value config)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Public can manage app_settings (admin UI)"
  ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('registration_bonus', '{"amount": 0, "currency": "USDT", "locked": true}'::jsonb),
  ('usd_inr_rate', '{"mode": "auto", "rate": 83.0}'::jsonb),
  ('agent_referral', '{"type": "flat", "amount": 0, "currency": "USDT", "percent": 0}'::jsonb);

-- Deposit bonus tiers
CREATE TABLE public.deposit_bonus_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_deposit_usdt NUMERIC(18,4) NOT NULL,
  bonus_usdt NUMERIC(18,4) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_bonus_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read deposit bonus tiers"
  ON public.deposit_bonus_tiers FOR SELECT USING (true);

CREATE POLICY "Public can manage deposit bonus tiers (admin UI)"
  ON public.deposit_bonus_tiers FOR ALL USING (true) WITH CHECK (true);

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS balance_usdt NUMERIC(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_bonus_usdt NUMERIC(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_currency TEXT NOT NULL DEFAULT 'INR';

-- Update handle_new_user to apply registration bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bonus JSONB;
  rate JSONB;
  amount NUMERIC := 0;
  currency TEXT := 'USDT';
  locked BOOLEAN := true;
  usdt_amount NUMERIC := 0;
  usd_inr NUMERIC := 83.0;
BEGIN
  SELECT value INTO bonus FROM public.app_settings WHERE key = 'registration_bonus';
  SELECT value INTO rate FROM public.app_settings WHERE key = 'usd_inr_rate';

  IF bonus IS NOT NULL THEN
    amount := COALESCE((bonus->>'amount')::NUMERIC, 0);
    currency := COALESCE(bonus->>'currency', 'USDT');
    locked := COALESCE((bonus->>'locked')::BOOLEAN, true);
  END IF;
  IF rate IS NOT NULL THEN
    usd_inr := COALESCE((rate->>'rate')::NUMERIC, 83.0);
  END IF;

  IF currency = 'INR' AND usd_inr > 0 THEN
    usdt_amount := amount / usd_inr;
  ELSE
    usdt_amount := amount;
  END IF;

  INSERT INTO public.profiles (user_id, phone, email, balance_usdt, locked_bonus_usdt)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    CASE WHEN locked THEN 0 ELSE usdt_amount END,
    CASE WHEN locked THEN usdt_amount ELSE 0 END
  );
  RETURN NEW;
END;
$function$;
