import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, LogOut, Eye, EyeOff,
  Search, X, ChevronDown, Lock, Plus,
  KeyRound, Sun, Moon,
} from 'lucide-react';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useUser, USERS } from '@/context/UserContext';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetCard } from '@/components/BudgetCard';
import { NewBudgetModal } from '@/components/NewBudgetModal';
import ChangePinModal from '@/components/ChangePinModal';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const Index = () => {
  const {
    budgets,
    addBudget,
    getSpentForBudget,
    getAllocationForBudget,
    getRealizationForBudget,
    getSummaryForUser,
  } = useBudgetData();

  const { currentUser, hideNumbers, theme, toggleHide, toggleTheme, logout } = useUser();

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filterUser, setFilterUser] = useState<string>(currentUser?.id ?? 'all');
  const [filterYear, setFilterYear] = useState<number | 'all'>(CURRENT_YEAR);
  const [search, setSearch] = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const bAny = b as any;
      if (filterUser !== 'all' && bAny.userId !== filterUser && bAny.userId != null) return false;
      if (filterYear !== 'all') {
        const year = bAny.year ?? new Date(bAny.createdAt ?? Date.now()).getFullYear();
        if (year !== filterYear) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !b.title.toLowerCase().includes(q) &&
          !(bAny.category ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [budgets, filterUser, filterYear, search]);

  const summary = getSummaryForUser(filterUser);

  const handleAddBudget = (data: any) => {
    addBudget({
      ...data,
      userId: currentUser?.id,
      year: new Date().getFullYear(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header — hanya logo + nama app ── */}
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10 shrink-0">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">BujatBudget</h1>

          </div>
          
            <div className="flex items-center gap-2 shrink-0">

              {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
           {/* Ganti PIN */}
            <button
              onClick={() => setPinModalOpen(true)}
              title="Ganti PIN"
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" />
            </button>

            

            {/* Logout */}
            <button
              onClick={logout}
              title="Keluar"
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">

        {/* ── Greeting + action row ── */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div>
            <p className="text-2xl font-extrabold leading-snug">
              Hawowww, {currentUser?.name}! 👋
            </p>
            <p className="text-sm text-muted-foreground">Here's your financial overview</p>
          </div>

          {/* Actions — di sini, bukan di header */}
          <div className="flex flex-row items-center justify-between gap-2 shrink-0">
            {/* New budget */}
            <NewBudgetModal onAdd={handleAddBudget} />
          </div>
        </div>

        {/* ── Summary cards ── */}
        {/* <SummaryCards {...summary} hide={hideNumbers} /> */}

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2 mb-5 mt-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari budget..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* User filter */}
          <div className="relative">
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className={`text-xs font-bold pl-3 pr-7 py-2 rounded-xl border-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                filterUser !== 'all'
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'border-foreground/10 hover:bg-secondary text-muted-foreground bg-transparent'
              }`}
            >
              <option value="all">Semua User</option>
              {USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Year filter */}
          <div className="relative">
            <select
              value={String(filterYear)}
              onChange={e => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`text-xs font-bold pl-3 pr-7 py-2 rounded-xl border-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
                filterYear !== 'all'
                  ? 'bg-primary/10 text-primary border-primary/40'
                  : 'border-foreground/10 hover:bg-secondary text-muted-foreground bg-transparent'
              }`}
            >
              <option value="all">Semua Tahun</option>
              {YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* ── Budget Plans ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold">Budget Plans</h2>
            <div>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full mr-2">
                {filteredBudgets.length} budget
              </span>
              {/* Hide/show toggle */}
              <button
                onClick={toggleHide}
                title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
                className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                {hideNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {filteredBudgets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              <p className="text-4xl mb-3">🗂️</p>
              <p className="text-sm font-semibold">Tidak ada budget ditemukan</p>
              {(search || filterUser !== 'all' || filterYear !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setFilterUser('all'); setFilterYear(CURRENT_YEAR); }}
                  className="mt-3 text-xs text-primary font-bold hover:underline"
                >
                  Reset filter
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBudgets.map((budget, i) => {
                  const bAny = budget as any;
                  const ownerUser = USERS.find(u => u.id === bAny.userId);
                  return (
                    <motion.div
                      key={budget.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <BudgetCard
                        budget={budget}
                        spent={getSpentForBudget(budget.id)}
                        allocation={getAllocationForBudget(budget.id)}
                        realization={getRealizationForBudget(budget.id)}
                        ownerName={ownerUser?.name}
                        hide={hideNumbers}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ── Change PIN Modal ── */}
      <ChangePinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />
    </div>
  );
};

export default Index;