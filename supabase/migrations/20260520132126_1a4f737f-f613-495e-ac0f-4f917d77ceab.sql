
ALTER TABLE public.deposits
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS method_key TEXT,
  ADD COLUMN IF NOT EXISTS method_label TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS deposits_order_number_unique ON public.deposits(order_number);

ALTER TABLE public.deposits ALTER COLUMN status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.gen_deposit_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'RC' || to_char(now(), 'YYYYMMDDHH24MISS') || substr(md5(random()::text), 1, 6);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_gen_deposit_order ON public.deposits;
CREATE TRIGGER trg_gen_deposit_order BEFORE INSERT ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.gen_deposit_order_number();

DROP TRIGGER IF EXISTS trg_deposits_updated ON public.deposits;
CREATE TRIGGER trg_deposits_updated BEFORE UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admin can update deposits (public UI)" ON public.deposits;
CREATE POLICY "Admin can update deposits (public UI)" ON public.deposits
FOR UPDATE USING (true) WITH CHECK (true);
