'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Award, Zap, Flame, Target, ExternalLink, Eye, TrendingUp } from 'lucide-react';
import { EnrichedStudentStat } from '@/lib/ranking';
import { formatNumber, formatDecimal } from '@/lib/utils';

interface LeaderboardViewProps {
  students: EnrichedStudentStat[];
  onSelectStudent: (studentId: string) => void;
  snapshotDate: string;
}

type CategoryType = 'TOTAL' | 'HARD' | 'MEDIUM' | 'EASY' | 'RATING';

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  students,
  onSelectStudent,
  snapshotDate,
}) => {
  const [category, setCategory] = useState<CategoryType>('TOTAL');

  const successfulStudents = useMemo(() => {
    return students.filter((s) => s.status === 'SUCCESS');
  }, [students]);

  const rankedList = useMemo(() => {
    return [...successfulStudents].sort((a, b) => {
      if (category === 'TOTAL') {
        if (b.total !== a.total) return b.total - a.total;
        if (b.hard !== a.hard) return b.hard - a.hard;
        if (b.medium !== a.medium) return b.medium - a.medium;
        return b.easy - a.easy;
      }
      if (category === 'HARD') {
        if (b.hard !== a.hard) return b.hard - a.hard;
        return b.total - a.total;
      }
      if (category === 'MEDIUM') {
        if (b.medium !== a.medium) return b.medium - a.medium;
        return b.total - a.total;
      }
      if (category === 'EASY') {
        if (b.easy !== a.easy) return b.easy - a.easy;
        return b.total - a.total;
      }
      if (category === 'RATING') {
        const rA = a.contestRating ?? 0;
        const rB = b.contestRating ?? 0;
        if (rB !== rA) return rB - rA;
        return b.total - a.total;
      }
      return 0;
    });
  }, [successfulStudents, category]);

  const top1 = rankedList[0];
  const top2 = rankedList[1];
  const top3 = rankedList[2];
  const rest = rankedList.slice(3);

  const getMetricDisplay = (student: EnrichedStudentStat) => {
    if (category === 'TOTAL') return { value: formatNumber(student.total), label: 'Problems' };
    if (category === 'HARD') return { value: formatNumber(student.hard), label: 'Hard Solved' };
    if (category === 'MEDIUM') return { value: formatNumber(student.medium), label: 'Medium Solved' };
    if (category === 'EASY') return { value: formatNumber(student.easy), label: 'Easy Solved' };
    if (category === 'RATING') return { value: student.contestRating ? formatDecimal(student.contestRating, 1) : 'N/A', label: 'Rating' };
    return { value: formatNumber(student.total), label: 'Problems' };
  };

  return (
    <div className="space-y-6">
      {/* Category selector pill bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#222828] bg-[#121616] p-4">
        <div>
          <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#B6FF00]" />
            <span>LeetCode Hall of Fame</span>
          </h2>
          <p className="text-xs text-[#A4ADAA]">Class rankings based on verified LeetCode metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#222828] bg-[#0D1010] p-1">
          <button
            onClick={() => setCategory('TOTAL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              category === 'TOTAL'
                ? 'bg-[#B6FF00] text-[#080A0A] shadow-sm shadow-[#B6FF00]/10 font-bold'
                : 'text-[#8F9995] hover:text-[#F2F5F2]'
            }`}
          >
            Overall Total
          </button>
          <button
            onClick={() => setCategory('HARD')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              category === 'HARD'
                ? 'bg-[#ff375f] text-white shadow-sm font-bold'
                : 'text-[#8F9995] hover:text-[#F2F5F2]'
            }`}
          >
            Hard Solved
          </button>
          <button
            onClick={() => setCategory('MEDIUM')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              category === 'MEDIUM'
                ? 'bg-[#ffc01e] text-[#080A0A] shadow-sm font-bold'
                : 'text-[#8F9995] hover:text-[#F2F5F2]'
            }`}
          >
            Medium Solved
          </button>
          <button
            onClick={() => setCategory('EASY')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              category === 'EASY'
                ? 'bg-[#B6FF00] text-[#080A0A] shadow-sm font-bold'
                : 'text-[#8F9995] hover:text-[#F2F5F2]'
            }`}
          >
            Easy Solved
          </button>
          <button
            onClick={() => setCategory('RATING')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              category === 'RATING'
                ? 'bg-[#B6FF00] text-[#080A0A] shadow-sm font-bold'
                : 'text-[#8F9995] hover:text-[#F2F5F2]'
            }`}
          >
            Contest Rating
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {rankedList.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* #2 Silver */}
          {top2 && (
            <div className="order-2 md:order-1 flex flex-col items-center rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-lg transition-transform hover:-translate-y-1">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#A4ADAA] font-mono text-2xl font-black text-[#080A0A] shadow-md">
                  {top2.name.charAt(0)}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#A4ADAA] font-bold text-[#080A0A] border-2 border-[#121616] text-xs shadow">
                  02
                </span>
              </div>
              <h3 className="font-bold text-[#F2F5F2] text-base text-center">{top2.name}</h3>
              <p className="font-mono text-xs text-[#A4ADAA]">{top2.regNo}</p>
              <div className="my-3 text-center">
                <div className="font-mono text-2xl font-extrabold text-[#F2F5F2]">
                  {getMetricDisplay(top2).value}
                </div>
                <div className="text-[11px] text-[#A4ADAA]">{getMetricDisplay(top2).label}</div>
              </div>
              <button
                onClick={() => onSelectStudent(top2.studentId)}
                className="mt-2 w-full rounded-xl border border-[#2A3030] bg-[#151919] py-1.5 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-colors"
              >
                View Profile
              </button>
            </div>
          )}

          {/* #1 Gold (Taller & Glowing) */}
          {top1 && (
            <div className="order-1 md:order-2 flex flex-col items-center rounded-2xl border border-[#B6FF00]/40 bg-gradient-to-b from-[#B6FF00]/05 via-[#121616] to-[#121616] p-6 shadow-2xl glow-primary transition-transform hover:-translate-y-1 md:-mt-4">
              <div className="relative mb-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#B6FF00] font-mono text-3xl font-black text-[#080A0A] shadow-lg shadow-[#B6FF00]/30">
                  {top1.name.charAt(0)}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#B6FF00] font-bold text-[#080A0A] border-2 border-[#121616] text-sm shadow">
                  01
                </span>
              </div>
              <span className="rounded-full bg-[#B6FF00]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#B6FF00] border border-[#B6FF00]/30 mb-1">
                CHAMPION
              </span>
              <h3 className="font-extrabold text-[#F2F5F2] text-lg text-center">{top1.name}</h3>
              <p className="font-mono text-xs text-[#B6FF00] font-semibold">{top1.regNo}</p>
              <div className="my-3 text-center">
                <div className="font-mono text-3xl font-black text-[#B6FF00]">
                  {getMetricDisplay(top1).value}
                </div>
                <div className="text-xs text-[#A4ADAA]">{getMetricDisplay(top1).label}</div>
              </div>
              <button
                onClick={() => onSelectStudent(top1.studentId)}
                className="mt-2 w-full rounded-xl bg-[#B6FF00] py-2 text-xs font-bold text-[#080A0A] shadow-md shadow-[#B6FF00]/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                View Profile
              </button>
            </div>
          )}

          {/* #3 Bronze */}
          {top3 && (
            <div className="order-3 md:order-3 flex flex-col items-center rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-lg transition-transform hover:-translate-y-1">
              <div className="relative mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#68716E] font-mono text-2xl font-black text-[#080A0A] shadow-md">
                  {top3.name.charAt(0)}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#68716E] font-bold text-[#F2F5F2] border-2 border-[#121616] text-xs shadow">
                  03
                </span>
              </div>
              <h3 className="font-bold text-[#F2F5F2] text-base text-center">{top3.name}</h3>
              <p className="font-mono text-xs text-[#A4ADAA]">{top3.regNo}</p>
              <div className="my-3 text-center">
                <div className="font-mono text-2xl font-extrabold text-[#F2F5F2]">
                  {getMetricDisplay(top3).value}
                </div>
                <div className="text-[11px] text-[#A4ADAA]">{getMetricDisplay(top3).label}</div>
              </div>
              <button
                onClick={() => onSelectStudent(top3.studentId)}
                className="mt-2 w-full rounded-xl border border-[#2A3030] bg-[#151919] py-1.5 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-colors"
              >
                View Profile
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Leaderboard List Table */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] overflow-hidden shadow-xl">
        <div className="border-b border-[#222828] bg-[#0D1010] px-5 py-3.5 flex items-center justify-between">
          <span className="text-xs font-bold text-[#A4ADAA] uppercase tracking-wider">
            Full Ranked Roster ({rankedList.length} students)
          </span>
          <span className="text-xs text-[#68716E]">Snapshot: {snapshotDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-[#222828] bg-[#0D1010] text-[#A4ADAA] font-semibold">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Reg No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">LeetCode ID</th>
                <th className="px-4 py-3 text-center text-[#B6FF00]">Easy</th>
                <th className="px-4 py-3 text-center text-[#ffc01e]">Medium</th>
                <th className="px-4 py-3 text-center text-[#ff375f]">Hard</th>
                <th className="px-4 py-3 text-center font-bold text-[#B6FF00]">Total</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202626] bg-[#111414] font-medium">
              {rankedList.map((student, idx) => (
                <tr key={student.id} className="hover:bg-[rgba(182,255,0,0.04)] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">
                    {idx === 0 ? (
                      <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/30 text-[10px] font-bold font-mono">01</span>
                    ) : idx === 1 ? (
                      <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-[#A4ADAA]/10 text-[#A4ADAA] border border-[#A4ADAA]/30 text-[10px] font-bold font-mono">02</span>
                    ) : idx === 2 ? (
                      <span className="inline-flex items-center justify-center h-5 w-7 rounded bg-[#8F9995]/10 text-[#8F9995] border border-[#8F9995]/30 text-[10px] font-bold font-mono">03</span>
                    ) : (
                      <span className="text-[#68716E] pl-1">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#F2F5F2]">{student.regNo}</td>
                  <td className="px-4 py-3 font-semibold text-[#F2F5F2]">{student.name}</td>
                  <td className="px-4 py-3 font-mono text-[#A4ADAA]">@{student.leetcodeUsername}</td>
                  <td className="px-4 py-3 text-center font-mono text-[#B6FF00]">{student.easy}</td>
                  <td className="px-4 py-3 text-center font-mono text-[#ffc01e]">{student.medium}</td>
                  <td className="px-4 py-3 text-center font-mono text-[#ff375f]">{student.hard}</td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-[#B6FF00] bg-[#121616]">
                    {student.total}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[#A4ADAA]">
                    {student.contestRating ? formatDecimal(student.contestRating, 1) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectStudent(student.studentId)}
                      className="rounded-lg border border-[#2A3030] bg-[#151919] px-2.5 py-1 text-xs font-medium text-[#DDE3DF] hover:border-[#B6FF00] hover:text-[#B6FF00] transition-colors"
                    >
                      Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
