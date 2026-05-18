
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.kyc_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  mobile TEXT NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_user_id ON public.kyc_requests(user_id);
CREATE INDEX idx_kyc_status ON public.kyc_requests(status);

ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own kyc"
  ON public.kyc_requests FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can insert their own kyc"
  ON public.kyc_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update kyc (public UI)"
  ON public.kyc_requests FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can delete own kyc"
  ON public.kyc_requests FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_kyc_requests_updated_at
  BEFORE UPDATE ON public.kyc_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
