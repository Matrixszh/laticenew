/**
 * POST /api/vapi/tools/transferToHuman
 * VAPI tool: Returns routing decision (destination number) for human handover
 * Uses business escalation numbers or default routing
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeString } from '@/lib/security/sanitize'

export const dynamic = 'force-dynamic'

const transferToHumanSchema = z.object({
  businessId: z.string().optional(),
  toNumber: z.string().optional(), // Phone number that received the call
  reason: z
    .enum(['Scheduling issue', 'Pricing', 'Emergency', 'Complex request', 'Other'])
    .optional(),
  callId: z.string().optional(),
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

    const body = await request.json()
    const parseResult = transferToHumanSchema.safeParse(body)

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
    let businessId = data.businessId

    // If toNumber provided, find business by phone number
    if (!businessId && data.toNumber) {
      try {
        const businesses = await airtableBase('Businesses')
          .select({
            filterByFormula: `{Phone} = "${data.toNumber}"`,
            maxRecords: 1,
          })
          .firstPage()

        if (businesses.length > 0) {
          businessId = businesses[0].id
        }
      } catch (error) {
        console.log('Could not find business by phone number', {
          toNumber: data.toNumber,
          requestId,
        })
      }
    }

    // Get escalation numbers from business
    // For now, use business phone as fallback, or a default escalation number
    // In production, this could be stored in Business record or separate EscalationNumbers table
    let destinationNumber: string | null = null

    if (businessId) {
      try {
        const business = await airtableBase('Businesses').find(businessId)
        // Use business phone as escalation number (can be extended)
        destinationNumber = (business.fields.Phone as string) || null
      } catch (error) {
        console.log('Could not fetch business for escalation', {
          businessId,
          requestId,
        })
      }
    }

    // Fallback: use environment variable or default
    if (!destinationNumber) {
      // In production, you might have a default escalation number
      destinationNumber = process.env.DEFAULT_ESCALATION_NUMBER || null
    }

    if (!destinationNumber) {
      const response = NextResponse.json(
        {
          error: 'No escalation number configured',
          message:
            'Cannot transfer call: no escalation number found for business',
          requestId,
        },
        { status: 404 }
      )
      return applySecurityHeaders(response)
    }

    // Use provided reason or default to 'Other'
    const transferReason = data.reason || 'Other'

    const response = NextResponse.json({
      success: true,
      data: {
        destination: destinationNumber,
        reason: transferReason,
        method: 'transfer', // VAPI transfer method
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error determining transfer destination:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    const response = NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}
