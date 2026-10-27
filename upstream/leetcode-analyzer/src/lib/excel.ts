import * as XLSX from 'xlsx';
import { extractLeetCodeUsername } from './leetcode/fetcher';
import { StudentInput } from './leetcode/types';

export interface ParseExcelResult {
  success: boolean;
  students: StudentInput[];
  validCount: number;
  invalidCount: number;
  totalCount: number;
  duplicateCount?: number;
  missingColumns?: string[];
  errors?: string[];
  warnings?: string[];
  duplicates?: string[];
}

export function parseStudentExcel(
  buffer: ArrayBuffer | Buffer,
  defaultDepartment?: string,
  defaultSection?: string
): ParseExcelResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        students: [],
        validCount: 0,
        invalidCount: 0,
        totalCount: 0,
        errors: ['The uploaded Excel workbook contains no sheets.'],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (rawData.length === 0) {
      return {
        success: false,
        students: [],
        validCount: 0,
        invalidCount: 0,
        totalCount: 0,
        errors: ['The uploaded Excel sheet contains no data rows.'],
      };
    }

    // Identify columns with case-insensitive matching
    const sampleRow = rawData[0];
    const keys = Object.keys(sampleRow);

    const findKey = (candidates: string[]): string | undefined => {
      return keys.find((k) =>
        candidates.some((c) => k.trim().toLowerCase() === c.trim().toLowerCase())
      );
    };

    const sNoKey = findKey(['s.no', 'sno', 's no', 'sl no', 'sl.no', 'serial no', 's_no', 'id']);
    const regNoKey = findKey(['reg no', 'regno', 'reg.no', 'reg_no', 'register number', 'roll no', 'rollno', 'register no']);
    const nameKey = findKey(['name', 'student name', 'student_name', 'full name']);
    const urlKey = findKey(['leetcode url', 'leetcode_url', 'leetcode link', 'leetcode', 'leetcode profile', 'url', 'profile url', 'leetcode id', 'username']);
    const deptKey = findKey(['department', 'dept', 'branch']);
    const secKey = findKey(['section', 'sec']);

    const missingColumns: string[] = [];
    if (!regNoKey) missingColumns.push('REG NO');
    if (!nameKey) missingColumns.push('NAME');
    if (!urlKey) missingColumns.push('LEETCODE URL');

    if (missingColumns.length > 0) {
      return {
        success: false,
        students: [],
        validCount: 0,
        invalidCount: 0,
        totalCount: rawData.length,
        missingColumns,
        errors: [`Missing required column(s): ${missingColumns.join(', ')}`],
      };
    }

    const students: StudentInput[] = [];
    let validCount = 0;
    let invalidCount = 0;
    const warnings: string[] = [];
    const duplicates: string[] = [];

    const seenRegNos = new Set<string>();
    const seenUsernames = new Set<string>();

    rawData.forEach((row, index) => {
      const rowNum = index + 2; // considering 1-based index + header
      const rawRegNo = String(row[regNoKey!]).trim();
      const rawName = String(row[nameKey!]).trim();
      const rawUrl = String(row[urlKey!]).trim();
      const rawSNo = sNoKey && row[sNoKey] ? parseInt(String(row[sNoKey]).trim(), 10) : index + 1;
      const rawDept = deptKey && row[deptKey] ? String(row[deptKey]).trim().toUpperCase() : defaultDepartment;
      const rawSec = secKey && row[secKey] ? String(row[secKey]).trim().toUpperCase() : defaultSection;

      if (!rawRegNo && !rawName && !rawUrl) {
        // Skip empty row
        return;
      }

      if (!rawRegNo) {
        warnings.push(`Row ${rowNum}: Missing Register Number`);
        invalidCount++;
        return;
      }

      const normalizedRegNo = rawRegNo.toUpperCase();
      if (seenRegNos.has(normalizedRegNo)) {
        duplicates.push(`Row ${rowNum}: Duplicate Register Number "${rawRegNo}" found in file`);
        warnings.push(`Row ${rowNum}: Duplicate Register Number "${rawRegNo}"`);
      } else {
        seenRegNos.add(normalizedRegNo);
      }

      const username = extractLeetCodeUsername(rawUrl);

      if (!username) {
        warnings.push(`Row ${rowNum} (${rawName || rawRegNo}): Invalid or missing LeetCode URL: "${rawUrl}"`);
        invalidCount++;
      } else {
        const lowerUser = username.toLowerCase();
        if (seenUsernames.has(lowerUser)) {
          duplicates.push(`Row ${rowNum}: Duplicate LeetCode username "@${username}" found in file`);
        } else {
          seenUsernames.add(lowerUser);
        }
        validCount++;
      }

      students.push({
        sNo: isNaN(rawSNo) ? index + 1 : rawSNo,
        regNo: rawRegNo,
        name: rawName || 'Unknown',
        leetcodeUrl: rawUrl.startsWith('http') ? rawUrl : `https://leetcode.com/u/${username}/`,
        leetcodeUsername: username,
        department: rawDept || defaultDepartment || undefined,
        section: rawSec || defaultSection || undefined,
      });
    });

    return {
      success: true,
      students,
      validCount,
      invalidCount,
      totalCount: students.length,
      duplicateCount: duplicates.length,
      duplicates,
      warnings: warnings.slice(0, 15),
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      students: [],
      validCount: 0,
      invalidCount: 0,
      totalCount: 0,
      errors: [error?.message || 'Failed to parse Excel file'],
    };
  }
}

