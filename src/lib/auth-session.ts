import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const getReadySession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getReadyUser = async (): Promise<User | null> => {
  const session = await getReadySession();
  if (session?.user) return session.user;

  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
};