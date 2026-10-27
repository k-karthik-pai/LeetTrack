export interface LeetCodeProfileStats {
  username: string;
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
  status: 'SUCCESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'FAILED';
  errorMessage?: string | null;
}

export interface StudentInput {
  sNo?: number | null;
  regNo: string;
  name: string;
  leetcodeUrl: string;
  leetcodeUsername: string;
  department?: string; // Department code (e.g. ECE)
  section?: string;    // Section name (e.g. C)
  departmentId?: string;
  sectionId?: string;
}

export interface QueueItem {
  id: string; // studentId or temporary id
  sNo?: number | null;
  regNo: string;
  name: string;
  leetcodeUrl: string;
  leetcodeUsername: string;
  department?: string;
  section?: string;
  departmentId?: string;
  sectionId?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'FAILED';
  errorMessage?: string | null;
  stats?: LeetCodeProfileStats | null;
}

export interface BatchAnalysisStatus {
  isActive: boolean;
  snapshotDate: string;
  department?: string | null;
  section?: string | null;
  total: number;
  processed: number;
  successful: number;
  notFound: number;
  rateLimited: number;
  failed: number;
  currentUsername: string | null;
  percentage: number;
  items: QueueItem[];
  startedAt: string | null;
  completedAt: string | null;
  isComplete: boolean;
  error?: string | null;
}

