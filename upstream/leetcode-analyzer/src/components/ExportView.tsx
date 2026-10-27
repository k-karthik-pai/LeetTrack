'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Check, ShieldCheck, Building, Users } from 'lucide-react';
import { formatFullDate } from '@/lib/date';

interface ExportViewProps {
  availableDates: string[];
  currentDate: string;
  department?: string;
  section?: string;
  departments?: Array<{ id: string; code: string; name: string }>;
}

export const ExportView: React.FC<ExportViewProps> = ({
  availableDates,
  currentDate,
  department = 'ALL',
  section = 'ALL',
  departments = [],
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(currentDate || '');
  const [selectedDept, setSelectedDept] = useState<string>(department);
  const [selectedSec, setSelectedSec] = useState<string>(section);

  const columns = [
    'S.NO',
    'REG NO',
    'NAME',
    'DEPARTMENT',
    'SECTION',
    'LEETCODE URL',
    'LEETCODE USERNAME',
    'EASY',
    'MEDIUM',
    'HARD',
    'TOTAL',
    'CONTEST RATING',
    'GLOBAL RANK',
    'SUBMISSIONS',
    'ACCEPTANCE RATE',
    'ACTIVE DAYS',
    'CURRENT STREAK',
    'MAX STREAK',
    'STATUS',
    'DATE',
  ];

  const handleDownload = (format: 'xlsx' | 'csv') => {
    if (!selectedDate) return;
    const params = new URLSearchParams();
    params.set('date', selectedDate);
    params.set('format', format);
    if (selectedDept && selectedDept !== 'ALL') params.set('department', selectedDept);
    if (selectedSec && selectedSec !== 'ALL') params.set('section', selectedSec);

    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5">
        <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
          <Download className="h-5 w-5 text-[#B6FF00]" />
          <span>Export Daily Snapshot Reports</span>
        </h2>
        <p className="text-xs text-[#A4ADAA]">
          Generate formatted spreadsheets containing full student details, verified statistics, department, section, and contest rankings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Controls */}
        <div className="lg:col-span-2 rounded-2xl border border-[#222828] bg-[#121616] p-6 space-y-6 shadow-xl">
          {/* Select Snapshot Date & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#A4ADAA] flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#B6FF00]" />
                <span>Snapshot Date</span>
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-[#222828] bg-[#0D1010] px-3.5 py-2.5 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
              >
                {availableDates.map((date) => (
                  <option key={date} value={date} className="bg-[#0D1010] text-[#F2F5F2]">
                    {formatFullDate(date)} {date === currentDate ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#A4ADAA] flex items-center gap-1.5">
                <Building className="h-4 w-4 text-[#B6FF00]" />
                <span>Department</span>
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-[#222828] bg-[#0D1010] px-3.5 py-2.5 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="ECE">ECE</option>
                <option value="CSE">CSE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                {departments
                  .filter((d) => !['ECE', 'CSE', 'EEE', 'MECH', 'CIVIL'].includes(d.code))
                  .map((d) => (
                    <option key={d.code} value={d.code}>{d.code}</option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#A4ADAA] flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#B6FF00]" />
                <span>Section</span>
              </label>
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="w-full rounded-xl border border-[#222828] bg-[#0D1010] px-3.5 py-2.5 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
              >
                <option value="ALL">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Excel Download Button */}
            <div className="rounded-xl border border-[#B6FF00]/30 bg-[#B6FF00]/05 p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[#B6FF00] font-bold text-sm mb-1">
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Microsoft Excel (.xlsx)</span>
                </div>
                <p className="text-xs text-[#A4ADAA]">
                  Formatted spreadsheet with configured column widths and styled headers.
                </p>
              </div>
              <button
                onClick={() => handleDownload('xlsx')}
                disabled={!selectedDate}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#B6FF00] py-2.5 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/20 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Excel (.xlsx)</span>
              </button>
            </div>

            {/* CSV Download Button */}
            <div className="rounded-xl border border-[#2A3030] bg-[#151919] p-4 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-[#DDE3DF] font-bold text-sm mb-1">
                  <FileText className="h-5 w-5 text-[#B6FF00]" />
                  <span>Comma-Separated Values (.csv)</span>
                </div>
                <p className="text-xs text-[#A4ADAA]">
                  Universal plain text CSV format for importing into custom analytics or BI tools.
                </p>
              </div>
              <button
                onClick={() => handleDownload('csv')}
                disabled={!selectedDate}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#2A3030] bg-[#121616] py-2.5 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV (.csv)</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#222828] bg-[#0D1010]/40 p-4 text-xs text-[#A4ADAA] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-[#DDE3DF]">
              <ShieldCheck className="h-4 w-4 text-[#B6FF00]" />
              <span>Enterprise Export Integrity</span>
            </div>
            <p>
              Exports are generated server-side directly from immutable daily database snapshots.
            </p>
          </div>
        </div>

        {/* Export Schema Preview */}
        <div className="rounded-2xl border border-[#222828] bg-[#121616] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#222828] pb-3">
            <h3 className="text-sm font-bold text-[#F2F5F2]">Exported Columns ({columns.length})</h3>
            <span className="rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-mono text-[#B6FF00]">
              Full Schema
            </span>
          </div>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-[#0D1010] px-3 py-1.5 text-xs border border-[#222828]"
              >
                <span className="font-mono text-[#DDE3DF]">{col}</span>
                <span className="text-[10px] text-[#A4ADAA] flex items-center gap-1">
                  <Check className="h-3 w-3 text-[#B6FF00]" />
                  Included
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
