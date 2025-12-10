/**
 * Date utility functions for period analysis and comparisons
 */

/**
 * Get the first day of the previous month
 */
export function getFirstDayOfPreviousMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

/**
 * Get the last day of the previous month
 */
export function getLastDayOfPreviousMonth(): string {
  const date = new Date();
  date.setDate(0); // Sets to last day of previous month
  return date.toISOString().split('T')[0];
}

/**
 * Get the first day of the current month
 */
export function getFirstDayOfCurrentMonth(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display (e.g., "Jan 1, 2025")
 */
export function formatDateForDisplay(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
