import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChartBar, Clock, icons, Server, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Budget } from '@/types/budget';
import { CATEGORIES } from '@/types/budget';
import type { LucideIcon } from 'lucide-react';
import { getUsersConcated } from '@/context/UserContext';
import { Goals } from '@/types/goals';

interface GoalsCardProps {
  goals: Goals;
  hide?: boolean;
  currentGram: number;
}

export function GoalsCard({ goals, hide, currentGram }: GoalsCardProps) {
  const navigate = useNavigate();
  const goalPercent = useMemo(() => goals.targetGram > 0 ? Math.min((currentGram / goals.targetGram) * 100, 100) : 0, [currentGram, goals.targetGram]);
//   const IconComp = (icons[budget.icon as keyof typeof icons] as LucideIcon) || icons.CircleDollarSign;
  // const fmt = (n: number) => n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
  const fmt = (n: number) =>
  n
    .toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\u00A0/, ' ');
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const masked = '••••••';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(`/goaldetail/${goals.id}`)}
      className="card-bordered rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-colors h-full flex flex-col"
    >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-1 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10 shrink-0">
            {/* <IconComp className="h-5 w-5" /> */}
            <ChartBar className="h-3 w-3" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{goals.name}</h3>
            {/* <span className="text-xs text-muted-foreground">{category?.label}</span> */}
          </div>
        </div>

      <div className="space-y-2.5 mt-auto">
        <div>
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-primary">Progress</span>
            <span className="text-primary">{hide ? `${masked}g` : currentGram.toFixed(1) +`g /` + goals.targetGram+`g`}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${goalPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
