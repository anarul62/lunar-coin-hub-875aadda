
-- Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'subadmin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

-- Admin permissions table
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage admin_permissions" ON public.admin_permissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own permissions" ON public.admin_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER admin_permissions_updated_at
  BEFORE UPDATE ON public.admin_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  agent_code text NOT NULL UNIQUE,
  name text,
  email text,
  phone text,
  created_by uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage agents" ON public.agents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents view own row" ON public.agents
  FOR SELECT USING (auth.uid() = user_id);

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link users to agents
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent_id uuid;
CREATE INDEX IF NOT EXISTS idx_profiles_agent_id ON public.profiles(agent_id);

-- Allow agents to view their downline profiles
CREATE POLICY "Agents view downline profiles" ON public.profiles
  FOR SELECT USING (agent_id = auth.uid());

-- Allow agents to view their downline deposits/withdrawals
CREATE POLICY "Agents view downline deposits" ON public.deposits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = deposits.user_id AND p.agent_id = auth.uid())
  );

CREATE POLICY "Agents view downline withdrawals" ON public.withdrawals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = withdrawals.user_id AND p.agent_id = auth.uid())
  );

-- Update handle_new_user to link agent_id when invitation code matches an agent_code
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
  IF inv_code IS NOT NULL AND length(inv_code) > 0 THEN
    SELECT user_id INTO ref_user FROM public.profiles WHERE referral_code = upper(inv_code) LIMIT 1;
    SELECT user_id INTO agent_user FROM public.agents WHERE upper(agent_code) = upper(inv_code) AND active = true LIMIT 1;
  END IF;
  new_code := public.gen_referral_code();

  INSERT INTO public.profiles (user_id, phone, email, balance_usdt, locked_bonus_usdt, referral_code, referred_by, invitation_code, agent_id)
  VALUES (NEW.id, NEW.phone, NEW.email,
    CASE WHEN locked THEN 0 ELSE usdt_amount END,
    CASE WHEN locked THEN usdt_amount ELSE 0 END,
    new_code, ref_user, inv_code, agent_user);

  IF lower(COALESCE(NEW.email,'')) = 'gamingtom076@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $function$;
