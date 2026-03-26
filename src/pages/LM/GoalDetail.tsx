import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { GoalDetailCard } from '@/components/LM/GoalDetailCard';

export default function GoalDetail() {
  const navigate = useNavigate();
  const { theme, toggleTheme, } = useUser();

  return (
    <div className="min-h-screen bg-background lm-mode">
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-bold text-sm hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <GoalDetailCard />
      </main>
    </div>
  );
}