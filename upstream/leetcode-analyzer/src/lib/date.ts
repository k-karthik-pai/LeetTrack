import { format, parseISO } from 'date-fns';
import { toZonedTime, format as formatZoned } from 'date-fns-tz';

export const APP_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Asia/Kolkata';

/**
 * Returns today's date string formatted as YYYY-MM-DD in the configured timezone (Asia/Kolkata)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const zonedNow = toZonedTime(now, APP_TIMEZONE);
  return formatZoned(zonedNow, 'yyyy-MM-dd', { timeZone: APP_TIMEZONE });
}

/**
 * Formats a YYYY-MM-DD date string into a user-friendly format, e.g. "16 Aug 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parsed = parseISO(dateStr);
    return format(parsed, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats a YYYY-MM-DD date string into full format, e.g. "16 August 2026"
 */
export function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parsed = parseISO(dateStr);
    return format(parsed, 'dd MMMM yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO string to a readable timestamp
 */
export function formatTimestamp(date: Date | string | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const zoned = toZonedTime(d, APP_TIMEZONE);
    return formatZoned(zoned, 'dd MMM yyyy, hh:mm a', { timeZone: APP_TIMEZONE });
  } catch {
    return 'N/A';
  }
}
