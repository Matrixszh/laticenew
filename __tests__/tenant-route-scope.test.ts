/**
 * Tenant scoping on API routes
 */

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

jest.mock('@/lib/auth/tenant', () => ({
  requireBusinessContext: jest.fn().mockResolvedValue({
    businessId: 'biz1',
    role: 'Owner',
    userEmail: 'owner@example.com',
  }),
  handleTenantError: jest.fn(),
  TenantError: class extends Error {},
}))

jest.mock('@/lib/airtable/utils', () => ({
  requireAirtableReady: jest.fn(),
}))

jest.mock('@/lib/airtable/client', () => ({
  airtableBase: jest.fn(),
}))

describe('/api/leads GET tenant scope', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses tenant businessId for filtering', async () => {
    const { airtableBase } = require('@/lib/airtable/client')

    const leadsSelect = {
      all: jest.fn().mockResolvedValue([
        {
          id: 'lead1',
          fields: {
            Name: 'Tenant Lead',
            Business: ['biz1'],
            Created: '2024-01-01',
          },
        },
      ]),
    }
    const interactionsSelect = { all: jest.fn().mockResolvedValue([]) }
    const appointmentsSelect = { all: jest.fn().mockResolvedValue([]) }
    const businessFind = jest.fn().mockResolvedValue({
      id: 'biz1',
      fields: { Name: 'Biz One' },
    })

    airtableBase.mockImplementation((table: string) => {
      if (table === 'Leads') return { select: jest.fn().mockReturnValue(leadsSelect) }
      if (table === 'Interactions') return { select: jest.fn().mockReturnValue(interactionsSelect) }
      if (table === 'Appointments') return { select: jest.fn().mockReturnValue(appointmentsSelect) }
      if (table === 'Businesses') return { find: businessFind }
      return { select: jest.fn(), find: jest.fn() }
    })

    const { GET } = await import('@/app/api/leads/route')
    const response = await GET()
    const data = await response.json()

    const selectArgs = (airtableBase as jest.Mock).mock.results[0].value.select.mock.calls[0][0]
    expect(selectArgs.filterByFormula).toContain('biz1')
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data[0].businessId).toBe('biz1')
  })
})
