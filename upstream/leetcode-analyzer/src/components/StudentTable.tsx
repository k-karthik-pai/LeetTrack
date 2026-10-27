'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  TrendingUp,
  Minus,
  TrendingDown,
  Trophy,
} from 'lucide-react';
import { EnrichedStudentStat } from '@/lib/ranking';
import { getStatusBadgeInfo, formatNumber, formatPercent, formatDecimal } from '@/lib/utils';

interface StudentTableProps {
  students: EnrichedStudentStat[];
  onSelectStudent: (studentId: string) => void;
  snapshotDate: string;
}

type SortField = 'rank' | 'sNo' | 'regNo' | 'name' | 'leetcodeUsername' | 'easy' | 'medium' | 'hard' | 'total' | 'diff' | 'contestRating' | 'status';
type SortOrder = 'asc' | 'desc';

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onSelectStudent,
  snapshotDate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');
  const [progressFilter, setProgressFilter] = useState<'ALL' | 'IMPROVED' | 'UNCHANGED'>('ALL');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'rank' || field === 'sNo' || field === 'regNo' || field === 'name' ? 'asc' : 'desc');
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.regNo.toLowerCase().includes(query) ||
        student.leetcodeUsername.toLowerCase().includes(query);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'SUCCESS') matchesStatus = student.status === 'SUCCESS';
      else if (statusFilter === 'FAILED') matchesStatus = student.status !== 'SUCCESS';

      // Progress filter
      let matchesProgress = true;
      if (progressFilter === 'IMPROVED') {
        matchesProgress = (student.diff ?? 0) > 0;
      } else if (progressFilter === 'UNCHANGED') {
        matchesProgress = student.diff === 0;
      }

      return matchesSearch && matchesStatus && matchesProgress;
    });
  }, [students, searchQuery, statusFilter, progressFilter]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (aVal === null || aVal === undefined) aVal = sortOrder === 'asc' ? Infinity : -Infinity;
      if (bVal === null || bVal === undefined) bVal = sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(String(bVal));
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredStudents, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, currentPage, pageSize]);

  return (
    <div className="flex flex-col rounded-2xl border border-[#222828] bg-[#121616] shadow-xl overflow-hidden">
      {/* Top filter and search bar */}
      <div className="flex flex-col gap-3 border-b border-[#222828] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716E]" />
            <input
              type="text"
              placeholder="Search by Name, Reg No, or LeetCode username..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-[#222828] bg-[#0D1010] py-2 pl-9 pr-4 text-xs sm:text-sm text-[#F2F5F2] placeholder-[#68716E] focus:border-[#B6FF00] focus:outline-none focus:ring-1 focus:ring-[#B6FF00]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A4ADAA] hover:text-[#F2F5F2]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-[#A4ADAA] hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-2 text-xs font-medium text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed / Issues Only</option>
            </select>
          </div>

          {/* Progress Filter */}
          <select
            value={progressFilter}
            onChange={(e) => {
              setProgressFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="hidden lg:block rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-2 text-xs font-medium text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
          >
            <option value="ALL">All Daily Deltas</option>
            <option value="IMPROVED">Improvers (+X)</option>
            <option value="UNCHANGED">No Change</option>
          </select>
        </div>

        {/* Page size & Total count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#A4ADAA]">
          <span>
            Showing <strong className="text-[#F2F5F2]">{filteredStudents.length}</strong> of{' '}
            <strong className="text-[#F2F5F2]">{students.length}</strong>
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-[#222828] bg-[#0D1010] px-2 py-1 text-xs text-[#F2F5F2] focus:outline-none focus:border-[#B6FF00]"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#222828] bg-[#0D1010] font-semibold text-[#A4ADAA]">
              <th
                onClick={() => handleSort('rank')}
                className="cursor-pointer px-4 py-3 hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Rank</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('regNo')}
                className="cursor-pointer px-3 py-3 hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Reg No</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer px-4 py-3 hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Name</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('leetcodeUsername')}
                className="cursor-pointer px-4 py-3 hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>LeetCode ID</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('easy')}
                className="cursor-pointer px-3 py-3 text-center text-[#B6FF00] hover:brightness-125 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Easy</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('medium')}
                className="cursor-pointer px-3 py-3 text-center text-[#ffc01e] hover:brightness-125 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Medium</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('hard')}
                className="cursor-pointer px-3 py-3 text-center text-[#ff375f] hover:brightness-125 transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Hard</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('total')}
                className="cursor-pointer px-4 py-3 text-center text-[#B6FF00] hover:brightness-125 transition-colors font-bold"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Total</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('diff')}
                className="cursor-pointer px-3 py-3 text-center hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>vs Yesterday</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('contestRating')}
                className="cursor-pointer px-3 py-3 text-center hover:text-[#F2F5F2] transition-colors"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Rating</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-3 text-center text-[#A4ADAA]">Status</th>
              <th className="px-4 py-3 text-right text-[#A4ADAA]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202626] bg-[#111414] font-medium">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-[#A4ADAA]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-8 w-8 text-[#68716E]" />
                    <p className="text-sm font-semibold text-[#F2F5F2]">No students match your criteria</p>
                    <p className="text-xs text-[#68716E]">Try clearing filters or changing search keywords</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => {
                const badge = getStatusBadgeInfo(student.status);
                const isTop1 = student.rank === 1 && student.status === 'SUCCESS';
                const isTop2 = student.rank === 2 && student.status === 'SUCCESS';
                const isTop3 = student.rank === 3 && student.status === 'SUCCESS';

                return (
                  <tr
                    key={student.id}
                    className="group transition-colors hover:bg-[rgba(182,255,0,0.04)]"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-mono font-bold">
                        {isTop1 && (
                          <span className="flex items-center justify-center h-5 w-7 rounded bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/30 text-[10px] font-bold font-mono">
                            01
                          </span>
                        )}
                        {isTop2 && (
                          <span className="flex items-center justify-center h-5 w-7 rounded bg-[#A4ADAA]/10 text-[#A4ADAA] border border-[#A4ADAA]/30 text-[10px] font-bold font-mono">
                            02
                          </span>
                        )}
                        {isTop3 && (
                          <span className="flex items-center justify-center h-5 w-7 rounded bg-[#8F9995]/10 text-[#8F9995] border border-[#8F9995]/30 text-[10px] font-bold font-mono">
                            03
                          </span>
                        )}
                        {!isTop1 && !isTop2 && !isTop3 && (
                          <span className="text-[#68716E] pl-1">#{student.rank}</span>
                        )}
                      </div>
                    </td>

                    {/* Reg No */}
                    <td className="px-3 py-3.5 font-mono text-[#F2F5F2] whitespace-nowrap">
                      {student.regNo}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => onSelectStudent(student.studentId)}
                        className="font-semibold text-[#F2F5F2] hover:text-[#B6FF00] transition-colors text-left"
                      >
                        {student.name}
                      </button>
                    </td>

                    {/* LeetCode ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-[#A4ADAA]">
                          {student.leetcodeUsername || 'N/A'}
                        </span>
                        {student.leetcodeUsername && (
                          <a
                            href={student.leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#68716E] hover:text-[#B6FF00] transition-colors"
                            title="Open LeetCode Profile"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Easy */}
                    <td className="px-3 py-3.5 text-center font-mono font-semibold text-[#B6FF00]">
                      {student.status === 'SUCCESS' ? formatNumber(student.easy) : 'N/A'}
                    </td>

                    {/* Medium */}
                    <td className="px-3 py-3.5 text-center font-mono font-semibold text-[#ffc01e]">
                      {student.status === 'SUCCESS' ? formatNumber(student.medium) : 'N/A'}
                    </td>

                    {/* Hard */}
                    <td className="px-3 py-3.5 text-center font-mono font-semibold text-[#ff375f]">
                      {student.status === 'SUCCESS' ? formatNumber(student.hard) : 'N/A'}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 text-center font-mono text-base font-bold text-[#B6FF00] bg-[#121616]">
                      {student.status === 'SUCCESS' ? formatNumber(student.total) : 'N/A'}
                    </td>

                    {/* vs Yesterday */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      {student.diff !== null && student.diff !== undefined ? (
                        student.diff > 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#B6FF00]/10 px-2 py-0.5 text-xs font-bold text-[#B6FF00] border border-[#B6FF00]/20">
                            <TrendingUp className="h-3 w-3" />+{student.diff}
                          </span>
                        ) : student.diff === 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#151919] px-2 py-0.5 text-xs font-medium text-[#A4ADAA] border border-[#222828]">
                            <Minus className="h-3 w-3" />0
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-[#E05252] border border-rose-500/20">
                            <TrendingDown className="h-3 w-3" />{student.diff}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-[#68716E]">—</span>
                      )}
                    </td>

                    {/* Contest Rating */}
                    <td className="px-3 py-3.5 text-center font-mono text-xs text-[#A4ADAA]">
                      {student.contestRating ? formatDecimal(student.contestRating, 1) : 'N/A'}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectStudent(student.studentId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#2A3030] bg-[#151919] px-2.5 py-1 text-xs font-medium text-[#DDE3DF] transition-all hover:border-[#B6FF00] hover:text-[#B6FF00] active:scale-[0.97]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#222828] bg-[#0D1010] px-4 py-3 text-xs text-[#A4ADAA]">
        <div>
          Page <strong className="text-[#F2F5F2]">{currentPage}</strong> of{' '}
          <strong className="text-[#F2F5F2]">{totalPages}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg border border-[#2A3030] bg-[#151919] px-3 py-1.5 font-medium text-[#DDE3DF] transition-colors hover:border-[#B6FF00] hover:text-[#B6FF00] disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          {/* Page numbers preview */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5) {
              if (currentPage > 3) pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) pageNum = totalPages - 4 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#B6FF00] text-[#080A0A] shadow-sm shadow-[#B6FF00]/30 font-bold'
                    : 'border border-[#2A3030] bg-[#151919] text-[#DDE3DF] hover:bg-[#111414] hover:text-[#B6FF00]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 rounded-lg border border-[#2A3030] bg-[#151919] px-3 py-1.5 font-medium text-[#DDE3DF] transition-colors hover:border-[#B6FF00] hover:text-[#B6FF00] disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
