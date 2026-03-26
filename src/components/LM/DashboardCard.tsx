import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, icons, Loader2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Budget } from '@/types/budget';
import { CATEGORIES } from '@/types/budget';
import type { LucideIcon } from 'lucide-react';
import { getUsersConcated } from '@/context/UserContext';
import { useState, useEffect } from "react";
import { getGoals, getTransactions, Goal, Transaction } from "@/services/db";
import { fetchAntamPrices, fetchUbsPrices, GoldPriceItem } from "@/services/goldApi";
import { differenceInDays } from "date-fns";

function calcTax(gross: number, hasNPWP: boolean) {
  if (gross > 10000000) return Math.round(gross * (hasNPWP ? 0.015 : 0.03));
  return 0;
}

interface DashboardCardProps {
  hide?: boolean;
}

export function DashboardCard({ hide }: DashboardCardProps ) {
  const navigate = useNavigate();
  const fmt = (n: number) =>
  n
    .toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\u00A0/, ' ');
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const masked = '••••••';
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [livePrices, setLivePrices] = useState<{antam: GoldPriceItem[], ubs: GoldPriceItem[]}>({ antam: [], ubs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [g, t, antam, ubs] = await Promise.all([
          getGoals(), getTransactions(), fetchAntamPrices(), fetchUbsPrices()
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
  }, []);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  let totalSpending = 0; let totalAsset = 0; let totalGram = 0; let totalPieces = 0;

  transactions.forEach(t => {
    totalSpending += (t.pricePerPiece * t.qty);
    totalGram += (t.weight * t.qty);
    totalPieces += t.qty;

    let bbPricePerGram = 0;
    if (t.brand === "ANTAM") {
      const p = livePrices.antam.find(x => parseFloat(x.weight) === t.weight);
      bbPricePerGram = (p?.buybackPrice || t.pricePerPiece) / t.weight;
    } else {
      const p = livePrices.ubs.find(x => parseFloat(x.weight) === t.weight);
      bbPricePerGram = (p?.buybackPrice || t.pricePerPiece) / t.weight;
    }
    const grossBb = bbPricePerGram * t.weight * t.qty;
    totalAsset += (grossBb - calcTax(grossBb, t.hasNPWP));
  });

  const totalProfit = totalAsset - totalSpending;
  console.log(totalProfit);
  const profitPct = totalSpending > 0 ? (totalProfit / totalSpending) * 100 : 0;

  let durationLabel = "-";
  if (transactions.length > 0) {
    const dates = transactions.map(t => new Date(t.date).getTime());
    const firstDate = new Date(Math.min(...dates));
    const days = differenceInDays(new Date(), firstDate);
    if (days > 365) durationLabel = `${Math.floor(days / 365)} thn ${Math.floor((days % 365) / 30)} bln`;
    else if (days > 30) durationLabel = `${Math.floor(days / 30)} bln`;
    else durationLabel = `${days} hari`;
  }

  const goalsAchieved = goals.filter(g => {
    const sum = transactions.filter(t => t.goalId === g.id).reduce((acc, t) => acc + (t.weight * t.qty), 0);
    return sum >= g.targetGram;
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="card-bordered rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-colors h-full flex flex-col"
    >
      <div className="space-y-2.5 mt-auto">
        <div className='flex justify-between'>
          <div className="flex flex-col justify-start text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Total Modal Investasi</span>
            <span className='text-income'>{hide ? `Rp${masked}` : fmt(totalSpending)}</span>
          </div>
          <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Total Aset (Live)</span>
            <span className='text-foreground'>{hide ? `Rp${masked}` : fmt(totalAsset)}</span>
          </div>
        </div>
        <div className='flex justify-between items-start'>
          <div className="flex flex-col justify-start text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Total Profit</span>
            <span className={totalProfit >= 0 ? "text-success" : "text-destructive"}>{hide ? `Rp${masked}` : (totalProfit >= 0 ? "+" : "") + fmt(totalProfit) }</span>
            <span className={totalProfit >= 0 ? "text-success" : "text-destructive"}>{hide ? masked : (totalProfit >= 0 ? "▲" : "▼") + (Math.abs(profitPct).toFixed(2)) + `%`}</span>
          </div>
          <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Durasi Investasi</span>
            <span className='text-foreground'>{hide ? `${masked}` : durationLabel}</span>
          </div>
        </div>
        <div className='flex justify-between'>
          <div className="flex flex-col justify-start text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Total Berat</span>
            <span className='text-foreground'>{hide ? `${masked}` : `${totalGram.toFixed(2)} gr`}</span>
          </div>
          <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Total Keping</span>
            <span className='text-foreground'>{hide ? `${masked}` : `${totalPieces} pcs`}</span>
          </div>
        </div>
        <div className='flex justify-between'>
          <div className="flex flex-col justify-start text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Goals Tercapai</span>
            <span className='text-foreground'>{hide ? `${masked}` : `${goalsAchieved} / ${goals.length}`}</span>
          </div>
          <div className="flex flex-col justify-end text-end text-xs font-semibold pt-1">
            <span className="text-muted-foreground">Kategori Aktif</span>
            <span className='text-foreground'>{hide ? `${masked}` : goals.length}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
