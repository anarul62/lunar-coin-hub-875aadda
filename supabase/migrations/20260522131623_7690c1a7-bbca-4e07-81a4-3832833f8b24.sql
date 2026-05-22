
CREATE TABLE public.lottery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid,
  name text NOT NULL,
  image_url text,
  game_image_url text,
  total_tickets int NOT NULL DEFAULT 100,
  ticket_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XCOIN',
  xcoin_bonus numeric DEFAULT 0,
  prize_mode text NOT NULL DEFAULT 'auto',
  pct_first numeric NOT NULL DEFAULT 30,
  pct_second numeric NOT NULL DEFAULT 20,
  pct_third numeric NOT NULL DEFAULT 10,
  pct_4_11 numeric NOT NULL DEFAULT 3.75,
  pct_company numeric NOT NULL DEFAULT 10,
  pct_4_11_enabled boolean NOT NULL DEFAULT true,
  draw_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  duration_minutes int NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'open',
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lottery_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.lottery_plans(id) ON DELETE CASCADE,
  ticket_number int NOT NULL,
  code text NOT NULL,
  user_id uuid,
  booked_at timestamptz,
  UNIQUE(plan_id, ticket_number)
);
CREATE INDEX idx_lottery_tickets_plan ON public.lottery_tickets(plan_id);
CREATE INDEX idx_lottery_tickets_user ON public.lottery_tickets(user_id);

CREATE TABLE public.lottery_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.lottery_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tickets_count int NOT NULL,
  tickets_assigned int NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL,
  currency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lottery_entries_plan_user ON public.lottery_entries(plan_id, user_id);

CREATE TABLE public.lottery_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.lottery_plans(id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.lottery_tickets(id) ON DELETE SET NULL,
  user_id uuid,
  rank int NOT NULL,
  prize_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lottery_results_plan ON public.lottery_results(plan_id);

ALTER TABLE public.lottery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone read lottery_plans" ON public.lottery_plans FOR SELECT USING (true);
CREATE POLICY "Public manage lottery_plans (admin UI)" ON public.lottery_plans FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone read lottery_tickets" ON public.lottery_tickets FOR SELECT USING (true);
CREATE POLICY "Users book own lottery_tickets" ON public.lottery_tickets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public manage lottery_tickets" ON public.lottery_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete lottery_tickets" ON public.lottery_tickets FOR DELETE USING (true);

CREATE POLICY "Anyone read lottery_entries" ON public.lottery_entries FOR SELECT USING (true);
CREATE POLICY "Users insert own entries" ON public.lottery_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own entries" ON public.lottery_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone read lottery_results" ON public.lottery_results FOR SELECT USING (true);
CREATE POLICY "Public manage lottery_results" ON public.lottery_results FOR ALL USING (true) WITH CHECK (true);

-- Auto-seed tickets when a plan is created
CREATE OR REPLACE FUNCTION public.seed_lottery_tickets()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE i int;
BEGIN
  FOR i IN 1..NEW.total_tickets LOOP
    INSERT INTO public.lottery_tickets(plan_id, ticket_number, code)
    VALUES (NEW.id, i, 'DRAW-' || upper(substr(md5(random()::text || i::text), 1, 6)));
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_seed_lottery_tickets
AFTER INSERT ON public.lottery_plans
FOR EACH ROW EXECUTE FUNCTION public.seed_lottery_tickets();
