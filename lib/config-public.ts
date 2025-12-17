/**
 * Client-safe configuration (no secrets exposed)
 * Safe to import in client components
 */

/**
 * Check if authentication is configured (client-safe check)
 * Only checks for publishable key (secret key is server-only)
 */
export function isAuthReady(): boolean {
  return !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
}

/**
 * Check if Airtable is configured (client-safe check)
 * Note: We can't check server secrets from client, so this is an approximation
 * The server will return 503 if Airtable is not configured
 */
export function isAirtableReady(): boolean {
  // Client can't check server secrets, so we'll rely on API responses
  // This is mainly for UI display purposes
  return true // Will be determined by actual API calls
}

/**
 * Get readiness status from server (via API)
 * Use this in client components to check actual readiness
 */
export async function getReadinessStatus(): Promise<{
  authReady: boolean
  airtableReady: boolean
  setupReady: boolean
}> {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    return {
      authReady: data.authReady ?? false,
      airtableReady: data.airtableReady ?? false,
      setupReady: data.setupReady ?? false,
    }
  } catch {
    return {
      authReady: false,
      airtableReady: false,
      setupReady: false,
    }
  }
}

