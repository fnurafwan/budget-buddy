import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Flag, LayoutGrid, List,
  User, ChevronDown, ArrowRightLeft,
} from 'lucide-react';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBudget } from '@/context/BudgetContext';
import { CATEGORIES } from '@/types/budget';
import type { ExpenseType } from '@/types/budget';

const fmt = (n: number) => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

// ── Flag logic ────────────────────────────────────────────────────────────────
type FlagLevel = 'critical' | 'warning' | 'normal' | 'low';

const getFlag = (amount: number, avg: number): FlagLevel => {
  if (avg === 0) return 'normal';
  const ratio = amount / avg;
  if (ratio >= 2) return 'critical';
  if (ratio >= 1.5) return 'warning';
  if (ratio <= 0.5) return 'low';
  return 'normal';
};

const FLAG_CONFIG: Record<FlagLevel, {
  label: string;
  textColor: string;
  bgColor: string;
  barColor: string;
  bgFill: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'High Spend',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    barColor: 'bg-red-500',
    bgFill: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: <TrendingUp className="h-3 w-3" />,
  },
  warning: {
    label: 'Above Avg',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    barColor: 'bg-amber-500',
    bgFill: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: <TrendingUp className="h-3 w-3" />,
  },
  normal: {
    label: 'Normal',
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    barColor: 'bg-emerald-500',
    bgFill: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: <Minus className="h-3 w-3" />,
  },
  low: {
    label: 'Low Spend',
    textColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    barColor: 'bg-sky-500',
    bgFill: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    icon: <TrendingDown className="h-3 w-3" />,
  },
};

// ── PersonCombobox ─────────────────────────────────────────────────────────────
interface PersonComboboxProps {
  value: string;
  onChange: (val: string) => void;
  persons: { id: string; name: string }[];
}

