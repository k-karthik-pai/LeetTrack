'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Award, Zap, Flame, Target, Users } from 'lucide-react';
import { EnrichedStudentStat } from '@/lib/ranking';
import { formatNumber, formatDecimal } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/date';

interface AnalyticsViewProps {
  students: EnrichedStudentStat[];
  snapshotsHistory: Array<{ snapshotDate: string; totalSolved: number; avgSolved: number }>;
  topImprovers: EnrichedStudentStat[];
  onSelectStudent: (studentId: string) => void;
  summary: {
    totalStudents: number;
    profilesAnalysed: number;
    totalProblemsSolved: number;
    avgProblemsSolved: number;
    totalEasy: number;
    totalMedium: number;
    totalHard: number;
  };
}

const DIFFICULTY_COLORS = {
  Easy: '#B6FF00',
  Medium: '#ffc01e',
  Hard: '#ff375f',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  snapshotsHistory,
  topImprovers,
  onSelectStudent,
  summary,
}) => {
  const successful = students.filter((s) => s.status === 'SUCCESS');

  // 1. Difficulty breakdown
  const difficultyData = [
    { name: 'Easy', value: summary.totalEasy, color: DIFFICULTY_COLORS.Easy },
    { name: 'Medium', value: summary.totalMedium, color: DIFFICULTY_COLORS.Medium },
    { name: 'Hard', value: summary.totalHard, color: DIFFICULTY_COLORS.Hard },
  ];

  // 2. Daily Growth Trend
  const growthData = [...snapshotsHistory]
    .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
    .map((s) => ({
      date: formatDisplayDate(s.snapshotDate),
      rawDate: s.snapshotDate,
      totalSolved: s.totalSolved,
      avgSolved: s.avgSolved,
    }));

  // 3. Problem solving tiers distribution
  const tiers = [
    { name: '< 50', count: 0 },
    { name: '50 - 150', count: 0 },
    { name: '151 - 300', count: 0 },
    { name: '301 - 500', count: 0 },
    { name: '500+', count: 0 },
  ];

  successful.forEach((s) => {
    if (s.total < 50) tiers[0].count++;
    else if (s.total <= 150) tiers[1].count++;
    else if (s.total <= 300) tiers[2].count++;
    else if (s.total <= 500) tiers[3].count++;
    else tiers[4].count++;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5">
        <h2 className="text-lg font-bold text-[#F2F5F2] flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#B6FF00]" />
          <span>Batch Performance Analytics</span>
        </h2>
        <p className="text-xs text-[#A4ADAA]">
          In-depth insights, problem difficulty distribution, and daily progress trends
        </p>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Growth Across Snapshots */}
        <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F2]">Daily Cumulative Growth</h3>
              <p className="text-xs text-[#A4ADAA]">Total problems solved across snapshot dates</p>
            </div>
            <span className="rounded-lg bg-[#B6FF00]/10 px-2.5 py-1 text-xs font-semibold text-[#B6FF00] border border-[#B6FF00]/20">
              {growthData.length} Snapshots
            </span>
          </div>
          <div className="h-64 w-full">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B6FF00" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B6FF00" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#68716E" fontSize={11} />
                  <YAxis stroke="#68716E" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1010',
                      borderColor: '#222828',
                      borderRadius: '0.75rem',
                      color: '#F2F5F2',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSolved"
                    name="Total Solved"
                    stroke="#B6FF00"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#growthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[#68716E]">
                Upload and run snapshots on multiple days to see cumulative growth trends.
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Distribution Chart */}
        <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F2]">Difficulty Breakdown</h3>
              <p className="text-xs text-[#A4ADAA]">Class aggregate solved proportion</p>
            </div>
            <div className="font-mono text-sm font-bold text-[#F2F5F2]">
              {formatNumber(summary.totalProblemsSolved)} Total
            </div>
          </div>
          <div className="h-52 w-full relative flex items-center justify-center">
            {summary.totalProblemsSolved > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1010',
                      borderColor: '#222828',
                      borderRadius: '0.75rem',
                      color: '#F2F5F2',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-[#68716E]">No difficulty stats available</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#222828] text-center text-xs font-semibold">
            <div className="rounded-lg bg-[#B6FF00]/10 p-2 text-[#B6FF00]">
              <div>Easy</div>
              <div className="font-mono text-sm font-bold">{formatNumber(summary.totalEasy)}</div>
            </div>
            <div className="rounded-lg bg-[#ffc01e]/10 p-2 text-[#ffc01e]">
              <div>Medium</div>
              <div className="font-mono text-sm font-bold">{formatNumber(summary.totalMedium)}</div>
            </div>
            <div className="rounded-lg bg-[#ff375f]/10 p-2 text-[#ff375f]">
              <div>Hard</div>
              <div className="font-mono text-sm font-bold">{formatNumber(summary.totalHard)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Improvers & Tiers Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Improvers Leaderboard */}
        <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#B6FF00]" />
                <span>Top Improvers Today</span>
              </h3>
              <p className="text-xs text-[#A4ADAA]">Students with the highest daily problem increase</p>
            </div>
          </div>

          {topImprovers.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#68716E]">
              No daily increase detected or only 1 snapshot date recorded so far.
            </div>
          ) : (
            <div className="space-y-2">
              {topImprovers.map((imp, idx) => (
                <div
                  key={imp.id}
                  onClick={() => onSelectStudent(imp.studentId)}
                  className="flex items-center justify-between rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3 hover:border-[#B6FF00]/30 hover:bg-[#111414] cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#151919] font-mono text-xs font-bold text-[#A4ADAA] border border-[#222828]">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-[#F2F5F2] text-xs sm:text-sm">{imp.name}</div>
                      <div className="font-mono text-[11px] text-[#68716E]">{imp.regNo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#68716E]">Total: {imp.total}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#B6FF00]/10 px-3 py-1 text-xs font-bold text-[#B6FF00] border border-[#B6FF00]/30 shadow-sm">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+{imp.diff}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Problem Solving Tiers Bar Chart */}
        <div className="rounded-2xl border border-[#222828] bg-[#121616] p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#F2F5F2]">Student Solved Count Distribution</h3>
              <p className="text-xs text-[#A4ADAA]">Distribution of students across problem volume tiers</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tiers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#68716E" fontSize={11} />
                <YAxis stroke="#68716E" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1010',
                    borderColor: '#222828',
                    borderRadius: '0.75rem',
                    color: '#F2F5F2',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Students" fill="#B6FF00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
