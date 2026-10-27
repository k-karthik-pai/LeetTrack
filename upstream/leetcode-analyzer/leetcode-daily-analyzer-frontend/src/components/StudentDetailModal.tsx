'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Flame,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import { formatNumber } from '@/lib/utils';

interface StudentDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose }) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await api.getStudentHistory(studentId);
        if (res.success) {
          setData(res);
        } else {
          // Fallback to student endpoint
          const fallback = await api.getStudentById(studentId);
          if (fallback.success) setData(fallback);
        }
      } catch (err) {
        console.error('Error loading student details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [studentId]);

  if (!studentId) return null;

  const student = data?.student;
  const history = data?.history || [];
  const latestStat = history[history.length - 1] || student?.latestStat || {};

  const chartData = history.map((h: any) => ({
    date: formatDisplayDate(h.date),
    total: h.total,
    easy: h.easy,
    medium: h.medium,
    hard: h.hard,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080A0A]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-[#222828] bg-[#121616] p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222828] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B6FF00] text-[#080A0A] font-black text-lg shadow-md shadow-[#B6FF00]/20">
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#F2F5F2]">{student?.name || 'Student Profile'}</h2>
                <span className="rounded-md bg-[#151919] px-2 py-0.5 text-[10px] font-bold text-[#B6FF00] border border-[#222828]">
                  {student?.department || 'N/A'} {student?.section ? `• Sec ${student.section}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-mono text-[#A4ADAA]">{student?.regNo}</span>
                {student?.leetcodeUrl && (
                  <a
                    href={student.leetcodeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[#B6FF00] hover:underline"
                  >
                    <span>@{student.leetcodeUsername || 'profile'}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-[#222828] bg-[#0D1010] p-2 text-[#A4ADAA] hover:text-[#F2F5F2]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#B6FF00] border-t-transparent" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Metric Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-[#222828] bg-[#0D1010] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-[#A4ADAA]">Total Solved</div>
                <div className="font-mono text-2xl font-black text-[#B6FF00] mt-1">
                  {formatNumber(latestStat.total || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#222828] bg-[#0D1010] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-[#9FE600]">Easy</div>
                <div className="font-mono text-2xl font-black text-[#F2F5F2] mt-1">
                  {formatNumber(latestStat.easy || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#222828] bg-[#0D1010] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-amber-400">Medium</div>
                <div className="font-mono text-2xl font-black text-[#F2F5F2] mt-1">
                  {formatNumber(latestStat.medium || 0)}
                </div>
              </div>

              <div className="rounded-2xl border border-[#222828] bg-[#0D1010] p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-red-400">Hard</div>
                <div className="font-mono text-2xl font-black text-[#F2F5F2] mt-1">
                  {formatNumber(latestStat.hard || 0)}
                </div>
              </div>
            </div>

            {/* Historical Progression Chart */}
            <div className="rounded-3xl border border-[#222828] bg-[#0D1010] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#F2F5F2] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#B6FF00]" />
                  <span>Historical Problem Progression</span>
                </h3>
                <span className="text-[11px] text-[#A4ADAA] font-mono">
                  {history.length} snapshots recorded
                </span>
              </div>

              {chartData.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222828" vertical={false} />
                      <XAxis dataKey="date" stroke="#A4ADAA" fontSize={11} tickLine={false} />
                      <YAxis stroke="#A4ADAA" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#121616',
                          borderColor: '#222828',
                          borderRadius: '12px',
                          color: '#F2F5F2',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#B6FF00"
                        strokeWidth={3}
                        dot={{ fill: '#B6FF00', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total Solved"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-[#A4ADAA]">
                  No historical snapshot points recorded yet.
                </div>
              )}
            </div>

            {/* Additional Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-3">
                <span className="text-[#A4ADAA] text-[10px] uppercase font-bold">Contest Rating</span>
                <div className="font-mono text-sm font-bold text-[#F2F5F2] mt-0.5">
                  {latestStat.contestRating ? Math.round(latestStat.contestRating) : 'N/A'}
                </div>
              </div>

              <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-3">
                <span className="text-[#A4ADAA] text-[10px] uppercase font-bold">Global Rank</span>
                <div className="font-mono text-sm font-bold text-[#F2F5F2] mt-0.5">
                  {latestStat.globalRank ? `#${formatNumber(latestStat.globalRank)}` : 'N/A'}
                </div>
              </div>

              <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-3">
                <span className="text-[#A4ADAA] text-[10px] uppercase font-bold">Submissions</span>
                <div className="font-mono text-sm font-bold text-[#F2F5F2] mt-0.5">
                  {formatNumber(latestStat.submissions || 0)}
                </div>
              </div>

              <div className="rounded-xl border border-[#222828] bg-[#0D1010] p-3">
                <span className="text-[#A4ADAA] text-[10px] uppercase font-bold">Account Status</span>
                <div className="font-mono text-sm font-bold text-[#B6FF00] mt-0.5">
                  {latestStat.status || 'Active'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
