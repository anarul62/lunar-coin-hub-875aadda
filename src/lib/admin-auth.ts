// Admin auth backed by Supabase Auth + user_roles table
import { supabase } from "@/integrations/supabase/client";
import { getReadySession } from "@/lib/auth-session";

const KEY = "admin_session_v1";

export const adminLogin = async (email: string, password: string) => {
  localStorage.removeItem(KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return false;
  const session = await getReadySession();
  const userId = session?.user?.id || data.user.id;
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "subadmin"])
    .maybeSingle();
  if (!roleRow) {
    await supabase.auth.signOut();
    return false;
  }
  localStorage.setItem(KEY, "1");
  return true;
};

export const isAdmin = () => localStorage.getItem(KEY) === "1";

export const requireAdmin = async () => {
  const session = await getReadySession();
  const userId = session?.user?.id;
  if (!userId || localStorage.getItem(KEY) !== "1") return false;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "subadmin"])
    .maybeSingle();

  if (!roleRow) {
    localStorage.removeItem(KEY);
    return false;
  }
  return true;
};

export const adminLogout = async () => {
  localStorage.removeItem(KEY);
  try { await supabase.auth.signOut(); } catch {}
};
