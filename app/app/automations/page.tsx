/**
 * Lead Automations Page
 * CRUD rules stored in Airtable
 */

'use client'

import { useState, useEffect } from 'react'
import { TenantLinkCallout } from '../components/tenant-cta'

interface Automation {
  id: string
  name: string
  trigger: string
  conditions: any
  actions: any
  active: boolean
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [airtableConfigured, setAirtableConfigured] = useState(true)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'Lead Created',
    conditions: '',
    actions: '',
    active: true,
  })
useEffect(() => {
  async function load() {
    const res = await fetch('/api/automations')
    const json = await res.json()
    console.log('Automations API response:', json) // <- add this
    setAutomations(json.data ?? [])
  }
  load()
}, [])
  useEffect(() => {
    loadAutomations()
  }, [])

  async function loadAutomations() {
    try {
      const response = await fetch('/api/automations')
      if (response.status === 503) {
        const result = await response.json()
        if (result.error === 'Airtable not configured') {
          setAutomations([])
          setAirtableConfigured(false)
        }
      } else if (response.status === 403) {
        const result = await response.json()
        setTenantError(result?.error || 'User not linked to a business')
      } else if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAutomations(result.data)
          setAirtableConfigured(true)
        }
      }
    } catch (error) {
      console.error('Error loading automations:', error)
      setAutomations([])
      setAirtableConfigured(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await response.json()
      if (response.status === 403) {
        setTenantError(result?.error || 'User not linked to a business')
      } else if (result.success) {
        setShowForm(false)
        setFormData({
          name: '',
          trigger: 'Lead Created',
          conditions: '',
          actions: '',
          active: true,
        })
        loadAutomations()
      } else {
        alert('Failed to create automation')
      }
    } catch (error) {
      console.error('Error creating automation:', error)
      alert('Failed to create automation')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this automation?')) return
    try {
      const response = await fetch(`/api/automations?id=${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (response.status === 403) {
        setTenantError(result?.error || 'User not linked to a business')
      } else if (result.success) {
        loadAutomations()
      } else {
        alert('Failed to delete automation')
      }
    } catch (error) {
      console.error('Error deleting automation:', error)
      alert('Failed to delete automation')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (tenantError) {
    return <TenantLinkCallout message={tenantError} />
  }

  const hasData = automations.length > 0

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lead Automations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          disabled={!airtableConfigured && !showForm}
        >
          {showForm ? 'Cancel' : 'New Automation'}
        </button>
      </div>

      {!airtableConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-yellow-800">
                Connect Airtable to manage automations. The rule builder UI is ready, but saving is disabled until Airtable is configured.{' '}
                <a href="/setup" className="underline font-medium hover:text-yellow-900">
                  Go to setup →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
                disabled={!airtableConfigured}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Trigger</label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                disabled={!airtableConfigured}
              >
                <option>Lead Created</option>
                <option>Lead Status Changed</option>
                <option>Interaction Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Conditions (JSON)
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
                disabled={!airtableConfigured}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Actions (JSON)
              </label>
              <textarea
                value={formData.actions}
                onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
                required
                disabled={!airtableConfigured}
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300"
                  disabled={!airtableConfigured}
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={!airtableConfigured}
              className={`px-4 py-2 rounded-md ${
                airtableConfigured
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {airtableConfigured ? 'Create Automation' : 'Connect Airtable to Save'}
            </button>
            {!airtableConfigured && (
              <p className="text-sm text-gray-500 mt-2">
                Connect Airtable in the setup page to enable saving automations.
              </p>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Trigger
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hasData ? (
              automations.map((automation) => (
                <tr key={automation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {automation.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {automation.trigger}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {automation.active ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDelete(automation.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <p className="text-base font-light">No automations yet</p>
                    <p className="text-sm mt-2">
                      Connect Airtable to manage automations. Rule builder UI is ready.
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
          <a
            href="/app/automations"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2"
          >
            Automations
          </a>
          <a href="/app/interactions" className="text-gray-600 hover:text-gray-900">
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

