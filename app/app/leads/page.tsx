/**
 * Leads Page (Admin Platform)
 * Shows leads from onboarding form and other sources
 * Enhanced with animations and better UI
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FadeIn from '../../components/FadeIn'
import { TenantLinkCallout } from '../components/tenant-cta'

interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  status?: string
  industry?: string
  useCase?: string
  teamSize?: string
  expectedVolume?: string
  onboardingNotes?: string
  created: string
  businessId?: string
  businessName?: string
  interactionCount?: number
  appointmentCount?: number
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState<string>('')

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    try {
      const response = await fetch('/api/leads')
      if (response.status === 503) {
        const data = await response.json()
        if (data.error === 'Airtable not configured') {
          setError('Airtable not configured')
        }
      } else if (response.status === 401) {
        const data = await response.json().catch(() => null)
        setTenantError(data?.error || 'Please sign in to view leads')
      } else if (response.status === 403) {
        const data = await response.json()
        setTenantError(data?.error || 'User not linked to a business')
      } else if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setLeads(result.data)
        }
      }
    } catch (err) {
      console.error('Error loading leads:', err)
      setError('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  async function updateLeadStatus(leadId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update local state
          setLeads((prev) =>
            prev.map((lead) => (lead.id === leadId ? { ...lead, status: newStatus } : lead))
          )
          setEditingStatus(null)
        }
      } else {
        alert('Failed to update lead status')
      }
    } catch (err) {
      console.error('Error updating lead status:', err)
      alert('Failed to update lead status')
    }
  }

  function startEditingStatus(leadId: string, currentStatus: string) {
    setEditingStatus(leadId)
    setStatusValue(currentStatus || 'New')
  }

  function cancelEditing() {
    setEditingStatus(null)
    setStatusValue('')
  }

  function saveStatus(leadId: string) {
    updateLeadStatus(leadId, statusValue)
  }

  if (tenantError) {
    return <TenantLinkCallout message={tenantError} />
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600 font-light">Loading leads...</p>
      </div>
    )
  }

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">Leads</h1>
          <p className="text-gray-600 font-light">View leads from onboarding forms and other sources</p>
        </div>
      </FadeIn>

      {error && (
        <FadeIn delay={100}>
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              {error === 'Airtable not configured' ? (
                <>
                  Connect Airtable to see leads. Onboarding form data will appear here once configured.{' '}
                  <Link href="/setup" className="underline font-medium hover:text-yellow-900 transition-colors">
                    Go to setup →
                  </Link>
                </>
              ) : (
                error
              )}
            </p>
          </div>
        </FadeIn>
      )}

      {!error && (
        <FadeIn delay={200}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Links
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Use Case
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leads.length > 0 ? (
                    leads.map((lead, index) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{lead.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStatus === lead.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={statusValue}
                                onChange={(e) => setStatusValue(e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                autoFocus
                              >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Closed">Closed</option>
                                <option value="Lost">Lost</option>
                              </select>
                              <button
                                onClick={() => saveStatus(lead.id)}
                                className="text-green-600 hover:text-green-800 text-xs"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex px-3 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                                lead.status === 'New'
                                  ? 'bg-blue-100 text-blue-800'
                                  : lead.status === 'Contacted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : lead.status === 'Qualified'
                                  ? 'bg-green-100 text-green-800'
                                  : lead.status === 'Closed'
                                  ? 'bg-green-200 text-green-900'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                              onClick={() => startEditingStatus(lead.id, lead.status || 'New')}
                              title="Click to edit status"
                            >
                              {lead.status || 'New'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {lead.businessName || (lead.businessId ? 'Linked' : '-')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2 text-xs text-gray-500">
                            {lead.interactionCount !== undefined && (
                              <span title="Interactions">{lead.interactionCount} interactions</span>
                            )}
                            {lead.appointmentCount !== undefined && (
                              <span title="Appointments">{lead.appointmentCount} appointments</span>
                            )}
                            {(!lead.interactionCount && !lead.appointmentCount) && '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{lead.industry || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{lead.useCase || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(lead.created).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
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
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <p className="text-base font-light">No leads yet</p>
                          <p className="text-sm mt-2">
                            Leads from the onboarding form will appear here once Airtable is configured.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <nav className="flex space-x-6">
          <Link href="/app/kpis" className="text-gray-600 hover:text-gray-900 transition-colors">
            KPIs
          </Link>
          <Link
            href="/app/leads"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2 transition-colors"
          >
            Leads
          </Link>
          <Link href="/app/automations" className="text-gray-600 hover:text-gray-900 transition-colors">
            Automations
          </Link>
          <Link href="/app/interactions" className="text-gray-600 hover:text-gray-900 transition-colors">
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
