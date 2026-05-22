
-- ============= 1. Role system =============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to seeded admin email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bonus JSONB; rate JSONB;
  amount NUMERIC := 0; currency TEXT := 'USDT'; locked BOOLEAN := true;
  usdt_amount NUMERIC := 0; usd_inr NUMERIC := 83.0;
  inv_code TEXT; ref_user UUID; new_code TEXT;
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
  END IF;
  new_code := public.gen_referral_code();

  INSERT INTO public.profiles (user_id, phone, email, balance_usdt, locked_bonus_usdt, referral_code, referred_by, invitation_code)
  VALUES (NEW.id, NEW.phone, NEW.email,
    CASE WHEN locked THEN 0 ELSE usdt_amount END,
    CASE WHEN locked THEN usdt_amount ELSE 0 END,
    new_code, ref_user, inv_code);

  IF lower(COALESCE(NEW.email,'')) = 'gamingtom076@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END $$;

-- Backfill admin role if user already exists
INSERT INTO public.user_roles(user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'gamingtom076@gmail.com'
ON CONFLICT DO NOTHING;

-- ============= 2. Fix search_path for other functions =============
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c TEXT; exists_check INT;
BEGIN
  LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT 1 INTO exists_check FROM public.profiles WHERE referral_code = c;
    IF exists_check IS NULL THEN RETURN c; END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.gen_deposit_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'RC' || to_char(now(), 'YYYYMMDDHH24MISS') || substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.gen_withdraw_order_number()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'WD' || to_char(now(), 'YYYYMMDDHH24MISS') || substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END $$;

-- ============= 3. profiles =============
DROP POLICY IF EXISTS "Anyone can lookup profile by phone" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============= 4. deposits =============
DROP POLICY IF EXISTS "Anyone read deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admin can update deposits (public UI)" ON public.deposits;
CREATE POLICY "Users view own deposits" ON public.deposits FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update deposits" ON public.deposits FOR UPDATE
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 5. withdrawals =============
DROP POLICY IF EXISTS "Anyone read withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Public update withdrawals (admin UI)" ON public.withdrawals;
CREATE POLICY "Users view own withdrawals" ON public.withdrawals FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update withdrawals" ON public.withdrawals FOR UPDATE
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 6. withdraw_addresses =============
DROP POLICY IF EXISTS "Users view own addresses" ON public.withdraw_addresses;
CREATE POLICY "Users view own addresses" ON public.withdraw_addresses FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============= 7. kyc_requests =============
DROP POLICY IF EXISTS "Users can view their own kyc" ON public.kyc_requests;
DROP POLICY IF EXISTS "Admin can update kyc (public UI)" ON public.kyc_requests;
CREATE POLICY "Users view own kyc" ON public.kyc_requests FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update kyc" ON public.kyc_requests FOR UPDATE
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 8. attendance_checkins =============
DROP POLICY IF EXISTS "Anyone read checkins" ON public.attendance_checkins;
DROP POLICY IF EXISTS "Public manage checkins (admin UI)" ON public.attendance_checkins;
CREATE POLICY "Users view own checkins" ON public.attendance_checkins FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage checkins" ON public.attendance_checkins FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 9. user_xcoin =============
DROP POLICY IF EXISTS "Anyone read user_xcoin" ON public.user_xcoin;
DROP POLICY IF EXISTS "Public manage user_xcoin (admin UI)" ON public.user_xcoin;
DROP POLICY IF EXISTS "Users update own xcoin" ON public.user_xcoin;
CREATE POLICY "Users view own xcoin" ON public.user_xcoin FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own xcoin" ON public.user_xcoin FOR UPDATE
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage xcoin" ON public.user_xcoin FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 10. xcoin_transactions =============
DROP POLICY IF EXISTS "Anyone read xcoin_transactions" ON public.xcoin_transactions;
DROP POLICY IF EXISTS "Public manage xcoin_transactions (admin UI)" ON public.xcoin_transactions;
CREATE POLICY "Users view own xcoin tx" ON public.xcoin_transactions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage xcoin tx" ON public.xcoin_transactions FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 11. xcoin_gift_redemptions =============
DROP POLICY IF EXISTS "Anyone read redemptions" ON public.xcoin_gift_redemptions;
DROP POLICY IF EXISTS "Public manage redemptions (admin UI)" ON public.xcoin_gift_redemptions;
CREATE POLICY "Users view own redemptions" ON public.xcoin_gift_redemptions FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage redemptions" ON public.xcoin_gift_redemptions FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 12. lottery_entries =============
DROP POLICY IF EXISTS "Anyone read lottery_entries" ON public.lottery_entries;
CREATE POLICY "Users view own lottery entries" ON public.lottery_entries FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============= 13. lottery_tickets — lock writes =============
DROP POLICY IF EXISTS "Public manage lottery_tickets" ON public.lottery_tickets;
DROP POLICY IF EXISTS "Public delete lottery_tickets" ON public.lottery_tickets;
DROP POLICY IF EXISTS "Users book own lottery_tickets" ON public.lottery_tickets;
CREATE POLICY "Admins insert lottery_tickets" ON public.lottery_tickets FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete lottery_tickets" ON public.lottery_tickets FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users book unclaimed ticket" ON public.lottery_tickets FOR UPDATE
USING (user_id IS NULL AND auth.uid() IS NOT NULL)
WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update lottery_tickets" ON public.lottery_tickets FOR UPDATE
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 14. lottery_results — lock writes =============
DROP POLICY IF EXISTS "Public manage lottery_results" ON public.lottery_results;
CREATE POLICY "Admins manage lottery_results" ON public.lottery_results FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 15. notifications =============
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Public manage notifications (admin UI)" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR (audience = 'admin' AND public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert notifications" ON public.notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- ============= 16. app_settings =============
DROP POLICY IF EXISTS "Public can manage app_settings (admin UI)" ON public.app_settings;
CREATE POLICY "Admins manage app_settings" ON public.app_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 17. user_withdraw_limits =============
DROP POLICY IF EXISTS "Public manage user withdraw limits (admin UI)" ON public.user_withdraw_limits;
CREATE POLICY "Admins manage user withdraw limits" ON public.user_withdraw_limits FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 18. payment_methods — hide secrets =============
DROP POLICY IF EXISTS "Anyone can view enabled payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Public manage payment methods (admin UI)" ON public.payment_methods;
CREATE POLICY "Admins read payment_methods" ON public.payment_methods FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage payment_methods" ON public.payment_methods FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.payment_methods_public
WITH (security_invoker = on) AS
SELECT id, method_key, label, icon_url, enabled, mode, currency, rate, min_amount,
       preset_amounts, config, gateway_provider, sort_order
FROM public.payment_methods
WHERE enabled = true;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

-- ============= 19. Other admin-managed reference tables (banners/announcements/etc.) =============
DROP POLICY IF EXISTS "Public can manage banners (admin UI)" ON public.banners;
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage announcements (admin UI)" ON public.announcements;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage attendance_rewards (admin UI)" ON public.attendance_rewards;
CREATE POLICY "Admins manage attendance_rewards" ON public.attendance_rewards FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can manage deposit bonus tiers (admin UI)" ON public.deposit_bonus_tiers;
CREATE POLICY "Admins manage deposit bonus tiers" ON public.deposit_bonus_tiers FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage invest_channels (admin UI)" ON public.invest_channels;
CREATE POLICY "Admins manage invest_channels" ON public.invest_channels FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage invest_plans (admin UI)" ON public.invest_plans;
CREATE POLICY "Admins manage invest_plans" ON public.invest_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage lottery_plans (admin UI)" ON public.lottery_plans;
CREATE POLICY "Admins manage lottery_plans" ON public.lottery_plans FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage seo settings (admin UI)" ON public.site_seo_settings;
CREATE POLICY "Admins manage seo settings" ON public.site_seo_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage withdraw methods (admin UI)" ON public.withdraw_methods;
CREATE POLICY "Admins manage withdraw methods" ON public.withdraw_methods FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public manage gift codes (admin UI)" ON public.xcoin_gift_codes;
CREATE POLICY "Admins manage gift codes" ON public.xcoin_gift_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= 20. Storage banners bucket =============
DO $$ BEGIN
  DROP POLICY IF EXISTS "Banners insert public" ON storage.objects;
  DROP POLICY IF EXISTS "Banners update public" ON storage.objects;
  DROP POLICY IF EXISTS "Banners delete public" ON storage.objects;
EXCEPTION WHEN others THEN null; END $$;

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Public can upload banner images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Public can update banner images" ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS "Public can delete banner images" ON storage.objects';
EXCEPTION WHEN others THEN null; END $$;

CREATE POLICY "Banners public read" ON storage.objects FOR SELECT
USING (bucket_id = 'banners');
CREATE POLICY "Admins write banners" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update banners" ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete banners" ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
