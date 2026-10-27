'use client';

import React from 'react';
import { History, Calendar, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { formatFullDate, formatDisplayDate } from '@/lib/date';
import { formatNumber } from '@/lib/utils';

interface HistoryViewProps {
  snapshots: any[];
  currentDate: string;
  onSelectDate: (date: string) => void;
  onRetryFailed?: (date: string) => void;
  isToday: (date: string) => boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  snapshots,
  currentDate,
  onSelectDate,
  onRetryFailed,
  isToday,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
        <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
          <History className="h-5 w-5 text-[#B6FF00]" />
          <span>Historical Daily Snapshots</span>
        </h2>
        <p className="text-xs text-[#A4ADAA]">
          Browse, inspect, and compare immutable historical classroom performance checkpoints
        </p>
      </div>

      {/* Snapshot Cards List */}
      <div className="space-y-3">
        {snapshots.length === 0 ? (
          <div className="rounded-2xl border border-[#222828] bg-[#121616] p-12 text-center text-[#A4ADAA]">
            No historical snapshots found.
          </div>
        ) : (
          snapshots.map((snap) => {
            const isSelected = snap.snapshotDate === currentDate;
            const isLiveToday = isToday(snap.snapshotDate);

            return (
              <div
                key={snap.id || snap.snapshotDate}
                className={`rounded-2xl border p-5 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isSelected
                    ? 'border-[#B6FF00] bg-[#151919] shadow-xl shadow-[#B6FF00]/5'
                    : 'border-[#222828] bg-[#121616] hover:border-[#2A3030] hover:bg-[#151919]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`h-4 w-4 ${isSelected ? 'text-[#B6FF00]' : 'text-[#A4ADAA]'}`} />
                    <h3 className="text-sm font-bold text-[#F2F5F2]">
                      {formatFullDate(snap.snapshotDate)}
                    </h3>
                    {isLiveToday && (
                      <span className="rounded-full bg-[#B6FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/30">
                        Today's Live Snapshot
                      </span>
                    )}
                    {isSelected && !isLiveToday && (
                      <span className="rounded-full bg-[#151919] px-2 py-0.5 text-[10px] font-bold text-[#A4ADAA] border border-[#222828]">
                        Currently Viewing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A4ADAA]">
                    {snap.totalStudents} student profiles recorded • Average: {snap.avgSolved} solved / student
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  {/* Solved stats */}
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] uppercase font-bold text-[#A4ADAA]">Total Solved</div>
                    <div className="font-mono text-base font-black text-[#B6FF00]">
                      {formatNumber(snap.totalSolved)}
                    </div>
                  </div>

                  {/* Status counts */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 text-[#9FE600]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{snap.successCount || snap.totalStudents}</span>
                    </span>
                    {snap.failedCount > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{snap.failedCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {snap.failedCount > 0 && onRetryFailed && (
                      <button
                        onClick={() => onRetryFailed(snap.snapshotDate)}
                        className="flex items-center gap-1 rounded-xl border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 transition-all"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectDate(snap.snapshotDate)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-[#B6FF00] text-[#080A0A]'
                          : 'border border-[#222828] bg-[#0D1010] text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00]'
                      }`}
                    >
                      <span>{isSelected ? 'Viewing' : 'Inspect'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
