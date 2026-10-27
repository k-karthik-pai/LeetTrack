'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { BatchAnalysisStatus } from '@/lib/leetcode/types';
import { getStatusBadgeInfo } from '@/lib/utils';

interface ProgressModalProps {
  status: BatchAnalysisStatus | null;
  onCancel: () => void;
  onClose: () => void;
  onCompleteRefresh: () => void;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  status,
  onCancel,
  onClose,
  onCompleteRefresh,
}) => {
  if (!status || (!status.isActive && !status.isComplete && !status.error)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#222828] bg-[#121616] p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222828] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                status.isComplete
                  ? 'bg-[#B6FF00]/10 border-[#B6FF00]/30 text-[#B6FF00]'
                  : 'bg-[#B6FF00]/10 border-[#B6FF00]/25 text-[#B6FF00]'
              }`}
            >
              <RefreshCw
                className={`h-5 w-5 ${status.isActive ? 'animate-spin' : ''}`}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F2F5F2]">
                {status.isComplete
                  ? 'Analysis Completed'
                  : status.isActive
                  ? 'Analysing LeetCode Profiles...'
                  : 'Analysis Status'}
              </h2>
              <p className="text-xs text-[#A4ADAA]">
                {status.isActive
                  ? status.currentUsername
                    ? `Fetching LeetCode profile @${status.currentUsername}...`
                    : 'Queue processing in progress...'
                  : `Snapshot: ${status.snapshotDate}`}
              </p>
            </div>
          </div>
          {status.isComplete && (
            <button
              onClick={onClose}
              className="rounded-xl border border-[#2A3030] bg-[#151919] p-2 text-[#A4ADAA] hover:bg-[#111414] hover:text-[#B6FF00] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress Bar and Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#A4ADAA]">
              {status.processed} / {status.total} completed
            </span>
            <span className="font-mono text-[#B6FF00] text-sm font-bold animate-pulse">
              {status.percentage}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#1B2020] p-0.5 border border-[#222828]">
            <div
              className="h-full rounded-full bg-[#B6FF00] transition-all duration-300 shadow-[0_0_12px_rgba(182,255,0,0.5)]"
              style={{ width: `${status.percentage}%` }}
            />
          </div>
        </div>

        {/* Real-time Counters Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/05 p-2.5">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#B6FF00] mb-0.5 font-bold">
              <CheckCircle2 className="h-3 w-3" />
              <span>Success</span>
            </div>
            <div className="font-mono text-lg font-bold text-[#B6FF00]">{status.successful}</div>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-2.5">
            <div className="flex items-center justify-center gap-1 text-[11px] text-orange-400 mb-0.5">
              <XCircle className="h-3 w-3" />
              <span>Not Found</span>
            </div>
            <div className="font-mono text-lg font-bold text-orange-300">{status.notFound}</div>
          </div>
          <div className="rounded-xl border border-[#68716E]/20 bg-[#151919]/60 p-2.5">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#A4ADAA] mb-0.5">
              <AlertTriangle className="h-3 w-3" />
              <span>Rate Limit</span>
            </div>
            <div className="font-mono text-lg font-bold text-[#F2F5F2]">{status.rateLimited}</div>
          </div>
          <div className="rounded-xl border border-[#E05252]/20 bg-[#E05252]/05 p-2.5">
            <div className="flex items-center justify-center gap-1 text-[11px] text-[#E05252] mb-0.5">
              <ShieldAlert className="h-3 w-3" />
              <span>Failed</span>
            </div>
            <div className="font-mono text-lg font-bold text-[#E05252]">{status.failed}</div>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#A4ADAA]">
            <span>Recent Activity</span>
            {status.isActive && (
              <span className="flex items-center gap-1 text-[#B6FF00] text-[11px]">
                <Flame className="h-3 w-3 animate-pulse" />
                <span>Active Queue</span>
              </span>
            )}
          </div>
          <div className="max-h-36 overflow-y-auto rounded-xl border border-[#222828] bg-[#0D1010]/60 p-2 space-y-1">
            {status.items
              .filter((i) => i.status !== 'PENDING')
              .slice(-8)
              .reverse()
              .map((item, idx) => {
                const badge = getStatusBadgeInfo(item.status);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-[#151919]/50 border border-[#222828]/30 px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#F2F5F2]">{item.name}</span>
                      <span className="font-mono text-[11px] text-[#A4ADAA]">@{item.leetcodeUsername}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                      {item.stats && item.stats.status === 'SUCCESS' && (
                        <span className="font-mono ml-1">({item.stats.total})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            {status.items.filter((i) => i.status !== 'PENDING').length === 0 && (
              <div className="py-4 text-center text-xs text-[#68716E]">
                Starting up workers and initiating profile queries...
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#222828] pt-4">
          <div>
            {status.error && (
              <p className="text-xs text-[#E05252] font-semibold">{status.error}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {status.isActive && (
              <button
                onClick={onCancel}
                className="rounded-xl border border-[#E05252]/30 bg-[#E05252]/10 px-4 py-2 text-xs font-semibold text-[#E05252] hover:bg-[#E05252]/20 transition-all"
              >
                Cancel Analysis
              </button>
            )}
            {status.isComplete && (
              <button
                onClick={() => {
                  onCompleteRefresh();
                  onClose();
                }}
                className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-2 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/25 hover:brightness-110 active:scale-[0.97] transition-all"
              >
                <span>View Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
