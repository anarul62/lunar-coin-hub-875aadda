
-- Conversations
CREATE TABLE public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open',
  last_message TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unread_admin INT NOT NULL DEFAULT 0,
  unread_user INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user view own conv" ON public.support_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));
CREATE POLICY "user create own conv" ON public.support_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own conv" ON public.support_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'));

-- Messages
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user','admin')),
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_support_msgs_conv ON public.support_messages(conversation_id, created_at);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view msgs in own or admin" ON public.support_messages
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.support_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin')
  );
CREATE POLICY "send msgs in own or admin" ON public.support_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND (
      (sender_role = 'user' AND EXISTS (SELECT 1 FROM public.support_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
      OR (sender_role = 'admin' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin')))
    )
  );

-- Trigger to bump conversation on new message
CREATE OR REPLACE FUNCTION public.touch_support_conv()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message = COALESCE(NEW.content, '[image]'),
      last_message_at = NEW.created_at,
      updated_at = now(),
      unread_admin = CASE WHEN NEW.sender_role = 'user' THEN unread_admin + 1 ELSE unread_admin END,
      unread_user  = CASE WHEN NEW.sender_role = 'admin' THEN unread_user + 1 ELSE unread_user END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_touch_support_conv
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_support_conv();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('support-chat', 'support-chat', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "support chat public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-chat');
CREATE POLICY "support chat upload own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'support-chat' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'subadmin'))
  );

-- Realtime
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
