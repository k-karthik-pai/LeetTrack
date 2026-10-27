export interface StudentInput {
  sNo?: number;
  regNo: string;
  name: string;
  leetcodeUrl: string;
  leetcodeUsername?: string;
  department?: string;
  section?: string;
}

export interface LeetCodeProfileStats {
  username: string;
  realName?: string | null;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  ranking: number | null;
  reputation?: number;
  contestRating?: number | null;
  globalRanking?: number | null;
  acceptanceRate?: number | null;
  totalSubmissions?: number;
  activeDays?: number | null;
  currentStreak?: number | null;
  maxStreak?: number | null;
  status: 'SUCCESS' | 'NOT_FOUND' | 'FAILED' | 'RATE_LIMITED';
  errorMessage?: string;
  fetchedAt: string;
}

export interface QueueItem {
  id: string;
  student: StudentInput;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'NOT_FOUND' | 'FAILED' | 'RATE_LIMITED';
  retries: number;
  result?: LeetCodeProfileStats;
  errorMessage?: string;
}

export interface BatchAnalysisStatus {
  batchId: string;
  snapshotDate: string;
  department?: string;
  section?: string;
  total: number;
  processed: number;
  success: number;
  failed: number;
  notFound: number;
  rateLimited: number;
  pending: number;
  isActive: boolean;
  isComplete: boolean;
  startedAt: string | null;
  completedAt: string | null;
  items: QueueItem[];
}
