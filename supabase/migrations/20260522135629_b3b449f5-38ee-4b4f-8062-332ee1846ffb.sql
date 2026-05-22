
ALTER TABLE public.lottery_plans
  ADD COLUMN IF NOT EXISTS auto_recreate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_after_minutes integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recreate_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recreate_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recreate_minutes integer NOT NULL DEFAULT 0;
