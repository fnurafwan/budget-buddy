import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, List, Flag, User, ChartBarStacked, ChevronDown } from 'lucide-react';
import type { ExpenseType } from '@/types/budget';
import { getFlag, FLAG_CONFIG, fmt } from './flagUtils';
import type { FlagLevel } from './flagUtils';
import { useUser } from '@/context/UserContext';

export interface DataGridProps {
  expenses: {
    id: string;
    description: string;
    amount: number;
    date: string;
    type: ExpenseType;
    personName?: string;
    categoryExpenseName?: string;
  }[];
  totalBudget: number;
  isThr: boolean;
}

const DataGrid = ({ expenses, totalBudget, isThr }: DataGridProps) => {
  const [view, setView]             = useState<'grid' | 'list'>('list');
  const [sortKey, setSortKey]       = useState<'amount' | 'date' | 'flag'>('amount');
  const [filterFlag, setFilterFlag] = useState<FlagLevel | 'all'>('all');
  const [filterTag, setFilterTag]   = useState<string>('all');
  const { hideNumbers } = useUser();
  const masked = '••••••';

  const tagLabel = isThr ? 'Person' : 'Kategori';
  const TagIcon  = isThr ? User : ChartBarStacked;

  const getTag = (e: { personName?: string; categoryExpenseName?: string }) =>
    isThr ? (e.personName ?? '') : (e.categoryExpenseName ?? '');

  const avg = expenses.length > 0
    ? expenses.reduce((s, e) => s + e.amount, 0) / expenses.length
    : 0;

  const enriched = useMemo(() =>
    expenses.map(e => ({
      ...e,
      flag: getFlag(e.amount, avg),
      pct:  totalBudget > 0 ? (e.amount / totalBudget) * 100 : 0,
      tag:  getTag(e),
    })),
    [expenses, avg, totalBudget, isThr]
  );

  const tagOptions = useMemo(() => {
    const names = new Set<string>();
    enriched.forEach(e => { if (e.tag) names.add(e.tag); });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'id'));
  }, [enriched]);

  const sorted = useMemo(() => {
    let filtered = filterFlag === 'all' ? enriched : enriched.filter(e => e.flag === filterFlag);
    if (filterTag !== 'all') {
      filtered = filterTag === '__none__'
        ? filtered.filter(e => !e.tag)
        : filtered.filter(e => e.tag === filterTag);
    }
    return [...filtered].sort((a, b) => {
      if (sortKey === 'amount') return b.amount - a.amount;
      if (sortKey === 'date')   return new Date(b.date).getTime() - new Date(a.date).getTime();
      const order: FlagLevel[] = ['critical', 'warning', 'normal', 'low'];
      return order.indexOf(a.flag) - order.indexOf(b.flag);
    });
  }, [enriched, sortKey, filterFlag, filterTag]);

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
          const cfg    = FLAG_CONFIG[flag];
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

      {/* Sort + Tag Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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

        {tagOptions.length > 0 && (
          <>
            <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-2">{tagLabel}:</span>
            <div className="relative">
              <TagIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              <select
                value={filterTag}
                onChange={e => setFilterTag(e.target.value)}
                className={`text-xs font-bold pl-7 pr-7 py-1 rounded-lg border-2 transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                  filterTag !== 'all'
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'border-foreground/10 hover:bg-secondary text-muted-foreground bg-transparent'
                }`}
              >
                <option value="all">All</option>
                {tagOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="__none__">{isThr ? '(Tanpa Nama)' : '(Tanpa Kategori)'}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          </>
        )}
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

                  {exp.tag && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <TagIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground font-medium truncate">{exp.tag}</span>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-3">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  <p className={`text-lg font-extrabold ${cfg.textColor}`}>{hideNumbers ? `Rp${masked}` : fmt(exp.amount)}</p>
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
            <div className="max-h-[60vh] overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead className="sticky top-0 bg-secondary/90 backdrop-blur z-10">
                  <tr className="bg-secondary/60 border-b-2 border-foreground/5">
                    <th className="text-center px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">No.</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Item</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">{tagLabel}</th>
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
                        <td className="px-4 py-3 text-center text-[10px] font-bold text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <p className="text-sm font-semibold">{exp.description}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-3 py-3 min-w-[100px]">
                          {exp.tag ? (
                            <div className="flex items-center gap-1">
                              <TagIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{exp.tag}</span>
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
                          {hideNumbers ? `Rp${masked}` : fmt(exp.amount)}
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

export default DataGrid;