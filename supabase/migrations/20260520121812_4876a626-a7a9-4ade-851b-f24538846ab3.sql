
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  method_key text NOT NULL UNIQUE,
  label text NOT NULL,
  icon_url text,
  enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'manual',
  currency text NOT NULL DEFAULT 'INR',
  rate numeric NOT NULL DEFAULT 1,
  min_amount numeric NOT NULL DEFAULT 0,
  preset_amounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  gateway_provider text,
  gateway_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled payment methods"
ON public.payment_methods FOR SELECT USING (true);

CREATE POLICY "Public manage payment methods (admin UI)"
ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.payment_methods (method_key, label, icon_url, currency, sort_order, preset_amounts) VALUES
  ('upi_qr',  'UPI-QR',         'https://files.catbox.moe/6oy1q4.png', 'INR',  1, '[100,200,300,500,1000,2000,3000,5000]'::jsonb),
  ('paytm_qr','Expert Paytm-QR','https://files.catbox.moe/w90129.png', 'INR',  2, '[100,200,300,500,1000,2000,3000,5000]'::jsonb),
  ('nagad',   'Nagad',          'https://files.catbox.moe/nkqw14.png', 'BDT',  3, '[100,200,500,1000,2000,5000]'::jsonb),
  ('bkash',   'bKash',          'https://files.catbox.moe/u73hdj.png', 'BDT',  4, '[100,200,500,1000,2000,5000]'::jsonb),
  ('usdt',    'USDT',           'https://files.catbox.moe/q4kw4f.png', 'USDT', 5, '[10,50,100,500,1000,5000,10000,50000]'::jsonb),
  ('bep20',   'BEP20',          'https://files.catbox.moe/9d53po.webp','USDT', 6, '[10,50,100,500,1000,5000,10000,50000]'::jsonb)
ON CONFLICT (method_key) DO NOTHING;
