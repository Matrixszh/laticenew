/**
 * Rate Limiting Utilities
 * Provides rate limiting for API routes to prevent abuse
 */

import { RateLimiterMemory } from 'rate-limiter-flexible'
import { NextRequest, NextResponse } from 'next/server'

// Different rate limiters for different endpoint types
const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
})

const writeLimiter = new RateLimiterMemory({
  points: 20, // Fewer requests for write operations
  duration: 60,
})

const webhookLimiter = new RateLimiterMemory({
  points: 200, // More lenient for webhooks
  duration: 60,
})

const onboardingLimiter = new RateLimiterMemory({
  points: 5, // Very strict for onboarding form
  duration: 60,
})

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  // For authenticated requests, use user ID if available
  // This would require Clerk integration - for now, use IP
  return ip
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  request: NextRequest,
  type: 'api' | 'write' | 'webhook' | 'onboarding' = 'api'
): Promise<{ success: boolean; remaining?: number; resetTime?: Date }> {
  const limiter =
    type === 'write'
      ? writeLimiter
      : type === 'webhook'
        ? webhookLimiter
        : type === 'onboarding'
          ? onboardingLimiter
          : apiLimiter

  const clientId = getClientId(request)

  try {
    const result = await limiter.consume(clientId)
    return {
      success: true,
      remaining: result.remainingPoints,
      resetTime: new Date(Date.now() + result.msBeforeNext),
    }
  } catch (error: any) {
    return {
      success: false,
      remaining: 0,
      resetTime: new Date(Date.now() + error.msBeforeNext),
    }
  }
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(resetTime: Date): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((resetTime.getTime() - Date.now()) / 1000)),
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(resetTime.getTime() / 1000)),
      },
    }
  )
}
