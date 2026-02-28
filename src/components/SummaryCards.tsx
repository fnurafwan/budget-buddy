import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SummaryCardsProps {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function SummaryCards({ totalBudgeted, totalSpent, remaining }: SummaryCardsProps) {
  const percentSpent = useMemo(() => totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0, [totalBudgeted, totalSpent]);

  return (
    <div className="space-y-4 mb-8">
      {/* Balance card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bordered rounded-2xl p-6"
      >
        <p className="text-sm font-semibold text-muted-foreground mb-1">Total Balance</p>
        <p className="text-3xl font-extrabold text-income">{fmt(remaining)}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="card-income rounded-xl p-4">
            <p className="text-xs font-semibold text-income mb-0.5">Income / Budgeted</p>
            <p className="text-lg font-bold text-income">+{fmt(totalBudgeted)}</p>
          </div>
          <div className="card-expense rounded-xl p-4">
            <p className="text-xs font-semibold text-expense mb-0.5">Expenses</p>
            <p className="text-lg font-bold text-expense">-{fmt(totalSpent)}</p>
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card-bordered rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-muted-foreground">Budget Used</span>
          <span className="text-sm font-bold">{percentSpent.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border">
          <motion.div
            className={`h-full rounded-full ${percentSpent > 80 ? 'bg-expense' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentSpent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
