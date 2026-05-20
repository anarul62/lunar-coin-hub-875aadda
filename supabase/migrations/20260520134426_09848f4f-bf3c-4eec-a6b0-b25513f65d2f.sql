ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS transaction_id TEXT;
CREATE INDEX IF NOT EXISTS idx_deposits_transaction_id ON public.deposits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits(created_at DESC);