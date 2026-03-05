import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const placeholder = isThr ? 'Ketik nama atau pilih...' : 'Ketik kategori atau pilih...';
  const addLabel    = isThr ? 'nama' : 'kategori';

  // Sync query when value changes externally (form reset)
  useEffect(() => { setQuery(value); }, [value]);

  // ── Reposition ───────────────────────────────────────────────────────────────
  // Gunakan visualViewport agar akurat saat keyboard mobile muncul
  const reposition = useCallback(() => {
    const el = inputWrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    // visualViewport lebih akurat di mobile (shrink saat keyboard naik)
    const vp          = window.visualViewport;
    const vpHeight    = vp ? vp.height    : window.innerHeight;
    const vpOffsetTop = vp ? vp.offsetTop : 0;
    const vpOffsetLeft= vp ? vp.offsetLeft: 0;

    // Konversi rect ke koordinat visual viewport
    const top    = rect.top    - vpOffsetTop;
    const bottom = rect.bottom - vpOffsetTop;
    const left   = rect.left   - vpOffsetLeft;

    const dropH      = 208; // max-h-52 ≈ 208px
    const gap        = 6;
    const spaceBelow = vpHeight - bottom;

    if (spaceBelow >= dropH + gap || spaceBelow >= top) {
      setDropdownStyle({
        position: 'fixed',
        top:   bottom + gap,
        left,
        width: rect.width,
        zIndex: 9999,
      });
    } else {
      // Tidak cukup ruang di bawah — tampilkan di atas
      setDropdownStyle({
        position: 'fixed',
        bottom:   vpHeight - top + gap,
        left,
        width:    rect.width,
        zIndex:   9999,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    reposition();

    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);

    // visualViewport events — trigger saat keyboard HP muncul/hilang
    const vp = window.visualViewport;
    if (vp) {
      vp.addEventListener('resize', reposition);
      vp.addEventListener('scroll', reposition);
    }

    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      if (vp) {
        vp.removeEventListener('resize', reposition);
        vp.removeEventListener('scroll', reposition);
      }
    };
  }, [open, reposition]);

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
          onFocus={() => {
            setOpen(true);
            // Delay reposition — beri waktu keyboard HP naik dulu (~300ms)
            setTimeout(reposition, 300);
          }}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-2 rounded-xl border-2 border-foreground/10 bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            const next = !open;
            setOpen(next);
            if (next) {
              inputRef.current?.focus();
              setTimeout(reposition, 300);
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown — fixed positioning agar tidak terpotong overflow parent */}
      <AnimatePresence>
        {open && (filtered.length > 0 || showCreateOption) && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={dropdownStyle}
            className="bg-card border-2 border-foreground/10 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
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