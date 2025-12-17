/**
 * Unit tests for timezone conversion
 */

import {
  formatInBusinessTimezone,
  isValidTimezone,
  getDefaultTimezone,
} from '../lib/utils/timezone'

describe('Timezone Utilities', () => {
  describe('formatInBusinessTimezone', () => {
    it('should format UTC date in business timezone', () => {
      const utcDate = '2024-01-15T15:00:00Z' // 3 PM UTC
      const result = formatInBusinessTimezone(utcDate, 'America/New_York')
      // Should show time in EST/EDT (typically 10 AM or 11 AM depending on DST)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('should handle invalid timezone gracefully', () => {
      const utcDate = '2024-01-15T15:00:00Z'
      const result = formatInBusinessTimezone(utcDate, 'Invalid/Timezone')
      // Should fallback to UTC formatting
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should format different timezones correctly', () => {
      const utcDate = '2024-01-15T12:00:00Z' // Noon UTC
      const nyResult = formatInBusinessTimezone(utcDate, 'America/New_York')
      const laResult = formatInBusinessTimezone(utcDate, 'America/Los_Angeles')
      
      // Both should be valid formatted strings
      expect(nyResult).toBeTruthy()
      expect(laResult).toBeTruthy()
      // LA should be 3 hours behind NY (or 4 hours depending on DST)
      expect(nyResult).not.toBe(laResult)
    })
  })

  describe('isValidTimezone', () => {
    it('should validate correct timezones', () => {
      expect(isValidTimezone('America/New_York')).toBe(true)
      expect(isValidTimezone('America/Los_Angeles')).toBe(true)
      expect(isValidTimezone('Europe/London')).toBe(true)
      expect(isValidTimezone('UTC')).toBe(true)
    })

    it('should reject invalid timezones', () => {
      expect(isValidTimezone('Invalid/Timezone')).toBe(false)
      expect(isValidTimezone('')).toBe(false)
      expect(isValidTimezone('NotATimezone')).toBe(false)
    })
  })

  describe('getDefaultTimezone', () => {
    it('should return America/New_York', () => {
      expect(getDefaultTimezone()).toBe('America/New_York')
    })
  })
})
