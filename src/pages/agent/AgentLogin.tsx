import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getReadySession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCog } from "lucide-react";

const AgentLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) { setLoading(false); toast.error("Invalid credentials"); return; }
    const session = await getReadySession();
    const userId = session?.user?.id || data.user.id;
    const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", userId).eq("role", "agent").maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("This account is not an agent");
      return;
    }
    localStorage.setItem("agent_session_v1", "1");
    toast.success("Login successful");
    navigate("/agent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
        <div className="flex flex-col items-center gap-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <UserCog className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Agent Panel</h1>
          <p className="text-xs text-slate-500">Sign in to manage your downline</p>
        </div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
        <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">{loading?"Signing in...":"Login"}</Button>
      </form>
    </div>
  );
};
export default AgentLogin;
