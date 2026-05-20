
-- 1. Withdrawal methods config
CREATE TABLE IF NOT EXISTS public.withdraw_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon_url TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  charge_type TEXT NOT NULL DEFAULT 'percent', -- 'percent' or 'flat'
  charge_value NUMERIC NOT NULL DEFAULT 0,
  charge_currency TEXT NOT NULL DEFAULT 'INR',
  sort_order INT NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdraw_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read withdraw methods" ON public.withdraw_methods FOR SELECT USING (true);
CREATE POLICY "Public manage withdraw methods (admin UI)" ON public.withdraw_methods FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.withdraw_methods (method_key, label, icon_url, sort_order, charge_currency) VALUES
  ('upi','UPI','https://files.catbox.moe/l870y6.png',1,'INR'),
  ('bank','Bank Card','https://files.catbox.moe/vfz2m5.png',2,'INR'),
  ('usdt','USDT','https://files.catbox.moe/q4kw4f.png',3,'USDT'),
  ('ewallet','E-Wallet','https://files.catbox.moe/nbn2m1.png',4,'BDT')
ON CONFLICT (method_key) DO NOTHING;

-- 2. Saved user payout addresses
CREATE TABLE IF NOT EXISTS public.withdraw_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method_key TEXT NOT NULL,
  label TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_user ON public.withdraw_addresses(user_id, method_key);
ALTER TABLE public.withdraw_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own addresses" ON public.withdraw_addresses FOR SELECT USING (auth.uid() = user_id OR true);
CREATE POLICY "Users insert own addresses" ON public.withdraw_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own addresses" ON public.withdraw_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own addresses" ON public.withdraw_addresses FOR DELETE USING (auth.uid() = user_id);

-- 3. Per-user overrides
CREATE TABLE IF NOT EXISTS public.user_withdraw_limits (
  user_id UUID PRIMARY KEY,
  need_to_refer INT,
  need_to_deposit_usdt NUMERIC,
  daily_max_times INT,
  min_amount NUMERIC,
  max_amount NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_withdraw_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read user withdraw limits" ON public.user_withdraw_limits FOR SELECT USING (true);
CREATE POLICY "Public manage user withdraw limits (admin UI)" ON public.user_withdraw_limits FOR ALL USING (true) WITH CHECK (true);

-- 4. Withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  user_id UUID NOT NULL,
  method_key TEXT NOT NULL,
  method_label TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  amount_usdt NUMERIC NOT NULL DEFAULT 0,
  charge_usdt NUMERIC NOT NULL DEFAULT 0,
  net_usdt NUMERIC NOT NULL DEFAULT 0,
  address_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_w_user ON public.withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_w_status ON public.withdrawals(status);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read withdrawals" ON public.withdrawals FOR SELECT USING (true);
CREATE POLICY "Users insert own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public update withdrawals (admin UI)" ON public.withdrawals FOR UPDATE USING (true) WITH CHECK (true);

-- order_number generator
CREATE OR REPLACE FUNCTION public.gen_withdraw_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'WD' || to_char(now(), 'YYYYMMDDHH24MISS') || substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_gen_withdraw_order ON public.withdrawals;
CREATE TRIGGER trg_gen_withdraw_order BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.gen_withdraw_order_number();

DROP TRIGGER IF EXISTS trg_w_updated_at ON public.withdrawals;
CREATE TRIGGER trg_w_updated_at BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_wa_updated_at ON public.withdraw_addresses;
CREATE TRIGGER trg_wa_updated_at BEFORE UPDATE ON public.withdraw_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_wm_updated_at ON public.withdraw_methods;
CREATE TRIGGER trg_wm_updated_at BEFORE UPDATE ON public.withdraw_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Global settings seed (uses existing app_settings)
INSERT INTO public.app_settings (key, value) VALUES
  ('withdraw_settings', '{"min_amount":1000,"max_amount":1000000,"currency":"INR","daily_max_times":3,"window_start":"00:00","window_end":"23:59","need_to_bet":0,"need_to_refer":0,"need_to_deposit_usdt":0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
