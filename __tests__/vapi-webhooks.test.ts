/**
 * Minimal smoke tests for VAPI webhooks
 * - Ensure POST /events and /transcript return 200
 * - Ensure GET /events and /transcript return ok:true
 */

// Mock Next.js modules before importing routes
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(public url: string, public init?: any) {}
    async json() {
      return JSON.parse(this.init?.body || '{}')
    }
    async text() {
      return this.init?.body || ''
    }
    get headers() {
      return new Map(Object.entries(this.init?.headers || {})) as any
    }
    get nextUrl() {
      return { searchParams: new URLSearchParams() }
    }
  },
  NextResponse: {
    json: (body: any, init?: any) => ({
      json: async () => body,
      status: init?.status || 200,
    }),
  },
}))

import { POST as transcriptPost, GET as transcriptGet } from '../app/api/vapi/webhooks/transcript/route'
import { POST as eventsPost, GET as eventsGet } from '../app/api/vapi/webhooks/events/route'

// Mock Airtable + utils + security to no-op so tests focus on status codes
jest.mock('../lib/airtable/client', () => ({
  airtableBase: jest.fn(() => ({
    select: jest.fn().mockReturnValue({ firstPage: jest.fn().mockResolvedValue([]) }),
    update: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
  })),
}))

jest.mock('../lib/airtable/utils', () => ({
  requireAirtableReady: jest.fn(),
  requireValidSchema: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../lib/security/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true }),
  createRateLimitResponse: jest.fn(),
}))

jest.mock('../lib/security/headers', () => ({
  applySecurityHeaders: jest.fn((response) => response),
}))

describe('VAPI Webhooks - Smoke', () => {
  it('events POST should return success: true', async () => {
    const { NextRequest } = require('next/server')
    const request = new NextRequest('http://localhost/api/vapi/webhooks/events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'call-start',
        call: {
          id: 'test-call-1',
          from: '+10000000000',
          to: '+10000000001',
          direction: 'inbound',
          status: 'ringing',
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await eventsPost(request)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('transcript POST should return success: true', async () => {
    const { NextRequest } = require('next/server')
    const request = new NextRequest('http://localhost/api/vapi/webhooks/transcript', {
      method: 'POST',
      body: JSON.stringify({
        callId: 'test-call-1',
        transcript: 'Test transcript',
        isFinal: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await transcriptPost(request)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('events GET should return ok: true', async () => {
    const response = await eventsGet()
    const data = await response.json()
    expect(data.ok).toBe(true)
  })

  it('transcript GET should return ok: true', async () => {
    const response = await transcriptGet()
    const data = await response.json()
    expect(data.ok).toBe(true)
  })
})
