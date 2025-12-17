/**
 * POST /api/onboarding
 * Stores onboarding form data
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAirtableReady } from '@/lib/airtable/utils'
import { airtableBase } from '@/lib/airtable/client'
import { z } from 'zod'
import { rateLimit, createRateLimitResponse } from '@/lib/security/rate-limit'
import { applySecurityHeaders } from '@/lib/security/headers'
import { sanitizeObject, sanitizeEmail } from '@/lib/security/sanitize'

export const dynamic = 'force-dynamic'

const onboardingSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional().or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  useCase: z.string().min(1, 'Use case is required'),
  teamSize: z.string().min(1, 'Team size is required'),
  expectedVolume: z.string().min(1, 'Expected volume is required'),
  notes: z.string().trim().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Apply rate limiting (strict for onboarding form)
  const rateLimitResult = await rateLimit(request, 'onboarding')
  if (!rateLimitResult.success) {
    return applySecurityHeaders(
      createRateLimitResponse(rateLimitResult.resetTime!)
    )
  }

  try {
    // Check if Airtable is configured (optional - can work without it)
    let airtableReady = false
    try {
      requireAirtableReady()
      airtableReady = true
    } catch {
      // Airtable not configured - we'll still accept the form but log it
    }

    const body = await request.json()

    // Sanitize input before validation
    const sanitizedBody = sanitizeObject(body)

    // Special handling for email
    if (sanitizedBody.email) {
      try {
        sanitizedBody.email = sanitizeEmail(sanitizedBody.email)
      } catch (error) {
        return applySecurityHeaders(
          NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              fieldErrors: { email: ['Invalid email format'] },
              requestId,
            },
            { status: 400 }
          )
        )
      }
    }

    const parseResult = onboardingSchema.safeParse(sanitizedBody)

    if (!parseResult.success) {
      const flattened = parseResult.error.flatten()
      return applySecurityHeaders(
        NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            fieldErrors: flattened.fieldErrors,
            requestId,
          },
          { status: 400 }
        )
      )
    }

    const data = parseResult.data

    // If Airtable is ready, store in both Onboarding and Leads tables
    if (airtableReady) {
      try {
        let onboardingRecordId: string | undefined
        let businessRecordId: string | undefined

        // 1. Try to create record in Onboarding table (primary storage)
        // If table doesn't exist yet, we'll skip it and just use Leads
        try {
          const onboardingRecord = await airtableBase('Onboarding').create({
            'Company Name': data.companyName,
            Email: data.email,
            Phone: data.phone || undefined,
            Industry: data.industry || '',
            'Use Case': data.useCase || '',
            'Team Size': data.teamSize || '',
            'Expected Volume': data.expectedVolume || '',
            'Onboarding Notes': data.notes || undefined,
            Status: 'New',
          })
          onboardingRecordId = onboardingRecord.id
          console.log('Created Onboarding record', { requestId, onboardingRecordId })
        } catch (onboardingError: any) {
          // If Onboarding table doesn't exist, that's okay - we'll use Leads only
          if (onboardingError?.statusCode === 404 || onboardingError?.message?.includes('Could not find table')) {
            console.log('Onboarding table not found - using Leads table only', { requestId })
          } else {
            console.warn('Error creating Onboarding record:', onboardingError)
          }
        }

        // 2. Create or find Business record
        try {
          // Check if business already exists
          const existingBusinesses = await airtableBase('Businesses')
            .select({
              filterByFormula: `{Name} = "${data.companyName.replace(/"/g, '\\"')}"`,
              maxRecords: 1,
            })
            .firstPage()

          if (existingBusinesses.length > 0) {
            businessRecordId = existingBusinesses[0].id
          } else {
            // Create new business record
            const businessRecord = await airtableBase('Businesses').create({
              Name: data.companyName,
              Timezone: 'America/New_York', // Default, can be updated later
              Email: data.email,
              Phone: data.phone || undefined,
              Active: true,
            })
            businessRecordId = businessRecord.id
            console.log('Created Business record', { requestId, businessRecordId })
          }
        } catch (businessError: any) {
          // If Businesses table doesn't exist, that's okay
          if (businessError?.statusCode === 404 || businessError?.message?.includes('Could not find table')) {
            console.log('Businesses table not found - skipping business creation', { requestId })
          } else {
            console.warn('Could not create/find business record:', businessError)
          }
        }

        // 2b. Upsert Users record for the onboarding email so the user is linked
        if (businessRecordId) {
          try {
            const existingUsers = await airtableBase('Users')
              .select({
                filterByFormula: `{Email} = "${data.email.replace(/"/g, '\\"')}"`,
                maxRecords: 1,
              })
              .firstPage()

            if (existingUsers.length > 0) {
              await airtableBase('Users').update(existingUsers[0].id, {
                Role: existingUsers[0].fields.Role || 'Owner',
                Business: [businessRecordId],
              })
              console.log('Linked existing user to business', {
                requestId,
                userId: existingUsers[0].id,
                businessRecordId,
              })
            } else {
              const createdUser = await airtableBase('Users').create({
                Email: data.email,
                Role: 'Owner',
                Business: [businessRecordId],
              })
              console.log('Created Users record from onboarding', {
                requestId,
                userId: createdUser.id,
                businessRecordId,
              })
            }
          } catch (usersError: any) {
            if (usersError?.statusCode === 404 || usersError?.message?.includes('Could not find table')) {
              console.warn('Users table not found - skipping user mapping', { requestId })
            } else {
              console.warn('Could not upsert Users record:', usersError)
            }
          }
        }

        // 3. Create record in Leads table (for dashboard visibility)
        // This is the primary table that should always exist
        try {
          await airtableBase('Leads').create({
            Name: data.companyName,
            Email: data.email,
            Phone: data.phone || undefined,
            Status: 'New',
            Industry: data.industry || undefined,
            'Use Case': data.useCase || undefined,
            'Team Size': data.teamSize || undefined,
            'Expected Volume': data.expectedVolume || undefined,
            'Onboarding Notes': data.notes || undefined,
            Business: businessRecordId ? [businessRecordId] : undefined,
          })
          console.log('Created Leads record', { requestId })
        } catch (leadsError: any) {
          // If Leads table doesn't exist, log but don't fail
          if (leadsError?.statusCode === 404 || leadsError?.message?.includes('Could not find table')) {
            console.warn('Leads table not found - data not stored', { requestId })
          } else {
            console.error('Error creating Leads record:', leadsError)
          }
        }

        console.log('Onboarding form submitted successfully', {
          requestId,
          companyName: data.companyName,
          email: data.email,
          onboardingRecordId,
          businessRecordId,
        })
      } catch (error) {
        console.error('Unexpected error storing onboarding data in Airtable:', error)
        // Continue even if Airtable write fails - form submission still succeeds
      }
    } else {
      // Log to console if Airtable not configured
      console.log('Onboarding form submitted (Airtable not configured)', {
        requestId,
        companyName: data.companyName,
        email: data.email,
        data,
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Thank you! We\'ll be in touch soon.',
      requestId,
    })
    
    return applySecurityHeaders(response)
  } catch (error) {
    console.error('Error processing onboarding form:', {
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

