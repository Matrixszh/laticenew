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

    // Some Airtable bases may not have a `Created` field (schema drift / partial setup).
    // Prefer sorting by `Created` when available, but fall back to unsorted query if Airtable rejects it.
    const leadsQuery = () =>
      airtableBase('Leads')
        .select({
          maxRecords: 100,
          sort: [{ field: 'Created', direction: 'desc' }],
          filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
        })
        .all()

    const records = await leadsQuery().catch((err: any) => {
      const message = err?.message || ''
      if (
        err?.statusCode === 422 &&
        (message.includes('Unknown field name: "Created"') || message.includes("Unknown field name: 'Created'"))
      ) {
        return airtableBase('Leads')
          .select({
            maxRecords: 100,
            filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
          })
          .all()
      }
      throw err
    })

    // Fetch tenant business name once
    const business = await airtableBase('Businesses').find(businessId).catch(() => null)
    const businessName = business?.fields?.Name as string | undefined

    // Get interaction and appointment counts
    const leadIds = records.map((r: any) => r.id)
    const [interactionsData, appointmentsData] = await Promise.all([
      airtableBase('Interactions')
        .select({
          filterByFormula: `AND({Lead} != "", FIND("${businessId}", ARRAYJOIN({Business})))`,
          maxRecords: 10000,
        })
        .all()
        .catch(() => []),
      airtableBase('Appointments')
        .select({
          filterByFormula: `AND({Lead} != "", FIND("${businessId}", ARRAYJOIN({Business})))`,
          maxRecords: 10000,
        })
        .all()
        .catch(() => []),
    ])

    const interactionCounts = new Map<string, number>()
    const appointmentCounts = new Map<string, number>()

    ;(interactionsData as any[]).forEach((r: any) => {
      if (Array.isArray(r.fields.Lead)) {
        r.fields.Lead.forEach((leadId: string) => {
          interactionCounts.set(leadId, (interactionCounts.get(leadId) || 0) + 1)
        })
      }
    })

    ;(appointmentsData as any[]).forEach((r: any) => {
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
        created: (r.fields.Created as string) || '',
        businessId,
        businessName,
        interactionCount: interactionCounts.get(r.id) || 0,
        appointmentCount: appointmentCounts.get(r.id) || 0,
      }
    })

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

