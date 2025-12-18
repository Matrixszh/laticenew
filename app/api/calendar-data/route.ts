import { NextRequest, NextResponse } from 'next/server'

import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

const calendarActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create-override'),
    data: z.object({
      key: z.string().min(1, 'Key is required'),
      value: z.string().min(1, 'Value is required'),
      active: z.boolean().optional().default(true),
    }),
  }),
  z.object({
    type: z.literal('delete-override'),
    data: z.object({
      id: z.string().min(1, 'Override id is required'),
    }),
  }),
])

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    requireAirtableReady()

    const { businessId } = await requireBusinessContext()
    console.log('Fetching calendar data', { requestId, businessId })

    // Get business timezone (default to America/New_York)
    let businessTimezone = 'America/New_York'
    try {
      const business = await airtableBase('Businesses').find(businessId)
      businessTimezone = (business.fields.Timezone as string) || 'America/New_York'
    } catch (error) {
      console.warn('Could not fetch business timezone, using default', { businessId })
    }

    // ----- MAIN QUERY -----

    // We keep the type as readonly arrays to match Airtable typings

    // Inside GET, after you have businessId

const [appointmentRecords, overrideRecords] = await Promise.all([
  airtableBase('Appointments')
    .select({
      maxRecords: 100,
      sort: [{ field: 'Start UTC', direction: 'asc' }],
      // no filterByFormula here
    })
    .all(),
  airtableBase('PromptOverrides')
    .select({
      maxRecords: 100,
      // no filterByFormula here
    })
    .all(),
])

// Only keep rows whose linked Business includes this businessId
const appointments = appointmentRecords
  .filter((r: any) => {
    const business = r.fields.Business
    return Array.isArray(business) && business.includes(businessId)
  })
  .map((r: any) => ({
    id: r.id,
    startUtc: (r.fields['Start UTC'] as string) || '',
    endUtc: (r.fields['End UTC'] as string) || '',
    status: (r.fields.Status as string) || '',
    notes: r.fields.Notes as string | undefined,
    businessId: Array.isArray(r.fields.Business) ? r.fields.Business[0] : undefined,
  }))

const promptOverrides = overrideRecords
  .filter((r: any) => {
    const business = r.fields.Business
    return Array.isArray(business) && business.includes(businessId)
  })
  .map((r: any) => ({
    id: r.id,
    key: (r.fields.Key as string) || '',
    value: (r.fields.Value as string) || '',
    active: (r.fields.Active as boolean) || false,
  }))

    return NextResponse.json({
      success: true,
      data: { appointments, promptOverrides, businessTimezone },
      requestId,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }

    // Handle Airtable not configured
    if (error instanceof Error && (error as any).status === 503 && (error as any).missing) {
      return NextResponse.json(
        {
          error: 'Airtable not configured',
          requestId,
          missing: (error as any).missing,
        },
        { status: 503 },
      )
    }

    console.error('Error fetching calendar data:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    const { businessId } = await requireBusinessContext()
    await requireValidSchema()

    const body = await request.json()
    const parsed = calendarActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten(), requestId },
        { status: 400 },
      )
    }

    const { type, data } = parsed.data

    if (type === 'create-override') {
      console.log('Creating prompt override', {
        requestId,
        businessId,
        key: data.key,
      })

      const record = await airtableBase('PromptOverrides').create({
        Key: data.key,
        Value: data.value,
        Active: data.active,
        Business: [businessId],
      })

      return NextResponse.json({
        success: true,
        data: { id: record.id, fields: record.fields },
        requestId,
      })
    }

    if (type === 'delete-override') {
      console.log('Deleting prompt override', { requestId, id: data.id })

      const existing = await airtableBase('PromptOverrides').find(data.id)
      const recordBusiness = Array.isArray(existing.fields.Business)
        ? (existing.fields.Business as string[])[0]
        : undefined

      if (recordBusiness !== businessId) {
        return NextResponse.json(
          { success: false, error: 'Override not in this business', requestId },
          { status: 403 },
        )
      }

      await airtableBase('PromptOverrides').destroy(data.id)
      return NextResponse.json({ success: true, requestId })
    }

    return NextResponse.json({ error: 'Invalid type', requestId }, { status: 400 })
  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }

    // Handle Airtable not configured
    if (error instanceof Error && (error as any).status === 503 && (error as any).missing) {
      return NextResponse.json(
        {
          error: 'Airtable not configured',
          requestId,
          missing: (error as any).missing,
        },
        { status: 503 },
      )
    }

    if (error instanceof SchemaDriftError) {
      return NextResponse.json(
        {
          error: 'Schema drift',
          details: error.errors,
          mismatches: error.mismatches,
          requestId,
        },
        { status: error.status },
      )
    }

    console.error('Error in calendar data operation:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
