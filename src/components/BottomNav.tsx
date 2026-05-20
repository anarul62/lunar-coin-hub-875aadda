import { useNavigate, useLocation } from "react-router-dom";
import { Compass, LayoutGrid, Wallet, Users, User } from "lucide-react";

const items = [
  { label: "Discover", icon: Compass, path: "/" },
  { label: "Invest", icon: LayoutGrid, path: "/invest" },
  { label: "Wallet", icon: Wallet, path: "/wallet" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Profile", icon: User, path: "/profile" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-1 safe-area-bottom">
        {items.map((it) => {
          const active = pathname === it.path;
          return (
            <button
              key={it.label}
              onClick={() => navigate(it.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1"
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${active ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"}`}>
                <it.icon className="h-[18px] w-[18px]" />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