/**
 * Generates an Excel buffer for a daily snapshot export with Department and Section
 */
export function generateSnapshotExcel(
  records: Array<{
    sNo: number | null;
    regNo: string;
    name: string;
    department?: string | null;
    section?: string | null;
    leetcodeUrl: string;
    leetcodeUsername: string;
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
    snapshotDate: string;
  }>
): Buffer {
  const exportData = records.map((r, idx) => ({
    'S.NO': r.sNo ?? idx + 1,
    'REG NO': r.regNo,
    'NAME': r.name,
    'DEPARTMENT': r.department ?? 'N/A',
    'SECTION': r.section ?? 'N/A',
    'LEETCODE URL': r.leetcodeUrl,
    'LEETCODE USERNAME': r.leetcodeUsername,
    'EASY': r.easy,
    'MEDIUM': r.medium,
    'HARD': r.hard,
    'TOTAL': r.total,
    'CONTEST RATING': r.contestRating ?? 'N/A',
    'GLOBAL RANK': r.globalRank ?? 'N/A',
    'SUBMISSIONS': r.submissions ?? 'N/A',
    'ACCEPTANCE RATE': r.acceptanceRate !== null ? `${r.acceptanceRate}%` : 'N/A',
    'ACTIVE DAYS': r.activeDays ?? 'N/A',
    'CURRENT STREAK': r.currentStreak ?? 'N/A',
    'MAX STREAK': r.maxStreak ?? 'N/A',
    'STATUS': r.status,
    'DATE': r.snapshotDate,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for beautiful presentation
  worksheet['!cols'] = [
    { wch: 8 },  // S.NO
    { wch: 14 }, // REG NO
    { wch: 22 }, // NAME
    { wch: 14 }, // DEPARTMENT
    { wch: 10 }, // SECTION
    { wch: 38 }, // LEETCODE URL
    { wch: 18 }, // LEETCODE USERNAME
    { wch: 8 },  // EASY
    { wch: 10 }, // MEDIUM
    { wch: 8 },  // HARD
    { wch: 10 }, // TOTAL
    { wch: 16 }, // CONTEST RATING
    { wch: 14 }, // GLOBAL RANK
    { wch: 14 }, // SUBMISSIONS
    { wch: 18 }, // ACCEPTANCE RATE
    { wch: 14 }, // ACTIVE DAYS
    { wch: 16 }, // CURRENT STREAK
    { wch: 14 }, // MAX STREAK
    { wch: 14 }, // STATUS
    { wch: 14 }, // DATE
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LeetCode Daily Snapshot');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Generates CSV content string for a daily snapshot export with Department and Section
 */
export function generateSnapshotCSV(
  records: Array<{
    sNo: number | null;
    regNo: string;
    name: string;
    department?: string | null;
    section?: string | null;
    leetcodeUrl: string;
    leetcodeUsername: string;
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
    snapshotDate: string;
  }>
): string {
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
    'SUBMISSIONS',
    'ACCEPTANCE RATE',
    'ACTIVE DAYS',
    'CURRENT STREAK',
    'MAX STREAK',
    'STATUS',
    'DATE',
  ];

  const rows = records.map((r, idx) => [
    r.sNo ?? idx + 1,
    `"${(r.regNo || '').replace(/"/g, '""')}"`,
    `"${(r.name || '').replace(/"/g, '""')}"`,
    `"${(r.department || 'N/A').replace(/"/g, '""')}"`,
    `"${(r.section || 'N/A').replace(/"/g, '""')}"`,
    `"${(r.leetcodeUrl || '').replace(/"/g, '""')}"`,
    `"${(r.leetcodeUsername || '').replace(/"/g, '""')}"`,
    r.easy,
    r.medium,
    r.hard,
    r.total,
    r.contestRating ?? 'N/A',
    r.globalRank ?? 'N/A',
    r.submissions ?? 'N/A',
    r.acceptanceRate !== null ? `"${r.acceptanceRate}%"` : 'N/A',
    r.activeDays ?? 'N/A',
    r.currentStreak ?? 'N/A',
    r.maxStreak ?? 'N/A',
    r.status,
    r.snapshotDate,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Generates a clean sample Excel file template for users
 */
export function generateSampleExcelTemplate(): Buffer {
  const sampleData = [
    {
      'S.NO': 1,
      'REG NO': '23ECR001',
      'NAME': 'Kavin P',
      'LEETCODE URL': 'https://leetcode.com/u/Kavinn07/',
    },
    {
      'S.NO': 2,
      'REG NO': '23ECR002',
      'NAME': 'Abijeeth M',
      'LEETCODE URL': 'https://leetcode.com/u/neal_wu/',
    },
    {
      'S.NO': 3,
      'REG NO': '23ECR003',
      'NAME': 'Dharani S',
      'LEETCODE URL': 'https://leetcode.com/u/tourist/',
    },
    {
      'S.NO': 4,
      'REG NO': '23ECR004',
      'NAME': 'Rahul V',
      'LEETCODE URL': 'https://leetcode.com/u/lee215/',
    },
    {
      'S.NO': 5,
      'REG NO': '23ECR005',
      'NAME': 'Sneha K',
      'LEETCODE URL': 'https://leetcode.com/u/StefanPochmann/',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 20 },
    { wch: 40 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

