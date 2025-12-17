/**
 * POST /api/vapi/webhooks/events
 * Receives VAPI call lifecycle events (call started, ended, transferred, etc.)
 * Writes/updates Airtable Interactions with call metadata
 *
 * NOTE:
 * - This endpoint MUST accept POST from Vapi (Server URL) to avoid 405s.
 * - Optional signature verification is enabled when VAPI_WEBHOOK_SECRET is set.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as nodeCrypto from 'crypto'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'

export const dynamic = 'force-dynamic'

// VAPI event schema (based on VAPI webhook format)
const vapiEventSchema = z.object({
  type: z.enum(['call-start', 'call-end', 'call-update', 'transfer']),
  call: z.object({
    id: z.string(),
    from: z.string(), // Phone number
    to: z.string(), // Phone number
    direction: z.enum(['inbound', 'outbound']),
    status: z.enum(['ringing', 'in-progress', 'ended', 'busy', 'no-answer', 'failed']),
    duration: z.number().optional(),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
  }),
  transfer: z
    .object({
      destination: z.string(), // Phone number or identifier
      reason: z.string().optional(),
    })
    .optional(),
  assistantId: z.string().optional(),
  phoneNumberId: z.string().optional(),
})

const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET
let hasLoggedMissingSecret = false

function verifySignature(requestId: string, rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    if (!hasLoggedMissingSecret) {
      console.warn(
        'VAPI_WEBHOOK_SECRET is not set; skipping Vapi webhook signature verification. ' +
          'Set this env var to enable verification.'
      )
      hasLoggedMissingSecret = true
    }
    return true
  }

  if (!signatureHeader) {
    console.warn('Missing X-Vapi-Signature header on Vapi webhook', { requestId })
    return false
  }

  try {
    const expected = nodeCrypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody, 'utf8')
      .digest('hex')

    const signatureBuffer = Buffer.from(signatureHeader, 'utf8')
    const expectedBuffer = Buffer.from(expected, 'utf8')

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.warn('Invalid Vapi webhook signature length', { requestId })
      return false
    }

    const valid = nodeCrypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    if (!valid) {
      console.warn('Invalid Vapi webhook signature', { requestId })
    }

    return valid
  } catch (error) {
    console.error('Error verifying Vapi webhook signature', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export async function POST(request: NextRequest) {
  const requestId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : nodeCrypto.randomUUID()

  // Apply rate limiting (webhooks need higher limits)
  const rateLimitResult = await rateLimit(request, 'webhook')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    requireAirtableReady()
    await requireValidSchema()

    // Read raw body once for both signature verification and JSON parsing
    const rawBody = await request.text()

    const signatureHeader = request.headers.get('x-vapi-signature')
    if (!verifySignature(requestId, rawBody, signatureHeader)) {
      const response = NextResponse.json(
        {
          error: 'Invalid signature',
          requestId,
        },
        { status: 401 }
      )
      return applySecurityHeaders(response)
    }

    let body: unknown
    try {
      body = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      const response = NextResponse.json(
        {
          error: 'Invalid JSON',
          requestId,
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const parseResult = vapiEventSchema.safeParse(body)

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

    const event = parseResult.data
    const callId = event.call.id

    // Find existing interaction by Call ID, or create new one
    let interactionRecord: any = null
    try {
      const existing = await airtableBase('Interactions')
        .select({
          filterByFormula: `{Call ID} = "${callId}"`,
          maxRecords: 1,
        })
        .firstPage()

      if (existing.length > 0) {
        interactionRecord = existing[0]
      }
    } catch (error) {
      // Call ID field might not exist yet, that's okay
      console.log('Could not find existing interaction by Call ID', { callId, requestId })
    }

    // Prepare update/create fields
    const fields: any = {
      Type: 'Call',
      Direction: event.call.direction === 'inbound' ? 'Inbound' : 'Outbound',
      'Call ID': callId,
      'From Number': event.call.from,
      'To Number': event.call.to,
    }

    // Set status based on call status
    if (event.call.status === 'in-progress') {
      fields.Status = 'In Progress'
    } else if (event.call.status === 'ended') {
      fields.Status = 'Completed'
    } else if (['busy', 'no-answer', 'failed'].includes(event.call.status)) {
      fields.Status = 'Missed'
    }

    if (event.call.duration) {
      fields.Duration = event.call.duration
    }

    // Handle transfer events
    if (event.type === 'transfer' && event.transfer) {
      fields['Transferred To Human'] = true
      fields['Transfer Destination'] = event.transfer.destination
      if (event.transfer.reason) {
        // Map reason to Transfer Reason enum (validate against schema)
        const reasonMap: Record<string, string> = {
          scheduling: 'Scheduling issue',
          'scheduling issue': 'Scheduling issue',
          pricing: 'Pricing',
          emergency: 'Emergency',
          complex: 'Complex request',
          'complex request': 'Complex request',
          other: 'Other',
        }
        const normalizedReason = event.transfer.reason.toLowerCase().trim()
        fields['Transfer Reason'] = reasonMap[normalizedReason] || 'Other'
      } else {
        fields['Transfer Reason'] = 'Other'
      }
    }

    // Try to find business by phone number (to number)
    if (event.call.to) {
      try {
        const businesses = await airtableBase('Businesses')
          .select({
            filterByFormula: `{Phone} = "${event.call.to}"`,
            maxRecords: 1,
          })
          .firstPage()

        if (businesses.length > 0) {
          fields.Business = [businesses[0].id]
        }
      } catch (error) {
        // Business lookup failed, continue without it
        console.log('Could not find business by phone number', {
          phone: event.call.to,
          requestId,
        })
      }
    }

    // Update or create interaction
    if (interactionRecord) {
      // Update existing
      await airtableBase('Interactions').update(interactionRecord.id, fields)
      console.log('Updated interaction from VAPI event', {
        requestId,
        callId,
        interactionId: interactionRecord.id,
        eventType: event.type,
      })
    } else {
      // Create new (transcript will be added later via transcript webhook)
      // For now, use placeholder transcript
      fields.Transcript = '[Transcript pending]'
      const created = await airtableBase('Interactions').create(fields)
      console.log('Created interaction from VAPI event', {
        requestId,
        callId,
        interactionId: (created as any).id,
        eventType: event.type,
      })
    }

    const response = NextResponse.json({
      success: true,
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error processing VAPI event:', {
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

// Simple GET handler to aid manual smoke testing: always returns 200
export async function GET() {
  const response = NextResponse.json({ ok: true })
  return applySecurityHeaders(response)
}

