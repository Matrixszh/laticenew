/**
 * Tests for setup incomplete gating
 */

import { isAuthReady, isAirtableReady, isSetupReady } from '@/lib/config'

describe('Setup Gating', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return false for authReady when keys are missing', () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    delete process.env.CLERK_SECRET_KEY

    expect(isAuthReady()).toBe(false)
  })

  it('should return true for authReady when keys are present', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.CLERK_SECRET_KEY = 'sk_test_123'

    expect(isAuthReady()).toBe(true)
  })

  it('should return false for airtableReady when keys are missing', () => {
    delete process.env.AIRTABLE_TOKEN
    delete process.env.AIRTABLE_BASE_ID

    expect(isAirtableReady()).toBe(false)
  })

  it('should return true for airtableReady when keys are present', () => {
    process.env.AIRTABLE_TOKEN = 'pat123'
    process.env.AIRTABLE_BASE_ID = 'app123'

    expect(isAirtableReady()).toBe(true)
  })

  it('should return false for setupReady when either auth or airtable is missing', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.CLERK_SECRET_KEY = 'sk_test_123'
    delete process.env.AIRTABLE_TOKEN

    expect(isSetupReady()).toBe(false)
  })

  it('should return true for setupReady when both are configured', () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_123'
    process.env.CLERK_SECRET_KEY = 'sk_test_123'
    process.env.AIRTABLE_TOKEN = 'pat123'
    process.env.AIRTABLE_BASE_ID = 'app123'

    expect(isSetupReady()).toBe(true)
  })
})

