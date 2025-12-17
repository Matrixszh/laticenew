/**
 * GET /api/kpis
 * Returns KPI data with optional date range filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { calculateKPIs, type DateRange } from '@/lib/utils/kpi-calculations'
import { applySecurityHeaders } from '@/lib/security/headers'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    requireAirtableReady()
    const { businessId } = await requireBusinessContext()

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateRange: DateRange | undefined =
      startDate && endDate
        ? {
            startDate,
            endDate,
          }
        : undefined

    // Fetch interactions and leads
    const [interactionsData, leadsData] = await Promise.all([
      airtableBase('Interactions')
        .select({
          maxRecords: 10000, // Increased for date filtering
          filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
        })
        .all(),
      airtableBase('Leads')
        .select({
          maxRecords: 10000,
          filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
        })
        .all(),
    ])

    console.log('Fetched interactions:', interactionsData.length, { requestId, businessId })
    console.log('Fetched leads:', leadsData.length, { requestId, businessId })

    const interactions = (interactionsData as any[]).map((r: any) => ({
      fields: r.fields,
      createdTime: r.fields.Created ? String(r.fields.Created) : r.createdTime,
    }))

    const leads = (leadsData as any[]).map((r: any) => ({
      fields: r.fields,
      createdTime: r.fields.Created ? String(r.fields.Created) : r.createdTime,
    }))

    // Calculate KPIs
    const kpis = calculateKPIs(interactions, leads, dateRange)

    const response = NextResponse.json({
      success: true,
      data: kpis,
      dateRange: dateRange || null,
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    if (error instanceof Error && (error as any).status === 503 && (error as any).missing) {
      const response = NextResponse.json(
        {
          error: 'Airtable not configured',
          requestId,
          missing: (error as any).missing,
        },
        { status: 503 }
      )
      return applySecurityHeaders(response)
    }

    console.error('Error fetching KPIs:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    const response = NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}
