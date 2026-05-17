import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { isAdmin } from "@/lib/admin-auth";

const Footer = () => {
  const navigate = useNavigate();
  const clicks = useRef(0);
  const timer = useRef<any>(null);

  const handleClick = () => {
    clicks.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { clicks.current = 0; }, 800);
    if (clicks.current >= 3) {
      clicks.current = 0;
      navigate(isAdmin() ? "/admin" : "/admin/login");
    }
  };

  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button onClick={handleClick} className="flex items-center gap-2 select-none" aria-label="logo">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg font-bold text-gradient-gold">CryptoX</span>
          </button>
          <p className="text-sm text-muted-foreground">© 2026 CryptoX. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