const PersonCombobox = ({ value, onChange, persons }: PersonComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync query when value changes externally (e.g. form reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    query.trim()
      ? persons.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : persons,
    [query, persons]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const showCreateOption = query.trim() &&
    !persons.some(p => p.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Ketik nama atau pilih..."
          className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (filtered.length > 0 || showCreateOption) && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 w-full bg-card border-2 border-foreground/10 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto"
          >
            {filtered.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(p.name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2 ${
                    query === p.name ? 'bg-primary/10 font-semibold text-primary' : ''
                  }`}
                >
                  <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {p.name}
                </button>
              </li>
            ))}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(query.trim())}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2 text-primary font-semibold border-t border-foreground/10"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Tambah "{query.trim()}"
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── DoodlePieChart ────────────────────────────────────────────────────────────
// const DOODLE_COLORS = [
//   { fill: '#f87171', stroke: '#dc2626', light: 'rgba(248,113,113,0.12)' },
//   { fill: '#fb923c', stroke: '#ea580c', light: 'rgba(251,146,60,0.12)' },
//   { fill: '#facc15', stroke: '#ca8a04', light: 'rgba(250,204,21,0.12)' },
//   { fill: '#4ade80', stroke: '#16a34a', light: 'rgba(74,222,128,0.12)' },
//   { fill: '#60a5fa', stroke: '#2563eb', light: 'rgba(96,165,250,0.12)' },
//   { fill: '#c084fc', stroke: '#9333ea', light: 'rgba(192,132,252,0.12)' },
//   { fill: '#f472b6', stroke: '#db2777', light: 'rgba(244,114,182,0.12)' },
//   { fill: '#34d399', stroke: '#059669', light: 'rgba(52,211,153,0.12)' },
// ];
const DOODLE_COLORS = [
  { fill: '#e6194b', stroke: '#9e1233', light: 'rgba(230,25,75,0.12)' },
  { fill: '#f58231', stroke: '#b45309', light: 'rgba(245,130,49,0.12)' },
  { fill: '#ffe119', stroke: '#b59f00', light: 'rgba(255,225,25,0.12)' },
  { fill: '#bfef45', stroke: '#6b8e23', light: 'rgba(191,239,69,0.12)' },
  { fill: '#3cb44b', stroke: '#1f7a2d', light: 'rgba(60,180,75,0.12)' },
  { fill: '#42d4f4', stroke: '#0e7490', light: 'rgba(66,212,244,0.12)' },
  { fill: '#4363d8', stroke: '#1e40af', light: 'rgba(67,99,216,0.12)' },
  { fill: '#911eb4', stroke: '#5b1273', light: 'rgba(145,30,180,0.12)' },
  { fill: '#f032e6', stroke: '#a21caf', light: 'rgba(240,50,230,0.12)' },
  { fill: '#fabebe', stroke: '#b91c1c', light: 'rgba(250,190,190,0.12)' },

  { fill: '#469990', stroke: '#134e4a', light: 'rgba(70,153,144,0.12)' },
  { fill: '#dcbeff', stroke: '#7c3aed', light: 'rgba(220,190,255,0.12)' },
  { fill: '#9a6324', stroke: '#5a3b12', light: 'rgba(154,99,36,0.12)' },
  { fill: '#fffac8', stroke: '#a16207', light: 'rgba(255,250,200,0.12)' },
  { fill: '#800000', stroke: '#450a0a', light: 'rgba(128,0,0,0.12)' },
  { fill: '#aaffc3', stroke: '#15803d', light: 'rgba(170,255,195,0.12)' },
  { fill: '#808000', stroke: '#4d4d00', light: 'rgba(128,128,0,0.12)' },
  { fill: '#ffd8b1', stroke: '#c2410c', light: 'rgba(255,216,177,0.12)' },
  { fill: '#000075', stroke: '#000040', light: 'rgba(0,0,117,0.12)' },
  { fill: '#a9a9a9', stroke: '#525252', light: 'rgba(169,169,169,0.12)' },

  { fill: '#ff6f61', stroke: '#b91c1c', light: 'rgba(255,111,97,0.12)' },
  { fill: '#6b5b95', stroke: '#4338ca', light: 'rgba(107,91,149,0.12)' },
  { fill: '#88b04b', stroke: '#4d7c0f', light: 'rgba(136,176,75,0.12)' },
  { fill: '#f7cac9', stroke: '#be185d', light: 'rgba(247,202,201,0.12)' },
  { fill: '#92a8d1', stroke: '#1e40af', light: 'rgba(146,168,209,0.12)' },
  { fill: '#955251', stroke: '#7f1d1d', light: 'rgba(149,82,81,0.12)' },
  { fill: '#b565a7', stroke: '#86198f', light: 'rgba(181,101,167,0.12)' },
  { fill: '#009b77', stroke: '#065f46', light: 'rgba(0,155,119,0.12)' },
  { fill: '#dd4124', stroke: '#9a3412', light: 'rgba(221,65,36,0.12)' },
  { fill: '#45b8ac', stroke: '#0f766e', light: 'rgba(69,184,172,0.12)' },

  { fill: '#e94b3c', stroke: '#991b1b', light: 'rgba(233,75,60,0.12)' },
  { fill: '#6f9fd8', stroke: '#1d4ed8', light: 'rgba(111,159,216,0.12)' },
  { fill: '#f4a460', stroke: '#b45309', light: 'rgba(244,164,96,0.12)' },
  { fill: '#2ecc71', stroke: '#15803d', light: 'rgba(46,204,113,0.12)' },
  { fill: '#3498db', stroke: '#1e40af', light: 'rgba(52,152,219,0.12)' },
  { fill: '#9b59b6', stroke: '#6d28d9', light: 'rgba(155,89,182,0.12)' },
  { fill: '#e67e22', stroke: '#9a3412', light: 'rgba(230,126,34,0.12)' },
  { fill: '#1abc9c', stroke: '#0f766e', light: 'rgba(26,188,156,0.12)' },
  { fill: '#e74c3c', stroke: '#991b1b', light: 'rgba(231,76,60,0.12)' },
  { fill: '#34495e', stroke: '#111827', light: 'rgba(52,73,94,0.12)' },

  { fill: '#ff9f1c', stroke: '#b45309', light: 'rgba(255,159,28,0.12)' },
  { fill: '#2ec4b6', stroke: '#0f766e', light: 'rgba(46,196,182,0.12)' },
  { fill: '#e71d36', stroke: '#7f1d1d', light: 'rgba(231,29,54,0.12)' },
  { fill: '#011627', stroke: '#000814', light: 'rgba(1,22,39,0.12)' },
  { fill: '#ffbf69', stroke: '#c2410c', light: 'rgba(255,191,105,0.12)' },
  { fill: '#cbf3f0', stroke: '#0891b2', light: 'rgba(203,243,240,0.12)' },
  { fill: '#ff006e', stroke: '#9d174d', light: 'rgba(255,0,110,0.12)' },
  { fill: '#8338ec', stroke: '#5b21b6', light: 'rgba(131,56,236,0.12)' },
  { fill: '#3a86ff', stroke: '#1d4ed8', light: 'rgba(58,134,255,0.12)' }
];

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeSlice = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const s = polarToCartesian(cx, cy, r, endAngle);
  const e = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
};

// Add subtle noise to numeric coords for hand-drawn feel
const wobblePath = (d: string, seed: number): string => {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return ((s >>> 0) / 0xffffffff) - 0.5; };
  return d.replace(/[-\d.]+/g, (n) => {
    const num = parseFloat(n);
    if (isNaN(num) || Math.abs(num) < 10) return n;
    return (num + rng() * 1.6).toFixed(2);
  });
};

interface DoodlePieChartProps {
  expenses: { personName?: string; amount: number }[];
}

const DoodlePieChart = ({ expenses }: DoodlePieChartProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const slices = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      const name = (e as any).personName?.trim() || '(Tanpa Nama)';
      map.set(name, (map.get(name) ?? 0) + e.amount);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], i) => ({
        name,
        total: amount,
        color: DOODLE_COLORS[i % DOODLE_COLORS.length],
        pct: (amount / total) * 100,
        index: i,
      }));
  }, [expenses]);

  if (slices.length === 0) return null;

  const cx = 110, cy = 110, r = 78;
  let cursor = 0;

  const renderedSlices = slices.map((s) => {
    const start = cursor;
    const sweep = (s.pct / 100) * 360;
    cursor += sweep;
    const end = cursor;
    const isSingle = slices.length === 1;
    const rawPath = isSingle
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : describeSlice(cx, cy, r, start, end);
    return { ...s, path: wobblePath(rawPath, s.index * 7 + 13), rawPath, start, end };
  });

  const grandTotal = slices.reduce((s, v) => s + v.total, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');`}</style>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🖍️</span>
        <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Caveat', cursive" }}>
          Spending by Person
        </h2>
        <span className="text-xs font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {slices.length} orang
        </span>
      </div>

      <div className="card-bordered rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* ── SVG pie ── */}
          <div className="shrink-0 relative">
            <svg
              width="220" height="220" viewBox="0 0 220 220"
              style={{ filter: 'drop-shadow(1px 3px 8px rgba(0,0,0,0.10))' }}
            >
              <defs>
                <filter id="doodle-f">
                  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="7" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
                </filter>
                <filter id="doodle-light">
                  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="7" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>

              {/* Rough outer ring */}
              <circle cx={cx} cy={cy} r={r + 14} fill="none"
                stroke="currentColor" strokeWidth="1.5" opacity="0.06"
                filter="url(#doodle-f)" />

              {/* Slices */}
              {renderedSlices.map((s) => {
                const isHov = hovered === s.name;
                return (
                  <g key={s.name}>
                    <motion.path
                      d={s.path}
                      fill={s.color.fill}
                      stroke={s.color.stroke}
                      strokeWidth={isHov ? 2.8 : 2}
                      strokeLinejoin="round"
                      opacity={hovered && !isHov ? 0.38 : 0.85}
                      animate={{ scale: isHov ? 1.045 : 1 }}
                      style={{ transformOrigin: `${cx}px ${cy}px`, cursor: 'pointer' }}
                      transition={{ duration: 0.16 }}
                      filter="url(#doodle-f)"
                      onMouseEnter={() => setHovered(s.name)}
                      onMouseLeave={() => setHovered(null)}
                    />
                    {/* Second jittery stroke overlay */}
                    <path
                      d={wobblePath(s.rawPath, s.index * 17 + 3)}
                      fill="none"
                      stroke={s.color.stroke}
                      strokeWidth="0.7"
                      strokeDasharray="4 5"
                      opacity="0.28"
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                );
              })}

              {/* Donut hole */}
              <circle cx={cx} cy={cy} r={30}
                fill="var(--card)" stroke="var(--border)"
                strokeWidth="2.5" filter="url(#doodle-light)" />

              {/* Center label */}
              <text x={cx} y={cy + 4}
                textAnchor="middle" fontSize="11"
                fontFamily="'Caveat', cursive" fontWeight="700"
                fill="var(--muted-foreground)"
              >
                {slices.length} org
              </text>
            </svg>
          </div>

          {/* ── Legend ── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="space-y-1.5">
              {renderedSlices.map((s) => {
                const isHov = hovered === s.name;
                return (
                  <motion.div
                    key={s.name}
                    onMouseEnter={() => setHovered(s.name)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{ x: isHov ? 5 : 0 }}
                    transition={{ duration: 0.14 }}
                    className="flex items-start gap-2.5 px-2.5 py-2 rounded-xl cursor-default"
                    style={{ background: isHov ? s.color.light : 'transparent', transition: 'background 0.15s' }}
                  >
                    {/* Hand-drawn swatch */}
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: 2 }}>
                      <defs>
                        <filter id={`sw${s.index}`}>
                          <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="3" seed={s.index + 2} />
                          <feDisplacementMap in="SourceGraphic" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                      </defs>
                      <rect x="2" y="2" width="16" height="16" rx="3"
                        fill={s.color.fill} stroke={s.color.stroke}
                        strokeWidth="2" filter={`url(#sw${s.index})`} opacity="0.9" />
                    </svg>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 flex-wrap">
                        <span className="font-bold truncate" style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}>
                          {s.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground" style={{ fontFamily: "'Caveat', cursive", fontSize: '13px' }}>
                          {s.pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold" style={{ color: s.color.stroke, fontFamily: "'Caveat', cursive", fontSize: '14px' }}>
                          {fmt(s.total)}
                        </span>
                      </div>
                      {/* Tiny doodle bar */}
                      <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: s.color.fill }}
                          initial={{ width: 0 }}
                          animate={{ width: `${s.pct}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: s.index * 0.07 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Grand total */}
            <div className="flex items-center justify-between px-2.5 pt-3 mt-2 border-t border-foreground/10">
              <span className="text-muted-foreground" style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}>
                Grand total
              </span>
              <span className="font-extrabold" style={{ fontFamily: "'Caveat', cursive", fontSize: '17px' }}>
                {fmt(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── DataGrid ──────────────────────────────────────────────────────────────────
interface DataGridProps {
  expenses: {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: ExpenseType;
    personName?: string;
  }[];
  totalBudget: number;
}

const DataGrid = ({ expenses, totalBudget }: DataGridProps) => {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sortKey, setSortKey] = useState<'amount' | 'date' | 'flag'>('amount');
  const [filterFlag, setFilterFlag] = useState<FlagLevel | 'all'>('all');

  const avg = expenses.length > 0
    ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length
    : 0;

  const enriched = useMemo(() =>
    expenses.map(e => ({
      ...e,
      flag: getFlag(e.amount, avg),
      pct: totalBudget > 0 ? (e.amount / totalBudget) * 100 : 0,
    })),
    [expenses, avg, totalBudget]
  );

  const sorted = useMemo(() => {
    const filtered = filterFlag === 'all' ? enriched : enriched.filter(e => e.flag === filterFlag);
    return [...filtered].sort((a, b) => {
      if (sortKey === 'amount') return b.amount - a.amount;
      if (sortKey === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      const order: FlagLevel[] = ['critical', 'warning', 'normal', 'low'];
      return order.indexOf(a.flag) - order.indexOf(b.flag);
    });
  }, [enriched, sortKey, filterFlag]);

  const flagCounts = useMemo(() => {
    const counts: Record<FlagLevel, number> = { critical: 0, warning: 0, normal: 0, low: 0 };
    enriched.forEach(e => counts[e.flag]++);
    return counts;
  }, [enriched]);

  if (expenses.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-extrabold">Item Analysis</h2>
          <span className="text-xs font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            {sorted.length} items
          </span>
        </div>
        <div className="flex rounded-xl border-2 border-foreground/10 overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground'}`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Flag Summary */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {(Object.entries(flagCounts) as [FlagLevel, number][]).map(([flag, count]) => {
          const cfg = FLAG_CONFIG[flag];
          const active = filterFlag === flag;
          return (
            <button
              key={flag}
              onClick={() => setFilterFlag(active ? 'all' : flag)}
              className={`rounded-xl p-2.5 border-2 text-left transition-all ${cfg.bgColor} ${cfg.borderColor} ${cfg.textColor} ${active ? 'ring-2 ring-current ring-offset-1' : 'hover:opacity-80'}`}
            >
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                {cfg.icon}
                <span className="text-[9px] font-bold uppercase tracking-wide leading-tight">{cfg.label}</span>
              </div>
              <span className="text-xl font-extrabold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground shrink-0">Sort:</span>
        {(['amount', 'date', 'flag'] as const).map(k => (
          <button
            key={k}
            onClick={() => setSortKey(k)}
            className={`text-xs font-bold px-3 py-1 rounded-lg border transition-colors ${
              sortKey === k
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-foreground/10 hover:bg-secondary text-muted-foreground'
            }`}
          >
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {sorted.map((exp, i) => {
              const cfg = FLAG_CONFIG[exp.flag];
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border-2 p-4 relative overflow-hidden ${cfg.bgColor} ${cfg.borderColor}`}
                >
                  <div className={`absolute top-0 right-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-bl-xl ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor} border-l-2 border-b-2`}>
                    <Flag className="h-2.5 w-2.5" />
                    {cfg.label}
                  </div>

                  <span className={`inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border mb-2 ${
                    exp.type === 'allocation'
                      ? 'text-primary border-primary/30 bg-primary/10'
                      : 'text-expense border-expense/30 bg-expense/10'
                  }`}>
                    {exp.type === 'allocation' ? 'ALC' : 'REA'}
                  </span>

                  <p className="text-sm font-bold pr-16 mb-0.5 leading-snug">{exp.description}</p>
                  {exp.personName && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium truncate">{exp.personName}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  <p className={`text-lg font-extrabold ${cfg.textColor}`}>{fmt(exp.amount)}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2">{exp.pct.toFixed(1)}% of budget</p>

                  <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${cfg.barColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(exp.pct, 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-bordered rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="bg-secondary/60 border-b-2 border-foreground/5">
                    <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Item</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Person</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Type</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Flag</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">% Budget</th>
                    <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((exp, i) => {
                    const cfg = FLAG_CONFIG[exp.flag];
                    return (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-foreground/5 last:border-0 hover:bg-secondary/40 transition-colors"
                      >
                        <td className="px-4 py-3 min-w-[140px]">
                          <p className="text-sm font-semibold">{exp.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-3 py-3 min-w-[100px]">
                          {exp.personName ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{exp.personName}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${
                            exp.type === 'allocation'
                              ? 'text-primary border-primary/30 bg-primary/10'
                              : 'text-expense border-expense/30 bg-expense/10'
                          }`}>
                            {exp.type === 'allocation' ? 'ALC' : 'REA'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${cfg.bgColor} ${cfg.textColor}`}>
                            {cfg.icon}
                            <span>{cfg.label}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-bold text-muted-foreground block">{exp.pct.toFixed(1)}%</span>
                          <div className="w-14 h-1.5 bg-secondary rounded-full overflow-hidden mt-1 ml-auto">
                            <motion.div
                              className={`h-full rounded-full ${cfg.barColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(exp.pct, 100)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.04 }}
                            />
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-extrabold whitespace-nowrap ${cfg.textColor}`}>
                          {fmt(exp.amount)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const BudgetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    budgets, expenses, persons, addExpense, deleteExpense, updateExpense,
    deleteBudget, getAllocationForBudget, getRealizationForBudget,
  } = useBudget();

  const budget = budgets.find(b => b.id === id);
  const budgetExpenses = useMemo(() =>
    expenses
      .filter(e => e.budgetId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, id]
  );

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState<ExpenseType>('realization');
  const [personName, setPersonName] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPersonName, setEditPersonName] = useState('');

  // Type-flip confirmation
  const [flippingId, setFlippingId] = useState<string | null>(null);

  if (!budget) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Budget not found</p>
          <button onClick={() => navigate('/')} className="btn-primary rounded-xl px-5 py-2 font-bold text-sm">Go Back</button>
        </div>
      </div>
    );
  }

  const allocation = getAllocationForBudget(budget.id);
  const realization = getRealizationForBudget(budget.id);
  const totalSpent = allocation + realization;
  const remaining = budget.allocatedAmount - totalSpent;
  const allocPercent = budget.allocatedAmount > 0 ? Math.min((allocation / budget.allocatedAmount) * 100, 100) : 0;
  const realPercent = budget.allocatedAmount > 0 ? Math.min((realization / budget.allocatedAmount) * 100, 100) : 0;
  const category = CATEGORIES.find(c => c.value === budget.category);
  const IconComp = (icons[budget.icon as keyof typeof icons] as LucideIcon) || icons.CircleDollarSign;
  const exceeds = amount ? parseFloat(amount) > remaining : false;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;
    addExpense({
      budgetId: budget.id,
      amount: parseFloat(amount),
      description,
      date,
      type: expenseType,
      personName: personName.trim() || undefined,
    });
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setExpenseType('realization');
    setPersonName('');
    setShowForm(false);
  };

  const handleDelete = () => {
    deleteBudget(budget.id);
    navigate('/');
  };

  const startEdit = (exp: typeof budgetExpenses[0]) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount.toString());
    setEditDesc(exp.description);
    setEditPersonName((exp as any).personName ?? '');
  };

  const saveEdit = (expId: string) => {
    const updates: Record<string, unknown> = {
      amount: parseFloat(editAmount),
      description: editDesc,
    };
    if (editPersonName.trim()) {
      updates.personName = editPersonName.trim();
    } else {
      updates.personName = '';
    }
    updateExpense(expId, updates as any);
    setEditingId(null);
  };

  const handleFlipType = (exp: typeof budgetExpenses[0]) => {
    const newType: ExpenseType = exp.type === 'allocation' ? 'realization' : 'allocation';
    updateExpense(exp.id, { type: newType });
    setFlippingId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button onClick={handleDelete} className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5">
            <Trash2 className="h-4 w-4" /> Delete Budget
          </button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">

        {/* ── Budget Header Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-bordered rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10 shrink-0">
              <IconComp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold">{budget.title}</h1>
              <span className="text-sm text-muted-foreground">{category?.label}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Budget Amount</p>
            <p className="text-3xl font-extrabold break-all">{fmt(budget.allocatedAmount)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-xl p-3 border-2" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              <p className="text-xs font-semibold text-primary mb-1">Allocation</p>
              <p className="text-base font-extrabold text-primary break-all">{fmt(allocation)}</p>
            </div>
            <div className="card-expense rounded-xl p-3">
              <p className="text-xs font-semibold text-expense mb-1">Realization</p>
              <p className="text-base font-extrabold text-expense break-all">{fmt(realization)}</p>
            </div>
          </div>
          <div className="card-income rounded-xl p-3 mb-5">
            <p className="text-xs font-semibold text-income mb-1">Remaining</p>
            <p className={`text-xl font-extrabold break-all ${remaining < 0 ? 'text-destructive' : 'text-income'}`}>
              {fmt(remaining)}
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-primary">Allocation</span>
                <span className="text-primary">{allocPercent.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${allocPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-expense">Realization</span>
                <span className="text-expense">{realPercent.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <motion.div
                  className={`h-full rounded-full ${realPercent > 80 ? 'bg-destructive' : 'bg-expense'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${realPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="text-muted-foreground">
                  {budget.allocatedAmount > 0 ? Math.min((totalSpent / budget.allocatedAmount) * 100, 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <motion.div
                  className={`h-full rounded-full ${totalSpent > budget.allocatedAmount ? 'bg-destructive' : 'bg-foreground/40'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budget.allocatedAmount > 0 ? (totalSpent / budget.allocatedAmount) * 100 : 0, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Add Expense ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold">Expenses</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary rounded-xl px-4 py-2 font-bold text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleAddExpense} className="card-accent rounded-2xl p-5 mb-4 space-y-4">
                  {/* Row 1: Amount + Date */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <Label className="font-semibold text-sm">Amount (Rp)</Label>
                      <Input
                        type="number" min="0" step="1" placeholder="0"
                        value={amount} onChange={e => setAmount(e.target.value)}
                        className="rounded-xl border-2 border-foreground/10 mt-1 w-full"
                      />
                      {exceeds && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-destructive font-semibold">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          <span className="truncate">Melebihi sisa</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Label className="font-semibold text-sm">Date</Label>
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 [color-scheme:light] dark:[color-scheme:dark]"
                        style={{ minWidth: 0 }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Type toggle */}
                  <div>
                    <Label className="font-semibold text-sm">Type</Label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setExpenseType('allocation')}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${
                          expenseType === 'allocation'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-foreground/10 hover:bg-secondary'
                        }`}
                      >
                        Allocation
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseType('realization')}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${
                          expenseType === 'realization'
                            ? 'bg-expense text-white border-expense'
                            : 'border-foreground/10 hover:bg-secondary'
                        }`}
                      >
                        Realization
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div>
                    <Label className="font-semibold text-sm">Description</Label>
                    <Input
                      placeholder="Untuk apa ini?"
                      value={description} onChange={e => setDescription(e.target.value)}
                      className="rounded-xl border-2 border-foreground/10 mt-1"
                    />
                  </div>

                  {/* Row 4: Person — combobox */}
                  <div>
                    <Label className="font-semibold text-sm">Person <span className="text-muted-foreground font-normal">(opsional)</span></Label>
                    <div className="mt-1">
                      <PersonCombobox
                        value={personName}
                        onChange={setPersonName}
                        persons={persons ?? []}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold text-sm">Save Expense</button>
                    <button type="button" onClick={() => setShowForm(false)} className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-foreground/10 hover:bg-secondary transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Doodle Pie Chart ── */}
        <DoodlePieChart expenses={budgetExpenses} />

        {/* ── Item Analysis DataGrid ── */}
        <DataGrid expenses={budgetExpenses} totalBudget={budget.allocatedAmount} />

        {/* ── Transaction History ── */}
        <div className="card-bordered rounded-2xl p-5">
          <h3 className="font-bold text-sm text-muted-foreground mb-3">Transaction History</h3>
          {budgetExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {budgetExpenses.map(exp => (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
                  >
                    {editingId === exp.id ? (
                      /* ── Edit mode ── */
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex gap-2">
                          <Input
                            className="w-28 rounded-lg border-2 border-foreground/10 shrink-0"
                            type="number" value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                          <Input
                            className="flex-1 rounded-lg border-2 border-foreground/10 min-w-0"
                            value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          />
                        </div>
                        <PersonCombobox
                          value={editPersonName}
                          onChange={setEditPersonName}
                          persons={persons ?? []}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(exp.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-income/10 text-income text-xs font-bold">
                            <Check className="h-3.5 w-3.5" /> Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground text-xs font-bold border border-foreground/10">
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Type badge — clickable to flip */}
                        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                            exp.type === 'allocation'
                              ? 'text-primary border-primary/30 bg-primary/10'
                              : 'text-expense border-expense/30 bg-expense/10'
                          }`}>
                            {exp.type === 'allocation' ? 'ALC' : 'REA'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{exp.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(exp as any).personName && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-xs text-muted-foreground font-medium">{(exp as any).personName}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-bold text-expense whitespace-nowrap shrink-0">
                          -{fmt(exp.amount)}
                        </span>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {/* Flip type button */}
                          {flippingId === exp.id ? (
                            <>
                              <button
                                title={`Ubah ke ${exp.type === 'allocation' ? 'Realization' : 'Allocation'}?`}
                                onClick={() => handleFlipType(exp)}
                                className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-[10px] font-bold flex items-center gap-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{exp.type === 'allocation' ? '→REA' : '→ALC'}</span>
                              </button>
                              <button onClick={() => setFlippingId(null)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                                <X className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              title={`Ubah ke ${exp.type === 'allocation' ? 'Realization' : 'Allocation'}`}
                              onClick={() => setFlippingId(exp.id)}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => startEdit(exp)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default BudgetDetail;