import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Loader2, CheckCircle2, Receipt, Sparkles,
  AlertCircle, RotateCcw, ChevronRight, Square, CheckSquare,
  PackageCheck, Trash2, Pencil,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { ExpenseType } from '@/types/budget';
import CurrencyInput from '@/components/CurrencyInput';
import { fmt } from '@/pages/BudgetDetail/flagUtils';
import PersonCombobox from '@/pages/BudgetDetail/PersonCombobox';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ScannedExpense {
  amount: number;
  description: string;
  date: string;
  type: ExpenseType;
  tagName: string;
}

interface LineItem {
  id: string;           // local uuid
  description: string;
  amount: number;       // negatif jika diskon
  tagName: string;
  isDiscount: boolean;
  selected: boolean;
  editing: boolean;
}

interface ReceiptScannerProps {
  isThr: boolean;
  options: { id: string; name: string }[];
  onConfirm: (items: ScannedExpense[]) => void; // kirim array, bisa >1
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const today = () => new Date().toISOString().split('T')[0];
const uid    = () => Math.random().toString(36).slice(2, 9);

// ── Prompt ─────────────────────────────────────────────────────────────────────
const buildPrompt = (isThr: boolean) => `
Kamu adalah asisten OCR untuk aplikasi budgeting Indonesia.
Analisa struk/invoice/nota ini dan ekstrak SEMUA item termasuk diskon dalam format JSON ONLY.

Kembalikan JSON dengan struktur:
{
  "merchant": "<nama toko/merchant, maks 60 karakter>",
  "date": "<tanggal transaksi format YYYY-MM-DD, jika tidak ada gunakan: ${today()}>",
  "items": [
    {
      "description": "<nama item/produk/layanan, maks 60 karakter>",
      "amount": <integer POSITIF untuk item normal, integer NEGATIF untuk diskon/potongan>,
      "isDiscount": <true jika ini baris diskon/potongan/promo, false jika item biasa>,
      ${isThr
        ? '"personName": "<nama orang terkait item ini, kosong string jika tidak ada>"'
        : '"categoryExpenseName": "<kategori: Makan, Minuman, Rokok, Kebersihan, Transport, Belanja, Kesehatan, dll>"'
      }
    }
  ],
  "subtotal": <total sebelum diskon, integer>,
  "totalDiscount": <total semua diskon digabung, integer POSITIF>,
  "total": <grand total setelah diskon, integer>,
  "confidence": <0-100>,
  "notes": "<catatan jika ada, bisa kosong>"
}

Rules:
- Ekstrak SETIAP item produk sebagai baris terpisah
- Baris diskon (Disc., Potongan, Promo, Cashback, dll) ekstrak sebagai item TERPISAH dengan amount NEGATIF dan isDiscount=true
- Pasangkan diskon dengan item di atasnya jika jelas relasinya, atau buat sebagai "Total Diskon" jika diskon global
- Jika struk hanya ada total tanpa rincian, buat 1 item dengan description=merchant dan amount=total
- Semua amount dan total HARUS integer (tanpa desimal, tanpa titik/koma)
- Jika struk tidak terbaca, set confidence=0 dan items=[]
- Respond ONLY dengan JSON valid, TANPA markdown, TANPA penjelasan
`.trim();

// ── Main Component ─────────────────────────────────────────────────────────────
type Step = 'upload' | 'scanning' | 'review' | 'error';

const ReceiptScanner = ({ isThr, options, onConfirm, onClose }: ReceiptScannerProps) => {
  const [step, setStep]               = useState<Step>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [confidence, setConfidence]   = useState(0);
  const [isDragging, setIsDragging]   = useState(false);
  const [merchant, setMerchant]       = useState('');
  const [receiptDate, setReceiptDate] = useState(today());
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [notes, setNotes]             = useState('');
  const [items, setItems]             = useState<LineItem[]>([]);
  const [expType, setExpType]         = useState<ExpenseType>('realization');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef    = useRef<HTMLInputElement>(null);

  // ── Process image ────────────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, HEIC, dll)');
      setStep('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 10MB');
      setStep('error');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setStep('scanning');

    try {
      const base64  = await toBase64(file);
      const mediaType = file.type || 'image/jpeg';

      //   const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    const apiKey = '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';
      if (!apiKey) {
        setErrorMsg('API key tidak ditemukan. Tambahkan VITE_GROQ_API_KEY di file .env');
        setStep('error');
        return;
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          max_tokens: 2000,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
              { type: 'text', text: buildPrompt(isThr) },
            ],
          }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Groq API error');

      const rawText  = data.choices?.[0]?.message?.content?.trim() ?? '';
      const jsonText = rawText.replace(/```json|```/g, '').trim();
      const parsed   = JSON.parse(jsonText);

      if (parsed.confidence < 10 || !parsed.items?.length) {
        setErrorMsg('Gambar tidak dapat dikenali sebagai struk. Pastikan foto cukup jelas.');
        setStep('error');
        return;
      }

      setMerchant(parsed.merchant || '');
      setReceiptDate(parsed.date || today());
      setReceiptTotal(parsed.total || 0);
      setNotes(parsed.notes || '');
      setConfidence(parsed.confidence ?? 0);

      // Build LineItem list — item biasa selected, diskon unselected by default
      const lineItems: LineItem[] = (parsed.items as any[]).map(item => ({
        id:          uid(),
        description: item.description || '',
        amount:      item.amount || 0,
        tagName:     isThr ? (item.personName || '') : (item.categoryExpenseName || ''),
        isDiscount:  item.isDiscount === true || (item.amount || 0) < 0,
        selected:    !(item.isDiscount === true || (item.amount || 0) < 0),
        editing:     false,
      }));
      setItems(lineItems);
      setStep('review');

    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Gagal memproses: ${err.message || 'Periksa koneksi dan coba lagi.'}`);
      setStep('error');
    }
  }, [isThr]);

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const toggleSelect  = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));

  const toggleAll = () => {
    const allSelected = items.every(i => i.selected);
    setItems(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  const toggleEdit = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, editing: !i.editing } : i));

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const removeItem = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id));

  const addBlankItem = () =>
    setItems(prev => [...prev, { id: uid(), description: '', amount: 0, tagName: '', isDiscount: false, selected: true, editing: true }]);

  // ── Confirm ──────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const selected = items.filter(i => i.selected && i.description && i.amount > 0);
    if (!selected.length) return;
    onConfirm(selected.map(i => ({
      amount:      i.amount,
      description: i.description,
      date:        receiptDate,
      type:        expType,
      tagName:     i.tagName,
    })));
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep('upload');
    setImagePreview(null);
    setErrorMsg('');
    setItems([]);
    setMerchant('');
    setReceiptDate(today());
    setReceiptTotal(0);
    setNotes('');
    setConfidence(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraRef.current)    cameraRef.current.value = '';
  };

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedItems    = items.filter(i => i.selected);
  const selectedTotal    = selectedItems.reduce((s, i) => s + i.amount, 0);
  const allSelected      = items.length > 0 && items.every(i => i.selected);
  const discountItems    = items.filter(i => i.isDiscount);
  const selectedDiscount = selectedItems.filter(i => i.isDiscount).reduce((s, i) => s + i.amount, 0); // negatif
  const hasDiscount      = discountItems.length > 0;

  const confidenceColor = confidence >= 80 ? 'text-emerald-500' : confidence >= 50 ? 'text-amber-500' : 'text-destructive';
  const confidenceBg    = confidence >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : confidence >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-destructive/10 border-destructive/30';

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ── UPLOAD ── */}
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-foreground/20 hover:border-primary/50 hover:bg-secondary/50'}`}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                  <Receipt className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">Drop struk/invoice di sini</p>
                  <p className="text-xs text-muted-foreground mt-0.5">atau klik untuk pilih file</p>
                </div>
                <p className="text-[10px] text-muted-foreground/60 font-medium">JPG · PNG · HEIC · WEBP · maks 10MB</p>
              </div>
            </div>

