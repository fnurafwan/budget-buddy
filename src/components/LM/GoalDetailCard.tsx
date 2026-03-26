import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Loader2, Plus, Trash2, X, Check, LayoutList, EyeOff, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from "react";
import { fetchAntamPrices, fetchUbsPrices, GoldPriceItem } from "@/services/goldApi";
import { differenceInDays } from "date-fns";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getGoals, getTransactions, addTransaction, updateTransaction, deleteTransaction, Goal, Transaction } from "@/services/db";
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
   .replace(/\u00A0/, ' ');

function calcTax(gross: number, hasNPWP: boolean) {
  if (gross > 10_000_000) return Math.round(gross * (hasNPWP ? 0.015 : 0.03));
  return 0;
}

const ANTAM_WEIGHTS = [0.5, 1, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000];
const UBS_WEIGHTS   = [0.5, 1, 2, 3, 5, 10, 25, 50, 100];

// ─── props ───────────────────────────────────────────────────────────────────
interface GoalDetailCardProps {
  hide?: boolean;
}

// ─── component ───────────────────────────────────────────────────────────────
export function GoalDetailCard({ hide }: GoalDetailCardProps) {
  const { id } = useParams<{ id: string }>();

  const [goal, setGoal]             = useState<Goal | null>(null);
  const [transactions, setTxs]      = useState<Transaction[]>([]);
  const [livePrices, setLivePrices] = useState<{ antam: GoldPriceItem[]; ubs: GoldPriceItem[] }>({ antam: [], ubs: [] });
  const [loading, setLoading]       = useState(true);

  // ── form state ──────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);

  const [formDate,  setFormDate]  = useState(new Date().toISOString().split('T')[0]);
  const [formBrand, setFormBrand] = useState<'ANTAM' | 'UBS'>('ANTAM');
  const [formWeight, setFormWeight] = useState('1');
  const [formPrice,  setFormPrice]  = useState('');
  const [formQty,    setFormQty]    = useState('1');

  const masked = '••••••';
  const { hideNumbers, toggleHide } = useUser();

  // ── load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      const [allGoals, allTxs, antam, ubs] = await Promise.all([
        getGoals(), getTransactions(id), fetchAntamPrices(), fetchUbsPrices(),
      ]);
      setGoal(allGoals.find(g => g.id === id) || null);
      setTxs(allTxs);
      setLivePrices({ antam, ubs });
      setLoading(false);
    }
    loadData();
  }, [id]);

  // ── weight options driven by brand ───────────────────────────────────────
  const weightOptions = formBrand === 'ANTAM' ? ANTAM_WEIGHTS : UBS_WEIGHTS;

  // auto-fill price from live when brand/weight changes
  useEffect(() => {
    const w = parseFloat(formWeight);
    if (isNaN(w)) return;
    const prices = formBrand === 'ANTAM' ? livePrices.antam : livePrices.ubs;
    const match = prices.find(p => parseFloat(p.weight) === w || p.weight.replace(/\s/g,'').replace(/gram/i,'').replace(/gr/i,'') === String(w));
    if (match) {
      setFormPrice(new Intl.NumberFormat('id-ID').format(match.buyPrice));
    }
  }, [formBrand, formWeight, livePrices]);

  // ── price input handler ───────────────────────────────────────────────────
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) { setFormPrice(''); return; }
    setFormPrice(new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)));
  };

  // ── open add ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormBrand('ANTAM');
    setFormWeight('1');
    setFormQty('1');
    setFormPrice('');
    setFormOpen(true);
  };

  // ── open edit ────────────────────────────────────────────────────────────
  const openEdit = (tx: Transaction) => {
    setEditId(tx.id!);
    setFormDate(tx.date);
    setFormBrand(tx.brand);
    setFormWeight(tx.weight.toString());
    setFormPrice(new Intl.NumberFormat('id-ID').format(tx.pricePerPiece));
    setFormQty(tx.qty.toString());
    setFormOpen(true);
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const txData: Transaction = {
      goalId: id!,
      date: formDate,
      brand: formBrand,
      weight: parseFloat(formWeight),
      pricePerPiece: parseInt(formPrice.replace(/\D/g, ''), 10) || 0,
      qty: parseInt(formQty) || 1,
      buybackPlace: formBrand === 'ANTAM' ? 'Butik Antam' : 'UBS',
      hasNPWP: true,
    };

    if (editId) {
      await updateTransaction(editId, txData);
      setTxs(prev =>
        prev.map(t => t.id === editId ? { ...txData, id: editId } : t)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    } else {
      const newId = await addTransaction(txData);
      setTxs(prev =>
        [...prev, { ...txData, id: newId }]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    }
    setFormOpen(false);
  };

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (txId: string) => {
    if (!window.confirm('Hapus transaksi ini? Data tidak dapat dikembalikan.')) return;
    await deleteTransaction(txId);
    setTxs(prev => prev.filter(t => t.id !== txId));
  };

  // ── derived totals ────────────────────────────────────────────────────────
  const { totalGram, totalPieces, totalSpending, totalAsset, tableRows } = useMemo(() => {
    let totalGram = 0, totalPieces = 0, totalSpending = 0, totalAsset = 0;

    const tableRows = transactions.map(t => {
      const totalModal = t.pricePerPiece * t.qty;
      totalGram     += t.weight * t.qty;
      totalPieces   += t.qty;
      totalSpending += totalModal;

      const prices = t.brand === 'ANTAM' ? livePrices.antam : livePrices.ubs;
      const p = prices.find(x => parseFloat(x.weight) === t.weight);
      const bbPricePerGram = (p?.buybackPrice || t.pricePerPiece) / t.weight;
      const grossBb  = bbPricePerGram * t.weight * t.qty;
      const tax      = calcTax(grossBb, t.hasNPWP);
      const netBb    = grossBb - tax;
      totalAsset    += netBb;

      const spread   = netBb - totalModal;
      const isProfit = spread >= 0;

      return { t, totalModal, netBb, spread, isProfit };
    });

    return { totalGram, totalPieces, totalSpending, totalAsset, tableRows };
  }, [transactions, livePrices]);

  const totalProfit = totalAsset - totalSpending;
  const profitPct   = totalSpending > 0 ? (totalProfit / totalSpending) * 100 : 0;
  const pct         = goal ? Math.min((totalGram / goal.targetGram) * 100, 100) : 0;
  const currentGram = transactions.filter(t => t.goalId === goal?.id).reduce((a, b) => a + b.weight * b.qty, 0);

  let durationLabel = '-';
  if (transactions.length > 0) {
    const days = differenceInDays(new Date(), new Date(transactions[0].date));
    if (days > 365) durationLabel = `${Math.floor(days / 365)} thn ${Math.floor((days % 365) / 30)} bln`;
    else if (days > 30) durationLabel = `${Math.floor(days / 30)} bln`;
    else durationLabel = `${days} hari`;
  }

  // ── early returns ────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>;
  if (!goal)   return <div className="p-8">Goal tidak ditemukan</div>;

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Summary Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-bordered rounded-2xl p-6 mb-6"
      >
        <div className='flex flex-row justify-between items-start'>
          <p className="text-2xl font-extrabold mb-5">{goal.name}</p>
          <button
              onClick={toggleHide}
              title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
              className="shrink-0 p-2 rounded-xl border-2 border-foreground/10 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground mt-0.5"
            >
              {hideNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
          <Stat label="Total Modal Investasi" value={hideNumbers ? `Rp${masked}` : fmt(totalSpending)} className="text-income" />
          <Stat label="Total Aset (Live)"     value={hideNumbers ? `Rp${masked}` : fmt(totalAsset)}    align="right" />
          <Stat
            label="Total Profit"
            value={hideNumbers ? `Rp${masked}` : (totalProfit >= 0 ? '+' : '') + fmt(totalProfit)}
            sub={hideNumbers ? masked : (totalProfit >= 0 ? '▲' : '▼') + Math.abs(profitPct).toFixed(2) + '%'}
            className={totalProfit >= 0 ? 'text-success' : 'text-destructive'}
          />
          <Stat label="Durasi Investasi" value={hideNumbers ? masked : durationLabel} align="right" />
          <Stat label="Total Berat"  value={hideNumbers ? masked : `${totalGram.toFixed(2)} gr`} />
          <Stat label="Total Keping" value={hideNumbers ? masked : `${totalPieces} pcs`}          align="right" />
        </div>

        {/* progress bar */}
        <div>
          <div className="flex justify-between text-[10px] font-semibold mb-1">
            <span className="text-primary">Progress Goal</span>
            <span className="text-primary">
              {hideNumbers ? `${masked}` : `${currentGram.toFixed(2)}g / ${goal.targetGram}g`}
            </span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden border border-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-right text-[10px] text-muted-foreground font-semibold mt-1">{pct.toFixed(1)}%</p>
        </div>
      </motion.div>

      {/* ── Transaksi Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        {/* header row */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-extrabold">Riwayat Pembelian</h2>
            <span className="text-xs font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-center">
              {transactions.length} transaksi
            </span>
          </div>
          <button onClick={openAdd} className="btn-primary rounded-xl px-4 py-2 font-bold text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </div>

        {/* ── Form Tambah / Edit ── */}
        <AnimatePresence>
          {formOpen && (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="card-accent rounded-2xl p-5 mb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm">
                    {editId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                  </span>
                  <button type="button" onClick={() => setFormOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Row 1: Tanggal + Merk */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-semibold text-sm">Tgl Transaksi</Label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      required
                      className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold text-sm">Merk</Label>
                    <div className="flex gap-2 mt-1">
                      {(['ANTAM', 'UBS'] as const).map(b => (
                        <button
                          key={b} type="button"
                          onClick={() => { setFormBrand(b); setFormWeight(b === 'ANTAM' ? '1' : '1'); }}
                          className={`flex-1 rounded-xl px-3 py-2 text-sm font-bold border-2 transition-colors ${
                            formBrand === b
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-foreground/10 hover:bg-secondary'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Berat + Jumlah Keping */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-semibold text-sm">Berat</Label>
                    <select
                      value={formWeight}
                      onChange={e => setFormWeight(e.target.value)}
                      className="w-full mt-1 rounded-xl border-2 border-foreground/10 bg-input px-3 py-2 text-sm font-medium text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {weightOptions.map(w => (
                        <option key={w} value={w}>{w} gr</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="font-semibold text-sm">Jumlah Keping</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formQty}
                      onChange={e => setFormQty(e.target.value)}
                      required
                      className="rounded-xl border-2 border-foreground/10 mt-1"
                    />
                  </div>
                </div>

                {/* Row 3: Harga Beli */}
                <div>
                  <Label className="font-semibold text-sm">Harga Beli <span className="text-muted-foreground font-normal">(per keping)</span></Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">Rp</span>
                    <Input
                      value={formPrice}
                      onChange={handlePriceChange}
                      placeholder="0"
                      required
                      className="pl-8 rounded-xl border-2 border-foreground/10"
                    />
                  </div>
                  {formPrice && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Modal total: <span className="font-bold text-foreground">
                        {fmt((parseInt(formPrice.replace(/\D/g,''), 10) || 0) * (parseInt(formQty) || 1))}
                      </span>
                    </p>
                  )}
                </div>

                {/* actions */}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary rounded-xl px-5 py-2 font-bold text-sm flex items-center gap-2">
                    <Check className="h-4 w-4" /> {editId ? 'Simpan Perubahan' : 'Tambah Transaksi'}
                  </button>
                  <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl px-5 py-2 font-bold text-sm border-2 border-foreground/10 hover:bg-secondary transition-colors">
                    Batal
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Datagrid ── */}
        {transactions.length === 0 ? (
          <div className="card-bordered rounded-2xl p-10 text-center text-sm text-muted-foreground">
            Belum ada transaksi. Klik <span className="font-bold text-primary">Tambah</span> untuk mencatat pembelian emas.
          </div>
        ) : (
          <div className="card-bordered rounded-2xl overflow-hidden">
            <div className="max-h-[65vh] overflow-y-auto overflow-x-auto relative">
              <table className="w-full min-w-[720px] border-separate border-spacing-0">
                <thead className="sticky top-0 z-30">
                  <tr>
                    {['Tgl', 'Merk', 'Berat', 'Qty', 'Harga Beli', 'Modal', 'Buyback (Live)', 'Spread', 'Aksi'].map((h, i) => (
                      <th
                        key={h}
                        className={cn(
                          'px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground bg-secondary whitespace-nowrap',
                          i === 0 && 'text-left sticky left-0 z-40 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-foreground/10',
                          i >= 4 && i <= 7 ? 'text-right' : i > 0 ? 'text-left' : '',
                          i === 8 ? 'text-center' : ''
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {tableRows.map(({ t, totalModal, netBb, spread, isProfit }, i) => (
                    <motion.tr
                      key={t.id || i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-foreground/5 last:border-0 hover:bg-secondary/40 transition-colors"
                    >
                      {/* Tgl */}
                      <td className="px-3 py-3 text-xs font-medium whitespace-nowrap sticky left-0 z-10 bg-card after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-foreground/10">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      {/* Merk */}
                      <td className="px-3 py-3">
                        <span className={cn(
                          'text-[10px] font-bold uppercase px-2 py-0.5 rounded border whitespace-nowrap',
                          t.brand === 'ANTAM'
                            ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800'
                            : 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
                        )}>
                          {t.brand}
                        </span>
                      </td>
                      {/* Berat */}
                      <td className="px-3 py-3 text-xs font-semibold">{t.weight} gr</td>
                      {/* Qty */}
                      <td className="px-3 py-3 text-xs font-semibold">{t.qty} pcs</td>
                      {/* Harga Beli */}
                      <td className="px-3 py-3 text-right text-xs font-semibold whitespace-nowrap">
                        {hideNumbers ? masked : fmt(t.pricePerPiece)}
                      </td>
                      {/* Modal */}
                      <td className="px-3 py-3 text-right text-xs font-semibold whitespace-nowrap">
                        {hideNumbers ? masked : fmt(totalModal)}
                      </td>
                      {/* Buyback Live */}
                      <td className="px-3 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                        {hideNumbers ? masked : fmt(netBb)}
                      </td>
                      {/* Spread */}
                      <td className={cn('px-3 py-3 text-right text-xs font-extrabold whitespace-nowrap', isProfit ? 'text-success' : 'text-destructive')}>
                        {hideNumbers ? masked : (isProfit ? '+' : '') + fmt(spread)}
                      </td>
                      {/* Aksi */}
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(t)}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id!)}
                            title="Hapus"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>

                {/* footer totals */}
                <tfoot className="sticky bottom-0 z-30">
                  <tr className="border-t-2 border-foreground/10">
                    <td colSpan={4} className="px-3 py-3 text-xs font-extrabold uppercase tracking-widest text-muted-foreground bg-secondary sticky left-0 z-30">
                      Total ({transactions.length})
                    </td>
                    <td className="bg-secondary" />
                    <td className="px-3 py-3 text-right text-xs font-extrabold whitespace-nowrap text-income bg-secondary">
                      {hideNumbers ? masked : fmt(totalSpending)}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-extrabold whitespace-nowrap bg-secondary">
                      {hideNumbers ? masked : fmt(totalAsset)}
                    </td>
                    <td className={cn('px-3 py-3 text-right text-xs font-extrabold whitespace-nowrap bg-secondary', totalProfit >= 0 ? 'text-success' : 'text-destructive')}>
                      {hideNumbers ? masked : (totalProfit >= 0 ? '+' : '') + fmt(totalProfit)}
                    </td>
                    <td className="bg-secondary" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── tiny helper component ────────────────────────────────────────────────────
function Stat({
  label, value, sub, className, align,
}: { label: string; value: string; sub?: string; className?: string; align?: 'right' }) {
  return (
    <div className={cn('flex flex-col text-xs font-semibold pt-1', align === 'right' ? 'items-end text-right' : 'items-start')}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-foreground', className)}>{value}</span>
      {sub && <span className={className}>{sub}</span>}
    </div>
  );
}