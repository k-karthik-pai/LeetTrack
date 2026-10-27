'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Code2,
  Calculator,
  RefreshCw,
} from 'lucide-react';
import { SnapshotSummary } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface SummaryCardsProps {
  summary: SnapshotSummary;
  onRetryFailed?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onRetryFailed }) => {
  const cards = [
    {
      title: 'Total Students',
      value: formatNumber(summary.totalStudents),
      subtitle: 'Enrolled in roster',
      icon: <Users className="h-5 w-5 text-[#B6FF00]" />,
    },
    {
      title: 'Profiles Analysed',
      value: formatNumber(summary.profilesAnalysed),
      subtitle: `${summary.totalStudents > 0 ? Math.round((summary.profilesAnalysed / summary.totalStudents) * 100) : 0}% success rate`,
      icon: <CheckCircle2 className="h-5 w-5 text-[#B6FF00]" />,
    },
    {
      title: 'Failed / Not Found',
      value: formatNumber(summary.profilesFailed),
      subtitle: summary.profilesFailed > 0 ? 'Requires attention' : 'All profiles verified',
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      action: summary.profilesFailed > 0 && onRetryFailed ? (
        <button
          onClick={onRetryFailed}
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/20 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-900/40 transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Failed ({summary.profilesFailed})</span>
        </button>
      ) : null,
    },
    {
      title: 'Total Problems Solved',
      value: formatNumber(summary.totalProblemsSolved),
      subtitle: `Easy: ${formatNumber(summary.totalEasy)} | Med: ${formatNumber(summary.totalMedium)} | Hard: ${formatNumber(summary.totalHard)}`,
      icon: <Code2 className="h-5 w-5 text-[#B6FF00]" />,
    },
    {
      title: 'Average Problems / Student',
      value: summary.avgProblemsSolved.toFixed(1),
      subtitle: 'Across analyzed profiles',
      icon: <Calculator className="h-5 w-5 text-[#B6FF00]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-lg transition-all hover:border-[#2A3030] hover:bg-[#151919]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A4ADAA]">{card.title}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#151919] border border-[#222828]">
              {card.icon}
            </div>
          </div>

          <div className="mt-3">
            <div className="font-mono text-2xl font-black text-[#F2F5F2]">{card.value}</div>
            <div className="mt-1 text-[11px] text-[#A4ADAA]">{card.subtitle}</div>
            {card.action}
          </div>
        </div>
      ))}
    </div>
  );
};
