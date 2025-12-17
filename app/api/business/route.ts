import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady, requireValidSchema } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { handleTenantError, requireBusinessContext, requireRole, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

const E164_REGEX = /^\+[1-9]\d{6,14}$/

const businessUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  timezone: z.string().min(1, 'Timezone is required').optional(),
  vapiNumber: z.string().optional(),
  humanHandoverNumber: z.string().optional().nullable(),
  handoverEnabled: z.boolean().optional(),
  hoursJson: z.string().optional(),
})

function mapBusinessResponse(record: any) {
  return {
    name: (record.fields.Name as string) || '',
    timezone: (record.fields.Timezone as string) || '',
    vapiNumber: (record.fields['Vapi Number'] as string) || '',
    humanHandoverNumber: (record.fields['Human Handover Number'] as string) || '',
    handoverEnabled: Boolean(record.fields['Handover Enabled']),
    hoursJson: (record.fields['Hours JSON'] as string) || '',
  }
}

export async function GET() {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    const { businessId, role } = await requireBusinessContext()
    const business = await airtableBase('Businesses').find(businessId)

    return NextResponse.json({
      success: true,
      data: { ...mapBusinessResponse(business), role },
      requestId,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }

    if (error instanceof SchemaDriftError) {
      return NextResponse.json(
        { success: false, error: 'Schema drift', details: error.errors, mismatches: error.mismatches, requestId },
        { status: error.status }
      )
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

    console.error('Error fetching business', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ success: false, error: 'Internal server error', requestId }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    await requireValidSchema()
    const { businessId, role } = await requireBusinessContext()
    requireRole('Admin', role)

    const body = await request.json()
    const parsed = businessUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten(), requestId },
        { status: 400 }
      )
    }

    const data = parsed.data
    const updateFields: Record<string, any> = {}

    if (data.name !== undefined) {
      updateFields.Name = data.name
    }
    if (data.timezone !== undefined) {
      updateFields.Timezone = data.timezone
    }
    if (data.vapiNumber !== undefined) {
      if (data.vapiNumber && !E164_REGEX.test(data.vapiNumber)) {
        return NextResponse.json(
          { success: false, error: 'Vapi Number must be E.164 (+123...)', requestId },
          { status: 400 }
        )
      }
      updateFields['Vapi Number'] = data.vapiNumber
    }
    if (data.humanHandoverNumber !== undefined) {
      if (data.humanHandoverNumber && !E164_REGEX.test(data.humanHandoverNumber)) {
        return NextResponse.json(
          { success: false, error: 'Human Handover Number must be E.164 (+123...)', requestId },
          { status: 400 }
        )
      }
      updateFields['Human Handover Number'] = data.humanHandoverNumber || ''
    }
    if (data.handoverEnabled !== undefined) {
      updateFields['Handover Enabled'] = data.handoverEnabled
    }
    if (data.hoursJson !== undefined) {
      updateFields['Hours JSON'] = data.hoursJson
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update', requestId },
        { status: 400 }
      )
    }

    const updated = await airtableBase('Businesses').update(businessId, updateFields)

    return NextResponse.json({
      success: true,
      data: mapBusinessResponse(updated),
      requestId,
    })
  } catch (error) {
    if (error instanceof TenantError) {
      return handleTenantError(error, requestId)
    }
    if (error instanceof SchemaDriftError) {
      return NextResponse.json(
        { success: false, error: 'Schema drift', details: error.errors, mismatches: error.mismatches, requestId },
        { status: error.status }
      )
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
    console.error('Error updating business', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json({ success: false, error: 'Internal server error', requestId }, { status: 500 })
  }
}
