/**
 * POST /api/vapi/tools/createOrUpdateLead
 * VAPI tool: Creates or updates a Lead record in Airtable
 * Returns leadId for linking to Interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { airtableBase } from '@/lib/airtable/client'
import { requireValidSchema, requireAirtableReady } from '@/lib/airtable/utils'
import { SchemaDriftError } from '@/lib/airtable/schema-verify'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeString, sanitizeEmail } from '@/lib/security/sanitize'

export const dynamic = 'force-dynamic'

const createOrUpdateLeadSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().min(1, 'Name is required'),
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
    await requireValidSchema()

    const body = await request.json()
    const parseResult = createOrUpdateLeadSchema.safeParse(body)

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

    // Sanitize input
    const sanitizedName = sanitizeString(data.name)
    const sanitizedPhone = data.phone ? sanitizeString(data.phone) : undefined
    const sanitizedEmail = data.email
      ? sanitizeEmail(data.email)
      : undefined

    // Try to find existing lead by phone or email
    let existingLead: any = null
    if (sanitizedPhone || sanitizedEmail) {
      try {
        let filterFormula = ''
        if (sanitizedPhone && sanitizedEmail) {
          filterFormula = `OR({Phone} = "${sanitizedPhone}", {Email} = "${sanitizedEmail}")`
        } else if (sanitizedPhone) {
          filterFormula = `{Phone} = "${sanitizedPhone}"`
        } else if (sanitizedEmail) {
          filterFormula = `{Email} = "${sanitizedEmail}"`
        }

        if (filterFormula) {
          const existing = await airtableBase('Leads')
            .select({
              filterByFormula: filterFormula,
              maxRecords: 1,
            })
            .firstPage()

          if (existing.length > 0) {
            existingLead = existing[0]
          }
        }
      } catch (error) {
        console.log('Could not search for existing lead', { requestId })
      }
    }

    const updateFields: any = {
      Name: sanitizedName,
    }

    if (sanitizedPhone) {
      updateFields.Phone = sanitizedPhone
    }
    if (sanitizedEmail) {
      updateFields.Email = sanitizedEmail
    }
    if (data.businessId) {
      updateFields.Business = [data.businessId]
    }

    let leadId: string
    if (existingLead) {
      // Update existing lead
      await airtableBase('Leads').update(existingLead.id, updateFields)
      leadId = existingLead.id
      console.log('Updated lead from VAPI tool', {
        requestId,
        leadId,
        name: sanitizedName,
      })
    } else {
      // Create new lead
      updateFields.Status = 'New'
      const created = await airtableBase('Leads').create(updateFields)
      leadId = (created as any).id
      console.log('Created lead from VAPI tool', {
        requestId,
        leadId,
        name: sanitizedName,
      })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        leadId,
        name: sanitizedName,
      },
      requestId,
    })
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error creating/updating lead:', {
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
