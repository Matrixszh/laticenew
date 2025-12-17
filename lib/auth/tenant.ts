import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { airtableBase } from '@/lib/airtable/client'

export class TenantError extends Error {
  status: number
  payload: any

  constructor(status: number, payload: any) {
    super(payload?.error || 'Tenant error')
    this.status = status
    this.payload = payload
  }
}

export async function getClerkUserEmail(): Promise<string> {
  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress

  if (!email) {
    throw new TenantError(401, { error: 'Unauthenticated: no email found' })
  }
  return email
}

export async function requireBusinessContext(): Promise<{
  businessId: string
  role: string
  userEmail: string
}> {
  const userEmail = await getClerkUserEmail()

  try {
    const users = await airtableBase('Users')
      .select({
        filterByFormula: `{Email} = "${userEmail.replace(/"/g, '\\"')}"`,
        maxRecords: 1,
      })
      .firstPage()

    if (!users || users.length === 0) {
      throw new TenantError(403, { error: 'User not linked to a business' })
    }

    const record = users[0]
    const businessId = Array.isArray(record.fields.Business)
      ? (record.fields.Business as string[])[0]
      : undefined
    const role = (record.fields.Role as string) || 'Staff'

    if (!businessId) {
      throw new TenantError(403, { error: 'User not linked to a business' })
    }

    return { businessId, role, userEmail }
  } catch (error: any) {
    if (error instanceof TenantError) {
      throw error
    }
    console.error('Error resolving tenant context', {
      userEmail,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new TenantError(500, { error: 'Failed to resolve tenant context' })
  }
}

export function requireRole(role: 'Owner' | 'Admin', currentRole: string) {
  const allowed = ['Admin', 'Owner']
  if (role === 'Owner' && currentRole !== 'Owner') {
    throw new TenantError(403, { error: 'Insufficient role' })
  }
  if (role === 'Admin' && !allowed.includes(currentRole)) {
    throw new TenantError(403, { error: 'Insufficient role' })
  }
}

export function handleTenantError(error: any, requestId?: string) {
  if (error instanceof TenantError) {
    const payload =
      error.payload && typeof error.payload === 'object'
        ? error.payload
        : { error: 'Tenant error' }
    return NextResponse.json(
      { success: false, ...payload, requestId },
      { status: error.status || 403 }
    )
  }
  return NextResponse.json({ success: false, error: 'Internal server error', requestId }, { status: 500 })
}