            <button onClick={() => cameraRef.current?.click()} className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-sm font-bold text-muted-foreground hover:text-foreground">
              <Camera className="h-4 w-4" /> Foto Langsung dengan Kamera
            </button>
            <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-60">
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI akan membaca semua item dari struk secara otomatis
            </p>
          </motion.div>
        )}

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 py-6">
            {imagePreview && (
              <div className="relative w-40 h-48 rounded-xl overflow-hidden border-2 border-foreground/10 shadow-lg">
                <img src={imagePreview} alt="Struk" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
                <motion.div className="absolute left-0 right-0 h-0.5 bg-primary/80" animate={{ top: ['10%', '90%', '10%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm font-bold">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Membaca semua item dari struk...
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">Menganalisa setiap item, harga, dan detail transaksi</p>
          </motion.div>
        )}

        {/* ── REVIEW ── */}
        {step === 'review' && (
          <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Header info */}
            <div className="flex gap-3 items-start">
              {imagePreview && (
                <div className="shrink-0 w-14 h-18 rounded-xl overflow-hidden border-2 border-foreground/10 shadow" style={{ height: '4.5rem' }}>
                  <img src={imagePreview} alt="Struk" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold truncate">{merchant || 'Struk berhasil dibaca'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${confidenceBg} ${confidenceColor}`}>
                    <Sparkles className="h-3 w-3" /> {confidence}%
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-foreground/10 bg-secondary text-xs font-bold text-muted-foreground">
                    {items.length} item
                  </div>
                  {receiptTotal > 0 && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-foreground/10 bg-secondary text-xs font-bold text-muted-foreground">
                      Total struk: {fmt(receiptTotal)}
                    </div>
                  )}
                </div>
                {notes && <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{notes}</p>}
              </div>
            </div>

            {/* Tanggal + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Tanggal</Label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={e => setReceiptDate(e.target.value)}
                  className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div>
                <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Type</Label>
                <div className="flex gap-1.5 mt-1">
                  <button type="button" onClick={() => setExpType('allocation')} className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold border-2 transition-colors ${expType === 'allocation' ? 'bg-primary text-primary-foreground border-primary' : 'border-foreground/10 hover:bg-secondary'}`}>Alloc</button>
                  <button type="button" onClick={() => setExpType('realization')} className={`flex-1 rounded-xl px-2 py-2 text-xs font-bold border-2 transition-colors ${expType === 'realization' ? 'bg-expense text-white border-expense' : 'border-foreground/10 hover:bg-secondary'}`}>Real</button>
                </div>
              </div>
            </div>

            {/* Item list */}
            <div>
              {/* List header */}
              <div className="flex items-center justify-between mb-2">
                <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                  {allSelected
                    ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    : <Square className="h-3.5 w-3.5" />
                  }
                  {allSelected ? 'Batal pilih semua' : 'Pilih semua'}
                </button>
                <button onClick={addBlankItem} className="text-xs font-bold text-primary hover:underline">+ Tambah item</button>
              </div>

              {/* Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8, height: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`rounded-xl border-2 transition-colors ${
                        item.isDiscount
                          ? item.selected ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-foreground/10 bg-secondary/30 opacity-50'
                          : item.selected ? 'border-primary/30 bg-primary/5' : 'border-foreground/10 bg-secondary/30 opacity-60'
                      }`}
                    >
                      {item.editing ? (
                        /* ── EDIT ROW ── */
                        <div className="p-3 space-y-2">
                          <Input
                            value={item.description}
                            onChange={e => updateItem(item.id, { description: e.target.value })}
                            placeholder="Nama item"
                            className="rounded-lg border-2 border-foreground/10 text-sm"
                            autoFocus
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">Rp</span>
                            <CurrencyInput
                              value={item.amount === 0 ? '' : Math.abs(item.amount)}
                              onChange={v => updateItem(item.id, { amount: v === '' ? 0 : (item.isDiscount ? -(v as number) : v as number) })}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border-2 border-foreground/10 bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <PersonCombobox
                            value={item.tagName}
                            onChange={v => updateItem(item.id, { tagName: v })}
                            options={options}
                            isThr={isThr}
                          />
                          <button
                            onClick={() => toggleEdit(item.id)}
                            className="w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Selesai edit
                          </button>
                        </div>
                      ) : (
                        /* ── DISPLAY ROW ── */
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <button onClick={() => toggleSelect(item.id)} className="shrink-0">
                            {item.selected
                              ? <CheckSquare className={`h-4 w-4 ${item.isDiscount ? 'text-emerald-500' : 'text-primary'}`} />
                              : <Square className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {item.isDiscount && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 shrink-0">
                                  diskon
                                </span>
                              )}
                              <p className="text-sm font-semibold truncate">{item.description || <span className="text-muted-foreground italic">tanpa nama</span>}</p>
                            </div>
                            {item.tagName && (
                              <p className="text-[11px] text-muted-foreground truncate">{item.tagName}</p>
                            )}
                          </div>
                          <span className={`text-sm font-extrabold shrink-0 ${item.isDiscount ? 'text-emerald-600' : 'text-expense'}`}>
                            {item.isDiscount && item.amount < 0 ? '-' : ''}{fmt(Math.abs(item.amount))}
                          </span>
                          <div className="flex gap-0.5 shrink-0">
                            <button onClick={() => toggleEdit(item.id)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer summary + confirm */}
            <div className="border-t border-foreground/10 pt-3">
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">
                    {selectedItems.filter(i => !i.isDiscount).length} item dipilih
                    {hasDiscount && discountItems.some(i => i.selected) && (
                      <span className="text-emerald-600 ml-1">
                        + {discountItems.filter(i => i.selected).length} diskon
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-extrabold">{fmt(selectedTotal)}</span>
                </div>
                {hasDiscount && selectedDiscount < 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 font-semibold">Hemat (diskon dipilih)</span>
                    <span className="text-[11px] text-emerald-600 font-extrabold">-{fmt(Math.abs(selectedDiscount))}</span>
                  </div>
                )}
                {hasDiscount && !discountItems.some(i => i.selected) && (
                  <p className="text-[10px] text-amber-500 font-semibold">
                    ⚠ Ada {discountItems.length} baris diskon tidak dipilih — centang untuk mencatat potongan
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0}
                  className="flex-1 btn-primary rounded-xl py-2.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PackageCheck className="h-4 w-4" />
                  Simpan {selectedItems.length} Expense
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button onClick={reset} className="p-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground" title="Scan ulang">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

          </motion.div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="font-bold text-sm mb-1">Gagal memproses</p>
              <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">{errorMsg}</p>
            </div>
            <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors font-bold text-sm">
              <RotateCcw className="h-4 w-4" /> Coba Lagi
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default ReceiptScanner;