/**
 * GET /api/leads
 * Returns all leads (including from onboarding form)
 */

import { NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    const { businessId } = await requireBusinessContext()

    console.log('Fetching leads', { requestId, businessId })

    // Fetch ALL leads (no filter in Airtable query)
    const allRecords = await airtableBase('Leads')
      .select({
        maxRecords: 100,
        sort: [{ field: 'Name', direction: 'asc' }],
      })
      .all()

    console.log('Total leads fetched (unfiltered):', allRecords.length)

    // Filter in JavaScript - this works reliably with linked records
    const records = allRecords.filter((r: any) => {
      const leadBusinessIds = r.fields.Business as string[] | undefined
      const isMatch = leadBusinessIds?.includes(businessId)
      if (allRecords.length <= 5) { // Only log details if small dataset
        console.log('Lead:', r.fields.Name, 'Business:', leadBusinessIds, 'Match:', isMatch)
      }
      return isMatch
    })

    console.log('Total leads after filtering by business:', records.length)

    if (records.length === 0) {
      console.log('⚠️ No leads found for business:', businessId)
      console.log('Available business IDs in leads:', 
        allRecords.map(r => r.fields.Business).filter(Boolean)
      )
    }

    // Fetch tenant business name once
    const business = await airtableBase('Businesses').find(businessId).catch(() => null)
    const businessName = business?.fields?.Name as string | undefined

    // Get interaction and appointment counts - fetch all then filter client-side
    const leadIds = records.map((r: any) => r.id)
    
    // Fetch interactions
    const interactionsDataRaw = await airtableBase('Interactions')
      .select({ maxRecords: 10000 })
      .all()
      .catch(() => [])
    
    const interactionsData = Array.from(interactionsDataRaw).filter((r: any) => {
      const interactionBusinessIds = r.fields.Business as string[] | undefined
      return interactionBusinessIds?.includes(businessId)
    })

    // Fetch appointments
    const appointmentsDataRaw = await airtableBase('Appointments')
      .select({ maxRecords: 10000 })
      .all()
      .catch(() => [])
    
    const appointmentsData = Array.from(appointmentsDataRaw).filter((r: any) => {
      const appointmentBusinessIds = r.fields.Business as string[] | undefined
      return appointmentBusinessIds?.includes(businessId)
    })

    const interactionCounts = new Map()
    const appointmentCounts = new Map()

    interactionsData.forEach((r: any) => {
      if (Array.isArray(r.fields.Lead)) {
        r.fields.Lead.forEach((leadId: string) => {
          interactionCounts.set(leadId, (interactionCounts.get(leadId) || 0) + 1)
        })
      }
    })

    appointmentsData.forEach((r: any) => {
      if (Array.isArray(r.fields.Lead)) {
        r.fields.Lead.forEach((leadId: string) => {
          appointmentCounts.set(leadId, (appointmentCounts.get(leadId) || 0) + 1)
        })
      }
    })

    const leads = records.map((r: any) => {
      return {
        id: r.id,
        name: (r.fields.Name as string) || '',
        email: r.fields.Email as string | undefined,
        phone: r.fields.Phone as string | undefined,
        status: r.fields.Status as string | undefined,
        industry: r.fields.Industry as string | undefined,
        useCase: r.fields['Use Case'] as string | undefined,
        teamSize: r.fields['Team Size'] as string | undefined,
        expectedVolume: r.fields['Expected Volume'] as string | undefined,
        onboardingNotes: r.fields['Onboarding Notes'] as string | undefined,
        created: (r.fields.Created as string) || new Date().toISOString(),
        businessId,
        businessName,
        interactionCount: interactionCounts.get(r.id) || 0,
        appointmentCount: appointmentCounts.get(r.id) || 0,
      }
    })

    console.log('✅ Returning leads:', leads.length)

    return NextResponse.json({ success: true, data: leads, requestId })

  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }

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

    console.error('Error fetching leads:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
  }
}
