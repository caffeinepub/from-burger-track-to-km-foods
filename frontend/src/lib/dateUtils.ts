/**
 * Convert a JS Date to nanosecond bigint (ICP Time format).
 * The backend stores dates as day-level timestamps (midnight UTC).
 */
export function dateToBigIntNs(date: Date): bigint {
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);
  return BigInt(midnight.getTime()) * BigInt(1_000_000);
}

/**
 * Convert a nanosecond bigint to a JS Date.
 */
export function bigIntNsToDate(ns: bigint): Date {
  return new Date(Number(ns / BigInt(1_000_000)));
}

/**
 * Format a nanosecond bigint as a time string (HH:MM).
 */
export function formatTime(ns: bigint): string {
  const date = new Date(Number(ns / BigInt(1_000_000)));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a Date as YYYY-MM-DD for input[type=date].
 */
export function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a YYYY-MM-DD string to a Date (local midnight).
 */
export function parseDateInput(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date for display (e.g., "Monday, 24 Feb 2026").
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a number as currency string.
 */
export function formatCurrency(amount: bigint | number): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(num);
}

/**
 * Generate a simple unique ID for new staff.
 */
export function generateStaffId(): string {
  return `staff_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
