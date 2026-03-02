import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, ChartBarStacked, Pencil, Trash2, Check, ArrowRightLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ExpenseType } from '@/types/budget';
import { fmt } from './flagUtils';
import PersonCombobox from './PersonCombobox';
import CurrencyInput from '@/components/CurrencyInput';
import { useUser } from '@/context/UserContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: ExpenseType;
  personName?: string;
  categoryExpenseName?: string;
}

interface TransactionHistoryProps {
  expenses: Expense[];
  persons: { id: string; name: string }[];
  categoryExpenses: { id: string; name: string }[];
  budgetCategory: string;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
}

const masked = '••••••';

const TransactionHistory = ({
  expenses,
  persons,
  categoryExpenses,
  budgetCategory,
  onUpdate,
  onDelete,
}: TransactionHistoryProps) => {
  const isThr = budgetCategory === 'thr';
  const { hideNumbers } = useUser();

  const [historySearch, setHistorySearch] = useState('');
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editAmount, setEditAmount]       = useState<number | ''>('');
  const [editDesc, setEditDesc]           = useState('');
  const [editTagName, setEditTagName]     = useState('');
  const [flippingId, setFlippingId]       = useState<string | null>(null);

  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount);
    setEditDesc(exp.description);
    setEditTagName(isThr ? (exp.personName ?? '') : (exp.categoryExpenseName ?? ''));
  };

  const saveEdit = (expId: string) => {
    if (editAmount === '') return;
    const tagUpdate = isThr
      ? { personName: editTagName.trim() || '' }
      : { categoryExpenseName: editTagName.trim() || '' };
    onUpdate(expId, { amount: editAmount as number, description: editDesc, ...tagUpdate });
    setEditingId(null);
  };

  const handleFlipType = (exp: Expense) => {
    const newType: ExpenseType = exp.type === 'allocation' ? 'realization' : 'allocation';
    onUpdate(exp.id, { type: newType });
    setFlippingId(null);
  };

  const getTagName = (exp: Expense) => isThr ? exp.personName : exp.categoryExpenseName;

  const q = historySearch.toLowerCase().trim();
  const filtered = q
    ? expenses.filter(e =>
        e.description?.toLowerCase().includes(q) ||
        getTagName(e)?.toLowerCase().includes(q)
      )
    : expenses;

  const comboboxOptions = isThr ? persons : categoryExpenses;

  return (
    <div className="card-bordered rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h3 className="font-bold text-sm text-muted-foreground">Transaction History</h3>
        {expenses.length > 0 && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder={`Cari deskripsi / ${isThr ? 'nama' : 'kategori'}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {historySearch && (
              <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {expenses.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Belum ada transaksi</p>
      ) : (
        <>
          {historySearch && (
            <p className="text-xs text-muted-foreground mb-2">
              {filtered.length} dari {expenses.length} transaksi
            </p>
          )}
          <div className={`space-y-2 overflow-y-auto pr-1 ${expenses.length > 8 ? 'max-h-[480px]' : ''}`}>
            <AnimatePresence>
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Tidak ada hasil untuk "{historySearch}"
                </p>
              )}
              {filtered.map(exp => {
                const tagName = getTagName(exp);
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
                  >
                    {editingId === exp.id ? (
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex gap-2">
                          {/* CurrencyInput di edit mode */}
                          <div className="relative w-36 shrink-0">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">Rp</span>
                            <CurrencyInput
                              value={editAmount}
                              onChange={setEditAmount}
                              placeholder="0"
                              className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg border-2 border-foreground/10 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <Input
                            className="flex-1 rounded-lg border-2 border-foreground/10 min-w-0"
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            placeholder="Deskripsi"
                          />
                        </div>
                        <PersonCombobox
                          value={editTagName}
                          onChange={setEditTagName}
                          options={comboboxOptions}
                          isThr={isThr}
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
                        {/* Type badge */}
                        <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${exp.type === 'allocation' ? 'text-primary border-primary/30 bg-primary/10' : 'text-expense border-expense/30 bg-expense/10'}`}>
                            {exp.type === 'allocation' ? 'ALC' : 'REA'}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{exp.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {tagName && (
                              <div className="flex items-center gap-1">
                                {isThr
                                  ? <User className="h-3 w-3 text-muted-foreground shrink-0" />
                                  : <ChartBarStacked className="h-3 w-3 text-muted-foreground shrink-0" />
                                }
                                <span className="text-xs text-muted-foreground font-medium">{tagName}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-bold text-expense whitespace-nowrap">
                            {hideNumbers ? `Rp. ${masked}` : fmt(exp.amount)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {flippingId === exp.id ? (
                              <>
                                <button
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
                              <button onClick={() => setFlippingId(exp.id)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600">
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => startEdit(exp)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => onDelete(exp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory;