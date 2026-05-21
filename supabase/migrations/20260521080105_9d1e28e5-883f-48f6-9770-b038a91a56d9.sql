
-- xcoin balances
CREATE TABLE public.user_xcoin (
  user_id UUID PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_xcoin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read user_xcoin" ON public.user_xcoin FOR SELECT USING (true);
CREATE POLICY "Users insert own xcoin" ON public.user_xcoin FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own xcoin" ON public.user_xcoin FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public manage user_xcoin (admin UI)" ON public.user_xcoin FOR ALL USING (true) WITH CHECK (true);

-- xcoin transactions
CREATE TABLE public.xcoin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xcoin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read xcoin_transactions" ON public.xcoin_transactions FOR SELECT USING (true);
CREATE POLICY "Users insert own xcoin tx" ON public.xcoin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public manage xcoin_transactions (admin UI)" ON public.xcoin_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX idx_xcoin_tx_user ON public.xcoin_transactions(user_id);
CREATE INDEX idx_xcoin_tx_type_created ON public.xcoin_transactions(type, created_at DESC);

-- gift codes
CREATE TABLE public.xcoin_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expire_at TIMESTAMPTZ,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xcoin_gift_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read gift codes" ON public.xcoin_gift_codes FOR SELECT USING (true);
CREATE POLICY "Public manage gift codes (admin UI)" ON public.xcoin_gift_codes FOR ALL USING (true) WITH CHECK (true);

-- gift redemptions
CREATE TABLE public.xcoin_gift_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code_id, user_id)
);
ALTER TABLE public.xcoin_gift_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read redemptions" ON public.xcoin_gift_redemptions FOR SELECT USING (true);
CREATE POLICY "Users insert own redemptions" ON public.xcoin_gift_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public manage redemptions (admin UI)" ON public.xcoin_gift_redemptions FOR ALL USING (true) WITH CHECK (true);

-- attendance reward tiers
CREATE TABLE public.attendance_rewards (
  day INTEGER PRIMARY KEY,
  amount_xcoin NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read attendance_rewards" ON public.attendance_rewards FOR SELECT USING (true);
CREATE POLICY "Public manage attendance_rewards (admin UI)" ON public.attendance_rewards FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.attendance_rewards (day, amount_xcoin) VALUES
  (1, 5), (2, 18), (3, 100), (4, 200), (5, 400), (6, 3000), (7, 7000);

-- attendance checkins
CREATE TABLE public.attendance_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  day_index INTEGER NOT NULL,
  amount_xcoin NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.attendance_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read checkins" ON public.attendance_checkins FOR SELECT USING (true);
CREATE POLICY "Users insert own checkins" ON public.attendance_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public manage checkins (admin UI)" ON public.attendance_checkins FOR ALL USING (true) WITH CHECK (true);

-- announcements / rewards feed
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'notice',
  title TEXT NOT NULL,
  body TEXT,
  gift_code TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read active announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public manage announcements (admin UI)" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

-- seed xcoin global settings into app_settings
INSERT INTO public.app_settings (key, value) VALUES
  ('xcoin_settings', '{"xcoin_per_usdt": 1000, "min_convert_xcoin": 100, "description": "1 USDT = 1000 X Coin. Earn X Coin via attendance bonus and gift codes. Convert X Coin to USDT once you reach the minimum."}'::jsonb)
ON CONFLICT (key) DO NOTHING;
