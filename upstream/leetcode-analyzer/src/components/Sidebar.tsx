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
  Flame,
  CheckCircle2,
} from 'lucide-react';

export type TabType = 'dashboard' | 'students' | 'leaderboard' | 'analytics' | 'history' | 'export' | 'settings';

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
  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as TabType, label: 'Students', icon: Users },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'history' as TabType, label: 'Daily History', icon: History },
    { id: 'export' as TabType, label: 'Export', icon: Download },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 border-r border-[#222828] bg-[#0A0C0C] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex w-full items-center gap-3 py-2.5 px-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[rgba(182,255,0,0.08)] text-[#B6FF00] border-l-2 border-[#B6FF00] rounded-r-xl rounded-l-none font-semibold shadow-[0_0_15px_rgba(182,255,0,0.02)]'
                    : 'text-[#8F9995] hover:bg-[#111414] hover:text-[#F2F5F2] rounded-xl'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#B6FF00]' : 'text-[#8F9995]'}`} />
                <span>{item.label}</span>
                {item.id === 'leaderboard' && (
                  <span className="ml-auto flex h-2 w-2 rounded-full bg-[#B6FF00] shadow-sm shadow-[#B6FF00]/50" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Snapshot status footer */}
      <div className="mt-6 rounded-xl border border-[#222828] bg-[#121616] p-3.5">
        <div className="flex items-center justify-between text-xs text-[#8F9995] mb-2">
          <span className="flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-[#B6FF00]" />
            <span>Active Snapshot</span>
          </span>
          <span className="font-mono font-bold text-[#F2F5F2]">
            {analyzedCount}/{totalStudents}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1B2020] p-0 border border-[#222828]/40">
          <div
            className="h-full rounded-full bg-[#B6FF00] transition-all duration-500 shadow-[0_0_8px_rgba(182,255,0,0.5)]"
            style={{
              width: `${totalStudents > 0 ? (analyzedCount / totalStudents) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-[#68716E]">
          <CheckCircle2 className="h-3 w-3 text-[#B6FF00]" />
          <span>Non-destructive persistence</span>
        </div>
      </div>
    </aside>
  );
};
