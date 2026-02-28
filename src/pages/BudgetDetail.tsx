import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, AlertTriangle, Tag } from 'lucide-react';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBudget } from '@/context/BudgetContext';
import { CATEGORIES } from '@/types/budget';
import type { ExpenseType } from '@/types/budget';

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const BudgetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { budgets, expenses, addExpense, deleteExpense, updateExpense, deleteBudget, getAllocationForBudget, getRealizationForBudget } = useBudget();

  const budget = budgets.find(b => b.id === id);
  const budgetExpenses = useMemo(() =>
    expenses.filter(e => e.budgetId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
        {/* Budget Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-bordered rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="p-3 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10">
              <IconComp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{budget.title}</h1>
              <span className="text-sm text-muted-foreground">{category?.label}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-1">Budget Amount</p>
            <p className="text-3xl font-extrabold">{fmt(budget.allocatedAmount)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-4 border-2" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.3)' }}>
              <p className="text-xs font-semibold text-primary mb-0.5">Allocation</p>
              <p className="text-lg font-bold text-primary">{fmt(allocation)}</p>
            </div>
            <div className="card-expense rounded-xl p-4">
              <p className="text-xs font-semibold text-expense mb-0.5">Realization</p>
              <p className="text-lg font-bold text-expense">{fmt(realization)}</p>
            </div>
            <div className="card-income rounded-xl p-4">
              <p className="text-xs font-semibold text-income mb-0.5">Remaining</p>
              <p className={`text-lg font-bold ${remaining < 0 ? 'text-destructive' : 'text-income'}`}>{fmt(remaining)}</p>
            </div>
          </div>

          {/* Two Progress Bars */}
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
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add Expense Section */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold text-sm">Amount ($)</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" />
                      {exceeds && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Exceeds remaining ({fmt(remaining)})</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold text-sm">Date</Label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" />
                    </div>
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
                  </div>
                  <div>
                    <Label className="font-semibold text-sm">Description</Label>
                    <Input placeholder="What was this for?" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" />
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

        {/* Expense List */}
        <div className="card-bordered rounded-2xl p-5">
          <h3 className="font-bold text-sm text-muted-foreground mb-3">Transaction History</h3>
          {budgetExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No expenses logged yet</p>
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
                        <div className="flex-1 flex gap-2">
                          <Input className="w-24 rounded-lg border-2 border-foreground/10" type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                          <Input className="flex-1 rounded-lg border-2 border-foreground/10" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                        </div>
                        <button onClick={() => saveEdit(exp.id)} className="p-1.5 rounded-lg hover:bg-income/10 text-income"><Check className="h-4 w-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground"><X className="h-4 w-4" /></button>
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
                          <p className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-bold text-expense whitespace-nowrap">-{fmt(exp.amount)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
