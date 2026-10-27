import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const APP_TIMEZONE = 'Asia/Kolkata';

export function getTodayDateString(): string {
  const zonedDate = toZonedTime(new Date(), APP_TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd');
}

export function formatDisplayDate(dateString: string): string {
  try {
    const parsed = parseISO(dateString);
    return format(parsed, 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatFullDate(dateString: string): string {
  try {
    const parsed = parseISO(dateString);
    return format(parsed, 'EEEE, MMMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const parsed = parseISO(dateString);
    return format(parsed, 'dd/MM/yy');
  } catch {
    return dateString;
  }
}
