import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { useBudget } from '@/context/BudgetContext';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetCard } from '@/components/BudgetCard';
import { NewBudgetModal } from '@/components/NewBudgetModal';

const Index = () => {
  const { budgets, addBudget, getSpentForBudget, getAllocationForBudget, getRealizationForBudget, summary } = useBudget();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">BudgetFlow</h1>
          </div>
          <NewBudgetModal onAdd={addBudget} />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-extrabold mb-1"
        >
          Hello there! 👋
        </motion.p>
        <p className="text-sm text-muted-foreground mb-6">Here's your financial overview</p>

        <SummaryCards {...summary} />

        <div className="mb-8">
          <h2 className="text-lg font-extrabold mb-4">Budget Plans</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map(budget => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={getSpentForBudget(budget.id)}
                allocation={getAllocationForBudget(budget.id)}
                realization={getRealizationForBudget(budget.id)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
