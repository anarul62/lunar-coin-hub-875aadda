import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Maximize2, Settings as SettingsIcon, FunctionSquare, LineChart as LineChartIcon, Star, Bell, Copy, Grid3x3 } from "lucide-react";

// Fake-but-realistic SILVER/USDT candlestick chart styled like the user's reference.
// Pulls a base XAG price (best effort) and runs a random-walk simulation.

type Candle = { o: number; h: number; l: number; c: number; v: number; t: number };

const TIMEFRAMES = ["1m", "15m", "1h", "4h", "1d"];
const VISIBLE = 70;
const TICK_MS = 1500;

const fetchBasePrice = async (): Promise<number> => {
  try {
    const r = await fetch("https://api.gold-api.com/price/XAG", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      const p = Number(j?.price);
      if (p > 5 && p < 500) return p;
    }
  } catch {}
  return 75.9 + (Math.random() - 0.5) * 2;
};

const seedCandles = (base: number, n: number): Candle[] => {
  const out: Candle[] = [];
  let price = base - n * 0.02;
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const drift = (base - price) * 0.04;
    const vol = 0.06 + Math.random() * 0.08;
    const o = price;
    const change = drift + (Math.random() - 0.48) * vol * 2;
    const c = o + change;
    const h = Math.max(o, c) + Math.random() * vol;
    const l = Math.min(o, c) - Math.random() * vol;
    out.push({ o, h, l, c, v: 1000 + Math.random() * 4000, t: now - (n - i) * TICK_MS });
    price = c;
  }
  return out;
};

