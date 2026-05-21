import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu, Wallet, LogOut, User, ChevronRight, ChevronDown,
  Compass, TrendingUp, Briefcase, Gift, Package, FileText, Wrench, Smartphone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser } from "@supabase/supabase-js";

const menuItems: { label: string; icon: any; expandable: boolean; path?: string }[] = [
  { label: "Discover", icon: Compass, expandable: false, path: "/" },
  { label: "Invest", icon: TrendingUp, expandable: false, path: "/invest" },
  { label: "Portfolio", icon: Briefcase, expandable: false },
  { label: "Refer & Earn", icon: Gift, expandable: false, path: "/referral" },
  { label: "Our Products", icon: Package, expandable: true },
  { label: "FRA", icon: FileText, expandable: false },
  { label: "Tools", icon: Wrench, expandable: true },
];

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="text-foreground p-1 -ml-1" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[85vw] sm:max-w-sm bg-background border-r border-border flex flex-col">
              <div className="flex items-center gap-2 px-5 pt-6 pb-4 border-b border-border">
                <Wallet className="h-6 w-6 text-primary" />
                <span className="font-heading text-lg font-bold text-gradient-gold">CryptoX</span>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setOpen(false); }}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-border/60 hover:bg-secondary/40 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-primary" />
                      <span className="font-heading text-base font-semibold text-foreground">{item.label}</span>
                    </span>
                    {item.expandable
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </button>
                ))}

                {/* Download banner */}
                <div className="mx-4 mt-6 rounded-2xl bg-gradient-gold-subtle border border-primary/20 p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <p className="text-sm text-foreground leading-snug">
                      <span className="font-bold text-gradient-gold">Download</span>{" "}
                      the CryptoX App and stay connected 24/7
                    </p>
                    <Smartphone className="h-6 w-6 text-primary shrink-0" />
                  </div>
                  <Button className="w-full bg-gradient-gold text-primary-foreground font-semibold">
                    Get the App
                  </Button>
                </div>
              </div>

              <div className="px-4 py-4 border-t border-border">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                      <User className="h-4 w-4 text-primary" />
                      <span className="truncate">{user.user_metadata?.full_name || user.email}</span>
                    </div>
                    <Button variant="outline" className="w-full border-primary/30" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-primary/30" onClick={() => { setOpen(false); navigate("/login"); }}>
                      Log In
                    </Button>
                    <Button className="bg-gradient-gold text-primary-foreground font-semibold" onClick={() => { setOpen(false); navigate("/register"); }}>
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold text-gradient-gold">CryptoX</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-sm font-bold">
              {(user.user_metadata?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate("/login")} className="bg-gradient-gold text-primary-foreground font-semibold h-9">
              Log In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
