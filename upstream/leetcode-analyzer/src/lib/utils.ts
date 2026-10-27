import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDecimal(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return num.toFixed(decimals);
}

export function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return `${num.toFixed(1)}%`;
}

export function getStatusBadgeInfo(status: string) {
  switch (status?.toUpperCase()) {
    case 'SUCCESS':
      return {
        label: 'Success',
        bg: 'bg-[#B6FF00]/10',
        text: 'text-[#B6FF00]',
        border: 'border-[#B6FF00]/30',
        dot: 'bg-[#B6FF00]',
      };
    case 'PROCESSING':
      return {
        label: 'Processing',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400 animate-ping',
      };
    case 'PENDING':
      return {
        label: 'Pending',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
      };
    case 'NOT_FOUND':
      return {
        label: 'Not Found',
        bg: 'bg-[#E05252]/10',
        text: 'text-[#E05252]',
        border: 'border-[#E05252]/30',
        dot: 'bg-[#E05252]',
      };
    case 'RATE_LIMITED':
      return {
        label: 'Rate Limited',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-400',
      };
    case 'FAILED':
    default:
      return {
        label: 'Failed',
        bg: 'bg-[#E05252]/10',
        text: 'text-[#E05252]',
        border: 'border-[#E05252]/30',
        dot: 'bg-[#E05252]',
      };
  }
}
