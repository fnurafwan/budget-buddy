// ── Flag logic ────────────────────────────────────────────────────────────────
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

export type FlagLevel = 'critical' | 'warning' | 'normal' | 'low';

export const getFlag = (amount: number, avg: number): FlagLevel => {
  if (avg === 0) return 'normal';
  const ratio = amount / avg;
  if (ratio >= 2) return 'critical';
  if (ratio >= 1.5) return 'warning';
  if (ratio <= 0.5) return 'low';
  return 'normal';
};

export const FLAG_CONFIG: Record<FlagLevel, {
  label: string;
  textColor: string;
  bgColor: string;
  barColor: string;
  bgFill: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  critical: {
    label: 'High Spend',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    barColor: 'bg-red-500',
    bgFill: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: React.createElement(TrendingUp, { className: 'h-3 w-3' }),
  },
  warning: {
    label: 'Above Avg',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    barColor: 'bg-amber-500',
    bgFill: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: React.createElement(TrendingUp, { className: 'h-3 w-3' }),
  },
  normal: {
    label: 'Normal',
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    barColor: 'bg-emerald-500',
    bgFill: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: React.createElement(Minus, { className: 'h-3 w-3' }),
  },
  low: {
    label: 'Low Spend',
    textColor: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    barColor: 'bg-sky-500',
    bgFill: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    icon: React.createElement(TrendingDown, { className: 'h-3 w-3' }),
  },
};

export const fmt = (n: number) =>
  n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' });
