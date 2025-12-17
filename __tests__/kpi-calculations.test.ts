/**
 * Unit tests for KPI calculations
 */

import { calculateKPIs, getDefaultDateRange, getTodayDateRange } from '../lib/utils/kpi-calculations'

describe('KPI Calculations', () => {
  const mockInteractions = [
    {
      fields: { Type: 'Call', Direction: 'Inbound' },
      createdTime: '2024-01-15T10:00:00Z',
    },
    {
      fields: { Type: 'Call', Direction: 'Inbound' },
      createdTime: '2024-01-16T10:00:00Z',
    },
    {
      fields: { Type: 'SMS', Direction: 'Inbound' },
      createdTime: '2024-01-17T10:00:00Z',
    },
    {
      fields: { Type: 'Call', Direction: 'Outbound' },
      createdTime: '2024-01-18T10:00:00Z',
    },
  ]

  const mockLeads = [
    {
      fields: { Status: 'New' },
      createdTime: '2024-01-10T10:00:00Z',
    },
    {
      fields: { Status: 'Contacted' },
      createdTime: '2024-01-11T10:00:00Z',
    },
    {
      fields: { Status: 'Qualified' },
      createdTime: '2024-01-12T10:00:00Z',
    },
    {
      fields: { Status: 'Closed' },
      createdTime: '2024-01-13T10:00:00Z',
    },
    {
      fields: { Status: 'Lost' },
      createdTime: '2024-01-14T10:00:00Z',
    },
  ]

  describe('calculateKPIs', () => {
    it('should calculate incoming calls correctly', () => {
      const result = calculateKPIs(mockInteractions, mockLeads)
      expect(result.incomingCalls).toBe(2) // Only Call + Inbound
    })

    it('should calculate leads contacted correctly', () => {
      const result = calculateKPIs(mockInteractions, mockLeads)
      expect(result.leadsContacted).toBe(2) // Contacted + Qualified
    })

    it('should calculate leads closed correctly', () => {
      const result = calculateKPIs(mockInteractions, mockLeads)
      expect(result.leadsClosed).toBe(1) // Only Closed
    })

    it('should calculate conversion rate correctly', () => {
      const result = calculateKPIs(mockInteractions, mockLeads)
      expect(result.conversionRate).toBe(20) // 1 closed / 5 total = 20%
    })

    it('should filter by date range', () => {
      const dateRange = {
        startDate: '2024-01-15',
        endDate: '2024-01-18',
      }
      const result = calculateKPIs(mockInteractions, mockLeads, dateRange)
      // Only interactions in date range
      expect(result.incomingCalls).toBe(2) // 2 inbound calls in range
    })

    it('should handle empty data', () => {
      const result = calculateKPIs([], [])
      expect(result.incomingCalls).toBe(0)
      expect(result.leadsContacted).toBe(0)
      expect(result.leadsClosed).toBe(0)
      expect(result.conversionRate).toBe(0)
    })
  })

  describe('Date range helpers', () => {
    it('should return default date range (last 30 days)', () => {
      const range = getDefaultDateRange()
      expect(range.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(range.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return today date range', () => {
      const range = getTodayDateRange()
      const today = new Date().toISOString().split('T')[0]
      expect(range.startDate).toBe(today)
      expect(range.endDate).toBe(today)
    })
  })
})
