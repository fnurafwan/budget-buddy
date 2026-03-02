import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
  value: number | '';                   // angka mentah dari parent
  onChange: (val: number | '') => void; // kirim angka mentah ke parent
  placeholder?: string;
  className?: string;
  id?: string;
}

// Format angka ke "1.250.000" (titik sebagai separator ribuan, tanpa Rp)
const formatDisplay = (num: number): string =>
  num.toLocaleString('id-ID');

// Hapus semua non-digit dari string
const stripNonDigit = (s: string): string => s.replace(/\D/g, '');

const CurrencyInput = ({
  value,
  onChange,
  placeholder = '0',
  className = '',
  id,
}: CurrencyInputProps) => {
  // display = string yang ditampilkan di input
  const [display, setDisplay] = useState(
    value !== '' && value > 0 ? formatDisplay(value) : ''
  );
  const isComposing = useRef(false);

  // Sync display ketika value dari luar berubah (misal reset form)
  useEffect(() => {
    if (value === '' || value === 0) {
      setDisplay('');
    } else {
      setDisplay(formatDisplay(value as number));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isComposing.current) return;
    const raw = stripNonDigit(e.target.value);
    if (raw === '') {
      setDisplay('');
      onChange('');
      return;
    }
    const num = parseInt(raw, 10);
    setDisplay(formatDisplay(num));
    onChange(num);
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onCompositionStart={() => { isComposing.current = true; }}
      onCompositionEnd={(e) => {
        isComposing.current = false;
        handleChange(e as any);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default CurrencyInput;