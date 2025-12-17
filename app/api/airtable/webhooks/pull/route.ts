/**
 * GET /api/airtable/webhooks/pull
 * Pulls webhook payloads from Airtable using cursor-based pagination.
 * Processes changes idempotently.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getLastCursor, isProcessed, saveCursor, markProcessed } from '@/lib/airtable/webhook-cursor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const searchParams = request.nextUrl.searchParams
    const webhookId = searchParams.get('webhookId')

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhookId query parameter is required', requestId },
        { status: 400 }
      )
    }

    const lastCursor = await getLastCursor()

    // Fetch webhook payloads from Airtable
    // See: https://airtable.com/developers/web/api/webhooks#pull-payloads
    const url = new URL(
      `https://api.airtable.com/v0/bases/${process.env.AIRTABLE_BASE_ID}/webhooks/${webhookId}/payloads`
    )
    if (lastCursor) {
      url.searchParams.set('cursor', lastCursor)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Failed to pull webhook payloads:', {
        status: response.status,
        errorText,
        requestId,
      })
      return NextResponse.json(
        { error: 'Failed to pull webhook payloads', requestId },
        { status: response.status }
      )
    }

    const data = await response.json()
    const { payloads, cursor } = data

    // Process each payload idempotently
    const processed: any[] = []
    const skipped: string[] = []

    for (const payload of payloads || []) {
      const payloadId = payload.id || payload.timestamp

      // Check if already processed
      const marker = `payload:${payloadId}`
      if (await isProcessed(marker)) {
        skipped.push(String(payloadId))
        continue
      }

      // Process the payload
      // In production, you'd update your UI state here
      console.log('Processing webhook payload:', {
        payloadId: String(payloadId),
        changes: payload.changedTablesById,
        requestId,
      })

      // Mark as processed
      await markProcessed(marker)
      processed.push(String(payloadId))
    }

    // Save the new cursor
    if (cursor) {
      await saveCursor(cursor)
    }

    return NextResponse.json({
      success: true,
      processed: processed.length,
      skipped: skipped.length,
      cursor,
      processedIds: processed,
      skippedIds: skipped,
      requestId,
    })
  } catch (error) {
    console.error('Webhook pull error:', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    )
  }
}
