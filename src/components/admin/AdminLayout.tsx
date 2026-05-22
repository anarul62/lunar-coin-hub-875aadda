import { useEffect, useState, ReactNode } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { isAdmin, adminLogout } from "@/lib/admin-auth";
import {
  LayoutDashboard, Users, ShieldOff, Wallet, Percent, TrendingUp,
  Coins, Gem, FileCheck, LineChart, Gift, Megaphone, Settings,
  UserCog, CreditCard, ArrowDownToLine, ArrowUpFromLine, Banknote,
  Bell, Sun, Menu, X, LogOut, ChevronRight, BadgeIndianRupee,
  Headphones, MessageSquare, Send, Ticket, Users2, Trophy, Image as ImageIcon, Search
} from "lucide-react";

type Item = { label: string; icon: any; path: string };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  { title: "Dashboards", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Notifications", icon: Bell, path: "/admin/notifications" },
    { label: "Team Dashboard", icon: Users2, path: "/admin/team" },
  ]},
  { title: "Game Setting", items: [
    { label: "Set Win Ratio", icon: Percent, path: "/admin/win-ratio" },
    { label: "Setup Game Trend", icon: LineChart, path: "/admin/game-trend" },
  ]},
  { title: "Investments", items: [
    { label: "Today's Invest", icon: TrendingUp, path: "/admin/invest-today" },
    { label: "All Invest", icon: TrendingUp, path: "/admin/invest-all" },
    { label: "Completed Invest", icon: Trophy, path: "/admin/invest-completed" },
    { label: "Invest Channels", icon: LayoutDashboard, path: "/admin/invest-channels" },
    { label: "Invest Setup", icon: TrendingUp, path: "/admin/invest-plans" },
    { label: "Lottery Plans", icon: Ticket, path: "/admin/lottery-plans" },
    { label: "Gold Invest", icon: Coins, path: "/admin/gold" },
    { label: "Silver Invest", icon: Gem, path: "/admin/silver" },
    { label: "Investment Plans", icon: TrendingUp, path: "/admin/plans" },
    { label: "KYC Manager", icon: FileCheck, path: "/admin/kyc" },
    { label: "KYC Requests", icon: FileCheck, path: "/admin/kyc/requests" },
  ]},

  { title: "Finances", items: [
    { label: "Auto PayIn Gateway", icon: ArrowDownToLine, path: "/admin/payin" },
    { label: "Auto PayOut Gateway", icon: ArrowUpFromLine, path: "/admin/payout" },
    { label: "Finance Setting", icon: Banknote, path: "/admin/finance" },
    { label: "Withdraw Methods", icon: Wallet, path: "/admin/withdraw-methods" },
    { label: "Withdrawal Requests", icon: ArrowUpFromLine, path: "/admin/withdrawals" },
    { label: "Deposit", icon: ArrowDownToLine, path: "/admin/deposit" },
  ]},
  { title: "Manage Users", items: [
    { label: "Manage Users", icon: Users, path: "/admin/users" },
    { label: "Banned Users", icon: ShieldOff, path: "/admin/banned" },
    { label: "Modify Ewallet Address", icon: Wallet, path: "/admin/ewallet" },
  ]},
  { title: "Advance Settings", items: [
    { label: "Banners", icon: ImageIcon, path: "/admin/banners" },
    { label: "Agent Settings", icon: UserCog, path: "/admin/agents" },
    { label: "Web Settings", icon: Settings, path: "/admin/web" },
    { label: "SEO", icon: Search, path: "/admin/seo" },
  ]},
  { title: "Manage Agents", items: [
    { label: "Add Agent", icon: UserCog, path: "/admin/add-agent" },
    { label: "Agent Data", icon: Users2, path: "/admin/agent-data" },
    { label: "Manage Salary", icon: BadgeIndianRupee, path: "/admin/salary" },
  ]},
  { title: "Referral & Team", items: [
    { label: "Manage Referral", icon: Users2, path: "/admin/manage-referral" },
    { label: "Invite Bonus Setup", icon: Gift, path: "/admin/invite-bonus" },
    { label: "Agent Referral Bonus", icon: Gift, path: "/admin/referral-bonus" },
  ]},
  { title: "Bonus & Rewards", items: [
    { label: "X Coin Manage", icon: Coins, path: "/admin/xcoin" },
    { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
    { label: "Member Deposit Bonus", icon: Gift, path: "/admin/deposit-bonus" },
    { label: "Bonus Manage", icon: Gift, path: "/admin/bonus" },
    { label: "Gift Code", icon: Ticket, path: "/admin/gift-code" },
    { label: "Activity Award", icon: Trophy, path: "/admin/activity" },
    { label: "First Gift", icon: Gift, path: "/admin/first-gift" },
    { label: "Invite Wheel", icon: Megaphone, path: "/admin/invite-wheel" },
    { label: "Spin Wheel", icon: Megaphone, path: "/admin/spin-wheel" },
    { label: "Bonus Collation", icon: Gift, path: "/admin/bonus-collation" },
    { label: "Attendance Bonus", icon: Gift, path: "/admin/attendance" },
  ]},
  { title: "Support", items: [
    { label: "Customer Service", icon: Headphones, path: "/admin/support" },
    { label: "Users Feedback", icon: MessageSquare, path: "/admin/feedback" },
    { label: "Telegram", icon: Send, path: "/admin/telegram" },
  ]},
];

const AdminLayout = ({ children, title }: { children: ReactNode; title?: string }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAdmin()) navigate("/admin/login");
  }, [navigate]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { count } = await (supabase as any).from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("audience", "admin").eq("read", false);
      if (mounted) setUnread(count || 0);
    };
    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, [pathname]);

  const logout = async () => { await adminLogout(); navigate("/admin/login"); };


  return (
    <div className="admin-scope min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white border-r border-slate-200 transform transition-transform overflow-y-auto ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold">A</div>
            <span className="font-bold text-slate-900">Admin Panel</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1"><X className="h-5 w-5"/></button>
        </div>
        <nav className="p-2 pb-20">
          {groups.map((g) => (
            <div key={g.title} className="mb-3">
              <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{g.title}</div>
              {g.items.map((it) => {
                const active = pathname === it.path;
                return (
                  <Link key={it.path} to={it.path} onClick={() => setOpen(false)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-emerald-50 text-emerald-700 font-medium" : "text-slate-700 hover:bg-slate-100"}`}>
                    <span className="flex items-center gap-3">
                      <it.icon className="h-4 w-4"/>
                      {it.label}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-40"/>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-30 lg:hidden"/>}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-1"><Menu className="h-5 w-5"/></button>
            <h1 className="font-semibold text-slate-900 truncate">{title || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <Sun className="h-5 w-5"/>
            <button onClick={() => navigate("/admin/notifications")} className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5"/>
              {unread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <button onClick={logout} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">

              <LogOut className="h-4 w-4"/> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
