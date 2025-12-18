import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { applySecurityHeaders } from '@/lib/security/headers'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    const { businessId } = await requireBusinessContext()

    console.log('Fetching interactions list', { requestId, businessId })

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch ALL interactions (no filter in Airtable - we'll filter in JS like we did for leads)
    const allRecords = await airtableBase('Interactions')
      .select({
        maxRecords: 1000,
        sort: [{ field: 'Start UTC', direction: 'desc' }], // Use Start UTC instead of Created
      })
      .all()

    console.log('Total interactions fetched (unfiltered):', allRecords.length)

    // Filter by business in JavaScript
    let records = Array.from(allRecords).filter((r: any) => {
      const interactionBusinessIds = r.fields.Business as string[] | undefined
      return interactionBusinessIds?.includes(businessId)
    })

    console.log('After business filter:', records.length)

    // Filter by date range in JavaScript if provided
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)

      records = records.filter((r: any) => {
        const startUtc = r.fields['Start UTC'] as string | undefined
        if (!startUtc) return false
        const recordDate = new Date(startUtc)
        return recordDate >= start && recordDate <= end
      })

      console.log('After date filter:', records.length)
    }

    const interactions = records.map((r: any) => ({
      id: r.id,
      name: r.fields.Name as string | undefined,
      type: (r.fields.Type as string) || '',
      transcript: (r.fields.Transcript as string) || '',
      duration: r.fields.Duration as number | undefined,
      direction: r.fields.Direction as string | undefined,
      status: r.fields.Status as string | undefined,
      outcome: r.fields.Outcome as string | undefined,
      startUtc: r.fields['Start UTC'] as string | undefined,
      endUtc: r.fields['End UTC'] as string | undefined,
      callId: r.fields['Call ID'] as string | undefined,
      fromNumber: r.fields['From Number'] as string | undefined,
      toNumber: r.fields['To Number'] as string | undefined,
      leadId: Array.isArray(r.fields.Lead) ? r.fields.Lead[0] : undefined,
      businessId: Array.isArray(r.fields.Business) ? r.fields.Business[0] : undefined,
    }))

    const response = NextResponse.json({
      success: true,
      data: interactions,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      requestId
    })

    return applySecurityHeaders(response)

  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }

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

    console.error('Error fetching interactions:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    const response = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
    return applySecurityHeaders(response)
  }
}
