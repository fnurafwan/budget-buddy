import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface NewGoalModalProps {
  onAdd: (goal: { name: string; targetGram: number; icon: string; createdAt: string }) => void;
}

export function NewGoalModal({ onAdd }: NewGoalModalProps) {
  const [open, setOpen]         = useState(false);
  const [name, setName]         = useState('');
  const [icon, setIcon]         = useState('');
  const [targetGram, setTargetGram] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetGram) return;
    onAdd({
      name,
      targetGram: parseFloat(targetGram),
      icon: icon || 'CircleDollarSign',
      createdAt: new Date().toISOString(),
    });
    setName('');
    setTargetGram('');
    setIcon('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-primary rounded-xl px-5 py-2.5 font-bold text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Goal
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl border-2 border-foreground/15">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-lg">Buat Goal Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="name" className="font-semibold">Nama Goal</Label>
            <Input
              id="name"
              placeholder="e.g. Dana Pensiun"
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl border-2 border-foreground/10 mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="targetGram" className="font-semibold">
              Target Berat <span className="text-muted-foreground font-normal">(gram)</span>
            </Label>
            <div className="relative mt-1">
              <Input
                id="targetGram"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="mis. 100"
                value={targetGram}
                onChange={e => setTargetGram(e.target.value)}
                className="rounded-xl border-2 border-foreground/10 pr-10"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                gr
              </span>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full rounded-xl py-2.5 font-bold text-sm">
            Buat Goal
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}