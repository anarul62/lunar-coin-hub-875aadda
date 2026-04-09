
-- Allow unauthenticated users to look up email by phone (needed for login)
CREATE POLICY "Anyone can lookup profile by phone"
  ON public.profiles FOR SELECT
  USING (true);

-- Drop the old restrictive select policy
DROP POLICY "Users can view their own profile" ON public.profiles;
