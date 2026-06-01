
-- Allow users to see profiles of people they directly referred (for Referral page + Team LV1)
CREATE POLICY "Users view direct referrals"
  ON public.profiles
  FOR SELECT
  USING (referred_by = auth.uid());

-- Security definer function for multi-level team data (RLS-safe BFS)
CREATE OR REPLACE FUNCTION public.get_referral_descendants(root_id uuid, max_depth int DEFAULT 5)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  phone text,
  referral_code text,
  balance_usdt numeric,
  level int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    SELECT p.user_id, p.full_name, p.email, p.phone, p.referral_code, p.balance_usdt, 1 AS level
    FROM public.profiles p
    WHERE p.referred_by = root_id
    UNION ALL
    SELECT p.user_id, p.full_name, p.email, p.phone, p.referral_code, p.balance_usdt, t.level + 1
    FROM public.profiles p
    JOIN tree t ON p.referred_by = t.user_id
    WHERE t.level < max_depth
  )
  SELECT * FROM tree;
$$;

GRANT EXECUTE ON FUNCTION public.get_referral_descendants(uuid, int) TO authenticated;

-- Helper: aggregate approved deposit totals for a set of users (RLS-safe)
CREATE OR REPLACE FUNCTION public.get_deposit_totals_for_users(ids uuid[])
RETURNS TABLE (user_id uuid, total numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.user_id, COALESCE(SUM(d.amount_usdt), 0) AS total
  FROM public.deposits d
  WHERE d.user_id = ANY(ids)
  GROUP BY d.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_deposit_totals_for_users(uuid[]) TO authenticated;
