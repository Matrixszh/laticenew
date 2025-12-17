/**
 * POST /api/vapi/tools/getBusinessConfig
 * VAPI tool: Returns business configuration for a given phone number or businessId
 * Includes: Business profile, timezone, prompt overrides, working hours, escalation numbers
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { getBusinessWithConfig } from '@/lib/airtable/utils'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'

export const dynamic = 'force-dynamic'

const getBusinessConfigSchema = z.object({
  toNumber: z.string().optional(),
  businessId: z.string().optional(),
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
    const parseResult = getBusinessConfigSchema.safeParse(body)

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
        } else {
          // Return default config if business not found
          const response = NextResponse.json({
            success: true,
            data: {
              businessId: null,
              name: 'Default',
              timezone: 'America/New_York',
              promptOverrides: [],
              workingHours: {
                start: '09:00',
                end: '17:00',
                timezone: 'America/New_York',
              },
              escalationNumbers: [],
            },
            requestId,
          })
          return applySecurityHeaders(response)
        }
      } catch (error) {
        console.error('Error finding business by phone number', {
          toNumber: data.toNumber,
          requestId,
        })
      }
    }

    if (!businessId) {
      const response = NextResponse.json(
        {
          error: 'businessId or toNumber is required',
          requestId,
        },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Get business config
    const config = await getBusinessWithConfig(businessId)

    // Get escalation numbers (could be stored in Business record or separate table)
    // For now, return empty array - can be extended later
    const escalationNumbers: string[] = []

    // Working hours (default, can be extended to store in Business record)
    const workingHours = {
      start: '09:00',
      end: '17:00',
      timezone: config.timezone || 'America/New_York',
    }

    const response = NextResponse.json({
      success: true,
      data: {
        businessId,
        name: (config.business as any).Name || 'Unknown',
        timezone: config.timezone || 'America/New_York',
        promptOverrides: config.promptOverrides,
        workingHours,
        escalationNumbers,
        automations: config.automations,
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error getting business config:', {
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
