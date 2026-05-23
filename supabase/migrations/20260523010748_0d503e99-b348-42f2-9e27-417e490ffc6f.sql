CREATE OR REPLACE FUNCTION public.lookup_login_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.email
  FROM public.profiles p
  WHERE p.phone = _phone
    AND p.email IS NOT NULL
    AND COALESCE(p.blocked, false) = false
  LIMIT 1
$$;