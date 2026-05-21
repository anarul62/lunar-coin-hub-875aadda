import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Maximize2, Settings as SettingsIcon, FunctionSquare, LineChart as LineChartIcon, Star } from "lucide-react";

// Fake-but-realistic XAU/USD candlestick chart, modeled on the user's reference screenshot.
// Pulls a base price (best effort) and runs a random-walk simulation that "trades" forever.

type Candle = { o: number; h: number; l: number; c: number; v: number; t: number };

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
const VISIBLE = 70;
const TICK_MS = 1500;

const fetchBasePrice = async (): Promise<number> => {
  try {
    const r = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      const p = Number(j?.price);
      if (p > 1000 && p < 10000) return p;
    }
  } catch {}
  // jittered fallback so it doesn't look identical each load
  return 2380 + (Math.random() - 0.5) * 20;
};

const seedCandles = (base: number, n: number): Candle[] => {
  const out: Candle[] = [];
  let price = base - n * 0.4;
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const drift = (base - price) * 0.04;
    const vol = 1.4 + Math.random() * 1.2;
    const o = price;
    const change = drift + (Math.random() - 0.48) * vol * 2;
    const c = o + change;
    const h = Math.max(o, c) + Math.random() * vol;
    const l = Math.min(o, c) - Math.random() * vol;
    out.push({ o, h, l, c, v: 4 + Math.random() * 40, t: now - (n - i) * TICK_MS });
    price = c;
  }
  return out;
};

