/**
 * POST /api/appointments
 * Does conflict check against Airtable tables (Appointments + BusyBlocks),
 * creates HOLD then CONFIRMED records
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, checkAppointmentConflicts, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeObject, sanitizeString } from '@/lib/security/sanitize'
import { requireBusinessContext, handleTenantError, TenantError } from '@/lib/auth/tenant'

export const dynamic = 'force-dynamic'

const appointmentSchema = z.object({
  leadId: z.string().optional(),
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  notes: z.string().optional(),
  skipConflictCheck: z.boolean().optional().default(false),
})

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
    // Check Airtable is configured
    requireAirtableReady()
    // Check schema validity
    await requireValidSchema()
    const { businessId } = await requireBusinessContext()

    const body = await request.json()
    
    // Sanitize input
    const sanitizedBody = sanitizeObject(body)
    if (sanitizedBody.notes) {
      sanitizedBody.notes = sanitizeString(sanitizedBody.notes)
    }
    
    console.log('Creating appointment', {
      requestId,
      businessId,
    })

    // Validate request body (use sanitized body)
    const validationResult = appointmentSchema.safeParse(sanitizedBody)
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

    // Check for conflicts (unless explicitly skipped)
    if (!data.skipConflictCheck) {
      const hasConflict = await checkAppointmentConflicts(
        businessId,
        data.startUtc,
        data.endUtc
      )

      if (hasConflict) {
        return NextResponse.json(
          {
            error: 'Appointment conflict detected',
            message: 'The requested time slot conflicts with an existing appointment or busy block',
            requestId,
          },
          { status: 409 }
        )
      }
    }

    // Prepare Airtable record (initially as HOLD)
    const record: any = {
      Business: [businessId],
      'Start UTC': data.startUtc,
      'End UTC': data.endUtc,
      Status: 'HOLD',
    }

    if (data.leadId) {
      record.Lead = [data.leadId]
    }

    if (data.notes) {
      record.Notes = data.notes
    }

    // Create HOLD record
    const holdRecord = await airtableBase('Appointments').create(record)

    console.log('Appointment created (HOLD)', {
      requestId,
      businessId,
      appointmentId: (holdRecord as any).id,
    })

    // Immediately update to CONFIRMED (in production, you might want a delay or confirmation step)
    const confirmedRecord = await airtableBase('Appointments').update(
      (holdRecord as any).id,
      {
        Status: 'CONFIRMED',
      }
    )

    console.log('Appointment confirmed', {
      requestId,
      businessId,
      appointmentId: (confirmedRecord as any).id,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        id: (confirmedRecord as any).id,
        fields: (confirmedRecord as any).fields,
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    if (error instanceof TenantError) {
      return applySecurityHeaders(handleTenantError(error, requestId))
    }
    console.error('Error creating appointment', {
      requestId,
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
