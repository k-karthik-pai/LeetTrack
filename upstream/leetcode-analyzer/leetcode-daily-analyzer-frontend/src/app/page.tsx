'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TabType,
  StudentInput,
  BatchAnalysisStatus,
  SnapshotData,
  DepartmentItem,
} from '@/lib/types';
import { getTodayDateString, formatFullDate } from '@/lib/date';
import api from '@/lib/api';
import { generateTemplateExcel } from '@/lib/excel';

// Component Imports
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SummaryCards } from '@/components/SummaryCards';
import { StudentTable } from '@/components/StudentTable';
import { LeaderboardView } from '@/components/LeaderboardView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { HistoryView } from '@/components/HistoryView';
import { ExportView } from '@/components/ExportView';
import { SettingsView } from '@/components/SettingsView';
import { UploadModal } from '@/components/UploadModal';
import { ProgressModal } from '@/components/ProgressModal';
import { StudentDetailModal } from '@/components/StudentDetailModal';

// Icons
import {
  Calendar,
  Upload,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

export default function HomePage() {
  const todayDateStr = getTodayDateString();
  const [currentDate, setCurrentDate] = useState<string>(todayDateStr);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [snapshotsList, setSnapshotsList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Active snapshot detail
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  // Modals state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchAnalysisStatus | null>(null);

  // 1. Fetch available departments
  const fetchDepartments = useCallback(async () => {
    try {
      const data = await api.getDepartments();
      if (data.success && Array.isArray(data.departments)) {
        setDepartmentsList(data.departments);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, []);

  // 2. Fetch available snapshots list
  const fetchSnapshotsList = useCallback(async () => {
    try {
      const data = await api.getSnapshots();
      if (data.success && Array.isArray(data.snapshots)) {
        setSnapshotsList(data.snapshots);
        const dates = data.snapshots.map((s: any) => s.snapshotDate);
        setAvailableDates(dates);

        if (dates.length > 0 && !dates.includes(currentDate)) {
          if (dates.includes(todayDateStr)) {
            setCurrentDate(todayDateStr);
          } else {
            setCurrentDate(dates[0]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching snapshots list:', err);
    }
  }, [currentDate, todayDateStr]);

  // 3. Fetch specific snapshot details for currentDate, department, and section
  const fetchSnapshotDetails = useCallback(async (date: string, dept = 'ALL', sec = 'ALL') => {
    if (!date) return;
    setIsLoadingSnapshot(true);
    setSnapshotError(null);
    try {
      const data = await api.getSnapshotByDate(date, {
        department: dept !== 'ALL' ? dept : undefined,
        section: sec !== 'ALL' ? sec : undefined,
      });

      if (data.success && data.snapshot) {
        setSnapshotData(data.snapshot);
      } else {
        setSnapshotData(null);
        setSnapshotError(data.error || 'No snapshot data available');
      }
    } catch (err: any) {
      setSnapshotError(err.message || 'Failed to load snapshot details');
      setSnapshotData(null);
    } finally {
      setIsLoadingSnapshot(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDepartments();
    fetchSnapshotsList();
  }, [fetchDepartments, fetchSnapshotsList]);

  // Load details whenever currentDate, selectedDepartment, or selectedSection changes
  useEffect(() => {
    if (currentDate) {
      fetchSnapshotDetails(currentDate, selectedDepartment, selectedSection);
    }
  }, [currentDate, selectedDepartment, selectedSection, fetchSnapshotDetails]);

  // 4. Batch progress polling loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkProgress = async () => {
      try {
        const data = await api.getAnalysisProgress();
        if (data.success && data.status) {
          setBatchStatus(data.status);
          if (data.status.isActive) {
            if (!interval) {
              interval = setInterval(checkProgress, 1000);
            }
          } else if (data.status.isComplete) {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }
            fetchDepartments();
            fetchSnapshotsList();
            if (data.status.snapshotDate) {
              setCurrentDate(data.status.snapshotDate);
              fetchSnapshotDetails(data.status.snapshotDate, selectedDepartment, selectedSection);
            }
          }
        }
      } catch (err) {
        console.error('Progress polling error:', err);
      }
    };

    checkProgress();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchDepartments, fetchSnapshotsList, fetchSnapshotDetails, selectedDepartment, selectedSection]);

  // Start Analysis Handler
  const handleStartAnalysis = async (students: StudentInput[], dept?: string, sec?: string) => {
    try {
      const data = await api.startAnalysis({
        students,
        date: todayDateStr,
        mode: 'new',
        department: dept || (selectedDepartment !== 'ALL' ? selectedDepartment : undefined),
        section: sec || (selectedSection !== 'ALL' ? selectedSection : undefined),
      });

      if (!data.success) {
        alert(data.error || 'Failed to initiate batch analysis');
      } else {
        const progData = await api.getAnalysisProgress();
        if (progData.success) {
          setBatchStatus(progData.status);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error starting analysis');
    }
  };

  // Re-run today's analysis
  const handleUpdateToday = async () => {
    if (!confirm("Are you sure you want to update today's snapshot with fresh LeetCode statistics?")) {
      return;
    }
    try {
      const data = await api.startAnalysis({
        date: todayDateStr,
        mode: 'update',
        department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
      });

      if (!data.success) {
        alert(data.error || "Failed to update today's snapshot");
      } else {
        const progData = await api.getAnalysisProgress();
        if (progData.success) {
          setBatchStatus(progData.status);
        }
      }
    } catch (err: any) {
      alert(err.message || "Error updating today's snapshot");
    }
  };

  // Retry Failed Profiles
  const handleRetryFailed = async (date: string) => {
    try {
      const data = await api.retryFailedProfiles({
        date,
        department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
        section: selectedSection !== 'ALL' ? selectedSection : undefined,
      });

      if (!data.success) {
        alert(data.error || 'Failed to retry failed profiles');
      } else {
        const progData = await api.getAnalysisProgress();
        if (progData.success) {
          setBatchStatus(progData.status);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error retrying profiles');
    }
  };

  // Cancel active analysis
  const handleCancelAnalysis = async () => {
    try {
      await api.cancelAnalysis();
      setBatchStatus(null);
    } catch (err: any) {
      console.error('Cancel analysis error:', err);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    try {
      const templateApiUrl = api.getTemplateDownloadUrl();
      window.open(templateApiUrl, '_blank');
    } catch {
      try {
        const buffer = generateTemplateExcel();
        const blob = new Blob([buffer.buffer as ArrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leetcode_students_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        alert(err.message || 'Failed to generate template file');
      }
    }
  };

  // Load Seed Sample Multi-Day Data
  const handleSeedSample = async () => {
    if (!confirm('Load realistic 3-day demonstration dataset with ECE, CSE, and MECH departments?')) {
      return;
    }
    try {
      const data = await api.seedSampleData();
      if (data.success) {
        await fetchDepartments();
        await fetchSnapshotsList();
        setCurrentDate(todayDateStr);
        await fetchSnapshotDetails(todayDateStr);
        alert('Demo dataset generated with 3 daily snapshots across ECE, CSE, and MECH departments!');
      } else {
        alert(data.error || 'Failed to seed sample data');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating sample data');
    }
  };

  const isCurrentDateToday = currentDate === todayDateStr;
  const isAnalyzing = Boolean(batchStatus?.isActive);

  // Summary counts
  const summary = snapshotData?.summary || {
    totalStudents: 0,
    profilesAnalysed: 0,
    profilesFailed: 0,
    totalProblemsSolved: 0,
    avgProblemsSolved: 0,
    totalEasy: 0,
    totalMedium: 0,
    totalHard: 0,
  };

  const studentsList = snapshotData?.students || [];

  return (
    <div className="min-h-screen bg-[#080A0A] text-[#F2F5F2] flex flex-col relative overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        availableDates={availableDates}
        onSelectDate={(d) => setCurrentDate(d)}
        selectedDepartment={selectedDepartment}
        onSelectDepartment={(dept) => setSelectedDepartment(dept)}
        selectedSection={selectedSection}
        onSelectSection={(sec) => setSelectedSection(sec)}
        departments={departmentsList}
        onOpenUpload={() => setIsUploadOpen(true)}
        onUpdateToday={handleUpdateToday}
        onDownloadTemplate={handleDownloadTemplate}
        onSeedSample={handleSeedSample}
        isToday={isCurrentDateToday}
        isAnalyzing={isAnalyzing}
      />

      <div className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          totalStudents={summary.totalStudents}
          analyzedCount={summary.profilesAnalysed}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Active snapshot date notice banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#222828] bg-[#0D1010]/50 px-4 py-2.5 text-xs text-[#A4ADAA]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#B6FF00]" />
              <span>
                Displaying Snapshot for:{' '}
                <strong className="text-[#F2F5F2] font-mono">{formatFullDate(currentDate)}</strong>
              </span>
              {isCurrentDateToday ? (
                <span className="rounded-md bg-[#B6FF00]/20 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/30">
                  LIVE TODAY
                </span>
              ) : (
                <span className="rounded-md bg-[#151919] px-2 py-0.5 text-[10px] font-semibold text-[#A4ADAA] border border-[#222828]">
                  HISTORICAL SNAPSHOT
                </span>
              )}
              {selectedDepartment !== 'ALL' && (
                <span className="rounded-md bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/20">
                  DEPT: {selectedDepartment}
                </span>
              )}
              {selectedSection !== 'ALL' && (
                <span className="rounded-md bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/20">
                  SEC: {selectedSection}
                </span>
              )}
            </div>
            {snapshotData?.previousDate && (
              <span className="text-[#A4ADAA]">
                Comparing vs:{' '}
                <strong className="text-[#F2F5F2] font-mono">
                  {formatFullDate(snapshotData.previousDate)}
                </strong>
              </span>
            )}
          </div>

          {/* Empty State when no snapshots exist */}
          {!isLoadingSnapshot && availableDates.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#222828] bg-[#121616]/30 p-12 text-center shadow-xl space-y-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#B6FF00] text-[#080A0A] shadow-xl shadow-[#B6FF00]/10">
                <span className="font-mono text-3xl font-black">&lt;/&gt;</span>
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-2xl font-bold text-[#F2F5F2] tracking-tight">
                  Start Your Daily LeetCode Analysis
                </h2>
                <p className="text-sm text-[#A4ADAA]">
                  Upload your student Excel file containing names, register numbers, and LeetCode profile links to begin automated tracking and snapshot analysis.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#B6FF00] px-6 py-3 text-sm font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/30 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Master Excel</span>
                </button>
                <button
                  onClick={handleSeedSample}
                  className="flex items-center gap-2 rounded-xl border border-[#2A3030] bg-[#151919] px-5 py-3 text-sm font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95 transition-all"
                >
                  <Sparkles className="h-4 w-4 text-[#B6FF00]" />
                  <span>Load Demo Data</span>
                </button>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 rounded-xl border border-[#2A3030] bg-[#151919] px-5 py-3 text-sm font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-95 transition-all"
                >
                  <FileSpreadsheet className="h-4 w-4 text-[#B6FF00]" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingSnapshot && (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B6FF00] border-t-transparent" />
                <p className="text-xs text-[#A4ADAA]">Loading daily snapshot data from backend...</p>
              </div>
            </div>
          )}

          {/* Snapshot Content */}
          {!isLoadingSnapshot && snapshotData && (
            <>
              {/* Tab 1: Dashboard */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <SummaryCards
                    summary={summary}
                    onRetryFailed={() => handleRetryFailed(currentDate)}
                  />

                  <StudentTable
                    students={studentsList}
                    onSelectStudent={(id) => setSelectedStudentId(id)}
                    snapshotDate={currentDate}
                  />
                </div>
              )}

              {/* Tab 2: Students Roster */}
              {activeTab === 'students' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5">
                    <h2 className="text-lg font-bold text-[#F2F5F2]">Student Directory & Profiles</h2>
                    <p className="text-xs text-[#A4ADAA]">
                      Search and inspect individual student statistics, problem breakdowns, and submissions
                    </p>
                  </div>
                  <StudentTable
                    students={studentsList}
                    onSelectStudent={(id) => setSelectedStudentId(id)}
                    snapshotDate={currentDate}
                  />
                </div>
              )}

              {/* Tab 3: Leaderboard */}
              {activeTab === 'leaderboard' && (
                <LeaderboardView
                  students={studentsList}
                  onSelectStudent={(id) => setSelectedStudentId(id)}
                  snapshotDate={currentDate}
                />
              )}

              {/* Tab 4: Analytics */}
              {activeTab === 'analytics' && (
                <AnalyticsView
                  students={studentsList}
                  snapshotsHistory={snapshotsList}
                  topImprovers={snapshotData.topImprovers || []}
                  onSelectStudent={(id) => setSelectedStudentId(id)}
                  summary={summary}
                />
              )}

              {/* Tab 5: History */}
              {activeTab === 'history' && (
                <HistoryView
                  snapshots={snapshotsList}
                  currentDate={currentDate}
                  onSelectDate={(d) => setCurrentDate(d)}
                  onRetryFailed={handleRetryFailed}
                  isToday={(d) => d === todayDateStr}
                />
              )}

              {/* Tab 6: Export */}
              {activeTab === 'export' && (
                <ExportView
                  availableDates={availableDates}
                  currentDate={currentDate}
                  department={selectedDepartment}
                  section={selectedSection}
                  departments={departmentsList}
                />
              )}

              {/* Tab 7: Settings */}
              {activeTab === 'settings' && (
                <SettingsView
                  onSeedSample={handleSeedSample}
                  onDownloadTemplate={handleDownloadTemplate}
                  totalSnapshots={availableDates.length}
                  totalStudents={summary.totalStudents}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onStartAnalysis={handleStartAnalysis}
        onDownloadTemplate={handleDownloadTemplate}
        departments={departmentsList}
      />

      {/* Live Batch Progress Modal */}
      <ProgressModal
        status={batchStatus}
        onCancel={handleCancelAnalysis}
        onClose={() => setBatchStatus(null)}
        onCompleteRefresh={() => {
          fetchDepartments();
          fetchSnapshotsList();
          if (batchStatus?.snapshotDate) {
            setCurrentDate(batchStatus.snapshotDate);
            fetchSnapshotDetails(batchStatus.snapshotDate, selectedDepartment, selectedSection);
          }
        }}
      />

      {/* Student Detail Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
}
