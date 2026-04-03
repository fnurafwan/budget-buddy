import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Eye, EyeOff,
  Search, X, ChevronDown,
  KeyRound, Sun, Moon,
  Menu,
  Banknote,
  ChartNoAxesCombined,
  Server,
  GitCompareArrows,
} from 'lucide-react';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useUser, USERS } from '@/context/UserContext';
import { SummaryCards } from '@/components/SummaryCards';
import { BudgetCard } from '@/components/BudgetCard';
import { NewBudgetModal } from '@/components/NewBudgetModal';
import ChangePinModal from '@/components/ChangePinModal';
import { DashboardCard } from '@/components/LM/DashboardCard';
import { useNavigate } from 'react-router-dom';
import { Goals } from '@/types/goals';
import { addGoal, getGoals, getTransactions, Goal, Transaction } from "@/services/db";
import { fetchAntamPrices, fetchUbsPrices, GoldPriceItem } from "@/services/goldApi";
import { GoalsCard } from '@/components/LM/GoalsCard';
import { NewGoalModal } from '@/components/LM/NewGoalModal';

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

  const { currentUser, hideNumbers, theme, lmStatus, toggleHide, toggleTheme, toggleLM, logout } = useUser();

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [filterUser, setFilterUser] = useState<string>(currentUser?.id ?? 'all');
  const [filterYear, setFilterYear] = useState<number | 'all'>(CURRENT_YEAR);
  const [search, setSearch]         = useState('');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const navigate = useNavigate();

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

  // ── Goals state ──────────────────────────────────────────────────────────────
  const [goals, setGoals]             = useState<Goals[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [livePrices, setLivePrices]   = useState<{ antam: GoldPriceItem[]; ubs: GoldPriceItem[] }>({ antam: [], ubs: [] });
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (lmStatus === true) {
      async function load() {
        try {
          const [g, t, antam, ubs] = await Promise.all([
            getGoals(), getTransactions(), fetchAntamPrices(), fetchUbsPrices(),
          ]);
          setGoals(g);
          setTransactions(t);
          setLivePrices({ antam, ubs });
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }
      load();
    }
  }, [lmStatus]);

  // ── FIX: await addGoal, ambil id dari docRef, update state lokal langsung ──
  const handleAddGoal = async (data: { name: string; targetGram: number; icon: string; createdAt: string }) => {
    try {
      const docRef  = await addGoal(data as Goal);       // simpan ke Firestore
      const newGoal: Goals = { ...data, id: docRef.id, targetNominal: 0, deadlineDate: '' };
      setGoals(prev => [...prev, newGoal]);              // ← update list langsung
    } catch (err) {
      console.error('Gagal menambah goal:', err);
    }
  };

  const toggleMenu = () => setMenuOpen(prev => !prev);

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="border-b-2 border-foreground/10 bg-card sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            
            <img src={`${lmStatus === true ? '/icon.png' : '/logo.png'}`} alt="bujatbudget logo" className="w-10 h-10" />
            <div className='flex flex-col items-start gap-0'>
              <h1 className={`text-xl font-extrabold tracking-tight ${theme === 'dark' ? '' : 'text-primary'} ${lmStatus ? 'lm-mode' : ''}`}>
                {lmStatus === true ? 'LM Euy' : 'BujatBudget'} 
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={logout}
              title="Keluar"
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMenu}
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={`container max-w-5xl mx-auto px-4 py-3 ${menuOpen ? 'flex' : 'hidden'} justify-end items-center gap-3`}>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleLM}
              title={lmStatus ? 'Switch to BujatBudget' : 'Switch to LMEuy'}
              className="rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center"
            >
              <img
                src={lmStatus ? '/logo.png' : '/icon.png'}
                alt="bujatbudget logo"
                className="w-9 h-9 object-contain"
              />
            </button>
            <button
              onClick={() => setPinModalOpen(true)}
              title="Ganti PIN"
              className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6">

        {/* ══════════════════════════════════════════════════════════════════════
            MODE: BUDGET
        ══════════════════════════════════════════════════════════════════════ */}
        {lmStatus !== true ? (
          <>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div>
                <p className="text-2xl font-extrabold leading-snug">
                  Hawowww, {currentUser?.name}! 👋
                </p>
                <p className="text-sm text-muted-foreground">Here's your financial overview</p>
              </div>
              <div className="flex flex-row items-center justify-between gap-2 shrink-0">
                <NewBudgetModal onAdd={handleAddBudget} />
                <button
                  onClick={() => navigate('/compare')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-sm font-bold text-muted-foreground hover:text-foreground"
                >
                  <GitCompareArrows className="h-4 w-4" />
                  <span className="">Bandingkan</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5 mt-6">
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
                  {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>

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
                  {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              </div>

              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari budget..."
                  className="w-full pl-9 pr-8 py-1 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold">Budget Plans</h2>
                <div>
                  <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full mr-2">
                    {filteredBudgets.length} budget
                  </span>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
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
          </>

        ) : (

        /* ══════════════════════════════════════════════════════════════════════
            MODE: LOGAM MULIA
        ══════════════════════════════════════════════════════════════════════ */
          <>
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap lm-mode">
              <div>
                <p className="text-2xl font-extrabold leading-snug">
                  Hawowww, {currentUser?.name}! 👋
                </p>
                <p className="text-sm text-muted-foreground">Here's your save heaven overview</p>
              </div>
              <div className="flex flex-row items-center justify-between gap-2 shrink-0">
                <NewGoalModal onAdd={handleAddGoal} />
              </div>
            </div>

            <div className="mb-8 lm-mode">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold">Gold Bar Saving Plans</h2>
                <button
                  onClick={toggleHide}
                  title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
                  className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  {hideNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Dashboard summary card */}
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch mb-4">
                  <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: 0.04 }}>
                    <DashboardCard hide={hideNumbers} />
                  </motion.div>
                </div>
              </AnimatePresence>

              <div className='flex justify-end'>
                <button
                  className="btn-primary rounded-xl px-5 py-2.5 font-bold text-sm flex items-center gap-2 my-3"
                  onClick={() => navigate('/market')}
                >
                  <ChartNoAxesCombined className="h-4 w-4" /> Lihat Market
                </button>
              </div>

              {/* Goals list */}
              {goals.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">🪙</p>
                  <p className="text-sm font-semibold">Belum ada goal. Buat goal pertamamu!</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {goals.map((g, i) => {
                      const currentGram = transactions
                        .filter(t => t.goalId === g.id)
                        .reduce((a, b) => a + b.weight * b.qty, 0);
                      return (
                        <motion.div
                          key={g.id}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <GoalsCard goals={g as any} hide={hideNumbers} currentGram={currentGram} />
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )}
            </div>
          </>
        )}
      </main>

      <ChangePinModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />
    </div>
  );
};

export default Index;