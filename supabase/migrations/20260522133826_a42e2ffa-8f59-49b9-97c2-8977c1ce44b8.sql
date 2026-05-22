
-- Extend lottery seed to handle UPDATE: seed missing ticket numbers when total_tickets grows
CREATE OR REPLACE FUNCTION public.seed_lottery_tickets_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE i int;
BEGIN
  IF NEW.total_tickets > OLD.total_tickets THEN
    FOR i IN (OLD.total_tickets + 1)..NEW.total_tickets LOOP
      INSERT INTO public.lottery_tickets(plan_id, ticket_number, code)
      VALUES (NEW.id, i, 'DRAW-' || upper(substr(md5(random()::text || i::text), 1, 6)))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_seed_lottery_tickets_update ON public.lottery_plans;
CREATE TRIGGER trg_seed_lottery_tickets_update
AFTER UPDATE OF total_tickets ON public.lottery_plans
FOR EACH ROW EXECUTE FUNCTION public.seed_lottery_tickets_update();