const SilverTradingChart = ({ onBack }: { onBack?: () => void }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tf, setTf] = useState("15m");
  const baseRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const base = await fetchBasePrice();
      if (!mounted) return;
      baseRef.current = base;
      setCandles(seedCandles(base, VISIBLE));
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!candles.length) return;
    const id = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const base = baseRef.current || last.c;
        const closeCandle = Math.random() < 0.18;
        const drift = (base - last.c) * 0.02;
        const vol = 0.05 + Math.random() * 0.07;
        const change = drift + (Math.random() - 0.49) * vol * 1.6;
        if (closeCandle) {
          const o = last.c;
          const c = o + change;
          const h = Math.max(o, c) + Math.random() * vol * 0.7;
          const l = Math.min(o, c) - Math.random() * vol * 0.7;
          const next: Candle = { o, h, l, c, v: 1000 + Math.random() * 4000, t: Date.now() };
          return [...prev.slice(1), next];
        }
        const c = last.c + change;
        const h = Math.max(last.h, c);
        const l = Math.min(last.l, c);
        const v = last.v + Math.random() * 60;
        return [...prev.slice(0, -1), { ...last, c, h, l, v }];
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, [candles.length]);

  const stats = useMemo(() => {
    if (!candles.length) return null;
    const first = candles[0];
    const last = candles[candles.length - 1];
    const high = Math.max(...candles.map(c => c.h));
    const low = Math.min(...candles.map(c => c.l));
    const change = last.c - first.o;
    const pct = (change / first.o) * 100;
    const vol = candles.reduce((s, c) => s + c.v, 0);
    return { price: last.c, change, pct, high, low, vol };
  }, [candles]);

  if (!stats) {
    return <div className="rounded-xl bg-[#0a0e17] border border-[#1f2937] h-[420px] flex items-center justify-center text-xs text-slate-500">Loading market…</div>;
  }

  const up = stats.change >= 0;
  const priceColor = up ? "text-emerald-400" : "text-rose-400";

  const W = 700, H = 280, PAD_L = 8, PAD_R = 56, PAD_T = 8, PAD_B = 8;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const high = stats.high + (stats.high - stats.low) * 0.05;
  const low = stats.low - (stats.high - stats.low) * 0.05;
  const range = high - low || 1;
  const cw = innerW / candles.length;
  const y = (p: number) => PAD_T + ((high - p) / range) * innerH;

  const ma = (period: number) =>
    candles.map((_, i) => {
      if (i < period - 1) return null;
      const slice = candles.slice(i - period + 1, i + 1);
      return slice.reduce((s, c) => s + c.c, 0) / period;
    });
  const ma5 = ma(5);
  const ma10 = ma(10);
  const ma20 = ma(20);
  const linePath = (arr: (number | null)[], color: string) => {
    let d = "";
    arr.forEach((v, i) => {
      if (v == null) return;
      const x = PAD_L + i * cw + cw / 2;
      d += `${d ? "L" : "M"}${x.toFixed(1)},${y(v).toFixed(1)} `;
    });
    return <path d={d} stroke={color} strokeWidth={1.2} fill="none" />;
  };

  const VH = 70;
  const maxVol = Math.max(...candles.map(c => c.v));
  const ticks = 8;
  const labels = Array.from({ length: ticks + 1 }, (_, i) => low + (range * i) / ticks);

  return (
    <div className="rounded-xl bg-black border border-[#1f2937] overflow-hidden text-slate-200 font-mono">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#1f2937]">
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        )}
        <span className="text-base font-bold tracking-wide text-white">SILVER(XAG)USDT</span>
        <span className="text-[10px] bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded">Perp</span>
        <div className="ml-auto flex items-center gap-3 text-slate-400">
          <Star className="h-4 w-4" />
        </div>
      </div>

      {/* Price block */}
      <div className="px-3 py-2 border-b border-[#1f2937] grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <div className="text-slate-500 text-[10px]">Last Price ▾</div>
          <div className={`text-2xl font-bold tabular-nums ${priceColor}`}>{stats.price.toFixed(2)}</div>
          <div className="text-slate-400 text-[10px]">≈ ${stats.price.toFixed(4)} <span className={priceColor}>{up ? "+" : ""}{stats.pct.toFixed(2)}%</span></div>
          <div className="text-slate-500 text-[10px]">Mark Price <span className="text-slate-300 tabular-nums">{(stats.price + 0.01).toFixed(2)}</span></div>
          <div className="text-amber-400 text-[10px] mt-0.5">Top <span className="text-slate-500">›</span> Metals</div>
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between"><span className="text-slate-500">24h High</span><span className="text-slate-200 tabular-nums">{stats.high.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">24h Low</span><span className="text-slate-200 tabular-nums">{stats.low.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">24h Vol (XAG)</span><span className="text-slate-200 tabular-nums">{(stats.vol / 1000).toFixed(3)}K</span></div>
          <div className="flex justify-between"><span className="text-slate-500">24h Amount</span><span className="text-slate-200 tabular-nums">{((stats.vol * stats.price) / 1_000_000).toFixed(3)}M</span></div>
        </div>
      </div>

      {/* Timeframes */}
      <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] border-b border-[#1f2937] overflow-x-auto">
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => setTf(t)} className={tf === t ? "text-white font-semibold bg-slate-700 px-2 py-0.5 rounded" : "text-slate-400"}>{t}</button>
        ))}
        <span className="text-slate-400">More ▾</span>
        <span className="text-slate-400">Depth</span>
        <div className="ml-auto flex items-center gap-3 text-slate-400">
          <LineChartIcon className="h-3.5 w-3.5" />
          <SettingsIcon className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* MA strip */}
      <div className="px-3 py-1 text-[10px] flex gap-3 border-b border-[#1f2937]">
        <span className="text-sky-400">MA(5): <span className="tabular-nums">{(ma5[ma5.length-1] ?? stats.price).toFixed(2)}</span></span>
        <span className="text-pink-400">MA(10): <span className="tabular-nums">{(ma10[ma10.length-1] ?? stats.price).toFixed(2)}</span></span>
        <span className="text-amber-400">MA(20): <span className="tabular-nums">{(ma20[ma20.length-1] ?? stats.price).toFixed(2)}</span></span>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="none">
          {labels.map((p, i) => (
            <line key={i} x1={PAD_L} x2={W - PAD_R} y1={y(p)} y2={y(p)} stroke="#1a2433" strokeDasharray="2 4" />
          ))}
          {candles.map((c, i) => {
            const x = PAD_L + i * cw + cw * 0.5;
            const isUp = c.c >= c.o;
            const color = isUp ? "#22c55e" : "#ef4444";
            const bodyTop = y(Math.max(c.o, c.c));
            const bodyBot = y(Math.min(c.o, c.c));
            const bw = Math.max(1.5, cw * 0.7);
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1} />
                <rect x={x - bw / 2} y={bodyTop} width={bw} height={Math.max(1, bodyBot - bodyTop)} fill={color} />
              </g>
            );
          })}
          {linePath(ma5, "#38bdf8")}
          {linePath(ma10, "#f472b6")}
          {linePath(ma20, "#f59e0b")}
          <line x1={PAD_L} x2={W - PAD_R} y1={y(stats.price)} y2={y(stats.price)} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={0.7} opacity={0.6} />
          {labels.map((p, i) => (
            <text key={i} x={W - PAD_R + 4} y={y(p) + 3} fontSize="9" fill="#64748b" fontFamily="monospace">{p.toFixed(2)}</text>
          ))}
          <g>
            <rect x={W - PAD_R + 2} y={y(stats.price) - 8} width={50} height={16} fill="#1e293b" stroke="#475569" rx={2} />
            <text x={W - PAD_R + 27} y={y(stats.price) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#e2e8f0" fontFamily="monospace">{stats.price.toFixed(2)}</text>
          </g>
        </svg>
      </div>

      {/* Volume */}
      <div className="border-t border-[#1f2937] px-1 pb-1">
        <div className="px-2 pt-1 text-[10px] text-slate-400">
          VOL: <span className="text-slate-200 tabular-nums">{(candles[candles.length-1].v).toFixed(2)}</span>
          <span className="text-pink-400 ml-2">MA(5): <span className="tabular-nums">{(candles.slice(-5).reduce((s,c)=>s+c.v,0)/5).toFixed(2)}</span></span>
          <span className="text-sky-400 ml-2">MA(10): <span className="tabular-nums">{(candles.slice(-10).reduce((s,c)=>s+c.v,0)/10).toFixed(2)}</span></span>
        </div>
        <svg viewBox={`0 0 ${W} ${VH}`} className="w-full block" preserveAspectRatio="none">
          {candles.map((c, i) => {
            const x = PAD_L + i * cw + cw * 0.5;
            const isUp = c.c >= c.o;
            const h = (c.v / maxVol) * (VH - 6);
            const bw = Math.max(1.5, cw * 0.7);
            return <rect key={i} x={x - bw / 2} y={VH - h} width={bw} height={h} fill={isUp ? "#22c55e" : "#ef4444"} opacity={0.75} />;
          })}
        </svg>
      </div>

      {/* Indicators bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-[#1f2937] text-[11px] text-slate-400 overflow-x-auto">
        <span className="text-white">MA</span>
        <span>EMA</span>
        <span>BOLL</span>
        <span>SAR</span>
        <span className="text-slate-600">|</span>
        <span className="text-white">VOL</span>
        <span>MACD</span>
        <span>KDJ</span>
      </div>

      {/* Buy/Sell bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#1f2937] bg-[#0a0a0a]">
        <button className="flex flex-col items-center text-[9px] text-slate-300 w-12">
          <Bell className="h-4 w-4 mb-0.5" />Alert
        </button>
        <button className="flex flex-col items-center text-[9px] text-slate-300 w-12">
          <Copy className="h-4 w-4 mb-0.5" />Copy T..
        </button>
        <button className="flex flex-col items-center text-[9px] text-slate-300 w-12">
          <Grid3x3 className="h-4 w-4 mb-0.5" />Grid
        </button>
        <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-full text-sm">Buy</button>
        <button className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-full text-sm">Sell</button>
      </div>
    </div>
  );
};

export default SilverTradingChart;
