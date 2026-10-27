'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Building2, Layers } from 'lucide-react';
import { formatDisplayDate } from '@/lib/date';
import { DepartmentItem } from '@/lib/types';
import api from '@/lib/api';

interface ExportViewProps {
  availableDates: string[];
  currentDate: string;
  department?: string;
  section?: string;
  departments?: DepartmentItem[];
}

export const ExportView: React.FC<ExportViewProps> = ({
  availableDates,
  currentDate,
  department = 'ALL',
  section = 'ALL',
  departments = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || availableDates[0] || '');
  const [selectedDept, setSelectedDept] = useState<string>(department);
  const [selectedSec, setSelectedSec] = useState<string>(section);
  const [formatType, setFormatType] = useState<'xlsx' | 'csv'>('xlsx');

  const activeDeptObj = departments.find((d) => d.code === selectedDept);
  const availableSections = activeDeptObj?.sections || [];

  const handleDownload = () => {
    if (!selectedDate) {
      alert('Please select a snapshot date to export');
      return;
    }

    const downloadUrl = api.getExportUrl(
      selectedDate,
      formatType,
      selectedDept !== 'ALL' ? selectedDept : undefined,
      selectedSec !== 'ALL' ? selectedSec : undefined
    );

    window.open(downloadUrl, '_blank');
  };

  const columns = [
    'S.NO', 'REG NO', 'NAME', 'DEPARTMENT', 'SECTION', 'LEETCODE URL',
    'LEETCODE USERNAME', 'EASY', 'MEDIUM', 'HARD', 'TOTAL', 'CONTEST RATING',
    'GLOBAL RANK', 'TOTAL SUBMISSIONS', 'ACCEPTANCE RATE', 'ACTIVE DAYS',
    'CURRENT STREAK', 'MAX STREAK', 'STATUS', 'DATE'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
        <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
          <Download className="h-5 w-5 text-[#B6FF00]" />
          <span>Export Snapshot Reports</span>
        </h2>
        <p className="text-xs text-[#A4ADAA]">
          Generate official institutional spreadsheet reports in Excel or CSV format
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Configuration Card */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 space-y-6 shadow-2xl">
          <h3 className="text-sm font-bold text-[#F2F5F2]">Report Parameters</h3>

          {/* Date Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A4ADAA]">Snapshot Date</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-[#222828] bg-[#0D1010] p-3 text-xs font-medium text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDisplayDate(date)} ({date})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A4ADAA]">Department Target</label>
            <div className="flex items-center gap-2 rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-2 text-xs">
              <Building2 className="h-4 w-4 text-[#B6FF00]" />
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedSec('ALL');
                }}
                className="w-full bg-transparent font-medium text-[#F2F5F2] focus:outline-none"
              >
                <option value="ALL" className="bg-[#121616]">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id || d.code} value={d.code} className="bg-[#121616]">
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A4ADAA]">Section Target</label>
            <div className="flex items-center gap-2 rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-2 text-xs">
              <Layers className="h-4 w-4 text-[#B6FF00]" />
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="w-full bg-transparent font-medium text-[#F2F5F2] focus:outline-none"
              >
                <option value="ALL" className="bg-[#121616]">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec.id || sec.name} value={sec.name} className="bg-[#121616]">
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Format Radio Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#A4ADAA]">Output Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormatType('xlsx')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  formatType === 'xlsx'
                    ? 'border-[#B6FF00] bg-[#142010] text-[#B6FF00]'
                    : 'border-[#222828] bg-[#0D1010] text-[#A4ADAA] hover:bg-[#151919]'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Microsoft Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormatType('csv')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  formatType === 'csv'
                    ? 'border-[#B6FF00] bg-[#142010] text-[#B6FF00]'
                    : 'border-[#222828] bg-[#0D1010] text-[#A4ADAA] hover:bg-[#151919]'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>CSV Spreadsheet (.csv)</span>
              </button>
            </div>
          </div>

          {/* Download Action */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] py-3.5 text-xs font-bold text-[#080A0A] shadow-xl shadow-[#B6FF00]/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download Snapshot Report ({formatType.toUpperCase()})</span>
          </button>
        </div>

        {/* Schema Preview Card */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center justify-between">
            <span>20-Column Enterprise Schema Preview</span>
            <span className="text-xs text-[#B6FF00] font-mono">Official Specification</span>
          </h3>

          <p className="text-xs text-[#A4ADAA]">
            The exported file includes comprehensive verification attributes for official academic audits:
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {columns.map((col, idx) => (
              <div
                key={col}
                className="flex items-center gap-2 rounded-xl border border-[#222828] bg-[#0D1010] p-2 text-[11px]"
              >
                <span className="font-mono text-[10px] font-bold text-[#B6FF00]">{idx + 1}.</span>
                <span className="font-semibold text-[#F2F5F2]">{col}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3 text-[11px] text-[#A4ADAA] flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#B6FF00] flex-shrink-0 mt-0.5" />
            <span>
              All numerical problem counters and diff calculations are guaranteed immutable for historical dates.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
