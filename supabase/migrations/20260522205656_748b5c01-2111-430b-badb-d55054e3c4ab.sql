
-- Lottery results
DROP POLICY IF EXISTS "Anyone read lottery_results" ON public.lottery_results;
CREATE POLICY "Users view own lottery_results" ON public.lottery_results
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Lottery tickets
DROP POLICY IF EXISTS "Anyone read lottery_tickets" ON public.lottery_tickets;
CREATE POLICY "Auth users view tickets" ON public.lottery_tickets
  FOR SELECT TO authenticated USING (
    user_id IS NULL OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
  );

-- Notifications: enforce self-targeting on insert (admins can still insert any)
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (audience = 'user' AND user_id = auth.uid())
  );

-- User withdraw limits
DROP POLICY IF EXISTS "Anyone read user withdraw limits" ON public.user_withdraw_limits;
CREATE POLICY "Users view own withdraw limits" ON public.user_withdraw_limits
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Gift codes: authenticated only
DROP POLICY IF EXISTS "Anyone read gift codes" ON public.xcoin_gift_codes;
CREATE POLICY "Auth users read gift codes" ON public.xcoin_gift_codes
  FOR SELECT TO authenticated USING (true);

-- Banners storage bucket: remove public write/update/delete policies
DROP POLICY IF EXISTS "Public upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Public update banners" ON storage.objects;
DROP POLICY IF EXISTS "Public delete banners" ON storage.objects;
