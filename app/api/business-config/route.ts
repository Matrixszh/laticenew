/**
 * GET /api/business-config?businessId=...
 * Returns Business profile + prompt overrides + automation rules + timezone
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBusinessWithConfig, requireAirtableReady } from '@/lib/airtable/utils'
import { getMissingAirtableVars } from '@/lib/config'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    const { businessId } = await requireBusinessContext()
    console.log('Fetching business config', {
      requestId,
      businessId,
    })

    const config = await getBusinessWithConfig(businessId)

    return NextResponse.json({
      success: true,
      data: config,
      requestId,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }
    console.error('Error fetching business config', {
      requestId,
      errorBusinessId: request.nextUrl.searchParams.get('businessId') || 'context',
      error: error instanceof Error ? error.message : String(error),
    })

    // Handle Airtable not configured
    if (error instanceof Error && (error as any).status === 503 && (error as any).missing) {
      return NextResponse.json(
        {
          error: 'Airtable not configured',
          requestId,
          missing: (error as any).missing,
        },
        { status: 503 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Business not found', requestId },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
  }
}

