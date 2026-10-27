'use client';

import React from 'react';
import {
  Settings,
  Clock,
  Database,
  Cpu,
  Sparkles,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { APP_TIMEZONE } from '@/lib/date';

interface SettingsViewProps {
  onSeedSample: () => void;
  onDownloadTemplate: () => void;
  totalSnapshots: number;
  totalStudents: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onSeedSample,
  onDownloadTemplate,
  totalSnapshots,
  totalStudents,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
        <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#B6FF00]" />
          <span>System Configuration & Architecture</span>
        </h2>
        <p className="text-xs text-[#A4ADAA]">
          Environment parameters, database storage, and decoupled backend API service
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Settings & Parameters */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#B6FF00]" />
            <span>Architecture & Parameters</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-xs font-semibold text-[#F2F5F2]">Server Timezone</div>
                  <div className="text-[11px] text-[#A4ADAA]">Used for daily snapshot cutoff</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#B6FF00] bg-[#B6FF00]/10 px-2.5 py-1 rounded-lg border border-[#B6FF00]/20">
                {APP_TIMEZONE}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-xs font-semibold text-[#F2F5F2]">Database Engine</div>
                  <div className="text-[11px] text-[#A4ADAA]">PostgreSQL / Supabase + Prisma ORM</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#B6FF00] bg-[#B6FF00]/10 px-2.5 py-1 rounded-lg border border-[#B6FF00]/20">
                PostgreSQL
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-xs font-semibold text-[#F2F5F2]">Worker Concurrency</div>
                  <div className="text-[11px] text-[#A4ADAA]">Rate-limit aware modular queue</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#B6FF00] bg-[#B6FF00]/10 px-2.5 py-1 rounded-lg border border-[#B6FF00]/20">
                5 Workers (Controlled)
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-xs font-semibold text-[#F2F5F2]">Snapshot & Hierarchy</div>
                  <div className="text-[11px] text-[#A4ADAA]">Dept / Section / Immutable Snapshots</div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#B6FF00]">
                Hierarchical & Non-destructive
              </span>
            </div>
          </div>
        </div>

        {/* Quick Utilities & Sample Tools */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#B6FF00]" />
              <span>Demonstration & Templates</span>
            </h3>
            <p className="text-xs text-[#A4ADAA]">
              Easily generate multi-day sample data across departments or download the official template format.
            </p>

            <div className="space-y-3">
              <button
                onClick={onSeedSample}
                className="w-full flex items-center justify-between rounded-xl border border-[#2A3030] bg-[#151919] p-3.5 text-left transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#B6FF00]" />
                  <div>
                    <div className="text-xs font-bold text-[#F2F5F2]">Load Multi-Day Demo Dataset</div>
                    <div className="text-[11px] text-[#A4ADAA]">
                      Creates 3 consecutive daily snapshots with realistic student records
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#B6FF00]">Generate →</span>
              </button>

              <button
                onClick={onDownloadTemplate}
                className="w-full flex items-center justify-between rounded-xl border border-[#2A3030] bg-[#151919] p-3.5 text-left transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-[#B6FF00]" />
                  <div>
                    <div className="text-xs font-bold text-[#F2F5F2]">Download Excel Template</div>
                    <div className="text-[11px] text-[#A4ADAA]">
                      Empty template with pre-configured headers (S.NO, REG NO, NAME, LEETCODE URL)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#B6FF00]">Download →</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3 text-[11px] text-[#A4ADAA]">
            Database currently holding <strong>{totalSnapshots}</strong> snapshot dates and{' '}
            <strong>{totalStudents}</strong> student profiles.
          </div>
        </div>
      </div>
    </div>
  );
};
