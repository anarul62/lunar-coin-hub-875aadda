
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audience TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  user_id UUID,
  type TEXT NOT NULL DEFAULT 'info', -- deposit, withdraw, invest, claim, balance, info
  title TEXT NOT NULL,
  body TEXT,
  amount NUMERIC,
  currency TEXT,
  link TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_audience ON public.notifications(audience, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR audience = 'admin');
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR audience = 'admin') WITH CHECK (true);
CREATE POLICY "Public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public manage notifications (admin UI)" ON public.notifications FOR DELETE USING (true);

-- Trigger: deposits
CREATE OR REPLACE FUNCTION public.notify_on_deposit() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('admin', NULL, 'deposit', 'New deposit request',
      'Order ' || COALESCE(NEW.order_number,'') || ' for ' || NEW.amount || ' ' || NEW.currency,
      NEW.amount, NEW.currency, '/admin/deposit', jsonb_build_object('deposit_id', NEW.id, 'user_id', NEW.user_id));
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('user', NEW.user_id, 'deposit', 'Deposit submitted',
      'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' is pending review.',
      NEW.amount, NEW.currency, '/deposit/history', jsonb_build_object('deposit_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('user', NEW.user_id, 'deposit',
      CASE WHEN NEW.status='approved' THEN 'Deposit approved 🎉' WHEN NEW.status='rejected' THEN 'Deposit rejected' ELSE 'Deposit updated' END,
      'Order ' || COALESCE(NEW.order_number,'') || ' — ' || NEW.amount || ' ' || NEW.currency || ' is now ' || NEW.status,
      NEW.amount, NEW.currency, '/deposit/history', jsonb_build_object('deposit_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_deposit ON public.deposits;
CREATE TRIGGER trg_notify_deposit AFTER INSERT OR UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.notify_on_deposit();

-- Trigger: withdrawals
CREATE OR REPLACE FUNCTION public.notify_on_withdraw() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('admin', NULL, 'withdraw', 'New withdrawal request',
      'Order ' || COALESCE(NEW.order_number,'') || ' for ' || NEW.amount || ' ' || NEW.currency,
      NEW.amount, NEW.currency, '/admin/withdrawals', jsonb_build_object('withdrawal_id', NEW.id, 'user_id', NEW.user_id));
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('user', NEW.user_id, 'withdraw', 'Withdrawal requested',
      'Your withdrawal of ' || NEW.amount || ' ' || NEW.currency || ' is being processed.',
      NEW.amount, NEW.currency, '/withdraw/history', jsonb_build_object('withdrawal_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
    VALUES ('user', NEW.user_id, 'withdraw',
      CASE WHEN NEW.status='approved' THEN 'Withdrawal approved' WHEN NEW.status='rejected' THEN 'Withdrawal rejected' ELSE 'Withdrawal updated' END,
      'Order ' || COALESCE(NEW.order_number,'') || ' — ' || NEW.amount || ' ' || NEW.currency || ' is now ' || NEW.status,
      NEW.amount, NEW.currency, '/withdraw/history', jsonb_build_object('withdrawal_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_withdraw ON public.withdrawals;
CREATE TRIGGER trg_notify_withdraw AFTER INSERT OR UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.notify_on_withdraw();

-- Trigger: user_investments
CREATE OR REPLACE FUNCTION public.notify_on_investment() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
  VALUES ('admin', NULL, 'invest', 'New investment',
    'User invested ' || NEW.amount || ' ' || NEW.currency || ' in ' || NEW.plan_name,
    NEW.amount, NEW.currency, '/admin/invest-today', jsonb_build_object('investment_id', NEW.id, 'user_id', NEW.user_id));
  INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
  VALUES ('user', NEW.user_id, 'invest', 'Investment started',
    NEW.plan_name || ' • ' || NEW.amount || ' ' || NEW.currency || ' • ' || NEW.duration_days || ' days',
    NEW.amount, NEW.currency, '/plan-history', jsonb_build_object('investment_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_investment ON public.user_investments;
CREATE TRIGGER trg_notify_investment AFTER INSERT ON public.user_investments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_investment();

-- Trigger: xcoin gift redemptions (claim notifications)
CREATE OR REPLACE FUNCTION public.notify_on_redemption() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(audience, user_id, type, title, body, amount, currency, link, meta)
  VALUES ('user', NEW.user_id, 'claim', 'Gift code claimed 🎁',
    'You received X' || NEW.amount || ' coins.',
    NEW.amount, 'XCOIN', '/rewards', jsonb_build_object('redemption_id', NEW.id));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_redemption ON public.xcoin_gift_redemptions;
CREATE TRIGGER trg_notify_redemption AFTER INSERT ON public.xcoin_gift_redemptions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_redemption();
