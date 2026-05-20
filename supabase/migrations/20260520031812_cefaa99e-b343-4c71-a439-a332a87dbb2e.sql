
-- Profiles additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID;

CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- Generator
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE c TEXT; exists_check INT;
BEGIN
  LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT 1 INTO exists_check FROM public.profiles WHERE referral_code = c;
    IF exists_check IS NULL THEN RETURN c; END IF;
  END LOOP;
END $$;

-- Backfill codes for existing users
UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

-- Update handle_new_user to set referral_code + referred_by from invitation_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  bonus JSONB; rate JSONB;
  amount NUMERIC := 0; currency TEXT := 'USDT'; locked BOOLEAN := true;
  usdt_amount NUMERIC := 0; usd_inr NUMERIC := 83.0;
  inv_code TEXT; ref_user UUID; new_code TEXT;
BEGIN
  SELECT value INTO bonus FROM public.app_settings WHERE key = 'registration_bonus';
  SELECT value INTO rate FROM public.app_settings WHERE key = 'usd_inr_rate';
  IF bonus IS NOT NULL THEN
    amount := COALESCE((bonus->>'amount')::NUMERIC, 0);
    currency := COALESCE(bonus->>'currency', 'USDT');
    locked := COALESCE((bonus->>'locked')::BOOLEAN, true);
  END IF;
  IF rate IS NOT NULL THEN usd_inr := COALESCE((rate->>'rate')::NUMERIC, 83.0); END IF;
  IF currency = 'INR' AND usd_inr > 0 THEN usdt_amount := amount / usd_inr; ELSE usdt_amount := amount; END IF;

  inv_code := NEW.raw_user_meta_data->>'invitation_code';
  IF inv_code IS NOT NULL AND length(inv_code) > 0 THEN
    SELECT user_id INTO ref_user FROM public.profiles WHERE referral_code = upper(inv_code) LIMIT 1;
  END IF;
  new_code := public.gen_referral_code();

  INSERT INTO public.profiles (user_id, phone, email, balance_usdt, locked_bonus_usdt, referral_code, referred_by, invitation_code)
  VALUES (NEW.id, NEW.phone, NEW.email,
    CASE WHEN locked THEN 0 ELSE usdt_amount END,
    CASE WHEN locked THEN usdt_amount ELSE 0 END,
    new_code, ref_user, inv_code);
  RETURN NEW;
END $$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Referral claims table
CREATE TABLE IF NOT EXISTS public.referral_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claimed_user_id UUID NOT NULL,
  amount_usdt NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, claimed_user_id)
);
ALTER TABLE public.referral_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own claims" ON public.referral_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own claims" ON public.referral_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deposits placeholder for team recharge stats (if not exists)
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount_usdt NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read deposits" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Users insert own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
