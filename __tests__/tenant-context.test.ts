/**
 * Tenant context and scoping tests
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

jest.mock('@clerk/nextjs/server', () => ({
  currentUser: jest.fn(),
}))

jest.mock('@/lib/airtable/client', () => ({
  airtableBase: jest.fn(),
}))

jest.mock('@/lib/airtable/utils', () => ({
  requireAirtableReady: jest.fn(),
}))

import { TenantError, requireBusinessContext } from '@/lib/auth/tenant'

describe('requireBusinessContext', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  it('returns 403 when user is not linked to a business', async () => {
    const { currentUser } = require('@clerk/nextjs/server')
    const { airtableBase } = require('@/lib/airtable/client')

    currentUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'test@example.com' },
    })

    airtableBase.mockReturnValue({
      select: jest.fn().mockReturnValue({
        firstPage: jest.fn().mockResolvedValue([]),
      }),
    })

    await expect(requireBusinessContext()).rejects.toBeInstanceOf(TenantError)
    await requireBusinessContext().catch((err: TenantError) => {
      expect(err.status).toBe(403)
      expect(err.payload).toEqual({ error: 'User not linked to a business' })
    })
  })
})
