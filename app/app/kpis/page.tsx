/**
 * KPIs Dashboard
 * Shows: Incoming Calls, Leads Contacted, Leads Closed
 * Enhanced with date range filtering and correct calculations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getDefaultDateRange,
  getTodayDateRange,
  getThisWeekDateRange,
  getThisMonthDateRange,
  type DateRange,
} from '@/lib/utils/kpi-calculations'
import { TenantLinkCallout } from '../components/tenant-cta'

interface KPIData {
  incomingCalls: number
  leadsContacted: number
  leadsClosed: number
  leadsNew: number
  conversionRate: number
}

export default function KPIsPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantError, setTenantError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const loadKPIs = async () => {
    setLoading(true)
    setError(null)
    setTenantError(null) // Reset tenant error too
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
      
      console.log('Fetching KPIs with params:', params.toString())
      const response = await fetch(`/api/kpis?${params}`)
      
      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)
      
      if (response.status === 503) {
        setError('Airtable not configured')
      } else if (response.status === 401) {
        setTenantError(result?.error || 'Please sign in to view KPIs')
      } else if (response.status === 403) {
        setTenantError(result?.error || 'User not linked to a business')
      } else if (response.ok && result.success) {
        console.log('Setting KPIs:', result.data)
        setKpis(result.data)
      } else {
        console.error('API returned error:', result)
        setError(result.error || 'Failed to load KPIs')
      }
    } catch (err) {
      console.error('Error loading KPIs:', err)
      setError('Failed to load KPIs')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadKPIs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate])
  
  

  function handleDateRangeChange(range: 'today' | 'week' | 'month' | 'custom') {
    switch (range) {
      case 'today':
        setDateRange(getTodayDateRange())
        break
      case 'week':
        setDateRange(getThisWeekDateRange())
        break
      case 'month':
        setDateRange(getThisMonthDateRange())
        break
      case 'custom':
        // Custom date picker would go here
        break
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600 font-light">Loading KPIs...</p>
      </div>
    )
  }

  if (tenantError) {
    return <TenantLinkCallout message={tenantError} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2 tracking-tight">KPIs Dashboard</h1>
        <p className="text-gray-600 font-light">Monitor your key performance indicators</p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleDateRangeChange('today')}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange.startDate === getTodayDateRange().startDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateRangeChange('week')}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange.startDate === getThisWeekDateRange().startDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-1 text-sm rounded-md ${
                dateRange.startDate === getThisMonthDateRange().startDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-1 text-sm rounded-md border border-gray-300"
            />
            <span className="px-2 text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-1 text-sm rounded-md border border-gray-300"
            />
          </div>
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
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Airtable Not Connected</h3>
              <p className="text-sm text-yellow-700 mb-3">
                {error === 'Airtable not configured' ? (
                  <>
                    No data yet. Connect Airtable to see KPIs.
                  </>
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

      {error ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Incoming Calls</h2>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-400 mb-2">—</p>
            <p className="text-sm text-gray-400 font-light">Connect Airtable to see data</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leads Contacted</h2>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-400 mb-2">—</p>
            <p className="text-sm text-gray-400 font-light">Connect Airtable to see data</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 opacity-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leads Closed</h2>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-400 mb-2">—</p>
            <p className="text-sm text-gray-400 font-light">Connect Airtable to see data</p>
          </div>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Incoming Calls</h2>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-900 mb-2">{kpis.incomingCalls}</p>
            <p className="text-sm text-gray-500 font-light">Total inbound calls</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leads Contacted</h2>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-900 mb-2">{kpis.leadsContacted}</p>
            <p className="text-sm text-gray-500 font-light">Active leads</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leads Closed</h2>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-5xl font-semibold text-gray-900 mb-2">{kpis.leadsClosed}</p>
            <p className="text-sm text-gray-500 font-light">Successfully closed ({kpis.conversionRate}% conversion)</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <nav className="flex space-x-6">
          <Link
            href="/app/kpis"
            className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2 transition-colors"
          >
            KPIs
          </Link>
          <Link href="/app/leads" className="text-gray-600 hover:text-gray-900 transition-colors">
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
