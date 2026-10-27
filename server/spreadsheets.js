// Port of Analyzer's column alias matching, handle normalization and duplicate checks.
// ExcelJS replaces SheetJS, while preserving the roster import/export workflow.
import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { parse, profileSchema, email, fail } from './validation.js';
import { extractLeetCodeUsername } from '../integrations/analyzer/provider.js';
export async function parseStudents(buffer, filename) {
  const workbook = new ExcelJS.Workbook();
  if (filename.toLowerCase().endsWith('.csv')) await workbook.csv.read(Readable.from([buffer]));
  else if (filename.toLowerCase().endsWith('.xlsx')) await workbook.xlsx.load(buffer);
  else fail('Upload a .csv or .xlsx file. Legacy .xls files must first be saved as .xlsx.');
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2) fail('The spreadsheet has no student rows.');
  if (sheet.rowCount > 501) fail('Import up to 500 students at a time.');
  const headers = sheet.getRow(1).values.map(v => String(v || '').trim().toLowerCase());
  const findKey = candidates => headers.findIndex(k => candidates.some(c => k === c));
  const columns = {
    name: findKey(['name', 'student name', 'student_name', 'full name']),
    email: findKey(['email', 'email address', 'college email']),
    leetcode: findKey(['leetcode', 'leetcode url', 'leetcode_url', 'leetcode link', 'leetcode profile', 'username']),
    department: findKey(['department', 'dept', 'branch']), section: findKey(['section', 'sec']), semester: findKey(['semester', 'sem'])
  };
  for (const key of ['name', 'email', 'leetcode']) if (columns[key] < 1) fail(`Missing required column: ${key}. Download the import template.`);
  const students = [], errors = [], seenEmails = new Set(), seenUsernames = new Set();
  for (let row = 2; row <= sheet.rowCount; row++) {
    if (!sheet.getRow(row).hasValues) continue;
    const value = key => columns[key] > 0 ? sheet.getRow(row).getCell(columns[key]).text.trim() : '';
    try {
      const address = parse(email, value('email'));
      const username = extractLeetCodeUsername(value('leetcode')).toLowerCase();
      const student = parse(profileSchema, { name: value('name'), leetcode: username,
        ...(value('department') ? { department: value('department').toUpperCase() } : {}),
        ...(value('section') ? { section: value('section').toUpperCase() } : {}),
        ...(value('semester') ? { semester: value('semester') } : {}) });
      if (seenEmails.has(address)) fail('Duplicate email in file.');
      if (username && seenUsernames.has(username)) fail('Duplicate LeetCode handle in file.');
      seenEmails.add(address); if (username) seenUsernames.add(username);
      students.push({ ...student, email: address, leetcode: username || undefined });
    } catch (e) { errors.push(`Row ${row}: ${e.message}`); }
  }
  if (errors.length) fail(errors.slice(0, 20).join('\n'));
  if (!students.length) fail('The spreadsheet has no valid student rows.');
  return students;
}
export async function studentWorkbook(rows, { csv = false } = {}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('LeetTrack students');
  const keys = ['name', 'email', 'leetcode', 'status', 'total', 'easy', 'medium', 'hard', 'rating'];
  sheet.columns = keys.map(key => ({ header: key, key, width: key === 'email' ? 32 : key === 'name' ? 25 : 18 }));
  for (const row of rows) sheet.addRow(Object.fromEntries(keys.map(k => {
    let value = row[k] ?? '';
    if (typeof value === 'string' && /^[=+@\-\t\r]/.test(value)) value = `'${value}`;
    return [k, value];
  })));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF235F46' } };
  sheet.autoFilter = { from: 'A1', to: 'I1' };
  return csv ? workbook.csv.writeBuffer() : workbook.xlsx.writeBuffer();
}
