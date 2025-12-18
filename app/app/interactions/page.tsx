'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Interaction {
  id: string
  name?: string
  type: string
  transcript: string
  duration?: number
  direction?: string
  status?: string
  outcome?: string
  startUtc?: string
  endUtc?: string
  callId?: string
  fromNumber?: string
  toNumber?: string
  leadId?: string
  businessId?: string
  leadName?: string
  businessName?: string
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTranscript, setSelectedTranscript] = useState<Interaction | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const loadInteractions = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('=== Loading Interactions ===')
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      
      const response = await fetch(`/api/interactions-list?${params}`)
      console.log('Response status:', response.status)
      
      const result = await response.json()
      console.log('API Response:', result)
      
      if (response.status === 503) {
        setError('Airtable not configured')
      } else if (response.status === 401) {
        setError('Please sign in to view interactions')
      } else if (response.status === 403) {
        setError(result.error || 'User not linked to a business')
      } else if (response.ok && result.success) {
        console.log('✅ Setting interactions:', result.data.length)
        setInteractions(result.data)
      } else {
        console.error('❌ API error:', result)
        setError(result.error || 'Failed to load interactions')
      }
    } catch (err) {
      console.error('❌ Error loading interactions:', err)
      setError('Failed to load interactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInteractions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate])

  const getTranscriptExcerpt = (transcript: string) => {
    if (!transcript) return 'No transcript'
    const words = transcript.split(' ').slice(0, 10)
    return words.join(' ') + (transcript.split(' ').length > 10 ? '...' : '')
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600 font-light">Loading interactions...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Interactions</h1>
        <p className="text-gray-600 font-light">View call transcripts and interaction history</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
          <button
            onClick={loadInteractions}
            className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                {error === 'Airtable not configured' ? 'Airtable Not Connected' : 'Access Error'}
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                {error === 'Airtable not configured' ? (
                  <>Connect Airtable to see interactions. The transcript viewer is ready once data is available.</>
                ) : (
                  error
                )}
              </p>
              <Link
                href="/setup"
                className="inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
              >
                Go to setup →
              </Link>
            </div>
          </div>
        </div>
      )}

      {!error && interactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">No interactions yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Connect Airtable to load interactions. Columns and transcript viewer are ready.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transcript
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interactions.map((interaction) => (
                  <tr key={interaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interaction.name || `${interaction.type} - ${interaction.callId?.slice(0, 8) || interaction.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interaction.leadName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interaction.businessName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {interaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {interaction.direction || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        interaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                        interaction.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {interaction.status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {interaction.duration ? `${interaction.duration}s` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div 
                        className="truncate cursor-pointer hover:text-blue-600" 
                        onClick={() => setSelectedTranscript(interaction)}
                      >
                        {getTranscriptExcerpt(interaction.transcript)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {interaction.startUtc 
                        ? new Date(interaction.startUtc).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Transcript</h2>
                <button
                  onClick={() => setSelectedTranscript(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                <p><strong>Type:</strong> {selectedTranscript.type}</p>
                <p><strong>Lead:</strong> {selectedTranscript.leadName || 'N/A'}</p>
                <p><strong>Date:</strong> {selectedTranscript.startUtc ? new Date(selectedTranscript.startUtc).toLocaleString() : 'N/A'}</p>
                <p><strong>Duration:</strong> {selectedTranscript.duration ? `${selectedTranscript.duration}s` : 'N/A'}</p>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{selectedTranscript.transcript}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <nav className="flex space-x-6">
          <Link href="/app/kpis" className="text-gray-600 hover:text-gray-900 transition-colors">
            KPIs
          </Link>
          <Link href="/app/leads" className="text-gray-600 hover:text-gray-900 transition-colors">
            Leads
          </Link>
          <Link href="/app/automations" className="text-gray-600 hover:text-gray-900 transition-colors">
            Automations
          </Link>
          <Link
            href="/app/interactions"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2 transition-colors"
          >
            Interactions
          </Link>
          <Link href="/app/calendar" className="text-gray-600 hover:text-gray-900 transition-colors">
            Calendar
          </Link>
        </nav>
      </div>
    </div>
  )
}