const GoldTradingChart = ({ onBack }: { onBack?: () => void }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [tf, setTf] = useState("1H");
  const baseRef = useRef<number>(0);

  // init
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

  // live tick
  useEffect(() => {
    if (!candles.length) return;
    const id = setInterval(() => {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const base = baseRef.current || last.c;
        // mostly move the current candle, occasionally close it & open a new one
        const closeCandle = Math.random() < 0.18;
        const drift = (base - last.c) * 0.02;
        const vol = 1.2 + Math.random() * 1.1;
        const change = drift + (Math.random() - 0.49) * vol * 1.6;
        if (closeCandle) {
          const o = last.c;
          const c = o + change;
          const h = Math.max(o, c) + Math.random() * vol * 0.7;
          const l = Math.min(o, c) - Math.random() * vol * 0.7;
          const next: Candle = { o, h, l, c, v: 4 + Math.random() * 40, t: Date.now() };
          return [...prev.slice(1), next];
        }
        const c = last.c + change;
        const h = Math.max(last.h, c);
        const l = Math.min(last.l, c);
        const v = last.v + Math.random() * 1.2;
        const updated: Candle = { ...last, c, h, l, v };
        return [...prev.slice(0, -1), updated];
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
    return { price: last.c, change, pct, high, low, vol, open: last.o, hi: last.h, lo: last.l, prevClose: candles[candles.length - 2]?.c ?? last.o };
  }, [candles]);

  if (!stats) {
    return <div className="rounded-xl bg-[#0a0e17] border border-[#1f2937] h-[420px] flex items-center justify-center text-xs text-slate-500">Loading market…</div>;
  }

  const up = stats.change >= 0;
  const priceColor = up ? "text-emerald-400" : "text-rose-400";

  // chart geometry
  const W = 700, H = 260, PAD_L = 8, PAD_R = 56, PAD_T = 8, PAD_B = 8;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const high = stats.high + (stats.high - stats.low) * 0.05;
  const low = stats.low - (stats.high - stats.low) * 0.05;
  const range = high - low || 1;
  const cw = innerW / candles.length;
  const y = (p: number) => PAD_T + ((high - p) / range) * innerH;

  // MA20, MA50
  const ma = (period: number) =>
    candles.map((_, i) => {
      if (i < period - 1) return null;
      const slice = candles.slice(i - period + 1, i + 1);
      return slice.reduce((s, c) => s + c.c, 0) / period;
    });
  const ma20 = ma(20);
  const ma50 = ma(50);
  const linePath = (arr: (number | null)[], color: string) => {
    let d = "";
    arr.forEach((v, i) => {
      if (v == null) return;
      const x = PAD_L + i * cw + cw / 2;
      d += `${d ? "L" : "M"}${x.toFixed(1)},${y(v).toFixed(1)} `;
    });
    return <path d={d} stroke={color} strokeWidth={1.2} fill="none" />;
  };

  // volume
  const VH = 60;
  const maxVol = Math.max(...candles.map(c => c.v));

  // price labels (right axis)
  const ticks = 8;
  const labels = Array.from({ length: ticks + 1 }, (_, i) => low + (range * i) / ticks);

  return (
    <div className="rounded-xl bg-[#0a0e17] border border-[#1f2937] overflow-hidden text-slate-200 font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#1f2937]">
        {onBack && (
          <button onClick={onBack} className="text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
        )}
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-700 flex items-center justify-center text-[10px] font-bold text-yellow-950">Au</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-wide">XAU/USD</span>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gold / U.S. Dollar · Market Open</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-base font-bold tabular-nums ${priceColor}`}>{stats.price.toFixed(2)}</div>
          <div className={`text-[10px] tabular-nums ${priceColor}`}>{up ? "+" : ""}{stats.change.toFixed(2)} ({up ? "+" : ""}{stats.pct.toFixed(2)}%)</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-[10px] border-b border-[#1f2937] bg-[#0d1320]">
        <div className="flex justify-between"><span className="text-slate-500">High</span><span className="text-slate-200 tabular-nums">{stats.high.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Low</span><span className="text-slate-200 tabular-nums">{stats.low.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">24H Vol</span><span className="text-slate-200 tabular-nums">{(stats.vol).toFixed(2)}K</span></div>
      </div>

      {/* Timeframes */}
      <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] border-b border-[#1f2937] overflow-x-auto">
        {TIMEFRAMES.map(t => (
          <button key={t} onClick={() => setTf(t)} className={tf === t ? "text-amber-400 font-semibold border-b border-amber-400 pb-0.5" : "text-slate-400"}>{t}</button>
        ))}
        <span className="text-slate-500">More ▾</span>
        <div className="ml-auto flex items-center gap-3 text-slate-400">
          <LineChartIcon className="h-3.5 w-3.5" />
          <FunctionSquare className="h-3.5 w-3.5" />
          <SettingsIcon className="h-3.5 w-3.5" />
          <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="none">
          {/* gridlines */}
          {labels.map((p, i) => (
            <g key={i}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y(p)} y2={y(p)} stroke="#1a2433" strokeDasharray="2 4" />
            </g>
          ))}

          {/* candles */}
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

          {/* MA lines */}
          {linePath(ma20, "#f59e0b")}
          {linePath(ma50, "#3b82f6")}

          {/* current price line */}
          <line x1={PAD_L} x2={W - PAD_R} y1={y(stats.price)} y2={y(stats.price)} stroke={up ? "#22c55e" : "#ef4444"} strokeDasharray="3 3" strokeWidth={0.8} opacity={0.6} />

          {/* right axis labels */}
          {labels.map((p, i) => (
            <text key={i} x={W - PAD_R + 4} y={y(p) + 3} fontSize="9" fill="#64748b" fontFamily="monospace">{p.toFixed(2)}</text>
          ))}

          {/* current price tag */}
          <g>
            <rect x={W - PAD_R + 2} y={y(stats.price) - 8} width={50} height={16} fill={up ? "#22c55e" : "#ef4444"} rx={2} />
            <text x={W - PAD_R + 27} y={y(stats.price) + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#06120a" fontFamily="monospace">{stats.price.toFixed(2)}</text>
          </g>
        </svg>

        {/* OHLC + MA overlay */}
        <div className="absolute top-2 left-2 text-[10px] leading-tight pointer-events-none">
          <div className="text-slate-300">
            <span className="text-slate-400">XAU/USD · {tf}</span> <span className="text-emerald-400">●</span>
          </div>
          <div className="text-slate-300">
            <span className="text-slate-500">O</span> <span className="text-emerald-400 tabular-nums">{stats.open.toFixed(2)}</span>{" "}
            <span className="text-slate-500">H</span> <span className="text-emerald-400 tabular-nums">{stats.hi.toFixed(2)}</span>{" "}
            <span className="text-slate-500">L</span> <span className="text-rose-400 tabular-nums">{stats.lo.toFixed(2)}</span>{" "}
            <span className="text-slate-500">C</span> <span className={`tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>{stats.price.toFixed(2)}</span>{" "}
            <span className={`tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>{up ? "+" : ""}{(stats.price - stats.prevClose).toFixed(2)}</span>
          </div>
          <div className="text-[10px]">
            <span className="text-amber-400">MA 20 close </span><span className="text-amber-300 tabular-nums">{(ma20[ma20.length - 1] ?? stats.price).toFixed(2)}</span>
          </div>
          <div className="text-[10px]">
            <span className="text-sky-400">MA 50 close </span><span className="text-sky-300 tabular-nums">{(ma50[ma50.length - 1] ?? stats.price).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Volume */}
      <div className="border-t border-[#1f2937] px-1 pb-1">
        <div className="px-2 pt-1 text-[10px] text-slate-400">Vol <span className="text-emerald-400 tabular-nums">{stats.vol.toFixed(2)}K</span></div>
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
    </div>
  );
};

export default GoldTradingChart;
