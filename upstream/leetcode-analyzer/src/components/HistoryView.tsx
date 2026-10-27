'use client';

import React from 'react';
import {
  Calendar,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { formatFullDate, formatTimestamp } from '@/lib/date';
import { formatNumber, formatDecimal } from '@/lib/utils';

interface SnapshotSummaryItem {
  id: string;
  snapshotDate: string;
  totalStudents: number;
  totalSolved: number;
  avgSolved: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
}

interface HistoryViewProps {
  snapshots: SnapshotSummaryItem[];
  currentDate: string;
  onSelectDate: (date: string) => void;
  onRetryFailed: (date: string) => void;
  isToday: (date: string) => boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  snapshots,
  currentDate,
  onSelectDate,
  onRetryFailed,
  isToday,
}) => {
  const handleExport = (date: string, format: 'xlsx' | 'csv') => {
    window.location.href = `/api/export?date=${date}&format=${format}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#222828] bg-[#121616] p-5">
        <div>
          <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#B6FF00]" />
            <span>Daily Snapshots History</span>
          </h2>
          <p className="text-xs text-[#A4ADAA]">
            Immutable day-by-day record of student LeetCode metrics. Historical snapshots are never overwritten.
          </p>
        </div>
        <span className="rounded-xl border border-[#222828] bg-[#151919] px-3.5 py-1.5 text-xs font-semibold text-[#A4ADAA]">
          {snapshots.length} Snapshot{snapshots.length === 1 ? '' : 's'} Stored
        </span>
      </div>

      {/* Snapshot Cards Grid */}
      {snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#222828] bg-[#121616] py-16 text-center">
          <Calendar className="h-10 w-10 text-[#68716E] mb-3" />
          <h3 className="text-sm font-semibold text-[#F2F5F2]">No snapshot history found</h3>
          <p className="mt-1 text-xs text-[#68716E]">
            Upload your student Excel list and start an analysis to record your first daily snapshot.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {snapshots.map((snap) => {
            const isSelected = snap.snapshotDate === currentDate;
            const today = isToday(snap.snapshotDate);

            return (
              <div
                key={snap.id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#B6FF00]/50 bg-[#B6FF00]/05 shadow-lg shadow-[#B6FF00]/10'
                    : 'border-[#222828] bg-[#111414] hover:border-[#2A3030]'
                }`}
              >
                {/* Left info: Date & metadata */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#F2F5F2] sm:text-lg">
                      {formatFullDate(snap.snapshotDate)}
                    </span>
                    {today && (
                      <span className="rounded-full bg-[#B6FF00]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/30">
                        TODAY
                      </span>
                    )}
                    {isSelected && (
                      <span className="rounded-full bg-[#B6FF00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/20">
                        ACTIVE VIEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#A4ADAA]">
                    <Clock className="h-3 w-3" />
                    <span>Captured: {formatTimestamp(snap.createdAt)}</span>
                  </div>
                </div>

                {/* Center metrics: Solved, Students, Success/Fail */}
                <div className="grid grid-cols-3 gap-3 text-center sm:gap-6">
                  <div>
                    <div className="text-[11px] text-[#68716E]">Students</div>
                    <div className="font-mono text-sm font-bold text-[#F2F5F2]">
                      {snap.totalStudents}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#68716E]">Total Solved</div>
                    <div className="font-mono text-sm font-bold text-[#B6FF00]">
                      {formatNumber(snap.totalSolved)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#68716E]">Average</div>
                    <div className="font-mono text-sm font-bold text-[#B6FF00]">
                      {formatDecimal(snap.avgSolved, 1)}
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {snap.failedCount > 0 && (
                    <button
                      onClick={() => onRetryFailed(snap.snapshotDate)}
                      title={`Retry ${snap.failedCount} failed profiles`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E05252]/30 bg-[#E05252]/10 px-3 py-1.5 text-xs font-semibold text-[#E05252] hover:bg-[#E05252]/20 transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry ({snap.failedCount})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleExport(snap.snapshotDate, 'xlsx')}
                    title="Download Excel Report"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A3030] bg-[#151919] px-3 py-1.5 text-xs font-medium text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-all"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-[#B6FF00]" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => handleExport(snap.snapshotDate, 'csv')}
                    title="Download CSV"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#2A3030] bg-[#151919] px-3 py-1.5 text-xs font-medium text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-[#A4ADAA]" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => onSelectDate(snap.snapshotDate)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#B6FF00] px-3.5 py-1.5 text-xs font-bold text-[#080A0A] shadow-md shadow-[#B6FF00]/20 hover:brightness-110 active:scale-[0.97]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
