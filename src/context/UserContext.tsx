import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface AppUser {
  id: string;
  name: string;
}

// PIN default — bisa diganti user, disimpan di localStorage per userId
export const DEFAULT_PINS: Record<string, string> = {
  wulan: '111111',
  debi:  '222222',
};

export const USERS: AppUser[] = [
  { id: 'wulan', name: 'Wulan' },
  { id: 'debi',  name: 'Debi'  },
];

export const getUsersConcated = () =>
  USERS.map(u => u.name).join(' & ');

const PIN_STORAGE_KEY = (id: string) => `bujat_pin_${id}`;
const SESSION_KEY = 'bujat_user_id';
const HIDE_KEY    = 'bujat_hide_numbers';
const THEME_KEY   = 'bujat_theme';
const LM_KEY      = 'bujat_lm';

type ThemeMode = 'light' | 'dark';

const getPin = (userId: string): string =>
  localStorage.getItem(PIN_STORAGE_KEY(userId)) ?? DEFAULT_PINS[userId] ?? '';

// ── Context ────────────────────────────────────────────────────────────────────
interface UserContextValue {
  currentUser: AppUser | null;
  hideNumbers: boolean;
  theme: ThemeMode;
  lmStatus: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  toggleHide: () => void;
  toggleTheme: () => void;
  changePin: (userId: string, oldPin: string, newPin: string) => boolean;
  toggleLM: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const savedId = sessionStorage.getItem(SESSION_KEY);
    return USERS.find(u => u.id === savedId) ?? null;
  });

  const [hideNumbers, setHideNumbers] = useState(() =>
    localStorage.getItem(HIDE_KEY) === 'true'
  );
  
  
  const [lmStatus, setLMStatus] = useState(() =>
    localStorage.getItem(LM_KEY) === 'true'
  );

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const login = useCallback((pin: string): boolean => {
    const user = USERS.find(u => getPin(u.id) === pin);
    if (!user) return false;
    setCurrentUser(user);
    sessionStorage.setItem(SESSION_KEY, user.id);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const toggleHide = useCallback(() => {
    setHideNumbers(prev => {
      const next = !prev;
      localStorage.setItem(HIDE_KEY, String(next));
      return next;
    });
  }, []);
  
  const toggleLM = useCallback(() => {
    setLMStatus(prev => {
      const next = !prev;
      localStorage.setItem(LM_KEY, String(next));
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // returns false if oldPin mismatch
  const changePin = useCallback((userId: string, oldPin: string, newPin: string): boolean => {
    if (getPin(userId) !== oldPin) return false;
    localStorage.setItem(PIN_STORAGE_KEY(userId), newPin);
    return true;
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, hideNumbers, theme, lmStatus, login, logout, toggleHide, toggleTheme, changePin, toggleLM }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};