/**
 * Tests for API readiness gating
 */

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'test-request-id'),
} as any

// Mock tenant context to avoid Clerk in tests
jest.mock('@/lib/auth/tenant', () => ({
  requireBusinessContext: jest.fn().mockResolvedValue({
    businessId: 'test-business',
    role: 'Owner',
    userEmail: 'test@example.com',
  }),
  handleTenantError: jest.fn(),
  TenantError: class extends Error {},
}))

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class {
    nextUrl: URL
    constructor(public url: string) {
      this.nextUrl = new URL(url || 'http://localhost/api/interactions-list')
    }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      headers: {
        set: jest.fn(),
      },
    })),
  },
}))

// Mock the config module
jest.mock('@/lib/config', () => ({
  isAirtableReady: jest.fn(),
  getMissingAirtableVars: jest.fn(() => ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID']),
}))

// Mock the Airtable client
jest.mock('@/lib/airtable/client', () => ({
  airtableBase: jest.fn(),
}))

// Mock requireAirtableReady
jest.mock('@/lib/airtable/utils', () => ({
  requireAirtableReady: jest.fn(),
}))

describe('API Readiness Gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 503 when Airtable is not configured', async () => {
    const { requireAirtableReady } = require('@/lib/airtable/utils')
    requireAirtableReady.mockImplementation(() => {
      const error = new Error('Airtable not configured')
      ;(error as any).status = 503
      ;(error as any).missing = ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID']
      throw error
    })

    // Import the route handler
    const { GET } = await import('@/app/api/interactions-list/route')
    const { NextRequest } = require('next/server')

    const response = await GET(new NextRequest('http://localhost/api/interactions-list'))
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.error).toBe('Airtable not configured')
    expect(data.missing).toEqual(['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID'])
    expect(data.requestId).toBeDefined()
  })

  it('should return 200 when Airtable is configured', async () => {
    const { requireAirtableReady } = require('@/lib/airtable/utils')
    requireAirtableReady.mockImplementation(() => {
      // No error - Airtable is ready
    })

    const { airtableBase } = require('@/lib/airtable/client')
    const mockSelect = {
      all: jest.fn().mockResolvedValue([]),
    }
    airtableBase.mockReturnValue({
      select: jest.fn().mockReturnValue(mockSelect),
    })

    // Import the route handler
    const { GET } = await import('@/app/api/interactions-list/route')
    const { NextRequest } = require('next/server')

    const response = await GET(new NextRequest('http://localhost/api/interactions-list'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })
})

