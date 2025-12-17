/**
 * GET /api/health
 * Returns readiness status and build info (no secrets)
 */

import { NextResponse } from 'next/server'
import {
  isAuthReady,
  isAirtableReady,
  isSetupReady,
  getMissingAuthVars,
  getMissingAirtableVars,
} from '@/lib/config'
import { verifySchema } from '@/lib/airtable/schema-verify'
import { applySecurityHeaders } from '@/lib/security/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authReady = isAuthReady()
  const airtableReady = isAirtableReady()
  const setupReady = isSetupReady()

  // Check schema if Airtable is configured
  let schemaOk = false
  let schemaErrors: string[] = []
  if (airtableReady) {
    try {
      const schemaResult = await verifySchema()
      schemaOk = schemaResult.valid
      schemaErrors = schemaResult.errors.slice(0, 10) // Limit to top 10 errors
    } catch (error) {
      // If schema verification fails (e.g., API error), mark as not ok
      schemaOk = false
      schemaErrors = [
        error instanceof Error ? error.message : 'Schema verification failed',
      ]
    }
  }

  const response = NextResponse.json({
    status: 'ok',
    authReady,
    airtableReady,
    setupReady,
    schemaOk: airtableReady ? schemaOk : null, // null if Airtable not configured
    schemaErrors: airtableReady && !schemaOk ? schemaErrors : [],
    missingAuth: authReady ? [] : getMissingAuthVars(),
    missingAirtable: airtableReady ? [] : getMissingAirtableVars(),
    timestamp: new Date().toISOString(),
  })
  
  return applySecurityHeaders(response)
}

