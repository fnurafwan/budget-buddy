import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Eye, EyeOff, Pencil, X, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CATEGORIES } from '@/types/budget';
import type { Budget, ExpenseType } from '@/types/budget';
import { fmt } from './flagUtils';
import PersonCombobox from './PersonCombobox';
import CurrencyInput from '@/components/CurrencyInput';
import { useUser } from '@/context/UserContext';

interface BudgetOverviewProps {
  budget: {
    id: string;
    title: string;
    category: string;
    icon: string;
    allocatedAmount: number;
  };
  allocation: number;
  realization: number;
  totalSpent: number;
  remaining: number;
  allocPercent: number;
  realPercent: number;
  persons: { id: string; name: string }[];
  categoryExpenses: { id: string; name: string }[];
  onAddExpense: (data: {
    amount: number;
    description: string;
    date: string;
    type: ExpenseType;
    personName?: string;
    categoryExpenseName?: string;
  }) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
}

// Sembunyikan angka dengan bullet
const masked = '••••••';

const BudgetOverview = ({
  budget,
  allocation,
  realization,
  totalSpent,
  remaining,
  allocPercent,
  realPercent,
  persons,
  categoryExpenses,
  onAddExpense,
  onUpdate,
}: BudgetOverviewProps) => {
  const isThr = budget.category === 'thr';
  const { hideNumbers, toggleHide } = useUser();

  const [showForm, setShowForm]         = useState(false);
  const [amount, setAmount]             = useState<number | ''>('');
  const [description, setDescription]   = useState('');
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [expenseType, setExpenseType]   = useState<ExpenseType>('realization');
  const [tagName, setTagName]           = useState('');

  const category = CATEGORIES.find(c => c.value === budget.category);
  const IconComp = (icons[budget.icon as keyof typeof icons] as LucideIcon) || icons.CircleDollarSign;
  const exceeds = amount !== '' && amount > remaining;

  const displayNum = (n: number) => hideNumbers ? `Rp${masked}` : fmt(n);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setExpenseType('realization');
    setTagName('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || !description || !date) return;
    onAddExpense({
      amount: amount as number,
      description,
      date,
      type: expenseType,
      ...(isThr
        ? { personName: tagName.trim() || undefined }
        : { categoryExpenseName: tagName.trim() || undefined }
      ),
    });
    resetForm();
  };

  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = (bdtId: string) => {
    if (editTitle === '') return;
    onUpdate(bdtId, { title: editTitle });
    setEditingId(null);
  };

  const [editingAmountId, setEditingAmountId]         = useState<string | null>(null);
  const [editAmount, setEditAmount]       = useState<number | ''>('');

  const startEditAmount = (id: string, amount: number) => {
    setEditingAmountId(id);
    setEditAmount(amount);
  };

  const saveEditAmount = (bdtId: string) => {
    if (editAmount === '') return;
    onUpdate(bdtId, { allocatedAmount: editAmount });
    setEditingAmountId(null);
  };

  return (
    <>
      {/* ── Budget Header Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bordered rounded-2xl p-6 mb-6"
      >
        {/* Title row + hide toggle */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10 shrink-0">
              <IconComp className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              {editingId === budget.id ? (
                <>
                <Input
                  className="flex rounded-lg border-2 border-foreground/10 min-w-0 w-fit md:w-96"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Budget"
                />
                <div className='flex flex-row justify-end gap-2 mt-2'>
                  <button onClick={() => saveEdit(budget.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-income/10 text-income text-xs font-bold">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground text-xs font-bold border border-foreground/10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                </>
                ):
                (
                  <h1 className="text-2xl font-extrabold">{budget.title}
                    <span className='ml-2'>
                      <button 
                        onClick={() => startEdit(budget.id, budget.title)} 
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                        >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </h1>    
                )
              }
              <span className="text-sm text-muted-foreground">{category?.label}</span>
            </div>
          </div>
          {/* Hide/show toggle khusus halaman ini */}
          <button
            onClick={toggleHide}
            title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
            className="shrink-0 p-2 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground mt-0.5"
          >
            {hideNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-semibold text-muted-foreground mb-1">Budget Amount</p>
          {editingAmountId === budget.id ? (
            <>
            <CurrencyInput
              value={editAmount}
              onChange={setEditAmount}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className='flex flex-row justify-end gap-2 mt-2'>
              <button onClick={() => saveEditAmount(budget.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-income/10 text-income text-xs font-bold">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setEditingAmountId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-secondary text-muted-foreground text-xs font-bold border border-foreground/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            </>
            ):
            (
              <p className="text-3xl font-extrabold break-all">
                {hideNumbers ? `Rp${masked}` : fmt(budget.allocatedAmount)}
                <span className='ml-2'>
                  <button 
                    onClick={() => startEditAmount(budget.id, budget.allocatedAmount)} 
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                    >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </span>
              </p>
            )
          }
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="rounded-xl p-3 border-2" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
            <p className="text-xs font-semibold text-primary mb-1">Allocation</p>
            <p className="text-base font-extrabold text-primary break-all">{displayNum(allocation)}</p>
          </div>
          <div className="card-expense rounded-xl p-3">
            <p className="text-xs font-semibold text-expense mb-1">Realization</p>
            <p className="text-base font-extrabold text-expense break-all">{displayNum(realization)}</p>
          </div>
        </div>

        <div className="card-income rounded-xl p-3 mb-5">
          <p className="text-xs font-semibold text-income mb-1">Remaining</p>
          <p className={`text-xl font-extrabold break-all ${remaining < 0 ? 'text-destructive' : 'text-income'}`}>
            {displayNum(remaining)}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-primary">Allocation</span>
              <span className="text-primary">{allocPercent.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
              <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${allocPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-expense">Realization</span>
              <span className="text-expense">{realPercent.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
              <motion.div className={`h-full rounded-full ${realPercent > 80 ? 'bg-destructive' : 'bg-expense'}`} initial={{ width: 0 }} animate={{ width: `${realPercent}%` }} transition={{ duration: 1, ease: 'easeOut', delay: 0.15 }} />
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
          <p className="text-sm text-muted-foreground">
            "Beware of little expenses; a small leak will sink a great ship." — Benjamin Franklin
          </p>
        </div>
      </motion.div>

      {/* ── Add Expense ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Expenses</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary rounded-xl px-4 py-2 font-bold text-sm flex items-center gap-2">
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
              <form onSubmit={handleSubmit} className="card-accent rounded-2xl p-5 mb-4 space-y-4">

                {/* Row 1: Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <Label className="font-semibold text-sm">Amount (Rp)</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">Rp</span>
                      <CurrencyInput
                        value={amount}
                        onChange={setAmount}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
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
                      className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Row 2: Type toggle */}
                <div>
                  <Label className="font-semibold text-sm">Type</Label>
                  <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setExpenseType('allocation')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${expenseType === 'allocation' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/10 hover:bg-secondary'}`}>Allocation</button>
                    <button type="button" onClick={() => setExpenseType('realization')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${expenseType === 'realization' ? 'bg-expense text-white border-expense' : 'border-foreground/10 hover:bg-secondary'}`}>Realization</button>
                  </div>
                </div>

                {/* Row 3: Description */}
                <div>
                  <Label className="font-semibold text-sm">Description</Label>
                  <Input placeholder="Untuk apa ini?" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" />
                </div>

                {/* Row 4: Person / Kategori */}
                <div>
                  <Label className="font-semibold text-sm">
                    {isThr ? 'Person' : 'Kategori'}
                    <span className="text-muted-foreground font-normal ml-1">(opsional)</span>
                  </Label>
                  <div className="mt-1">
                    <PersonCombobox
                      value={tagName}
                      onChange={setTagName}
                      options={isThr ? persons : categoryExpenses}
                      isThr={isThr}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold text-sm">Save Expense</button>
                  <button type="button" onClick={resetForm} className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-foreground/10 hover:bg-secondary transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default BudgetOverview;