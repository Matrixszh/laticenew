/**
 * Setup Wizard Page
 * Public page that shows configuration checklist and instructions
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ReadinessStatus {
  authReady: boolean
  airtableReady: boolean
  setupReady: boolean
  missingAuth: string[]
  missingAirtable: string[]
  schemaOk: boolean | null
  schemaErrors: string[]
}

export default function SetupPage() {
  const [status, setStatus] = useState<ReadinessStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setStatus({
          authReady: data.authReady ?? false,
          airtableReady: data.airtableReady ?? false,
          setupReady: data.setupReady ?? false,
          missingAuth: data.missingAuth ?? [],
          missingAirtable: data.missingAirtable ?? [],
          schemaOk: data.schemaOk ?? null,
          schemaErrors: data.schemaErrors ?? [],
        })
      } catch (error) {
        console.error('Failed to fetch readiness status:', error)
        setStatus({
          authReady: false,
          airtableReady: false,
          setupReady: false,
          missingAuth: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY'],
          missingAirtable: ['AIRTABLE_TOKEN', 'AIRTABLE_BASE_ID'],
          schemaOk: null,
          schemaErrors: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading setup status...</div>
      </div>
    )
  }

  const authConfigured = status?.authReady ?? false
  const airtableConfigured = status?.airtableReady ?? false
  const allConfigured = status?.setupReady ?? false

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Required</h1>
          <p className="text-gray-600 mb-8">
            Configure your environment variables to enable the Lattice AI Platform.
          </p>

          {/* Checklist */}
          <div className="space-y-6 mb-8">
            {/* Auth Section */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Authentication (Clerk)</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    authConfigured
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {authConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>

              {!authConfigured && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Required environment variables:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                      {status?.missingAuth.map((varName) => (
                        <li key={varName} className="font-mono">
                          {varName}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      What this unlocks:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 mb-4">
                      <li>Access to protected dashboard pages (/app/*)</li>
                      <li>User authentication and session management</li>
                      <li>Secure API route protection</li>
                    </ul>
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Get your Clerk keys:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Sign up at{' '}
                        <a
                          href="https://clerk.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          clerk.com
                        </a>
                      </li>
                      <li>Create a new application</li>
                      <li>Copy your Publishable Key (starts with <code className="bg-blue-100 px-1 rounded">pk_</code>) and Secret Key (starts with <code className="bg-blue-100 px-1 rounded">sk_</code>)</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Airtable Section */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Airtable</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    airtableConfigured
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {airtableConfigured ? 'Configured' : 'Missing'}
                </span>
              </div>

              {!airtableConfigured && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-2">Required environment variables:</p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                      {status?.missingAirtable.map((varName) => (
                        <li key={varName} className="font-mono">
                          {varName}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      What this unlocks:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 mb-4">
                      <li>Leads management (view onboarding form submissions)</li>
                      <li>Interactions tracking (calls, SMS, emails)</li>
                      <li>Appointments calendar</li>
                      <li>KPIs dashboard (incoming calls, leads contacted, leads closed)</li>
                      <li>Automation rules management</li>
                      <li>Prompt overrides configuration</li>
                    </ul>
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Get your Airtable credentials:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Go to{' '}
                        <a
                          href="https://airtable.com/create/tokens"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          airtable.com/create/tokens
                        </a>
                      </li>
                      <li>Create a Personal Access Token (starts with <code className="bg-blue-100 px-1 rounded">pat</code>)</li>
                      <li>Grant scopes: <code className="bg-blue-100 px-1 rounded">data.records:read</code>, <code className="bg-blue-100 px-1 rounded">data.records:write</code>, <code className="bg-blue-100 px-1 rounded">schema.bases:read</code></li>
                      <li>Copy your Base ID from your Airtable base URL (starts with <code className="bg-blue-100 px-1 rounded">app</code>)</li>
                    </ol>
                  </div>
                </div>
              )}

              {airtableConfigured && (
                <div className="space-y-4">
                  {status?.schemaOk === false && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                      <p className="text-sm font-medium text-yellow-900 mb-2">
                        ⚠️ Schema Drift Detected
                      </p>
                      <p className="text-sm text-yellow-800 mb-3">
                        Your Airtable base is missing fields or has incorrect field types. This will cause write operations to fail.
                      </p>
                      <div className="mb-3">
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          Run schema drift report:
                        </p>
                        <code className="block text-xs bg-yellow-100 text-yellow-900 p-2 rounded">
                          npm run airtable:drift
                        </code>
                      </div>
                      {status.schemaErrors && status.schemaErrors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-yellow-900 mb-1">
                            Top issues detected:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                            {status.schemaErrors.slice(0, 3).map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(() => {
                        // Find top 3 critical missing fields
                        const criticalFields: string[] = []
                        if (status.schemaErrors) {
                          for (const error of status.schemaErrors) {
                            if (error.includes('Timezone') && !criticalFields.includes('Timezone')) {
                              criticalFields.push('Timezone (Businesses table)')
                            }
                            if (error.includes('Transcript') && !criticalFields.includes('Transcript')) {
                              criticalFields.push('Transcript (Interactions table)')
                            }
                            if ((error.includes('Start UTC') || error.includes('End UTC')) && !criticalFields.some(f => f.includes('Start UTC'))) {
                              criticalFields.push('Start UTC / End UTC (Appointments table)')
                            }
                            if (criticalFields.length >= 3) break
                          }
                        }
                        return criticalFields.length > 0 ? (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-yellow-900 mb-1">
                              Critical missing fields:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                              {criticalFields.map((field, idx) => (
                                <li key={idx}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                  {status?.schemaOk === true && (
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="text-sm font-medium text-green-900">
                        ✅ Schema is complete! All tables and fields match the expected schema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t pt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Local Development Setup
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">1. Copy environment template:</p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    cp .env.example .env.local
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">2. Edit .env.local and add your keys:</p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded whitespace-pre">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
AIRTABLE_TOKEN=pat...
AIRTABLE_BASE_ID=app...`}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">3. Restart your dev server:</p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    npm run dev
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vapi Server URL (Important)</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <p className="text-sm text-orange-900">
                  Vapi&apos;s <span className="font-semibold">Server URL</span> must point to your webhook endpoint (POST),
                  <span className="font-semibold">not</span> the homepage.
                </p>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Use this format:</p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded whitespace-pre">
{`# Example (Vercel production)
PUBLIC_BASE_URL=https://your-project-name.vercel.app

Vapi Server URL:
https://your-project-name.vercel.app/api/vapi/webhooks/events`}
                  </code>
                </div>
                <p className="text-xs text-orange-900">
                  If Server URL is set to <code className="bg-orange-100 px-1 rounded">/</code> or your homepage,
                  Vapi will receive <code className="bg-orange-100 px-1 rounded">405 Method Not Allowed</code> for POST
                  and calls may fail with <code className="bg-orange-100 px-1 rounded">assistant-request-returned-error</code>.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vercel Deployment Setup</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">1. Add environment variables in Vercel:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                    <li>Go to your project settings → Environment Variables</li>
                    <li>Add each variable (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, etc.)</li>
                    <li>Select the environments (Production, Preview, Development)</li>
                    <li>Save and redeploy</li>
                  </ol>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">2. Sync env vars to local (optional):</p>
                  <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                    vercel env pull .env.local
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          {allConfigured && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    ✓ Setup complete! All required environment variables are configured.
                  </p>
                </div>
                <Link
                  href="/app"
                  className="ml-4 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {!allConfigured && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Configure the missing environment variables above and refresh this page to check status.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

