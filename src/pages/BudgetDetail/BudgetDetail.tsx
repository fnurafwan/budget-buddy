import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Sun, Moon } from 'lucide-react';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useUser } from '@/context/UserContext';
import type { ExpenseType } from '@/types/budget';

import BudgetOverview from './BudgetOverview';
import DoodlePieChart from './DoodlePieChart';
import DataGrid from './DataGrid';
import TransactionHistory from './TransactionHistory';

const BudgetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUser();
  const {
    budgets,
    expenses,
    persons,
    categoryExpenses,
    addExpense,
    deleteExpense,
    updateExpense,
    deleteBudget,
    getAllocationForBudget,
    getRealizationForBudget,
    updateBudget,
  } = useBudgetData();

  const budget = budgets.find(b => b.id === id);

  const budgetExpenses = useMemo(() =>
    expenses
      .filter(e => e.budgetId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, id]
  );

  if (!budget) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold mb-2">Budget not found</p>
          <button onClick={() => navigate('/')} className="btn-primary rounded-xl px-5 py-2 font-bold text-sm">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isThr = budget.category === 'thr';
  const allocation  = getAllocationForBudget(budget.id);
  const realization = getRealizationForBudget(budget.id);
  const totalSpent  = allocation + realization;
  const remaining   = budget.allocatedAmount - totalSpent;
  const allocPercent = budget.allocatedAmount > 0 ? Math.min((allocation  / budget.allocatedAmount) * 100, 100) : 0;
  const realPercent  = budget.allocatedAmount > 0 ? Math.min((realization / budget.allocatedAmount) * 100, 100) : 0;

  const handleDelete = () => { 
    if(confirm('Are you sure you want to delete this budget? This action cannot be undone.')){
      deleteBudget(budget.id); navigate('/'); 
    }
  };

  const handleAddExpense = (data: {
    amount: number;
    description: string;
    date: string;
    type: ExpenseType;
    personName?: string;
    categoryExpenseName?: string;
  }) => {
    addExpense({ budgetId: budget.id, ...data });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={handleDelete} className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" /> Delete Budget
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <BudgetOverview
          budget={budget}
          allocation={allocation}
          realization={realization}
          totalSpent={totalSpent}
          remaining={remaining}
          allocPercent={allocPercent}
          realPercent={realPercent}
          persons={persons}
          categoryExpenses={categoryExpenses}
          onAddExpense={handleAddExpense}
          onUpdate={(bgtId, updates) => updateBudget(bgtId, updates as any)}
        />

        <DoodlePieChart expenses={budgetExpenses} isThr={isThr} />

        <DataGrid expenses={budgetExpenses} totalBudget={budget.allocatedAmount} isThr={isThr}/>

        <TransactionHistory
          expenses={budgetExpenses}
          persons={persons}
          categoryExpenses={categoryExpenses}
          budgetCategory={budget.category}
          onUpdate={(expId, updates) => updateExpense(expId, updates as any)}
          onDelete={deleteExpense}
        />
      </main>
    </div>
  );
};

export default BudgetDetail;