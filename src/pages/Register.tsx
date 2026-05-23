import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Wallet, Eye, EyeOff, UserPlus, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const countryCodes = [
  { value: "+91", label: "🇮🇳 +91" },
  { value: "+880", label: "🇧🇩 +880" },
  { value: "+92", label: "🇵🇰 +92" },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    invitationCode: "",
  });

  useEffect(() => {
    const ref = searchParams.get("ref") || searchParams.get("code") || searchParams.get("invite");
    if (ref) {
      setForm((f) => ({ ...f, invitationCode: ref.toUpperCase() }));
      try { sessionStorage.setItem("ref_code", ref.toUpperCase()); } catch {}
    } else {
      try {
        const saved = sessionStorage.getItem("ref_code");
        if (saved) setForm((f) => ({ ...f, invitationCode: saved }));
      } catch {}
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.email || !form.password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const fullPhone = `${countryCode}${form.phone}`;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: fullPhone,
            invitation_code: form.invitationCode || null,
          },
        },
      });

      if (error) throw error;

      toast.success("Registration successful!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
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
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Start your crypto journey today</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Phone Number <span className="text-destructive">*</span>
            </label>
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
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="1XXXXXXXXX"
                required
                className="flex-1 min-w-0 rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Email (Gmail) <span className="text-destructive">*</span>
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@gmail.com"
              required
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
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

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Invitation Code <span className="text-xs text-muted-foreground">(Optional)</span>
            </label>
            <input
              name="invitationCode"
              value={form.invitationCode}
              onChange={handleChange}
              placeholder="Enter referral code"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold text-base py-6 hover:opacity-90 mt-2"
          >
            {loading ? "Creating Account..." : <><UserPlus className="h-5 w-5 mr-2" /> Register</>}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
