import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sun, Moon, BarChart2, LineChart as LineChartIcon,
  PieChart as PieChartIcon, Check, X, User, ChartBarStacked,
  ChevronRight, Info, GitCompareArrows, Search,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useUser, USERS } from '@/context/UserContext';
import { fmt } from './BudgetDetail/flagUtils';


// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_BUDGETS = 4;
const MAX_TAGS    = 6;

// One color per BUDGET slot (consistent across bar/line/pie slices)
const BUDGET_PALETTE = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

// One color per TAG (used as pie title accent & tag chips)
const TAG_PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
];

const CHART_TYPES = [
  { key: 'bar',  label: 'Bar',  Icon: BarChart2 },
  { key: 'line', label: 'Line', Icon: LineChartIcon },
  { key: 'pie',  label: 'Pie',  Icon: PieChartIcon },
] as const;

type ChartType = 'bar' | 'line' | 'pie';

// ── Helpers ───────────────────────────────────────────────────────────────────
const budgetLabel = (b: any) => {
  const date = new Date(b.createdAt ?? Date.now());
  return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card p-3 shadow-xl text-xs min-w-[160px]">
      <p className="font-extrabold text-foreground mb-2 text-sm">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-muted-foreground font-medium truncate max-w-[120px]">{p.name}</span>
          </div>
          <span className="font-bold text-foreground shrink-0">{fmt(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const CompareBudgets = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUser();
  const { budgets, expenses } = useBudgetData();

  // Steps
  const [step, setStep]               = useState<'type' | 'budgets' | 'tags' | 'chart'>('type');
  const [compareType, setCompareType] = useState<'person' | 'category' | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chartType, setChartType]     = useState<ChartType>('bar');

  // Step 2 filters
  const [budgetSearch, setBudgetSearch] = useState('');
  const [filterUserId, setFilterUserId] = useState<string>('all');

  // ── Derived data ──────────────────────────────────────────────────────────
  const compatibleBudgets = useMemo(() => {
    if (!compareType) return [];
    return budgets.filter(b => {
      const isThr = (b as any).category === 'thr';
      return compareType === 'person' ? isThr : !isThr;
    });
  }, [budgets, compareType]);

  const filteredCompatibleBudgets = useMemo(() => {
    return compatibleBudgets.filter(b => {
      const bAny = b as any;
      if (filterUserId !== 'all' && bAny.userId !== filterUserId) return false;
      if (budgetSearch.trim()) {
        if (!bAny.title?.toLowerCase().includes(budgetSearch.toLowerCase())) return false;
      }
      return true;
    });
  }, [compatibleBudgets, filterUserId, budgetSearch]);

  const availableUsers = useMemo(() => {
    const ids = new Set(compatibleBudgets.map(b => (b as any).userId).filter(Boolean));
    return USERS.filter(u => ids.has(u.id));
  }, [compatibleBudgets]);

  const selectedBudgets = useMemo(
    () => budgets.filter(b => selectedIds.includes(b.id)),
    [budgets, selectedIds]
  );

  const availableTags = useMemo(() => {
    if (!compareType || selectedIds.length === 0) return [];
    const tagSet = new Set<string>();
    expenses
      .filter(e => selectedIds.includes((e as any).budgetId))
      .forEach(e => {
        const tag = compareType === 'person'
          ? (e as any).personName
          : (e as any).categoryExpenseName;
        if (tag?.trim()) tagSet.add(tag.trim());
      });
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'id'));
  }, [expenses, selectedIds, compareType]);

  // Bar/Line: rows = tags, series = budgets
  const chartData = useMemo(() => {
    if (!selectedIds.length || !selectedTags.length) return [];
    return selectedTags.map(tag => {
      const row: Record<string, any> = { tag };
      selectedIds.forEach(bid => {
        const budget = budgets.find(b => b.id === bid);
        const key    = budget ? `${(budget as any).title} (${budgetLabel(budget)})` : bid;
        row[key] = expenses
          .filter(e => {
            const bExp = e as any;
            if (bExp.budgetId !== bid) return false;
            const t = compareType === 'person' ? bExp.personName : bExp.categoryExpenseName;
            return t?.trim() === tag;
          })
          .reduce((s, e) => s + e.amount, 0);
      });
      return row;
    });
  }, [selectedIds, selectedTags, expenses, budgets, compareType]);

  const seriesLabels = useMemo(
    () => selectedBudgets.map(b => `${(b as any).title} (${budgetLabel(b)})`),
    [selectedBudgets]
  );

  // Pie: 1 pie per TAG — slices = budgets
  const pieDataPerTag = useMemo(() =>
    selectedTags.map((tag, ti) => {
      const slices = selectedBudgets.map((b, bi) => {
        const total = expenses
          .filter(e => {
            const bExp = e as any;
            if (bExp.budgetId !== b.id) return false;
            const t = compareType === 'person' ? bExp.personName : bExp.categoryExpenseName;
            return t?.trim() === tag;
          })
          .reduce((s, e) => s + e.amount, 0);
        return {
          name: `${(b as any).title} (${budgetLabel(b)})`,
          value: total,
          color: BUDGET_PALETTE[bi % BUDGET_PALETTE.length],
        };
      });
      const grandTotal = slices.reduce((s, v) => s + v.value, 0);
      return {
        tag,
        tagColor: TAG_PALETTE[ti % TAG_PALETTE.length],
        grandTotal,
        slices: slices.map(s => ({
          ...s,
          pct: grandTotal > 0 ? (s.value / grandTotal) * 100 : 0,
        })),
      };
    }),
    [selectedBudgets, selectedTags, expenses, compareType]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleBudget = (id: string) =>
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_BUDGETS ? [...prev, id] : prev
    );

  const toggleTag = (tag: string) =>
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(x => x !== tag)
        : prev.length < MAX_TAGS ? [...prev, tag] : prev
    );

  const resetAll = () => {
    setStep('type');
    setCompareType(null);
    setSelectedIds([]);
    setSelectedTags([]);
    setBudgetSearch('');
    setFilterUserId('all');
  };

  const STEPS   = ['Tipe', 'Budget', 'Filter', 'Grafik'];
  const stepIdx = { type: 0, budgets: 1, tags: 2, chart: 3 }[step];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5 text-primary" />
            <h1 className="font-extrabold text-base">Bandingkan Budget</h1>
          </div>
          <button onClick={toggleTheme} className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                i < stepIdx ? 'bg-primary text-primary-foreground'
                : i === stepIdx ? 'bg-primary/20 text-primary border-2 border-primary'
                : 'bg-secondary text-muted-foreground'
              }`}>
                {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${i === stepIdx ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══ STEP 1: Tipe ══════════════════════════════════════════════════ */}
          {step === 'type' && (
            <motion.div key="step-type" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold mb-2">Mau bandingkan apa?</h2>
                <p className="text-muted-foreground text-sm">Pilih jenis pengelompokan yang akan dibandingkan antar budget.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                {[
                  { key: 'person' as const, label: 'Per Orang', desc: 'Bandingkan pengeluaran per nama orang dari budget bertipe THR.', Icon: User, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
                  { key: 'category' as const, label: 'Per Kategori', desc: 'Bandingkan pengeluaran per kategori dari budget non-THR.', Icon: ChartBarStacked, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setCompareType(opt.key); setStep('budgets'); }}
                    className={`rounded-2xl border-2 p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${opt.bg} ${opt.border}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${opt.bg}`}>
                      <opt.Icon className={`h-6 w-6 ${opt.color}`} />
                    </div>
                    <h3 className={`text-lg font-extrabold mb-1 ${opt.color}`}>{opt.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ STEP 2: Pilih Budget ══════════════════════════════════════════ */}
          {step === 'budgets' && (
            <motion.div key="step-budgets" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              {/* Header */}
              <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-extrabold mb-1">Pilih Budget</h2>
                  <p className="text-sm text-muted-foreground">
                    Pilih 2–{MAX_BUDGETS} budget.&nbsp;
                    <span className="font-bold text-primary">{selectedIds.length}/{MAX_BUDGETS} dipilih</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setStep('type'); setSelectedIds([]); setBudgetSearch(''); setFilterUserId('all'); }} className="px-4 py-2 rounded-xl border-2 border-foreground/10 text-sm font-bold hover:bg-secondary transition-colors">
                    ← Kembali
                  </button>
                  <button disabled={selectedIds.length < 2} onClick={() => setStep('tags')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-opacity">
                    Lanjut →
                  </button>
                </div>
              </div>

              {/* ── Filter bar ── */}
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-2xl border-2 border-foreground/10 bg-secondary/30">
                {/* Search input */}
                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={budgetSearch}
                    onChange={e => setBudgetSearch(e.target.value)}
                    placeholder="Cari nama budget..."
                    className="w-full pl-8 pr-8 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {budgetSearch && (
                    <button onClick={() => setBudgetSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* User filter — only if multiple users exist */}
                {availableUsers.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground shrink-0">Pemilik:</span>
                    <button
                      onClick={() => setFilterUserId('all')}
                      className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-colors ${
                        filterUserId === 'all' ? 'bg-primary/10 text-primary border-primary/40' : 'border-foreground/10 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      Semua
                    </button>
                    {availableUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setFilterUserId(u.id)}
                        className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-colors ${
                          filterUserId === u.id ? 'bg-primary/10 text-primary border-primary/40' : 'border-foreground/10 text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {u.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Result count */}
                {(budgetSearch || filterUserId !== 'all') && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {filteredCompatibleBudgets.length} / {compatibleBudgets.length} budget
                  </span>
                )}
              </div>

              {/* Budget grid */}
              {compatibleBudgets.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">{compareType === 'person' ? '👤' : '🗂️'}</p>
                  <p className="text-sm font-semibold">Tidak ada budget {compareType === 'person' ? 'THR' : 'non-THR'} tersedia.</p>
                </div>
              ) : filteredCompatibleBudgets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className="text-sm font-semibold mb-2">Tidak ada budget yang cocok dengan filter.</p>
                  <button onClick={() => { setBudgetSearch(''); setFilterUserId('all'); }} className="text-xs text-primary font-bold hover:underline">
                    Reset filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCompatibleBudgets.map(b => {
                    const bAny     = b as any;
                    const selected = selectedIds.includes(b.id);
                    const disabled = !selected && selectedIds.length >= MAX_BUDGETS;
                    const selIdx   = selectedIds.indexOf(b.id);
                    const totalAmt = expenses.filter(e => (e as any).budgetId === b.id).reduce((s, e) => s + e.amount, 0);
                    const owner    = USERS.find(u => u.id === bAny.userId);
                    return (
                      <motion.button
                        key={b.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => !disabled && toggleBudget(b.id)}
                        className={`rounded-2xl border-2 p-4 text-left transition-all relative ${
                          selected ? 'border-primary bg-primary/10'
                          : disabled ? 'border-foreground/10 opacity-40 cursor-not-allowed'
                          : 'border-foreground/10 hover:border-primary/40 hover:bg-secondary/60'
                        }`}
                      >
                        {/* Numbered badge with budget palette color */}
                        {selected && (
                          <span
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold"
                            style={{ background: BUDGET_PALETTE[selIdx] }}
                          >
                            {selIdx + 1}
                          </span>
                        )}
                        <p className="font-extrabold text-sm pr-7 leading-snug">{bAny.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
                          {budgetLabel(b)}
                          {owner && (
                            <span className="px-1.5 py-0.5 rounded-md bg-secondary text-[10px] font-bold">{owner.name}</span>
                          )}
                        </p>
                        <p className="text-xs text-primary font-bold mt-2">{fmt(bAny.allocatedAmount ?? 0)}</p>
                        <p className="text-[10px] text-muted-foreground">Terpakai: {fmt(totalAmt)}</p>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Selected pills summary */}
              {selectedIds.length > 0 && (
                <div className="mt-5 pt-4 border-t border-foreground/10">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Terpilih:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBudgets.map((b, i) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2"
                        style={{ borderColor: BUDGET_PALETTE[i] + '60', background: BUDGET_PALETTE[i] + '18', color: BUDGET_PALETTE[i] }}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold shrink-0" style={{ background: BUDGET_PALETTE[i] }}>{i + 1}</span>
                        {(b as any).title}
                        <button onClick={e => { e.stopPropagation(); toggleBudget(b.id); }} className="ml-0.5 opacity-60 hover:opacity-100">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ STEP 3: Pilih Tag ════════════════════════════════════════════ */}
          {step === 'tags' && (
            <motion.div key="step-tags" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-extrabold mb-1">Pilih {compareType === 'person' ? 'Orang' : 'Kategori'}</h2>
                  <p className="text-sm text-muted-foreground">
                    Maksimal {MAX_TAGS} item.&nbsp;
                    <span className="font-bold text-primary">{selectedTags.length}/{MAX_TAGS} dipilih</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep('budgets')} className="px-4 py-2 rounded-xl border-2 border-foreground/10 text-sm font-bold hover:bg-secondary transition-colors">
                    ← Kembali
                  </button>
                  <button disabled={selectedTags.length === 0} onClick={() => setStep('chart')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-opacity">
                    Lihat Grafik →
                  </button>
                </div>
              </div>

              {/* Budget pills reminder */}
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedBudgets.map((b, i) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2"
                    style={{ borderColor: BUDGET_PALETTE[i] + '60', background: BUDGET_PALETTE[i] + '18', color: BUDGET_PALETTE[i] }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: BUDGET_PALETTE[i] }}>{i + 1}</span>
                    {(b as any).title} · {budgetLabel(b)}
                  </span>
                ))}
              </div>

              {availableTags.length === 0 ? (
                <div className="flex items-start gap-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl max-w-md">
                  <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Tidak ada {compareType === 'person' ? 'nama orang' : 'kategori'} di budget yang dipilih. Pastikan expense sudah di-tag.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const active    = selectedTags.includes(tag);
                    const disabled  = !active && selectedTags.length >= MAX_TAGS;
                    const selTagIdx = selectedTags.indexOf(tag);
                    const color     = active ? TAG_PALETTE[selTagIdx % TAG_PALETTE.length] : undefined;
                    return (
                      <motion.button
                        key={tag}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => !disabled && toggleTag(tag)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          active ? 'opacity-100'
                          : disabled ? 'opacity-30 cursor-not-allowed border-foreground/10'
                          : 'border-foreground/10 hover:border-foreground/30'
                        }`}
                        style={active && color ? { borderColor: color + '80', background: color + '20', color } : {}}
                      >
                        {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                        {compareType === 'person' ? <User className="h-3.5 w-3.5 shrink-0" /> : <ChartBarStacked className="h-3.5 w-3.5 shrink-0" />}
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ══ STEP 4: Chart ════════════════════════════════════════════════ */}
          {step === 'chart' && (
            <motion.div key="step-chart" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-extrabold mb-0.5">Hasil Perbandingan</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedTags.length} {compareType === 'person' ? 'orang' : 'kategori'} · {selectedIds.length} budget
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="flex rounded-xl border-2 border-foreground/10 overflow-hidden">
                    {CHART_TYPES.map(({ key, label, Icon }) => (
                      <button key={key} onClick={() => setChartType(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors ${chartType === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep('tags')} className="px-3 py-2 rounded-xl border-2 border-foreground/10 text-xs font-bold hover:bg-secondary transition-colors">← Edit Filter</button>
                  <button onClick={resetAll} title="Mulai ulang" className="p-2 rounded-xl border-2 border-foreground/10 text-muted-foreground hover:bg-secondary transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Budget legend */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedBudgets.map((b, i) => (
                  <span key={b.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2"
                    style={{ borderColor: BUDGET_PALETTE[i] + '60', background: BUDGET_PALETTE[i] + '18', color: BUDGET_PALETTE[i] }}>
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-extrabold" style={{ background: BUDGET_PALETTE[i] }}>{i + 1}</span>
                    {(b as any).title} · {budgetLabel(b)}
                  </span>
                ))}
              </div>

              {/* ── BAR ── */}
              {chartType === 'bar' && (
                <motion.div key="bar" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card-bordered rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-muted-foreground mb-4">
                    Pengeluaran per {compareType === 'person' ? 'Orang' : 'Kategori'} — Perbandingan Antar Budget
                  </h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 60 }} barCategoryGap="24%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="tag" tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--muted-foreground)' }} angle={-30} textAnchor="end" interval={0} height={60} />
                      <YAxis tickFormatter={v => `${(v / 1_000_000).toFixed(1)}jt`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={52} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                        formatter={(value) => <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>{value}</span>} />
                      {seriesLabels.map((label, i) => (
                        <Bar key={label} dataKey={label} fill={BUDGET_PALETTE[i]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* ── LINE ── */}
              {chartType === 'line' && (
                <motion.div key="line" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card-bordered rounded-2xl p-5">
                  <h3 className="font-bold text-sm text-muted-foreground mb-4">
                    Tren Pengeluaran per {compareType === 'person' ? 'Orang' : 'Kategori'}
                  </h3>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="tag" tick={{ fontSize: 11, fontWeight: 600, fill: 'var(--muted-foreground)' }} angle={-30} textAnchor="end" interval={0} height={60} />
                      <YAxis tickFormatter={v => `${(v / 1_000_000).toFixed(1)}jt`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} width={52} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                        formatter={(value) => <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>{value}</span>} />
                      {seriesLabels.map((label, i) => (
                        <Line key={label} type="monotone" dataKey={label} stroke={BUDGET_PALETTE[i]} strokeWidth={2.5}
                          dot={{ r: 5, fill: BUDGET_PALETTE[i], strokeWidth: 2, stroke: 'var(--card)' }} activeDot={{ r: 7 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* ── PIE: 1 per TAG, slices = budgets ── */}
              {chartType === 'pie' && (
                <motion.div key="pie" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                  <p className="text-sm text-muted-foreground mb-4">
                    Setiap pie menunjukkan porsi dari masing-masing budget untuk satu {compareType === 'person' ? 'orang' : 'kategori'}.
                  </p>
                  <div className={`grid gap-4 ${
                    pieDataPerTag.length === 1 ? 'grid-cols-1 max-w-sm mx-auto'
                    : pieDataPerTag.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
                    : pieDataPerTag.length <= 4 ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {pieDataPerTag.map(tData => (
                      <div key={tData.tag} className="card-bordered rounded-2xl p-4">
                        {/* Tag title */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: tData.tagColor }} />
                          {compareType === 'person'
                            ? <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChartBarStacked className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <p className="font-extrabold text-sm truncate" style={{ color: tData.tagColor }}>{tData.tag}</p>
                        </div>

                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={tData.slices} cx="50%" cy="50%" outerRadius={75} innerRadius={30}
                              dataKey="value" labelLine={false}
                              label={({ pct }) => pct > 8 ? `${pct.toFixed(0)}%` : ''}>
                              {tData.slices.map((s, si) => (
                                <Cell key={si} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => fmt(v)}
                              contentStyle={{ borderRadius: 12, border: '2px solid var(--border)', background: 'var(--card)', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>

                        <p className="text-center text-xs text-muted-foreground font-semibold mb-3">
                          Total: <span className="text-foreground font-bold">{fmt(tData.grandTotal)}</span>
                        </p>

                        {/* Budget legend per slice */}
                        <div className="space-y-1.5">
                          {tData.slices.map((s, si) => (
                            <div key={si} className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                                <span className="truncate font-medium text-muted-foreground">{s.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground">{s.pct.toFixed(1)}%</span>
                                <span className="font-bold">{fmt(s.value)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Summary table — kolom pertama frozen ── */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="card-bordered rounded-2xl mt-5 overflow-hidden">
                <div className="px-5 py-3 border-b border-foreground/10">
                  <h3 className="font-bold text-sm text-muted-foreground">Ringkasan Angka</h3>
                </div>
                <div className="overflow-x-auto">
                  <table
                    className="w-full border-separate border-spacing-0"
                    style={{ minWidth: `${200 + selectedBudgets.length * 160}px` }}
                  >
                    <thead>
                      <tr className="border-b-2 border-foreground/5">
                        {/* Frozen header cell */}
                        <th className="sticky left-0 z-20 bg-secondary px-4 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-foreground/15">
                          {compareType === 'person' ? 'Nama' : 'Kategori'}
                        </th>
                        {selectedBudgets.map((b, i) => (
                          <th key={b.id} className="bg-secondary px-4 py-2.5 text-right text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap"
                            style={{ color: BUDGET_PALETTE[i] }}>
                            {(b as any).title}
                            <br />
                            <span className="font-semibold text-muted-foreground normal-case tracking-normal">{budgetLabel(b)}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((row, ri) => (
                        <tr key={ri} className="border-b border-foreground/5 last:border-0 hover:bg-secondary/40 transition-colors group">
                          {/* Frozen tag cell */}
                          <td className="sticky left-0 z-10 bg-card transition-colors px-4 py-3 text-sm font-semibold whitespace-nowrap after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-foreground/10">
                            <div className="flex items-center gap-1.5">
                              {compareType === 'person'
                                ? <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                : <ChartBarStacked className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                              {row.tag}
                            </div>
                          </td>
                          {seriesLabels.map((label, i) => (
                            <td key={i} className="px-4 py-3 text-right text-sm font-bold whitespace-nowrap" style={{ color: BUDGET_PALETTE[i] }}>
                              {fmt(row[label] ?? 0)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        {/* Frozen total cell */}
                        <td className="sticky left-0 z-10 bg-secondary border-t-2 border-foreground/10 px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-foreground/15">
                          Total
                        </td>
                        {seriesLabels.map((label, i) => (
                          <td key={i} className="bg-secondary border-t-2 border-foreground/10 px-4 py-3 text-right font-extrabold whitespace-nowrap"
                            style={{ color: BUDGET_PALETTE[i] }}>
                            {fmt(chartData.reduce((s, row) => s + (row[label] ?? 0), 0))}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default CompareBudgets;