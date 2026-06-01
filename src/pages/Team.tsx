import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Users, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type LevelData = { level: number; pct: number; members: any[]; recharge: number };

const Team = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [openLevel, setOpenLevel] = useState<LevelData | null>(null);
  const [showList, setShowList] = useState<{ title: string; users: any[] } | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    // commission percents
    const { data: cs } = await supabase.from("app_settings").select("value").eq("key", "commission_levels").maybeSingle();
    const cfg = (cs?.value as any) || { deposit: { enabled: true, levels: [25, 3, 2] } };
    const pcts: number[] = cfg.deposit?.levels || [25, 3, 2];

    // Fetch full downline via security-definer RPC (RLS-safe)
    const { data: tree } = await (supabase as any).rpc("get_referral_descendants", { root_id: user.id, max_depth: pcts.length });
    const all = (tree || []) as any[];

    // Aggregate deposits across all downline users in one call
    const allIds = all.map(m => m.user_id);
    const depMap: Record<string, number> = {};
    if (allIds.length) {
      const { data: deps } = await (supabase as any).rpc("get_deposit_totals_for_users", { ids: allIds });
      (deps || []).forEach((d: any) => { depMap[d.user_id] = Number(d.total || 0); });
    }

    const lvls: LevelData[] = [];
    for (let i = 0; i < pcts.length; i++) {
      const members = all.filter(m => m.level === i + 1);
      const recharge = members.reduce((s, m) => s + (depMap[m.user_id] || 0), 0);
      lvls.push({ level: i + 1, pct: pcts[i], members, recharge });
    }
    setLevels(lvls);
    setLoading(false);
  };

  const totalPeople = levels.reduce((s, l) => s + l.members.length, 0);
  const totalRecharge = levels.reduce((s, l) => s + l.recharge, 0);
  const allUsers = levels.flatMap(l => l.members.map(m => ({ ...m, _level: l.level })));

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <Navbar />
      <main className="pt-14">
        <div className="flex items-center gap-3 px-4 h-12 border-b border-border">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5"/></button>
          <h1 className="font-semibold">My Team</h1>
        </div>

        {/* Hero */}
        <div className="relative px-4 pt-5 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"/>
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 p-5 text-center">
            <div className="mx-auto h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
              <Users className="h-7 w-7 text-primary"/>
            </div>
            <h2 className="text-xl font-bold">My Team</h2>
            <p className="text-xs text-muted-foreground mt-1">Track your team performance, total members, recharge volume, and referral rebate income from each level.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary"/></div>
        ) : (
          <>
            <div className="px-4 grid grid-cols-2 gap-3">
              <button onClick={() => setShowList({ title: "Team Recharge — Users", users: allUsers })} className="rounded-xl bg-card border border-border p-4 text-center">
                <p className="text-xl font-bold text-primary">${totalRecharge.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Team Recharge</p>
              </button>
              <button onClick={() => setShowList({ title: "Total People", users: allUsers })} className="rounded-xl bg-card border border-border p-4 text-center">
                <p className="text-xl font-bold text-primary">{totalPeople}</p>
                <p className="text-xs text-muted-foreground mt-1">Total People</p>
              </button>
            </div>

            <div className="px-4 mt-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded"/> Referral Levels
              </h3>
              <div className="space-y-3">
                {levels.map((l) => (
                  <button key={l.level} onClick={() => setOpenLevel(l)} className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 text-left">
                    <div className="h-12 w-12 rounded-lg bg-gradient-gold text-primary-foreground flex flex-col items-center justify-center font-bold text-xs shrink-0">
                      LV{l.level}
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold">{l.members.length}</p>
                      <p className="text-[11px] text-muted-foreground">Team Members <span className="text-primary font-semibold">({l.pct}%)</span></p>
                    </div>
                    <div className="w-px h-8 bg-border"/>
                    <div className="flex-1 text-center">
                      <p className="text-lg font-bold text-primary">${(l.recharge * l.pct / 100).toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground">Rebate Income</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Level details */}
      <Dialog open={!!openLevel} onOpenChange={() => setOpenLevel(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Level {openLevel?.level} Members</DialogTitle></DialogHeader>
          <UserList users={openLevel?.members || []}/>
        </DialogContent>
      </Dialog>
      <Dialog open={!!showList} onOpenChange={() => setShowList(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>{showList?.title}</DialogTitle></DialogHeader>
          <UserList users={showList?.users || []}/>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

const UserList = ({ users }: { users: any[] }) => {
  if (!users.length) return <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>;
  return (
    <div className="max-h-[60vh] overflow-y-auto space-y-2">
      {users.map((u, i) => (
        <div key={u.user_id || i} className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{u.full_name || u.email?.split("@")[0] || "User"}</p>
            <p className="text-[11px] text-muted-foreground font-mono truncate">UID: {String(u.user_id).slice(0, 12)}…</p>
          </div>
          {u._level && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary">LV{u._level}</span>}
        </div>
      ))}
    </div>
  );
};

export default Team;
