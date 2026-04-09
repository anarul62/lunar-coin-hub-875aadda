import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Wallet, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

const navItems = ["Market", "Investment", "NFT", "Wallet"];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupaUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Wallet className="h-7 w-7 text-primary" />
          <span className="font-heading text-xl font-bold text-gradient-gold">CryptoX</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4 text-primary" />
                <span className="max-w-[120px] truncate">{user.user_metadata?.full_name || user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground">
                Log In
              </Button>
              <Button size="sm" onClick={() => navigate("/register")} className="bg-gradient-gold text-primary-foreground font-semibold hover:opacity-90">
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="container py-4 flex flex-col gap-3">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item)}
                  className="text-left py-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {item}
                </button>
              ))}
              {user ? (
                <Button onClick={handleLogout} variant="outline" className="border-primary/30 text-foreground mt-2">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              ) : (
                <>
                  <Button onClick={() => { navigate("/login"); setOpen(false); }} variant="ghost" className="text-muted-foreground">
                    Log In
                  </Button>
                  <Button onClick={() => { navigate("/register"); setOpen(false); }} className="bg-gradient-gold text-primary-foreground font-semibold">
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
