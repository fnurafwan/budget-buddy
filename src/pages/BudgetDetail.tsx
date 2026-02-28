import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Flag, LayoutGrid, List
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

// ⚠️ Use explicit Tailwind classes — no dynamic string manipulation
// (Tailwind purges dynamic classes like cfg.color.replace('text-','bg-'))
const FLAG_CONFIG: Record<FlagLevel, {
  label: string;
  textColor: string;
  bgColor: string;
  barColor: string;   // explicit bg-* class for progress bars
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

// ── DataGrid ──────────────────────────────────────────────────────────────────
interface DataGridProps {
  expenses: {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: ExpenseType;
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

      {/* Flag Summary — scrollable on very small screens */}
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
          /* ── Card Grid ── */
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
                  {/* Flag ribbon */}
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
                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  <p className={`text-lg font-extrabold ${cfg.textColor}`}>{fmt(exp.amount)}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2">{exp.pct.toFixed(1)}% of budget</p>

                  {/* Mini progress bar — using inline style width to avoid Tailwind purge issues */}
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
          /* ── List / Table (horizontally scrollable) ── */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card-bordered rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-secondary/60 border-b-2 border-foreground/5">
                    <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Item</th>
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
                        {/* Item */}
                        <td className="px-4 py-3 min-w-[140px]">
                          <p className="text-sm font-semibold">{exp.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        {/* Type */}
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border whitespace-nowrap ${
                            exp.type === 'allocation'
                              ? 'text-primary border-primary/30 bg-primary/10'
                              : 'text-expense border-expense/30 bg-expense/10'
                          }`}>
                            {exp.type === 'allocation' ? 'ALC' : 'REA'}
                          </span>
                        </td>
                        {/* Flag badge */}
                        <td className="px-3 py-3">
                          <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${cfg.bgColor} ${cfg.textColor}`}>
                            {cfg.icon}
                            <span>{cfg.label}</span>
                          </div>
                        </td>
                        {/* % Budget with mini bar */}
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
                        {/* Amount */}
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
    budgets, expenses, addExpense, deleteExpense, updateExpense,
    deleteBudget, getAllocationForBudget, getRealizationForBudget,
  } = useBudget();

  const budget = budgets.find(b => b.id === id);
  const budgetExpenses = useMemo(() =>
    expenses
      .filter(e => e.budgetId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, id]
  );

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType] = useState<ExpenseType>('realization');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');

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
    addExpense({ budgetId: budget.id, amount: parseFloat(amount), description, date, type: expenseType });
    setAmount(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]); setExpenseType('realization');
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
  };

  const saveEdit = (expId: string) => {
    updateExpense(expId, { amount: parseFloat(editAmount), description: editDesc });
    setEditingId(null);
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
          {/* Title row */}
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10 shrink-0">
              <IconComp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold">{budget.title}</h1>
              <span className="text-sm text-muted-foreground">{category?.label}</span>
            </div>
          </div>

          {/* Budget amount */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Budget Amount</p>
            <p className="text-3xl font-extrabold break-all">{fmt(budget.allocatedAmount)}</p>
          </div>

          {/* ── Stats: stacked 2-column to prevent overflow ── */}
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
          {/* Remaining — full width so long IDR amounts never get clipped */}
          <div className="card-income rounded-xl p-3 mb-5">
            <p className="text-xs font-semibold text-income mb-1">Remaining</p>
            <p className={`text-xl font-extrabold break-all ${remaining < 0 ? 'text-destructive' : 'text-income'}`}>
              {fmt(remaining)}
            </p>
          </div>

          {/* Progress bars */}
          <div className="space-y-3">
            {/* Allocation bar */}
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
            {/* Realization bar */}
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
            {/* Total spent bar */}
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
                  {/* Row 1: Amount + Date side by side */}
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
                      {/* Safari renders date as "28 Feb 2026" which is wide — w-full + appearance-none fixes overflow */}
                      <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 [color-scheme:light] dark:[color-scheme:dark]"
                        style={{ minWidth: 0 }}
                      />
                    </div>
                  </div>
                  {/* Row 2: Type toggle — full width */}
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
                  <div>
                    <Label className="font-semibold text-sm">Description</Label>
                    <Input
                      placeholder="Untuk apa ini?"
                      value={description} onChange={e => setDescription(e.target.value)}
                      className="rounded-xl border-2 border-foreground/10 mt-1"
                    />
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
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
                  >
                    {editingId === exp.id ? (
                      <>
                        <div className="flex-1 flex gap-2 min-w-0">
                          <Input
                            className="w-28 rounded-lg border-2 border-foreground/10"
                            type="number" value={editAmount}
                            onChange={e => setEditAmount(e.target.value)}
                          />
                          <Input
                            className="flex-1 rounded-lg border-2 border-foreground/10 min-w-0"
                            value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          />
                        </div>
                        <button onClick={() => saveEdit(exp.id)} className="p-1.5 rounded-lg hover:bg-income/10 text-income shrink-0"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground shrink-0"><X className="h-4 w-4" /></button>
                      </>
                    ) : (
                      <>
                        <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          exp.type === 'allocation'
                            ? 'text-primary border-primary/30 bg-primary/10'
                            : 'text-expense border-expense/30 bg-expense/10'
                        }`}>
                          {exp.type === 'allocation' ? 'ALC' : 'REA'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{exp.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        {/* Amount — nowrap, shrink-0 prevents overlap */}
                        <span className="text-sm font-bold text-expense whitespace-nowrap shrink-0">
                          -{fmt(exp.amount)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => startEdit(exp)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteExpense(exp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
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