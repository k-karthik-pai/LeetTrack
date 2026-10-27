'use client';

import React, { useState } from 'react';
import { Trophy, Medal, Flame, Star, Sparkles, ExternalLink } from 'lucide-react';
import { StudentProfile } from '@/lib/types';
import { getDiffDisplay, getRankBadgeClass } from '@/lib/utils';

interface LeaderboardViewProps {
  students: StudentProfile[];
  onSelectStudent: (studentId: string) => void;
  snapshotDate: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  students,
  onSelectStudent,
  snapshotDate,
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<'total' | 'hard' | 'medium' | 'easy'>('total');

  // Filter only successful profiles
  const activeStudents = students.filter((s) => s.status === 'SUCCESS');

  // Sort based on chosen difficulty
  const sortedStudents = [...activeStudents].sort((a, b) => {
    if (filterDifficulty === 'hard') {
      if (b.hard !== a.hard) return b.hard - a.hard;
      return b.total - a.total;
    }
    if (filterDifficulty === 'medium') {
      if (b.medium !== a.medium) return b.medium - a.medium;
      return b.total - a.total;
    }
    if (filterDifficulty === 'easy') {
      if (b.easy !== a.easy) return b.easy - a.easy;
      return b.total - a.total;
    }
    // Default: Total Solved
    if (b.total !== a.total) return b.total - a.total;
    if (b.hard !== a.hard) return b.hard - a.hard;
    if (b.medium !== a.medium) return b.medium - a.medium;
    return b.easy - a.easy;
  });

  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];
  const rest = sortedStudents.slice(3);

  return (
    <div className="space-y-8">
      {/* Header with Difficulty Filter Pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#B6FF00]" />
            <span>Classroom Leaderboard</span>
          </h2>
          <p className="text-xs text-[#A4ADAA]">
            Top performers ranked by LeetCode algorithmic problem milestones
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex rounded-xl border border-[#222828] bg-[#0D1010] p-1 text-xs">
          <button
            onClick={() => setFilterDifficulty('total')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              filterDifficulty === 'total'
                ? 'bg-[#B6FF00] text-[#080A0A] shadow'
                : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
            }`}
          >
            Total Solved
          </button>
          <button
            onClick={() => setFilterDifficulty('hard')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              filterDifficulty === 'hard'
                ? 'bg-red-500 text-white shadow'
                : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
            }`}
          >
            Hard Only
          </button>
          <button
            onClick={() => setFilterDifficulty('medium')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              filterDifficulty === 'medium'
                ? 'bg-amber-500 text-white shadow'
                : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
            }`}
          >
            Medium Only
          </button>
          <button
            onClick={() => setFilterDifficulty('easy')}
            className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
              filterDifficulty === 'easy'
                ? 'bg-[#9FE600] text-[#080A0A] shadow'
                : 'text-[#A4ADAA] hover:text-[#F2F5F2]'
            }`}
          >
            Easy Only
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {sortedStudents.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          {/* #2 Silver (Left) */}
          {top2 && (
            <div
              onClick={() => onSelectStudent(top2.id || top2.regNo)}
              className="cursor-pointer rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl hover:border-[#9FE600]/60 transition-all text-center space-y-4 order-2 md:order-1 relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#9FE600]/5 blur-2xl pointer-events-none" />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9FE600]/20 text-[#9FE600] border border-[#9FE600]/30 shadow-lg">
                <span className="font-mono text-xl font-black">2</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F2F5F2]">{top2.name}</h3>
                <p className="font-mono text-xs text-[#A4ADAA]">{top2.regNo}</p>
                <p className="text-[11px] text-[#B6FF00] font-mono mt-0.5">@{top2.leetcodeUsername}</p>
              </div>
              <div className="rounded-2xl border border-[#222828] bg-[#0D1010]/80 p-3">
                <div className="text-[10px] uppercase font-bold text-[#A4ADAA]">Total Solved</div>
                <div className="font-mono text-2xl font-black text-[#9FE600]">{top2.total}</div>
                <div className="text-[11px] text-[#A4ADAA] mt-1 flex justify-center gap-2">
                  <span>E: {top2.easy}</span>
                  <span>M: {top2.medium}</span>
                  <span>H: {top2.hard}</span>
                </div>
              </div>
            </div>
          )}

          {/* #1 Gold (Center, Elevated) */}
          {top1 && (
            <div
              onClick={() => onSelectStudent(top1.id || top1.regNo)}
              className="cursor-pointer rounded-3xl border-2 border-[#B6FF00] bg-[#121616] p-8 shadow-2xl shadow-[#B6FF00]/10 hover:brightness-105 transition-all text-center space-y-4 order-1 md:order-2 relative -mt-4"
            >
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full bg-[#B6FF00]/15 blur-3xl pointer-events-none" />
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B6FF00] text-[#080A0A] shadow-xl shadow-[#B6FF00]/30">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <div className="inline-block rounded-full bg-[#B6FF00]/20 px-3 py-0.5 text-[10px] font-black uppercase text-[#B6FF00] tracking-wider mb-1">
                  Champion Rank 1
                </div>
                <h3 className="text-xl font-black text-[#F2F5F2]">{top1.name}</h3>
                <p className="font-mono text-xs text-[#A4ADAA]">{top1.regNo}</p>
                <p className="text-xs text-[#B6FF00] font-mono mt-0.5">@{top1.leetcodeUsername}</p>
              </div>
              <div className="rounded-2xl border border-[#B6FF00]/30 bg-[#0D1010] p-4">
                <div className="text-[10px] uppercase font-bold text-[#A4ADAA]">Total Solved</div>
                <div className="font-mono text-3xl font-black text-[#B6FF00]">{top1.total}</div>
                <div className="text-xs text-[#A4ADAA] mt-1 flex justify-center gap-3">
                  <span className="text-[#9FE600]">E: {top1.easy}</span>
                  <span className="text-amber-400">M: {top1.medium}</span>
                  <span className="text-red-400">H: {top1.hard}</span>
                </div>
              </div>
            </div>
          )}

          {/* #3 Bronze (Right) */}
          {top3 && (
            <div
              onClick={() => onSelectStudent(top3.id || top3.regNo)}
              className="cursor-pointer rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl hover:border-[#C8FF33]/60 transition-all text-center space-y-4 order-3 md:order-3 relative overflow-hidden"
            >
              <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-[#C8FF33]/5 blur-2xl pointer-events-none" />
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8FF33]/20 text-[#C8FF33] border border-[#C8FF33]/30 shadow-lg">
                <span className="font-mono text-xl font-black">3</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F2F5F2]">{top3.name}</h3>
                <p className="font-mono text-xs text-[#A4ADAA]">{top3.regNo}</p>
                <p className="text-[11px] text-[#B6FF00] font-mono mt-0.5">@{top3.leetcodeUsername}</p>
              </div>
              <div className="rounded-2xl border border-[#222828] bg-[#0D1010]/80 p-3">
                <div className="text-[10px] uppercase font-bold text-[#A4ADAA]">Total Solved</div>
                <div className="font-mono text-2xl font-black text-[#C8FF33]">{top3.total}</div>
                <div className="text-[11px] text-[#A4ADAA] mt-1 flex justify-center gap-2">
                  <span>E: {top3.easy}</span>
                  <span>M: {top3.medium}</span>
                  <span>H: {top3.hard}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranks 4+ Table */}
      <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
          <span>Overall Standings</span>
          <span className="rounded-md bg-[#151919] px-2 py-0.5 text-[10px] font-bold text-[#A4ADAA] border border-[#222828]">
            {sortedStudents.length} Students
          </span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-[#222828] bg-[#0D1010]/40">
          <table className="w-full text-left text-xs text-[#F2F5F2]">
            <thead className="border-b border-[#222828] bg-[#0D1010] text-[11px] font-bold uppercase tracking-wider text-[#A4ADAA]">
              <tr>
                <th className="px-4 py-3.5">Rank</th>
                <th className="px-4 py-3.5">Reg No</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">LeetCode Handle</th>
                <th className="px-4 py-3.5 text-right text-[#9FE600]">Easy</th>
                <th className="px-4 py-3.5 text-right text-amber-400">Medium</th>
                <th className="px-4 py-3.5 text-right text-red-400">Hard</th>
                <th className="px-4 py-3.5 text-right text-[#B6FF00]">Total Solved</th>
                <th className="px-4 py-3.5 text-right">Rating</th>
                <th className="px-4 py-3.5 text-right">Today's Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222828]/50">
              {sortedStudents.map((student, idx) => {
                const diff = getDiffDisplay(student.diff);
                const rank = idx + 1;
                return (
                  <tr
                    key={student.id || student.regNo}
                    onClick={() => onSelectStudent(student.id || student.regNo)}
                    className="cursor-pointer transition-all hover:bg-[#151919]"
                  >
                    <td className="px-4 py-3 font-mono font-bold">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs border ${getRankBadgeClass(
                          rank
                        )}`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#A4ADAA]">{student.regNo}</td>
                    <td className="px-4 py-3 font-bold text-[#F2F5F2]">{student.name}</td>
                    <td className="px-4 py-3 text-[#A4ADAA]">
                      <span className="rounded-md bg-[#151919] px-2 py-0.5 text-[11px] font-semibold text-[#DDE3DF] border border-[#222828]">
                        {student.department || 'N/A'} {student.section ? `• Sec ${student.section}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#B6FF00]">
                      @{student.leetcodeUsername}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#9FE600]">{student.easy}</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-400">{student.medium}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">{student.hard}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-sm text-[#B6FF00]">
                      {student.total}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#F2F5F2]">
                      {student.contestRating ? Math.round(student.contestRating) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] ${diff.bgClass} ${diff.colorClass}`}>
                        {diff.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
