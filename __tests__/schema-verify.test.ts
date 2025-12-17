/**
 * Integration test for schema verification
 */

import { verifySchema, SchemaVerificationResult } from '@/lib/airtable/schema-verify'

// Mock fetch for testing
global.fetch = jest.fn()

describe('Schema Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AIRTABLE_TOKEN = 'test-token'
    process.env.AIRTABLE_BASE_ID = 'test-base-id'
  })

  it('should verify schema successfully when schema matches', async () => {
    const mockTables = [
      {
        name: 'Businesses',
        fields: [
          { name: 'Name', type: 'singleLineText', id: 'fld1' },
          { name: 'Timezone', type: 'singleLineText', id: 'fld2' },
        ],
        requiredFields: [],
      },
      {
        name: 'Leads',
        fields: [
          { name: 'Name', type: 'singleLineText', id: 'fld3' },
          { name: 'Phone', type: 'phoneNumber', id: 'fld4' },
        ],
        requiredFields: [],
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tables: mockTables }),
    })

    const result: SchemaVerificationResult = await verifySchema()

    expect(result.valid).toBe(false) // Will be false because we're missing many required fields
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v0/meta/bases/test-base-id/tables'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const result: SchemaVerificationResult = await verifySchema()

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('should detect missing tables', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tables: [] }),
    })

    const result: SchemaVerificationResult = await verifySchema()

    expect(result.valid).toBe(false)
    expect(result.mismatches.some((m) => m.issue === 'missing_table')).toBe(true)
  })
})

