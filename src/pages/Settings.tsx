import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, Sun, Moon, Eye, EyeOff, Loader2 } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"dark" | "light">(
    (localStorage.getItem("theme") as "dark" | "light") || "dark"
  );
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [show, setShow] = useState({ o: false, n: false, c: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.classList.add("light");
    else root.classList.remove("light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changePassword = async () => {
    if (newPass.length < 6) return toast({ title: "Password too short", description: "Use at least 6 characters", variant: "destructive" });
    if (newPass !== confirmPass) return toast({ title: "Passwords do not match", variant: "destructive" });
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setSaving(false); return toast({ title: "Not signed in", variant: "destructive" }); }
    // Verify old password
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPass });
    if (signErr) { setSaving(false); return toast({ title: "Old password is incorrect", variant: "destructive" }); }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: "Password changed successfully" });
    setOldPass(""); setNewPass(""); setConfirmPass("");
  };

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-14 px-4 max-w-md mx-auto">
        <div className="flex items-center gap-2 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Settings</h1>
        </div>

        {/* Theme */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-card mt-2">
          <h2 className="text-sm font-semibold mb-3">Appearance</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                theme === "dark"
                  ? "border-primary bg-gradient-gold-subtle shadow-gold"
                  : "border-border bg-secondary"
              }`}
            >
              <Moon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Night Mode</span>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition ${
                theme === "light"
                  ? "border-primary bg-gradient-gold-subtle shadow-gold"
                  : "border-border bg-secondary"
              }`}
            >
              <Sun className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Day Mode</span>
            </button>
          </div>
        </section>

        {/* Change password */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-card mt-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Change Password
          </h2>
          <div className="space-y-3">
            <PassField label="Old Password" value={oldPass} onChange={setOldPass}
              visible={show.o} toggle={() => setShow(s => ({ ...s, o: !s.o }))} />
            <PassField label="New Password" value={newPass} onChange={setNewPass}
              visible={show.n} toggle={() => setShow(s => ({ ...s, n: !s.n }))} />
            <PassField label="Confirm Password" value={confirmPass} onChange={setConfirmPass}
              visible={show.c} toggle={() => setShow(s => ({ ...s, c: !s.c }))} />
            <Button
              onClick={changePassword}
              disabled={saving || !oldPass || !newPass || !confirmPass}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
};

const PassField = ({ label, value, onChange, visible, toggle }: any) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border-border pr-10"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={toggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  </div>
);

export default Settings;
