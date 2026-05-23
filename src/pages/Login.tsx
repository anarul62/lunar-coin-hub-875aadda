import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, Eye, EyeOff, LogIn, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const countryCodes = [
  { value: "+91", label: "🇮🇳 +91" },
  { value: "+880", label: "🇧🇩 +880" },
  { value: "+92", label: "🇵🇰 +92" },
];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("Please fill all fields");
      return;
    }

    const fullPhone = `${countryCode}${phone}`;

    setLoading(true);
    try {
      const { data: profiles, error: profileError } = await supabase
        .rpc("lookup_login_email_by_phone" as any, { _phone: fullPhone });

      if (profileError) throw profileError;

      const email = typeof profiles === "string" ? profiles : null;

      if (!email) {
        toast.error("No account found with this phone number");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
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
            <label className="text-sm text-muted-foreground mb-1.5 block">Mobile Number</label>
            <div className="flex gap-2">
              <div className="relative shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none w-[90px] rounded-lg border border-border bg-secondary px-3 py-3 pr-7 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {countryCodes.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1XXXXXXXXX"
                required
                className="flex-1 min-w-0 rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
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
