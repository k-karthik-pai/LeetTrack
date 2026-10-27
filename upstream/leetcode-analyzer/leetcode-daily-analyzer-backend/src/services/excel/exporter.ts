import * as XLSX from 'xlsx';

export interface ExportRow {
  sNo: number;
  regNo: string;
  name: string;
  department: string;
  section: string;
  leetcodeUrl: string;
  leetcodeUsername: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  contestRating: number | string;
  globalRank: number | string;
  totalSubmissions: number;
  acceptanceRate: string;
  activeDays: number | string;
  currentStreak: number | string;
  maxStreak: number | string;
  status: string;
  date: string;
}

export function generateSnapshotExcel(rows: ExportRow[], snapshotDate: string): Buffer {
  const data = rows.map((r) => ({
    'S.NO': r.sNo,
    'REG NO': r.regNo,
    'NAME': r.name,
    'DEPARTMENT': r.department,
    'SECTION': r.section,
    'LEETCODE URL': r.leetcodeUrl,
    'LEETCODE USERNAME': r.leetcodeUsername,
    'EASY': r.easy,
    'MEDIUM': r.medium,
    'HARD': r.hard,
    'TOTAL': r.total,
    'CONTEST RATING': r.contestRating,
    'GLOBAL RANK': r.globalRank,
    'TOTAL SUBMISSIONS': r.totalSubmissions,
    'ACCEPTANCE RATE': r.acceptanceRate,
    'ACTIVE DAYS': r.activeDays,
    'CURRENT STREAK': r.currentStreak,
    'MAX STREAK': r.maxStreak,
    'STATUS': r.status,
    'DATE': r.date,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Snapshot_${snapshotDate}`);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateSnapshotCSV(rows: ExportRow[]): string {
  const headers = [
    'S.NO',
    'REG NO',
    'NAME',
    'DEPARTMENT',
    'SECTION',
    'LEETCODE URL',
    'LEETCODE USERNAME',
    'EASY',
    'MEDIUM',
    'HARD',
    'TOTAL',
    'CONTEST RATING',
    'GLOBAL RANK',
    'TOTAL SUBMISSIONS',
    'ACCEPTANCE RATE',
    'ACTIVE DAYS',
    'CURRENT STREAK',
    'MAX STREAK',
    'STATUS',
    'DATE',
  ];

  const lines = [headers.join(',')];

  for (const r of rows) {
    const values = [
      r.sNo,
      `"${r.regNo}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.department}"`,
      `"${r.section}"`,
      `"${r.leetcodeUrl}"`,
      `"${r.leetcodeUsername}"`,
      r.easy,
      r.medium,
      r.hard,
      r.total,
      r.contestRating === 'N/A' ? '' : r.contestRating,
      r.globalRank === 'N/A' ? '' : r.globalRank,
      r.totalSubmissions,
      `"${r.acceptanceRate}"`,
      r.activeDays === 'N/A' ? '' : r.activeDays,
      r.currentStreak === 'N/A' ? '' : r.currentStreak,
      r.maxStreak === 'N/A' ? '' : r.maxStreak,
      `"${r.status}"`,
      `"${r.date}"`,
    ];
    lines.push(values.join(','));
  }

  return lines.join('\n');
}
