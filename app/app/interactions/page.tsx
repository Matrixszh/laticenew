/**
 * Interactions Table
 * Displays interactions with transcript link or excerpt
 * Includes CSV export
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { TenantLinkCallout } from '../components/tenant-cta'

interface Interaction {
  id: string
  type: string
  transcript: string
  duration?: number
  direction?: string
  status?: string
  created: string
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    }
  })

  const loadInteractions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      const response = await fetch(`/api/interactions-list?${params}`)
      if (response.status === 503) {
        const result = await response.json()
        if (result.error === 'Airtable not configured') {
          setInteractions([])
        }
      } else if (response.status === 403) {
        const result = await response.json()
        setTenantError(result?.error || 'User not linked to a business')
      } else if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setInteractions(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading interactions:', error)
      setInteractions([])
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    loadInteractions()
  }, [loadInteractions])

  function exportCSV() {
    const headers = ['ID', 'Type', 'Direction', 'Status', 'Duration', 'Transcript', 'Created']
    const rows = interactions.map((i) => [
      i.id,
      i.type,
      i.direction || '',
      i.status || '',
      i.duration?.toString() || '',
      i.transcript.replace(/\n/g, ' ').substring(0, 100),
      i.created,
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
      '\n'
    )

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interactions-${new Date().toISOString()}.csv`
    a.click()
  }

  function getTranscriptExcerpt(transcript: string, maxLength: number = 100): string {
    if (transcript.length <= maxLength) return transcript
    return transcript.substring(0, maxLength) + '...'
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (tenantError) {
    return <TenantLinkCallout message={tenantError} />
  }

  const hasData = interactions.length > 0

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Interactions</h1>
          {hasData && (
            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Export CSV
            </button>
          )}
        </div>
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-1 text-sm rounded-md border border-gray-300"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-1 text-sm rounded-md border border-gray-300"
            />
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">
                Connect Airtable to see interactions. The transcript viewer is ready once data is available.{' '}
                <a href="/setup" className="underline font-medium hover:text-yellow-900">
                  Go to setup →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Direction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transcript
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hasData ? (
              interactions.map((interaction) => (
                <tr key={interaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {interaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {interaction.direction || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {interaction.status || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {interaction.duration ? `${interaction.duration}s` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <details>
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        {getTranscriptExcerpt(interaction.transcript)}
                      </summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs whitespace-pre-wrap">
                        {interaction.transcript}
                      </div>
                    </details>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(interaction.created).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-base font-light">No interactions yet</p>
                    <p className="text-sm mt-2">
                      Connect Airtable to load interactions. Columns and transcript viewer are ready.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <nav className="flex space-x-4">
          <a href="/app/kpis" className="text-gray-600 hover:text-gray-900">
            KPIs
          </a>
          <a href="/app/automations" className="text-gray-600 hover:text-gray-900">
            Automations
          </a>
          <a
            href="/app/interactions"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2"
          >
            Interactions
          </a>
          <a href="/app/calendar" className="text-gray-600 hover:text-gray-900">
            Calendar
          </a>
          <a href="/app/leads" className="text-gray-600 hover:text-gray-900">
            Leads
          </a>
        </nav>
      </div>
    </div>
  )
}

