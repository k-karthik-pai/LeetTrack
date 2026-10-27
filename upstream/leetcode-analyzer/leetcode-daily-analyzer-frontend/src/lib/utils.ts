import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString();
}

export function formatAcceptanceRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return '-';
  return `${(rate * 100).toFixed(1)}%`;
}

export function getRankBadgeClass(rank: number): string {
  if (rank === 1) return 'bg-[#B6FF00] text-[#080A0A] font-black border-[#B6FF00]';
  if (rank === 2) return 'bg-[#9FE600]/80 text-[#080A0A] font-bold border-[#9FE600]';
  if (rank === 3) return 'bg-[#C8FF33]/60 text-[#080A0A] font-bold border-[#C8FF33]';
  return 'bg-[#151919] text-[#A4ADAA] border-[#222828]';
}

export function getDiffDisplay(diff: number | null | undefined) {
  if (diff === null || diff === undefined) {
    return { text: '-', colorClass: 'text-[#626B68]', bgClass: 'bg-[#151919]', isPositive: false, isZero: true };
  }
  if (diff > 0) {
    return { text: `+${diff}`, colorClass: 'text-[#B6FF00]', bgClass: 'bg-[#142010] border border-[#284518]', isPositive: true, isZero: false };
  }
  if (diff === 0) {
    return { text: '0', colorClass: 'text-[#626B68]', bgClass: 'bg-[#151919]', isPositive: false, isZero: true };
  }
  return { text: `${diff}`, colorClass: 'text-red-400', bgClass: 'bg-red-950/30 border border-red-900/50', isPositive: false, isZero: false };
}
