import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Delete, Check } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const NUMPAD = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['','0','⌫'],
];

type Step = 'old' | 'new' | 'confirm';

interface Props {
  open: boolean;
  onClose: () => void;
}

const LABELS: Record<Step, string> = {
  old:     'Masukkan PIN lama',
  new:     'Masukkan PIN baru',
  confirm: 'Konfirmasi PIN baru',
};

const ChangePinModal = ({ open, onClose }: Props) => {
  const { currentUser, changePin } = useUser();
  const [step, setStep]       = useState<Step>('old');
  const [pin, setPin]         = useState('');
  const [newPinTemp, setNewPinTemp] = useState('');
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setStep('old');
    setPin('');
    setNewPinTemp('');
    setError('');
    setShake(false);
    setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => { setPin(''); setShake(false); }, 600);
  };

  const handleKey = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    setError('');

    if (next.length < 6) return;

    if (step === 'old') {
      // Verifikasi PIN lama dengan changePin dummy (tidak simpan)
      // Kita gunakan cara langsung: cek lewat changePin dengan newPin sama
      // Tapi lebih clean: expose helper di context — atau kita cek manual lewat localStorage
      const pinKey = `bujat_pin_${currentUser?.id}`;
      const stored = localStorage.getItem(pinKey) ?? (currentUser?.id === 'wulan' ? '111111' : '222222');
      if (next !== stored) {
        triggerError('PIN lama salah');
        return;
      }
      setNewPinTemp('');
      setStep('new');
      setPin('');
    } else if (step === 'new') {
      setNewPinTemp(next);
      setStep('confirm');
      setPin('');
    } else if (step === 'confirm') {
      if (next !== newPinTemp) {
        triggerError('PIN tidak cocok, ulangi dari PIN baru');
        setStep('new');
        setNewPinTemp('');
        return;
      }
      // Simpan
      if (currentUser) {
        changePin(currentUser.id, localStorage.getItem(`bujat_pin_${currentUser.id}`) ?? (currentUser.id === 'wulan' ? '111111' : '222222'), next);
      }
      setSuccess(true);
      setTimeout(() => { handleClose(); }, 1500);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="bg-card border-2 border-foreground/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span className="font-extrabold text-sm">Ganti PIN</span>
            </div>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6 gap-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="font-extrabold text-emerald-500">PIN berhasil diganti!</p>
            </motion.div>
          ) : (
            <>
              {/* Step indicator */}
              <div className="flex gap-1.5 justify-center mb-4">
                {(['old','new','confirm'] as Step[]).map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step ? 'w-6 bg-primary' : i < (['old','new','confirm'] as Step[]).indexOf(step) ? 'w-3 bg-primary/40' : 'w-3 bg-secondary'
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-sm font-semibold text-muted-foreground mb-5">
                {LABELS[step]}
              </p>

              {/* PIN dots */}
              <motion.div
                animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="flex justify-center gap-3 mb-3"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: i < pin.length ? [1, 1.3, 1] : 1,
                      backgroundColor: error
                        ? 'hsl(var(--destructive))'
                        : i < pin.length
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--secondary))',
                    }}
                    transition={{ duration: 0.15 }}
                    className="w-3.5 h-3.5 rounded-full border-2 border-foreground/10"
                  />
                ))}
              </motion.div>

              {/* Error */}
              <div className="h-5 mb-4">
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-xs font-bold text-destructive"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2">
                {NUMPAD.flat().map((k, i) => {
                  if (k === '') return <div key={i} />;
                  return (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleKey(k)}
                      className={`h-13 py-3 rounded-xl text-lg font-bold border-2 transition-colors ${
                        k === '⌫'
                          ? 'border-foreground/10 text-muted-foreground hover:bg-secondary hover:text-destructive'
                          : 'border-foreground/10 bg-background hover:bg-secondary'
                      }`}
                    >
                      {k === '⌫' ? <Delete className="h-4 w-4 mx-auto" /> : k}
                    </motion.button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChangePinModal;