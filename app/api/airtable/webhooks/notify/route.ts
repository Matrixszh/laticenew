/**
 * POST /api/airtable/webhooks/notify
 * Receives webhook notifications from Airtable
 * This endpoint is called by Airtable when changes occur.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isProcessed, markProcessed } from '@/lib/airtable/webhook-cursor'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const body = await request.json()

    // Airtable webhook notification format
    // See: https://airtable.com/developers/web/api/webhooks
    const baseId = body?.base?.id as string | undefined
    const webhookId = body?.webhook?.id as string | undefined
    const timestamp = body?.timestamp as string | undefined

    // Validate request
    if (!baseId || !webhookId) {
      return NextResponse.json(
        { error: 'Invalid webhook payload', requestId },
        { status: 400 }
      )
    }

    const notificationMarker = `notify:${timestamp ?? `${webhookId}:${Date.now()}`}`
    if (await isProcessed(notificationMarker)) {
      console.log('Webhook notification deduped', {
        requestId,
        baseId,
        webhookId,
        timestamp,
      })
      return NextResponse.json({ success: true, deduped: true, requestId })
    }

    await markProcessed(notificationMarker)

    // Log the notification (in production, you'd process the changes here)
    console.log('Webhook notification received:', {
      baseId,
      webhookId,
      timestamp,
      requestId,
    })

    // Return success
    return NextResponse.json({
      success: true,
      requestId,
    })
  } catch (error) {
    console.error('Webhook notification error:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
  }
}
