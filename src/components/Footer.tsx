import { Wallet } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-bold text-gradient-gold">CryptoX</span>
        </div>
        <p className="text-sm text-muted-foreground">© 2026 CryptoX. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
