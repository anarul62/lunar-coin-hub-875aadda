import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getUsdInrRate, usdtToInr } from "@/lib/currency";

const Attendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [accumulated, setAccumulated] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [nextDayIndex, setNextDayIndex] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [xcoinPerUsdt, setXcoinPerUsdt] = useState(1000);
  const [rate, setRate] = useState(83);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setUserId(user.id);
    const [{ data: r }, { data: ch }, { data: setRow }, fxRate] = await Promise.all([
      supabase.from("attendance_rewards").select("*").eq("active", true).order("day"),
      supabase.from("attendance_checkins").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(10),
      supabase.from("app_settings").select("value").eq("key", "xcoin_settings").maybeSingle(),
      getUsdInrRate(),
    ]);
    setRewards(r || []);
    setRate(fxRate);
    setXcoinPerUsdt(Number((setRow?.value as any)?.xcoin_per_usdt || 1000));

    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    const yStr = yesterday.toISOString().slice(0,10);

    const last = (ch || [])[0];
    const done = last?.date === todayStr;
    setTodayDone(done);

    let curStreak = 0;
    let nextDay = 1;
    if (done) {
      curStreak = last.day_index;
      nextDay = (last.day_index % 7) + 1;
    } else if (last?.date === yStr) {
      curStreak = last.day_index;
      nextDay = (last.day_index % 7) + 1;
    } else {
      curStreak = 0;
      nextDay = 1;
    }
    setStreak(curStreak);
    setNextDayIndex(nextDay);

    // accumulated: sum of all xcoin from attendance
    const { data: all } = await supabase.from("attendance_checkins").select("amount_xcoin").eq("user_id", user.id);
    const sum = (all || []).reduce((s, x) => s + Number(x.amount_xcoin || 0), 0);
    setAccumulated(sum);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const checkIn = async () => {
    if (!userId || todayDone) return;
    setSubmitting(true);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);
    const reward = rewards.find(r => r.day === nextDayIndex);
    const amount = Number(reward?.amount_xcoin || 0);
    const { error } = await supabase.from("attendance_checkins").insert({
      user_id: userId, date: todayStr, day_index: nextDayIndex, amount_xcoin: amount,
    });
    if (error) { setSubmitting(false); return toast({ title: "Failed", description: error.message, variant: "destructive" }); }

    const { data: xc } = await supabase.from("user_xcoin").select("balance").eq("user_id", userId).maybeSingle();
    const newBal = Number(xc?.balance || 0) + amount;
    await supabase.from("user_xcoin").upsert({ user_id: userId, balance: newBal, updated_at: new Date().toISOString() });
    await supabase.from("xcoin_transactions").insert({ user_id: userId, type: "attendance", amount, meta: { day_index: nextDayIndex } });

    setSubmitting(false);
    toast({ title: `+${amount} X Coin` });
    load();
  };

  const inrForXcoin = (x: number) => usdtToInr(x / xcoinPerUsdt, rate);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900 pb-32">
      <header className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-4 h-14">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft className="h-5 w-5"/></button>
        <h1 className="text-lg font-semibold">Attendance</h1>
        <div className="w-9"/>
      </header>

      <div className="bg-gradient-to-br from-[#ff7a59] to-[#ff5e5e] text-white p-5">
        <h2 className="text-2xl font-extrabold">Attendance bonus</h2>
        <p className="text-sm opacity-90 mt-1">Get rewards based on consecutive login days</p>
        <div className="mt-4 bg-white text-slate-900 rounded-r-full inline-block py-2 px-4 font-semibold text-sm">
          Attended consecutively <span className="text-red-500 font-bold">{streak}</span> Day
        </div>
        <p className="mt-3 text-sm">Accumulated</p>
        <p className="text-3xl font-extrabold">{accumulated.toFixed(2)} X</p>
        <p className="text-xs opacity-90">≈ ₹{inrForXcoin(accumulated).toFixed(2)}</p>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        {rewards.slice(0, 6).map(r => {
          const done = streak >= r.day;
          const isNext = !todayDone && nextDayIndex === r.day;
          return (
            <div key={r.day} className={`bg-white rounded-xl p-3 text-center ${isNext ? "ring-2 ring-orange-400" : ""}`}>
              <p className="font-bold text-sm">₹{inrForXcoin(Number(r.amount_xcoin)).toFixed(2)}</p>
              <div className={`my-2 mx-auto h-12 w-12 rounded-full flex items-center justify-center text-2xl ${done ? "bg-yellow-400" : "bg-yellow-200"}`}>⭐</div>
              <p className="text-xs text-slate-500">{r.day} Day</p>
            </div>
          );
        })}
      </div>
      {rewards[6] && (
        <div className="px-4">
          <div className={`bg-white rounded-xl p-4 flex items-center gap-4 ${!todayDone && nextDayIndex === 7 ? "ring-2 ring-orange-400" : ""}`}>
            <div className="text-5xl">🎁</div>
            <div className="flex-1 text-center">
              <p className="font-bold">₹{inrForXcoin(Number(rewards[6].amount_xcoin)).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">7 Day</p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent">
        <Button onClick={checkIn} disabled={todayDone || submitting} className="w-full h-12 rounded-full bg-gradient-to-r from-[#ff8e3c] to-[#ff5e5e] text-white text-base font-semibold disabled:opacity-60">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : todayDone ? "Already attended today" : "Attendance"}
        </Button>
      </div>
    </div>
  );
};

export default Attendance;
