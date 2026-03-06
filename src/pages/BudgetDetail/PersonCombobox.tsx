import { useState, useMemo, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, ChevronDown, Plus, ChartBarStacked } from 'lucide-react';

export interface PersonComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  isThr: boolean;
}

const PersonCombobox = ({ value, onChange, options, isThr }: PersonComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholder = isThr ? 'Ketik nama atau pilih...' : 'Ketik kategori atau pilih...';
  const addLabel = isThr ? 'nama' : 'kategori';

  // Sync query when value changes externally (form reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputWrapRef.current && !inputWrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    query.trim()
      ? options.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      : options,
    [query, options]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const showCreateOption = query.trim() &&
    !options.some(p => p.name.toLowerCase() === query.trim().toLowerCase());

  return (
    // `relative` here is the anchor — the dropdown positions itself against this div
    <div ref={inputWrapRef} className="relative">
      {/* Input */}
      <div className="relative">
        {isThr
          ? <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          : <ChartBarStacked className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown — simple absolute, always below input, no JS repositioning */}
      <AnimatePresence>
        {open && (filtered.length > 0 || showCreateOption) && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border-2 border-foreground/10 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
          >
            {filtered.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(p.name); }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-2 ${
                    query === p.name ? 'bg-primary/10 font-semibold text-primary' : ''
                  }`}
                >
                  {isThr
                    ? <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                    : <ChartBarStacked className="h-3 w-3 shrink-0 text-muted-foreground" />
                  }
                  {p.name}
                </button>
              </li>
            ))}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(query.trim()); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center gap-2 text-primary font-semibold border-t border-foreground/10"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  Tambah {addLabel} "{query.trim()}"
                </button>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PersonCombobox;