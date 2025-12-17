/**
 * POST /api/vapi/webhooks/transcript
 * Receives transcript chunks or final transcript from VAPI
 * Persists speaker-labeled transcript to Interactions table
 *
 * NOTE:
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

// VAPI transcript schema
const vapiTranscriptSchema = z.object({
  callId: z.string(),
  transcript: z.string().min(1, 'Transcript is required'),
  messages: z
    .array(
      z.object({
        role: z.enum(['assistant', 'user', 'system']),
        content: z.string(),
        timestamp: z.string().optional(),
      })
    )
    .optional(), // Optional detailed messages array
  isFinal: z.boolean().optional().default(false),
})

const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET
let hasLoggedMissingSecret = false

function verifySignature(requestId: string, rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    if (!hasLoggedMissingSecret) {
      console.warn(
        'VAPI_WEBHOOK_SECRET is not set; skipping Vapi transcript webhook signature verification. ' +
          'Set this env var to enable verification.'
      )
      hasLoggedMissingSecret = true
    }
    return true
  }

  if (!signatureHeader) {
    console.warn('Missing X-Vapi-Signature header on Vapi transcript webhook', { requestId })
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
      console.warn('Invalid Vapi transcript webhook signature length', { requestId })
      return false
    }

    const valid = nodeCrypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    if (!valid) {
      console.warn('Invalid Vapi transcript webhook signature', { requestId })
    }

    return valid
  } catch (error) {
    console.error('Error verifying Vapi transcript webhook signature', {
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

    const parseResult = vapiTranscriptSchema.safeParse(body)

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
    const callId = data.callId

    // Build speaker-labeled transcript
    let speakerLabeledTranscript = data.transcript

    // If messages array provided, format as speaker-labeled
    if (data.messages && data.messages.length > 0) {
      speakerLabeledTranscript = data.messages
        .map((msg) => {
          const speaker = msg.role === 'assistant' ? 'AI' : 'Caller'
          const timestamp = msg.timestamp
            ? `[${new Date(msg.timestamp).toLocaleTimeString()}] `
            : ''
          return `${timestamp}${speaker}: ${msg.content}`
        })
        .join('\n\n')
    }

    // Find interaction by Call ID
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
      console.log('Could not find existing interaction by Call ID', {
        callId,
        requestId,
      })
    }

    if (interactionRecord) {
      // Update existing interaction with transcript
      await airtableBase('Interactions').update(interactionRecord.id, {
        Transcript: speakerLabeledTranscript,
      })
      console.log('Updated interaction transcript', {
        requestId,
        callId,
        interactionId: interactionRecord.id,
        isFinal: data.isFinal,
      })
    } else {
      // Create new interaction if not found
      // This shouldn't happen if events webhook is called first, but handle gracefully
      await airtableBase('Interactions').create({
        Type: 'Call',
        Direction: 'Inbound', // Default, should be set by events webhook
        'Call ID': callId,
        Transcript: speakerLabeledTranscript,
        Status: 'Completed',
      })
      console.log('Created interaction from transcript webhook', {
        requestId,
        callId,
      })
    }

    const response = NextResponse.json({
      success: true,
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error processing VAPI transcript:', {
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

