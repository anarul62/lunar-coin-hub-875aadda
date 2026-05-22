INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) = 'gamingtom076@gmail.com'
ON CONFLICT DO NOTHING;