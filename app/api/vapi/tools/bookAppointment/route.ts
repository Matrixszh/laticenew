/**
 * POST /api/vapi/tools/bookAppointment
 * VAPI tool: Creates an appointment (HOLD then CONFIRMED)
 * Reuses existing conflict checking logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import {
  requireValidSchema,
  requireAirtableReady,
  checkAppointmentConflicts,
} from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'

export const dynamic = 'force-dynamic'

const bookAppointmentSchema = z.object({
  businessId: z.string().min(1, 'businessId is required'),
  leadId: z.string().optional(),
  startUtc: z.string().datetime('startUtc must be a valid ISO 8601 datetime'),
  endUtc: z.string().datetime('endUtc must be a valid ISO 8601 datetime'),
  notes: z.string().optional(),
  skipConflictCheck: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Apply rate limiting (tools can be called frequently)
  const rateLimitResult = await rateLimit(request, 'api')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    requireAirtableReady()
    await requireValidSchema()

    const body = await request.json()
    const parseResult = bookAppointmentSchema.safeParse(body)

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

    // Check for conflicts (unless explicitly skipped)
    if (!data.skipConflictCheck) {
      const hasConflict = await checkAppointmentConflicts(
        data.businessId,
        data.startUtc,
        data.endUtc
      )

      if (hasConflict) {
        const response = NextResponse.json(
          {
            error: 'Appointment conflict detected',
            message:
              'The requested time slot conflicts with an existing appointment or busy block',
            requestId,
          },
          { status: 409 }
        )
        return applySecurityHeaders(response)
      }
    }

    // Create appointment (initially as HOLD, then CONFIRMED)
    const record: any = {
      Business: [data.businessId],
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

    // Immediately update to CONFIRMED
    const confirmedRecord = await airtableBase('Appointments').update(
      (holdRecord as any).id,
      {
        Status: 'CONFIRMED',
      }
    )

    console.log('Appointment booked via VAPI tool', {
      requestId,
      businessId: data.businessId,
      appointmentId: (confirmedRecord as any).id,
    })

    const response = NextResponse.json({
      success: true,
      data: {
        appointmentId: (confirmedRecord as any).id,
        startUtc: data.startUtc,
        endUtc: data.endUtc,
        status: 'CONFIRMED',
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error booking appointment:', {
      requestId,
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
