/**
 * Timezone Conversion Utilities
 * Converts UTC times to business timezone and vice versa
 * Uses Intl API for timezone support (no external dependencies)
 */

import { format } from 'date-fns'

/**
 * Convert UTC date string to business timezone Date object
 * Note: JavaScript Date objects are always in UTC internally
 * This function creates a date that represents the same moment in time
 */
export function convertUtcToBusinessTimezone(
  utcDateString: string,
  businessTimezone: string
): Date {
  // Parse UTC date string
  const utcDate = new Date(utcDateString)
  return utcDate // Date objects are always UTC internally
}

/**
 * Format date in business timezone
 */
export function formatInBusinessTimezone(
  utcDateString: string,
  businessTimezone: string,
  formatString: string = 'MMM d, yyyy h:mm a'
): string {
  if (!utcDateString) {
    return '—'
  }
  try {
    const date = new Date(utcDateString)
    
    // Use Intl.DateTimeFormat to get timezone-aware formatting
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: businessTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    
    // For more control, we can use format but need to adjust for timezone
    // For now, use Intl for basic formatting
    if (formatString === 'MMM d, yyyy h:mm a') {
      return formatter.format(date)
    }
    
    // Fallback: format the date and manually adjust display
    // This is a simplified version - for full date-fns compatibility, 
    // we'd need date-fns-tz, but we'll use Intl API instead
    const parts = formatter.formatToParts(date)
    const month = parts.find(p => p.type === 'month')?.value || ''
    const day = parts.find(p => p.type === 'day')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''
    const hour = parts.find(p => p.type === 'hour')?.value || ''
    const minute = parts.find(p => p.type === 'minute')?.value || ''
    const dayPeriod = parts.find(p => p.type === 'dayPeriod')?.value || ''
    
    return `${month} ${day}, ${year} ${hour}:${minute} ${dayPeriod}`
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    console.warn(`Invalid timezone: ${businessTimezone}, using UTC`)
    const date = new Date(utcDateString)
    return format(date, formatString)
  }
}

/**
 * Convert business timezone date to UTC
 * Note: This is a helper for when you have a local time and need UTC
 */
export function convertBusinessTimezoneToUtc(
  businessDate: Date,
  businessTimezone: string
): Date {
  // JavaScript Date objects are always UTC internally
  // This function is mainly for API consistency
  return businessDate
}

/**
 * Get default timezone (America/New_York)
 */
export function getDefaultTimezone(): string {
  return 'America/New_York'
}

/**
 * Validate timezone string
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}
