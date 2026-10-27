import * as XLSX from 'xlsx';
import { StudentInput } from '../../types';

export interface ExcelValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  students: StudentInput[];
  errors: Array<{ row: number; regNo?: string; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
  duplicates: {
    regNos: string[];
    usernames: string[];
  };
}

export function parseAndValidateStudentExcel(buffer: Buffer): ExcelValidationResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel workbook contains no sheets');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rawData.length < 2) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      students: [],
      errors: [{ row: 0, error: 'Excel file is empty or missing data rows' }],
      warnings: [],
      duplicates: { regNos: [], usernames: [] },
    };
  }

  // Detect header row
  let headerRowIndex = 0;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    const row = rawData[i].map((cell) => String(cell || '').trim().toUpperCase());
    const hasRegNo = row.some((c) => c.includes('REG') || c.includes('ROLL') || c.includes('ID'));
    const hasName = row.some((c) => c.includes('NAME') || c.includes('STUDENT'));
    const hasLeetCode = row.some((c) => c.includes('LEETCODE') || c.includes('URL') || c.includes('PROFILE'));

    if (hasRegNo || hasName || hasLeetCode) {
      headerRowIndex = i;
      headers = row;
      break;
    }
  }

  let sNoIdx = headers.findIndex((h) => h === 'S.NO' || h === 'SNO' || h === 'SL NO' || h === 'NO');
  let regNoIdx = headers.findIndex((h) => h.includes('REG') || h.includes('ROLL') || h.includes('REG NO'));
  let nameIdx = headers.findIndex((h) => h.includes('NAME') || h === 'STUDENT NAME');
  let urlIdx = headers.findIndex((h) => h.includes('LEETCODE') || h.includes('URL') || h.includes('PROFILE') || h.includes('LINK'));

  // Default fallback column positions
  if (regNoIdx === -1) regNoIdx = 1;
  if (nameIdx === -1) nameIdx = 2;
  if (urlIdx === -1) urlIdx = 3;
  if (sNoIdx === -1) sNoIdx = 0;

  const students: StudentInput[] = [];
  const errors: Array<{ row: number; regNo?: string; error: string }> = [];
  const warnings: Array<{ row: number; warning: string }> = [];

  const seenRegNos = new Set<string>();
  const duplicateRegNos = new Set<string>();
  const seenUsernames = new Set<string>();
  const duplicateUsernames = new Set<string>();

  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.every((c) => String(c).trim() === '')) continue;

    const rowNum = i + 1;
    const rawSNo = row[sNoIdx];
    const rawRegNo = String(row[regNoIdx] || '').trim();
    const rawName = String(row[nameIdx] || '').trim();
    const rawUrl = String(row[urlIdx] || '').trim();

    if (!rawRegNo && !rawName && !rawUrl) continue;

    if (!rawRegNo) {
      errors.push({ row: rowNum, error: 'Registration Number is required' });
      continue;
    }

    if (!rawName) {
      errors.push({ row: rowNum, regNo: rawRegNo, error: 'Student Name is required' });
      continue;
    }

    if (!rawUrl) {
      errors.push({ row: rowNum, regNo: rawRegNo, error: 'LeetCode URL is required' });
      continue;
    }

    const regNoUpper = rawRegNo.toUpperCase();
    if (seenRegNos.has(regNoUpper)) {
      duplicateRegNos.add(regNoUpper);
      warnings.push({ row: rowNum, warning: `Duplicate Registration Number: ${regNoUpper}` });
    }
    seenRegNos.add(regNoUpper);

    const username = extractUsername(rawUrl);
    if (username) {
      const usernameLower = username.toLowerCase();
      if (seenUsernames.has(usernameLower)) {
        duplicateUsernames.add(username);
        warnings.push({ row: rowNum, warning: `Duplicate LeetCode Username: ${username}` });
      }
      seenUsernames.add(usernameLower);
    } else {
      warnings.push({ row: rowNum, warning: `Could not parse LeetCode username from: "${rawUrl}"` });
    }

    const sNo = typeof rawSNo === 'number' ? rawSNo : parseInt(String(rawSNo), 10) || students.length + 1;

    students.push({
      sNo,
      regNo: regNoUpper,
      name: rawName,
      leetcodeUrl: rawUrl,
      leetcodeUsername: username || rawName,
    });
  }

  return {
    valid: errors.length === 0 && students.length > 0,
    totalRows: rawData.length - (headerRowIndex + 1),
    validRows: students.length,
    invalidRows: errors.length,
    students,
    errors,
    warnings,
    duplicates: {
      regNos: Array.from(duplicateRegNos),
      usernames: Array.from(duplicateUsernames),
    },
  };
}

export function extractUsername(input: string): string {
  if (!input) return '';
  let cleaned = String(input).trim().replace(/\/+$/, '');
  const urlMatch = cleaned.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_\-]+)/i);
  if (urlMatch) return urlMatch[1];
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?leetcode\.com\/?/i, '');
  cleaned = cleaned.replace(/^u\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  return cleaned.trim();
}
