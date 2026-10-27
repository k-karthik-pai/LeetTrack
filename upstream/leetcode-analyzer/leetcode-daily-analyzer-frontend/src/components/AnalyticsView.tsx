'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Sparkles, TrendingUp, Award } from 'lucide-react';
import { StudentProfile, SnapshotSummary } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface AnalyticsViewProps {
  students: StudentProfile[];
  snapshotsHistory: any[];
  topImprovers: StudentProfile[];
  onSelectStudent: (id: string) => void;
  summary: SnapshotSummary;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  students,
  snapshotsHistory,
  topImprovers,
  onSelectStudent,
  summary,
}) => {
  const activeStudents = students.filter((s) => s.status === 'SUCCESS');

  // Distribution Data (Pie Chart)
  const difficultyData = [
    { name: 'Easy', value: summary.totalEasy, color: '#9FE600' },
    { name: 'Medium', value: summary.totalMedium, color: '#FBBF24' },
    { name: 'Hard', value: summary.totalHard, color: '#EF4444' },
  ];

  // Solved Milestones Tiers
  const tier0_50 = activeStudents.filter((s) => s.total <= 50).length;
  const tier51_150 = activeStudents.filter((s) => s.total > 50 && s.total <= 150).length;
  const tier151_300 = activeStudents.filter((s) => s.total > 150 && s.total <= 300).length;
  const tier301_500 = activeStudents.filter((s) => s.total > 300 && s.total <= 500).length;
  const tier500Plus = activeStudents.filter((s) => s.total > 500).length;

  const milestoneData = [
    { range: '0-50', count: tier0_50 },
    { range: '51-150', count: tier51_150 },
    { range: '151-300', count: tier151_300 },
    { range: '301-500', count: tier301_500 },
    { range: '500+', count: tier500Plus },
  ];

  // Top 8 Solvers Bar Chart
  const topSolvers = [...activeStudents]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((s) => ({
      name: s.name.split(' ')[0],
      total: s.total,
      easy: s.easy,
      medium: s.medium,
      hard: s.hard,
    }));

  return (
    <div className="space-y-8">
      {/* Top Section: Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Breakdown */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center justify-between">
            <span>Overall Difficulty Distribution</span>
            <span className="text-xs text-[#A4ADAA] font-mono">
              Total: {formatNumber(summary.totalProblemsSolved)}
            </span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
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
                    borderRadius: '12px',
                    color: '#F2F5F2',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className="rounded-xl border border-[#222828] bg-[#0D1010]/80 p-2">
              <div className="text-[10px] font-bold text-[#9FE600] uppercase">Easy</div>
              <div className="font-mono text-base font-black text-[#F2F5F2]">
                {formatNumber(summary.totalEasy)}
              </div>
            </div>
            <div className="rounded-xl border border-[#222828] bg-[#0D1010]/80 p-2">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Medium</div>
              <div className="font-mono text-base font-black text-[#F2F5F2]">
                {formatNumber(summary.totalMedium)}
              </div>
            </div>
            <div className="rounded-xl border border-[#222828] bg-[#0D1010]/80 p-2">
              <div className="text-[10px] font-bold text-red-400 uppercase">Hard</div>
              <div className="font-mono text-base font-black text-[#F2F5F2]">
                {formatNumber(summary.totalHard)}
              </div>
            </div>
          </div>
        </div>

        {/* Problem Volume Tiers */}
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center justify-between">
            <span>Student Problem Milestone Tiers</span>
            <span className="text-xs text-[#A4ADAA] font-mono">{activeStudents.length} Profiles</span>
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milestoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222828" vertical={false} />
                <XAxis dataKey="range" stroke="#A4ADAA" fontSize={11} tickLine={false} />
                <YAxis stroke="#A4ADAA" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1010',
                    borderColor: '#222828',
                    borderRadius: '12px',
                    color: '#F2F5F2',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#B6FF00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-[#A4ADAA] text-center">
            Number of students bucketed by total solved algorithmic problems
          </div>
        </div>
      </div>

      {/* Top Improvers Row */}
      {topImprovers && topImprovers.length > 0 && (
        <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#B6FF00]" />
            <span>Today's Top Improvers & Daily Growth</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {topImprovers.map((st) => (
              <div
                key={st.id || st.regNo}
                onClick={() => onSelectStudent(st.id || st.regNo)}
                className="cursor-pointer rounded-2xl border border-[#222828] bg-[#0D1010] p-4 hover:border-[#B6FF00]/50 transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#F2F5F2]">{st.name}</h4>
                  <p className="font-mono text-[11px] text-[#A4ADAA]">{st.regNo}</p>
                  <p className="text-[10px] text-[#B6FF00] font-mono">Total: {st.total}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-lg bg-[#142010] border border-[#284518] px-2.5 py-1 font-mono text-xs font-black text-[#B6FF00]">
                    +{st.diff}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 8 Solvers Stacked Chart */}
      <div className="rounded-3xl border border-[#222828] bg-[#121616] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-[#F2F5F2] flex items-center gap-2">
          <Award className="h-4 w-4 text-[#B6FF00]" />
          <span>Top Solvers Problem Composition</span>
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSolvers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222828" vertical={false} />
              <XAxis dataKey="name" stroke="#A4ADAA" fontSize={11} tickLine={false} />
              <YAxis stroke="#A4ADAA" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0D1010',
                  borderColor: '#222828',
                  borderRadius: '12px',
                  color: '#F2F5F2',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="easy" stackId="a" fill="#9FE600" radius={[0, 0, 0, 0]} name="Easy" />
              <Bar dataKey="medium" stackId="a" fill="#FBBF24" radius={[0, 0, 0, 0]} name="Medium" />
              <Bar dataKey="hard" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} name="Hard" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
