'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  BarChart3,
  History,
  Download,
  Settings,
} from 'lucide-react';
import { TabType } from '@/lib/types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  totalStudents: number;
  analyzedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  totalStudents,
  analyzedCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: 'students',
      label: 'Student Directory',
      icon: <Users className="h-4 w-4" />,
      badge: totalStudents > 0 ? `${totalStudents}` : undefined,
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      id: 'analytics',
      label: 'Performance Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      id: 'history',
      label: 'Daily Snapshots',
      icon: <History className="h-4 w-4" />,
    },
    {
      id: 'export',
      label: 'Report Export',
      icon: <Download className="h-4 w-4" />,
    },
    {
      id: 'settings',
      label: 'Configuration',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#222828] bg-[#0D1010]/80 p-4 space-y-6 flex-shrink-0">
      {/* Navigation tabs */}
      <nav className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold text-[#A4ADAA] uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#B6FF00] text-[#080A0A] font-bold shadow-lg shadow-[#B6FF00]/15'
                  : 'text-[#A4ADAA] hover:bg-[#151919] hover:text-[#F2F5F2]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#080A0A]' : 'text-[#B6FF00]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-[#080A0A] text-[#B6FF00]'
                      : 'bg-[#151919] text-[#A4ADAA] border border-[#222828]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Snapshot quick stats card */}
      <div className="rounded-2xl border border-[#222828] bg-[#121616] p-4 space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#A4ADAA]">Profile Coverage</span>
          <span className="font-mono text-xs font-bold text-[#B6FF00]">
            {totalStudents > 0 ? Math.round((analyzedCount / totalStudents) * 100) : 0}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C2222]">
          <div
            className="h-full rounded-full bg-[#B6FF00] transition-all duration-500"
            style={{
              width: `${totalStudents > 0 ? (analyzedCount / totalStudents) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#A4ADAA]">
          <span>Analysed: {analyzedCount}</span>
          <span>Total: {totalStudents}</span>
        </div>
      </div>
    </aside>
  );
};
