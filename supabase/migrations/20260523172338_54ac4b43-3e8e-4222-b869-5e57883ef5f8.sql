ALTER VIEW public.payment_methods_public SET (security_invoker = off);
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;