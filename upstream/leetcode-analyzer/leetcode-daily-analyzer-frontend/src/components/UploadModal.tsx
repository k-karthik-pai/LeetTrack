'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StudentInput, DepartmentItem } from '@/lib/types';
import { parseExcelFileForPreview } from '@/lib/excel';
import api from '@/lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: (students: StudentInput[], department?: string, section?: string) => void;
  onDownloadTemplate: () => void;
  departments?: DepartmentItem[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
  onDownloadTemplate,
  departments = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>('ECE');
  const [selectedSec, setSelectedSec] = useState<string>('A');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<StudentInput[]>([]);
  const [parseErrors, setParseErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [parseWarnings, setParseWarnings] = useState<Array<{ row: number; warning: string }>>([]);
  const [duplicateInfo, setDuplicateInfo] = useState<{ regNos: string[]; usernames: string[] }>({
    regNos: [],
    usernames: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeDeptObj = departments.find((d) => d.code === selectedDept);
  const availableSections = activeDeptObj?.sections || [
    { id: '1', name: 'A' },
    { id: '2', name: 'B' },
    { id: '3', name: 'C' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsParsing(true);
    setParseErrors([]);
    setParseWarnings([]);

    try {
      const result = await parseExcelFileForPreview(selected);
      setPreviewStudents(result.students);
      setParseErrors(result.errors);
      setParseWarnings(result.warnings);
      setDuplicateInfo(result.duplicates);
    } catch (err: any) {
      setParseErrors([{ row: 0, error: err.message || 'Failed to parse Excel file' }]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmAndStart = async () => {
    if (previewStudents.length === 0) {
      alert('No valid student records found in file to import.');
      return;
    }

    setIsImporting(true);
    try {
      // 1. Import via Backend API
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('department', selectedDept);
        formData.append('section', selectedSec);
        await api.importStudents(formData);
      } else {
        await api.importStudentsJson({
          students: previewStudents,
          department: selectedDept,
          section: selectedSec,
        });
      }

      // 2. Trigger Batch Analysis
      onStartAnalysis(previewStudents, selectedDept, selectedSec);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to import students');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0A]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#222828] bg-[#121616] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222828] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6FF00] text-[#080A0A] shadow-md shadow-[#B6FF00]/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F2F5F2]">Upload Student Roster</h2>
              <p className="text-xs text-[#A4ADAA]">
                Import Excel file (.xlsx / .xls) with registration numbers & LeetCode URLs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#222828] bg-[#0D1010] p-2 text-[#A4ADAA] hover:text-[#F2F5F2] hover:bg-[#151919] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Target Department & Section Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A4ADAA] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#B6FF00]" />
              <span>Target Department</span>
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-[#222828] bg-[#0D1010] p-2.5 text-xs font-medium text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
            >
              {departments.length > 0 ? (
                departments.map((d) => (
                  <option key={d.id || d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="ECE">ECE - Electronics & Communication</option>
                  <option value="CSE">CSE - Computer Science</option>
                  <option value="MECH">MECH - Mechanical</option>
                  <option value="EEE">EEE - Electrical</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A4ADAA] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#B6FF00]" />
              <span>Target Section</span>
            </label>
            <select
              value={selectedSec}
              onChange={(e) => setSelectedSec(e.target.value)}
              className="w-full rounded-xl border border-[#222828] bg-[#0D1010] p-2.5 text-xs font-medium text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
            >
              {availableSections.map((sec) => (
                <option key={sec.id || sec.name} value={sec.name}>
                  Section {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropzone / File Picker */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A3030] bg-[#0D1010]/80 p-8 text-center transition-all hover:border-[#B6FF00] hover:bg-[#151919]"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <FileSpreadsheet className="h-10 w-10 text-[#B6FF00] mb-3" />

          {file ? (
            <div>
              <p className="text-xs font-bold text-[#F2F5F2]">{file.name}</p>
              <p className="text-[11px] text-[#A4ADAA]">
                {(file.size / 1024).toFixed(1)} KB • Click to choose a different file
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-[#F2F5F2]">Click to select Excel spreadsheet</p>
              <p className="text-[11px] text-[#A4ADAA] mt-1">
                Standard columns: S.NO, REG NO, NAME, LEETCODE URL
              </p>
            </div>
          )}
        </div>

        {/* Validation Summary & Alerts */}
        {previewStudents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-[#284518] bg-[#142010] p-3 text-xs text-[#B6FF00]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold">
                  {previewStudents.length} valid student records detected for {selectedDept} Sec {selectedSec}
                </span>
              </div>
            </div>

            {duplicateInfo.regNos.length > 0 && (
              <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-400 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Duplicate Register Numbers Detected:</strong> {duplicateInfo.regNos.join(', ')}.
                  Records will be safely deduplicated by stable identity.
                </div>
              </div>
            )}

            {parseErrors.length > 0 && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-400 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <span>Validation Issues:</span>
                </div>
                {parseErrors.slice(0, 3).map((err, i) => (
                  <div key={i} className="text-[11px]">
                    Row {err.row}: {err.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#222828]">
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-[#222828] bg-[#0D1010] px-4 py-2.5 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#B6FF00]" />
            <span>Download Template</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#A4ADAA] hover:text-[#F2F5F2]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAndStart}
              disabled={previewStudents.length === 0 || isParsing || isImporting}
              className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-2.5 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/20 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
            >
              <span>{isImporting ? 'Importing...' : 'Confirm & Run Analysis'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
