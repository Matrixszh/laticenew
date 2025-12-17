import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeObject, sanitizeString } from '@/lib/security/sanitize'
import {
  handleTenantError,
  requireBusinessContext,
  requireRole,
  TenantError,
} from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

const automationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  conditions: z.string().optional(),
  actions: z.string().min(1, 'Actions are required'),
  active: z.boolean().optional().default(true),
})

export async function GET() {
  const requestId = crypto.randomUUID()
  try {
    requireAirtableReady()
    const { businessId } = await requireBusinessContext()
    console.log('Fetching automations', { requestId, businessId })
    const records = await airtableBase('Automations')
      .select({
        maxRecords: 100,
        filterByFormula: `FIND("${businessId}", ARRAYJOIN({Business}))`,
      })
      .all()

    const automations = records.map((r: any) => ({
      id: r.id,
      name: r.fields.Name as string,
      trigger: r.fields.Trigger as string,
      conditions: r.fields.Conditions ? JSON.parse(r.fields.Conditions as string) : null,
      actions: JSON.parse(r.fields.Actions as string),
      active: r.fields.Active as boolean,
    }))

    const response = NextResponse.json({ success: true, data: automations, requestId })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    // Handle Airtable not configured
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

    console.error('Error fetching automations:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    const response = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  // Apply rate limiting (write operations)
  const rateLimitResult = await rateLimit(request, 'write')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    const { businessId, role } = await requireBusinessContext()
    requireRole('Admin', role)
    await requireValidSchema()
    const body = await request.json()
    
    // Sanitize input
    const sanitizedBody = sanitizeObject(body)
    if (sanitizedBody.name) {
      sanitizedBody.name = sanitizeString(sanitizedBody.name)
    }
    if (sanitizedBody.conditions) {
      sanitizedBody.conditions = sanitizeString(sanitizedBody.conditions)
    }
    if (sanitizedBody.actions) {
      sanitizedBody.actions = sanitizeString(sanitizedBody.actions)
    }
    
    const parseResult = automationSchema.safeParse(sanitizedBody)
    if (!parseResult.success) {
      const response = NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.flatten(),
          requestId,
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const data = parseResult.data
    console.log('Creating automation', {
      requestId,
      businessId,
      trigger: data.trigger,
    })
    const record = await airtableBase('Automations').create({
      Name: data.name,
      Trigger: data.trigger,
      Conditions: data.conditions || undefined,
      Actions: data.actions,
      Active: data.active,
      Business: [businessId],
    })

    const response = NextResponse.json({
      success: true,
      data: { id: record.id, fields: record.fields },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    if (error instanceof SchemaDriftError) {
      const response = NextResponse.json(
        { error: 'Schema drift', details: error.errors, mismatches: error.mismatches, requestId },
        { status: error.status }
      )
      return applySecurityHeaders(response)
    }
    console.error('Error creating automation:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    const response = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  // Apply rate limiting (write operations)
  const rateLimitResult = await rateLimit(request, 'write')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    const { businessId, role } = await requireBusinessContext()
    requireRole('Admin', role)
    await requireValidSchema()
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    if (!id) {
      const response = NextResponse.json({ error: 'id is required', requestId }, { status: 400 })
      return applySecurityHeaders(response)
    }

    const existing = await airtableBase('Automations').find(id)
    const recordBusiness = Array.isArray(existing.fields.Business)
      ? (existing.fields.Business as string[])[0]
      : undefined
    if (recordBusiness !== businessId) {
      const response = NextResponse.json(
        { success: false, error: 'Automation not in this business', requestId },
        { status: 403 }
      )
      return applySecurityHeaders(response)
    }

    console.log('Deleting automation', { requestId, id, businessId })
    await airtableBase('Automations').destroy(id)
    const response = NextResponse.json({ success: true, requestId })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    if (error instanceof SchemaDriftError) {
      const response = NextResponse.json(
        { error: 'Schema drift', details: error.errors, mismatches: error.mismatches, requestId },
        { status: error.status }
      )
      return applySecurityHeaders(response)
    }
    console.error('Error deleting automation:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    const response = NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 })
    return applySecurityHeaders(response)
  }
}
