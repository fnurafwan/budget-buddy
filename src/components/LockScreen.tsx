import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, LayoutDashboard } from 'lucide-react';
import { useUser, USERS } from '@/context/UserContext';

const NUMPAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['','0','⌫'],
];

// Default PIN jika belum pernah diganti
const DEFAULT_PINS: Record<string, string> = {
  wulan: '111111',
  debi:  '222222',
};

const getStoredPin = (userId: string): string =>
  localStorage.getItem(`bujat_pin_${userId}`) ?? DEFAULT_PINS[userId] ?? '';

const LockScreen = () => {
  const { login } = useUser();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  // Hint: cek 3 digit pertama terhadap PIN yang tersimpan di localStorage
  const hintUser = pin.length >= 3
    ? USERS.find(u => getStoredPin(u.id).startsWith(pin.slice(0, 3)))
    : undefined;

  const handleKey = (k: string) => {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    setError(false);

    if (next.length === 6) {
      const ok = login(next);
      if (!ok) {
        setShake(true);
        setError(true);
        setTimeout(() => {
          setPin('');
          setShake(false);
        }, 600);
      }
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleKey('⌫');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pin]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-10"
      >
        {/* <div className="p-2.5 rounded-xl bg-primary text-primary-foreground border-2 border-foreground/10">
          <LayoutDashboard className="h-6 w-6" />
        </div> */}
        <img src="/logo.png" alt="bujatbudget logo" className="w-10 h-10" />
        <h1 className="text-2xl font-extrabold tracking-tight text-primary">BujatBudget</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs"
      >
        {/* Title */}
        <p className="text-center text-sm font-semibold text-muted-foreground mb-1">
          Masukkan PIN
        </p>
        {hintUser ? (
          <p className="text-center text-base font-extrabold mb-6">
            Halo, {hintUser.name}! 👋
          </p>
        ) : (
          <p className="text-center text-base font-extrabold mb-6 text-foreground/30">
            ——
          </p>
        )}

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-4 mb-8"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i < pin.length ? [1, 1.25, 1] : 1,
                backgroundColor: error
                  ? 'hsl(var(--destructive))'
                  : i < pin.length
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--secondary))',
              }}
              transition={{ duration: 0.18 }}
              className="w-4 h-4 rounded-full border-2 border-foreground/10"
            />
          ))}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-xs font-bold text-destructive mb-4"
            >
              PIN salah. Coba lagi.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {NUMPAD.flat().map((k, i) => {
            if (k === '') return <div key={i} />;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleKey(k)}
                className={`h-16 rounded-2xl text-xl font-bold border-2 transition-colors
                  ${k === '⌫'
                    ? 'border-foreground/10 text-muted-foreground hover:bg-secondary hover:text-destructive'
                    : 'border-foreground/10 bg-card hover:bg-secondary'
                  }`}
              >
                {k === '⌫' ? <Delete className="h-5 w-5 mx-auto" /> : k}
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-50">
          by samodoksync.com
        </p>
      </motion.div>
    </div>
  );
};

export default LockScreen;