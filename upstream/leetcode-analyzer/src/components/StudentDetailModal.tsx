'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Award,
  Zap,
  Flame,
  Target,
  Calendar,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatNumber, formatPercent, formatDecimal, getStatusBadgeInfo } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/date';

interface StudentHistoryRecord {
  statId: string;
  snapshotDate: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  contestRating: number | null;
  globalRank: number | null;
  submissions: number | null;
  acceptanceRate: number | null;
  activeDays: number | null;
  currentStreak: number | null;
  maxStreak: number | null;
  status: string;
  errorMessage: string | null;
  fetchedAt: string | null;
}

interface StudentDetailData {
  id: string;
  sNo: number | null;
  regNo: string;
  name: string;
  leetcodeUrl: string;
  leetcodeUsername: string;
  latestStat: StudentHistoryRecord | null;
  history: StudentHistoryRecord[];
}

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

const DIFFICULTY_COLORS = {
  Easy: '#00b8a3',
  Medium: '#ffc01e',
  Hard: '#ff375f',
};

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/students/${encodeURIComponent(studentId)}`);
        const json = await res.json();
        if (json.success) {
          setData(json.student);
        } else {
          setError(json.error || 'Failed to load student details');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching student details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  if (!studentId) return null;

  const latest = data?.latestStat;
  const pieData = latest
    ? [
        { name: 'Easy', value: latest.easy, color: DIFFICULTY_COLORS.Easy },
        { name: 'Medium', value: latest.medium, color: DIFFICULTY_COLORS.Medium },
        { name: 'Hard', value: latest.hard, color: DIFFICULTY_COLORS.Hard },
      ]
    : [];

  const chartData = (data?.history || []).map((h) => ({
    date: formatDisplayDate(h.snapshotDate),
    rawDate: h.snapshotDate,
    Total: h.total,
    Easy: h.easy,
    Medium: h.medium,
    Hard: h.hard,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-[#222828] bg-[#121616] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-[#2A3030] bg-[#151919] p-2 text-[#A4ADAA] transition-colors hover:bg-[#111414] hover:text-[#B6FF00]"
        >
          <X className="h-5 w-5" />
        </button>

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B6FF00] border-t-transparent" />
            <p className="text-sm text-[#A4ADAA]">Loading student profile & historical snapshots...</p>
          </div>
        ) : error || !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#E05252]">
            <p className="text-base font-semibold">{error || 'Student not found'}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#151919] border border-[#2A3030] px-4 py-2 text-xs font-semibold text-[#DDE3DF] hover:border-[#B6FF00]"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222828] pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B6FF00] font-mono text-xl font-bold text-[#080A0A] shadow-lg shadow-[#B6FF00]/10">
                  {data.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#F2F5F2] sm:text-2xl">{data.name}</h2>
                    <span className="rounded-lg bg-[#151919] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#A4ADAA] border border-[#222828]">
                      {data.regNo}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#A4ADAA]">
                    <span className="font-mono text-[#B6FF00] font-semibold">@{data.leetcodeUsername}</span>
                    <span>•</span>
                    <a
                      href={data.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#B6FF00] hover:underline"
                    >
                      <span>LeetCode Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              {latest && (
                <div>
                  {(() => {
                    const badge = getStatusBadgeInfo(latest.status);
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <div className="rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
                <span className="text-xs text-[#A4ADAA]">Total Solved</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#B6FF00]">
                  {latest?.status === 'SUCCESS' ? formatNumber(latest.total) : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-[#B6FF00]/20 bg-[#B6FF00]/05 p-3">
                <span className="text-xs text-[#B6FF00]">Easy</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#B6FF00]">
                  {latest?.status === 'SUCCESS' ? formatNumber(latest.easy) : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-[#ffc01e]/20 bg-[#ffc01e]/05 p-3">
                <span className="text-xs text-[#ffc01e]">Medium</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#ffc01e]">
                  {latest?.status === 'SUCCESS' ? formatNumber(latest.medium) : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-[#ff375f]/20 bg-[#ff375f]/05 p-3">
                <span className="text-xs text-[#ff375f]">Hard</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#ff375f]">
                  {latest?.status === 'SUCCESS' ? formatNumber(latest.hard) : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
                <span className="text-xs text-[#A4ADAA]">Contest Rating</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#B6FF00]">
                  {latest?.contestRating ? formatDecimal(latest.contestRating, 1) : 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-[#222828] bg-[#0D1010]/60 p-3">
                <span className="text-xs text-[#A4ADAA]">Global Ranking</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#F2F5F2]">
                  {latest?.globalRank ? `#${formatNumber(latest.globalRank)}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Secondary Stats: Acceptance, Streak, Active Days */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-[#222828] bg-[#0D1010]/40 p-3">
                <Target className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-[11px] text-[#A4ADAA]">Acceptance Rate</div>
                  <div className="font-mono text-sm font-bold text-[#F2F5F2]">
                    {formatPercent(latest?.acceptanceRate)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#222828] bg-[#0D1010]/40 p-3">
                <Activity className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-[11px] text-[#A4ADAA]">Submissions</div>
                  <div className="font-mono text-sm font-bold text-[#F2F5F2]">
                    {formatNumber(latest?.submissions)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#222828] bg-[#0D1010]/40 p-3">
                <Flame className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-[11px] text-[#A4ADAA]">Current Streak</div>
                  <div className="font-mono text-sm font-bold text-[#F2F5F2]">
                    {latest?.currentStreak ? `${latest.currentStreak} days` : 'N/A'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-[#222828] bg-[#0D1010]/40 p-3">
                <Calendar className="h-4 w-4 text-[#B6FF00]" />
                <div>
                  <div className="text-[11px] text-[#A4ADAA]">Active Days</div>
                  <div className="font-mono text-sm font-bold text-[#F2F5F2]">
                    {latest?.activeDays ? `${latest.activeDays} days` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Charts: Growth over Time & Donut Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Historical Area Graph */}
              <div className="lg:col-span-2 rounded-xl border border-[#222828] bg-[#0D1010]/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#F2F5F2] flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-[#B6FF00]" />
                    Problem Solving Progression (Daily Snapshots)
                  </span>
                  <span className="text-[11px] text-[#A4ADAA]">
                    {data.history.length} snapshot{data.history.length === 1 ? '' : 's'} recorded
                  </span>
                </div>
                <div className="h-48 w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
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
                          dataKey="Total"
                          stroke="#B6FF00"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#totalColor)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#68716E]">
                      No historical snapshots recorded yet
                    </div>
                  )}
                </div>
              </div>

              {/* Donut Chart Difficulty Breakdown */}
              <div className="rounded-xl border border-[#222828] bg-[#0D1010]/50 p-4 flex flex-col justify-between">
                <span className="text-xs font-semibold text-[#F2F5F2]">Difficulty Breakdown</span>
                <div className="h-40 w-full relative flex items-center justify-center">
                  {latest && latest.total > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-[#68716E]">No difficulty stats available</div>
                  )}
                  {latest && latest.total > 0 && (
                    <div className="absolute flex flex-col items-center">
                      <span className="font-mono text-lg font-bold text-[#B6FF00]">{latest.total}</span>
                      <span className="text-[10px] text-[#A4ADAA]">Solved</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-around text-xs font-semibold pt-1 border-t border-[#222828]">
                  <span className="text-[#B6FF00]">Easy: {latest?.easy ?? 0}</span>
                  <span className="text-[#ffc01e]">Med: {latest?.medium ?? 0}</span>
                  <span className="text-[#ff375f]">Hard: {latest?.hard ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Date-wise Snapshots Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-[#F2F5F2]">Historical Snapshot Log</h3>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#222828] bg-[#0D1010]/40">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#0D1010] border-b border-[#222828] text-[#A4ADAA] font-semibold">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-center text-[#B6FF00]">Easy</th>
                      <th className="p-2.5 text-center text-[#ffc01e]">Medium</th>
                      <th className="p-2.5 text-center text-[#ff375f]">Hard</th>
                      <th className="p-2.5 text-center font-bold text-[#F2F5F2]">Total</th>
                      <th className="p-2.5 text-center">Rating</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222828]/50 text-[#DDE3DF] font-mono">
                    {data.history.map((rec) => (
                      <tr key={rec.statId} className="hover:bg-[#151919]/50">
                        <td className="p-2.5 font-sans text-[#F2F5F2] font-medium">
                          {formatDisplayDate(rec.snapshotDate)}
                        </td>
                        <td className="p-2.5 text-center text-[#B6FF00]">{rec.easy}</td>
                        <td className="p-2.5 text-center text-[#ffc01e]">{rec.medium}</td>
                        <td className="p-2.5 text-center text-[#ff375f]">{rec.hard}</td>
                        <td className="p-2.5 text-center font-bold text-[#B6FF00]">{rec.total}</td>
                        <td className="p-2.5 text-center text-[#F2F5F2]">{rec.contestRating ?? 'N/A'}</td>
                        <td className="p-2.5 text-center font-sans">
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] border ${
                              rec.status === 'SUCCESS'
                                ? 'bg-[#B6FF00]/10 text-[#B6FF00] border-[#B6FF00]/25'
                                : 'bg-[#E05252]/10 text-[#E05252] border-[#E05252]/25'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
