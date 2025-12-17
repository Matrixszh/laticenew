/**
 * Server-only configuration and readiness checks
 * DO NOT import this in client components - use lib/config-public.ts instead
 */

/**
 * Check if authentication (Clerk) is configured
 */
export function isAuthReady(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  )
}

/**
 * Check if Airtable is configured
 */
export function isAirtableReady(): boolean {
  return !!(
    process.env.AIRTABLE_TOKEN &&
    process.env.AIRTABLE_BASE_ID
  )
}

/**
 * Check if full setup is complete (both auth and Airtable)
 */
export function isSetupReady(): boolean {
  return isAuthReady() && isAirtableReady()
}

/**
 * Get missing environment variables for auth
 */
export function getMissingAuthVars(): string[] {
  const missing: string[] = []
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    missing.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')
  }
  if (!process.env.CLERK_SECRET_KEY) {
    missing.push('CLERK_SECRET_KEY')
  }
  return missing
}

/**
 * Get missing environment variables for Airtable
 */
export function getMissingAirtableVars(): string[] {
  const missing: string[] = []
  if (!process.env.AIRTABLE_TOKEN) {
    missing.push('AIRTABLE_TOKEN')
  }
  if (!process.env.AIRTABLE_BASE_ID) {
    missing.push('AIRTABLE_BASE_ID')
  }
  return missing
}

