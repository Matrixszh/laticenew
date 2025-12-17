/**
 * PATCH /api/leads/[id]
 * Update lead status (inline editing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeString } from '@/lib/security/sanitize'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

const updateLeadSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Qualified', 'Closed', 'Lost']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID()
  const leadId = params.id

  // Apply rate limiting (write operations)
  const rateLimitResult = await rateLimit(request, 'write')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    requireAirtableReady()
    await requireValidSchema()
    const { businessId } = await requireBusinessContext()

    const body = await request.json()
    const parseResult = updateLeadSchema.safeParse(body)

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
    const updateFields: any = {}

    if (data.status !== undefined) {
      updateFields.Status = sanitizeString(data.status)
    }
    if (data.email !== undefined) {
      updateFields.Email = sanitizeString(data.email)
    }
    if (data.phone !== undefined) {
      updateFields.Phone = sanitizeString(data.phone)
    }

    if (Object.keys(updateFields).length === 0) {
      const response = NextResponse.json(
        {
          error: 'No fields to update',
          requestId,
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Ensure the lead belongs to the current tenant
    const existing = await airtableBase('Leads').find(leadId)
    const leadBusinessId = Array.isArray(existing.fields.Business)
      ? (existing.fields.Business as string[])[0]
      : undefined

    if (leadBusinessId !== businessId) {
      const response = NextResponse.json(
        { success: false, error: 'Lead not in this business', requestId },
        { status: 403 }
      )
      return applySecurityHeaders(response)
    }

    const updated = await airtableBase('Leads').update(leadId, {
      ...updateFields,
      Business: [businessId],
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        fields: updated.fields,
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    console.error('Error updating lead:', {
      requestId,
      leadId,
      error: error instanceof Error ? error.message : String(error),
    })

    if (error instanceof SchemaDriftError) {
      const response = NextResponse.json(
        {
          error: 'Schema drift',
          details: error.errors,
          mismatches: error.mismatches,
          requestId,
        },
        { status: error.status }
      )
      return applySecurityHeaders(response)
    }

    const response = NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}
