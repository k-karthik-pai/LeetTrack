'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  CalendarCheck,
} from 'lucide-react';
import { StudentProfile } from '@/lib/types';
import { getDiffDisplay, getRankBadgeClass } from '@/lib/utils';

interface StudentTableProps {
  students: StudentProfile[];
  onSelectStudent: (studentId: string) => void;
  snapshotDate: string;
}

type SortField = 'rank' | 'regNo' | 'name' | 'easy' | 'medium' | 'hard' | 'total' | 'diff' | 'contestRating' | 'submissions';
type SortOrder = 'asc' | 'desc';

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onSelectStudent,
  snapshotDate,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' || field === 'regNo' || field === 'rank' ? 'asc' : 'desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.regNo.toLowerCase().includes(search.toLowerCase()) ||
        s.leetcodeUsername.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SUCCESS' && s.status === 'SUCCESS') ||
        (statusFilter === 'FAILED' && s.status !== 'SUCCESS') ||
        (statusFilter === 'ACTIVE_TODAY' && s.diff !== null && s.diff > 0);

      return matchesSearch && matchesStatus;
    });
  }, [students, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'rank') {
        aVal = a.status === 'SUCCESS' ? a.rank || 999 : 9999;
        bVal = b.status === 'SUCCESS' ? b.rank || 999 : 9999;
      } else if (sortField === 'diff') {
        aVal = a.diff ?? -9999;
        bVal = b.diff ?? -9999;
      } else if (sortField === 'contestRating') {
        aVal = a.contestRating ?? 0;
        bVal = b.contestRating ?? 0;
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 text-[#B6FF00]" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-[#B6FF00]" />
    );
  };

  return (
    <div className="space-y-4 rounded-3xl border border-[#222828] bg-[#121616] p-4 sm:p-6 shadow-2xl">
      {/* Controls: Search, Filter, Page Size */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4ADAA]" />
          <input
            type="text"
            placeholder="Search by name, register number, username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#222828] bg-[#0D1010] py-2.5 pl-10 pr-4 text-xs font-medium text-[#F2F5F2] placeholder-[#626B68] focus:border-[#B6FF00] focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter buttons */}
          <div className="flex rounded-xl border border-[#222828] bg-[#0D1010] p-1 text-xs">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#B6FF00] text-[#080A0A] font-bold shadow'
                  : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('SUCCESS');
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                statusFilter === 'SUCCESS'
                  ? 'bg-[#B6FF00] text-[#080A0A] font-bold shadow'
                  : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
              }`}
            >
              Active ({students.filter((s) => s.status === 'SUCCESS').length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('ACTIVE_TODAY');
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                statusFilter === 'ACTIVE_TODAY'
                  ? 'bg-[#B6FF00] text-[#080A0A] font-bold shadow'
                  : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
              }`}
            >
              Solved Today ({students.filter((s) => s.diff !== null && s.diff > 0).length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('FAILED');
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                statusFilter === 'FAILED'
                  ? 'bg-red-500 text-white font-bold shadow'
                  : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
              }`}
            >
              Failed ({students.filter((s) => s.status !== 'SUCCESS').length})
            </button>
          </div>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-2 text-xs font-semibold text-[#F2F5F2] focus:border-[#B6FF00] focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={200}>200 / page</option>
          </select>
        </div>
      </div>

      {/* Interactive Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#222828] bg-[#0D1010]/40">
        <table className="w-full text-left text-xs text-[#F2F5F2]">
          <thead className="border-b border-[#222828] bg-[#0D1010] text-[11px] font-bold uppercase tracking-wider text-[#A4ADAA]">
            <tr>
              <th
                onClick={() => handleSort('rank')}
                className="cursor-pointer px-4 py-3.5 hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Rank</span>
                  {renderSortIcon('rank')}
                </div>
              </th>
              <th
                onClick={() => handleSort('regNo')}
                className="cursor-pointer px-4 py-3.5 hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Reg No</span>
                  {renderSortIcon('regNo')}
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="cursor-pointer px-4 py-3.5 hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Student Name</span>
                  {renderSortIcon('name')}
                </div>
              </th>
              <th className="px-4 py-3.5">Department</th>
              <th className="px-4 py-3.5">LeetCode Profile</th>
              <th
                onClick={() => handleSort('easy')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[#9FE600]">Easy</span>
                  {renderSortIcon('easy')}
                </div>
              </th>
              <th
                onClick={() => handleSort('medium')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-amber-400">Medium</span>
                  {renderSortIcon('medium')}
                </div>
              </th>
              <th
                onClick={() => handleSort('hard')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-red-400">Hard</span>
                  {renderSortIcon('hard')}
                </div>
              </th>
              <th
                onClick={() => handleSort('total')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[#B6FF00] font-black">Total</span>
                  {renderSortIcon('total')}
                </div>
              </th>
              <th
                onClick={() => handleSort('diff')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Today's Diff</span>
                  {renderSortIcon('diff')}
                </div>
              </th>
              <th
                onClick={() => handleSort('contestRating')}
                className="cursor-pointer px-4 py-3.5 text-right hover:text-[#B6FF00] transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Rating</span>
                  {renderSortIcon('contestRating')}
                </div>
              </th>
              <th className="px-4 py-3.5 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#222828]/50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-[#A4ADAA]">
                  No students found matching your filters.
                </td>
              </tr>
            ) : (
              paginated.map((student) => {
                const diff = getDiffDisplay(student.diff);
                const isTop3 = student.status === 'SUCCESS' && student.rank && student.rank <= 3;

                return (
                  <tr
                    key={student.id || student.regNo}
                    onClick={() => onSelectStudent(student.id || student.regNo)}
                    className="cursor-pointer transition-all hover:bg-[#151919] active:bg-[#1C2222]"
                  >
                    {/* Rank */}
                    <td className="px-4 py-3 font-mono font-bold">
                      {student.status === 'SUCCESS' && student.rank ? (
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs border ${getRankBadgeClass(
                            student.rank
                          )}`}
                        >
                          {student.rank}
                        </span>
                      ) : (
                        <span className="text-[#626B68]">-</span>
                      )}
                    </td>

                    {/* Reg No */}
                    <td className="px-4 py-3 font-mono font-semibold text-[#F2F5F2]">
                      {student.regNo}
                    </td>

                    {/* Student Name */}
                    <td className="px-4 py-3 font-semibold text-[#F2F5F2]">
                      <div className="flex items-center gap-2">
                        <span>{student.name}</span>
                        {student.diff !== null && student.diff > 0 && (
                          <span className="flex items-center gap-0.5 rounded-full bg-[#B6FF00]/15 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#B6FF00]/20">
                            <Sparkles className="h-3 w-3" />
                            <span>+{student.diff}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Department & Section */}
                    <td className="px-4 py-3 text-[#A4ADAA]">
                      <span className="rounded-md bg-[#151919] px-2 py-0.5 text-[11px] font-semibold text-[#DDE3DF] border border-[#222828]">
                        {student.department || 'N/A'} {student.section ? `• Sec ${student.section}` : ''}
                      </span>
                    </td>

                    {/* LeetCode Username */}
                    <td className="px-4 py-3">
                      <a
                        href={student.leetcodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-xs text-[#B6FF00] hover:underline"
                      >
                        <span>{student.leetcodeUsername || 'profile'}</span>
                        <ExternalLink className="h-3 w-3 text-[#A4ADAA]" />
                      </a>
                    </td>

                    {/* Easy */}
                    <td className="px-4 py-3 text-right font-mono text-[#9FE600]">
                      {student.status === 'SUCCESS' ? student.easy : '-'}
                    </td>

                    {/* Medium */}
                    <td className="px-4 py-3 text-right font-mono text-amber-400">
                      {student.status === 'SUCCESS' ? student.medium : '-'}
                    </td>

                    {/* Hard */}
                    <td className="px-4 py-3 text-right font-mono text-red-400">
                      {student.status === 'SUCCESS' ? student.hard : '-'}
                    </td>

                    {/* Total Solved */}
                    <td className="px-4 py-3 text-right font-mono font-black text-sm text-[#B6FF00]">
                      {student.status === 'SUCCESS' ? student.total : '-'}
                    </td>

                    {/* Diff */}
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] ${diff.bgClass} ${diff.colorClass}`}>
                        {diff.text}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 text-right font-mono text-[#F2F5F2]">
                      {student.contestRating ? Math.round(student.contestRating) : '-'}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center">
                      {student.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#142010] border border-[#284518] px-2 py-0.5 text-[10px] font-bold text-[#B6FF00]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#B6FF00]" />
                          Active
                        </span>
                      ) : student.status === 'NOT_FOUND' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          Not Found
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-950/40 border border-red-800/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-[#A4ADAA]">
        <div>
          Showing <strong>{(page - 1) * pageSize + 1}</strong> to{' '}
          <strong>{Math.min(page * pageSize, sorted.length)}</strong> of{' '}
          <strong>{sorted.length}</strong> students
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-1.5 font-semibold text-[#F2F5F2] hover:bg-[#151919] disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          <span className="font-mono font-bold text-[#F2F5F2]">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-xl border border-[#222828] bg-[#0D1010] px-3 py-1.5 font-semibold text-[#F2F5F2] hover:bg-[#151919] disabled:opacity-40 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
