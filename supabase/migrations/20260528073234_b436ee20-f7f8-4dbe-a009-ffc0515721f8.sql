
CREATE OR REPLACE FUNCTION public.finalize_matured_investments(_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  rates JSONB;
  rate NUMERIC;
  return_usdt NUMERIC;
  target_user UUID;
  finalized INT := 0;
BEGIN
  target_user := COALESCE(_user_id, auth.uid());
  IF target_user IS NULL THEN
    RETURN 0;
  END IF;

  SELECT value INTO rates FROM public.app_settings WHERE key = 'currency_rates';

  FOR inv IN
    SELECT * FROM public.user_investments
    WHERE user_id = target_user
      AND status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at <= now()
  LOOP
    -- Currency -> USDT
    IF upper(inv.currency) = 'USDT' THEN
      return_usdt := inv.expected_return;
    ELSIF upper(inv.currency) = 'XCOIN' THEN
      rate := COALESCE((rates->>'usdt_xcoin')::numeric, 1000);
      return_usdt := CASE WHEN rate > 0 THEN inv.expected_return / rate ELSE 0 END;
    ELSIF upper(inv.currency) = 'INR' THEN
      rate := COALESCE((rates->>'usdt_inr')::numeric, 83);
      return_usdt := CASE WHEN rate > 0 THEN inv.expected_return / rate ELSE 0 END;
    ELSIF upper(inv.currency) = 'BDT' THEN
      rate := COALESCE((rates->>'usdt_bdt')::numeric, 120);
      return_usdt := CASE WHEN rate > 0 THEN inv.expected_return / rate ELSE 0 END;
    ELSIF upper(inv.currency) = 'PKR' THEN
      rate := COALESCE((rates->>'usdt_pkr')::numeric, 280);
      return_usdt := CASE WHEN rate > 0 THEN inv.expected_return / rate ELSE 0 END;
    ELSE
      return_usdt := inv.expected_return;
    END IF;

    IF upper(inv.currency) = 'XCOIN' THEN
      INSERT INTO public.user_xcoin(user_id, balance, updated_at)
      VALUES (inv.user_id, inv.expected_return, now())
      ON CONFLICT (user_id) DO UPDATE
        SET balance = public.user_xcoin.balance + EXCLUDED.balance,
            updated_at = now();
    ELSE
      UPDATE public.profiles
        SET balance_usdt = COALESCE(balance_usdt, 0) + return_usdt,
            updated_at = now()
        WHERE user_id = inv.user_id;
    END IF;

    UPDATE public.user_investments
      SET status = 'completed', updated_at = now()
      WHERE id = inv.id;

    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('user', inv.user_id, 'invest', 'Investment matured 🎉',
      inv.plan_name || ' completed. ' || inv.expected_return || ' ' || inv.currency || ' credited to your wallet.',
      inv.expected_return, inv.currency, '/plan-history',
      jsonb_build_object('investment_id', inv.id, 'credited_usdt', return_usdt));

    finalized := finalized + 1;
  END LOOP;

  RETURN finalized;
END
$$;

GRANT EXECUTE ON FUNCTION public.finalize_matured_investments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_matured_investments(uuid) TO service_role;

-- Ensure user_xcoin has unique user_id for ON CONFLICT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_xcoin_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.user_xcoin ADD CONSTRAINT user_xcoin_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table THEN NULL; WHEN others THEN NULL;
    END;
  END IF;
END $$;
