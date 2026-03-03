import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { CATEGORIES, type Category } from '@/types/budget';
import CurrencyInput from './CurrencyInput';

interface NewBudgetModalProps {
  onAdd: (budget: { title: string; allocatedAmount: number; category: Category; icon: string }) => void;
}

export function NewBudgetModal({ onAdd }: NewBudgetModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<Category | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !category) return;
    const cat = CATEGORIES.find(c => c.value === category);
    onAdd({ title, allocatedAmount: amount as number, category, icon: cat?.icon || 'CircleDollarSign' });
    setTitle(''); setAmount(''); setCategory('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-primary rounded-xl px-5 py-2.5 font-bold text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Budget
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl border-2 border-foreground/15">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">Create New Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="title" className="font-semibold">Title</Label>
            <Input id="title" placeholder="e.g. Holiday Trip" value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" />
          </div>
          <div>
            <Label htmlFor="amount" className="font-semibold">Allocated Amount (Rp)</Label>
            {/* <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl border-2 border-foreground/10 mt-1" /> */}
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="0"
              className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <Label className="font-semibold">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="rounded-xl border-2 border-foreground/10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-foreground/10">
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button type="submit" className="btn-primary w-full rounded-xl py-2.5 font-bold text-sm">Create Budget</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
