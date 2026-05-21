
CREATE TABLE public.user_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID,
  channel_name TEXT,
  plan_id UUID,
  plan_name TEXT NOT NULL,
  plan_image_url TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  expected_return NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL DEFAULT 0,
  interest_value NUMERIC,
  interest_type TEXT,
  interest_period TEXT,
  compound BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own investments" ON public.user_investments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own investments" ON public.user_investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_user_investments_updated_at
  BEFORE UPDATE ON public.user_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_investments_user ON public.user_investments(user_id, created_at DESC);
