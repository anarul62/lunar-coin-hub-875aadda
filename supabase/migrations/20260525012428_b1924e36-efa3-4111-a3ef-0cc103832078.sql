CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bonus JSONB; rate JSONB;
  amount NUMERIC := 0; currency TEXT := 'USDT'; locked BOOLEAN := true;
  usdt_amount NUMERIC := 0; usd_inr NUMERIC := 83.0;
  inv_code TEXT; ref_user UUID; new_code TEXT; agent_user UUID;
  signup_phone TEXT; signup_email TEXT; signup_name TEXT;
  signup_currency TEXT := 'USDT';
BEGIN
  SELECT value INTO bonus FROM public.app_settings WHERE key = 'registration_bonus';
  SELECT value INTO rate  FROM public.app_settings WHERE key = 'usd_inr_rate';
  IF bonus IS NOT NULL THEN
    amount   := COALESCE((bonus->>'amount')::NUMERIC, 0);
    currency := COALESCE(bonus->>'currency', 'USDT');
    locked   := COALESCE((bonus->>'locked')::BOOLEAN, true);
  END IF;
  IF rate IS NOT NULL THEN usd_inr := COALESCE((rate->>'rate')::NUMERIC, 83.0); END IF;
  IF currency = 'INR' AND usd_inr > 0 THEN usdt_amount := amount / usd_inr; ELSE usdt_amount := amount; END IF;

  inv_code := NEW.raw_user_meta_data->>'invitation_code';
  signup_phone := COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NEW.phone);
  signup_email := COALESCE(NULLIF(NEW.email, ''), NEW.raw_user_meta_data->>'email');
  signup_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');

  IF signup_phone LIKE '+880%' THEN
    signup_currency := 'BDT';
  ELSIF signup_phone LIKE '+91%' THEN
    signup_currency := 'INR';
  ELSIF signup_phone LIKE '+92%' THEN
    signup_currency := 'PKR';
  ELSIF signup_phone LIKE '+1%' THEN
    signup_currency := 'USDT';
  ELSE
    signup_currency := 'USDT';
  END IF;

  IF inv_code IS NOT NULL AND length(inv_code) > 0 THEN
    SELECT user_id INTO ref_user FROM public.profiles WHERE referral_code = upper(inv_code) LIMIT 1;
    SELECT user_id INTO agent_user FROM public.agents WHERE upper(agent_code) = upper(inv_code) AND active = true LIMIT 1;
  END IF;
  new_code := public.gen_referral_code();

  INSERT INTO public.profiles (user_id, phone, email, full_name, balance_usdt, locked_bonus_usdt, referral_code, referred_by, invitation_code, agent_id, preferred_currency)
  VALUES (NEW.id, signup_phone, signup_email, signup_name,
    CASE WHEN locked THEN 0 ELSE usdt_amount END,
    CASE WHEN locked THEN usdt_amount ELSE 0 END,
    new_code, ref_user, inv_code, agent_user, signup_currency);

  IF lower(COALESCE(NEW.email,'')) = 'gamingtom076@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;