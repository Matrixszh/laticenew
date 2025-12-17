/**
 * Unit tests for appointment conflict detection
 * Verifies that conflicts are detected correctly including BusyBlocks and HOLD status
 */

import { checkAppointmentConflicts } from '../lib/airtable/utils'
import { airtableBase } from '../lib/airtable/client'

// Mock Airtable client
jest.mock('../lib/airtable/client', () => ({
  airtableBase: jest.fn(),
}))

describe('Appointment Conflict Detection', () => {
  const businessId = 'test-business-id'
  const startUtc = '2024-01-15T10:00:00Z'
  const endUtc = '2024-01-15T11:00:00Z'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should detect conflicts with HOLD status appointments', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        fields: {
          Business: [businessId],
          Status: 'HOLD',
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
    ]

    const mockBusyBlocks: any[] = []

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest
              .fn()
              .mockResolvedValue(
                mockAppointments.filter((a) =>
                  ['HOLD', 'CONFIRMED'].includes(a.fields.Status as string)
                )
              ),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    const hasConflict = await checkAppointmentConflicts(businessId, startUtc, endUtc)
    expect(hasConflict).toBe(true)
  })

  it('should detect conflicts with CONFIRMED status appointments', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        fields: {
          Business: [businessId],
          Status: 'CONFIRMED',
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
    ]

    const mockBusyBlocks: any[] = []

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockAppointments),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    const hasConflict = await checkAppointmentConflicts(businessId, startUtc, endUtc)
    expect(hasConflict).toBe(true)
  })

  it('should detect conflicts with BusyBlocks', async () => {
    const mockAppointments: any[] = []

    const mockBusyBlocks = [
      {
        id: 'busy-1',
        fields: {
          Business: [businessId],
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
    ]

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockAppointments),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    const hasConflict = await checkAppointmentConflicts(businessId, startUtc, endUtc)
    expect(hasConflict).toBe(true)
  })

  it('should not detect conflicts with CANCELLED or COMPLETED appointments', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        fields: {
          Business: [businessId],
          Status: 'CANCELLED',
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
      {
        id: 'appt-2',
        fields: {
          Business: [businessId],
          Status: 'COMPLETED',
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
    ]

    const mockBusyBlocks: any[] = []

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockAppointments),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    const hasConflict = await checkAppointmentConflicts(businessId, startUtc, endUtc)
    expect(hasConflict).toBe(false)
  })

  it('should exclude appointment being updated from conflict check', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        fields: {
          Business: [businessId],
          Status: 'CONFIRMED',
          'Start UTC': '2024-01-15T10:30:00Z',
          'End UTC': '2024-01-15T11:30:00Z',
        },
      },
    ]

    const mockBusyBlocks: any[] = []

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockAppointments),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    // Should not conflict with itself
    const hasConflict = await checkAppointmentConflicts(
      businessId,
      startUtc,
      endUtc,
      'appt-1'
    )
    expect(hasConflict).toBe(false)
  })

  it('should return false when no conflicts exist', async () => {
    const mockAppointments: any[] = []
    const mockBusyBlocks: any[] = []

    ;(airtableBase as jest.Mock).mockImplementation((table: string) => {
      if (table === 'Appointments') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockAppointments),
          }),
        }
      }
      if (table === 'BusyBlocks') {
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue(mockBusyBlocks),
          }),
        }
      }
    })

    const hasConflict = await checkAppointmentConflicts(businessId, startUtc, endUtc)
    expect(hasConflict).toBe(false)
  })
})
