'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  Building2,
  Layers,
} from 'lucide-react';
import { formatDisplayDate, formatFullDate } from '@/lib/date';
import { DepartmentItem } from '@/lib/types';

interface NavbarProps {
  currentDate: string;
  availableDates: string[];
  onSelectDate: (date: string) => void;
  selectedDepartment?: string;
  onSelectDepartment?: (dept: string) => void;
  selectedSection?: string;
  onSelectSection?: (sec: string) => void;
  departments?: DepartmentItem[];
  onOpenUpload: () => void;
  onUpdateToday: () => void;
  onDownloadTemplate: () => void;
  onSeedSample: () => void;
  isToday: boolean;
  isAnalyzing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  availableDates,
  onSelectDate,
  selectedDepartment = 'ALL',
  onSelectDepartment,
  selectedSection = 'ALL',
  onSelectSection,
  departments = [],
  onOpenUpload,
  onUpdateToday,
  onDownloadTemplate,
  onSeedSample,
  isToday,
  isAnalyzing,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const activeDeptObj = departments.find((d) => d.code === selectedDepartment);
  const availableSections = activeDeptObj?.sections || [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222828] bg-[#0D1010]/90 backdrop-blur-xl px-4 sm:px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6FF00] shadow-lg shadow-[#B6FF00]/20">
            <span className="font-mono text-xl font-black text-[#080A0A]">&lt;/&gt;</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-[#F2F5F2]">
                LEETCODE<span className="text-[#B6FF00]">.DAILY</span>
              </span>
              <span className="rounded-full bg-[#151919] px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#222828]">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#A4ADAA]">
              Enterprise Student Performance Dashboard
            </p>
          </div>
        </div>

        {/* Center/Right: Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Department Selector */}
          <div className="flex items-center gap-1.5 bg-[#121616] border border-[#222828] rounded-xl px-2.5 py-1.5 text-xs text-[#A4ADAA]">
            <Building2 className="h-3.5 w-3.5 text-[#B6FF00]" />
            <select
              value={selectedDepartment}
              onChange={(e) => {
                onSelectDepartment?.(e.target.value);
                onSelectSection?.('ALL');
              }}
              className="bg-transparent text-xs font-semibold text-[#F2F5F2] focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#121616] text-[#F2F5F2]">All Departments</option>
              {departments.map((d) => (
                <option key={d.id || d.code} value={d.code} className="bg-[#121616] text-[#F2F5F2]">
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-1.5 bg-[#121616] border border-[#222828] rounded-xl px-2.5 py-1.5 text-xs text-[#A4ADAA]">
            <Layers className="h-3.5 w-3.5 text-[#B6FF00]" />
            <select
              value={selectedSection}
              onChange={(e) => onSelectSection?.(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#F2F5F2] focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#121616] text-[#F2F5F2]">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec.id || sec.name} value={sec.name} className="bg-[#121616] text-[#F2F5F2]">
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 rounded-xl border border-[#222828] bg-[#121616] px-3.5 py-2 text-xs font-semibold text-[#F2F5F2] hover:border-[#2A3030] hover:bg-[#151919] transition-all"
            >
              <Calendar className="h-4 w-4 text-[#B6FF00]" />
              <span>{formatDisplayDate(currentDate)}</span>
              {isToday && (
                <span className="rounded-full bg-[#B6FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/30">
                  Today
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-[#A4ADAA]" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#222828] bg-[#0D1010] p-2 shadow-2xl z-50">
                <div className="px-3 py-2 text-[11px] font-bold text-[#A4ADAA] uppercase tracking-wider">
                  Available Snapshot Dates
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => {
                        onSelectDate(date);
                        setIsDatePickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        date === currentDate
                          ? 'bg-[#B6FF00] font-bold text-[#080A0A]'
                          : 'text-[#F2F5F2] hover:bg-[#151919]'
                      }`}
                    >
                      <span>{formatFullDate(date)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Update Today Button */}
          {isToday && (
            <button
              onClick={onUpdateToday}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 rounded-xl border border-[#222828] bg-[#121616] px-3.5 py-2 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin text-[#B6FF00]' : ''}`} />
              <span className="hidden sm:inline">Refresh Today</span>
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-4 py-2 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Roster</span>
          </button>
        </div>
      </div>
    </header>
  );
};
