import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import cyberBg from "@/assets/login-cyber-bg.jpg";

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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 relative"
      style={{
        backgroundImage: `url(${cyberBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span
              className="font-heading text-4xl font-extrabold tracking-wide"
              style={{
                background: "linear-gradient(90deg,#ff8a2a,#ffd76a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(255,140,40,0.45)",
              }}
            >
              ⚡ CryptoX
            </span>
          </Link>
          <h1
            className="font-heading text-5xl font-extrabold text-white mb-3"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
          >
            Welcome Back
          </h1>
          <p className="text-white/80 text-base">Login with your mobile number</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 sm:p-7 space-y-5 backdrop-blur-xl"
          style={{
            background: "rgba(10,18,14,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <label className="text-sm text-white/85 mb-2 block">Mobile Number</label>
            <div className="flex gap-3">
              <div
                className="relative shrink-0 rounded-2xl"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: "1.5px solid rgba(0,200,140,0.55)",
                  boxShadow: "0 0 14px rgba(0,200,140,0.35)",
                }}
              >
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none w-[110px] bg-transparent px-3 py-3.5 pr-7 text-sm text-white focus:outline-none"
                >
                  {countryCodes.map((c) => (
                    <option key={c.value} value={c.value} className="bg-black text-white">
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300 pointer-events-none" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="1XXXXXXXXX"
                required
                className="flex-1 min-w-0 rounded-2xl bg-black/55 px-4 py-3.5 text-white placeholder:text-white/45 focus:outline-none"
                style={{
                  border: "1.5px solid rgba(255,140,40,0.65)",
                  boxShadow: "0 0 16px rgba(255,140,40,0.35)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-white/85 mb-2 block">Password</label>
            <div
              className="relative rounded-2xl"
              style={{
                background: "rgba(0,0,0,0.55)",
                border: "1.5px solid rgba(0,220,140,0.65)",
                boxShadow: "0 0 16px rgba(0,220,140,0.35)",
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-transparent px-4 py-3.5 pr-12 text-white placeholder:text-white/45 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-emerald-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-4 font-bold text-white text-lg flex items-center justify-center gap-2 transition-transform active:translate-y-[1px] disabled:opacity-60"
            style={{
              background: "linear-gradient(90deg,#22c55e 0%,#16a34a 35%,#f97316 100%)",
              boxShadow:
                "0 10px 30px rgba(34,197,94,0.35), 0 10px 30px rgba(249,115,22,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
              textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            }}
          >
            {loading ? "Logging in..." : (<><ArrowRight className="h-5 w-5" /> Log In</>)}
          </button>

          <p className="text-center text-sm text-white/75 pt-1">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold"
              style={{ color: "#22d3ee", textShadow: "0 0 10px rgba(34,211,238,0.5)" }}
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
