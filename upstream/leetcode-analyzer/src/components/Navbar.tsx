'use client';

import React from 'react';
import { Calendar, Upload, RefreshCw, FileSpreadsheet, Sparkles, Clock, Building, Users } from 'lucide-react';
import { formatFullDate, APP_TIMEZONE } from '@/lib/date';

interface NavbarProps {
  currentDate: string;
  availableDates: string[];
  onSelectDate: (date: string) => void;
  selectedDepartment: string;
  onSelectDepartment: (dept: string) => void;
  selectedSection: string;
  onSelectSection: (sec: string) => void;
  departments?: Array<{ id: string; code: string; name: string; sections: Array<{ id: string; name: string }> }>;
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
  selectedDepartment,
  onSelectDepartment,
  selectedSection,
  onSelectSection,
  departments = [],
  onOpenUpload,
  onUpdateToday,
  onDownloadTemplate,
  onSeedSample,
  isToday,
  isAnalyzing,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#222828] bg-[#080A0A]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121616] border border-[#222828] shadow-inner">
          <span className="font-mono text-lg font-black text-[#B6FF00]">&lt;/&gt;</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-[#F2F5F2] sm:text-lg">
              LEETCODE <span className="text-[#B6FF00]">DAILY ANALYZER</span>
            </h1>
            <span className="rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-[11px] font-medium text-[#B6FF00] border border-[#B6FF00]/20">
              v1.0
            </span>
          </div>
          <p className="hidden text-xs text-[#A4ADAA] sm:block">
            Student Performance & Snapshot Dashboard
          </p>
        </div>
      </div>

      {/* Date, Department, Section & Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Department Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#222828] bg-[#0D1010] px-2.5 py-1.5 shadow-sm focus-within:border-[#B6FF00] transition-colors">
          <Building className="h-3.5 w-3.5 text-[#B6FF00]" />
          <select
            value={selectedDepartment}
            onChange={(e) => onSelectDepartment(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-[#F2F5F2] focus:outline-none"
          >
            <option value="ALL" className="bg-[#0D1010] text-[#F2F5F2]">All Depts</option>
            <option value="ECE" className="bg-[#0D1010] text-[#F2F5F2]">ECE</option>
            <option value="CSE" className="bg-[#0D1010] text-[#F2F5F2]">CSE</option>
            <option value="EEE" className="bg-[#0D1010] text-[#F2F5F2]">EEE</option>
            <option value="MECH" className="bg-[#0D1010] text-[#F2F5F2]">MECH</option>
            <option value="CIVIL" className="bg-[#0D1010] text-[#F2F5F2]">CIVIL</option>
            {departments
              .filter((d) => !['ECE', 'CSE', 'EEE', 'MECH', 'CIVIL'].includes(d.code))
              .map((d) => (
                <option key={d.id} value={d.code} className="bg-[#0D1010] text-[#F2F5F2]">
                  {d.code}
                </option>
              ))}
          </select>
        </div>

        {/* Section Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#222828] bg-[#0D1010] px-2.5 py-1.5 shadow-sm focus-within:border-[#B6FF00] transition-colors">
          <Users className="h-3.5 w-3.5 text-[#B6FF00]" />
          <select
            value={selectedSection}
            onChange={(e) => onSelectSection(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-[#F2F5F2] focus:outline-none"
          >
            <option value="ALL" className="bg-[#0D1010] text-[#F2F5F2]">All Sec</option>
            <option value="A" className="bg-[#0D1010] text-[#F2F5F2]">Sec A</option>
            <option value="B" className="bg-[#0D1010] text-[#F2F5F2]">Sec B</option>
            <option value="C" className="bg-[#0D1010] text-[#F2F5F2]">Sec C</option>
            <option value="D" className="bg-[#0D1010] text-[#F2F5F2]">Sec D</option>
          </select>
        </div>

        {/* Date Selector Dropdown */}
        <div className="flex items-center gap-1.5 rounded-lg border border-[#222828] bg-[#0D1010] px-3 py-1.5 shadow-sm focus-within:border-[#B6FF00] transition-colors">
          <Calendar className="h-4 w-4 text-[#B6FF00]" />
          <select
            value={currentDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-semibold text-[#F2F5F2] focus:outline-none sm:text-sm"
          >
            {availableDates.length === 0 && (
              <option value={currentDate} className="bg-[#0D1010] text-[#F2F5F2]">
                {formatFullDate(currentDate)} (Today)
              </option>
            )}
            {availableDates.map((date) => (
              <option key={date} value={date} className="bg-[#0D1010] text-[#F2F5F2]">
                {formatFullDate(date)} {date === currentDate && isToday ? '★ (Today)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone badge */}
        <div className="hidden xl:flex items-center gap-1 text-[11px] text-[#A4ADAA] bg-[#111414] px-2.5 py-1.5 rounded-lg border border-[#222828]">
          <Clock className="h-3.5 w-3.5 text-[#68716E]" />
          <span>{APP_TIMEZONE}</span>
        </div>

        {/* Demo / Sample Seed */}
        <button
          onClick={onSeedSample}
          title="Load sample demonstration dataset"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#2A3030] bg-[#151919] px-3 py-1.5 text-xs font-medium text-[#DDE3DF] transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5 text-[#B6FF00]" />
          <span>Demo Data</span>
        </button>

        {/* Template Download */}
        <button
          onClick={onDownloadTemplate}
          title="Download Excel student template"
          className="hidden lg:inline-flex items-center gap-1.5 rounded-lg border border-[#2A3030] bg-[#151919] px-3 py-1.5 text-xs font-medium text-[#DDE3DF] transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-[#B6FF00]" />
          <span>Template</span>
        </button>

        {/* Update Snapshot */}
        {isToday && (
          <button
            onClick={onUpdateToday}
            disabled={isAnalyzing}
            title="Re-run analysis for today's snapshot"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3030] bg-[#151919] px-3 py-1.5 text-xs font-medium text-[#DDE3DF] transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#B6FF00] ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update Today</span>
          </button>
        )}

        {/* Upload Excel Button */}
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#B6FF00] px-3.5 py-1.5 text-xs font-bold text-[#080A0A] shadow-[0_0_15px_rgba(182,255,0,0.25)] transition-all hover:brightness-110 active:scale-[0.97]"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Import Excel</span>
        </button>
      </div>
    </header>
  );
};

