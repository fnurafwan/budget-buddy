import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { icons, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Budget } from '@/types/budget';
import { CATEGORIES } from '@/types/budget';
import type { LucideIcon } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  allocation: number;
  realization: number;
  ownerName?: string; 
  hide?: boolean;
}

export function BudgetCard({ budget, spent, allocation, realization, ownerName, hide }: BudgetCardProps) {
  const navigate = useNavigate();
  const remaining = budget.allocatedAmount - spent;
  const allocPercent = useMemo(() => budget.allocatedAmount > 0 ? Math.min((allocation / budget.allocatedAmount) * 100, 100) : 0, [allocation, budget.allocatedAmount]);
  const realPercent = useMemo(() => budget.allocatedAmount > 0 ? Math.min((realization / budget.allocatedAmount) * 100, 100) : 0, [realization, budget.allocatedAmount]);
  const category = CATEGORIES.find(c => c.value === budget.category);
  const IconComp = (icons[budget.icon as keyof typeof icons] as LucideIcon) || icons.CircleDollarSign;
  const fmt = (n: number) => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/budget/${budget.id}`)}
      className="card-bordered rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10">
          <IconComp className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm">{budget.title}</h3>
          <span className="text-xs text-muted-foreground">{category?.label}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Allocation bar */}
        <div>
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-primary">Allocation</span>
            <span className="text-primary">{fmt(allocation)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${allocPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        {/* Realization bar */}
        <div>
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-expense">Realization</span>
            <span className="text-expense">{fmt(realization)}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full rounded-full bg-expense"
              initial={{ width: 0 }}
              animate={{ width: `${realPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>
        <div className="flex justify-between text-xs font-semibold pt-1">
          <span className="text-muted-foreground">Total: {fmt(spent)}</span>
          <span className={remaining < 0 ? 'text-destructive' : 'text-income'}>Left: {fmt(remaining)}</span>
        </div>
        <div className="flex justify-start items-center text-xs font-semibold pt-1 gap-2">
          <User className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{ownerName}</span>
        </div>
      </div>
    </motion.div>
  );
}
