'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  X,
  AlertTriangle,
} from 'lucide-react';
import { BatchAnalysisStatus } from '@/lib/types';

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
  if (!status) return null;

  const percent = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;
  const isFinished = status.isComplete || !status.isActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0A]/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#222828] bg-[#121616] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222828] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isFinished
                  ? 'bg-[#B6FF00] text-[#080A0A]'
                  : 'bg-[#B6FF00]/20 text-[#B6FF00] animate-pulse'
              }`}
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F2F5F2]">
                {isFinished ? 'Analysis Completed' : 'Analyzing Student Profiles...'}
              </h3>
              <p className="text-xs text-[#A4ADAA]">
                Snapshot Date: <span className="font-mono text-[#F2F5F2]">{status.snapshotDate}</span>
                {status.department && ` • Dept: ${status.department}`}
                {status.section && ` • Sec: ${status.section}`}
              </p>
            </div>
          </div>

          {isFinished && (
            <button
              onClick={onClose}
              className="rounded-xl border border-[#222828] bg-[#0D1010] p-2 text-[#A4ADAA] hover:text-[#F2F5F2]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[#A4ADAA]">
              Progress: {status.processed} of {status.total} students
            </span>
            <span className="font-mono text-sm text-[#B6FF00]">{percent}%</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-[#1C2222]">
            <div
              className="h-full rounded-full bg-[#B6FF00] transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Breakdown Metric Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-2.5">
            <div className="flex items-center justify-center gap-1 text-[#9FE600] text-[10px] font-bold uppercase">
              <CheckCircle2 className="h-3 w-3" />
              <span>Success</span>
            </div>
            <div className="font-mono text-base font-black text-[#F2F5F2] mt-1">
              {status.success}
            </div>
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-2.5">
            <div className="flex items-center justify-center gap-1 text-amber-400 text-[10px] font-bold uppercase">
              <AlertTriangle className="h-3 w-3" />
              <span>Not Found</span>
            </div>
            <div className="font-mono text-base font-black text-[#F2F5F2] mt-1">
              {status.notFound}
            </div>
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-2.5">
            <div className="flex items-center justify-center gap-1 text-red-400 text-[10px] font-bold uppercase">
              <AlertCircle className="h-3 w-3" />
              <span>Failed</span>
            </div>
            <div className="font-mono text-base font-black text-[#F2F5F2] mt-1">
              {status.failed}
            </div>
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-2.5">
            <div className="flex items-center justify-center gap-1 text-[#A4ADAA] text-[10px] font-bold uppercase">
              <Clock className="h-3 w-3" />
              <span>Pending</span>
            </div>
            <div className="font-mono text-base font-black text-[#F2F5F2] mt-1">
              {status.pending}
            </div>
          </div>
        </div>

        {/* Live Queue Items Log (Top 4 recent) */}
        <div className="rounded-2xl border border-[#222828] bg-[#0D1010] p-3 max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
          {status.items.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#121616]"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[#A4ADAA]">{item.student.regNo}</span>
                <span className="text-[#F2F5F2] truncate">{item.student.name}</span>
              </div>
              <div>
                {item.status === 'PROCESSING' && (
                  <span className="text-amber-400 font-bold animate-pulse">Fetching...</span>
                )}
                {item.status === 'SUCCESS' && (
                  <span className="text-[#B6FF00] font-bold">Solved: {item.result?.total || 0}</span>
                )}
                {item.status === 'NOT_FOUND' && (
                  <span className="text-amber-400 font-bold">Not Found</span>
                )}
                {item.status === 'FAILED' && (
                  <span className="text-red-400 font-bold">Failed</span>
                )}
                {item.status === 'PENDING' && (
                  <span className="text-[#626B68]">Queued</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!isFinished ? (
            <button
              onClick={onCancel}
              className="rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 transition-all"
            >
              Cancel Queue
            </button>
          ) : (
            <button
              onClick={() => {
                onCompleteRefresh();
                onClose();
              }}
              className="rounded-xl bg-[#B6FF00] px-6 py-2.5 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Done & Refresh View
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
