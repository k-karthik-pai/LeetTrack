'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Building,
  Users,
} from 'lucide-react';
import { StudentInput } from '@/lib/leetcode/types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: (students: StudentInput[], department?: string, section?: string) => void;
  onDownloadTemplate: () => void;
  departments?: Array<{ id: string; code: string; name: string; sections: Array<{ id: string; name: string }> }>;
}

interface UploadPreview {
  fileName: string;
  totalDetected: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  department: string | null;
  section: string | null;
  warnings: string[];
  duplicates: string[];
  students: StudentInput[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
  onDownloadTemplate,
  departments = [],
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('ECE');
  const [selectedSection, setSelectedSection] = useState<string>('C');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    setPreview(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', selectedDept);
    formData.append('section', selectedSection);

    try {
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to validate uploaded Excel file.');
      } else {
        setPreview({
          fileName: data.fileName,
          totalDetected: data.totalRows || data.totalDetected || 0,
          validCount: data.validRows || data.validCount || 0,
          invalidCount: data.invalidRows || data.invalidCount || 0,
          duplicateCount: data.duplicateRows || data.duplicateCount || 0,
          department: data.department || selectedDept,
          section: data.section || selectedSection,
          warnings: data.warnings || [],
          duplicates: data.duplicates || [],
          students: data.students || [],
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file to server.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#222828] bg-[#121616] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222828] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6FF00]/10 border border-[#B6FF00]/20 text-[#B6FF00]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F2F5F2]">Import Student Roster</h2>
              <p className="text-xs text-[#A4ADAA]">Upload Excel (.xlsx or .xls) with registration IDs & profiles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#2A3030] bg-[#151919] p-2 text-[#A4ADAA] hover:bg-[#111414] hover:text-[#B6FF00] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-5 space-y-4">
          {/* Department & Section Target Assignment */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#222828] bg-[#0D1010] p-3.5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#DDE3DF] mb-1.5">
                <Building className="h-3.5 w-3.5 text-[#B6FF00]" />
                <span>Department</span>
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-lg border border-[#222828] bg-[#151919] px-3 py-1.5 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none transition-colors"
              >
                <option value="ECE">ECE (Electronics & Comm)</option>
                <option value="CSE">CSE (Computer Science)</option>
                <option value="EEE">EEE (Electrical & Electronics)</option>
                <option value="MECH">MECH (Mechanical)</option>
                <option value="CIVIL">CIVIL (Civil Engineering)</option>
                <option value="IT">IT (Information Tech)</option>
                <option value="AIDS">AI & DS (Data Science)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#DDE3DF] mb-1.5">
                <Users className="h-3.5 w-3.5 text-[#B6FF00]" />
                <span>Section</span>
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-lg border border-[#222828] bg-[#151919] px-3 py-1.5 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none transition-colors"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
                <option value="E">Section E</option>
              </select>
            </div>
          </div>

          {/* Dropzone */}
          {!preview && (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-[#B6FF00] bg-[#B6FF00]/05 scale-[1.01]'
                  : 'border-[#303838] bg-[#0F1212] hover:border-[#B6FF00] hover:bg-[rgba(182,255,0,0.03)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={onFileChange}
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151919] text-[#A4ADAA] border border-[#222828] mb-3">
                <Upload className="h-6 w-6 text-[#B6FF00]" />
              </div>
              <p className="text-sm font-semibold text-[#F2F5F2]">
                {isUploading ? 'Validating & Importing to Database...' : 'Drag and drop your Excel file here'}
              </p>
              <p className="mt-1 text-xs text-[#A4ADAA]">or click to browse from your computer</p>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#0D1010]/60 px-3 py-1 text-[11px] font-mono text-[#A4ADAA] border border-[#222828]">
                <span>Required columns: S.NO, REG NO, NAME, LEETCODE URL</span>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-[#E05252]/30 bg-[#E05252]/10 p-3.5 text-[#E05252] text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="mt-1 text-[#A4ADAA]">
                  Ensure your Excel file contains headers matching <code>S.NO</code>, <code>REG NO</code>, <code>NAME</code>, and <code>LEETCODE URL</code>.
                </p>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {preview && (
            <div className="space-y-4 rounded-xl border border-[#222828] bg-[#0D1010]/60 p-4">
              <div className="flex items-center justify-between border-b border-[#222828] pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#F2F5F2]">
                  <FileSpreadsheet className="h-4 w-4 text-[#B6FF00]" />
                  <span>{preview.fileName}</span>
                  <span className="rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-mono text-[#B6FF00] border border-[#B6FF00]/20">
                    {preview.department} - Section {preview.section}
                  </span>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="text-xs text-[#A4ADAA] hover:text-[#B6FF00] underline"
                >
                  Change file
                </button>
              </div>

              {/* Counts Preview Card */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-[#151919] p-2.5 border border-[#222828]">
                  <div className="text-[11px] text-[#A4ADAA]">Total Detected</div>
                  <div className="font-mono text-lg font-bold text-[#F2F5F2]">{preview.totalDetected}</div>
                </div>
                <div className="rounded-lg bg-[#B6FF00]/10 p-2.5 border border-[#B6FF00]/20">
                  <div className="text-[11px] text-[#B6FF00]">Valid Profiles</div>
                  <div className="font-mono text-lg font-bold text-[#B6FF00]">{preview.validCount}</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20">
                  <div className="text-[11px] text-amber-400">Duplicates / Invalid</div>
                  <div className="font-mono text-lg font-bold text-amber-400">{preview.duplicateCount + preview.invalidCount}</div>
                </div>
              </div>

              {/* Warnings List if any */}
              {preview.warnings.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-semibold mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Notices ({preview.warnings.length}):</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#A4ADAA]">
                    {preview.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Template Download Link */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <span className="text-[#A4ADAA]">Need a sample format?</span>
            <button
              onClick={onDownloadTemplate}
              className="flex items-center gap-1 font-medium text-[#B6FF00] hover:text-[#C8FF33] transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#222828] pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#2A3030] bg-[#151919] px-4 py-2 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-colors"
          >
            Cancel
          </button>
          {preview && (
            <button
              onClick={() => {
                onStartAnalysis(preview.students, selectedDept, selectedSection);
                onClose();
              }}
              className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-5 py-2 text-xs font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <span>Start Analysis ({preview.validCount})</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

