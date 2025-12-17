import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAuthReady } from './lib/config'

const isProtectedRoute = createRouteMatcher(['/app(.*)'])
const isPublicRoute = createRouteMatcher(['/', '/setup', '/onboarding', '/industries', '/pricing', '/api/health'])

// Check if auth is ready and keys are valid (not placeholder values)
function isValidAuthReady(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const secretKey = process.env.CLERK_SECRET_KEY
  
  return !!(
    publishableKey &&
    secretKey &&
    !publishableKey.includes('your_') &&
    !publishableKey.includes('placeholder') &&
    !secretKey.includes('your_') &&
    !secretKey.includes('placeholder') &&
    publishableKey.startsWith('pk_') &&
    secretKey.startsWith('sk_')
  )
}

// Only use Clerk middleware if auth is ready with valid keys
const middleware = isValidAuthReady()
  ? clerkMiddleware((auth, req) => {
      // Allow public routes
      if (isPublicRoute(req)) {
        return NextResponse.next()
      }

      // Protect /app routes
      if (isProtectedRoute(req)) {
        auth().protect()
      }

      return NextResponse.next()
    })
  : (req: any) => {
      // If auth is not configured, redirect /app routes to /setup
      if (isProtectedRoute(req)) {
        const url = req.nextUrl.clone()
        url.pathname = '/setup'
        return NextResponse.redirect(url)
      }

      // Allow public routes
      return NextResponse.next()
    }

export default middleware

export const config = {
  matcher: [
    // Protect app + api routes; allow public routes via handlers above
    '/app/:path*',
    '/api/:path*',
    '/setup',
    '/onboarding',
    '/industries',
    '/pricing',
    '/',
    '/api/health',
  ],
}

