// Admin auth backed by Supabase Auth + user_roles table
import { supabase } from "@/integrations/supabase/client";

const KEY = "admin_session_v1";

export const adminLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) return false;
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
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

export const adminLogout = async () => {
  localStorage.removeItem(KEY);
  try { await supabase.auth.signOut(); } catch {}
};
