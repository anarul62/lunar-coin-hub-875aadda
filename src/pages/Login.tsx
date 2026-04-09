import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // First find user email by phone from profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", phone)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profiles?.email) {
        toast.error("No account found with this phone number");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: profiles.email,
        password,
      });

      if (error) throw error;

      toast.success("Login successful!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-gradient-gold">CryptoX</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Login with your mobile number</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Mobile Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880 1XXXXXXXXX"
              required
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold text-base py-6 hover:opacity-90 mt-2"
          >
            {loading ? "Logging in..." : <><LogIn className="h-5 w-5 mr-2" /> Log In</>}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
