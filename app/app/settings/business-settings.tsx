'use client'

import { useEffect, useState } from 'react'
import { TenantLinkCallout } from '../components/tenant-cta'

type BusinessData = {
  name: string
  timezone: string
  vapiNumber: string
  humanHandoverNumber: string
  handoverEnabled: boolean
  hoursJson: string
  role?: string
}

const initialState: BusinessData = {
  name: '',
  timezone: '',
  vapiNumber: '',
  humanHandoverNumber: '',
  handoverEnabled: false,
  hoursJson: '',
  role: undefined,
}

export function BusinessSettingsCard() {
  const [data, setData] = useState<BusinessData>(initialState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canEdit = data.role === 'Owner' || data.role === 'Admin'

  useEffect(() => {
    let active = true
    const fetchBusiness = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/business', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error(json.error || 'User not linked to a business')
          }
          throw new Error(json.error || 'Failed to load business')
        }
        if (active) {
          setData(json.data)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load business')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }
    fetchBusiness()
    return () => {
      active = false
    }
  }, [])

  const onChange = (field: keyof BusinessData, value: string | boolean) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          timezone: data.timezone,
          vapiNumber: data.vapiNumber,
          humanHandoverNumber: data.humanHandoverNumber,
          handoverEnabled: data.handoverEnabled,
          hoursJson: data.hoursJson,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save business settings')
      }
      setSuccess('Business settings saved')
      setData((prev) => ({ ...prev, ...json.data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save business settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Loading business settings...</p>
      </div>
    )
  }

  if (error && error.toLowerCase().includes('not linked to a business')) {
    return <TenantLinkCallout message={error} />
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Business Settings</h2>
          <p className="text-sm text-gray-500">Manage tenant-level details</p>
          {!canEdit && (
            <p className="text-sm text-amber-600 mt-2">
              You need Owner or Admin role to edit these fields.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canEdit || saving}
          className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm ${
            !canEdit || saving
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            disabled={!canEdit}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <input
            type="text"
            value={data.timezone}
            onChange={(e) => onChange('timezone', e.target.value)}
            disabled={!canEdit}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="e.g., America/New_York"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vapi Number (E.164)</label>
            <input
              type="tel"
              value={data.vapiNumber}
              onChange={(e) => onChange('vapiNumber', e.target.value)}
              disabled={!canEdit}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="+14155552671"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Human Handover Number (E.164)</label>
            <input
              type="tel"
              value={data.humanHandoverNumber}
              onChange={(e) => onChange('humanHandoverNumber', e.target.value)}
              disabled={!canEdit}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="+14155552671"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="handoverEnabled"
            type="checkbox"
            checked={data.handoverEnabled}
            onChange={(e) => onChange('handoverEnabled', e.target.checked)}
            disabled={!canEdit}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="handoverEnabled" className="text-sm text-gray-700">
            Enable human handover
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hours JSON</label>
          <textarea
            value={data.hoursJson}
            onChange={(e) => onChange('hoursJson', e.target.value)}
            disabled={!canEdit}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            placeholder='e.g., { "mon": [["09:00","17:00"]] }'
          />
        </div>
      </div>
    </div>
  )
}
