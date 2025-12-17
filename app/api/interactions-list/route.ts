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
    
    // Build filter formula if date range provided
    let filterFormula: string | undefined
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      // Airtable date filtering using Created field
      filterFormula = `AND(
        IS_AFTER({Created}, "${start.toISOString()}"),
        IS_BEFORE({Created}, "${end.toISOString()}")
      )`
    }
    
    const selectOptions: any = {
      maxRecords: 1000, // Increased for date filtering
      sort: [{ field: 'Created', direction: 'desc' }],
      filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
    }
    
    if (filterFormula) {
      selectOptions.filterByFormula = filterFormula
    }
    
    const records = await airtableBase('Interactions')
      .select(selectOptions)
      .all()

    const interactions = records.map((r: any) => ({
      id: r.id,
      type: (r.fields.Type as string) || '',
      transcript: (r.fields.Transcript as string) || '',
      duration: r.fields.Duration as number | undefined,
      direction: r.fields.Direction as string | undefined,
      status: r.fields.Status as string | undefined,
      created: (r.fields.Created as string) || '',
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
