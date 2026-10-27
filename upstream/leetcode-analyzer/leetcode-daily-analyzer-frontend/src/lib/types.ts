export type TabType = 'dashboard' | 'students' | 'leaderboard' | 'analytics' | 'history' | 'export' | 'settings';

export interface StudentInput {
  sNo?: number;
  regNo: string;
  name: string;
  leetcodeUrl: string;
  leetcodeUsername?: string;
  department?: string;
  section?: string;
}

export interface StudentProfile {
  id: string;
  sNo?: number;
  regNo: string;
  name: string;
  department?: string;
  section?: string;
  leetcodeUrl: string;
  leetcodeUsername: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  diff: number | null;
  contestRating: number | null;
  globalRank: number | null;
  submissions: number;
  activeDays?: number | null;
  currentStreak?: number | null;
  status: 'SUCCESS' | 'NOT_FOUND' | 'FAILED' | 'RATE_LIMITED' | string;
  errorMessage?: string;
  rank?: number;
  fetchedAt?: string;
}

export interface SnapshotSummary {
  totalStudents: number;
  profilesAnalysed: number;
  profilesFailed: number;
  totalProblemsSolved: number;
  avgProblemsSolved: number;
  totalEasy: number;
  totalMedium: number;
  totalHard: number;
  totalSubmissions?: number;
}

export interface SnapshotData {
  id: string;
  snapshotDate: string;
  createdAt: string;
  isToday: boolean;
  previousDate: string | null;
  department?: string;
  section?: string;
  summary: SnapshotSummary;
  topImprovers: StudentProfile[];
  students: StudentProfile[];
}

export interface SectionItem {
  id: string;
  name: string;
}

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  studentCount?: number;
  sections: SectionItem[];
}

export interface QueueItem {
  id: string;
  student: StudentInput;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'NOT_FOUND' | 'FAILED' | 'RATE_LIMITED';
  retries: number;
  result?: any;
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
