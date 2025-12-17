/**
 * POST /api/interactions
 * Validates required fields (including transcript), writes to Airtable
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { getMissingAirtableVars } from '@/lib/config'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeObject, sanitizeString } from '@/lib/security/sanitize'

export const dynamic = 'force-dynamic'

const interactionSchema = z.object({
  leadId: z.string().optional(),
  businessId: z.string(),
  type: z.enum(['Call', 'SMS', 'Email']),
  transcript: z.string().min(1, 'Transcript is required'),
  duration: z.number().optional(),
  direction: z.enum(['Inbound', 'Outbound']).optional(),
  status: z.enum(['Completed', 'Missed', 'In Progress']).optional(),
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  let businessId: string | undefined

  // Apply rate limiting (write operations)
  const rateLimitResult = await rateLimit(request, 'write')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    // Check Airtable is configured
    requireAirtableReady()
    // Check schema validity
    await requireValidSchema()

    const body = await request.json()
    
    // Sanitize input
    const sanitizedBody = sanitizeObject(body)
    // Sanitize transcript (important for XSS prevention)
    if (sanitizedBody.transcript) {
      sanitizedBody.transcript = sanitizeString(sanitizedBody.transcript)
    }
    
    businessId = sanitizedBody.businessId

    console.log('Creating interaction', {
      requestId,
      businessId,
    })

    // Validate request body (use sanitized body)
    const validationResult = interactionSchema.safeParse(sanitizedBody)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
          requestId,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Prepare Airtable record (data is already sanitized)
    const record: any = {
      Business: [businessId],
      Type: data.type,
      Transcript: data.transcript, // Already sanitized
    }

    if (data.leadId) {
      record.Lead = [data.leadId]
    }

    if (data.duration !== undefined) {
      record.Duration = data.duration
    }

    if (data.direction) {
      record.Direction = data.direction
    }

    if (data.status) {
      record.Status = data.status
    }

    // Create record in Airtable
    const created = await airtableBase('Interactions').create(record)

    console.log('Interaction created', {
      requestId,
      businessId,
      interactionId: (created as any).id,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: (created as any).id,
        fields: (created as any).fields,
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error creating interaction', {
      requestId,
      businessId,
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
