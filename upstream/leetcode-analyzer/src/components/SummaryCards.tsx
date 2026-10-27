'use client';

import React from 'react';
import { Users, CheckCircle2, AlertCircle, Award, Target, Zap, Flame, ShieldAlert } from 'lucide-react';
import { formatNumber, formatDecimal } from '@/lib/utils';

interface SummaryData {
  totalStudents: number;
  profilesAnalysed: number;
  profilesFailed: number;
  totalProblemsSolved: number;
  avgProblemsSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
}

interface SummaryCardsProps {
  summary: SummaryData;
  onRetryFailed?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, onRetryFailed }) => {
  const cards = [
    {
      title: 'Total Students',
      value: formatNumber(summary.totalStudents),
      icon: Users,
      iconColor: 'text-[#B6FF00]',
      valColor: 'text-[#B6FF00]',
      subtext: 'Master roster enrolled',
    },
    {
      title: 'Profiles Analysed',
      value: formatNumber(summary.profilesAnalysed),
      icon: CheckCircle2,
      iconColor: 'text-[#B6FF00]',
      valColor: 'text-[#B6FF00]',
      subtext: `${summary.totalStudents > 0 ? ((summary.profilesAnalysed / summary.totalStudents) * 100).toFixed(0) : 0}% success rate`,
    },
    {
      title: 'Profiles Failed',
      value: formatNumber(summary.profilesFailed),
      icon: summary.profilesFailed > 0 ? ShieldAlert : AlertCircle,
      iconColor: summary.profilesFailed > 0 ? 'text-[#E05252]' : 'text-[#68716E]',
      valColor: summary.profilesFailed > 0 ? 'text-[#E05252]' : 'text-[#F2F5F2]',
      subtext: summary.profilesFailed > 0 ? 'Click to retry' : '0 errors',
      isClickable: summary.profilesFailed > 0 && !!onRetryFailed,
      onClick: onRetryFailed,
    },
    {
      title: 'Problems Solved',
      value: formatNumber(summary.totalProblemsSolved),
      icon: Award,
      iconColor: 'text-[#B6FF00]',
      valColor: 'text-[#B6FF00]',
      subtext: 'Cumulative class total',
    },
    {
      title: 'Average Solved',
      value: formatDecimal(summary.avgProblemsSolved, 1),
      icon: Target,
      iconColor: 'text-[#B6FF00]',
      valColor: 'text-[#B6FF00]',
      subtext: 'Per active student',
    },
    {
      title: 'Easy Solved',
      value: formatNumber(summary.totalEasy),
      icon: Zap,
      iconColor: 'text-[#B6FF00]',
      valColor: 'text-[#B6FF00]',
      subtext: 'Fundamental tier',
    },
    {
      title: 'Medium Solved',
      value: formatNumber(summary.totalMedium),
      icon: Flame,
      iconColor: 'text-[#ffc01e]',
      valColor: 'text-[#ffc01e]',
      subtext: 'Intermediate tier',
    },
    {
      title: 'Hard Solved',
      value: formatNumber(summary.totalHard),
      icon: Award,
      iconColor: 'text-[#ff375f]',
      valColor: 'text-[#ff375f]',
      subtext: 'Advanced tier',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.isClickable ? card.onClick : undefined}
            className={`group relative flex flex-col justify-between rounded-xl border border-[#222828] bg-[#121616] p-3.5 transition-all duration-200 ${
              card.isClickable
                ? 'cursor-pointer hover:border-[#E05252] hover:scale-[1.02] active:scale-[0.98]'
                : 'hover:border-[#B6FF00]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#A4ADAA]">{card.title}</span>
              <Icon className={`h-4 w-4 ${card.iconColor} transition-transform group-hover:scale-110`} />
            </div>
            <div className="my-2">
              <span className={`font-mono text-xl font-bold tracking-tight sm:text-2xl ${card.valColor}`}>
                {card.value}
              </span>
            </div>
            <div className="text-[11px] text-[#68716E] font-medium truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
};
