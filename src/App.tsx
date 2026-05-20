import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Wallet from "./pages/Wallet.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder.tsx";
import AdminBanners from "./pages/admin/AdminBanners.tsx";
import AdminKyc from "./pages/admin/AdminKyc.tsx";
import AdminKycRequests from "./pages/admin/AdminKycRequests.tsx";
import AdminBonusManage from "./pages/admin/AdminBonusManage.tsx";
import AdminDepositBonus from "./pages/admin/AdminDepositBonus.tsx";
import AdminReferralBonus from "./pages/admin/AdminReferralBonus.tsx";
import AdminManageReferral from "./pages/admin/AdminManageReferral.tsx";
import AdminInviteBonus from "./pages/admin/AdminInviteBonus.tsx";
import Profile from "./pages/Profile.tsx";
import Team from "./pages/Team.tsx";
import Referral from "./pages/Referral.tsx";
import Deposit from "./pages/Deposit.tsx";
import DepositHistory from "./pages/DepositHistory.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import AdminDeposits from "./pages/admin/AdminDeposits.tsx";
import Withdraw from "./pages/Withdraw.tsx";
import WithdrawMethod from "./pages/WithdrawMethod.tsx";
import WithdrawAddAddress from "./pages/WithdrawAddAddress.tsx";
import WithdrawHistory from "./pages/WithdrawHistory.tsx";
import AdminWithdrawMethods from "./pages/admin/AdminWithdrawMethods.tsx";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals.tsx";

const queryClient = new QueryClient();

const placeholders: { path: string; title: string }[] = [
  { path: "/admin/team", title: "Team Dashboard" },
  { path: "/admin/win-ratio", title: "Set Win Ratio" },
  { path: "/admin/game-trend", title: "Setup Game Trend" },
  { path: "/admin/gold", title: "Gold Invest" },
  { path: "/admin/silver", title: "Silver Invest" },
  { path: "/admin/plans", title: "Investment Plans" },
  
  
  { path: "/admin/payout", title: "Auto PayOut Gateway" },
  { path: "/admin/finance", title: "Finance Setting" },
  { path: "/admin/banned", title: "Banned Users" },
  { path: "/admin/ewallet", title: "Modify Ewallet Address" },
  { path: "/admin/agents", title: "Agent Settings" },
  { path: "/admin/web", title: "Web Settings" },
  { path: "/admin/add-agent", title: "Add Agent" },
  { path: "/admin/agent-data", title: "Agent Data" },
  { path: "/admin/salary", title: "Manage Salary" },
  { path: "/admin/gift-code", title: "Gift Code" },
  { path: "/admin/activity", title: "Activity Award" },
  { path: "/admin/first-gift", title: "First Gift" },
  { path: "/admin/invite-wheel", title: "Invite Wheel" },
  { path: "/admin/spin-wheel", title: "Spin Wheel" },
  { path: "/admin/bonus-collation", title: "Bonus Collation" },
  { path: "/admin/attendance", title: "Attendance Bonus" },
  { path: "/admin/support", title: "Customer Service" },
  { path: "/admin/feedback", title: "Users Feedback" },
  { path: "/admin/telegram", title: "Telegram" },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/team" element={<Team />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/deposit/history" element={<DepositHistory />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/withdraw/history" element={<WithdrawHistory />} />
          <Route path="/withdraw/:methodKey" element={<WithdrawMethod />} />
          <Route path="/withdraw/:methodKey/add" element={<WithdrawAddAddress />} />
          <Route path="/admin/payin" element={<AdminPayments />} />
          <Route path="/admin/deposit" element={<AdminDeposits />} />
          <Route path="/admin/withdraw-methods" element={<AdminWithdrawMethods />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/manage-referral" element={<AdminManageReferral />} />
          <Route path="/admin/invite-bonus" element={<AdminInviteBonus />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/bonus" element={<AdminBonusManage />} />
          <Route path="/admin/deposit-bonus" element={<AdminDepositBonus />} />
          <Route path="/admin/referral-bonus" element={<AdminReferralBonus />} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/admin/kyc/requests" element={<AdminKycRequests />} />
          {placeholders.map(p => (
            <Route key={p.path} path={p.path} element={<AdminPlaceholder title={p.title} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
