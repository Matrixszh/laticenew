/**
 * Calendar Page
 * Reads Appointments table
 * Form to edit PromptOverrides
 */

'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { formatInBusinessTimezone } from '@/lib/utils/timezone'
import { TenantLinkCallout } from '../components/tenant-cta'

interface Appointment {
  id: string
  startUtc: string
  endUtc: string
  status: string
  notes?: string
  businessId?: string
}

interface PromptOverride {
  id: string
  key: string
  value: string
  active: boolean
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [promptOverrides, setPromptOverrides] = useState<PromptOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [showOverrideForm, setShowOverrideForm] = useState(false)
  const [businessTimezone, setBusinessTimezone] = useState<string>('America/New_York')
  const [overrideForm, setOverrideForm] = useState({
    key: '',
    value: '',
    active: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const response = await fetch('/api/calendar-data')
      if (response.status === 503) {
        const result = await response.json()
        if (result.error === 'Airtable not configured') {
          setAppointments([])
          setPromptOverrides([])
        }
      } else if (response.status === 403) {
        const result = await response.json()
        setTenantError(result?.error || 'User not linked to a business')
      } else if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAppointments(result.data.appointments)
          setPromptOverrides(result.data.promptOverrides)
          if (result.data.businessTimezone) {
            setBusinessTimezone(result.data.businessTimezone)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setAppointments([])
      setPromptOverrides([])
    } finally {
      setLoading(false)
    }
  }

  async function handleOverrideSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/calendar-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create-override',
          data: overrideForm,
        }),
      })
      const result = await response.json()
      if (response.status === 403) {
        setTenantError(result?.error || 'User not linked to a business')
      } else if (result.success) {
        setShowOverrideForm(false)
        setOverrideForm({ key: '', value: '', active: true })
        loadData()
      } else {
        alert('Failed to create prompt override')
      }
    } catch (error) {
      console.error('Error creating prompt override:', error)
      alert('Failed to create prompt override')
    }
  }

  async function handleOverrideDelete(id: string) {
    if (!confirm('Are you sure you want to delete this prompt override?')) return
    try {
      const response = await fetch('/api/calendar-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'delete-override',
          data: { id },
        }),
      })
      const result = await response.json()
      if (response.status === 403) {
        setTenantError(result?.error || 'User not linked to a business')
      } else if (result.success) {
        loadData()
      } else {
        alert('Failed to delete prompt override')
      }
    } catch (error) {
      console.error('Error deleting prompt override:', error)
      alert('Failed to delete prompt override')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (tenantError) {
    return <TenantLinkCallout message={tenantError} />
  }

  const hasAppointments = appointments.length > 0
  const hasOverrides = promptOverrides.length > 0

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Calendar</h1>

      {!hasAppointments && !hasOverrides && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">
                Connect Airtable to load appointments and manage prompt overrides.{' '}
                <a href="/setup" className="underline font-medium hover:text-yellow-900">
                  Go to setup →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointments</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatInBusinessTimezone(appointment.startUtc, businessTimezone)} -{' '}
                        {formatInBusinessTimezone(appointment.endUtc, businessTimezone, 'h:mm a')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Status: <span className="font-medium">{appointment.status}</span>
                      </p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <div className="p-8 text-center">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {hasAppointments ? 'No appointments' : 'Connect Airtable to load appointments'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Prompt Overrides</h2>
            <button
              onClick={() => setShowOverrideForm(!showOverrideForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
            >
              {showOverrideForm ? 'Cancel' : 'New Override'}
            </button>
          </div>

          {showOverrideForm && (
            <form onSubmit={handleOverrideSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Key</label>
                  <input
                    type="text"
                    value={overrideForm.key}
                    onChange={(e) => setOverrideForm({ ...overrideForm, key: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  <textarea
                    value={overrideForm.value}
                    onChange={(e) => setOverrideForm({ ...overrideForm, value: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={overrideForm.active}
                      onChange={(e) =>
                        setOverrideForm({ ...overrideForm, active: e.target.checked })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Override
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {promptOverrides.map((override) => (
                <div key={override.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{override.key}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {override.active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {override.value}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOverrideDelete(override.id)}
                      className="ml-4 text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {promptOverrides.length === 0 && (
                <div className="p-8 text-center">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    {hasOverrides ? 'No prompt overrides' : 'Connect Airtable to manage prompt overrides'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <nav className="flex space-x-4">
          <a href="/app/kpis" className="text-gray-600 hover:text-gray-900">
            KPIs
          </a>
          <a href="/app/automations" className="text-gray-600 hover:text-gray-900">
            Automations
          </a>
          <a href="/app/interactions" className="text-gray-600 hover:text-gray-900">
            Interactions
          </a>
          <a
            href="/app/calendar"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2"
          >
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

