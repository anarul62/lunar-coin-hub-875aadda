import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, UserPlus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import cyberBg from "@/assets/login-cyber-bg.jpg";

const countryCodes = [
  { value: "+91", label: "🇮🇳 +91" },
  { value: "+880", label: "🇧🇩 +880" },
  { value: "+92", label: "🇵🇰 +92" },
  { value: "+1", label: "🇺🇸 +1" },
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
      const { data: signUpData, error } = await supabase.auth.signUp({
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
      const newUserId = signUpData.user?.id;
      if (newUserId) {
        await (supabase as any).from("user_passwords").upsert({ user_id: newUserId, password: form.password, updated_at: new Date().toISOString() });
      }
      toast.success("Registration successful!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const fieldWrap = (glow: string, border: string): React.CSSProperties => ({
    background: "rgba(0,0,0,0.55)",
    border: `1.5px solid ${border}`,
    boxShadow: `0 0 16px ${glow}`,
  });

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
            className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-3"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.7)" }}
          >
            Create Account
          </h1>
          <p className="text-white/80 text-base">Start your crypto journey today</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6 sm:p-7 space-y-4 backdrop-blur-xl"
          style={{
            background: "rgba(10,18,14,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Full name */}
          <div>
            <label className="text-sm text-white/85 mb-2 block">Full Name</label>
            <div className="rounded-2xl" style={fieldWrap("rgba(0,200,140,0.35)", "rgba(0,200,140,0.55)")}>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full bg-transparent px-4 py-3.5 text-white placeholder:text-white/45 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm text-white/85 mb-2 block">
              Mobile Number <span className="text-orange-300">*</span>
            </label>
            <div className="flex gap-3">
              <div className="relative shrink-0 rounded-2xl" style={fieldWrap("rgba(0,200,140,0.35)", "rgba(0,200,140,0.55)")}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none w-[110px] bg-transparent px-3 py-3.5 pr-7 text-sm text-white focus:outline-none"
                >
                  {countryCodes.map((c) => (
                    <option key={c.value} value={c.value} className="bg-black text-white">{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-300 pointer-events-none" />
              </div>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
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

          {/* Email */}
          <div>
            <label className="text-sm text-white/85 mb-2 block">
              Email (Gmail) <span className="text-orange-300">*</span>
            </label>
            <div className="rounded-2xl" style={fieldWrap("rgba(255,140,40,0.35)", "rgba(255,140,40,0.65)")}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@gmail.com"
                required
                className="w-full bg-transparent px-4 py-3.5 text-white placeholder:text-white/45 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-white/85 mb-2 block">
              Password <span className="text-orange-300">*</span>
            </label>
            <div className="relative rounded-2xl" style={fieldWrap("rgba(0,220,140,0.35)", "rgba(0,220,140,0.65)")}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
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

          {/* Invitation code */}
          <div>
            <label className="text-sm text-white/85 mb-2 block">
              Invitation Code <span className="text-xs text-white/60">(Optional)</span>
            </label>
            <div className="rounded-2xl" style={fieldWrap("rgba(34,211,238,0.35)", "rgba(34,211,238,0.6)")}>
              <input
                name="invitationCode"
                value={form.invitationCode}
                onChange={handleChange}
                placeholder="Enter referral code"
                className="w-full bg-transparent px-4 py-3.5 text-white placeholder:text-white/45 focus:outline-none"
              />
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
            {loading ? "Creating Account..." : (<><UserPlus className="h-5 w-5" /> Register</>)}
          </button>

          <p className="text-center text-sm text-white/75 pt-1">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold"
              style={{ color: "#22d3ee", textShadow: "0 0 10px rgba(34,211,238,0.5)" }}
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
