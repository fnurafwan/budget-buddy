import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { fmt } from './flagUtils';
import { useUser } from '@/context/UserContext';

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
  { fill: '#3a86ff', stroke: '#1d4ed8', light: 'rgba(58,134,255,0.12)' },
];

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeSlice = (
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
) => {
  const s = polarToCartesian(cx, cy, r, endAngle);
  const e = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
};

const wobblePath = (d: string, seed: number): string => {
  let s = seed;
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff) - 0.5;
  };
  return d.replace(/[-\d.]+/g, (n) => {
    const num = parseFloat(n);
    if (isNaN(num) || Math.abs(num) < 10) return n;
    return (num + rng() * 1.6).toFixed(2);
  });
};

export interface DoodlePieChartProps {
  expenses: {
    amount: number;
    personName?: string;
    categoryExpenseName?: string;
  }[];
  isThr: boolean; // true → group by personName, false → group by categoryExpenseName
}

const DoodlePieChart = ({ expenses, isThr }: DoodlePieChartProps) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const { hideNumbers } = useUser();
  const masked = '••••••';

  const slices = useMemo(() => {
    const map = new Map<string, number>();
    const fallback = isThr ? '(Tanpa Nama)' : '(Tanpa Kategori)';

    expenses.forEach(e => {
      const key = isThr
        ? (e.personName?.trim() || fallback)
        : (e.categoryExpenseName?.trim() || fallback);
      map.set(key, (map.get(key) ?? 0) + e.amount);
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
  }, [expenses, isThr]);

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

  const chartLabel = isThr ? 'Spending by Person' : 'Spending by Category';
  const countLabel = isThr ? 'orang' : 'kategori';
  const centerLabel = isThr ? `${slices.length} org` : `${slices.length} kat`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-6"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap');`}</style>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{isThr ? '🖍️' : '📊'}</span>
        <h2 className="text-lg font-extrabold" style={{ fontFamily: "'Caveat', cursive" }}>
          {chartLabel}
        </h2>
        <span className="text-xs font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
          {slices.length} {countLabel}
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

              <circle cx={cx} cy={cy} r={r + 14} fill="none"
                stroke="currentColor" strokeWidth="1.5" opacity="0.06"
                filter="url(#doodle-f)" />

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

              <circle cx={cx} cy={cy} r={30}
                fill="var(--card)" stroke="var(--border)"
                strokeWidth="2.5" filter="url(#doodle-light)" />

              <text x={cx} y={cy + 4}
                textAnchor="middle" fontSize="11"
                fontFamily="'Caveat', cursive" fontWeight="700"
                fill="var(--muted-foreground)"
              >
                {centerLabel}
              </text>
            </svg>
          </div>

          {/* ── Legend ── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              <span className="text-muted-foreground" style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}>
                Scroll jika diperlukan
              </span>
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
                      style={{
                        background: isHov ? s.color.light : 'transparent',
                        transition: 'background 0.15s',
                      }}
                    >
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

                      <div className="flex-1 min-w-0 overflow-y-auto">
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
                            {hideNumbers ? `Rp${masked}` : fmt(s.total)}
                          </span>
                        </div>
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
            </div>

            <div className="flex items-center justify-between px-2.5 pt-3 mt-2 border-t border-foreground/10">
              <span className="text-muted-foreground" style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}>
                Grand total
              </span>
              <span className="font-extrabold" style={{ fontFamily: "'Caveat', cursive", fontSize: '17px' }}>
                {hideNumbers ? `Rp${masked}` : fmt(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoodlePieChart;